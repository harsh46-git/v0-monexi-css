export const metadata = {
  title: "Terms & Conditions - Monexi",
  description: "Terms and conditions for using Monexi personal finance tools.",
}

export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-foreground">
      <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <section className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using Monexi ("the Service"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Service. Monexi provides personal finance management tools, including budgeting features, investment calculators, market data visualization, and AI-powered financial guidance, intended for informational and educational purposes only.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Financial Disclaimer</h2>
          <p className="mb-3"><strong className="text-foreground">Important Notice:</strong> Monexi does NOT provide financial, investment, tax, or legal advice. All information, calculations, and AI-generated suggestions are for educational purposes only and must not be construed as professional financial advice.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Not a Financial Advisor:</strong> Monexi is not registered as a financial advisor, broker, or investment consultant with SEBI or any other regulatory authority.</li>
            <li><strong className="text-foreground">Investment Risks:</strong> All investments carry risk, including potential loss of principal. Past performance does not guarantee future results. Market data displayed may be delayed or indicative.</li>
            <li><strong className="text-foreground">Professional Advice Required:</strong> Consult a qualified financial advisor, tax consultant, or legal professional before making financial decisions.</li>
            <li><strong className="text-foreground">AI Limitations:</strong> The AI advisor provides general guidance based on publicly available information and cannot account for your complete financial situation, risk tolerance, or goals.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. User Responsibilities</h2>
          <p className="mb-2">As a user of Monexi, you agree to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate information when using our calculators and tools</li>
            <li>Use the Service for lawful purposes only</li>
            <li>Not rely solely on Monexi for financial decisions</li>
            <li>Verify all calculations and data independently before acting</li>
            <li>Keep your account credentials secure and confidential</li>
            <li>Not attempt to reverse engineer, hack, or compromise the Service</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data &amp; Privacy</h2>
          <p>When you create an account, we collect your email for authentication. Financial data you provide (transactions, statements, chat messages) is stored securely to power features like dashboards, statement analysis, and the AI Advisor. AI conversations are processed through Groq's infrastructure, and account data is stored via Supabase. For full details, see our <a href="/privacy" className="text-primary underline">Privacy Policy</a>. Never enter full bank account numbers, PAN, Aadhaar, or passwords into any Monexi tool or chat. You may request deletion of your account and data anytime at contact@monexi.in.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Monexi and its creators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Service. We are not responsible for any financial losses incurred based on information, calculations, or suggestions provided by Monexi. The Service is provided "as is" without warranties of any kind, express or implied.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Service Availability &amp; Modifications</h2>
          <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time without prior notice. Market data features depend on third-party APIs and may be unavailable during outages or rate limits. These Terms may be updated periodically; continued use after changes constitutes acceptance.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Governing Law</h2>
          <p>These Terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
          <p>For questions about these Terms, email us at contact@monexi.in.</p>
        </div>

        <p className="pt-4 border-t border-white/10">By using Monexi, you acknowledge that you have read and understood these Terms and Conditions, including the financial disclaimer, and agree that all financial decisions remain your sole responsibility.</p>
      </section>
    </main>
  )
}
