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

export interface KeywordRow {
  id: number;
  project_id: number;
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
