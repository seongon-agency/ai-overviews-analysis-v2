# Changelog

All notable changes to this project will be documented in this file.

---

## [2.1.0] - 2024-12-03 - Dashboard Improvements & Data Consistency

### Added
- **Session-aware Dashboard**: Dashboard now analyzes the currently selected session instead of always using the latest session
- **Session indicator**: Dashboard header shows which session is being analyzed with visual indicator for past sessions
- **Domain links**: External link icons in Competitor Table to visit competitor domains directly
- **PostgreSQL Support**: Application now supports PostgreSQL for production deployment (Railway)
- **Database Abstraction Layer**: Unified `lib/database.ts` that auto-switches between SQLite (local) and PostgreSQL (production)
- **Brand Name Highlighting**: Brand mentions in AI Overview content are now highlighted in yellow

### Changed
- **Dashboard UI Redesign**:
  - Summary cards with colored backgrounds and better visual hierarchy
  - Competitor chart shows only citations (cleaner single-bar design)
  - Competitor table with rank badges (gold/silver/bronze for top 3)
  - Citation rate pills with color coding (green ≥30%, blue ≥10%)
  - Brand performance card with gradient header and centered stat cards
- **Competitor Table**: Removed mentions/mention rate columns for competitors (displayed for user's brand only)
- **Brand matching**: Now uses Unicode-aware word boundary detection
- All API routes updated to async/await pattern for database operations

### Fixed
- **Brand mention consistency**: Dashboard now uses same cleaned markdown logic as Keywords tab
  - Previously detected brand in raw markdown (including URLs) causing false positives
  - Now uses `cleanMarkdownForTextAnalysis()` to strip citations/URLs before detection
- **Session data mismatch**: Dashboard and Keywords tab now always show data from the same selected session
- **Brand detection case sensitivity**: "NOVAGEN" and "Novagen" now both detected correctly
- **Brand highlighting in formatted text**: Highlights now work inside bold/code markdown

### Removed
- Settings button from sidebar (was non-functional)
- Mentions bar from competitor chart
- Mentions columns from competitor table (for non-user brands)

---

## [2.0.0] - 2024-12-02 - Historical Session Tracking

### Major Features Added

#### Session-Based Historical Tracking
- **Check Sessions**: Each keyword fetch or JSON upload now creates a timestamped "session"
- **Session Comparison**: Compare 2+ sessions side-by-side in a matrix view
- **Keyword Timeline**: Click any keyword to see its history across all sessions
- **Change Detection**: Automatic detection of rank improvements, AIO gains/losses, new/removed keywords

#### New Database Schema
- Added `check_sessions` table for session metadata
- Renamed `keywords` → `keyword_results` with `session_id` foreign key
- Automatic migration of existing data to "Migrated Data" session

#### New API Routes
- `GET/POST /api/sessions` - List and create sessions
- `GET/PATCH/DELETE /api/sessions/[id]` - Session CRUD operations
- `GET/POST /api/sessions/compare` - Multi-session comparison

#### New UI Components
- `SessionList` - Session sidebar with selection, rename, delete, compare mode
- `SessionComparison` - Matrix view comparing keywords across sessions
- `KeywordTimeline` - Historical timeline for individual keywords

### Bug Fixes
- Fixed citation-to-paragraph matching (now uses URL domain matching instead of citation number)
- Fixed markdown table rendering in AI Overview content
- Removed DataForSEO CDN images from AI Overview display
- Fixed slide-out panel layout (now centered modal with citations on right)

### UI Improvements
- Redesigned project page with sessions sidebar
- Added session stats (keyword count, AIO count, rate)
- Brand highlighting in dashboard charts and tables
- Clickable keywords to view history

---

## [1.0.0] - 2024-12-01 - Initial Next.js Migration

### Features
- Migrated from Streamlit to Next.js 14 with App Router
- SQLite database for persistent storage
- Interactive citation linking (hover/click to highlight sources)
- Competitor analysis dashboard with charts
- CSV export functionality
- DataForSEO API integration
- JSON file upload support
