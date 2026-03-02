import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPage.css';

const EFFECTIVE_DATE = 'March 1, 2026';
const CONTACT_EMAIL = 'privacy@finsight.app';

export default function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <Link to="/" className="legal-back">← Back to Finsight</Link>

      <h1>Privacy Policy</h1>
      <p className="legal-meta">Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Applies to all Finsight users</p>

      {/* Table of contents */}
      <div className="legal-toc">
        <p>Contents</p>
        <ol>
          <li><a href="#info-collected">Information We Collect</a></li>
          <li><a href="#how-we-use">How We Use Your Information</a></li>
          <li><a href="#third-parties">Third-Party Sharing</a></li>
          <li><a href="#glba-notice">GLBA Privacy Notice</a></li>
          <li><a href="#data-security">Data Security</a></li>
          <li><a href="#data-retention">Data Retention</a></li>
          <li><a href="#your-rights">Your Rights &amp; Choices</a></li>
          <li><a href="#children">Children's Privacy (COPPA)</a></li>
          <li><a href="#changes">Changes to This Policy</a></li>
          <li><a href="#contact">Contact Us</a></li>
        </ol>
      </div>

      {/* ── 1 ── */}
      <h2 id="info-collected">1. Information We Collect</h2>
      <p>We collect the following categories of nonpublic personal information (NPI) from you:</p>
      <ul>
        <li><strong>Account information:</strong> email address, username, hashed password, email-verification status, and account creation date.</li>
        <li><strong>Financial transaction data:</strong> expense records, amounts, dates, descriptions, and categories that you enter manually or that are imported via a linked bank account.</li>
        <li><strong>Budget and savings-goal data:</strong> names, target amounts, and progress you record within the app.</li>
        <li><strong>Bank-link credentials (via Plaid):</strong> when you opt in to bank-account linking, Plaid—not Finsight—receives and stores your bank credentials. We receive only a read-only access token and the account/transaction data Plaid returns.</li>
        <li><strong>Usage data:</strong> log data (IP address, browser type, pages visited, timestamps) automatically collected by our servers.</li>
        <li><strong>Communications:</strong> messages you send us and the content of AI chat sessions you initiate.</li>
      </ul>

      {/* ── 2 ── */}
      <h2 id="how-we-use">2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and manage your account and authenticate your identity.</li>
        <li>Provide, operate, and improve the Finsight service.</li>
        <li>Automatically categorize expenses and generate AI-powered spending insights.</li>
        <li>Send transactional emails (email verification, password reset). We do <strong>not</strong> send marketing email without your separate consent.</li>
        <li>Detect fraud, enforce our Terms of Service, and comply with applicable law.</li>
        <li>Fulfil our obligations under the Gramm-Leach-Bliley Act (GLBA) and the FTC Safeguards Rule.</li>
      </ul>

      {/* ── 3 ── */}
      <h2 id="third-parties">3. Third-Party Sharing</h2>
      <p>We share NPI only as described below. We do <strong>not</strong> sell your personal information.</p>
      <ul>
        <li>
          <strong>OpenAI, Inc.</strong> — When you use the AI Chat feature, the content of your messages
          and relevant financial summaries generated from your data are sent to the OpenAI API to produce
          responses. We have configured our OpenAI account to <strong>opt out of data use for model
          training</strong>. OpenAI's use of data submitted via the API is governed by the{' '}
          <a href="https://openai.com/policies/api-data-usage-policies" target="_blank" rel="noreferrer">
            OpenAI API data usage policy
          </a>.{' '}
          You may withdraw consent to AI data processing at any time in your account settings.
        </li>
        <li>
          <strong>Plaid Inc.</strong> — If you link a bank account, you will interact directly with
          Plaid's authentication flow. Plaid's use of your data is governed by the{' '}
          <a href="https://plaid.com/legal/#end-user-privacy-policy" target="_blank" rel="noreferrer">
            Plaid End-User Privacy Policy
          </a>.
        </li>
        <li>
          <strong>Infrastructure providers</strong> — Our hosting/database provider processes data on
          our behalf under a data processing agreement and may not use your data for their own purposes.
        </li>
        <li>
          <strong>Legal requirements</strong> — We may disclose NPI if required by law, court order, or
          to protect the rights and safety of Finsight or its users.
        </li>
      </ul>

      {/* ── 4 ── */}
      <h2 id="glba-notice">4. GLBA Annual Privacy Notice</h2>
      <p>
        Finsight is subject to the Gramm-Leach-Bliley Act (15 U.S.C. §§ 6801–6809). This section
        serves as our annual privacy notice as required by 16 CFR Part 313.
      </p>
      <ul>
        <li>
          <strong>Categories of NPI collected:</strong> identifiers (name, email, username); financial
          transaction data; account balances and budget information; technical log data.
        </li>
        <li>
          <strong>Categories of NPI disclosed:</strong> financial summaries are disclosed to OpenAI when
          you use AI Chat; transaction/account data is disclosed to Plaid when you link a bank account.
        </li>
        <li>
          <strong>Opt-out right:</strong> You may opt out of disclosure to OpenAI by turning off AI Chat
          in your account settings. You may disconnect your bank account at any time from the Accounts
          page. You may not opt out of disclosures required by law.
        </li>
        <li>
          <strong>Confidentiality &amp; security:</strong> We maintain a Written Information Security
          Program (WISP) and restrict access to NPI to authorized personnel only. See Section 5.
        </li>
      </ul>

      {/* ── 5 ── */}
      <h2 id="data-security">5. Data Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards required under the FTC Safeguards
        Rule (16 CFR Part 314), including:
      </p>
      <ul>
        <li>Passwords stored as salted bcrypt hashes — plaintext passwords are never stored or logged.</li>
        <li>All data transmitted over TLS 1.2 or higher.</li>
        <li>JWT access tokens stored in HttpOnly cookies, not accessible to JavaScript.</li>
        <li>Rate limiting on authentication endpoints to mitigate brute-force attacks.</li>
        <li>Encrypted database volumes in production (AES-256).</li>
        <li>Audit logging of sensitive operations.</li>
      </ul>
      <p>
        Despite these measures, no system is completely secure. In the event of a breach affecting
        500 or more customers, we will notify the FTC within 30 days as required by §314.15, and
        affected users as required by applicable state law.
      </p>

      {/* ── 6 ── */}
      <h2 id="data-retention">6. Data Retention</h2>
      <p>
        We retain your account data for as long as your account is active. If you delete your account,
        your personal data and financial records are permanently deleted within <strong>30 days</strong>,
        except where retention is required by law or necessary to resolve disputes or enforce agreements.
      </p>

      {/* ── 7 ── */}
      <h2 id="your-rights">7. Your Rights &amp; Choices</h2>
      <ul>
        <li><strong>Access &amp; correction:</strong> You may view and update your account information at any time in the app.</li>
        <li><strong>Deletion:</strong> You may delete your account (and all associated data) from your account settings. Deletion is permanent and irreversible.</li>
        <li><strong>AI opt-out:</strong> You may revoke consent to AI data processing in account settings at any time without losing access to other features.</li>
        <li><strong>Data portability:</strong> Contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to request a machine-readable export of your data.</li>
        <li><strong>Do Not Track:</strong> We do not currently respond to browser Do Not Track signals because we do not engage in cross-site tracking.</li>
      </ul>

      {/* ── 8 ── */}
      <h2 id="children">8. Children's Privacy (COPPA)</h2>
      <p>
        Finsight is not directed to children under 13, and we do not knowingly collect personal
        information from children under 13. Users are required to confirm at registration that they are
        at least 13 years of age. If we learn that a user under 13 has provided personal information,
        we will delete it promptly. Contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>{' '}
        if you believe we have inadvertently collected information from a child under 13.
      </p>
      <p>
        Because Finsight involves financial data, we strongly encourage users to be at least
        <strong> 18 years of age</strong> before using the service independently.
      </p>

      {/* ── 9 ── */}
      <h2 id="changes">9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. When we do, we will revise the effective
        date above and, for material changes, notify you via email or an in-app banner at least
        14 days before the change takes effect. Your continued use of Finsight after the effective date
        constitutes acceptance of the updated policy.
      </p>

      {/* ── 10 ── */}
      <h2 id="contact">10. Contact Us</h2>
      <p>
        For privacy-related questions, requests, or complaints, contact our designated Privacy Officer:
      </p>
      <p>
        <strong>Email:</strong>{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p>
        We will respond to all verifiable requests within <strong>30 days</strong>.
      </p>
    </div>
  );
}
