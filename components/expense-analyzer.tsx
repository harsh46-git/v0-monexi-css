"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts"

// ---------- Types (match /api/analyze-statement response) ----------
type Txn = {
  date: string
  desc: string
  amount: number
  type: "CREDIT" | "DEBIT"
  category: string
}
type Cat = { name: string; amount: number; color: string }
type Payee = { name: string; count: number; total: number; type: string }
type Analysis = {
  summary: { total_spent: number; total_income: number; savings_rate: number; risk_score: string }
  categories: Cat[]
  insights: string[]
  recent_transactions: Txn[]
  all_transactions: Txn[]
  payees: Payee[]
}

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN")

// ============================================================
//  Inline search + view-all transactions
// ============================================================
function TransactionSearch({ all, payees }: { all: Txn[]; payees: Payee[] }) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)

  const matchedPayees = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return payees.filter((p) => p.name.toLowerCase().includes(q))
  }, [query, payees])

  const matchedTxns = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return all.filter(
      (t) => t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    )
  }, [query, all])

  const searchTotal = useMemo(
    () => matchedTxns.reduce((s, t) => s + (t.type === "DEBIT" ? t.amount : 0), 0),
    [matchedTxns],
  )

  const listTxns = query.trim() ? matchedTxns : expanded ? all : all.slice(0, 8)

  const gridCols =
    "grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1fr)]"

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl sm:p-5">
      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name (e.g. Harsh, Zomato, Swiggy)…"
          className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-10 text-sm text-white placeholder-white/30 outline-none transition focus:border-emerald-500/60"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
          >✕</button>
        )}
      </div>

      {/* Payee summary when searching */}
      {query.trim() && matchedPayees.length > 0 && (
        <div className="mb-4 space-y-2">
          {matchedPayees.slice(0, 5).map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{p.name}</p>
                <p className="text-xs text-white/50">{p.count} {p.count === 1 ? "transaction" : "transactions"}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold tabular-nums text-emerald-400">{inr(p.total)}</p>
                <p className="text-xs text-white/40">total</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {query.trim() && (
        <p className="mb-3 text-sm text-white/60">
          Found <span className="font-semibold text-white">{matchedTxns.length}</span> transactions
          {searchTotal > 0 && (
            <> · total paid out <span className="font-semibold text-emerald-400">{inr(searchTotal)}</span></>
          )}
        </p>
      )}

      {/* Table — horizontal scroll on mobile, shrinkable tracks, truncation works */}
      <div className="overflow-hidden rounded-xl border border-white/5">
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className={`grid ${gridCols} gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/40`}>
              <span>Date</span><span>Description</span><span>Category</span><span className="text-right">Amount</span>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {listTxns.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-white/40">No transactions found for “{query}”.</p>
              ) : (
                listTxns.map((t, i) => (
                  <div key={i} className={`grid ${gridCols} items-center gap-2 border-b border-white/5 px-4 py-3 text-sm transition hover:bg-white/[0.03]`}>
                    <span className="whitespace-nowrap text-white/50">{t.date}</span>
                    <span className="min-w-0 truncate font-medium text-white" title={t.desc}>{t.desc}</span>
                    <span className="min-w-0">
                      <span className="inline-block max-w-full truncate rounded-md bg-white/5 px-2 py-1 text-xs text-white/60">{t.category}</span>
                    </span>
                    <span className={`whitespace-nowrap text-right font-semibold tabular-nums ${t.type === "DEBIT" ? "text-rose-400" : "text-emerald-400"}`}>
                      {t.type === "DEBIT" ? "- " : "+ "}{inr(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {!query.trim() && all.length > 8 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-emerald-400 transition hover:bg-white/[0.06]"
        >
          {expanded ? "Show less" : `View all ${all.length} transactions`}
        </button>
      )}
    </div>
  )
}

// ============================================================
//  Premium stat card
// ============================================================
function StatCard({
  label, value, tone,
}: {
  label: string
  value: string
  tone: "rose" | "emerald" | "blue" | "amber" | "white"
}) {
  const valueColor = {
    rose: "text-rose-400",
    emerald: "text-emerald-400",
    blue: "text-sky-400",
    amber: "text-amber-400",
    white: "text-white",
  }[tone]
  const glow = {
    rose: "bg-rose-500/10",
    emerald: "bg-emerald-500/10",
    blue: "bg-sky-500/10",
    amber: "bg-amber-500/10",
    white: "bg-white/10",
  }[tone]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-4 sm:p-5">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${glow}`} />
      <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1.5 text-xl font-bold tabular-nums sm:text-2xl ${valueColor}`}>{value}</p>
    </div>
  )
}

// ============================================================
//  Main analyzer (PDF -> /api/analyze-statement)
// ============================================================
export default function ExpenseAnalyzer() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF bank statement.")
      return
    }
    setIsProcessing(true)
    setError(null)
    setFileName(file.name)
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result).split(",")[1])
        r.onerror = reject
        r.readAsDataURL(file)
      })

      const res = await fetch("/api/analyze-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfData: base64 }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || "Failed to analyze statement.")
        setAnalysis(null)
      } else {
        setAnalysis(json.data)
      }
    } catch {
      setError("Error processing file. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const clearData = () => {
    setAnalysis(null)
    setFileName(null)
    setError(null)
  }

  // ---------- Upload screen ----------
  if (!analysis) {
    return (
      <div className="space-y-5 sm:space-y-6">
        <div
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all sm:p-8 ${
            isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-white/15 hover:border-emerald-500/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-lg font-medium text-white">Reading statement…</p>
            </div>
          ) : (
            <>
              <h3 className="mb-2 text-xl font-semibold tracking-tight text-white">Upload Bank Statement</h3>
              <p className="mb-6 text-sm text-white/50 sm:text-base">Drag &amp; drop your PDF statement here (Axis, Kotak, HDFC, SBI, ICICI, BoB, PNB…)</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:bg-emerald-400 active:scale-[0.98]">
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                Upload PDF Statement
              </label>
              {error && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  ⚠️ {error}
                </div>
              )}
              <p className="mt-4 text-xs text-white/40">Processed securely in real-time and never stored.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  const s = analysis.summary
  const chartData = analysis.categories.map((c) => ({ name: c.name, value: c.amount, color: c.color }))

  // ---------- Results screen ----------
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 text-white">
          <span className="truncate font-medium">{fileName}</span>
          <span className="shrink-0 text-sm text-white/50">({analysis.all_transactions.length} txns)</span>
        </div>
        <button onClick={clearData} className="shrink-0 self-start rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 transition hover:bg-white/5 sm:self-auto">
          Clear &amp; Upload New
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="Total Spent" value={inr(s.total_spent)} tone="rose" />
        <StatCard label="Total Income" value={inr(s.total_income)} tone="emerald" />
        <StatCard label="Savings Rate" value={`${s.savings_rate}%`} tone="blue" />
        <StatCard
          label="Risk Score"
          value={s.risk_score}
          tone={s.risk_score === "Low" ? "emerald" : s.risk_score === "High" ? "rose" : "amber"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-5">
          <h4 className="mb-4 font-semibold tracking-tight text-white">Spending Mix</h4>
          <ResponsiveContainer width="100%" height={240}>
            <RechartsPie>
              <Pie
                data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                dataKey="value" paddingAngle={3} stroke="transparent"
              >
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                formatter={(v: number) => inr(v)}
                contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
              />
            </RechartsPie>
          </ResponsiveContainer>
          {/* Legend chips — readable on mobile, no overflowing labels */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {chartData.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-4 sm:p-5">
          <h4 className="mb-4 font-semibold tracking-tight text-white">Top Categories</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData.slice(0, 5)} layout="vertical" margin={{ left: 0, right: 8 }}>
              <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 11, fill: "#aaa" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => inr(v)}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {chartData.slice(0, 5).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI insights */}
      {analysis.insights?.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent p-4 sm:p-5">
          <h4 className="mb-3 flex items-center gap-2 font-semibold tracking-tight text-emerald-400">
            <span>✨</span> Monexi AI Insights
          </h4>
          <div className="space-y-2.5">
            {analysis.insights.map((ins, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-emerald-500/10 bg-black/20 px-4 py-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">{i + 1}</span>
                <span className="text-[13px] leading-relaxed text-white/80 sm:text-sm">{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searchable transactions */}
      <div>
        <h4 className="mb-3 font-semibold tracking-tight text-white">Transactions</h4>
        <TransactionSearch all={analysis.all_transactions} payees={analysis.payees} />
      </div>
    </div>
  )
}