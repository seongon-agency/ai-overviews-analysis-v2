// Unified database interface that uses PostgreSQL when DATABASE_URL is set,
// otherwise falls back to SQLite for local development

const usePostgres = !!process.env.DATABASE_URL;

// Dynamic import based on environment
let db: typeof import('./db') | typeof import('./db-postgres');

if (usePostgres) {
  db = require('./db-postgres');
} else {
  db = require('./db');
}

// Re-export all functions
export const createProject = db.createProject;
export const getAllProjects = db.getAllProjects;
export const getProject = db.getProject;
export const updateProject = db.updateProject;
export const deleteProject = db.deleteProject;

export const createSession = db.createSession;
export const getProjectSessions = db.getProjectSessions;
export const getSession = db.getSession;
export const updateSessionCounts = db.updateSessionCounts;
export const updateSessionName = db.updateSessionName;
export const deleteSession = db.deleteSession;

export const saveKeywordResult = db.saveKeywordResult;
export const saveKeywordResults = db.saveKeywordResults;
export const getSessionKeywords = db.getSessionKeywords;
export const getProjectKeywords = db.getProjectKeywords;
export const getKeyword = db.getKeyword;
export const getKeywordHistory = db.getKeywordHistory;
export const getAllProjectKeywords = db.getAllProjectKeywords;
export const getProjectKeywordCount = db.getProjectKeywordCount;
export const getProjectAIOCount = db.getProjectAIOCount;
export const deleteSessionKeywords = db.deleteSessionKeywords;

export const getSessionsForComparison = db.getSessionsForComparison;
export const compareTwoSessions = db.compareTwoSessions;
export const deleteProjectKeywords = db.deleteProjectKeywords;

export const getPreviousSession = db.getPreviousSession;
export const getRecentSessionIds = db.getRecentSessionIds;
export const getKeywordResultsForSessions = db.getKeywordResultsForSessions;
export const getSessionKeywordsBasic = db.getSessionKeywordsBasic;

export default db.default;
