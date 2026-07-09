export const metadata = {
  title: "Terms & Conditions - Monexi",
  description: "Terms and conditions for using Monexi.",
}

export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-foreground">
      <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>
      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using Monexi, you agree to be bound by these Terms and Conditions. Monexi provides personal finance management tools including budgeting, investment calculators, market data, and AI-powered guidance, for informational and educational purposes only.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Financial Disclaimer</h2>
          <p>Monexi does NOT provide financial, investment, tax, or legal advice. It is not registered as a financial advisor or broker with SEBI or any regulatory authority. All investments carry risk. Market data may be delayed. Consult a qualified professional before making financial decisions.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. User Responsibilities</h2>
          <p>Use the Service lawfully, provide accurate information, verify all calculations independently, keep your credentials secure, and do not attempt to compromise the Service.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data &amp; Privacy</h2>
          <p>For details on how we handle your data, see our <a href="/privacy" className="text-primary underline">Privacy Policy</a>. Never enter full bank account numbers, PAN, Aadhaar, or passwords into any Monexi tool or chat.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
          <p>Monexi is provided "as is" without warranties. We are not liable for any financial losses incurred based on information, calculations, or suggestions provided by the Service.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Governing Law</h2>
          <p>These Terms are governed by the laws of India, with exclusive jurisdiction of the courts in India.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Contact</h2>
          <p>Questions? Email contact@monexi.in.</p>
        </div>
      </section>
    </main>
  )
}
