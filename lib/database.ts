// Unified database interface that uses PostgreSQL when DATABASE_URL is set,
// otherwise falls back to SQLite for local development

import * as sqliteDb from './db';
import * as postgresDb from './db-postgres';

const usePostgres = !!process.env.DATABASE_URL;

console.log('[Database] Mode:', usePostgres ? 'PostgreSQL' : 'SQLite');

// Helper to get the right database module
const getDb = () => usePostgres ? postgresDb : sqliteDb;

// ============ Project Functions ============

export async function createProject(
  name: string,
  brandName?: string,
  brandDomain?: string,
  locationCode?: string,
  languageCode?: string,
  userId?: string
): Promise<{ id: number }> {
  const db = getDb();
  return db.createProject(name, brandName, brandDomain, locationCode, languageCode, userId);
}

export async function getAllProjects(userId?: string) {
  const db = getDb();
  return db.getAllProjects(userId);
}

export async function getProject(id: number, userId?: string) {
  const db = getDb();
  return db.getProject(id, userId);
}

export async function verifyProjectOwnership(projectId: number, userId: string) {
  const db = getDb();
  return db.verifyProjectOwnership(projectId, userId);
}

export async function updateProject(
  id: number,
  updates: { name?: string; brand_name?: string; brand_domain?: string }
) {
  const db = getDb();
  return db.updateProject(id, updates);
}

export async function deleteProject(id: number) {
  const db = getDb();
  return db.deleteProject(id);
}

// ============ Session Functions ============

export async function createSession(
  projectId: number,
  name?: string,
  locationCode?: string,
  languageCode?: string
) {
  const db = getDb();
  return db.createSession(projectId, name, locationCode, languageCode);
}

export async function getProjectSessions(projectId: number) {
  const db = getDb();
  return db.getProjectSessions(projectId);
}

export async function getSession(id: number) {
  const db = getDb();
  return db.getSession(id);
}

export async function updateSessionCounts(sessionId: number) {
  const db = getDb();
  return db.updateSessionCounts(sessionId);
}

export async function updateSessionName(sessionId: number, name: string) {
  const db = getDb();
  return db.updateSessionName(sessionId, name);
}

export async function deleteSession(id: number) {
  const db = getDb();
  return db.deleteSession(id);
}

// ============ Keyword Result Functions ============

export async function saveKeywordResult(
  projectId: number,
  sessionId: number,
  keyword: string,
  apiResult: Record<string, unknown>
) {
  const db = getDb();
  return db.saveKeywordResult(projectId, sessionId, keyword, apiResult);
}

export async function saveKeywordResults(
  projectId: number,
  sessionId: number,
  results: Array<{ keyword: string; apiResult: Record<string, unknown> }>
) {
  const db = getDb();
  return db.saveKeywordResults(projectId, sessionId, results);
}

export async function getSessionKeywords(sessionId: number) {
  const db = getDb();
  return db.getSessionKeywords(sessionId);
}

export async function getProjectKeywords(projectId: number) {
  const db = getDb();
  return db.getProjectKeywords(projectId);
}

export async function getKeyword(id: number) {
  const db = getDb();
  return db.getKeyword(id);
}

export async function getKeywordHistory(projectId: number, keyword: string) {
  const db = getDb();
  return db.getKeywordHistory(projectId, keyword);
}

export async function getAllProjectKeywords(projectId: number) {
  const db = getDb();
  return db.getAllProjectKeywords(projectId);
}

export async function getProjectKeywordCount(projectId: number) {
  const db = getDb();
  return db.getProjectKeywordCount(projectId);
}

export async function getProjectAIOCount(projectId: number) {
  const db = getDb();
  return db.getProjectAIOCount(projectId);
}

export async function deleteSessionKeywords(sessionId: number) {
  const db = getDb();
  return db.deleteSessionKeywords(sessionId);
}

// ============ Comparison Functions ============

export async function getSessionsForComparison(projectId: number, sessionIds: number[]) {
  const db = getDb();
  return db.getSessionsForComparison(projectId, sessionIds);
}

export async function compareTwoSessions(
  sessionId1: number,
  sessionId2: number,
  brandDomain?: string
) {
  const db = getDb();
  return db.compareTwoSessions(sessionId1, sessionId2, brandDomain);
}

export async function deleteProjectKeywords(projectId: number) {
  const db = getDb();
  return db.deleteProjectKeywords(projectId);
}

// ============ Helper Functions ============

export async function getPreviousSession(projectId: number, currentCreatedAt: string) {
  const db = getDb();
  return db.getPreviousSession(projectId, currentCreatedAt);
}

export async function getRecentSessionIds(projectId: number, limit: number = 5) {
  const db = getDb();
  return db.getRecentSessionIds(projectId, limit);
}

export async function getKeywordResultsForSessions(sessionIds: number[]) {
  const db = getDb();
  return db.getKeywordResultsForSessions(sessionIds);
}

export async function getSessionKeywordsBasic(sessionId: number) {
  const db = getDb();
  return db.getSessionKeywordsBasic(sessionId);
}

// ============ Migration Functions ============

export async function migrateProjectsToUser(userId: string) {
  const db = getDb();
  return db.migrateProjectsToUser(userId);
}

export async function getOrphanedProjectsCount() {
  const db = getDb();
  return db.getOrphanedProjectsCount();
}
