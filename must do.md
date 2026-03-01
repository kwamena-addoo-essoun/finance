# Must Do — Legal / Compliance Action Items

> These gaps **cannot be fixed with code** and must be addressed before going live with real users.
> Governing law: **GLBA + FTC Safeguards Rule (16 CFR Part 314, updated 2023)**.

---

## 🔴 Critical

- **Privacy Policy page**
  GLBA requires a clear privacy notice explaining what nonpublic personal information (NPI) is collected, how it is used, and whether it is shared with third parties. Must be presented and acknowledged at signup.

- **Terms of Service**
  Required to establish the legal relationship with users and disclaim liability.

- **Data breach notification procedure**
  FTC Safeguards Rule §314.15 (effective 2023) requires notifying the FTC **within 30 days** if a breach affects 500 or more customers. A written incident response plan must exist before launch.

- **OpenAI Data Processing Agreement (DPA)**
  Sending user NPI to OpenAI constitutes third-party data sharing under GLBA. A signed DPA with OpenAI is required, confirming user data is not used for model training. Use OpenAI's Enterprise tier or opt out via API account settings.

---

## 🟠 Required

- **Designate a "Qualified Individual"**
  FTC Safeguards Rule §314.4(a) requires naming a specific person responsible for the information security program.

- **Written Information Security Program (WISP)**
  §314.4 requires a documented security program that includes a formal risk assessment, access controls, monitoring, and employee training.

- **Age verification / COPPA compliance**
  No age gate currently exists. If any users may be under 13, COPPA applies. At minimum, add an age confirmation checkbox at registration and document the policy.

---

## 🟡 Recommended

- **Persist AI consent server-side**
  The current AI data-sharing consent is stored in `localStorage`, which is cleared if the user wipes browser data. For production, add an `ai_data_consent` boolean column to the `users` table (Alembic migration), set it on consent, and enforce it server-side in `POST /api/ai/chat`.

- **Account deletion UI**
  The `DELETE /api/users/me` endpoint exists and is wired in `userAPI`. Add a visible "Delete My Account" button to a Settings or Profile page so users can exercise their right to erasure without needing API access.

- **Database encryption at rest**
  The local SQLite file is plaintext. In production, PostgreSQL volumes should use encrypted storage (e.g. AWS EBS encryption, Azure Disk Encryption). This is expected under the Safeguards Rule's risk assessment requirement.
