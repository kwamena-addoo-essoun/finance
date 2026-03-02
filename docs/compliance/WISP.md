# Written Information Security Program (WISP)
**Finsight — Personal Finance Management Platform**

> Prepared pursuant to: FTC Safeguards Rule, 16 CFR Part 314 (amended 2023)
> Effective date: March 1, 2026
> Review cycle: Annually, or after any material change to the service or a security incident.

---

## 1. Designation of Qualified Individual

**Qualified Individual:** Papa Addo, Founder

Papa Addo is responsible for overseeing, implementing, and enforcing this Written Information Security Program (WISP). He reports on the status of the information security program no less than annually and promptly upon discovery of a material security event.

---

## 2. Scope

This WISP applies to all nonpublic personal information (NPI) collected, stored, processed, or transmitted by Finsight, including:

- User account information (email address, username, hashed password)
- Financial transaction data (expenses, amounts, dates, categories)
- Budget and savings-goal data
- Bank-account access tokens obtained via Plaid
- AI chat session content sent to OpenAI

---

## 3. Risk Assessment

A formal risk assessment was conducted on March 1, 2026. The following risks were identified and the corresponding safeguards adopted:

| Risk | Likelihood | Impact | Safeguard |
|---|---|---|---|
| Unauthorized access to user accounts | Medium | High | bcrypt password hashing; rate-limited login; JWT httpOnly cookies |
| Session hijacking | Medium | High | HttpOnly + Secure + SameSite=Lax cookies; short-lived access tokens (30 min); refresh token rotation |
| SQL injection | Low | Critical | SQLAlchemy ORM parameterization; no raw SQL queries |
| Database exposure | Low | Critical | DB not exposed to public internet; only accessible inside Docker network |
| API brute force | Medium | Medium | slowapi rate limiting on all auth endpoints (10 req/min) |
| Data interception in transit | Low | High | TLS 1.2+ enforced by Caddy; HSTS header with 1-year max-age |
| Supply chain / dependency attack | Medium | Medium | Pinned dependency versions in requirements.txt and package.json |
| Unauthorized admin access | Low | Critical | `is_admin` flag + `require_admin` dependency on all admin endpoints |
| Third-party data misuse (OpenAI) | Low | High | User opt-in consent required; OpenAI API configured for zero data retention |
| Third-party data misuse (Plaid) | Low | Medium | Plaid access token scoped to read-only; token stored server-side only |
| Insider threat | Low | High | Principle of least privilege; audit logging of sensitive operations |
| Data loss | Medium | High | Daily automated database backups (backup_db.sh) |

The risk assessment will be reviewed annually and after any material change to the service architecture.

---

## 4. Safeguards

### 4.1 Access Controls

- Passwords are stored as salted bcrypt hashes (cost factor ≥ 12). Plaintext passwords are never stored, logged, or transmitted.
- Authentication tokens are stored in `HttpOnly; Secure; SameSite=Lax` cookies. Access tokens expire after 30 minutes; refresh tokens after 7 days.
- Administrative functions require the `is_admin` flag to be set server-side. No client-side bypass is possible.
- Database credentials are stored in environment variables and never committed to version control.
- The PostgreSQL database is not exposed on any public port; it is accessible only to the backend container via the internal Docker network.

### 4.2 Encryption

- All data in transit is encrypted using TLS 1.2 or higher, enforced by the Caddy reverse proxy with automatic HSTS.
- Passwords are stored with bcrypt (salted hash; never reversible).
- In production, database volumes must use AES-256 encryption at rest (e.g., AWS EBS encrypted volumes, LUKS on bare metal). **[ACTION: Confirm before launch]**

### 4.3 Secure Development

- All third-party dependencies are pinned to specific versions.
- No raw SQL is used; all queries run through SQLAlchemy's ORM with parameterized binding.
- Content Security Policy, X-Frame-Options, X-Content-Type-Options, and other security headers are enforced at the Caddy layer.
- Rate limiting is applied to all authentication and sensitive endpoints.

### 4.4 Monitoring and Logging

- Sentry is integrated for real-time error monitoring and alerting.
- An audit log records all sensitive operations: login, logout, AI consent changes, admin promotions/demotions, and account deletion.
- Server access logs are retained for a minimum of 90 days.
- Database backups are created nightly via `backend/scripts/backup_db.sh` and stored offsite.

### 4.5 Third-Party Service Provider Oversight

| Provider | Purpose | Safeguard |
|---|---|---|
| **OpenAI** | AI spending insights | User opt-in consent required before any data is sent. Configured for zero data retention via API account settings. Users may revoke consent at any time from Settings. |
| **Plaid** | Bank-account linking | User initiates Plaid Link flow; credentials go directly to Plaid, not Finsight. Access token is stored server-side only. |
| **Resend** | Transactional email | Only email address and verification/reset tokens are transmitted. SPF/DKIM configured on sending domain. |
| **Hosting provider** | Infrastructure | Data processing agreement (DPA) must be signed with the hosting provider before launch. **[ACTION: Sign DPA]** |

### 4.6 Access Monitoring and Testing

- All authentication failures are logged and can be reviewed at any time.
- Security-relevant endpoints (login, register, password reset) are rate-limited.
- Dependencies are reviewed for known CVEs before each production deployment using `pip-audit` (Python) and `npm audit` (JavaScript).

---

## 5. Employee and Contractor Training

- Any contractors or employees granted access to production systems must be briefed on this WISP before receiving access.
- Credentials must not be shared. Each person with system access has their own credentials.
- Production database access is not permitted from personally owned devices without VPN or explicit authorization.

---

## 6. Incident Response

See the separate **Incident Response Plan** (`docs/compliance/incident-response-plan.md`), which fulfils the requirements of §314.4(h) and §314.15.

---

## 7. Annual Review and Update

This WISP will be reviewed no less than once per calendar year by the Qualified Individual. The review will assess:

1. Whether the risk assessment remains current.
2. Whether any safeguards need to be added, modified, or removed.
3. Whether any material changes to the service have introduced new risks.
4. Whether any security incidents occurred and what was learned from them.

Results of the review will be documented as an amendment to this document.

---

## 8. Acknowledgement

By operating the Finsight service, the Qualified Individual (Papa Addo) acknowledges responsibility for maintaining this program in compliance with the FTC Safeguards Rule (16 CFR Part 314).

**Date:** March 1, 2026
**Signature:** _________________________________
**Name:** Papa Addo
**Title:** Founder, Finsight
