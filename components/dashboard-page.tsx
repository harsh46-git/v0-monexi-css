"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  ShoppingBag,
  Shield,
  Target,
  BarChart3,
  TrendingUp,
  Home,
  Utensils,
  Car,
  Tv,
  Zap,           
  ChevronRight,
  Sparkles,       
  FileText,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Bot             
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts"


const supabase = createClient()

interface FinancialPlan {
  essentials: number
  discretionary: number
  savings: number
  split: Record<string, number>
}

interface DashboardPageProps {
  userEmail?: string
}

function calculateSIP(p: number, r: number, t: number): number {
  return p * (((1 + r / 1200) ** (t * 12) - 1) / (r / 1200)) * (1 + r / 1200)
}

function getInvestmentSplit(risk: string): Record<string, number> {
  if (risk === "conservative") return { "FD/RD": 0.6, Gold: 0.3, "Liquid Funds": 0.1 }
  if (risk === "balanced") return { "Nifty 50": 0.5, Bonds: 0.3, Gold: 0.2 }
  return { Midcap: 0.5, Smallcap: 0.3, Crypto: 0.2 }
}

const incomePresets = [
  { label: "25K", value: 25000 },
  { label: "50K", value: 50000 },
  { label: "75K", value: 75000 },
  { label: "1L", value: 100000 },
  { label: "1.5L", value: 150000 },
  { label: "2L+", value: 200000 },
]

const expenseCategories = [
  { id: "rent", label: "Rent/EMI", icon: Home, color: "#ef4444" },
  { id: "food", label: "Food", icon: Utensils, color: "#f97316" },
  { id: "transport", label: "Transport", icon: Car, color: "#eab308" },
  { id: "subscriptions", label: "OTT/Gym", icon: Tv, color: "#22c55e" },
  { id: "utilities", label: "Bills", icon: Zap, color: "#3b82f6" },
  { id: "other", label: "Other", icon: ShoppingBag, color: "#8b5cf6" },
]

const riskProfiles = [
  { id: "conservative", label: "Safe", desc: "FDs, Gold", color: "#3b82f6", returns: "6-8%" },
  { id: "balanced", label: "Balanced", desc: "Mutual Funds", color: "#22c55e", returns: "10-12%" },
  { id: "growth", label: "Aggressive", desc: "Stocks, Crypto", color: "#f97316", returns: "15%+" },
]

export function DashboardPage({ userEmail }: DashboardPageProps) {
  const [step, setStep] = useState(1)
  const [income, setIncome] = useState(50000)
  const [isSaving, setIsSaving] = useState(false)
  const [expenses, setExpenses] = useState<Record<string, number>>({
    rent: 0,
    food: 0,
    transport: 0,
    subscriptions: 0,
    utilities: 0,
    other: 0,
  })
  // 1. AI Advisor Variables 
  const [showAiAdvice, setShowAiAdvice] = useState(false)
  const [aiAdviceText, setAiAdviceText] = useState("") 
  const [isAiLoading, setIsAiLoading] = useState(false)

  // 2. Save Modal Variables 
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isSavingData, setIsSavingData] = useState(false)
  const [risk, setRisk] = useState("balanced")
  const [plan, setPlan] = useState<FinancialPlan | null>(null)
  const [goalName, setGoalName] = useState("iPhone 16")
  const [goalPrice, setGoalPrice] = useState(80000)
  const [emergencySaved, setEmergencySaved] = useState(0)
  // FETCH DATA ON LOAD
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        
        const { data } = await supabase
          .from('user_financials') 
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (data) {
          
          setIncome(data.monthly_income || 0)
          setExpenses(data.expenses || {})
          setRisk(data.investment_style || "balanced")
          
          if (data.monthly_income > 0) {
            
            const totalExp: number = Object.values(data.expenses || {}).reduce((a: number, b: any) => a + Number(b), 0)
            setPlan({
                essentials: (data.expenses?.rent || 0) + (data.expenses?.utilities || 0),
                discretionary: (data.expenses?.food || 0) + (data.expenses?.transport || 0) + (data.expenses?.other || 0),
                savings: Math.max(0, data.monthly_income - totalExp),
                split: getInvestmentSplit(data.investment_style || "balanced")
             })
             setStep(3)
          }
        }
      }
    }
    fetchUserData()
  }, [])

  // SAVE DATA AND MOVE TO STEP 2
  const handleSaveAndContinue = async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ 
          id: user.id, 
          monthly_income: income,
          updated_at: new Date() 
        })

      if (error) {
        console.error("Error saving data:", error.message)
        alert("Could not save your data. Please try again.")
      } else {
        setStep(2)
      }
    }
    setIsSaving(false)
  }

  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0)
  const savingsRate = income > 0 ? ((income - totalExpenses) / income) * 100 : 0
