# Privacy Policy — in-tolerance

**Effective date:** May 24, 2026
**Last updated:** June 6, 2026
**Data controller:** Tamas Tankoczi, Budapest, Hungary
**Contact:** support@in-tolerance.app

---

## 1. Who we are

in-tolerance ("the app", "we", "us") is a mobile app that helps you track
the food you eat, log symptoms and sleep, and surface possible patterns in
your own data. This policy explains what we collect, why, who processes it
on our behalf, how long we keep it, and the rights you have over it.

in-tolerance is **not a medical device and does not provide medical advice,
diagnosis, or treatment.** See our Terms of Service for the full health
disclaimer.

## 2. Data we collect

We only collect what the app needs to function. We do **not** sell your
data, and we do **not** use it for advertising or cross-app tracking.

| Category | Specific data | Why we collect it |
|---|---|---|
| Contact info | Email address | Authentication, account management, support |
| Identifiers | Account identifier (UUID) | Linking your records to your account |
| Health & Fitness | Food intolerances you declare; food log entries (meal type, time, notes); symptom check-ins (severity, onset, duration, notes); sleep-quality logs; pattern alerts derived from the above | Core app functionality — logging and pattern analysis |
| User content | Free-text notes on logs; community food submissions you choose to publish | Core app functionality; optional community feature |
| Photos (optional) | A food photo you choose to submit to the AI food-logging feature (Pro) | Sent to our AI provider (Google Gemini) to identify the food and estimate its contents. Processed in transit only — we do **not** store it on our servers |
| Purchases | Subscription status | To unlock paid features |
| Diagnostics | Crash reports and basic device/OS diagnostic context | Stability — diagnosing and fixing crashes. **Not linked to your identity** (no account ID or email is attached) |

**Special-category data.** Food-intolerance, symptom, and sleep data may
reveal information about your health. We process it only to provide the app
to you, on the legal basis of your consent and performance of our service
to you (GDPR Art. 6(1)(a)/(b) and Art. 9(2)(a)). You can withdraw consent
at any time by deleting the relevant entries or your account (Section 7).

### Data we do NOT collect

- Precise or coarse location.
- Video or audio recordings. Barcode scanning uses the camera **only** to
  read a barcode — no image is captured or stored. Separately, the optional
  AI food-logging feature (Pro) lets you submit a single food photo; it is
  sent to our AI provider to identify the food (Section 4) and is **not**
  stored on our servers afterward.
- Contacts, calendars, or device address book.
- Browsing or search history. Food-search terms are passed to our
  food-data providers (Section 4) to return results and are **not** stored
  as records linked to you.
- Advertising identifiers (IDFA), marketing or ad-tech data. The app
  contains no ad SDK and presents no App Tracking Transparency prompt
  because no cross-app tracking occurs.
- Payment card or bank details. If you purchase a subscription, the
  transaction is handled entirely by the app store you bought it through
  (Apple App Store or Google Play); payment details never reach our servers.

## 3. How we use your data

- To authenticate you and keep you signed in.
- To store and display the logs you create.
- To run the on-device-rules / server pattern engine over **your own**
  recent logs and show you possible food–symptom patterns.
- To operate the optional community-foods feature.
- To provide customer support when you contact us.
- To meet legal obligations and enforce our Terms.

We do **not** use your data for profiling for advertising, automated
decisions with legal effect, or sale to third parties.

## 4. Sub-processors and third parties

We use the following processors. Each receives only the data needed for its
function and is bound by a data-processing agreement or equivalent terms.

