import { Pool, QueryResult } from 'pg';
import { Project, KeywordRow, CheckSession, CheckSessionWithStats, Reference } from './types';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize tables
async function initializeTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        brand_name TEXT,
        brand_domain TEXT,
        location_code TEXT,
        language_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS check_sessions (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT,
        location_code TEXT,
        language_code TEXT,
        keyword_count INTEGER DEFAULT 0,
        aio_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS keyword_results (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        session_id INTEGER NOT NULL REFERENCES check_sessions(id) ON DELETE CASCADE,
        keyword TEXT NOT NULL,
        has_ai_overview INTEGER DEFAULT 0,
        raw_api_result TEXT,
        aio_markdown TEXT,
        aio_references TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_project ON check_sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_keyword_results_project ON keyword_results(project_id);
      CREATE INDEX IF NOT EXISTS idx_keyword_results_session ON keyword_results(session_id);
      CREATE INDEX IF NOT EXISTS idx_keyword_results_keyword ON keyword_results(keyword);
    `);
  } finally {
    client.release();
  }
}

// Initialize on module load
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    console.log('[DB] Initializing PostgreSQL connection...');
    console.log('[DB] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    try {
      await initializeTables();
      console.log('[DB] Tables initialized successfully');
      initialized = true;
    } catch (error) {
      console.error('[DB] Failed to initialize tables:', error);
      throw error;
    }
  }
}

// ============ Project Functions ============

export async function createProject(
  name: string,
  brandName?: string,
  brandDomain?: string,
  locationCode?: string,
  languageCode?: string
): Promise<{ id: number }> {
  await ensureInitialized();
  const result = await pool.query(
    `INSERT INTO projects (name, brand_name, brand_domain, location_code, language_code)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [name, brandName || null, brandDomain || null, locationCode || null, languageCode || null]
  );
  return { id: result.rows[0].id };
}

export async function getAllProjects(): Promise<Project[]> {
  await ensureInitialized();
  const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
  return result.rows;
}