// --- PHASE 1: REALITY CHECK LOGIC (START) ---
  
  // 1. Calculate the real cashflow
  const monthlyCashflow = Math.max(0, income - totalExpenses);
  
  // 2. Determine the "Advisor Verdict"
  let insightStatus = "neutral"; // can be 'danger', 'warning', 'success', 'neutral'
  let insightTitle = "Analyzing...";
  let insightMessage = "Calculations based on your inputs.";

  // LOGIC: Check their financial health
  if (savingsRate < 10) {
    insightStatus = "danger";
    insightTitle = "⚠️ Financial Danger";
    insightMessage = `You are living paycheck to paycheck (Saving ${savingsRate.toFixed(0)}%). One emergency could hurt you.`;
  } 
  else if (savingsRate < 30) {
    insightStatus = "warning";
    insightTitle = "📉 Room for Improvement";
    insightMessage = `You're saving ${savingsRate.toFixed(0)}%. Try to cut 'Wants' to reach 30% savings.`;
  } 
  else if (savingsRate >= 50) {
    insightStatus = "success";
    insightTitle = "🚀 Financial Freedom Fast-Track";
    insightMessage = "You are saving over 50%! You have huge potential for wealth compounding.";
  } 
  else {
    insightStatus = "info";
    insightTitle = "✅ Healthy Balance";
    insightMessage = "Your budget is well-balanced. Focus on consistent investing now.";
  }
  // --- PHASE 1: REALITY CHECK LOGIC (END) ---
  const analyzeBudget = () => {
    const targetSavings = Math.max(0, income - totalExpenses)
    const essentials = expenses.rent + expenses.utilities
    const discretionary = expenses.food + expenses.transport + expenses.subscriptions + expenses.other
    const split = getInvestmentSplit(risk)

    setPlan({
      essentials,
      discretionary,
      savings: targetSavings,
      split,
    })
    setShowSaveModal(true)
  }

  const pieData = plan
    ? [
        { name: "Essentials", value: plan.essentials, color: "#ef4444" },
        { name: "Lifestyle", value: plan.discretionary, color: "#3b82f6" },
        { name: "Savings", value: plan.savings, color: "#22c55e" },
      ]
    : []

  const growthRate = risk === "growth" ? 15 : risk === "balanced" ? 12 : 8

  const projectionData = plan
    ? [
        { month: "Now", value: 0 },
        { month: "6M", value: plan.savings * 6 },
        { month: "1Y", value: calculateSIP(plan.savings, growthRate, 1) },
        { month: "3Y", value: calculateSIP(plan.savings, growthRate, 3) },
        { month: "5Y", value: calculateSIP(plan.savings, growthRate, 5) },
        { month: "10Y", value: calculateSIP(plan.savings, growthRate, 10) },
      ]
    : []
// --- REALISTIC LOGIC: Paste at Line 205 ---
const monthlySavings = plan ? plan.savings : 0;
const suggestedSIP = Math.floor((monthlySavings * 0.7) / 500) * 500; // 70% for SIP
const suggestedEmergency = monthlySavings - suggestedSIP; // 30% for Emergency

const emergencyGoal = totalExpenses * 6;


const monthsToBuild = suggestedEmergency > 0 ? emergencyGoal / suggestedEmergency : 0;

const completionDate = new Date();
completionDate.setMonth(completionDate.getMonth() + monthsToBuild);
const finishDateString = completionDate.toLocaleString('default', { month: 'short', year: 'numeric' });
// ------------------------------------------
// ------------------------------------------
  const emergencyTarget = income * 6
  const emergencyProgress = plan ? Math.min(100, ((plan.savings * 6) / emergencyTarget) * 100) : 0
  const monthsToGoal = plan && plan.savings > 0 ? goalPrice / plan.savings : 0


