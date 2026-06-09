# HeaderGuard — Website Security Header Scanner

A full-stack Next.js application for scanning HTTP security headers and generating detailed security reports.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB via Mongoose
- **Styling**: Tailwind CSS
- **Icons**: React Icons

## Features

- Scan any public domain or URL for security headers
- Analyze 8 critical HTTP security headers with severity ratings
- Score (0–100) and letter grade (A+, A, B, C, D, F) based on header configuration
- Actionable recommendations for missing or weak headers
- Persistent scan history stored in MongoDB
- Privacy-masked domain names in history (e.g. `example.com → ex*****.com`)
- Detailed individual scan result pages
- Responsive dark-theme UI

## Headers Analyzed

| Header | Weight | Severity |
|---|---|---|
| Content-Security-Policy | 25 | Critical |
| Strict-Transport-Security | 20 | High |
| X-Frame-Options | 10 | High |
| X-Content-Type-Options | 10 | Medium |
| Referrer-Policy | 5 | Medium |
| Permissions-Policy | 10 | Medium |
| Cross-Origin-Opener-Policy | 10 | Medium |
| Cross-Origin-Resource-Policy | 10 | Medium |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── scan/
│   │   │   ├── route.js          # POST /api/scan
│   │   │   └── [id]/route.js     # GET /api/scan/:id
│   │   └── history/
│   │       └── route.js          # GET /api/history
│   ├── history/
│   │   └── page.js               # Scan history page
│   ├── scan/
│   │   └── [id]/page.js          # Individual scan detail
│   ├── globals.css
│   ├── layout.js
│   └── page.js                   # Homepage / scanner
├── components/
│   ├── HeaderCard.jsx             # Expandable header result card
│   ├── HistoryTable.jsx           # Scan history table
│   ├── Navbar.jsx                 # Top navigation bar
│   ├── ScannerForm.jsx            # URL input + scan trigger
│   ├── ScanResults.jsx            # Full scan results display
│   └── ScoreGauge.jsx             # SVG score ring gauge
└── lib/
    ├── analyzer.js                # Header analysis logic
    ├── mongodb.js                 # MongoDB connection
    └── models/
        └── Scan.js                # Mongoose scan schema
```

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd header-scanner
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/header_scanner?retryWrites=true&w=majority
```

**MongoDB Atlas setup:**
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP (or use `0.0.0.0/0` for dev)
4. Copy the connection string into `.env.local`

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for production

```bash
npm run build
npm start
```

## Deployment (Vercel)

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add `MONGODB_URI` in Environment Variables
4. Deploy

## Score Calculation

| Score | Grade |
|---|---|
| 90–100 | A+ |
| 80–89 | A |
| 70–79 | B |
| 60–69 | C |
| 50–59 | D |
| < 50 | F |

Each header is weighted. A correctly configured header earns full weight; a weak header earns 30% weight; a missing header earns 0.

## Domain Masking

Scan history masks domain names for privacy:

- `example.com` → `ex*****.com`
- `api.zyloch.dev` → `api.zy*****.dev`
- `google.com` → `go*****.com`

The full URL is stored in MongoDB but only the masked version is returned from the `/api/history` endpoint.
