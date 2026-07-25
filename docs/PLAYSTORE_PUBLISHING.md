# Publishing Angan to the Google Play Store

A complete, Angan-specific runbook: build a production Android App Bundle with
EAS, set up the Play Console, and ship through the testing tracks to production.

> Package name / applicationId: **`app.angan.mobile`** (from `app.json`).
> Keep it identical everywhere — it can never be changed after the first upload.

---

## 0. Prerequisites (one-time)

| Item | Notes |
| --- | --- |
| **Google Play Developer account** | $25 one-time fee · https://play.google.com/console · needs identity verification (can take 1–2 days) |
| **Expo account** | already used for `eas build` / `eas update` |
| **eas-cli** | already installed (`eas --version`) |
| **A hosted privacy policy URL** | **required** by Play. Host `docs/PRIVACY_POLICY.md` (e.g. GitHub Pages / your site) and note the public URL |
| **Store assets** | icon, feature graphic, screenshots — see `docs/STORE_LISTING.md` |
| **(Optional) Google service account JSON** | only if you want `eas submit` to upload automatically |

---

## 1. Pre-flight config review

Already done in this repo:
- `android.package` = `app.angan.mobile`
- Icons + splash wired (`assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`)
- Permissions cleaned to **CAMERA + INTERNET**, microphone (`RECORD_AUDIO`) **blocked**
- `eas.json` → `production` profile with `autoIncrement: true`, `channel: production`
- `updates.url` set (OTA works after the first production build)

Confirm the marketing version before building (this is what users see):
```jsonc
// app.json
"version": "1.0.0"            // bump for each public release: 1.0.0, 1.0.1, 1.1.0 …
```
The Android **versionCode** is auto-managed by EAS (`appVersionSource: "remote"` +
`autoIncrement: true`), so you never edit it by hand.

Permissions users will see on the listing:
- **Camera** — capture visitor photos and scan pre-approval QR passes
- **Notifications** (Android 13+ `POST_NOTIFICATIONS`) — gate approvals & alerts
- **Internet** — talk to the Supabase backend

---

## 2. Build the production App Bundle (.aab)

Play requires an **AAB**, not an APK. The `production` profile already produces one.
```bash
eas login
eas build --platform android --profile production
```
- First run: EAS offers to **generate an upload keystore** — accept it. EAS stores
  it securely; keep it (losing it complicates future updates). Back it up with
  `eas credentials`.
- Output: a downloadable `.aab`. Grab the URL/file from the build page.

> **App signing:** Use **Google Play App Signing** (default & recommended). EAS's
> keystore becomes your *upload* key; Google holds the final *app signing* key.

---

## 3. Create the app in Play Console

Play Console → **Create app**:
- App name: **Angan**
- Default language: English
- App or game: **App**
- Free or paid: **Free**
- Accept declarations.

Then complete every item under **Dashboard → "Set up your app"**:

1. **App access** — the app is **login-gated**, so reviewers need credentials.
   Add instructions + a demo account (see `docs/STORE_LISTING.md`):
   - `resident@angan.app` / `Demo@1234` (also guard/admin accounts available)
2. **Ads** — Angan shows no ads → "No".
3. **Content rating** — fill the IARC questionnaire (utility/social; no violence,
   no user-to-public content beyond a society feed) → typically **Everyone / 3+**.
4. **Target audience & content** — target 18+ (or 13+); it's a residents' utility,
   not aimed at children.
5. **Data safety** — declare what Angan collects (see the table in §5 below).
6. **Privacy policy** — paste your hosted URL (from `docs/PRIVACY_POLICY.md`).
7. **Government apps / financial features** — Angan takes maintenance payments via
   Razorpay; answer the financial-features questions honestly (no lending/banking).

---

## 4. Store listing

Fill **Store presence → Main store listing** using the copy + asset specs in
[STORE_LISTING.md](STORE_LISTING.md):
- App icon (512×512), feature graphic (1024×500), 2–8 phone screenshots
- Short description (≤80 chars) + full description (≤4000 chars)

---

## 5. Data safety declaration (Angan specifics)

| Data type | Collected? | Why | Shared? |
| --- | --- | --- | --- |
| Name | Yes | Profiles, visitor records | No |
| Email | Yes | Authentication | No |
| Phone number | Yes | Resident/visitor contact | No |
| Photos | Yes | Visitor photos at the gate | No |
| Payment info | Handled by **Razorpay** | Maintenance dues | Razorpay processes card data; app stores only amount + order id |
| App activity / in-app actions | Yes | Core functionality | No |
| Device identifiers (push token) | Yes | Notifications | No |

Declare: **encrypted in transit** (HTTPS/Supabase), **data is linked to the user's
identity**, **not sold**, and users **can request deletion** (state the contact
in the privacy policy). Card details are **not** collected or stored by Angan.

---

## 6. Roll out through testing tracks

Ship progressively — don't go straight to production:

1. **Internal testing** (up to 100 testers, instant) → Release → upload the `.aab`
   → add tester emails → share the opt-in link. Verify login, gate flow, payments.
2. **Closed testing** (optional) → a wider tester group; Play now often requires a
   closed test with ~12 testers for 14 days before a *new personal* account can
   publish to production.
3. **Open testing** (optional) → public opt-in link.
4. **Production** → Release → upload the `.aab` (or promote the tested one) →
   staged or full rollout → submit for review.

First review typically takes a few hours to a few days.

---

## 7. Uploading the build

**Option A — manual:** download the `.aab` from EAS → in the chosen track's
release, drag it into "App bundles" → review → roll out.

**Option B — automated with `eas submit`:**
1. Play Console → Setup → API access → create/link a **Google Cloud service
   account**, grant it "Release" permissions, download its **JSON key**.
2. Point `eas.json` at it:
   ```jsonc
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./google-service-account.json",
         "track": "internal"   // internal | alpha | beta | production
       }
     }
   }
   ```
   Keep the JSON key **out of git** (add to `.gitignore`).
3. Submit:
   ```bash
   eas submit --platform android --profile production --latest
   ```

---

## 8. After launch — updates

- **JS/CSS-only changes** (bug fixes, copy, styling): no rebuild — ship OTA:
  ```bash
  eas update --branch production -m "fix: …"
  ```
  Only works on builds made on the `production` channel with `updates.url` set.
- **Native changes** (new native module, permission, SDK/`app.json` native config,
  version bump): rebuild + re-upload a new `.aab` and increment `version`.

---

## 9. Release checklist

- [ ] Play Developer account verified
- [ ] `app.json` `version` bumped for this release
- [ ] Production `.aab` built via `eas build --profile production`
- [ ] Privacy policy hosted; URL added to Play
- [ ] Store listing complete (icon, feature graphic, 2+ screenshots, descriptions)
- [ ] Content rating questionnaire submitted
- [ ] Data safety form completed
- [ ] App access: reviewer demo credentials provided
- [ ] Internal testing passed (login, gate loop, payment with Razorpay test card)
- [ ] Rolled out to production & submitted for review
