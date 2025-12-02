# User Guide

## Getting Started

### Running the Application

```bash
cd nextjs-aio
npm run dev
```

Open http://localhost:3000 in your browser.

### Environment Setup

Create a `.env.local` file with your DataForSEO credentials:

```
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

## Core Workflows

### 1. Create a Project

1. Click "New Project" on the home page
2. Enter a project name
3. Click "Create"

### 2. Configure Brand Tracking

1. Open your project
2. In "Brand Configuration", enter:
   - **Brand Name**: Your brand name (for mention detection)
   - **Brand Domain**: Your domain (for citation rank tracking)
3. Click "Update"

### 3. Fetch Keywords (Live API)

1. Go to "+ Fetch" tab in the sidebar
2. (Optional) Enter a session name (e.g., "December 2024 Check")
3. Enter keywords (one per line or comma-separated)
4. Set Location Code (e.g., 2704 for Vietnam, 2840 for US)
5. Set Language Code (e.g., "vi", "en")
6. Click "Fetch Keywords"

### 4. Upload JSON Data

1. Go to "+ Upload" tab in the sidebar
2. (Optional) Enter a session name
3. Select your JSON file (DataForSEO format)
4. The file will be processed and a new session created

### 5. View AI Overviews

1. Select a session from the sidebar
2. Click "View" on any keyword with AI Overview
3. The modal shows:
   - AI Overview content (left side)
   - Citation sources (right side)
4. Hover over citation badges to highlight the source
5. Click badges to scroll to and highlight the source

### 6. Track History Over Time

**View Keyword Timeline:**
1. Click on any keyword name in the table
2. See all historical checks for that keyword
3. View changes between sessions

**Compare Sessions:**
1. Click "Compare Sessions" in the sidebar
2. Check 2 or more sessions to compare
3. Click "Compare X Sessions"
4. View the comparison matrix showing:
   - AIO status per session
   - Brand rank changes
   - New/removed keywords

### 7. Analyze Competitors

1. Click "View Dashboard" in the header
2. Enter brand name and domain (if not set)
3. Click "Run Analysis"
4. View:
   - Summary cards (keywords, AIO rate, competitors)
   - Bar chart (citations vs mentions)
   - Competitor table (sortable)
   - Your brand performance summary

### 8. Export Data

In the Dashboard:
- Click "Export Keywords CSV" for keyword-level data
- Click "Export Competitors CSV" for competitor metrics

## Understanding the Data

### AI Overview Status
- **Has AIO (✓)**: Google shows an AI Overview for this keyword
- **No AIO (-)**: No AI Overview present

### Brand Rank
- **#1, #2, etc.**: Your brand's position in AI Overview citations
- **-**: Your brand is not cited in the AI Overview

### Session Comparison Indicators
- **↑ (Green)**: Rank improved from previous session
- **↓ (Red)**: Rank declined from previous session
- **+AIO (Blue)**: Keyword gained AI Overview
- **-AIO (Orange)**: Keyword lost AI Overview
- **New (Purple)**: Keyword added in newer session
- **Removed (Gray)**: Keyword not in newer session

### Competitor Metrics
- **Citations**: Number of times cited in AI Overviews
- **Mentions**: Number of times mentioned in AI Overview text
- **Avg Rank**: Average citation position (lower is better)
- **Citation Rate**: % of AI Overviews where brand is cited
- **Mention Rate**: % of AI Overviews where brand is mentioned

## Tips

1. **Regular Checks**: Create new sessions periodically (weekly/monthly) to track changes
2. **Consistent Keywords**: Use the same keyword list for meaningful comparisons
3. **Brand Domain**: Make sure to set your brand domain for accurate rank tracking
4. **Session Names**: Use descriptive names like "Jan 2024 Check" for easy identification
5. **Comparison**: Compare your earliest and latest sessions to see overall progress
