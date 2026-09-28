import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `How ${BRAND_NAME} collects, uses, and protects data for Mandals, Trusts, mobile app users, and the donors they serve.`,
};

const LAST_UPDATED = '29 September 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-theme-fg mb-2.5">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-theme-fg/75">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-theme-bg">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <LogoMark size={36} className="rounded-lg" />
          <span className="font-bold text-theme-fg text-lg">{BRAND_NAME}</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-1.5">Privacy Policy</h1>
        <p className="text-xs text-theme-fg/50 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="mb-10 p-4 rounded-xl bg-saffron-500/[0.06] border border-dashed border-saffron-500/30 text-sm text-theme-fg/70 leading-relaxed">
          {BRAND_NAME} is a digital receipt and collection management platform used by Mandals, Utsav Samitis, Trusts, and community organizations ("<strong className="text-theme-fg">Organizations</strong>") to
          issue digital donation receipts ("<strong className="text-theme-fg">Pavtis</strong>") to
          their donors. If you're a donor whose name, phone number, or donation appears on a
          receipt, that information was entered by the Organization you gave it to — we are the
          technology platform their authorized staff use. Questions about a specific donation are best directed to that Organization directly; this policy explains how we process and safeguard data across our web platform and mobile apps.
        </div>

        <Section title="1. Information We Collect">
          <p><strong className="text-theme-fg">Account & Organization Data</strong> — when an Organization registers: admin name, mobile phone number, email address, and encrypted password (stored as a one-way cryptographic hash, never in plain text); Organization name, address, city, state, phone, email, and logo; and staff details (collectors, treasurers) added by the admin.</p>
          <p><strong className="text-theme-fg">Donor & Receipt Records</strong> — entered by an Organization's staff when issuing a donation receipt: donor name, phone number, address, amount, category, and payment mode. This data belongs to the Organization.</p>
          <p><strong className="text-theme-fg">Subscription & Payment Data</strong> — when an Organization subscribes to a plan, card, NetBanking, and UPI details are processed directly by Cashfree Payments (PCI-DSS Level 1 certified checkout). We do not store or see your raw card or bank credentials.</p>
          <p><strong className="text-theme-fg">Direct Donor UPI Transactions</strong> — for direct donor-to-mandal UPI payments, transfers take place directly between bank accounts using standard UPI protocols (`upi://pay`). No payment gateway holds or intercepts these donations.</p>
          <p><strong className="text-theme-fg">Technical & Session Data</strong> — session tokens and preferences are saved locally on your device (browser local storage / app state). We do not track users across third-party websites or use advertising tracking cookies.</p>
        </Section>

        <Section title="2. Mobile App Permissions">
          <p>Our Android and iOS mobile applications may request the following permissions solely to perform requested features:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-theme-fg">Camera Access</strong> — used to scan QR codes for receipt verification and capture expense bill vouchers.</li>
            <li><strong className="text-theme-fg">Location / GPS (Optional)</strong> — used optionally when a collector logs a donation to record the location stamp for audit verification.</li>
            <li><strong className="text-theme-fg">Storage / Media Access</strong> — used to save generated digital receipt PNG images to your device gallery or download the official app APK file.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Information">
          <p>To provide core platform features: issuing digital receipts, verifying receipt authenticity, generating reports, managing collection teams, and sharing receipts via WhatsApp or direct link.</p>
          <p>To maintain platform security: detecting abuse, rate-limiting, preventing fraud, and ensuring reliable uptime.</p>
          <p>To send essential transactional notifications: account verification OTPs, subscription renewals, and security alerts.</p>
          <p>We <strong className="text-theme-fg">never sell personal data</strong> and never use donor records for third-party advertising or marketing.</p>
        </Section>

        <Section title="4. Data Sharing & Third-Party Services">
          <p>We share data strictly with infrastructure providers necessary to operate the service under strict confidentiality commitments:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-theme-fg">Cashfree Payments</strong> — handles subscription checkout securely.</li>
            <li><strong className="text-theme-fg">Cloudflare</strong> — provides CDN, DDOS protection, and media asset hosting.</li>
            <li><strong className="text-theme-fg">Supabase & PostgreSQL</strong> — secure database hosting.</li>
            <li><strong className="text-theme-fg">Vercel & Railway</strong> — cloud hosting infrastructure.</li>
          </ul>
          <p>We may also disclose information if required by law, court order, or to protect the safety and security of our users and the public.</p>
        </Section>

        <Section title="5. Data Retention & Account Deletion">
          <p>We retain Organization and receipt records while an account remains active to provide audit histories typical of trust and community record-keeping.</p>

          <p><strong className="text-theme-fg">Account Deletion Rights:</strong> An Organization Admin can request complete account and data deletion at any time:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-theme-fg">In-App Deletion:</strong> Go to <span className="font-mono text-xs bg-theme-fg/10 px-1.5 py-0.5 rounded">Settings → Delete Account</span> in the dashboard.</li>
            <li><strong className="text-theme-fg">Email Request:</strong> Contact us at <a href="mailto:support@epavtibook.com" className="text-saffron-500 hover:underline">support@epavtibook.com</a> from your registered admin email. Upon verification, all account data, staff profiles, and non-statutory records will be permanently removed.</li>
          </ul>
        </Section>

        <Section title="6. Data Security">
          <p>All network data in transit is encrypted using TLS 1.3 (HTTPS). Sensitive fields and passwords are cryptographically hashed. Database access is strictly isolated by organization ID and role-based permissions.</p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>{BRAND_NAME} is designed for adult committee members, treasurers, and authorized staff of Organizations. We do not knowingly collect personal information directly from children under 13.</p>
        </Section>

        <Section title="8. Contact Us">
          <p>
            If you have questions regarding this Privacy Policy or your data, please contact our team at{' '}
            <a href="mailto:support@epavtibook.com" className="text-saffron-500 font-semibold hover:underline">support@epavtibook.com</a>.
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-theme text-xs text-theme-fg/40">
          <Link href="/" className="hover:text-theme-fg/70 hover:underline">← Back to {BRAND_NAME}</Link>
        </div>
      </div>
    </div>
  );
}

