# Changelog

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
