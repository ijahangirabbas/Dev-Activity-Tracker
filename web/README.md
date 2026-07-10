# Dev Activity Tracker - Premium Web Dashboard

This repository contains the Next.js web application and SaaS landing page for the **Developer Activity & Coding Analytics** tracker. It interfaces directly with your Supabase database instance to visualize local development stats synced from the VS Code extension.

---

## 🚀 Features Included

*   **SaaS Landing Page**: Sleek dark-themed website highlighting heuristic classifications, privacy hashing, offline storage, and cloud sync mechanisms.
*   **Secure Auth Portal**: Sign up, verify email, sign in, or trigger password recovery using Supabase Auth (Email, Google, GitHub).
*   **Productivity Dashboard**:
    *   **Goal Rings**: SVG animated status rings tracing daily target hours.
    *   **Yearly Heatmap**: Contribution grid of sessions over the last 365 days.
    *   **Breakdowns**: Time segments logged across individual categories.
    *   **Timeline History**: Scrolling log of branch changes, commits, saves, and test runs.
*   **Workspace Details**: Deep inspection of active repository logs, branch lists, and language splits.
*   **File Analytics**: Fuzzy searchable table showing active hours, read/edit counts, and relative workspace paths.
*   **Terminals & AI**: Intercepted command logs mapped by category alongside AI assistant multiplier rates.
*   **Sync Settings**: Displays your Auth User ID and database URL coordinates to link with your local VS Code configuration.

---

## 📂 Folder Structure

```bash
/web
├── app/                  # Next.js App Router (Public, Auth, Dashboard routes)
│   ├── (auth)/           # Recovery portals, Signups, Logins
│   ├── (dashboard)/      # Protected workspaces, files, settings dashboard views
│   ├── auth/             # Server routes for OAuth callback exchange
│   └── globals.css       # Tailwind CSS v4 custom variables and class layers
├── components/           # UI Presentation Layer
│   ├── ui/               # Core Radix-based primitives (buttons, inputs)
│   ├── landing/          # Hero panels, timelines, accordion FAQs
│   └── dashboard/        # Heatmaps, SVG rings, feeds, charts
├── hooks/                # React Query caching query managers
├── lib/                  # Axios Rest clients, Supabase clients, math helpers
└── types/                # TypeScript schema interfaces
```

---

## 🛠️ Installation & Local Setup

### 1. Prerequisites
Ensure you have the following installed:
*   Node.js (v18.0.0 or higher)
*   npm (v9.0.0 or higher)
*   A running Supabase Database (run the sql schema migration in `supabase/migration.sql` in your Supabase SQL Editor).

### 2. Install Dependencies
Clone the repository, navigate into the `/web` subdirectory, and install the modules:
```bash
cd web
npm install --legacy-peer-deps
```
*(Note: `--legacy-peer-deps` is recommended to bypass peer conflicts with React 19).*

### 3. Environment Configurations
Create a `.env.local` file in `/web`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run Development Server
Boot up the local dev server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔗 Connecting VS Code Extension

1.  Sign up for an account on the Web Dashboard.
2.  Navigate to **Settings** in the dashboard and copy your **Supabase Auth User ID**.
3.  Open VS Code settings (`Ctrl + ,` / `Cmd + ,`).
4.  Configure the following settings:
    *   `devActivityTracker.supabaseUrl`: Your database URL.
    *   `devActivityTracker.supabaseUserId`: Paste your copied Auth User ID.
    *   `devActivityTracker.supabaseServiceKey`: Your database secret `service_role` key (found under your Supabase Dashboard settings -> API).
5.  All sessions will now automatically sync to your web dashboard!

---

## 🚀 Deployment Guide

### Vercel (Recommended)
1.  Push the project code to a Git provider (GitHub, GitLab, Bitbucket).
2.  Log into Vercel and click **Add New Project**.
3.  Import the repository and set the **Root Directory** as `web`.
4.  Under Environment Variables, declare:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5.  Click **Deploy**. Vercel will build and distribute the app onto edge routes automatically.
