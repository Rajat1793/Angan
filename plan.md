# Angan Implementation Plan

Angan is a mobile-first apartment community app that moves gate calls, WhatsApp coordination, paper registers, and manual approvals into one role-based experience for **Residents, Security Guards, and Society Admins**.

**Principle:** the conversations that used to happen at the society gate now happen inside the app.

## 1. Roles

| Role | Responsibilities |
| --- | --- |
| Resident | Approve/pre-approve visitors, raise tickets, book amenities, view notices, vote in polls, pay dues |
| Security Guard | Register visitors, request approval, verify OTP/QR passes, mark entry/exit, view gate logs |
| Society Admin | Manage residents, flats, towers, staff, amenities, notices, polls, complaints, dues |

## 2. Tech Stack

| Area | Choice |
| --- | --- |
| Framework | **Expo SDK 55** (React Native 0.83, React 19.2, Node 20.19+) + TypeScript |
| Navigation | Expo Router (file-based, deep links) |
| UI / Animation | NativeWind v4 + custom tokens; Reanimated + Gesture Handler; @gorhom/bottom-sheet |
| Auth | **Supabase Auth** (email/password + email OTP) — single provider |
| Database | Supabase (PostgreSQL, RLS, Realtime, Storage, RPC, Edge Functions) |
| State | TanStack Query (server) + Zustand (auth, theme, offline queue) |
| Forms | React Hook Form + Zod |
| Notifications | Expo Notifications + Expo Push (dev/EAS build, not Expo Go) |
| Payments | Razorpay test mode via WebView Checkout; order + signature verified in an Edge Function |
| Builds | EAS Build (development, preview APK, production) |

**Auth note:** Supabase RLS authorizes every query via `auth.uid()`. Using a different auth provider would make RLS treat users as `anon`, so Angan uses Supabase Auth as the single identity provider. Role lives on `profiles.role` and is enforced in RLS — never trusted from the client.

## 3. Navigation

- **Resident tabs:** Home · Approvals · Community · Payments · Profile
- **Guard tabs:** Gate (live queue + Register FAB) · Visitors (inside) · History · Alerts
- **Admin tabs:** Dashboard · Residents · Complaints · Notices · Settings

## 3.1 Design Tokens — Color Palette

Core brand palette wired into NativeWind custom tokens + `useTheme` (light/dark). Opacity is the token's alpha channel.

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `primary` | Brand / primary actions | `#3E481D` @ 100% | `#C0CBA9` @ 100% |
| `muted` | Muted surface / borders / dividers | `#1B1C15` @ 10% | `#E2E3DA` @ 20% |
| `background` | App background / surface | `#FCFDF3` @ 100% | `#1B1C15` @ 100% |
| `foreground` | Primary text / icons | `#1B1C15` @ 100% | `#E2E3DA` @ 100% |

> Note: dark `background` (`#1B1C15`) equals light `foreground`, and the palette inverts cleanly between modes.

## 4. Core Features (MVP)

**Gate & visitors**
- Guard registers visitor (name, phone, type, purpose, vehicle, optional photo).
- Categories: delivery, cab, guest, service staff.
- Resident push notification + one-tap approve/deny bottom sheet.
- Real-time approval sync between guard and resident (Supabase Realtime).
- Guard entry/exit actions and visitor history/search.
- Guest pre-approval with generated OTP + QR pass; guard verifies pass.
- Offline queue for guard registration; sync on reconnect.

**Resident**
- Helpdesk tickets: create, comment, track status, photo attachment.
- Amenity listing, slot availability, booking, cancellation, history.
- Notices (pinned + categories); polls (one vote, close date, results).
- Maintenance dues dashboard + Razorpay test checkout + payment history.

**Admin**
- Manage towers, flats, residents, amenities, notices, polls, staff, complaints, visitor logs.
- Dashboard metrics: residents, open complaints, visitors inside, dues collected.
- Bulk monthly dues generation; notice publish with push.
- Staff / service-provider directory.

## 5. Data Model

Core tables (all scoped by `society_id`):

| Domain | Tables |
| --- | --- |
| Society | societies, towers, flats, profiles |
| Gate | visitors |
| Helpdesk | helpdesk_tickets, ticket_comments |
| Amenities | amenities, amenity_slots, bookings |
| Community | notices, polls, poll_options, poll_votes, staff, notifications |
| Payments | maintenance_dues, payment_history |

`visitors` status: `pending → approved/denied → inside → exited`, with `otp`, `pass_code`, `entry_at`, `exit_at`.

**Access control (RLS is the boundary):**
- Data scoped by `society_id`; residents see only their flat's data + society-visible content.
- Guards operate visitor workflows; they cannot read resident private data.
- Admins manage their own society only.
- Never trust client role checks — enforce in RLS.

## 6. Project Structure

