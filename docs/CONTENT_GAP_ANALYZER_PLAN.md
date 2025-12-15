# Content Gap Analyzer - Implementation Plan

## Overview

An AI-powered feature that analyzes why your brand isn't getting cited in AI Overviews and provides actionable recommendations to improve citation rates.

---

## Feature Goals

1. **Identify gaps** - Show keywords where competitors are cited but you're not
2. **Detect patterns** - Find common themes in content that gets cited
3. **Provide recommendations** - AI-generated, actionable suggestions
4. **Enable deep dives** - On-demand detailed analysis of specific keywords

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT GAP ANALYZER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Tier 1    │    │   Tier 2    │    │      Tier 3         │  │
│  │  Citation   │───▶│   Pattern   │───▶│   Deep Analysis     │  │
│  │  Analysis   │    │  Detection  │    │   (LLM-powered)     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│        │                  │                      │              │
│        ▼                  ▼                      ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Gap Summary │    │  Pattern    │    │  AI Recommendations │  │
│  │   Stats     │    │  Insights   │    │  & Content Tips     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Citation Gap Analysis (No AI required)

**Goal:** Surface existing data in a gap-focused view

#### 1.1 Data Layer

**New file: `lib/gap-analysis.ts`**

```typescript
interface GapKeyword {
  keyword: string;
  hasAIO: boolean;
  brandCited: boolean;
  brandRank: number | null;
  topCompetitors: Array<{
    domain: string;
    sourceName: string;
    rank: number;
  }>;
  aioMarkdown: string;
  references: Reference[];
}

interface GapAnalysisResult {
  summary: {
    totalKeywords: number;
    keywordsWithAIO: number;
    keywordsWithBrand: number;
    keywordsWithoutBrand: number;  // The "gap"
    gapPercentage: number;
    topGapCompetitors: Array<{
      domain: string;
      citationCount: number;
      avgRank: number;
    }>;
  };
  gapKeywords: GapKeyword[];  // Keywords where brand is NOT cited
  citedKeywords: GapKeyword[]; // Keywords where brand IS cited
}

// Main analysis function
export function analyzeContentGaps(
  keywords: KeywordRecord[],
  brandName: string,
  brandDomain: string
): GapAnalysisResult;

// Helper to identify what gap keywords have in common
export function findGapPatterns(gapKeywords: GapKeyword[]): GapPattern[];
```

#### 1.2 API Endpoint

**New file: `app/api/gap-analysis/route.ts`**

```typescript
// GET /api/gap-analysis?projectId=xxx&sessionId=xxx
// Returns GapAnalysisResult

// Query params:
// - projectId (required): Project to analyze
// - sessionId (optional): Specific session, defaults to latest
// - compareSessionId (optional): Compare gaps between sessions
```

#### 1.3 UI Components

**New file: `components/dashboard/GapAnalysis.tsx`**

```typescript
// Main container component
// Displays:
// - Gap summary cards (total gaps, gap %, top gap competitors)
// - Gap keywords table with filtering/sorting
// - "Why am I not cited?" expandable sections
```

**New file: `components/dashboard/GapKeywordCard.tsx`**

```typescript
// Individual gap keyword display
// Shows: keyword, top competitors, AIO preview
// Action: "Analyze This" button for Tier 2/3
```

#### 1.4 Integration Point

Add "Content Gaps" as a new tab in the project Dashboard view, alongside existing "Overview" and trends.

**Modify: `app/project/[id]/page.tsx`**

```typescript
// Add new tab: "Content Gaps"
// <TabsTrigger value="gaps">Content Gaps</TabsTrigger>
// <TabsContent value="gaps"><GapAnalysis projectId={id} /></TabsContent>
```

---

### Phase 2: Pattern Detection (Light AI / Heuristics)

**Goal:** Identify common patterns in content that gets cited

#### 2.1 Pattern Types to Detect

