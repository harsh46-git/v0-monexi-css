export const metadata = {
  title: "Privacy Policy - Monexi",
  description: "How Monexi collects, uses, and protects your data.",
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-foreground">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>When you create an account, we collect your email address for authentication. When you use features like transaction tracking, bank statement analysis, or the AI Advisor, the financial data you provide (transactions, statements, chat messages) is stored securely to provide those features.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
          <p>Your data is used solely to deliver Monexi's features: generating dashboards, analyzing statements, tracking goals, and powering AI responses. We do not sell your data to third parties or use it for advertising.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Third-Party Services</h2>
          <p>AI Advisor conversations are processed through Groq's AI infrastructure to generate responses. Market data (stock prices) is sourced from third-party providers and may be delayed. Account and data storage is handled by Supabase. Each provider processes data under its own terms.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Security</h2>
          <p>All data is encrypted in transit. Account data is protected by authentication. You should never enter highly sensitive information such as full bank account numbers, PAN, Aadhaar, or passwords into any Monexi tool or chat.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Data Retention & Deletion</h2>
          <p>You can request deletion of your account and all associated data at any time by contacting us at contact@monexi.in. Upon request, your stored transactions, statements, and chat history will be permanently removed.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Children's Privacy</h2>
          <p>Monexi is intended for users aged 18 and above and is not directed at children.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. Continued use of Monexi after changes constitutes acceptance of the updated policy.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
          <p>For any privacy-related questions or data deletion requests, email us at contact@monexi.in.</p>
        </div>
      </section>
    </main>
  )
}