```text
app/
  (auth)/         login.tsx  otp.tsx  onboarding.tsx
  (resident)/     index.tsx  approvals/  community/  payments/  profile.tsx
  (guard)/        index.tsx  register.tsx  visitors/  history.tsx  alerts.tsx
  (admin)/        index.tsx  residents/  complaints/  notices/  settings/
components/       ui/ layout/ visitor/ helpdesk/ amenity/ notice/ poll/ payment/ shared/
hooks/            useAuth.ts useVisitors.ts useRealtime.ts useNotifications.ts useOfflineSync.ts useTheme.ts
lib/              supabase.ts notifications.ts razorpay.ts auth.ts
store/            auth.store.ts offline.store.ts notifications.store.ts
supabase/
  migrations/     001_schema.sql  002_rls.sql  003_payments.sql
  functions/      send-push-notification/  create-razorpay-order/  verify-razorpay-payment/
eas.json  app.json  tailwind.config.js
```

## 7. How Key Features Are Built

- **Auth + role routing:** `signInWithPassword` / `signInWithOtp`; session in Zustand + `expo-secure-store`; root layout guard redirects by `profiles.role`.
- **Gate loop:** guard inserts `visitors` row (`expo-camera` photo → Storage) → both devices subscribe to `channel('visitors:'+societyId)` → resident approves in a bottom sheet → DB trigger calls `send-push-notification` Edge Function → guard marks entry/exit.
- **Pre-approval OTP/QR:** approved row stores `otp` + `pass_code`; QR via `react-native-qrcode-svg`; guard scans/enters → RPC `verify_pass` flips to `inside`.
- **History/search:** paginated `visitors` query with filters, rendered via `@shopify/flash-list`.
- **Offline queue:** failed inserts persist in Zustand; `netinfo` reconnect triggers `useOfflineSync` flush with a pending badge.
- **Helpdesk:** ticket + optional photo; status timeline; admin assigns to staff; threaded comments via Realtime.
- **Amenity booking:** slot capacity check + unique constraint/RPC to prevent double-booking; cancellation frees slot.
- **Notices/polls:** admin publish triggers push; polls enforce one vote via unique `(poll_id, profile_id)`.
- **Payments:** `create-razorpay-order` → WebView Checkout → `verify-razorpay-payment` validates signature → mark due paid + write history.
- **Admin dashboard:** aggregate queries / `dashboard_stats` view; quick actions for notices, complaints, dues.
- **Notifications:** device token saved to `profiles.expo_push_token`; all sends via Edge Function; Realtime in-app fallback.
- **UI states:** shared loading/empty/error/offline components + light/dark, haptics, toasts reused everywhere.

## 8. Timeline (4 weeks, 1 dev)

| Week | Deliverables |
| --- | --- |
| 1 | Expo SDK 55 setup, design tokens, EAS; Supabase Auth + role routing; schema + RLS + seed; shared UI primitives + dark mode |
| 2 | Guard registration + camera; resident approve/deny + push + Realtime; pre-approval OTP/QR; entry/exit + history; offline queue |
| 3 | Notices, polls, helpdesk; amenities + booking; admin resident/flat/staff management |
| 4 | Razorpay dues flow; admin dashboard + complaint assignment + dues generation; end-to-end QA, data-isolation tests, preview APK, screenshots, demo |

**Priorities:** P0 = auth, gate loop, entry/exit, history, notices, poll, helpdesk, amenity booking, admin dashboard. P1 = pre-approval OTP/QR, Razorpay, push. Cut P1 before compromising the P0 flow.

## 9. Submission Package

| Deliverable | Notes |
| --- | --- |
| Public GitHub repo | No secrets committed (`.env.example` only), MIT license |
| Expo APK | EAS `preview` build + QR install link |
| Demo video | 2–3 min golden path (register → approve → entry/exit → dues → admin) |
| README | Setup, env, Supabase migrations/seed, run + build steps |
| Screenshots | Light + dark, one per role + the real-time approval flow |
| Demo credentials | Seeded accounts below |

| Role | Email | Password |
| --- | --- | --- |
| Resident | `resident@angan.app` | `Demo@1234` |
| Guard | `guard@angan.app` | `Demo@1234` |
| Admin | `admin@angan.app` | `Demo@1234` |

Provide `supabase/seed.sql` (1 society, 2 towers, ~8 flats, demo visitors/notices/poll/amenities); keep all API keys in EAS / Edge Function secrets.

## 10. Definition of Done

1. EAS preview APK installs on Android.
2. Supabase Auth routes each role to the correct dashboard; RLS enforces access.
3. Guard↔resident approval works in real time, including entry and exit.
4. Residents can create tickets, book amenities, view notices, vote, and complete Razorpay test checkout.
5. Admin workflows operate only within their own society data.
6. Loading, empty, offline, error, and dark-mode states are handled.
7. All submission artifacts are produced and verified.
