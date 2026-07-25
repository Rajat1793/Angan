# Angan — Store Listing Content

Copy-paste-ready text and asset specs for the Google Play "Main store listing".
Adjust wording/branding as needed before submitting.

---

## App details

- **App name:** Angan
- **Short description (≤ 80 chars):**
  > Your society's gate, notices, amenities & dues — all in one secure app.

- **Full description (≤ 4000 chars):**

  > Angan is the modern courtyard for your apartment community. It moves gate
  > calls, WhatsApp coordination, paper registers, and manual approvals into one
  > role-based app for residents, security guards, and society admins.
  >
  > • Smart gate entry — guards register visitors and residents approve or deny
  >   them in real time. No more unexpected knocks.
  > • Pre-approval passes — generate a QR + OTP guest pass; guards verify in
  >   seconds, even offline.
  > • Community — society notices, polls, events, a neighbourhood feed, and a
  >   helpdesk for raising issues.
  > • Amenities — book the clubhouse, gym, or hall with fair, capacity-checked
  >   slots.
  > • Maintenance dues — view balances and pay securely; keep every receipt.
  > • Directory & services — find neighbours, log deliveries, register vehicles,
  >   save frequent visitors, and raise an emergency SOS.
  > • Admin console — dashboards, complaint triage, notices, and dues generation.
  >
  > Built for privacy: every action is scoped to your society, and your data is
  > protected in transit. Angan keeps the conversations that used to happen at
  > the gate safely inside the app.

- **Category:** Lifestyle (or House & Home)
- **Contact email:** <your-support-email>
- **Website (optional):** <your-site>
- **Privacy policy URL:** <hosted URL of docs/PRIVACY_POLICY.md>

---

## Graphic assets (generated — ready to upload)

Ready-made, Play-compliant assets live in [`store-assets/`](../store-assets).
Screenshots use **real emulator captures** (resident account, light theme)
framed on a branded canvas with captions. Regenerate any time with
`python3 scripts/gen_store_shots.py` (raw captures are kept in
`store-assets/real/`).

| Asset | File(s) | Size |
| --- | --- | --- |
| App icon | `icon-512.png` | 512 × 512 |
| Feature graphic | `feature-graphic-1024x500.png` | 1024 × 500 |
| Phone screenshots | `phone-1..5.png` | 1080 × 1920 (9:16) |
| 7" tablet | `tablet7-1..3.png` | 1080 × 1920 |
| 10" tablet | `tablet10-1..3.png` | 1440 × 2560 |
| Chromebook (optional) | `chromebook-1..4.png` | 1920 × 1080 |
| Android XR (optional) | `xr-1..4.png` | 1920 × 1080 |

Screens captured: Home dashboard, Community feed, Payments/dues, Amenity
booking, and the Services hub (SOS, deliveries, vehicles, directory).

Tip: only upload the tablet/Chromebook/XR sets if you want those form factors
listed; the phone set is the only required one.

---

## App access (reviewer login — REQUIRED, the app is login-gated)

Provide these under **App content → App access** so Google's reviewers can sign in:

```
The app requires login. Use any demo account (password: Demo@1234):
  Resident: resident@angan.app
  Guard:    guard@angan.app
  Admin:    admin@angan.app

To test payments, open Resident → Payments → Pay a due and use the Razorpay
TEST card 4111 1111 1111 1111, any future expiry, any CVV.
```

---

## Release notes (What's new) — v1.0.0

```
First release of Angan:
• Real-time visitor approvals and pre-approval QR/OTP passes
• Community notices, polls, events and a resident feed
• Amenity booking, maintenance dues + secure payments
• Society directory, deliveries, vehicles, SOS and admin tools
```
