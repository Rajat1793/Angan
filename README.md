# Angan · अंगन — The Modern Courtyard

A mobile-first apartment-community app that moves gate calls, WhatsApp coordination, paper registers, and manual approvals into one role-based experience for **Residents, Security Guards, and Society Admins**.

> The conversations that used to happen at the society gate now happen inside the app - securely, effortlessly.

Built with **Expo SDK 55** (React Native 0.83, React 19.2) + **Supabase** (Postgres, RLS, Realtime, Storage, Edge Functions). Multi-tenant by design: every row is scoped to a `society_id` and enforced by Row-Level Security.

## Roles

| Role | Can do |
| --- | --- |
| **Resident** | Approve/pre-approve visitors, book amenities, pay dues, raise tickets, vote in polls, read notices, post to the community feed, browse the directory, manage vehicles & frequent visitors, raise SOS |
| **Guard** | Register visitors, verify QR/OTP passes, mark entry/exit, log deliveries, mark daily-help attendance, see SOS alerts |
| **Admin** | Dashboard metrics, resident directory, complaint triage, publish notices/polls/events, upload documents, generate dues, review move-in/out requests |

## Features

### Gate & visitors
- **Live gate loop** — guard registers a visitor → resident approves/denies in **real time** → guard marks entry/exit.
- **Pre-approval passes** — residents generate a QR + OTP guest pass; guards verify (scan or type OTP), offline-friendly.
- **Visitor detail** — photo, status color strip, and a **vertical status timeline** (requested → approved → entered → exited).
- **Offline guard queue** — registrations persist locally and sync automatically on reconnect.
- **Frequent visitors & vehicles** — residents save regulars and register their cars/bikes for faster entry.

### Community & services
- **Community feed** — posts with likes and threaded comments, live-updated via Realtime.
- **Notices** — pinned + categorised society announcements; **polls** with one-vote enforcement.
- **Helpdesk** — tickets with threaded comments and admin triage.
- **Amenities** — slot booking with server-side capacity checks (no double-booking).
- **Directory** — neighbours grouped by tower with colour-initial avatars.
- **Documents & events** — society files and an event calendar with RSVPs.
- **Marketplace & move requests** — buy/sell listings and move-in/out approvals.
- **Emergency SOS** — one-tap alert to guards and admins.

### Payments
- Maintenance **dues** dashboard with a paid-vs-outstanding **donut summary** and tappable **receipt** cards.
- **Razorpay test checkout** in an in-app WebView with **server-side signature verification** (HMAC) before a due is marked paid.
- Admin **bulk dues generation** for a period across occupied flats.

### Notifications
- Server-driven **push** via an Edge Function, with an in-app **Realtime fallback** bell feed.
- Feed **grouped by day** with per-category icons/colours and an unread accent.

## Tech Stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 55 · React Native 0.83 · React 19.2 · TypeScript · Expo Router (typed routes, new architecture) |
| UI | NativeWind v4 (Tailwind) · Reanimated · Gesture Handler · @gorhom/bottom-sheet · react-native-svg |
| Backend | Supabase — Auth, Postgres, RLS, Realtime, Storage, Edge Functions (Deno) |
| State/Data | TanStack Query (server state) · Zustand (client state, persisted) |
| Forms | React Hook Form + Zod |
| Payments | Razorpay test mode — WebView checkout + Edge Function verification |
| Notifications | expo-notifications (push) + Supabase Realtime (in-app) |
| Delivery | EAS Build (dev / preview APK / production) + EAS Update (OTA) |

## Project Structure

```text
app/                 
  (auth)/            
  (resident)/        
  (guard)/           
  (admin)/          
components/
  ui/                
  shared/            
  visitor/          
hooks/               
lib/                 
store/               
supabase/
  migrations/       
  functions/         
assets/              
```

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill the **public** client values (the anon key is safe to ship in the app):

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<anon-or-publishable-key>   # EXPO_PUBLIC_SUPABASE_ANON_KEY also accepted
```

> The Razorpay **key id is not required on the client** — `create-razorpay-order` returns it at checkout time. `EXPO_PUBLIC_RAZORPAY_KEY_ID` in `.env.example` is optional/reference only. **Never** put the Razorpay key secret or the Supabase service-role key in `.env`.

### 3. Set up Supabase

Apply migrations and seed (either the CLI flow or the single bundled file):

```bash
supabase db reset                               # applies migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed.sql       # ~5 rows/table demo data
# — or, one-shot: —
psql "$DATABASE_URL" -f supabase/setup_all.sql  # migrations + seed in one file
# optional, to demo tenant isolation:
psql "$DATABASE_URL" -f supabase/seed_isolation.sql
```

### 4. Deploy Edge Functions + secrets

The Supabase-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — only the Razorpay secrets need to be set:

```bash
supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=<secret>
supabase functions deploy create-razorpay-order verify-razorpay-payment send-push-notification
```

### 5. Run

```bash
npx expo start --dev-client   # a dev/EAS build is required (push + native modules; not Expo Go)
```

### 6. Build

```bash
eas build -p android --profile preview   # installable APK
eas update                               # OTA JS update to an existing build
```

## Scripts

```bash
npm start          # expo start
npm run android    # expo run:android
npm run ios        # expo run:ios
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run format     # prettier --write
```

## License

MIT — see [LICENSE](LICENSE).