const saveFinancialData = async () => {
  setIsSavingData(true)
  

  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    alert("⚠️ Save Failed: Aap Login nahi hain! Data save karne ke liye login karein.")
    setIsSavingData(false)
    return
  }

  console.log("Attempting save for User ID:", user.id)

  
  const { error } = await supabase
    .from('user_financials')
    .upsert({
      user_id: user.id,
      monthly_income: income,
      expenses: expenses,
      savings_goal: 0, 
      investment_style: risk,
      updated_at: new Date().toISOString()
    })

  if (error) {
   
    console.error("Supabase Save Error:", error)
    alert(`❌ Error: ${error.message}`)
  } else {
    // Success!
    alert("✅ Profile Saved Successfully!")
    setShowSaveModal(false)
    setStep(3)
  }
  
  setIsSavingData(false)
}


const handleSkipSave = () => {
  setShowSaveModal(false)
  setStep(3)
}

  // 🧠 Gemini AI Function (Paste this before 'return')
const fetchAiAdvice = async () => {
  if (showAiAdvice && aiAdviceText) {
     setShowAiAdvice(false); // Close if already open
     return;
  }
  
  setShowAiAdvice(true);
  if (aiAdviceText) return; // Don't fetch again if we already have it

  setIsAiLoading(true);
  try {
    const res = await fetch('/api/ai-goal-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        goalName: goalName, 
        goalPrice: goalPrice, 
        monthlySavings: suggestedSIP 
      }),
    });
    const data = await res.json();
    setAiAdviceText(data.advice);
  } catch (error) {
    setAiAdviceText("AI is currently sleeping. Try again later.");
  } finally {
    setIsAiLoading(false);
  }
};
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
       

        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s ? "bg-accent text-background" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`w-12 h-1 mx-1 rounded ${step > s ? "bg-accent" : "bg-secondary"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Income */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Step 1 of 3
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">What's your monthly income?</h1>
              <p className="text-muted-foreground">Select or enter your take-home salary</p>
            </div>

            {/* Income Presets */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {incomePresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setIncome(preset.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    income === preset.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-secondary/50 text-foreground hover:border-accent/50"
                  }`}
                >
                  <div className="text-2xl font-bold">{preset.label}</div>
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="glass rounded-2xl p-6 mb-6">
              <Label className="text-muted-foreground text-sm mb-2 block">Or enter exact amount</Label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                              type="number"
                             
                              value={income === 0 ? "" : income}
                              onChange={(e) => setIncome(Number(e.target.value))}
                              placeholder="0" 
                              className="pl-12 text-2xl font-bold h-16 bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            {/* Income Summary */}
            <div className="glass rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Your Income</p>
                  <p className="text-3xl font-bold text-foreground">
                    {income.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Per Year</p>
                  <p className="text-xl font-semibold text-accent">
                    {(income * 12).toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ FIXED STEP 1 BUTTON:  */}
            <Button
                    onClick={() => setStep(2)}
                    disabled={!income} 
                    className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
                  >
                    Next Step <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
          </div>
        )}

        {/* ... Rest of your component (Step 2 and Step 3 remain the same) ... */}
        {/* Make sure to copy the rest of your Step 2 and Step 3 logic from your original file here */}
        
        {step === 2 && (
            <div className="animate-slide-up">
              {/* Your Step 2 JSX */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Step 2 of 3
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Where does your money go?</h1>
                <p className="text-muted-foreground">Enter your monthly expenses by category</p>
              </div>

              {/* Live Summary Bar */}
              <div className="glass rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Budget Used</span>
                  <span
                    className={`text-sm font-semibold ${savingsRate >= 20 ? "text-accent" : savingsRate >= 0 ? "text-yellow-500" : "text-destructive"}`}
                  >
                    {savingsRate >= 0 ? `${savingsRate.toFixed(0)}% savings` : "Over budget!"}
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${totalExpenses > income ? "bg-destructive" : "bg-accent"}`}
                    style={{ width: `${Math.min(100, (totalExpenses / income) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    Spent:{" "}
                    {totalExpenses.toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  <span>
                    Left:{" "}
                    {Math.max(0, income - totalExpenses).toLocaleString("en-IN", {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {expenseCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <div key={category.id} className="glass rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <IconComponent className="w-6 h-6" style={{ color: category.color }} />
                        </div>
                        <div className="flex-1">
                          <Label className="text-foreground font-medium">{category.label}</Label>
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <Input
  type="number"
  
  
  value={expenses[category.id] || ''}
  
  onChange={(e) => {
    const val = e.target.value;
   
    const numVal = val === '' ? 0 : parseFloat(val);
    
    setExpenses(prev => ({
      ...prev,
      [category.id]: numVal
    }));
  }}
  placeholder="0" 
  className="pl-8 bg-secondary border-border text-foreground font-semibold"
/>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            {((expenses[category.id] / income) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="glass rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">Investment Style</h3>
                <div className="grid grid-cols-3 gap-3">
                  {riskProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => setRisk(profile.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        risk === profile.id
                          ? "border-accent bg-accent/10"
                          : "border-border bg-secondary/50 hover:border-accent/50"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                        style={{ backgroundColor: `${profile.color}20` }}
                      >
                        <TrendingUp className="w-5 h-5" style={{ color: profile.color }} />
                      </div>
                      <div className="font-semibold text-foreground text-sm">{profile.label}</div>
                      <div className="text-xs text-muted-foreground">{profile.returns}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 text-lg border-border">
                  Back
                  </Button>
                {/* ✅ UPDATED ANALYZE BUTTON (No Auto-Save) */}
          <Button
            onClick={() => {
              // 1. Totals Calculate karein
              const totalExp = Object.values(expenses).reduce((a: any, b: any) => a + Number(b), 0)
              
              // 2. Result (Plan) Taiyaar karein
              const targetSavings = Math.max(0, income - totalExp)
              const essentials = (Number(expenses.rent) || 0) + (Number(expenses.utilities) || 0)
              const discretionary = (Number(expenses.food) || 0) + (Number(expenses.transport) || 0) + (Number(expenses.subscriptions) || 0) + (Number(expenses.other) || 0)

              setPlan({
                essentials,
                discretionary,
                savings: targetSavings,
                split: getInvestmentSplit(risk),
              })

            
              setShowSaveModal(true)
            }}
            className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
          >
            Analyze <Sparkles className="w-5 h-5 ml-2" />
          </Button>
              </div>
            </div>
        )}

        {step === 3 && plan && (
            <div className="animate-slide-up">
                {/* Your Step 3 JSX from the original code */}
                {/* ... (Include all the stats, charts, and goals from your original code) ... */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    Your Financial Plan
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Here's your money breakdown</h1>
                </div>
                {/* --- PHASE 2: TOP METRICS STRIP --- */}
                {(() => {
                  const annualSavings = plan.savings * 12
                  const healthScore = Math.max(20, Math.min(100, Math.round(40 + savingsRate)))
                  const scoreColor = healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-yellow-400" : "text-red-400"
                  const scoreRing = healthScore >= 75 ? "#10b981" : healthScore >= 50 ? "#eab308" : "#ef4444"
                  const insight =
                    savingsRate >= 50 ? `You're saving ${savingsRate.toFixed(0)}% — top 5% of savers. Channel it into SIPs for max compounding.`
                    : savingsRate >= 30 ? `Solid ${savingsRate.toFixed(0)}% savings rate. Bump it by ₹2,000/mo to hit your goal faster.`
                    : savingsRate >= 15 ? `${savingsRate.toFixed(0)}% saved. Trim one expense category to cross the 30% mark.`
                    : `Savings rate is low at ${savingsRate.toFixed(0)}%. Review expenses to free up cash.`
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

                      {/* Health Score */}
                      <div className="glass rounded-2xl p-6 flex items-center gap-4">
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="16" fill="none" stroke={scoreRing} strokeWidth="3" strokeDasharray={`${healthScore} 100`} strokeLinecap="round" />
                          </svg>
                          <div className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${scoreColor}`}>
                            {healthScore}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Financial Health</p>
                          <p className={`font-bold ${scoreColor}`}>
                            {healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Good" : "Needs Work"}
                          </p>
                        </div>
                      </div>

                      {/* Monthly Savings */}
                      <div className="glass rounded-2xl p-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly Savings</p>
                        <p className="text-2xl font-bold text-emerald-400">₹{plan.savings.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground mt-1">₹{annualSavings.toLocaleString("en-IN")}/year</p>
                      </div>
                    </div>
                  )
                })()}

                {/* AI Insight line */}
                {(() => {
                  const insight =
                    savingsRate >= 50 ? `You're saving ${savingsRate.toFixed(0)}% — top tier. Channel it into SIPs for max compounding.`
                    : savingsRate >= 30 ? `Solid ${savingsRate.toFixed(0)}% savings rate. Bump it by ₹2,000/mo to hit your goal faster.`
                    : savingsRate >= 15 ? `${savingsRate.toFixed(0)}% saved. Trim one expense category to cross 30%.`
                    : `Savings rate is low at ${savingsRate.toFixed(0)}%. Review expenses to free up cash.`
                  return (
                    <div className="mb-8 p-4 rounded-xl bg-accent/5 border border-accent/20 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-accent font-bold uppercase tracking-wider mb-1">AI Insight</p>
                        <p className="text-sm text-foreground/90">{insight}</p>
                      </div>
                    </div>
                  )
                })()}
                {/* --- END PHASE 2 --- */}
{/* --- INSIGHT BANNER START (Paste at Line 461) --- */}
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-4 ${
          insightStatus === 'danger' ? 'bg-red-900/20 border-red-800' : 
          insightStatus === 'warning' ? 'bg-yellow-900/20 border-yellow-800' :
          insightStatus === 'success' ? 'bg-emerald-900/20 border-emerald-800' : 
          'bg-blue-900/20 border-blue-800'
        }`}>
          <div className={`p-2 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
            insightStatus === 'danger' ? 'bg-red-500/20 text-red-400' : 
            insightStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            insightStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
            'bg-blue-500/20 text-blue-400'
          }`}>
            {insightStatus === 'danger' ? '!' : insightStatus === 'success' ? '✓' : 'i'}
          </div>
          <div>
            <h4 className={`font-bold text-lg ${
              insightStatus === 'danger' ? 'text-red-400' : 
              insightStatus === 'warning' ? 'text-yellow-400' :
              insightStatus === 'success' ? 'text-emerald-400' : 
              'text-blue-400'
            }`}>
              {insightTitle}
            </h4>
            <p className="text-sm text-gray-300 mt-1">
              {insightMessage}
            </p>
          </div>
        </div>
        {/* --- INSIGHT BANNER END --- */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDownRight className="w-5 h-5 text-destructive" />
                      <span className="text-sm text-muted-foreground">Total Expenses</span>
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-foreground">
                      {totalExpenses.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                  <div className="glass rounded-2xl p-5 border-2 border-accent">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUpRight className="w-5 h-5 text-accent" />
                      <span className="text-sm text-muted-foreground">Monthly Savings</span>
                    </div>
                    {/* --- PHASE 3: SMART SAVINGS CARD (START) --- */}
        <div className="glass rounded-2xl p-5 border-2 border-accent relative overflow-hidden group">
          
          {/* Top Badge (Only shows if saving > 30%) */}
          {(plan.savings / (income || 1)) > 0.3 && (
             <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
               TOP SAVER 🏆
             </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Monthly Savings</span>
          </div>

          <div className="text-2xl md:text-3xl font-bold text-foreground">
            {plan.savings.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            })}
          </div>

          {/* REALITY CONTEXT LINE */}
          <div className="mt-2 pt-2 border-t border-gray-700/30">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>🏠</span>
              <span>
                Eqv. to <span className="text-foreground font-bold">
                  {/* Agar Rent data hai to use karo, nahi to 15000 assume karo */}
                  {expenses.rent ? (plan.savings / expenses.rent).toFixed(1) : ((plan.savings / 15000).toFixed(1))}x
                </span> Rent
              </span>
            </p>
          </div>
        </div>
        {/* --- PHASE 3: SMART SAVINGS CARD (END) --- */}
                    <div className="text-2xl md:text-3xl font-bold text-accent">
                      {plan.savings.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Savings Rate</h3>
                    <span className={`text-3xl font-bold ${savingsRate >= 20 ? "text-accent" : "text-yellow-500"}`}>
                      {savingsRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={savingsRate} className="h-4 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {savingsRate >= 30
                      ? "Excellent! You're saving like a pro."
                      : savingsRate >= 20
                        ? "Good job! You're on track."
                        : savingsRate >= 10
                          ? "Try to increase savings to 20%+"
                          : "Consider reducing expenses to save more."}
                  </p>
                </div>

                <div className="glass rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Budget Allocation</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
  formatter={(value: number) =>
    value.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
  }
  
  contentStyle={{
    backgroundColor: "#ffffff", 
    border: "none",             
    borderRadius: "12px",       
    color: "#000000",           // Text Black
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)", // Shadow 
    padding: "10px 16px",
    fontWeight: "bold"
  }}
  itemStyle={{ color: "#000" }} 
/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">Wealth Growth</h3>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
                        <YAxis
                          stroke="#888"
                          tick={{ fill: "#888", fontSize: 12 }}
                          tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}K`)}
                        />
                        <Tooltip
                          formatter={(value: number) =>
                            value.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
                          }
                          contentStyle={{
                            backgroundColor: "rgba(22, 28, 45, 0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    If you invest your savings at ~{growthRate}% returns
                  </p>
                </div>

                {/* --- WEALTH SCENARIO SIMULATOR --- */}
                {(() => {
                  const boost = 2000
                  const current10Y = calculateSIP(plan.savings, growthRate, 10)
                  const boosted10Y = calculateSIP(plan.savings + boost, growthRate, 10)
                  const extra = boosted10Y - current10Y
                  const fmt = (n: number) => {
                    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
                    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
                    return `₹${Math.round(n).toLocaleString("en-IN")}`
                  }
                  return (
                    <div className="glass rounded-2xl p-6 mb-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Sparkles className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-semibold text-foreground">What if you saved more?</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current */}
                        <div className="rounded-xl p-5 bg-secondary/50 border border-border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Current Plan</p>
                          <p className="text-2xl font-bold text-foreground">{fmt(current10Y)}</p>
                          <p className="text-xs text-muted-foreground mt-1">in 10 years</p>
                        </div>
                        {/* Boosted */}
                        <div className="rounded-xl p-5 bg-emerald-500/10 border border-emerald-500/30">
                          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">+ ₹{boost.toLocaleString("en-IN")}/mo</p>
                          <p className="text-2xl font-bold text-emerald-400">{fmt(boosted10Y)}</p>
                          <p className="text-xs text-muted-foreground mt-1">in 10 years</p>
                        </div>
                        {/* Extra */}
                        <div className="rounded-xl p-5 bg-accent/10 border border-accent/30 flex flex-col justify-center">
                          <p className="text-xs text-accent uppercase tracking-wider mb-2">Extra Wealth Created</p>
                          <p className="text-2xl font-bold text-accent">+{fmt(extra)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Just ₹{boost.toLocaleString("en-IN")} more per month, compounded over 10 years at ~{growthRate}%
                      </p>
                    </div>
                  )
                })()}
                {/* --- END SCENARIO --- */}

               {/* ✅ GRID START: Emergency Fund & Goal Tracker */}

               {/* ✅ GRID START: Emergency Fund & Goal Tracker */}
               <div className="grid grid-cols-1 gap-4 mb-6">
          
          {/* 1. REALISTIC EMERGENCY FUND CARD */}
          <div className="glass rounded-2xl p-5 border-2 border-blue-500/20 relative overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-blue-500/10 transition-all">
             
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                     <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Emergency Fund</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Goal: 6 Months Backup</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-xl font-black text-foreground">
                      {(totalExpenses * 6).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                   </p>
                </div>
             </div>
  
             <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-blue-200 font-medium">Recommended Deposit:</span>
                  <span className="text-sm font-bold text-blue-400">
                    ₹{suggestedEmergency.toLocaleString()}<span className="text-[10px] opacity-70">/mo</span>
                  </span>
                </div>
                <p className="text-[10px] text-blue-300/60 leading-tight">
                  (We allocated 30% of your savings here so you can invest the rest)
                </p>
             </div>

             <div className="flex items-center gap-2 mb-3">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-xs text-gray-400">
                   Safe by: <span className="text-white font-bold">{monthsToBuild < 1 ? "Next Month! 🚀" : finishDateString}</span>
                </p>
             </div>
             
             <div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                   <div 
                     className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" 
                     style={{ width: `${Math.min(100, (plan.savings > 0 ? (suggestedEmergency / (totalExpenses * 6)) * 100 : 5))}%` }}
                   ></div>
                </div>
             </div>
          </div>

         {/* ✅ SMART AI GOAL TRACKER (Replace only this Purple Card) */}
         <div className="glass rounded-2xl p-5 border-2 border-purple-500/20 relative overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-purple-500/10 transition-all group">
             
             {/* Header */}
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                     {/* Make sure Target is imported */}
                     <Target className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Dream Goal</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Smart Planner</p>
                  </div>
                </div>
                {/* Dynamic Status Badge */}
                <div className={`px-3 py-1 rounded-lg border ${monthsToGoal > 12 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-purple-500/10 border-purple-500/30 text-purple-300'}`}>
                   <span className="font-bold text-xs">
                     {monthsToGoal < 1 ? "Achieved! 🎉" : `${monthsToGoal.toFixed(1)} Months`}
                   </span>
                </div>
             </div>

             {/* Inputs */}
             <div className="space-y-3 mb-4">
                <Input
                  placeholder="e.g. MacBook Air"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="bg-white/5 border-white/10 text-foreground font-semibold focus:border-purple-500 transition-all h-10 text-sm placeholder:text-gray-600"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-bold text-sm">₹</span>
                  <Input
                    type="number"
                    value={goalPrice === 0 ? "" : goalPrice}
                    onChange={(e) => setGoalPrice(Number(e.target.value))}
                    placeholder="0"
                    className="pl-7 bg-white/5 border-white/10 text-foreground font-semibold focus:border-purple-500 transition-all h-10 text-sm [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
             </div>

           {/* 2. ⚡ SMART ADAPTIVE BOOST SUGGESTION (Replace Old Logic with This) */}
                 {(() => {
                    // 1. Calculate basic timeline
                    const monthlySavings = suggestedSIP || 1;
                    const currentMonths = goalPrice / monthlySavings;
                    
                    // 2. Decide "Target Saving" based on how long the goal is
                    let monthsToSave = 1;
                    let label = "1 Month";

                    if (currentMonths > 120) { // If > 10 Years
                        monthsToSave = 60;     // Target: Save 5 Years
                        label = "5 Years";
                    } else if (currentMonths > 60) { // If > 5 Years
                        monthsToSave = 12;     // Target: Save 1 Year
                        label = "1 Year";
                    } else if (currentMonths > 24) { // If > 2 Years
                        monthsToSave = 3;      // Target: Save 3 Months
                        label = "3 Months";
                    }

                    // 3. Calculate Extra Money Needed
                    const targetMonths = currentMonths - monthsToSave;
                    
                    if (targetMonths <= 0) return null; // Already achieved

                    const requiredMonthly = goalPrice / targetMonths;
                    const extraNeeded = Math.ceil((requiredMonthly - monthlySavings) / 100) * 100; // Round to 100

                    // 4. Display Logic
                    if (currentMonths > 1 && extraNeeded > 0) {
                      return (
                         <div className="bg-purple-900/40 p-2 rounded-lg mb-3 border border-purple-500/10 flex items-start gap-2">
                            <div className="mt-0.5"><Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse" /></div>
                            <div>
                              <p className="text-[10px] text-gray-300 leading-tight">
                                 Add <span className="text-white font-bold">₹{extraNeeded.toLocaleString()}</span> more to buy it <span className="text-green-400 font-bold">{label} Earlier! 🚀</span>
                              </p>
                            </div>
                         </div>
                      );
                    } else if (currentMonths <= 1) {
                       return (
                         <div className="bg-green-500/10 p-2 rounded-lg mb-3 border border-green-500/20">
                            <p className="text-[10px] text-green-300 font-bold text-center">
                               Almost there! You are very close to your goal. 🎉
                            </p>
                         </div>
                       )
                    }
                    return null;
                 })()}

              {/* 🤖 AI ADVISOR BUTTON (Connected to Gemini) */}
              <button 
                    onClick={fetchAiAdvice}
                    disabled={isAiLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-lg shadow-purple-900/20 cursor-pointer disabled:opacity-70"
                 >
                    {isAiLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <Sparkles className="w-3 h-3" />
                    )}
                    {isAiLoading ? "Analyzing..." : (showAiAdvice ? "Hide Advice" : "Ask AI Advisor")}
                 </button>

                 {/* 4. REAL GEMINI ADVICE RESULT */}
                 {showAiAdvice && (
                   <div className="mt-3 pt-3 border-t border-purple-500/20 animate-slide-up">
                      <div className="flex gap-2">
                         <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                            <Bot className="w-3 h-3 text-white" />
                         </div>
                         <div>
                            <p className="text-[11px] text-gray-300 leading-relaxed">
                               <span className="text-purple-300 font-bold"> Monexi Says:</span> 
                               {isAiLoading ? (
                                 <span className="animate-pulse ml-1">Thinking...</span>
                               ) : (
                                 <span className="ml-1">{aiAdviceText}</span>
                               )}
                            </p>
                         </div>
                      </div>
                   </div>
                 )}
 </div>
             </div>
         
        {/*  GRID END */}
{/* --- DUAL ACTION CARDS (SIP + STOCKS) --- */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
           
           {/* 1. SIP Tool Card */}
           <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 border border-emerald-500/30 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-emerald-500" />
              </div>
              
              <div>
                <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                   🌱 SIP Calculator
                </h3>
                <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                   Calculated SIP: <span className="text-white font-bold">₹{suggestedSIP ? suggestedSIP.toLocaleString() : "0"}</span>
                   <br/>Check how much wealth you can create.
                </p>
              </div>
              
              
           </div>

           {/* 2. Stock Market Card */}
           <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/10 border border-purple-500/30 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-16 h-16 text-purple-500" />
              </div>

              <div>
                <h3 className="text-purple-400 font-bold text-lg flex items-center gap-2">
                   📈 Stock Market
                </h3>
                <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                   Want to invest directly in stocks?
                   <br/>Analyze market trends and top stocks.
                </p>
              </div>
              
              
           </div>

{/* 3. Statement Analysis Card (New) */}
<div 
        
        className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 border border-blue-800/50 rounded-2xl p-6 relative overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer group"
      >
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <FileText className="w-16 h-16 text-blue-500" />
        </div>

        <div>
          <h3 className="text-blue-400 font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Statement Insights
          </h3>
          <p className="text-gray-300 text-xs mt-2 leading-relaxed">
            Upload bank statement PDF.
            <br />
            Get <span className="tex t-white font-bold">AI-driven</span> spending analytics.
            </p>
      </div>
    </div>   {/*  Card  */}
  </div>     {/*  */}

  {/* -------------------------------------------------- */}
       
        
        {/* ------------------------------------------- */}
                <div className="glass rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Suggested Investment Split</h3>
                  <div className="space-y-3">
                    {Object.entries(plan.split).map(([name, percentage]) => (
                      <div key={name} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-foreground font-medium">{name}</span>
                            <span className="text-accent font-semibold">
                              {(plan.savings * percentage).toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          <Progress value={percentage * 100} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {(percentage * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-6 border-t border-white/10 pt-6">
  
  {/* 1. EDIT BUTTON:  */}
  <Button
    onClick={() => setStep(2)} 
    className="w-full h-14 text-lg gradient-accent text-background font-semibold shadow-lg hover:shadow-emerald-500/20 transition-all"
  >
    <ChevronRight className="w-5 h-5 rotate-180 mr-2" /> {/* Back Arrow Icon */}
    Edit Income & Expenses
  </Button>

 {/* ✅ Start Fresh Button with DEBUGGING */}
 {/* ✅ FINAL CLEAN START FRESH BUTTON */}
 <Button
                    variant="ghost"
                    onClick={async () => {
                      if (!confirm("Are you sure? This will clear all your data permanently.")) return;

                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          await supabase
                            .from('user_financials')
                            .delete()
                            .eq('user_id', user.id);
                        }
                      } catch (error) {
                        console.error("Error clearing data:", error);
                      }

                      setStep(1);
                      setPlan(null);
                      setIncome(0);
                      setExpenses({});
                      setRisk("balanced");
                      
                      
                      // alert("Data cleared successfully!"); 
                    }}
                    className="w-full h-12 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                  >
                    Start Fresh Calculation
                  </Button>
</div>
            </div>
        )}
        {/* --- STEP 4: SAVE DATA MODAL --- */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold text-white">Save your Profile?</h3>
                    <p className="text-gray-400 text-sm mt-2">
                        Do you want to save this data securely? This allows Monexi to track your progress next time.
                    </p>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={handleSkipSave} 
                      className="flex-1 border-white/10 hover:bg-white/5 text-gray-300"
                    >
                        No, skip
                    </Button>
                    <Button 
                      onClick={saveFinancialData} 
                      disabled={isSavingData} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                        {isSavingData ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : "Yes, Save"}
                    </Button>
                </div>
            </div>
        </div>
      )}
      {/* --- END OF MODAL --- */}
      </div>
    </div>
  )
}