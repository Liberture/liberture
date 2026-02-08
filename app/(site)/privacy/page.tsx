import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Liberture",
  description: "Privacy policy and data handling practices for Liberture",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-slate-400 mb-8">Last updated: February 8, 2026</p>

          <div className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">1. Introduction</h2>
                <p className="text-slate-300 leading-relaxed">
                  At Liberture, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-2xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>Account Information:</strong> Name, email address, password</li>
                  <li><strong>Profile Data:</strong> BOS level, preferences, goals</li>
                  <li><strong>Communication:</strong> Messages, support inquiries, feedback</li>
                  <li><strong>Payment Information:</strong> Processed securely through third-party payment processors (we do not store full credit card details)</li>
                </ul>

                <h3 className="text-2xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the Platform</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                  <li><strong>Cookies & Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
                  <li><strong>Location Data:</strong> Approximate geographic location (if permitted)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">3. How We Use Your Information</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Provide, maintain, and improve the Platform</li>
                  <li>Personalize your experience and content recommendations</li>
                  <li>Process transactions and send related information</li>
                  <li>Send administrative messages, updates, and security alerts</li>
                  <li>Respond to your comments and questions</li>
                  <li>Analyze usage patterns to improve our services</li>
                  <li>Detect and prevent fraud, abuse, or security issues</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">4. Cookies & Tracking Technologies</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We use cookies and similar tracking technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>Essential Cookies:</strong> Required for the Platform to function (authentication, security)</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Platform (Google Analytics)</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">
                  You can control cookie preferences through our cookie consent banner and your browser settings. Note that disabling certain cookies may affect Platform functionality.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">5. Google Analytics</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We use Google Analytics to analyze Platform usage. Google Analytics uses cookies to collect information such as:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>How often users visit the Platform</li>
                  <li>What pages they visit and in what sequence</li>
                  <li>How long they spend on each page</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">
                  Google Analytics is <strong>disabled by default</strong>. It will only be activated if you explicitly consent through our cookie banner. You can opt out at any time through the{" "}
                  <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">
                    Settings page
                  </Link>.
                </p>
                <p className="text-slate-300 leading-relaxed mt-4">
                  Learn more about Google's privacy practices:{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                    Google Privacy Policy
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">6. Data Sharing & Disclosure</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We do not sell your personal information. We may share your data only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>Service Providers:</strong> Third parties that help us operate the Platform (hosting, payment processing, email delivery)</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">7. Data Security</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We implement appropriate technical and organizational measures to protect your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Secure password hashing (bcrypt)</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication requirements</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">
                  However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">8. Your Rights & Choices</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  You have the following rights regarding your personal data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails or disable analytics</li>
                  <li><strong>Data Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Objection:</strong> Object to certain data processing activities</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">
                  To exercise these rights, visit your{" "}
                  <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">
                    Account Settings
                  </Link>{" "}
                  or contact us directly.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">9. Email Communications</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  We may send you different types of emails:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li><strong>Transactional:</strong> Account notifications, security alerts (cannot be disabled)</li>
                  <li><strong>Marketing:</strong> Product updates, new features (opt-out anytime)</li>
                  <li><strong>Weekly Digest:</strong> Curated content and insights (opt-out anytime)</li>
                </ul>
                <p className="text-slate-300 leading-relaxed mt-4">
                  Manage your email preferences in{" "}
                  <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">
                    Settings
                  </Link>.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">10. Children's Privacy</h2>
                <p className="text-slate-300 leading-relaxed">
                  The Platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">11. International Data Transfers</h2>
                <p className="text-slate-300 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">12. Data Retention</h2>
                <p className="text-slate-300 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your data within 30 days, except where we are legally required to retain certain information.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">13. Changes to This Policy</h2>
                <p className="text-slate-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a prominent notice on the Platform. Your continued use after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">14. Contact Us</h2>
                <p className="text-slate-300 leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:{" "}
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300">
                    Contact Form
                  </Link>
                </p>
              </section>

              <section className="mt-12 p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <h3 className="text-xl font-bold mb-3">Quick Summary</h3>
                <ul className="list-disc pl-6 space-y-1 text-slate-300 text-sm">
                  <li>We collect only necessary data to provide and improve our services</li>
                  <li>Google Analytics is <strong>opt-in only</strong> (disabled by default)</li>
                  <li>We never sell your personal information</li>
                  <li>You have full control over your data and privacy settings</li>
                  <li>We use industry-standard security measures</li>
                  <li>You can delete your account and data at any time</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
