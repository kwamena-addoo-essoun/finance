# Incident Response Plan
**Finsight — Personal Finance Management Platform**

> Prepared pursuant to: FTC Safeguards Rule, 16 CFR Part 314, §314.4(h) and §314.15 (effective 2023)
> Effective date: March 1, 2026
> Owner: Papa Addo (Qualified Individual)

---

## 1. Purpose and Scope

This Incident Response Plan (IRP) establishes procedures for detecting, containing, investigating, notifying, and recovering from information security incidents that affect Finsight users' nonpublic personal information (NPI).

**In scope:** Any unauthorized acquisition, access, use, or disclosure of NPI collected or maintained by Finsight, including data stored in the PostgreSQL database, transmitted via the API, or sent to third-party processors (OpenAI, Plaid, Resend).

---

## 2. Incident Severity Classification

| Level | Description | Examples | Response Time |
|---|---|---|---|
| **P1 — Critical** | Active breach or confirmed exfiltration of NPI | Database dump leaked; credentials exposed | Immediate (within 2 hours) |
| **P2 — High** | Suspected breach or unauthorized access to NPI | Unusual DB queries; unknown admin accounts | Within 24 hours |
| **P3 — Medium** | Vulnerability discovered, no evidence of exploitation | CVE in a dependency; misconfigured header | Within 72 hours |
| **P4 — Low** | Security improvement identified | Hardening recommendation; minor misconfiguration | Within 2 weeks |

---

## 3. Response Team

| Role | Responsible Party |
|---|---|
| **Qualified Individual / Incident Commander** | Papa Addo |
| **Technical Lead** | Papa Addo |
| **User Communications** | Papa Addo |
| **Legal / Regulatory Notifications** | Papa Addo (with legal counsel as needed) |

For a startup with a single founder, all roles above are fulfilled by Papa Addo. Engage legal counsel for any incident involving 500 or more affected customers.

---

## 4. Incident Response Phases

### Phase 1 — Detection and Identification

**Triggers:** Sentry alert, server log anomaly, third-party notification, user report, or routine log review.

Steps:
1. Determine whether an actual or suspected security incident has occurred.
2. Document the initial discovery: date/time, what was observed, who reported it.
3. Classify the incident severity (P1–P4 above).
4. If P1 or P2: proceed immediately to Phase 2.

**Key questions to answer:**
- What data may have been accessed or exfiltrated?
- How many users may be affected?
- Is the attack ongoing?

---

### Phase 2 — Containment

Immediate containment steps (as applicable):

- [ ] Revoke all active session tokens by rotating `SECRET_KEY` in the `.env` file and redeploying. This invalidates all existing JWTs.
- [ ] If the database is involved: take the database offline or restrict access to read-only.
- [ ] If a specific account is compromised: disable the account (`UPDATE users SET is_verified = false WHERE id = ?`).
- [ ] If a third-party credential (OpenAI, Plaid, Resend) is compromised: rotate the API key immediately in the provider's dashboard and update the `.env`.
- [ ] Preserve all server logs before any system changes.
- [ ] Take a snapshot/backup of the production database for forensic analysis.

---

### Phase 3 — Investigation and Root Cause Analysis

1. Review server access logs for the relevant time window.
2. Review Sentry error logs and audit logs.
3. Identify the attack vector (e.g., injection, credential stuffing, misconfiguration, compromised dependency).
4. Determine the full scope: which records were accessed and how many users are affected.
5. Document findings in writing.

---

### Phase 4 — Notification

#### 4a. FTC Notification — Required if 500 or more customers affected

**Deadline: Within 30 days of discovery** (§314.15).

Notification method: Submit via the FTC's Safeguards Rule notification portal at [https://ftcnotify.ftc.gov](https://ftcnotify.ftc.gov).

Required information:
- Name and contact information of the reporting financial institution
- Description of the event
- Date of discovery
- Estimated number of customers affected
- Description of the data involved

#### 4b. User Notification — Required under applicable state breach notification laws

Most U.S. states (including California, New York, Texas, and Delaware) require individual user notification when their unencrypted personal information is subject to unauthorized access. Timing varies by state but is typically 30–60 days.

Notification must include:
- What happened (in plain language)
- What data was involved
- What Finsight is doing in response
- What affected users can do to protect themselves (e.g., change password, monitor accounts)
- Contact information for questions

Notification channel: Email via Resend to all affected users' registered email addresses.

#### 4c. Third-Party Notification

- **Plaid:** Notify Plaid's security team if any Plaid access tokens may have been exposed.
- **OpenAI:** Notify if any OpenAI API keys are compromised.
- **Hosting provider:** Notify if the breach involves their infrastructure.

---

### Phase 5 — Recovery

1. Patch or remediate the root cause.
2. Restore service from a clean backup if data integrity is in question.
3. Re-enable services progressively, confirming normal operation at each step.
4. Force all users to re-authenticate (rotate `SECRET_KEY` if not already done).
5. Consider requiring password resets for affected users.

---

### Phase 6 — Post-Incident Review

Within 2 weeks of resolution:

1. Conduct a written post-mortem documenting:
   - Timeline of events
   - Root cause
   - Impact (users affected, data exposed)
   - Response actions taken
   - Lessons learned
2. Update this IRP and the WISP as needed.
3. Implement any additional safeguards identified.
4. Retain all incident documentation for a minimum of **5 years**.

---

## 5. Contact Information

| Party | Contact |
|---|---|
| FTC Breach Notification Portal | https://ftcnotify.ftc.gov |
| FTC Business Center | https://business.ftc.gov |
| OpenAI Security | security@openai.com |
| Plaid Security | security@plaid.com |
| Legal Counsel | _(engage as needed)_ |

---

## 6. Plan Testing and Maintenance

- This plan will be reviewed annually alongside the WISP.
- A tabletop exercise simulating a P1 breach scenario should be conducted at least once per year.
- Any material changes to the service architecture must trigger a review of this plan.

---

**Date:** March 1, 2026
**Approved by:** Papa Addo, Founder, Finsight