```typescript
interface GapPattern {
  type: PatternType;
  description: string;
  affectedKeywords: number;
  examples: string[];
  recommendation: string;
}

type PatternType =
  | 'comparison_content'      // Keywords with "vs", "compare", "best"
  | 'pricing_pages'           // Competitors cite pricing/cost pages
  | 'freshness'               // 2024/2025 content gets cited
  | 'listicle_format'         // "Top X", "Best X" format
  | 'how_to_guides'           // Tutorial/guide content
  | 'data_statistics'         // Content with numbers/stats
  | 'specific_domain_type'    // e.g., .edu, .gov sources
  | 'content_depth';          // Long-form vs short-form
```

#### 2.2 Pattern Detection Logic

**New file: `lib/pattern-detection.ts`**

```typescript
// Analyzes gap keywords to find patterns

export function detectPatterns(
  gapKeywords: GapKeyword[],
  citedKeywords: GapKeyword[]
): GapPattern[] {
  const patterns: GapPattern[] = [];

  // Pattern: Comparison content
  const comparisonKeywords = gapKeywords.filter(k =>
    /\b(vs|versus|compare|comparison|best|top)\b/i.test(k.keyword)
  );
  if (comparisonKeywords.length > 3) {
    patterns.push({
      type: 'comparison_content',
      description: 'Comparison-style keywords where you\'re not cited',
      affectedKeywords: comparisonKeywords.length,
      examples: comparisonKeywords.slice(0, 3).map(k => k.keyword),
      recommendation: 'Create dedicated comparison pages (e.g., /your-product-vs-competitor)'
    });
  }

  // Pattern: Freshness (analyze AIO markdown for year mentions)
  // Pattern: Pricing pages (check if competitor URLs contain /pricing)
  // ... etc

  return patterns;
}
```

#### 2.3 UI Updates

**Modify: `components/dashboard/GapAnalysis.tsx`**

```typescript
// Add "Detected Patterns" section
// Display pattern cards with:
// - Pattern icon
// - Description
// - Affected keyword count
// - Quick recommendation
// - "View affected keywords" expansion
```

---

### Phase 3: AI-Powered Deep Analysis

**Goal:** LLM-generated insights and recommendations

#### 3.1 LLM Integration Setup

**New file: `lib/ai/provider.ts`**

```typescript
// Abstraction layer for LLM providers
// Supports: OpenAI, Anthropic Claude, or local models

interface AIProvider {
  analyze(prompt: string, context: AnalysisContext): Promise<string>;
  analyzeStructured<T>(prompt: string, context: AnalysisContext, schema: Schema): Promise<T>;
}

// Environment-based configuration
// OPENAI_API_KEY or ANTHROPIC_API_KEY
export function getAIProvider(): AIProvider;
```

**New file: `lib/ai/prompts.ts`**

```typescript
// Prompt templates for different analysis types

export const PROMPTS = {
  GAP_SUMMARY: `
    Analyze the following content gap data for a brand tracking AI Overview citations.

    Brand: {{brandName}}
    Total Keywords: {{totalKeywords}}
    Keywords where brand is NOT cited: {{gapCount}}

    Top competitors appearing in gaps:
    {{competitorList}}

    Sample gap keywords:
    {{keywordSamples}}

    Provide:
    1. A 2-3 sentence executive summary of the content gap situation
    2. The top 3 most impactful actions to improve citation rate
    3. Which competitor poses the biggest threat and why
  `,

  KEYWORD_DEEP_DIVE: `
    Analyze why this brand might not be getting cited for this keyword.

    Keyword: {{keyword}}
    Brand: {{brandName}}

    AI Overview Content:
    {{aioMarkdown}}

    Currently cited sources:
    {{citedSources}}

    Provide:
    1. What type of content is being cited (format, depth, angle)
    2. Why the brand might be missing (specific gaps)
    3. Recommended content changes to get cited
    4. Estimated difficulty (easy/medium/hard)
  `,

  COMPETITOR_ANALYSIS: `
    Analyze this competitor's citation success.

    Competitor: {{competitorDomain}}
    Keywords where they're cited: {{citationCount}}
    Average rank: {{avgRank}}

    Sample keywords and their content:
    {{samples}}

    What is this competitor doing well that earns citations?
  `
};
```

