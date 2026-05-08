# Pizza Hut Coupon Frontend

Next.js app for browsing Pizza Hut coupons from Supabase.

## Requirements

- Node.js 20+
- npm 10+

## Setup

1. Install dependencies:
   `npm install`
2. Create `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
3. Start dev server:
   `npm run dev`

## Scripts

- `npm run dev`: start local development server
- `npm run build`: build production bundle
- `npm run start`: run production server
- `npm run lint`: run ESLint

## Notes

- Supabase temporary files under `supabase/.temp/` are local metadata and should not be committed.
- This app renders the homepage statically and revalidates every hour (`revalidate = 3600`).
