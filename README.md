# Smart Swachh

Vite + React app — 3 portals (Citizen / Worker / Admin), Supabase (auth +
database + storage) aur Gemini (AI photo analysis) ke saath.

## 1. Install

```bash
npm install
```

## 2. Supabase project banao
1. https://supabase.com par free project banao.
2. **Settings → API** se copy karo: **Project URL** aur **anon public key**.
3. **Authentication → Providers → Email** me, testing ke liye
   **"Confirm email" OFF** kar do (production me wapas ON kar dena).
4. **SQL Editor** me `supabase-schema.sql` ka poora content paste karke
   **Run** karo — isse tables, storage bucket, security rules, aur
   `complete_report()` function ban jaate hain.

## 3. Gemini API key
https://aistudio.google.com/apikey se free key le lo (photo analyze karne
ke liye use hoti hai).

## 4. Environment variables
```bash
cp .env.example .env
```
Fir `.env` file me apni real values bharo:
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_GEMINI_API_KEY=AIzaSy...
```

## 5. Run locally

```bash
npm run dev
```

Browser me `http://localhost:5173` khul jaayega.

## 6. Apna admin account banao
Admin ke liye alag signup form nahi hai (koi bhi khud ko admin nahi bana
sakta). Isliye:

1. App me **Sign up** → koi bhi role (Citizen/Worker) chuno → in details se
   account banao:
   - Email: `amansingh28888@gmail.com`
   - Password: `Aman@2004`
2. Supabase → **SQL Editor** me yeh ek baar chalao:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'amansingh28888@gmail.com';
   ```
3. App se logout → dobara login karo → **Admin dashboard** khul jaayega.

Baaki koi bhi citizen apna account khud bana sakta hai (Sign up → Citizen),
aur koi bhi worker apna account khud bana sakta hai (Sign up → Worker).

## 7. Vercel par deploy

```bash
npm run build   # sirf check karne ke liye ki build clean hai
```

Fir Vercel par:
1. Is folder ko GitHub repo me push karo (ya `vercel` CLI se seedha deploy
   karo — `npx vercel`).
2. Vercel dashboard me "New Project" → apna repo import karo. Vercel
   khud Vite detect kar lega (Build command: `npm run build`, Output:
   `dist`).
3. **Environment Variables** me wahi 3 keys daalo jo `.env` me daali thi
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`) —
   Vercel project settings → Environment Variables se.
4. Deploy karo. Live URL mil jaayegi.

> Security note: yeh keys client-side bundle me chali jaati hain (Vite ka
> normal behaviour hai `VITE_` prefix wale vars ke liye) — hackathon/demo
> ke liye theek hai. Production-grade app me Gemini call ko Supabase Edge
> Function ke peeche daalna chahiye taaki API key browser me expose na ho.

## App ka structure

```
src/
  main.jsx              # entry point
  App.jsx                # role-based routing (citizen/worker/admin)
  supabaseClient.js       # Supabase client (env vars se)
  lib/
    config.js             # points rate, admin email, etc.
    gemini.js              # Gemini vision API call
    location.js            # browser geolocation + reverse geocode
  context/
    AuthContext.jsx        # session + profile state, login/signup/logout
  pages/
    AuthPage.jsx            # login/signup screen
    CitizenDashboard.jsx     # report problem, my reports, withdraw points
    WorkerDashboard.jsx      # assigned tasks, mark complete
    AdminDashboard.jsx       # assign workers, approve withdrawals
  components/
    ReportCard.jsx, ReportModal.jsx, CompleteModal.jsx, Stepper.jsx
supabase-schema.sql   # run once in Supabase SQL Editor
```

## Flow (jo aapne bataya, wahi hai)
1. **Citizen** waste dikhne par photo click karta hai → "Analyze with AI" →
   Gemini waste type, category, suggested dustbin, tips, description
   nikaalta hai (sab editable) → app khud location fetch karta hai → Submit.
2. Report Supabase me save → status **Pending** → **Admin** dashboard par
   dikhta hai.
3. Admin dropdown se **Worker** assign karta hai → status **Assigned**.
4. Worker "Start work" (status **In progress**) → kaam poora karke "Mark
   complete" → after-photo upload → status **Completed**.
5. Completion ke saath citizen ko points (default 10/report, `.env` me
   `VITE_POINTS_PER_REPORT` se badal sakte ho) automatically mil jaate hain
   — teeno dashboard turant update.
6. Citizen apne points withdraw request bana sakta hai (min 50 points,
   1 point = ₹0.5 — `.env` se dono badal sakte ho); Admin Approve/Reject
   karta hai.

## Aage badha sakte ho
- Points → real UPI payout (Razorpay Payouts jaisa kuch)
- Gemini call ko Supabase Edge Function ke peeche daalna (key hide karne ke liye)
- Push notifications jab status change ho
- Worker ke liye map/route view
- Duplicate report detection (same location + waste type)