#### 3.2 API Endpoints

**New file: `app/api/gap-analysis/ai/route.ts`**

```typescript
// POST /api/gap-analysis/ai
// Body: { projectId, sessionId, analysisType, targetKeyword? }
// Returns: AI-generated analysis

// analysisType options:
// - 'summary': Overall gap analysis summary
// - 'keyword': Deep dive on specific keyword
// - 'competitor': Analyze specific competitor's success
// - 'recommendations': Prioritized action items
```

**New file: `app/api/gap-analysis/ai/stream/route.ts`**

```typescript
// POST /api/gap-analysis/ai/stream
// Same as above but streams response for better UX
// Uses Server-Sent Events or ReadableStream
```

#### 3.3 Content Fetching (Optional Enhancement)

**New file: `lib/content-fetcher.ts`**

```typescript
// Fetches actual content from cited URLs for deeper analysis

interface FetchedContent {
  url: string;
  title: string;
  headings: string[];
  wordCount: number;
  hasTable: boolean;
  hasList: boolean;
  hasImages: boolean;
  publishDate?: string;
  snippet: string; // First ~500 chars
}

export async function fetchCitedContent(url: string): Promise<FetchedContent>;

// Batch fetch with rate limiting
export async function fetchMultipleContent(
  urls: string[],
  options: { maxConcurrent: number; timeout: number }
): Promise<FetchedContent[]>;
```

#### 3.4 UI Components

**New file: `components/dashboard/AIInsights.tsx`**

```typescript
// Container for AI-generated insights
// Shows:
// - Executive summary (auto-generated on load or manual trigger)
// - Streaming response display
// - Action items checklist
// - "Regenerate" button
```

**New file: `components/dashboard/KeywordDeepDive.tsx`**

```typescript
// Modal/drawer for deep keyword analysis
// Triggered by clicking "Analyze" on a gap keyword
// Shows:
// - Loading state while AI analyzes
// - Structured recommendations
// - Competitor comparison
// - Suggested content outline
```

**New file: `components/ui/StreamingText.tsx`**

```typescript
// Reusable component for streaming AI responses
// Shows typing indicator, handles markdown rendering
```

---

## Database Changes

### New Tables (Optional - for caching/history)