export async function getProject(id: number): Promise<Project | undefined> {
  await ensureInitialized();
  const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateProject(
  id: number,
  updates: { name?: string; brand_name?: string; brand_domain?: string }
): Promise<void> {
  await ensureInitialized();
  const fields: string[] = [];
  const values: (string | number)[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.brand_name !== undefined) {
    fields.push(`brand_name = $${paramIndex++}`);
    values.push(updates.brand_name);
  }
  if (updates.brand_domain !== undefined) {
    fields.push(`brand_domain = $${paramIndex++}`);
    values.push(updates.brand_domain);
  }

  if (fields.length === 0) return;

  values.push(id);
  await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
}

export async function deleteProject(id: number): Promise<void> {
  await ensureInitialized();
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}

// ============ Session Functions ============

export async function createSession(
  projectId: number,
  name?: string,
  locationCode?: string,
  languageCode?: string
): Promise<{ id: number }> {
  await ensureInitialized();
  const result = await pool.query(
    `INSERT INTO check_sessions (project_id, name, location_code, language_code)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [projectId, name || null, locationCode || null, languageCode || null]
  );
  return { id: result.rows[0].id };
}

export async function getProjectSessions(projectId: number): Promise<CheckSessionWithStats[]> {
  await ensureInitialized();
  const result = await pool.query(
    'SELECT * FROM check_sessions WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );
  return result.rows.map((session: CheckSession) => ({
    ...session,
    aio_rate: session.keyword_count > 0 ? (session.aio_count / session.keyword_count) * 100 : 0
  }));
}

export async function getSession(id: number): Promise<CheckSession | undefined> {
  await ensureInitialized();
  const result = await pool.query('SELECT * FROM check_sessions WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateSessionCounts(sessionId: number): Promise<void> {
  await ensureInitialized();
  const counts = await pool.query(
    `SELECT COUNT(*) as total, COALESCE(SUM(has_ai_overview), 0) as aio
     FROM keyword_results WHERE session_id = $1`,
    [sessionId]
  );
  await pool.query(
    'UPDATE check_sessions SET keyword_count = $1, aio_count = $2 WHERE id = $3',
    [counts.rows[0].total, counts.rows[0].aio, sessionId]
  );
}

export async function updateSessionName(sessionId: number, name: string): Promise<void> {
  await ensureInitialized();
  await pool.query('UPDATE check_sessions SET name = $1 WHERE id = $2', [name, sessionId]);
}

export async function deleteSession(id: number): Promise<void> {
  await ensureInitialized();
  await pool.query('DELETE FROM check_sessions WHERE id = $1', [id]);
}

// ============ Keyword Result Functions ============

export async function saveKeywordResult(
  projectId: number,
  sessionId: number,
  keyword: string,
  apiResult: Record<string, unknown>
): Promise<{ id: number }> {
  await ensureInitialized();
  const items = apiResult.items as Array<{ type: string; markdown?: string; references?: unknown[] }> | undefined;
  const aioItem = items?.find((item) => item.type === 'ai_overview');

  const result = await pool.query(
    `INSERT INTO keyword_results (project_id, session_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      projectId,
      sessionId,
      keyword,
      aioItem ? 1 : 0,
      JSON.stringify(apiResult),
      aioItem?.markdown || null,
      aioItem?.references ? JSON.stringify(aioItem.references) : null
    ]
  );
  return { id: result.rows[0].id };
}

export async function saveKeywordResults(
  projectId: number,
  sessionId: number,
  results: Array<{ keyword: string; apiResult: Record<string, unknown> }>
): Promise<void> {
  await ensureInitialized();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const { keyword, apiResult } of results) {
      const apiItems = apiResult.items as Array<{ type: string; markdown?: string; references?: unknown[] }> | undefined;
      const aioItem = apiItems?.find((item) => item.type === 'ai_overview');

      await client.query(
        `INSERT INTO keyword_results (project_id, session_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          projectId,
          sessionId,
          keyword,
          aioItem ? 1 : 0,
          JSON.stringify(apiResult),
          aioItem?.markdown || null,
          aioItem?.references ? JSON.stringify(aioItem.references) : null
        ]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }

  await updateSessionCounts(sessionId);
}

export async function getSessionKeywords(sessionId: number): Promise<KeywordRow[]> {
  await ensureInitialized();
  const result = await pool.query(
    'SELECT * FROM keyword_results WHERE session_id = $1 ORDER BY id ASC',
    [sessionId]
  );
  return result.rows;
}

export async function getProjectKeywords(projectId: number): Promise<KeywordRow[]> {
  await ensureInitialized();
  const latestSession = await pool.query(
    'SELECT id FROM check_sessions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
    [projectId]
  );

  if (latestSession.rows.length === 0) return [];
  return getSessionKeywords(latestSession.rows[0].id);
}

export async function getKeyword(id: number): Promise<KeywordRow | undefined> {
  await ensureInitialized();
  const result = await pool.query('SELECT * FROM keyword_results WHERE id = $1', [id]);
  return result.rows[0];
}

export async function getKeywordHistory(projectId: number, keyword: string): Promise<KeywordRow[]> {
  await ensureInitialized();
  const result = await pool.query(
    `SELECT kr.*, cs.name as session_name, cs.created_at as session_date
     FROM keyword_results kr
     JOIN check_sessions cs ON kr.session_id = cs.id
     WHERE kr.project_id = $1 AND kr.keyword = $2
     ORDER BY cs.created_at DESC`,
    [projectId, keyword]
  );
  return result.rows;
}

export async function getAllProjectKeywords(projectId: number): Promise<string[]> {
  await ensureInitialized();
  const result = await pool.query(
    'SELECT DISTINCT keyword FROM keyword_results WHERE project_id = $1 ORDER BY keyword ASC',
    [projectId]
  );
  return result.rows.map((r: { keyword: string }) => r.keyword);
}

export async function getProjectKeywordCount(projectId: number): Promise<number> {
  await ensureInitialized();
  const result = await pool.query(
    'SELECT COUNT(DISTINCT keyword) as count FROM keyword_results WHERE project_id = $1',
    [projectId]
  );
  return parseInt(result.rows[0].count);
}

export async function getProjectAIOCount(projectId: number): Promise<number> {
  await ensureInitialized();
  const latestSession = await pool.query(
    'SELECT id FROM check_sessions WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
    [projectId]
  );

  if (latestSession.rows.length === 0) return 0;

  const result = await pool.query(
    'SELECT COUNT(*) as count FROM keyword_results WHERE session_id = $1 AND has_ai_overview = 1',
    [latestSession.rows[0].id]
  );
  return parseInt(result.rows[0].count);
}

export async function deleteSessionKeywords(sessionId: number): Promise<void> {
  await ensureInitialized();
  await pool.query('DELETE FROM keyword_results WHERE session_id = $1', [sessionId]);
  await updateSessionCounts(sessionId);
}

// ============ Comparison Functions ============

export async function getSessionsForComparison(projectId: number, sessionIds: number[]): Promise<{
  sessions: CheckSession[];
  keywords: string[];
  data: { sessionId: number; keyword: string; hasAIO: boolean; references: string | null }[];
}> {
  await ensureInitialized();

  if (!sessionIds || sessionIds.length === 0) {
    return { sessions: [], keywords: [], data: [] };
  }

  const placeholders = sessionIds.map((_, i) => `$${i + 2}`).join(',');

  const sessions = await pool.query(
    `SELECT * FROM check_sessions WHERE project_id = $1 AND id IN (${placeholders})
     ORDER BY created_at ASC`,
    [projectId, ...sessionIds]
  );

  if (sessions.rows.length === 0) {
    return { sessions: [], keywords: [], data: [] };
  }

  const keywordsResult = await pool.query(
    `SELECT DISTINCT keyword FROM keyword_results
     WHERE session_id IN (${sessionIds.map((_, i) => `$${i + 1}`).join(',')})
     ORDER BY keyword ASC`,
    sessionIds
  );
  const keywords = keywordsResult.rows.map((r: { keyword: string }) => r.keyword);

  const data = await pool.query(
    `SELECT session_id as "sessionId", keyword, has_ai_overview as "hasAIO", aio_references as "references"
     FROM keyword_results
     WHERE session_id IN (${sessionIds.map((_, i) => `$${i + 1}`).join(',')})`,
    sessionIds
  );

  return {
    sessions: sessions.rows,
    keywords,
    data: data.rows.map((d: { sessionId: number; keyword: string; hasAIO: number; references: string | null }) => ({
      ...d,
      hasAIO: d.hasAIO === 1
    }))
  };
}

export async function compareTwoSessions(
  sessionId1: number,
  sessionId2: number,
  brandDomain?: string
): Promise<{
  fromSession: CheckSession;
  toSession: CheckSession;
  changes: {
    keyword: string;
    changeType: string;
    oldHasAIO: boolean | null;
    newHasAIO: boolean | null;
    oldBrandRank: number | null;
    newBrandRank: number | null;
  }[];
}> {
  await ensureInitialized();

  const fromSession = await getSession(sessionId1);
  const toSession = await getSession(sessionId2);

  if (!fromSession || !toSession) {
    throw new Error('Session not found');
  }

  const fromKeywords = await getSessionKeywords(sessionId1);
  const toKeywords = await getSessionKeywords(sessionId2);

  const fromMap = new Map(fromKeywords.map(k => [k.keyword, k]));
  const toMap = new Map(toKeywords.map(k => [k.keyword, k]));

  const allKeywords = new Set([...fromMap.keys(), ...toMap.keys()]);

  const changes: {
    keyword: string;
    changeType: string;
    oldHasAIO: boolean | null;
    newHasAIO: boolean | null;
    oldBrandRank: number | null;
    newBrandRank: number | null;
  }[] = [];

  const getBrandRank = (kw: KeywordRow | undefined): number | null => {
    if (!kw || !kw.aio_references || !brandDomain) return null;
    try {
      const refs = JSON.parse(kw.aio_references) as Reference[];
      const brandRef = refs.find(r =>
        r.domain?.toLowerCase().includes(brandDomain.toLowerCase())
      );
      return brandRef ? refs.indexOf(brandRef) + 1 : null;
    } catch {
      return null;
    }
  };

  for (const keyword of allKeywords) {
    const oldKw = fromMap.get(keyword);
    const newKw = toMap.get(keyword);

    const oldHasAIO = oldKw ? oldKw.has_ai_overview === 1 : null;
    const newHasAIO = newKw ? newKw.has_ai_overview === 1 : null;
    const oldBrandRank = getBrandRank(oldKw);
    const newBrandRank = getBrandRank(newKw);

    let changeType = 'no_change';

    if (!oldKw && newKw) {
      changeType = 'new';
    } else if (oldKw && !newKw) {
      changeType = 'removed';
    } else if (oldHasAIO === false && newHasAIO === true) {
      changeType = 'aio_gained';
    } else if (oldHasAIO === true && newHasAIO === false) {
      changeType = 'aio_lost';
    } else if (oldBrandRank !== null && newBrandRank !== null) {
      if (newBrandRank < oldBrandRank) {
        changeType = 'rank_improved';
      } else if (newBrandRank > oldBrandRank) {
        changeType = 'rank_declined';
      }
    } else if (oldBrandRank === null && newBrandRank !== null) {
      changeType = 'rank_improved';
    } else if (oldBrandRank !== null && newBrandRank === null) {
      changeType = 'rank_declined';
    }

    changes.push({
      keyword,
      changeType,
      oldHasAIO,
      newHasAIO,
      oldBrandRank,
      newBrandRank
    });
  }

  return { fromSession, toSession, changes };
}

// ============ Legacy compatibility ============

export async function deleteProjectKeywords(projectId: number): Promise<void> {
  await ensureInitialized();
  await pool.query('DELETE FROM keyword_results WHERE project_id = $1', [projectId]);
}

// ============ Helper Functions for Session Detail ============

export async function getPreviousSession(projectId: number, currentCreatedAt: string): Promise<CheckSession | undefined> {
  await ensureInitialized();
  const result = await pool.query(
    `SELECT * FROM check_sessions
     WHERE project_id = $1 AND created_at < $2
     ORDER BY created_at DESC LIMIT 1`,
    [projectId, currentCreatedAt]
  );
  return result.rows[0];
}

export async function getRecentSessionIds(projectId: number, limit: number = 5): Promise<number[]> {
  await ensureInitialized();
  const result = await pool.query(
    `SELECT id FROM check_sessions
     WHERE project_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [projectId, limit]
  );
  return result.rows.map((r: { id: number }) => r.id);
}

export async function getKeywordResultsForSessions(sessionIds: number[]): Promise<{
  session_id: number;
  keyword: string;
  aio_references: string | null;
}[]> {
  await ensureInitialized();
  if (sessionIds.length === 0) return [];

  const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(',');
  const result = await pool.query(
    `SELECT session_id, keyword, aio_references
     FROM keyword_results
     WHERE session_id IN (${placeholders})
     ORDER BY session_id ASC`,
    sessionIds
  );
  return result.rows;
}

export async function getSessionKeywordsBasic(sessionId: number): Promise<{
  keyword: string;
  has_ai_overview: number;
  aio_references: string | null;
}[]> {
  await ensureInitialized();
  const result = await pool.query(
    `SELECT keyword, has_ai_overview, aio_references
     FROM keyword_results WHERE session_id = $1`,
    [sessionId]
  );
  return result.rows;
}

export default pool;
