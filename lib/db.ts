import Database from 'better-sqlite3';
import path from 'path';
import { Project, KeywordRow, CheckSession, CheckSessionWithStats, Reference } from './types';

// Initialize database
const dbPath = path.join(process.cwd(), 'data', 'aio-analysis.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand_name TEXT,
    brand_domain TEXT,
    location_code TEXT,
    language_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS check_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT,
    location_code TEXT,
    language_code TEXT,
    keyword_count INTEGER DEFAULT 0,
    aio_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS keyword_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    has_ai_overview INTEGER DEFAULT 0,
    raw_api_result TEXT,
    aio_markdown TEXT,
    aio_references TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES check_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_project ON check_sessions(project_id);
  CREATE INDEX IF NOT EXISTS idx_keyword_results_project ON keyword_results(project_id);
  CREATE INDEX IF NOT EXISTS idx_keyword_results_session ON keyword_results(session_id);
  CREATE INDEX IF NOT EXISTS idx_keyword_results_keyword ON keyword_results(keyword);
`);

// Migration: Check if old 'keywords' table exists and migrate data
const oldTableExists = db.prepare(`
  SELECT name FROM sqlite_master WHERE type='table' AND name='keywords'
`).get();

if (oldTableExists) {
  // Check if we need to migrate (keyword_results is empty but keywords has data)
  const oldCount = (db.prepare(`SELECT COUNT(*) as count FROM keywords`).get() as { count: number }).count;
  const newCount = (db.prepare(`SELECT COUNT(*) as count FROM keyword_results`).get() as { count: number }).count;

  if (oldCount > 0 && newCount === 0) {
    console.log('Migrating data from old keywords table to new schema...');

    // Get unique project IDs from old table
    const projectIds = db.prepare(`SELECT DISTINCT project_id FROM keywords`).all() as { project_id: number }[];

    for (const { project_id } of projectIds) {
      // Create a migration session for each project
      const sessionResult = db.prepare(`
        INSERT INTO check_sessions (project_id, name, keyword_count, aio_count)
        VALUES (?, 'Migrated Data', 0, 0)
      `).run(project_id);

      const sessionId = sessionResult.lastInsertRowid as number;

      // Migrate keywords to keyword_results
      db.prepare(`
        INSERT INTO keyword_results (project_id, session_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references, created_at)
        SELECT project_id, ?, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references, created_at
        FROM keywords WHERE project_id = ?
      `).run(sessionId, project_id);

      // Update session counts
      const counts = db.prepare(`
        SELECT COUNT(*) as total, SUM(has_ai_overview) as aio FROM keyword_results WHERE session_id = ?
      `).get(sessionId) as { total: number; aio: number };

      db.prepare(`
        UPDATE check_sessions SET keyword_count = ?, aio_count = ? WHERE id = ?
      `).run(counts.total, counts.aio || 0, sessionId);
    }

    console.log('Migration complete!');
  }
}

export default db;

// ============ Project Functions ============

export function createProject(
  name: string,
  brandName?: string,
  brandDomain?: string,
  locationCode?: string,
  languageCode?: string
): { id: number } {
  const stmt = db.prepare(`
    INSERT INTO projects (name, brand_name, brand_domain, location_code, language_code)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, brandName || null, brandDomain || null, locationCode || null, languageCode || null);
  return { id: result.lastInsertRowid as number };
}

export function getAllProjects(): Project[] {
  const stmt = db.prepare(`
    SELECT * FROM projects ORDER BY created_at DESC
  `);
  return stmt.all() as Project[];
}

export function getProject(id: number): Project | undefined {
  const stmt = db.prepare(`SELECT * FROM projects WHERE id = ?`);
  return stmt.get(id) as Project | undefined;
}

export function updateProject(
  id: number,
  updates: { name?: string; brand_name?: string; brand_domain?: string }
): void {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.brand_name !== undefined) {
    fields.push('brand_name = ?');
    values.push(updates.brand_name);
  }
  if (updates.brand_domain !== undefined) {
    fields.push('brand_domain = ?');
    values.push(updates.brand_domain);
  }

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
}

export function deleteProject(id: number): void {
  const stmt = db.prepare(`DELETE FROM projects WHERE id = ?`);
  stmt.run(id);
}