```sql
-- Cache AI analysis results
CREATE TABLE ai_analysis_cache (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,  -- 'summary' | 'keyword' | 'competitor'
  target_id TEXT,               -- keyword or competitor domain
  prompt_hash TEXT NOT NULL,    -- To detect if reanalysis needed
  result TEXT NOT NULL,         -- JSON result
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES check_sessions(id) ON DELETE CASCADE
);

-- Track AI usage for rate limiting (optional)
CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

---

## UI/UX Design

### Gap Analysis Tab Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Content Gap Analysis                                    [📊 Export CSV] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │     47       │ │    39%       │ │  monday.com  │ │    2.3       │   │
│  │  Gap Keywords│ │  Gap Rate    │ │ Top Gap Comp │ │  Avg Gap Rank│   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 AI INSIGHTS                                    [Regenerate ↻] │   │
│  │                                                                   │   │
│  │ Your brand is missing from 39% of AI Overview citations.         │   │
│  │ monday.com dominates in comparison keywords, appearing 3x more   │   │
│  │ often than you. Priority actions:                                │   │
│  │                                                                   │   │
│  │ 1. ☐ Create comparison pages for "vs" keywords (23 affected)     │   │
│  │ 2. ☐ Update pricing page with 2024 data (18 affected)            │   │
│  │ 3. ☐ Add feature comparison tables to product pages              │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ DETECTED PATTERNS                                                │   │
│  │                                                                   │   │
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │   │
│  │ │ 📊 Comparisons  │ │ 💰 Pricing      │ │ 📅 Freshness    │     │   │
│  │ │ 23 keywords     │ │ 18 keywords     │ │ 12 keywords     │     │   │
│  │ │ need vs pages   │ │ cite pricing    │ │ cite 2024 data  │     │   │
│  │ └─────────────────┘ └─────────────────┘ └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ GAP KEYWORDS                                   [Filter ▾] [Sort ▾] │   │
│  │                                                                   │   │
│  │  Keyword                    Top Competitors           Actions     │   │
│  │  ─────────────────────────────────────────────────────────────   │   │
│  │  best crm software 2024    hubspot, salesforce, zoho  [Analyze]  │   │
│  │  project management vs     monday, asana, clickup     [Analyze]  │   │
│  │  free invoicing tool       wave, zoho, freshbooks     [Analyze]  │   │
│  │  ...                                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Keyword Deep Dive Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Deep Analysis: "best crm software 2024"                           [×] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Currently Cited Sources:                                               │
│  1. HubSpot (hubspot.com/crm) - Rank #1                                │
│  2. Salesforce (salesforce.com/products) - Rank #2                     │
│  3. Zoho (zoho.com/crm/comparison) - Rank #3                           │
│                                                                         │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                         │
│  🤖 AI Analysis                                                         │
│                                                                         │
│  WHY YOU'RE NOT CITED:                                                  │
│  The AI Overview prioritizes sources with:                              │
│  • Comprehensive feature comparison tables                              │
│  • Recent 2024 pricing information                                      │
│  • User review aggregations                                             │
│                                                                         │
│  Your current CRM page lacks a comparison table and hasn't been         │
│  updated since 2023.                                                    │
│                                                                         │
│  RECOMMENDED ACTIONS:                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ 1. Add feature comparison table                      [Easy]       │ │
│  │    Compare your CRM vs HubSpot, Salesforce, Zoho on key features │ │
│  │                                                                   │ │
│  │ 2. Update with 2024 pricing                          [Easy]       │ │
│  │    Add current pricing tier information                          │ │
│  │                                                                   │ │
│  │ 3. Add G2/Capterra review summary                    [Medium]     │ │
│  │    Include aggregated ratings from review platforms              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  SUGGESTED CONTENT OUTLINE:                                             │
│  • H1: Best CRM Software for [Your Target] in 2024                     │
│  • H2: Feature Comparison Table                                         │
│  • H2: Pricing Breakdown                                                │
│  • H2: What Users Say (Reviews)                                         │
│  • H2: Why Choose [Your Brand]                                          │
│                                                                         │
│                                              [Copy Outline] [Close]     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure Summary

```
nextjs-aio/
├── app/
│   └── api/
│       └── gap-analysis/
│           ├── route.ts              # Phase 1: Basic gap analysis
│           └── ai/
│               ├── route.ts          # Phase 3: AI analysis
│               └── stream/
│                   └── route.ts      # Phase 3: Streaming AI
│
├── components/
│   └── dashboard/
│       ├── GapAnalysis.tsx           # Phase 1: Main container
│       ├── GapSummaryCards.tsx       # Phase 1: Summary stats
│       ├── GapKeywordsTable.tsx      # Phase 1: Gap keywords list
│       ├── GapPatterns.tsx           # Phase 2: Pattern display
│       ├── AIInsights.tsx            # Phase 3: AI recommendations
│       ├── KeywordDeepDive.tsx       # Phase 3: Deep analysis modal
│       └── StreamingText.tsx         # Phase 3: Streaming display
│
├── lib/
│   ├── gap-analysis.ts               # Phase 1: Gap analysis logic
│   ├── pattern-detection.ts          # Phase 2: Pattern detection
│   ├── content-fetcher.ts            # Phase 3: URL content fetching
│   └── ai/
│       ├── provider.ts               # Phase 3: LLM abstraction
│       └── prompts.ts                # Phase 3: Prompt templates
│
└── docs/
    └── CONTENT_GAP_ANALYZER_PLAN.md  # This document
