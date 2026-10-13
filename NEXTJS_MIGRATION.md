# Converting SentinelFlow to Next.js 15 (App Router)

We have included an automated 1-step migration script in this repository.

---

## ⚡ Quick 1-Command Conversion (Local Machine)

In your cloned repository on your local machine, run:

```bash
node scripts/migrate-to-nextjs.mjs
```

This automated script will:
1. Back up your existing `package.json` to `package.json.vite.bak`
2. Update `package.json` to **Next.js 15** + React 18/19
3. Create `next.config.mjs` and `postcss.config.mjs`
4. Generate the `app/` App Router structure:
   - `app/layout.tsx` (Global fonts & meta)
   - `app/globals.css`
   - `app/page.tsx` (Cinematic Sentinel-W Landing page)
   - `app/dashboard/page.tsx`, `app/queue/page.tsx`, `app/findings/page.tsx`, `app/demo/page.tsx`, etc.
5. Create Next.js native Route Handlers for Groq AI:
   - `app/api/ai/status/route.ts`
   - `app/api/ai/explain/route.ts`

---

## 🚀 Running Your Next.js App

After running the script above:

```bash
# 1. Install Next.js dependencies
npm install

# 2. Start the Next.js development server
npm run dev
```

Open **`http://localhost:3000`** in your browser!

---

## 🔑 Adding Your Groq API Key

In `.env`:
```env
PORT=3000
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Next.js automatically protects `GROQ_API_KEY` on the server in `app/api/ai/*` route handlers without leaking it to the browser.
