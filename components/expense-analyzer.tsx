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

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
      <div className="mb-4 relative">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >✕</button>
        )}
      </div>

      {/* Payee summary when searching */}
      {query.trim() && matchedPayees.length > 0 && (
        <div className="mb-4 space-y-2">
          {matchedPayees.slice(0, 5).map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <div>
                <p className="font-semibold text-white">{p.name}</p>
                <p className="text-xs text-white/50">{p.count} {p.count === 1 ? "transaction" : "transactions"}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">{inr(p.total)}</p>
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/5">
        <div className="grid grid-cols-[1fr_2fr_1.2fr_1fr] gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          <span>Date</span><span>Description</span><span>Category</span><span className="text-right">Amount</span>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {listTxns.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-white/40">No transactions found for “{query}”.</p>
          ) : (
            listTxns.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_2fr_1.2fr_1fr] items-center gap-2 border-b border-white/5 px-4 py-3 text-sm transition hover:bg-white/[0.03]">
                <span className="text-white/50">{t.date}</span>
                <span className="truncate font-medium text-white" title={t.desc}>{t.desc}</span>
                <span><span className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/60">{t.category}</span></span>
                <span className={`text-right font-semibold ${t.type === "DEBIT" ? "text-rose-400" : "text-emerald-400"}`}>
                  {t.type === "DEBIT" ? "- " : "+ "}{inr(t.amount)}
                </span>
              </div>
            ))
          )}
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
      // file -> base64
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
      <div className="space-y-6">
        <div
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
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
              <h3 className="mb-2 text-xl font-semibold text-white">Upload Bank Statement</h3>
              <p className="mb-6 text-white/50">Drag & drop your PDF statement here (Axis, Kotak, HDFC, SBI, ICICI, BoB, PNB…)</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:bg-emerald-400">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="font-medium">{fileName}</span>
          <span className="text-white/50">({analysis.all_transactions.length} transactions)</span>
        </div>
        <button onClick={clearData} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5">
          Clear & Upload New
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-white/50">Total Spent</p>
          <p className="text-2xl font-bold text-rose-400">{inr(s.total_spent)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-white/50">Total Income</p>
          <p className="text-2xl font-bold text-emerald-400">{inr(s.total_income)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-white/50">Savings Rate</p>
          <p className="text-2xl font-bold text-white">{s.savings_rate}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm text-white/50">Risk Score</p>
          <p className={`text-2xl font-bold ${
            s.risk_score === "Low" ? "text-emerald-400" : s.risk_score === "High" ? "text-rose-400" : "text-amber-400"
          }`}>{s.risk_score}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="mb-4 font-semibold text-white">Spending Mix</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => inr(v)} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <h4 className="mb-4 font-semibold text-white">Top Categories</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.slice(0, 5)} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12, fill: "#aaa" }} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.slice(0, 5).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI insights */}
      {analysis.insights?.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <h4 className="mb-3 font-semibold text-emerald-400">Monexi AI Insights</h4>
          <div className="space-y-2">
            {analysis.insights.map((ins, i) => (
              <div key={i} className="flex gap-3 rounded-lg bg-black/20 px-4 py-3 text-sm text-white/80">
                <span className="font-bold text-emerald-400">{i + 1}</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searchable transactions */}
      <div>
        <h4 className="mb-3 font-semibold text-white">Transactions</h4>
        <TransactionSearch all={analysis.all_transactions} payees={analysis.payees} />
      </div>
    </div>
  )
}