```

---

## Environment Variables

```bash
# Required for Phase 3 (AI features)
OPENAI_API_KEY=sk-...          # Option 1: OpenAI
# OR
ANTHROPIC_API_KEY=sk-ant-...   # Option 2: Anthropic Claude

# Optional configuration
AI_PROVIDER=openai              # 'openai' | 'anthropic' | 'local'
AI_MODEL=gpt-4o                 # Model to use
AI_MAX_TOKENS=2000              # Max response tokens
AI_RATE_LIMIT_PER_HOUR=100      # Rate limit per user
```

---

## Implementation Order

### Sprint 1: Foundation (Phase 1)
- [ ] Create `lib/gap-analysis.ts` with core analysis functions
- [ ] Create `/api/gap-analysis` endpoint
- [ ] Build `GapAnalysis.tsx` main component
- [ ] Build `GapSummaryCards.tsx` for stats display
- [ ] Build `GapKeywordsTable.tsx` for keyword list
- [ ] Add "Content Gaps" tab to project dashboard
- [ ] Test with existing project data

### Sprint 2: Patterns (Phase 2)
- [ ] Create `lib/pattern-detection.ts`
- [ ] Build `GapPatterns.tsx` component
- [ ] Add pattern recommendations (hardcoded, no AI)
- [ ] Add filtering by pattern type
- [ ] Test pattern detection accuracy

### Sprint 3: AI Integration (Phase 3)
- [ ] Set up AI provider abstraction (`lib/ai/provider.ts`)
- [ ] Create prompt templates (`lib/ai/prompts.ts`)
- [ ] Build `/api/gap-analysis/ai` endpoint
- [ ] Build `AIInsights.tsx` component
- [ ] Implement streaming responses
- [ ] Build `KeywordDeepDive.tsx` modal
- [ ] Add rate limiting / caching
- [ ] Test with real LLM

### Sprint 4: Polish
- [ ] Add CSV export for gap analysis
- [ ] Add comparison between sessions (gap trends)
- [ ] Optimize performance (lazy loading, pagination)
- [ ] Add loading states and error handling
- [ ] User testing and feedback iteration

---

## Cost Considerations

### LLM API Costs (Phase 3)

**Per analysis (estimated):**
- Summary analysis: ~1,500 tokens = ~$0.015 (GPT-4o)
- Keyword deep dive: ~2,000 tokens = ~$0.02 (GPT-4o)
- Competitor analysis: ~2,000 tokens = ~$0.02 (GPT-4o)

**Mitigation strategies:**
1. Cache results for 24 hours
2. Rate limit: 50 AI analyses per user per day
3. Use GPT-4o-mini for summaries (~10x cheaper)
4. Batch multiple keywords in single analysis

---

## Success Metrics

1. **Adoption:** % of users who view Content Gaps tab
2. **Engagement:** # of deep analyses triggered per user
3. **Actionability:** # of recommendations marked as "done" (future feature)
4. **Retention:** Do users with gap analysis return more often?

---

## Future Enhancements

1. **Content comparison:** Upload your URL to compare against cited content
2. **Automated monitoring:** Alert when gap % increases
3. **Content generation:** Generate draft content based on recommendations
4. **Integration:** Push tasks to project management tools (Asana, Linear)
5. **Historical trends:** Track gap improvement over time

---

## Questions to Resolve

1. Which LLM provider to use? (OpenAI vs Anthropic)
2. Should AI features be gated/premium?
3. How aggressive should rate limiting be?
4. Should we store AI analysis history?
5. Do we need content fetching, or is AIO markdown enough?

---

*Last updated: December 2024*
*Status: Planning*