| Provider | Role | Data they handle | Identifies you? |
|---|---|---|---|
| Supabase | Authentication + database hosting | All account, health, and user-content data (they host it) | Yes — sub-processor under DPA |
| Railway | Backend application hosting | All API traffic in transit; logs may contain user IDs | Yes — sub-processor under terms |
| FatSecret | Food & barcode lookup | Search terms / barcode strings only — sent from our backend. **No** email, user ID, or device data | No |
| Open Food Facts | Food & barcode lookup | Search terms / barcode strings only — sent from our backend. **No** email, user ID, or device data | No |
| USDA FoodData Central | Food data fallback | Search terms only — sent from our backend (public-domain API) | No |
| Apple (StoreKit) | Subscription payments (iOS) | Purchase/subscription state | Yes — Apple-managed |
| Google (Play Billing) | Subscription payments (Android) | Purchase/subscription state | Yes — Google-managed |
| RevenueCat | Subscription and entitlement management | App-store user identifier, subscription state | Yes — sub-processor |
| Google LLC (Gemini API) | AI-powered weekly insights, food matching, dietitian tips, and AI food logging (Pro users only) | Food logs, symptom check-ins, sleep scores, and any food photo you submit to AI food logging — sent server-side only; no Gemini SDK on device. Photos are processed transiently and not stored by us | No — processed server-side, not linked to your identity by Google |
| Sentry | Crash/error reporting | Crash stack traces + device/OS context. **No** account ID, email, or request bodies (we do not identify you to Sentry) | No — not linked to identity |

Calls to FatSecret, Open Food Facts, and USDA originate from our backend, never directly from
your device, so those providers do not receive your identity or device
information.

We use **Sentry** for crash and error reporting to find and fix stability
problems. Sentry receives crash stack traces and basic device/OS context.
We do **not** identify you to Sentry: no account ID or email is attached,
and the Authorization header, request body, and cookies are stripped before
an error is sent. Crash/diagnostic data is therefore **not linked to your
identity**. We do not collect performance-tracing data.

## 5. International data transfers

Our processors may store or process data outside your country, including in
the United States. Where required, transfers rely on appropriate safeguards
(e.g. EU Standard Contractual Clauses). Contact us for details.

This policy is governed together with our Terms of Service; the governing
law and forum are set out there (Hungary), subject to
the mandatory data-protection rights of your country of residence.

## 6. Data retention

- Account and log data are retained for as long as your account exists.
- When you delete a log entry it is removed promptly.
- When you delete your account (Section 7) all account-linked data is
  erased from our database, including dependent records that cascade from
  your user row (e.g. content reports and blocks). Provider-side backups
  are rotated out within the provider's standard cycle.
- Aggregate, fully de-identified statistics that cannot be linked back to
  you may be retained.

## 7. Your rights and choices

You can exercise the following at any time, mostly self-service in the app:

- **Access / portability.** Settings → "Export my data" produces a single
  JSON document containing every record we hold that is linked to your
  account. (Backend: `GET /user/me/export`.)
- **Erasure.** Settings → "Delete account" permanently deletes your account
  and associated data after a typed confirmation. This is irreversible.
- **Rectification.** Edit or delete any log entry directly in the app.
- **Withdraw consent / restrict / object.** Stop using a feature, delete
  the data, or contact us.
- **Password reset.** "Forgot password?" on the sign-in screen sends a
  one-time code to your email.

**GDPR (EEA/UK):** you also have the right to lodge a complaint with your
local supervisory authority.

**CCPA/CPRA (California):** you have the right to know, delete, correct,
and to opt out of "sale"/"sharing" — we do **not** sell or share personal
information as those terms are defined, and we do not process sensitive
personal information for inferring characteristics. We do not discriminate
against you for exercising any right.

To make a request not covered by the in-app controls, email
support@in-tolerance.app. We respond within the timeframe required by
applicable law (generally 30 days).

## 8. Children

in-tolerance is **not directed to children under 13** and we do not
knowingly collect data from them. The app is intended for users **13 and
older**. If you believe a child under 13 has provided us data, contact
support@in-tolerance.app and we will delete it.

In the EEA/UK the minimum age at which a person can consent to data
processing without parental authorization varies by country (13–16 under
GDPR Art. 8). Where you are below that age in your country, a parent or
guardian must consent on your behalf. *(The exact threshold per
jurisdiction varies by country.)*

## 9. Security

Data is encrypted in transit (HTTPS/TLS). Backend access uses a
service-role credential that is never exposed to the mobile app; the app
holds only a public anonymous key and your session token. No method of
transmission or storage is 100% secure, but we apply industry-standard
safeguards and the principle of least privilege.

## 10. Changes to this policy

We may update this policy. Material changes will be announced in-app or by
email before they take effect. The "Last updated" date above always
reflects the current version.

## 11. Contact

Questions or privacy requests: **support@in-tolerance.app**
Tamas Tankoczi, Budapest, Hungary

