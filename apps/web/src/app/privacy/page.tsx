import Link from 'next/link';
import LogoMark from '@/components/brand/LogoMark';
import { BRAND_NAME } from '@pavti/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `How ${BRAND_NAME} collects, uses, and protects data for Mandals, Trusts, and the donors they serve.`,
};

const LAST_UPDATED = '12 September 2026';

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
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <LogoMark size={36} className="rounded-lg" />
          <span className="font-bold text-theme-fg">{BRAND_NAME}</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-theme-fg mb-1.5">Privacy Policy</h1>
        <p className="text-xs text-theme-fg/50 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="mb-10 p-4 rounded-xl bg-saffron-500/[0.06] border border-dashed border-saffron-500/30 text-sm text-theme-fg/70 leading-relaxed">
          {BRAND_NAME} is a receipt and collection management tool used by Mandals, Trusts, and
          community organizations ("<strong className="text-theme-fg">Organizations</strong>") to
          issue digital donation receipts ("<strong className="text-theme-fg">Pavtis</strong>") to
          their donors. If you're a donor whose name, phone number, or donation appears on a
          receipt, that information was entered by the Organization you gave it to — we're the
          platform their staff use, not the party you gave your donation to. Questions about a
          specific donation are best directed to that Organization directly; this policy explains
          what we do with the data on our end regardless of who it's about.
        </div>

        <Section title="1. Information We Collect">
          <p><strong className="text-theme-fg">Account & Organization data</strong> — when an Organization signs up: the admin's name, phone number, email, and password (stored as a one-way hash, never in plain text); the Organization's name, address, city, state, phone, email, and logo; and, for staff added later (collectors, treasurers), their own name, phone, email, and assigned role.</p>
          <p><strong className="text-theme-fg">Donor & receipt data</strong> — entered by an Organization's own staff when logging a donation: donor name, phone number, address, amount, category, and payment mode. This is provided to us by the Organization, not collected directly from donors by us.</p>
          <p><strong className="text-theme-fg">Payment data</strong> — when an Organization pays its own subscription fee, card, UPI, and bank details are entered directly into Cashfree Payments' own secure checkout and never reach our servers. We only receive confirmation that a payment succeeded or failed.</p>
          <p><strong className="text-theme-fg">Device & location data</strong> — when a collector logs a donation from within the app, we optionally record the device's GPS coordinates and basic device information at that moment, to help an Organization verify where and how a receipt was created.</p>
          <p><strong className="text-theme-fg">On-device storage</strong> — your login session and language/theme preferences are stored locally on your own device (browser local storage), not as third-party tracking cookies, and are not transmitted to us beyond what's needed to keep you signed in.</p>
          <p><strong className="text-theme-fg">Technical logs</strong> — standard server logs (IP address, request timestamps) kept briefly for security, fraud prevention, and rate-limiting.</p>
          <p>We do not currently run advertising trackers or third-party analytics on this platform.</p>
        </Section>

        <Section title="2. How We Use Information">
          <p>To operate the core service: creating accounts, issuing and verifying receipts, processing an Organization's own subscription payments, and letting Organizations share receipts with their donors via WhatsApp or a direct link.</p>
          <p>To keep the platform secure: detecting abuse, rate-limiting, and investigating fraud or unauthorized access.</p>
          <p>To communicate with Organizations about their account, subscription status, and material changes to the service.</p>
          <p>We do not sell personal data, and we do not use donor data for marketing.</p>
        </Section>

        <Section title="3. How We Share Information">
          <p>We share data only with the service providers that make the platform work, each acting under their own security and privacy commitments — never for their own marketing use:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-theme-fg">Cashfree Payments</strong> — processes subscription payments; handles your payment method details directly, we never see or store them.</li>
            <li><strong className="text-theme-fg">Cloudflare</strong> — stores uploaded images (logos, receipt assets) and provides security/CDN services.</li>
            <li><strong className="text-theme-fg">Supabase</strong> — hosts our database.</li>
            <li><strong className="text-theme-fg">Railway</strong> and <strong className="text-theme-fg">Vercel</strong> — host our backend and website respectively.</li>
          </ul>
          <p>We may also disclose information if required by law, or to protect the rights, safety, or property of {BRAND_NAME}, our users, or the public.</p>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain account and receipt data for as long as an Organization's account remains active, and for a reasonable period after closure to meet the accounting and audit-trail expectations typical of donation record-keeping. An Organization can request deletion of its account and associated data at any time, subject to any legal retention obligations that may apply to financial records.</p>
        </Section>

        <Section title="5. Your Rights & Choices">
          <p>You can request access to, correction of, or deletion of personal data we hold about you by contacting us below. If your data was entered into the platform by an Organization (for example, as a donor), we'll direct you to that Organization first, since they control what was entered and why — but we'll assist where we're able to.</p>
        </Section>

        <Section title="6. Data Security">
          <p>All traffic to and from the platform is encrypted (HTTPS). Passwords are hashed, never stored in plain text. Access to Organization data is scoped by role, and payment details are handled entirely by Cashfree's own PCI-compliant infrastructure — they never pass through our servers.</p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>{BRAND_NAME} is intended for use by adult administrators and staff of Organizations, not children. We do not knowingly collect personal data directly from children.</p>
        </Section>

        <Section title="8. Where Data Is Stored">
          <p>Our infrastructure is primarily hosted in India and Singapore. By using {BRAND_NAME}, you understand your data may be processed in these locations.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this policy as the service evolves. Material changes will be reflected by updating the "Last updated" date above; continued use of the platform after a change means you accept the updated policy.</p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            Questions about this policy or your data can be sent to{' '}
            <a href="mailto:support@epavtibook.com" className="text-saffron-500 hover:underline">support@epavtibook.com</a>.
          </p>
        </Section>

        <div className="mt-12 pt-6 border-t border-theme text-xs text-theme-fg/40">
          <Link href="/" className="hover:text-theme-fg/70 hover:underline">← Back to {BRAND_NAME}</Link>
        </div>
      </div>
    </div>
  );
}
