import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Liberture",
  description: "Terms and conditions for using Liberture platform",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Home
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-slate-400 mb-8">Last updated: February 8, 2026</p>

          <div className="prose prose-invert prose-purple max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-300 leading-relaxed">
                  By accessing and using Liberture ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms & Conditions, please do not use the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">2. Use of the Platform</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Liberture provides a biological optimization platform that aggregates information, protocols, and resources related to human performance and wellness. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Use the Platform only for lawful purposes</li>
                  <li>Not attempt to gain unauthorized access to any part of the Platform</li>
                  <li>Not use the Platform to distribute malware or harmful content</li>
                  <li>Not impersonate any person or entity</li>
                  <li>Respect intellectual property rights of content creators</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">3. Health & Medical Disclaimer</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  <strong className="text-yellow-400">IMPORTANT:</strong> The information provided on Liberture is for educational and informational purposes only. It is NOT intended as medical advice.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Always consult with a qualified healthcare professional before starting any new health protocol, supplement regimen, or exercise program</li>
                  <li>Individual results may vary significantly</li>
                  <li>We do not diagnose, treat, cure, or prevent any disease or medical condition</li>
                  <li>You assume full responsibility for any actions taken based on information from this Platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">4. User Accounts</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Maintaining the security of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">5. Content & Intellectual Property</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  The Platform and its original content (excluding user-generated content and third-party materials) are the property of Liberture and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Third-party content (books, protocols, articles) linked or referenced on the Platform remains the property of their respective owners. We aggregate and curate this information for educational purposes only.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">6. Premium Content & Services</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Some features, protocols, or content on the Platform may be available only through paid subscriptions or one-time purchases:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Payment terms are specified at the time of purchase</li>
                  <li>Refund policies are provided for each product or service</li>
                  <li>We reserve the right to modify pricing with notice to existing subscribers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">7. Third-Party Links</h2>
                <p className="text-slate-300 leading-relaxed">
                  The Platform may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third-party sites. You access them at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">8. Limitation of Liability</h2>
                <p className="text-slate-300 leading-relaxed mb-4">
                  To the maximum extent permitted by law, Liberture shall not be liable for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Any injuries, health issues, or adverse effects resulting from use of information on the Platform</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of data, revenue, or profits</li>
                  <li>Service interruptions or technical issues</li>
                </ul>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">9. Indemnification</h2>
                <p className="text-slate-300 leading-relaxed">
                  You agree to indemnify and hold harmless Liberture, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">10. Changes to Terms</h2>
                <p className="text-slate-300 leading-relaxed">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">11. Termination</h2>
                <p className="text-slate-300 leading-relaxed">
                  We may terminate or suspend your account and access to the Platform immediately, without prior notice, for any breach of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">12. Governing Law</h2>
                <p className="text-slate-300 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of Switzerland, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-bold mb-4">13. Contact</h2>
                <p className="text-slate-300 leading-relaxed">
                  If you have questions about these Terms, please contact us at:{" "}
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300">
                    Contact Form
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
