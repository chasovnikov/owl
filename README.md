# OWL 

AI-powered Instagram content hypothesis testing for small businesses.

## What it does

1. **Create a project** — choose your business type (cafe, restaurant, etc.)
2. **Generate hypotheses** — AI gives you 10 content ideas, pick 3 to test
3. **Generate content plan** — AI writes 5 posts per hypothesis with scripts, captions & hashtags
4. **Post manually on Instagram** — use the generated content
5. **Enter metrics** — input views, likes, comments, saves
6. **AI Analysis** — get a clear recommendation on what worked

---

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd instatest
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `OPENAI_API_KEY` — your OpenAI API key (get one at platform.openai.com)

### 3. Set up database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
4. Deploy ✓

> **Database on Vercel**: Use [Neon](https://neon.tech) (free tier), [Supabase](https://supabase.com), or [Railway](https://railway.app) for PostgreSQL.

---

## Tech Stack

- **Next.js 14** — App Router + Server Actions
- **TypeScript** — full type safety
- **Tailwind CSS** — styling
- **Prisma** — ORM
- **PostgreSQL** — database
- **OpenAI GPT-4o** — hypothesis generation, content planning, analysis

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Projects list
│   ├── project/[id]/page.tsx # Project + hypotheses
│   └── hypothesis/[id]/page.tsx # Content plan + results
├── components/
│   ├── LoginForm.tsx
│   ├── HypothesisGenerator.tsx
│   ├── PostCard.tsx
│   ├── PostIdeasGenerator.tsx
│   └── AnalysisPanel.tsx
└── lib/
    ├── actions.ts  # Server Actions
    ├── openai.ts   # AI functions
    ├── prisma.ts   # DB client
    └── auth.ts     # Simple email auth
prisma/
└── schema.prisma   # Full data model
```

---

## Authentication

Simple email-based auth (no password, no OAuth). Enter email → session cookie set → logged in. Not production-secure, but perfect for MVP.

For production: replace with [NextAuth.js](https://next-auth.js.org) magic links.
