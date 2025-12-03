# AI Overviews Analysis - Next.js

A Next.js application for tracking and analyzing Google AI Overview citations across keywords over time.

## Features

### User Authentication (v3.0)
- **Email/Password Auth**: Sign up and sign in with email and password
- **Google OAuth**: Sign in with Google account (optional)
- **Multi-User Support**: Each user has their own isolated projects and data
- **Secure Sessions**: Cookie-based authentication with automatic session refresh

### Core Features
- **AI Overview Detection**: Identify which keywords trigger Google AI Overviews
- **Citation Tracking**: See which sources are cited in AI Overviews
- **Brand Rank Monitoring**: Track your brand's position in AI Overview citations
- **Interactive Citation Viewer**: Click citations in AI Overview text to see source details

### Historical Tracking (v2.0)
- **Session-Based History**: Each keyword check creates a timestamped session
- **Multi-Session Comparison**: Compare 2+ sessions in a matrix view
- **Keyword Timeline**: View individual keyword history across all sessions
- **Change Detection**: Automatic detection of improvements/declines

### Analysis Dashboard
- **Competitor Analysis**: See who gets cited most in AI Overviews
- **Brand Performance**: Track your brand's citation rate, rank, and average position
- **Visual Charts**: Bar charts showing top cited sources
- **CSV Export**: Export data for further analysis
- **Brand Highlighting**: Your brand mentions are highlighted in AI Overview content

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DataForSEO credentials

# Run development server
npm run dev
```

Open http://localhost:3000

## Environment Variables

```bash
# DataForSEO API credentials (Base64 encoded)
SEO_API_KEY=Basic YOUR_BASE64_ENCODED_CREDENTIALS

# PostgreSQL connection (optional - for production)
# If not set, SQLite will be used automatically
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication (required for production)
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **better-auth** - Authentication library with OAuth support
- **SQLite** - Local database via better-sqlite3 (development)
- **PostgreSQL** - Production database via pg (Railway deployment)
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Recharts** - Data visualization
- **TypeScript** - Type safety

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Technical architecture and database schema
- [User Guide](./docs/USER_GUIDE.md) - How to use the application
- [Changelog](./CHANGELOG.md) - Version history and changes

## Project Structure

```
nextjs-aio/
├── app/                  # Next.js pages and API routes
├── components/           # React components
├── lib/                  # Utilities and business logic
├── data/                 # SQLite database
└── docs/                 # Documentation
```

## Key Concepts

### Sessions
Each time you fetch keywords or upload data, a new "session" is created. Sessions allow you to:
- Track the same keywords over time
- Compare results between different dates
- See what changed (improved, declined, gained, lost)

### Citation Matching
AI Overview text contains citations like `[[1]](url)`. The application:
1. Extracts the URL from the citation
2. Matches it to the references list by domain
3. Links the citation badge to the correct source

### Brand Tracking
Set your brand domain to:
- See your rank in AI Overview citations
- Track rank changes over time
- Compare against competitors

## License

MIT