// ============ Session Functions ============

export function createSession(
  projectId: number,
  name?: string,
  locationCode?: string,
  languageCode?: string
): { id: number } {
  const stmt = db.prepare(`
    INSERT INTO check_sessions (project_id, name, location_code, language_code)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(projectId, name || null, locationCode || null, languageCode || null);
  return { id: result.lastInsertRowid as number };
}

export function getProjectSessions(projectId: number): CheckSessionWithStats[] {
  const stmt = db.prepare(`
    SELECT * FROM check_sessions WHERE project_id = ? ORDER BY created_at DESC
  `);
  const sessions = stmt.all(projectId) as CheckSession[];

  return sessions.map(session => ({
    ...session,
    aio_rate: session.keyword_count > 0 ? (session.aio_count / session.keyword_count) * 100 : 0
  }));
}

export function getSession(id: number): CheckSession | undefined {
  const stmt = db.prepare(`SELECT * FROM check_sessions WHERE id = ?`);
  return stmt.get(id) as CheckSession | undefined;
}

export function updateSessionCounts(sessionId: number): void {
  const counts = db.prepare(`
    SELECT COUNT(*) as total, SUM(has_ai_overview) as aio FROM keyword_results WHERE session_id = ?
  `).get(sessionId) as { total: number; aio: number };

  db.prepare(`
    UPDATE check_sessions SET keyword_count = ?, aio_count = ? WHERE id = ?
  `).run(counts.total, counts.aio || 0, sessionId);
}

export function updateSessionName(sessionId: number, name: string): void {
  const stmt = db.prepare(`UPDATE check_sessions SET name = ? WHERE id = ?`);
  stmt.run(name, sessionId);
}

export function deleteSession(id: number): void {
  const stmt = db.prepare(`DELETE FROM check_sessions WHERE id = ?`);
  stmt.run(id);
}

// ============ Keyword Result Functions ============

export function saveKeywordResult(
  projectId: number,
  sessionId: number,
  keyword: string,
  apiResult: Record<string, unknown>
): { id: number } {
  // Find AI overview item in the result
  const items = apiResult.items as Array<{ type: string; markdown?: string; references?: unknown[] }> | undefined;
  const aioItem = items?.find((item) => item.type === 'ai_overview');

  const stmt = db.prepare(`
    INSERT INTO keyword_results (project_id, session_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    projectId,
    sessionId,
    keyword,
    aioItem ? 1 : 0,
    JSON.stringify(apiResult),
    aioItem?.markdown || null,
    aioItem?.references ? JSON.stringify(aioItem.references) : null
  );

  return { id: result.lastInsertRowid as number };
}

export function saveKeywordResults(
  projectId: number,
  sessionId: number,
  results: Array<{ keyword: string; apiResult: Record<string, unknown> }>
): void {
  const stmt = db.prepare(`
    INSERT INTO keyword_results (project_id, session_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: typeof results) => {
    for (const { keyword, apiResult } of items) {
      const apiItems = apiResult.items as Array<{ type: string; markdown?: string; references?: unknown[] }> | undefined;
      const aioItem = apiItems?.find((item) => item.type === 'ai_overview');

      stmt.run(
        projectId,
        sessionId,
        keyword,
        aioItem ? 1 : 0,
        JSON.stringify(apiResult),
        aioItem?.markdown || null,
        aioItem?.references ? JSON.stringify(aioItem.references) : null
      );
    }
  });

  insertMany(results);

  // Update session counts after insertion
  updateSessionCounts(sessionId);
}

export function getSessionKeywords(sessionId: number): KeywordRow[] {
  const stmt = db.prepare(`
    SELECT * FROM keyword_results WHERE session_id = ? ORDER BY id ASC
  `);
  return stmt.all(sessionId) as KeywordRow[];
}

export function getProjectKeywords(projectId: number): KeywordRow[] {
  // Get keywords from the latest session
  const latestSession = db.prepare(`
    SELECT id FROM check_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(projectId) as { id: number } | undefined;

  if (!latestSession) return [];

  return getSessionKeywords(latestSession.id);
}

export function getKeyword(id: number): KeywordRow | undefined {
  const stmt = db.prepare(`SELECT * FROM keyword_results WHERE id = ?`);
  return stmt.get(id) as KeywordRow | undefined;
}

export function getKeywordHistory(projectId: number, keyword: string): KeywordRow[] {
  const stmt = db.prepare(`
    SELECT kr.*, cs.name as session_name, cs.created_at as session_date
    FROM keyword_results kr
    JOIN check_sessions cs ON kr.session_id = cs.id
    WHERE kr.project_id = ? AND kr.keyword = ?
    ORDER BY cs.created_at DESC
  `);
  return stmt.all(projectId, keyword) as KeywordRow[];
}

export function getAllProjectKeywords(projectId: number): string[] {
  const stmt = db.prepare(`
    SELECT DISTINCT keyword FROM keyword_results WHERE project_id = ? ORDER BY keyword ASC
  `);
  const results = stmt.all(projectId) as { keyword: string }[];
  return results.map(r => r.keyword);
}

export function getProjectKeywordCount(projectId: number): number {
  const stmt = db.prepare(`SELECT COUNT(DISTINCT keyword) as count FROM keyword_results WHERE project_id = ?`);
  const result = stmt.get(projectId) as { count: number };
  return result.count;
}

export function getProjectAIOCount(projectId: number): number {
  // Count from latest session
  const latestSession = db.prepare(`
    SELECT id FROM check_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(projectId) as { id: number } | undefined;

  if (!latestSession) return 0;

  const stmt = db.prepare(`SELECT COUNT(*) as count FROM keyword_results WHERE session_id = ? AND has_ai_overview = 1`);
  const result = stmt.get(latestSession.id) as { count: number };
  return result.count;
}

export function deleteSessionKeywords(sessionId: number): void {
  const stmt = db.prepare(`DELETE FROM keyword_results WHERE session_id = ?`);
  stmt.run(sessionId);
  updateSessionCounts(sessionId);
}

// ============ Comparison Functions ============

export function getSessionsForComparison(projectId: number, sessionIds: number[]): {
  sessions: CheckSession[];
  keywords: string[];
  data: { sessionId: number; keyword: string; hasAIO: boolean; references: string | null }[];
} {
  if (!sessionIds || sessionIds.length === 0) {
    return { sessions: [], keywords: [], data: [] };
  }

  // Build the placeholders for IN clause
  const placeholders = sessionIds.map(() => '?').join(',');

  const sessions = db.prepare(`
    SELECT * FROM check_sessions WHERE project_id = ? AND id IN (${placeholders})
    ORDER BY created_at ASC
  `).all(projectId, ...sessionIds) as CheckSession[];

  if (sessions.length === 0) {
    return { sessions: [], keywords: [], data: [] };
  }

  // Get all unique keywords across selected sessions
  const keywordsResult = db.prepare(`
    SELECT DISTINCT keyword FROM keyword_results
    WHERE session_id IN (${placeholders})
    ORDER BY keyword ASC
  `).all(...sessionIds) as { keyword: string }[];
  const keywords = keywordsResult.map(r => r.keyword);

  // Get keyword results for selected sessions
  // Note: 'references' is aliased with quotes because it's a reserved word in SQL
  const data = db.prepare(`
    SELECT session_id as sessionId, keyword, has_ai_overview as hasAIO, aio_references as "references"
    FROM keyword_results
    WHERE session_id IN (${placeholders})
  `).all(...sessionIds) as { sessionId: number; keyword: string; hasAIO: number; references: string | null }[];

  return {
    sessions,
    keywords,
    data: data.map(d => ({ ...d, hasAIO: d.hasAIO === 1 }))
  };
}

export function compareTwoSessions(
  sessionId1: number,
  sessionId2: number,
  brandDomain?: string
): {
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
} {
  const fromSession = getSession(sessionId1);
  const toSession = getSession(sessionId2);

  if (!fromSession || !toSession) {
    throw new Error('Session not found');
  }

  const fromKeywords = getSessionKeywords(sessionId1);
  const toKeywords = getSessionKeywords(sessionId2);

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

// ============ Legacy compatibility (for existing code) ============

// This maintains backward compatibility with existing code that uses deleteProjectKeywords
export function deleteProjectKeywords(projectId: number): void {
  const stmt = db.prepare(`DELETE FROM keyword_results WHERE project_id = ?`);
  stmt.run(projectId);
}
