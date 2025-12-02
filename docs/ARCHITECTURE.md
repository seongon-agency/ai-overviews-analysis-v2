# Architecture Documentation

## Overview

AI Overviews Analysis is a Next.js application for tracking and analyzing Google AI Overview citations across keywords over time.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite via better-sqlite3
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Language**: TypeScript

## Directory Structure

```
nextjs-aio/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── projects/         # Project CRUD
│   │   ├── sessions/         # Session management & comparison
│   │   ├── fetch-keywords/   # DataForSEO integration
│   │   ├── upload/           # JSON file upload
│   │   └── analyze/          # Competitor analysis
│   ├── project/[id]/         # Project pages
│   │   ├── page.tsx          # Main project view
│   │   └── dashboard/        # Analysis dashboard
│   ├── page.tsx              # Home page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/               # React Components
│   ├── sessions/             # Session-related components
│   │   ├── SessionList.tsx
│   │   ├── SessionComparison.tsx
│   │   └── KeywordTimeline.tsx
│   ├── dashboard/            # Dashboard components
│   │   ├── SummaryCards.tsx
│   │   ├── CompetitorTable.tsx
│   │   └── CompetitorChart.tsx
│   ├── KeywordsTable.tsx     # Main keywords table
│   ├── KeywordPanel.tsx      # AI Overview detail modal
│   ├── AIOContent.tsx        # Markdown renderer with citations
│   ├── CitationBadge.tsx     # Interactive citation badges
│   └── CitationList.tsx      # Citation sources list
├── lib/                      # Utilities & Business Logic
│   ├── db.ts                 # Database operations
│   ├── types.ts              # TypeScript interfaces
│   ├── dataforseo.ts         # DataForSEO API client
│   ├── analysis.ts           # Competitor analysis logic
│   └── parse-citations.ts    # Citation parsing utilities
├── data/                     # SQLite database files
│   └── aio-analysis.db
└── docs/                     # Documentation
```

## Database Schema

### Tables

```sql
-- Projects table
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand_name TEXT,
  brand_domain TEXT,
  location_code TEXT,
  language_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Check sessions table (NEW in v2.0)
CREATE TABLE check_sessions (
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

-- Keyword results table (renamed from 'keywords' in v2.0)
CREATE TABLE keyword_results (
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
```

### Relationships

```
Project (1) ──< (N) CheckSession (1) ──< (N) KeywordResult
```

## API Routes

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project with sessions and latest keywords
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Sessions
- `GET /api/sessions?projectId=X` - List sessions for project
- `POST /api/sessions` - Create session
- `GET /api/sessions/[id]` - Get session with keywords
- `PATCH /api/sessions/[id]` - Update session (rename)
- `DELETE /api/sessions/[id]` - Delete session
- `GET /api/sessions/compare?projectId=X&sessionIds=1,2,3` - Compare sessions (matrix)
- `POST /api/sessions/compare` - Compare two sessions (change detection)

### Data Operations
- `POST /api/fetch-keywords` - Fetch from DataForSEO (creates session)
- `POST /api/upload` - Upload JSON file (creates session)
- `GET/POST /api/analyze` - Run competitor analysis

## Key Components

### AIOContent
Renders AI Overview markdown with interactive citation badges.
- Parses `[[n]](url)` citation format
- Matches citations to sources by URL domain (not by number)
- Supports tables, headers, lists, code blocks
- Removes DataForSEO CDN images

### SessionComparison
Matrix view for comparing multiple sessions.
- Keywords as rows, sessions as columns
- Shows AIO status and brand rank per cell
- Change indicators (improved/declined/gained/lost)
- Filtering and sorting options

### KeywordTimeline
Historical view for a single keyword.
- Visual timeline of all checks
- Change detection between sessions
- Detailed view with references

## Data Flow

### Fetching Keywords
```
User Input → /api/fetch-keywords → DataForSEO API → Create Session → Save Results → Update UI
```

### Viewing Keywords
```
Select Session → /api/sessions/[id] → Parse References → Calculate Brand Rank → Display Table
```

### Comparing Sessions
```
Select Sessions → /api/sessions/compare → Build Matrix → Calculate Changes → Display Comparison
```

## Citation Matching Logic

Citations in AI Overview markdown use format `[[n]](url)` where:
- `n` is a display number (NOT reliable for matching)
- `url` is the source URL

Matching process:
1. Extract domain from citation URL
2. Extract domain from each reference in the references array
3. Match by domain similarity (includes/contains check)
4. Return the matched reference's rank (1-indexed position)

```typescript
// Example: [[1]](https://example.com/page)
// Matches reference with domain "example.com"
// Returns that reference's rank, not "1"
```
