const SHOTS = [
    { src: "/monexi-front.png", alt: "Monexi home page - Next Gen Personal Finance" },
    { src: "/monexi-dashboard.png", alt: "Monexi dashboard - net worth and spending overview" },
    { src: "/monexi-ai.png", alt: "Monexi AI financial advisor chat" },
    { src: "/monexi-stock.png", alt: "Monexi AI stock research analysis" },
    { src: "/monexi-statement-analysis.png", alt: "Monexi bank statement analysis insights" },
    { src: "/monexi-sip.png", alt: "Monexi SIP investment calculator" },
    { src: "/monexi-dashboard2.png", alt: "Monexi financial dashboard analytics" },
    { src: "/monexi-login.png", alt: "Monexi secure login page" },
  ]
  
  export function ScreenshotsGallery() {
    return (
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-3 text-white">See Monexi in Action</h2>
        <p className="text-center text-gray-400 mb-12">A complete AI-powered personal finance platform</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHOTS.map((s, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-[#10b981]/30 transition group">
              <img src={s.src} alt={s.alt} loading="lazy" className="w-full h-auto group-hover:scale-[1.02] transition-transform" />
            </div>
          ))}
        </div>
      </section>
    )
  }