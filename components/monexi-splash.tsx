"use client"

import { useEffect, useState } from "react"

export function MonexiSplash() {
  const [gone, setGone] = useState(false)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1800)   // fade shuru
    const t2 = setTimeout(() => setGone(true), 2400)    // hata do
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (gone) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${fade ? "opacity-0" : "opacity-100"}`}
    >
      {/* faint glowing radial bg */}
      <div className="absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(circle at 50% 45%, rgba(16,185,129,0.15), transparent 60%)" }}
      />

      {/* M box */}
      <div className="relative animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 rounded-2xl bg-[#0d0d0d] border border-[#10b981]/30 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)]">
          <span className="text-5xl font-black text-[#10b981]">M</span>
        </div>
      </div>

      {/* MONEXI text */}
      <h1 className="relative mt-8 text-6xl md:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-[#10b981] animate-in fade-in slide-in-from-bottom-4 duration-1000">
        MONEXI
      </h1>

      {/* tagline pill */}
      <div className="relative mt-6 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 animate-in fade-in duration-1000 delay-300">
        <p className="text-sm md:text-base text-gray-400">
          The Future of <span className="text-[#10b981] font-bold">Digital Finance</span> is here.
        </p>
      </div>
    </div>
  )
}