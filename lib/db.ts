import Database from 'better-sqlite3';
import path from 'path';
import { Project, KeywordRow } from './types';

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

  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    has_ai_overview INTEGER DEFAULT 0,
    raw_api_result TEXT,
    aio_markdown TEXT,
    aio_references TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_keywords_project ON keywords(project_id);
  CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
`);

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

// ============ Keyword Functions ============

export function saveKeywordResult(
  projectId: number,
  keyword: string,
  apiResult: Record<string, unknown>
): { id: number } {
  // Find AI overview item in the result
  const items = apiResult.items as Array<{ type: string; markdown?: string; references?: unknown[] }> | undefined;
  const aioItem = items?.find((item) => item.type === 'ai_overview');

  const stmt = db.prepare(`
    INSERT INTO keywords (project_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    projectId,
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
  results: Array<{ keyword: string; apiResult: Record<string, unknown> }>
): void {
  const stmt = db.prepare(`
    INSERT INTO keywords (project_id, keyword, has_ai_overview, raw_api_result, aio_markdown, aio_references)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items: typeof results) => {
    for (const { keyword, apiResult } of items) {
      const apiItems = apiResult.items as Array<{ type: string; markdown?: string; references?: unknown[] }> | undefined;
      const aioItem = apiItems?.find((item) => item.type === 'ai_overview');

      stmt.run(
        projectId,
        keyword,
        aioItem ? 1 : 0,
        JSON.stringify(apiResult),
        aioItem?.markdown || null,
        aioItem?.references ? JSON.stringify(aioItem.references) : null
      );
    }
  });

  insertMany(results);
}

export function getProjectKeywords(projectId: number): KeywordRow[] {
  const stmt = db.prepare(`
    SELECT * FROM keywords WHERE project_id = ? ORDER BY id ASC
  `);
  return stmt.all(projectId) as KeywordRow[];
}

export function getKeyword(id: number): KeywordRow | undefined {
  const stmt = db.prepare(`SELECT * FROM keywords WHERE id = ?`);
  return stmt.get(id) as KeywordRow | undefined;
}

export function getProjectKeywordCount(projectId: number): number {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM keywords WHERE project_id = ?`);
  const result = stmt.get(projectId) as { count: number };
  return result.count;
}

export function getProjectAIOCount(projectId: number): number {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM keywords WHERE project_id = ? AND has_ai_overview = 1`);
  const result = stmt.get(projectId) as { count: number };
  return result.count;
}

export function deleteProjectKeywords(projectId: number): void {
  const stmt = db.prepare(`DELETE FROM keywords WHERE project_id = ?`);
  stmt.run(projectId);
}
