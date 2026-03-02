# Must Do — Legal / Compliance Action Items

> Governing law: **GLBA + FTC Safeguards Rule (16 CFR Part 314, updated 2023)**.
> ✅ = Complete &nbsp;·&nbsp; ⚠️ = Requires external/manual action &nbsp;·&nbsp; ❌ = Not yet done

---

## 🔴 Critical

- ✅ **Privacy Policy page** — `frontend/src/pages/PrivacyPolicyPage.jsx`
  Full GLBA-compliant privacy notice at `/privacy-policy`. Linked from footer and registered at signup with mandatory checkbox.

- ✅ **Terms of Service** — `frontend/src/pages/TermsOfServicePage.jsx`
  Full ToS at `/terms`. Mandatory acceptance checkbox on RegisterPage.

- ✅ **Data breach notification procedure** — `docs/compliance/incident-response-plan.md`
  Written Incident Response Plan covering §314.4(h) and §314.15. Includes FTC 30-day notification procedure, user notification, and post-incident review.

- ⚠️ **OpenAI Data Processing Agreement (DPA)**
  **ACTION REQUIRED — cannot be done in code.**
  1. Log into [platform.openai.com](https://platform.openai.com) → Settings → **Data Controls**
  2. Confirm "Improve model for everyone" is **disabled** (API usage is already excluded by default on paid tiers)
  3. For Enterprise DPA: contact OpenAI sales or review [openai.com/enterprise-privacy](https://openai.com/enterprise-privacy)
  4. Document the confirmation and attach it to `docs/compliance/`.

---

## 🟠 Required

- ✅ **Designate a "Qualified Individual"** — documented in `docs/compliance/WISP.md` §1
  **Papa Addo, Founder** is named as Qualified Individual per §314.4(a).

- ✅ **Written Information Security Program (WISP)** — `docs/compliance/WISP.md`
  Covers: risk assessment, access controls, encryption, secure development, monitoring, third-party oversight, training, and annual review schedule.

- ✅ **Age verification / COPPA compliance** — `frontend/src/pages/RegisterPage.jsx`
  Mandatory "I confirm I am at least 13 years of age" checkbox at registration. Documented in Privacy Policy §8.

---

## 🟡 Recommended

- ✅ **Persist AI consent server-side** — `backend/migrations/versions/004_add_ai_data_consent.py`
  `ai_data_consent` column added to `users` table. Consent set via `PATCH /users/me/ai-consent`. Enforced server-side in `POST /api/ai/chat` (HTTP 403 if not consented).

- ✅ **Account deletion UI** — `frontend/src/pages/SettingsPage.jsx`
  Settings page at `/settings` includes AI consent toggle, data export, and permanent account deletion with confirmation flow.

- ⚠️ **Database encryption at rest**
  **ACTION REQUIRED — infrastructure, not code.**
  When deploying to production, ensure the host volume for `postgres_data` is encrypted:
  - AWS: Enable EBS encryption when creating the EC2 instance/volume (checkbox)
  - DigitalOcean: Enable volume encryption on the Droplet
  - Bare metal: Use LUKS full-disk encryption
  Document the confirmation once done.

---

## ⚠️ Remaining Actions Before Launch

1. Confirm OpenAI zero-data-retention setting (see Critical section above)
2. Enable database encryption at rest on production host
3. Sign a DPA with your hosting/infrastructure provider
4. Have a lawyer do a 1-hour review of the Privacy Policy and ToS before onboarding users with real financial data
5. Print, sign, and file `docs/compliance/WISP.md` (physical or DocuSign signature)
