import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPage.css';

const EFFECTIVE_DATE = 'March 1, 2026';
const CONTACT_EMAIL = 'support@finsight.app';

export default function TermsOfServicePage() {
  return (
    <div className="legal-page">
      <Link to="/" className="legal-back">← Back to Finsight</Link>

      <h1>Terms of Service</h1>
      <p className="legal-meta">Effective date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Please read carefully before using Finsight</p>

      <div className="legal-toc">
        <p>Contents</p>
        <ol>
          <li><a href="#acceptance">Acceptance of Terms</a></li>
          <li><a href="#eligibility">Eligibility</a></li>
          <li><a href="#description">Description of Service</a></li>
          <li><a href="#not-financial-advice">Not Financial Advice</a></li>
          <li><a href="#account">Your Account</a></li>
          <li><a href="#acceptable-use">Acceptable Use</a></li>
          <li><a href="#third-party">Third-Party Services</a></li>
          <li><a href="#ip">Intellectual Property</a></li>
          <li><a href="#disclaimer">Disclaimer of Warranties</a></li>
          <li><a href="#liability">Limitation of Liability</a></li>
          <li><a href="#indemnification">Indemnification</a></li>
          <li><a href="#termination">Termination</a></li>
          <li><a href="#governing-law">Governing Law</a></li>
          <li><a href="#changes">Changes to These Terms</a></li>
          <li><a href="#contact">Contact</a></li>
        </ol>
      </div>

      {/* ── 1 ── */}
      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        By creating a Finsight account or otherwise accessing or using the Finsight service (the
        "Service"), you agree to be bound by these Terms of Service ("Terms") and our{' '}
        <Link to="/privacy-policy">Privacy Policy</Link>, which is incorporated herein by reference.
        If you do not agree to these Terms, you must not use the Service.
      </p>

      {/* ── 2 ── */}
      <h2 id="eligibility">2. Eligibility</h2>
      <p>
        You must be at least <strong>13 years of age</strong> to create an account. Because Finsight
        involves financial data, we strongly recommend that users be at least 18 years of age. By
        registering, you represent and warrant that you meet the applicable age requirement and that
        all information you provide is accurate and truthful.
      </p>
      <p>
        If you are between 13 and 18 years of age, you represent that your parent or legal guardian
        has reviewed and agreed to these Terms on your behalf.
      </p>

      {/* ── 3 ── */}
      <h2 id="description">3. Description of Service</h2>
      <p>
        Finsight is a personal finance management platform that allows users to track expenses, manage
        budgets, set savings goals, link bank accounts via Plaid, and receive AI-generated spending insights
        via OpenAI. The Service is provided for informational and organizational purposes only.
      </p>

      {/* ── 4 ── */}
      <h2 id="not-financial-advice">4. Not Financial Advice</h2>
      <p>
        <strong>
          Nothing in the Service constitutes financial, investment, tax, legal, or accounting advice.
        </strong>{' '}
        AI-generated insights and spending summaries are automated outputs based solely on the data you
        enter; they are not reviewed by licensed financial professionals and may contain errors or
        omissions. You should consult a qualified professional before making any financial decision.
        Finsight disclaims all liability for decisions made based on information provided by the Service.
      </p>

      {/* ── 5 ── */}
      <h2 id="account">5. Your Account</h2>
      <ul>
        <li>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity that occurs under your account.
        </li>
        <li>
          You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if
          you suspect unauthorized access to your account.
        </li>
        <li>
          You may not share your account with others or create accounts for third parties without their
          knowledge and consent.
        </li>
        <li>
          You may delete your account at any time from the account settings page. Deletion is permanent
          and removes all associated data in accordance with our Privacy Policy.
        </li>
      </ul>

      {/* ── 6 ── */}
      <h2 id="acceptable-use">6. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation.</li>
        <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
        <li>Introduce malware, viruses, or other harmful code.</li>
        <li>Scrape, crawl, or harvest data from the Service through automated means without our prior written consent.</li>
        <li>Impersonate another person or entity, or misrepresent your affiliation with any person or entity.</li>
        <li>Use the Service to store or transmit unlawful, defamatory, obscene, or fraudulent content.</li>
        <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Service.</li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that violate this section without prior
        notice.
      </p>

      {/* ── 7 ── */}
      <h2 id="third-party">7. Third-Party Services</h2>
      <p>
        The Service integrates with third-party providers including <strong>Plaid</strong> (bank-account
        linking) and <strong>OpenAI</strong> (AI insights). Your use of these features is also governed
        by the respective terms and privacy policies of those providers. Finsight is not responsible for
        the actions, data practices, or availability of third-party services.
      </p>

      {/* ── 8 ── */}
      <h2 id="ip">8. Intellectual Property</h2>
      <p>
        The Finsight name, logo, application code, and all associated content are the intellectual
        property of Finsight and its licensors. You are granted a limited, non-exclusive,
        non-transferable, revocable license to use the Service solely for its intended personal finance
        management purposes. You may not use our intellectual property for any commercial purpose without
        our express written consent.
      </p>
      <p>
        You retain ownership of the data you enter into the Service (your expense records, budgets, etc.).
        By using the Service, you grant Finsight a limited license to process that data solely as
        necessary to provide the Service.
      </p>

      {/* ── 9 ── */}
      <h2 id="disclaimer">9. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FINSIGHT DISCLAIMS ALL WARRANTIES,
        INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
        TITLE, NON-INFRINGEMENT, AND FREEDOM FROM COMPUTER VIRUS OR OTHER HARMFUL CODE. WE DO NOT
        WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
      </p>

      {/* ── 10 ── */}
      <h2 id="liability">10. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL FINSIGHT OR ITS OFFICERS, DIRECTORS,
        EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES — INCLUDING LOSS OF DATA, REVENUE, OR FINANCIAL LOSS — ARISING OUT OF OR IN CONNECTION
        WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
        DAMAGES.
      </p>
      <p>
        OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF THESE TERMS OR THE SERVICE
        WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO FINSIGHT IN THE TWELVE MONTHS
        PRECEDING THE CLAIM, OR (B) USD $100.
      </p>

      {/* ── 11 ── */}
      <h2 id="indemnification">11. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Finsight and its officers, directors,
        employees, and agents from and against any claims, liabilities, damages, losses, and expenses
        (including reasonable attorneys' fees) arising out of or in any way connected with your access
        to or use of the Service, your violation of these Terms, or your infringement of any third-party
        right.
      </p>

      {/* ── 12 ── */}
      <h2 id="termination">12. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without cause or
        notice. Upon termination, your right to use the Service ceases immediately. Sections 4, 8, 9,
        10, 11, and 13 survive any termination of these Terms.
      </p>

      {/* ── 13 ── */}
      <h2 id="governing-law">13. Governing Law &amp; Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of the United States and the State of Delaware, without
        regard to conflict-of-law principles. Any dispute arising under or relating to these Terms that
        cannot be resolved informally will be subject to binding arbitration in accordance with the rules
        of the American Arbitration Association, except that either party may seek injunctive or other
        equitable relief in any court of competent jurisdiction.
      </p>

      {/* ── 14 ── */}
      <h2 id="changes">14. Changes to These Terms</h2>
      <p>
        We may revise these Terms at any time. We will provide at least <strong>14 days' notice</strong>{' '}
        via email or an in-app banner before material changes take effect. Your continued use of the
        Service after the effective date of updated Terms constitutes your acceptance of those Terms.
      </p>

      {/* ── 15 ── */}
      <h2 id="contact">15. Contact</h2>
      <p>
        Questions about these Terms? Contact us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </div>
  );
}
