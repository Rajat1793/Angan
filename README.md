# Angan

A mobile-first apartment community app that moves gate calls, WhatsApp coordination, paper registers, and manual approvals into one role-based experience for **Residents, Security Guards, and Society Admins**.

> The conversations that used to happen at the society gate now happen inside the app.

Built with **Expo SDK 55** (React Native 0.83, React 19.2) + **Supabase** (Postgres, RLS, Realtime, Storage, Edge Functions).

## Features

- **Gate loop** — guard registers a visitor → resident approves/denies in real time → guard marks entry/exit.
- **Pre-approval passes** — residents generate a QR + OTP guest pass; guards verify offline-friendly.
- **Offline guard queue** — registrations persist and sync automatically on reconnect.
- **Community** — notices (pinned + categories), polls (one vote), helpdesk tickets with threaded comments.
- **Amenities** — slot booking with server-side capacity checks (no double-booking).
- **Payments** — maintenance dues + Razorpay test checkout with server-side signature verification.
- **Admin console** — dashboard metrics, resident directory, complaint triage, notice publishing, bulk dues.
- **Push notifications** — server-driven via Edge Function with in-app Realtime fallback.
- Light/dark theme, loading/empty/error/offline states, haptics, and toasts throughout.

## Tech Stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 55 + TypeScript, Expo Router |
| UI | NativeWind v4, Reanimated, Gesture Handler, @gorhom/bottom-sheet |
| Backend | Supabase (Auth, Postgres, RLS, Realtime, Storage, Edge Functions) |
| State | TanStack Query + Zustand |
| Forms | React Hook Form + Zod |
| Payments | Razorpay test mode (WebView checkout + Edge Function verification) |
| Builds | EAS Build (development, preview APK, production) |

## Project Structure

```text
app/            Expo Router route groups: (auth) (resident) (guard) (admin)
components/     ui/ shared/ visitor/  reusable primitives + feature parts
hooks/          useAuth, useVisitors, useRealtime, useNotifications, useOfflineSync, useTheme
lib/            supabase, auth, visitors, passes, community, helpdesk, amenities, payments, ...
store/          auth, theme, offline, notifications (Zustand)
supabase/
  migrations/   001_schema  002_rls  003_triggers  004_rpc  005_payments  006_views
  functions/    send-push-notification  create-razorpay-order  verify-razorpay-payment
  seed.sql      seed_isolation.sql
```

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_RAZORPAY_KEY_ID
```

### 3. Set up Supabase

Apply migrations and seed in order:

```bash
supabase db reset            # applies migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed.sql
# optional, to demo tenant isolation:
psql "$DATABASE_URL" -f supabase/seed_isolation.sql
```

Set Edge Function secrets (never commit these):

```bash
supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... SUPABASE_SERVICE_ROLE_KEY=...
supabase functions deploy send-push-notification create-razorpay-order verify-razorpay-payment
```

### 4. Run

```bash
npx expo start        # dev/EAS build required for push (not Expo Go)
```

### 5. Build APK

```bash
eas build -p android --profile preview
```

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Resident | `resident@angan.app` | `Demo@1234` |
| Guard | `guard@angan.app` | `Demo@1234` |
| Admin | `admin@angan.app` | `Demo@1234` |

## Security Model

- **Supabase Auth is the only identity provider.** RLS authorizes every query via `auth.uid()`.
- **`society_id` is the isolation boundary** on every table; policies are deny-by-default.
- **Role lives on `profiles.role`** and is enforced in RLS — never trusted from the client.
- Razorpay/service-role keys live only in Edge Function secrets. The repo ships `.env.example` only.

## License

MIT — see [LICENSE](LICENSE).
