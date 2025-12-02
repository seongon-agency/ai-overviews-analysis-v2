// TypeScript interfaces for the application

// Raw API response from DataForSEO
export interface DataForSEOResult {
  keyword: string;
  type: string;
  location_code: number;
  language_code: string;
  items: SERPItem[];
  item_types: string[];
  se_results_count: number;
  datetime: string;
}

export interface SERPItem {
  type: 'organic' | 'ai_overview' | 'video' | string;
  rank_group: number;
  rank_absolute: number;
  domain?: string;
  title?: string;
  url?: string;
  description?: string;
  // AI Overview specific
  markdown?: string;
  references?: APIReference[];
  asynchronous_ai_overview?: boolean;
}

export interface APIReference {
  domain: string;
  source: string;
  url: string;
}

// Processed reference with rank
export interface Reference {
  rank: number;
  domain: string;
  source: string;
  url: string;
}

// Database models
export interface Project {
  id: number;
  name: string;
  brand_name: string | null;
  brand_domain: string | null;
  location_code: string | null;
  language_code: string | null;
  created_at: string;
}

// Check session - represents a single check/fetch operation
export interface CheckSession {
  id: number;
  project_id: number;
  name: string | null;
  location_code: string | null;
  language_code: string | null;
  keyword_count: number;
  aio_count: number;
  created_at: string;
}

// Session with computed stats (for list view)
export interface CheckSessionWithStats extends CheckSession {
  aio_rate: number;
}

export interface KeywordRow {
  id: number;
  project_id: number;
  session_id: number;
  keyword: string;
  has_ai_overview: number; // SQLite boolean
  raw_api_result: string | null;
  aio_markdown: string | null;
  aio_references: string | null;
  created_at: string;
}

// Processed keyword for UI
export interface KeywordRecord {
  id: number;
  keyword: string;
  hasAIOverview: boolean;
  aioMarkdown: string | null;
  references: Reference[];
  referenceCount: number;
  brandRank: number | null;
  sessionId?: number;
  createdAt?: string;
}

// Keyword history entry for timeline view
export interface KeywordHistoryEntry {
  sessionId: number;
  sessionName: string | null;
  sessionDate: string;
  hasAIOverview: boolean;
  aioMarkdown: string | null;
  references: Reference[];
  referenceCount: number;
  brandRank: number | null;
}

// Keyword with full history
export interface KeywordWithHistory {
  keyword: string;
  history: KeywordHistoryEntry[];
  latestResult: KeywordHistoryEntry | null;
}

// Session comparison data
export interface SessionComparisonData {
  sessions: CheckSession[];
  keywords: string[];
  matrix: {
    [keyword: string]: {
      [sessionId: number]: {
        hasAIO: boolean;
        brandRank: number | null;
        referenceCount: number;
      } | null; // null means not checked in this session
    };
  };
}

// Change detection between sessions
export interface KeywordChange {
  keyword: string;
  changeType: 'new' | 'removed' | 'aio_gained' | 'aio_lost' | 'rank_improved' | 'rank_declined' | 'no_change';
  oldValue?: {
    hasAIO: boolean;
    brandRank: number | null;
  };
  newValue?: {
    hasAIO: boolean;
    brandRank: number | null;
  };
}

export interface SessionComparison {
  fromSession: CheckSession;
  toSession: CheckSession;
  changes: KeywordChange[];
  summary: {
    newKeywords: number;
    removedKeywords: number;
    aioGained: number;
    aioLost: number;
    rankImproved: number;
    rankDeclined: number;
    unchanged: number;
  };
}

// Analysis results
export interface CompetitorMetrics {
  brand: string;
  citedCount: number;
  mentionedCount: number;
  uniqueDomains: string[];
  averageRank: number;
  citedInPrompts: number;
  promptCitedRate: number;
  mentionRate: number;
}

export interface AnalysisResult {
  summary: {
    totalKeywords: number;
    aiOverviewsFound: number;
    competitorsIdentified: number;
  };
  keywordsAnalysis: KeywordRecord[];
  competitors: CompetitorMetrics[];
}

// Parsed markdown segment for citation linking
export interface ParsedSegment {
  type: 'text' | 'citation';
  content?: string;
  citationNum?: number;
  url?: string;
}
