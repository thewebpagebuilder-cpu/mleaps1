# MLEAPS Six Sigma Assessment Platform 🎯

A modern, high-performance web platform for Six Sigma assessments, timed candidate examinations, automated scoring, real-time analytics, and admin evaluation.

---

## ✨ Features

- **Candidate Exam Arena**: Secure, timed examination experience with proctored interface and dynamic question randomization.
- **Admin Command Center**: Real-time management of question banks, candidate invitations, access window schedules, and submission reviews.
- **Comprehensive Analytics & Scorecards**: Six Sigma DMAIC competency breakdowns, bell-curve distribution visualizations, and instant performance feedback.
- **Robust Persistence**: Drizzle ORM integrated with PostgreSQL for ACID transactions, auto-seeding, and seamless schema migrations.
- **Production-Ready Next.js 16**: App Router architecture with Tailwind CSS styling and responsive layouts.

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js 18+ (tested with Node 20 / 24)
- PostgreSQL database instance (local or hosted on Neon, Supabase, Vercel Postgres, etc.)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/thewebpagebuilder-cpu/mleaps1.git
cd mleaps1
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@host:5432/mleaps?sslmode=require
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub: `https://github.com/thewebpagebuilder-cpu/mleaps1`
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import the `mleaps1` repository.
4. In **Project Settings** -> **Environment Variables**, add:
   - `DATABASE_URL`: Your PostgreSQL connection string (Neon / Supabase / Vercel Postgres / Tembo).
5. Click **Deploy**. Vercel will automatically build and deploy the Next.js application.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Database Driver**: `pg` (Node Postgres)
- **Icons**: `lucide-react`
