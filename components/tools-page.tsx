
"use client"
import { 
  Calendar, Users, MapPin, Plane, ArrowRight, Wallet, Loader2, Search,
  Hotel, Star, Check, Landmark, Rocket, ShieldCheck, BarChart4, 
  Sparkles, Ticket, Utensils, TrainFront, Globe, Lock // 👈 Yahan 'Lock' add kar diya
} from "lucide-react"

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Navbar } from "@/components/navbar"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  XAxis, YAxis, Area, AreaChart, CartesianGrid 
} from "recharts"
import ExpenseAnalyzer from "@/components/expense-analyzer"
import TaxPlanner from "@/components/tax-planner"

const BRAND_EMERALD = "#10b981"

// --- LOGIC: STOCK API ---
async function fetchRealStockPrice(symbol: string) {
  try {
    const response = await fetch(`/api/stock?symbol=${symbol}`)
    if (!response.ok) return null
    const data = await response.json()
    return {
      current: data.current,
      change: data.current - data.previousClose,
      percent: ((data.current - data.previousClose) / data.previousClose) * 100,
    }
  } catch (error) {
    return null
  }
}
/**
 * Generates a stable seed based on the symbol string.
 * This ensures the chart pattern remains consistent for the same stock.
 */
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    hash = (hash * 16807) % 2147483647;
    return (hash - 1) / 2147483646;
  };
};
// SMOOTH CHART GENERATOR (Groww Style - Controlled Momentum)
/**
 * Generates realistic price history based on the selected timeframe.
 * Mimics Groww's long-term growth curve for 1Y/ALL and flat volatility for 1D.
 */
function generateProfessionalHistory(basePrice: number, points: number, symbol: string, filter: string) {
  const data = [];
  const rng = seededRandom(symbol);
  
  // 1. Set Start Price based on filter
  let current = basePrice;
  if (filter === "ALL") current = basePrice * 0.15;      // Start from 15% (Huge Growth)
  else if (filter === "1Y") current = basePrice * 0.75;  // Start from 75%
  else if (filter === "3M") current = basePrice * 0.90;
  else if (filter === "1M") current = basePrice * 0.95;
  else if (filter === "1D") current = basePrice * 0.99;

  for (let i = 0; i < points; i++) {
    // 2. Magnetic Pull Logic:
    // Calculate how much we NEED to move to reach the target exactly
    const remainingSteps = points - i;
    const targetDiff = basePrice - current;
    const pullToTarget = targetDiff / remainingSteps; 

    // 3. Add Volatility (Noise)
    // Random movement adds the zig-zag pattern
    // We reduce volatility slightly at the end to ensure a smooth landing
    const volatility = (filter === "ALL" || filter === "1Y") ? 0.08 : 0.003; 
    const randomMove = (rng() - 0.5) * (basePrice * volatility);
    
    // Combine Pull + Randomness (Dampen randomness near the end)
    const dampener = Math.min(1, remainingSteps / 5); 
    current += pullToTarget + (randomMove * dampener);

    // 4. Date Logic for Tooltip
    const date = new Date();
    const progress = i / points;
    
    if (filter === "ALL") date.setFullYear(date.getFullYear() - Math.floor(10 * (1 - progress)));
    else if (filter === "1Y") date.setFullYear(date.getFullYear() - 1 + progress); // Simple approx
    else if (filter === "3M") date.setMonth(date.getMonth() - Math.floor(3 * (1 - progress)));
    else if (filter === "1M") date.setDate(date.getDate() - Math.floor(30 * (1 - progress)));
    else if (filter === "1W") date.setDate(date.getDate() - Math.floor(7 * (1 - progress)));
    else date.setMinutes(date.getMinutes() - Math.floor(390 * (1 - progress))); // Market hours

    data.push({
      time: (filter === "ALL" || filter === "1Y" || filter === "3M" || filter === "1M") 
        ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) 
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: Number.parseFloat(Math.abs(current).toFixed(2)),
    });
  }
  return data;
}
// --- LOGIC: SIP ENGINE ---
const calculateSIPData = (monthly: number, rate: number, years: number) => {
  const i = rate / 100 / 12
  const n = years * 12
  const maturityValue = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i)
  const invested = monthly * n
  return { invested, gains: maturityValue - invested, total: maturityValue }
}

// --- DATABASE: REAL WORLD TRIP COSTS ---
const tripDatabase = [
  { name: "Goa", code: "GOI", baseHotel: 3500, food: 2500, img: "🏖️" },
  { name: "Manali", code: "KUU", baseHotel: 2500, food: 1800, img: "🏔️" },
  { name: "Kerala", code: "COK", baseHotel: 4000, food: 2000, img: "🛶" },
  { name: "Jaipur", code: "JAI", baseHotel: 2800, food: 1500, img: "🏰" },
  { name: "Ladakh", code: "IXL", baseHotel: 4500, food: 3000, img: "🏍️" },
  { name: "Andaman", code: "IXZ", baseHotel: 5000, food: 3500, img: "🏝️" },
  { name: "Dubai", code: "DXB", baseHotel: 9000, food: 6000, img: "🏙️" },
  { name: "Bangkok", code: "BKK", baseHotel: 4500, food: 3500, img: "🐘" },
]
// 👇 Paste at Line 130 (Function se pehle)
const DEMO_DATA = {
  summary: {
    total_spent: 42500.00,
    total_income: 85000.00,
    savings_rate: 50.0,
    risk_score: "Low"
  },
  categories: [
    { name: "Rent & Bills", amount: 25000, color: "#10B981" },
    { name: "Food & Dining", amount: 8500, color: "#F59E0B" },
    { name: "Travel", amount: 4000, color: "#3B82F6" },
    { name: "Shopping", amount: 3000, color: "#EC4899" },
    { name: "UPI & Transfers", amount: 2000, color: "#8B5CF6" }
  ],
  insights: [
    "✅ Excellent! You saved 50% of your income this month.",
    "💡 Rent is your biggest expense (58% of spending).",
    "🚀 Investment Opportunity: You have ₹42.5k surplus to invest in SIPs."
  ],
  recent_transactions: [
    { date: "01/12", desc: "SALARY CREDITED", amount: 85000, type: "CREDIT", category: "Income" },
    { date: "02/12", desc: "House Rent", amount: 22000, type: "DEBIT", category: "Bills" },
    { date: "05/12", desc: "Zomato", amount: 450, type: "DEBIT", category: "Food" },
    { date: "10/12", desc: "Uber Rides", amount: 850, type: "DEBIT", category: "Travel" },
    { date: "15/12", desc: "Netflix Subscription", amount: 649, type: "DEBIT", category: "Bills" }
  ]
};
// ============================================================
//  PASTE THIS at module level in tools-page.tsx
//  (after the DEMO_DATA object, BEFORE `function ToolsContent()`)
// ============================================================
function TxnSearchTable({ txns, payees }: { txns: any[]; payees?: any[] }) {
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)

  const inr = (n: number) => "₹" + Math.round(Math.abs(n)).toLocaleString("en-IN")
  const list = Array.isArray(txns) ? txns : []

  // build payee summary client-side if backend didn't send it (works on demo too)
  const allPayees = useMemo(() => {
    if (payees && payees.length) return payees
    const m: Record<string, any> = {}
    for (const t of list) {
      const name = t.desc || t.description || "Unknown"
      const key = name.toLowerCase()
      if (!m[key]) m[key] = { name, count: 0, total: 0 }
      m[key].count += 1
      m[key].total += Math.abs(t.amount)
    }
    return Object.values(m).sort((a: any, b: any) => b.total - a.total)
  }, [list, payees])

  const q = query.trim().toLowerCase()

  const matchedPayees = useMemo(
    () => (q ? allPayees.filter((p: any) => p.name.toLowerCase().includes(q)) : []),
    [q, allPayees]
  )
  const matchedTxns = useMemo(
    () =>
      q
        ? list.filter(
            (t) =>
              (t.desc || t.description || "").toLowerCase().includes(q) ||
              (t.category || "").toLowerCase().includes(q)
          )
        : [],
    [q, list]
  )
  const searchTotal = useMemo(
    () =>
      matchedTxns.reduce(
        (s, t) => s + (String(t.type).toUpperCase() === "DEBIT" ? Math.abs(t.amount) : 0),
        0
      ),
    [matchedTxns]
  )

  const shown = q ? matchedTxns : expanded ? list : list.slice(0, 8)

  return (
    <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-8">
      <div className="border border-white/10 rounded-3xl overflow-hidden bg-[#0a0a0a] shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-3">
            Recent Transactions
          </h4>
          {/* SEARCH BOX */}
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or merchant (e.g. Zomato, Amazon, Rent)…"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-10 text-sm text-white placeholder-gray-600 outline-none transition focus:border-[#10b981]/60"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* PAYEE SUMMARY when searching */}
          {q && matchedPayees.length > 0 && (
            <div className="mt-3 space-y-2">
              {matchedPayees.slice(0, 5).map((p: any) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between rounded-xl border border-[#10b981]/20 bg-[#10b981]/[0.06] px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-white">{p.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {p.count} {p.count === 1 ? "transaction" : "transactions"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#10b981]">{inr(p.total)}</p>
                    <p className="text-[10px] text-gray-500 uppercase">total</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {q && (
            <p className="mt-3 text-xs text-gray-400 font-medium">
              Found <span className="font-black text-white">{matchedTxns.length}</span> transactions
              {searchTotal > 0 && (
                <>
                  {" "}· total paid out{" "}
                  <span className="font-black text-[#10b981]">{inr(searchTotal)}</span>
                </>
              )}
            </p>
          )}
        </div>

       {/* TABLE */}
       <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead className="bg-white/5 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
            <tr>
              <th className="p-4 pl-6">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right pr-6">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {shown.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-gray-500">
                  No transactions found for “{query}”.
                </td>
              </tr>
            ) : (
              shown.map((t: any, i: number) => {
                const isDebit = String(t.type).toUpperCase() === "DEBIT"
                return (
                  <tr
                    key={i}
                    className="hover:bg-white/5 transition-colors text-sm font-medium group"
                  >
                   <td className="p-4 pl-6 text-gray-500 tabular-nums whitespace-nowrap">{t.date}</td>
                    <td className="p-4 text-white group-hover:text-[#10b981] transition-colors uppercase tracking-wider text-[11px] md:text-sm">
                      {t.desc || t.description || "Unknown"}
                    </td>
                    <td className="p-4">
                      <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-gray-800 text-gray-400 border border-gray-700 whitespace-nowrap">
                        {t.category}
                      </span>
                    </td>
                    <td
                      className={`p-4 pr-6 text-right font-black tabular-nums ${
                        isDebit ? "text-white" : "text-[#10b981]"
                      }`}
                    >
                      {isDebit ? "-" : "+"} {inr(t.amount)}
                    </td>
                  </tr>
                )
              })
            )}
         </tbody>
        </table>
        </div>

        {/* VIEW ALL / LESS */}
        {!q && list.length > 8 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full py-4 text-xs font-black uppercase tracking-widest text-[#10b981] border-t border-white/5 hover:bg-white/5 transition-all"
          >
            {expanded ? "Show less" : `View all ${list.length} transactions`}
          </button>
        )}
      </div>
    </div>
  )
}
// FIX: Exported as a NAMED export to match your page.tsx import
function ToolsContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams ? (searchParams.get("tab") === "sip" ? "sip" : "market") : "market"
  const [transactions, setTransactions] = useState<any[]>([]); // Data store karne ke liye
  const [analysisResult, setAnalysisResult] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
 
  const [dashboardData, setDashboardData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [symbol, setSymbol] = useState("RELIANCE")
  const [stockData, setStockData] = useState<any>(null)
  const [stockError, setStockError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSug, setShowSug] = useState(false)
  const [lastUpdated, setLastUpdated] = useState("")
  const [timeFilter, setTimeFilter] = useState("1D");
  const [watchlist, setWatchlist] = useState<any[]>([
    { sym: "RELIANCE.NS", price: 0, change: 0 },
    { sym: "TCS.NS", price: 0, change: 0 },
    { sym: "HDFCBANK.NS", price: 0, change: 0 },
    { sym: "INFY.NS", price: 0, change: 0 },
  ])

  const updateWatchlist = useCallback(async () => {
    const updated = await Promise.all(
      watchlist.map(async (item) => {
        const data = await fetchRealStockPrice(item.sym)
        return data ? { ...item, price: data.current, change: data.percent } : item
      }),
    )
    setWatchlist(updated)
  }, [watchlist])

  useEffect(() => {
    updateWatchlist()
    const interval = setInterval(updateWatchlist, 30000)
    return () => clearInterval(interval)
  }, [])
// 👇 PASTE HERE (Line 195) 👇
const handleDemoAnalysis = async () => {
  setIsAnalyzing(true);
  // Fake loading delay (1.5 seconds)
  setTimeout(() => {
    setDashboardData(DEMO_DATA);
    setIsAnalyzing(false);
    // Scroll smoothly to dashboard
    window.scrollTo({ top: 800, behavior: 'smooth' });
  }, 1500);
};
  // SIP STATES
  const [sipM, setSipM] = useState(5000)
  const [sipR, setSipR] = useState(12)
  const [sipY, setSipY] = useState(10)
  const sipResult = useMemo(() => calculateSIPData(sipM, sipR, sipY), [sipM, sipR, sipY])
// --- NEW TRIP PLANNER STATES (MMT STYLE) ---
// --- NEW TRIP PLANNER STATES (FLIGHT LIST SUPPORT) ---
const [origin, setOrigin] = useState("New Delhi") 
const [dest, setDest] = useState("Goa")
const [startDate, setStartDate] = useState("")
const [travellers, setTravellers] = useState(1)
const [rooms, setRooms] = useState(1);

useEffect(() => {
  const minRooms = Math.ceil(travellers / 2);
  if (rooms < minRooms) {
    setRooms(minRooms);
  }
}, [travellers, rooms]);

const handleRoomChange = (change: number) => {
  const minRooms = Math.ceil(travellers / 2);
  const maxRooms = travellers;
  setRooms(prev => {
    const newVal = prev + change;
    if (newVal >= minRooms && newVal <= maxRooms) return newVal;
    return prev;
  });
};
const [selectedHotel, setSelectedHotel] = useState<any>(null);
const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

// Static Data for Add-ons
// --- DYNAMIC EXPERIENCE ENGINE ---

// 1. Helper Function: City 
const getAddonsForCity = (city: string) => {
  const c = city.toLowerCase().trim();
  let specific: any[] = [];

  // --- NORTH INDIA ---
  if (c.includes('manali') || c.includes('shimla') || c.includes('himachal')) {
    specific = [
      { id: 'para', title: 'Paragliding', price: 3500, icon: '🪂', desc: 'High fly from Solang Valley' },
      { id: 'raft', title: 'River Rafting', price: 1500, icon: '🚣', desc: 'Beas River 14km Ride' },
      { id: 'bike', title: 'Royal Enfield Rent', price: 1200, icon: '🏍️', desc: 'Himalayan Bike per day' }
    ];
  } 
  else if (c.includes('leh') || c.includes('ladakh')) {
    specific = [
      { id: 'bike', title: 'Ladakh Bike Tour', price: 1800, icon: '🏍️', desc: 'Himalayan Bike per day' },
      { id: 'oxy', title: 'Oxygen Cylinder', price: 600, icon: '💨', desc: 'Portable kit for safety' },
      { id: 'monk', title: 'Monastery Guide', price: 1500, icon: '🏯', desc: 'Guided cultural tour' }
    ];
  }
  else if (c.includes('rishikesh') || c.includes('uttarakhand')) {
    specific = [
      { id: 'bungee', title: 'Bungee Jumping', price: 3500, icon: '🧗', desc: 'India’s highest jump' },
      { id: 'raft', title: 'Ganges Rafting', price: 1500, icon: '🚣', desc: '16km rapid rafting' },
      { id: 'yoga', title: 'Sunrise Yoga', price: 500, icon: '🧘', desc: 'By the Ganges ghat' }
    ];
  }
  else if (c.includes('kashmir') || c.includes('srinagar')) {
    specific = [
      { id: 'shikara', title: 'Shikara Ride', price: 800, icon: '🛶', desc: 'Dal Lake sunset ride' },
      { id: 'gondola', title: 'Gulmarg Gondola', price: 2500, icon: '🚡', desc: 'Phase 1 & 2 Cable car' },
      { id: 'ski', title: 'Skiing Lesson', price: 4000, icon: '⛷️', desc: 'With instructor & gear' }
    ];
  }

  // --- WEST INDIA ---
  else if (c.includes('jaipur') || c.includes('udaipur') || c.includes('rajasthan')) {
    specific = [
      { id: 'camel', title: 'Camel Safari', price: 1200, icon: '🐫', desc: 'Sunset desert ride' },
      { id: 'fort', title: 'Fort Guided Tour', price: 2000, icon: '🏰', desc: 'History walk with guide' },
      { id: 'thali', title: 'Royal Rajasthani Thali', price: 1500, icon: '🍱', desc: 'Authentic 12-course meal' }
    ];
  }
  else if (c.includes('goa')) {
    specific = [
      { id: 'scooty', title: 'Rent a Scooty', price: 400, icon: '🛵', desc: 'Per day rental (Self drive)' },
      { id: 'scuba', title: 'Scuba Diving', price: 4500, icon: '🤿', desc: 'Grand Island + Video' },
      { id: 'casino', title: 'Casino Entry', price: 3000, icon: '🎰', desc: 'Entry + Food + Drinks' }
    ];
  }
  else if (c.includes('mumbai')) {
    specific = [
      { id: 'bollywood', title: 'Film City Tour', price: 2500, icon: '🎬', desc: 'Inside Bollywood sets' },
      { id: 'cruise', title: 'Sunset Cruise', price: 1500, icon: '🚢', desc: 'Gateway of India ride' }
    ];
  }

  // --- SOUTH & EAST INDIA ---
  else if (c.includes('kerala') || c.includes('munnar')) {
    specific = [
      { id: 'houseboat', title: 'Houseboat Stay', price: 6000, icon: '🏠', desc: 'Backwaters (1 Night)' },
      { id: 'massage', title: 'Ayurvedic Massage', price: 2000, icon: '💆', desc: 'Full body relaxation' },
      { id: 'tea', title: 'Tea Garden Walk', price: 500, icon: '🍃', desc: 'Guided plantation tour' }
    ];
  }
  else if (c.includes('andaman')) {
    specific = [
      { id: 'scuba', title: 'Deep Sea Scuba', price: 5500, icon: '🐠', desc: 'Havelock Island Special' },
      { id: 'ferry', title: 'Cruise Ferry', price: 1500, icon: '⛴️', desc: 'Port Blair to Havelock' }
    ];f
  }

  // --- INTERNATIONAL ---
  else if (c.includes('dubai')) {
    specific = [
      { id: 'safari', title: 'Desert Safari', price: 4500, icon: '🚙', desc: 'Dune Bashing + BBQ Dinner' },
      { id: 'burj', title: 'Burj Khalifa Top', price: 3800, icon: '🏙️', desc: '124th Floor Entry' },
      { id: 'aquarium', title: 'Dubai Aquarium', price: 2500, icon: '🦈', desc: 'Underwater Zoo' }
    ];
  }
  else if (c.includes('bangkok') || c.includes('thailand')) {
    specific = [
      { id: 'massage', title: 'Thai Massage', price: 1200, icon: '💆', desc: 'Authentic 60 mins' },
      { id: 'island', title: 'Coral Island Tour', price: 3000, icon: '🚤', desc: 'Speedboat + Lunch' },
      { id: 'safari', title: 'Safari World', price: 2800, icon: '🦁', desc: 'Open zoo & marine park' }
    ];
  }
  else if (c.includes('maldives')) {
    specific = [
      { id: 'plane', title: 'Seaplane Ride', price: 15000, icon: '✈️', desc: 'Island aerial view' },
      { id: 'snorkel', title: 'Snorkeling', price: 3000, icon: '🤿', desc: 'Reef exploration' }
    ];
  }
  
  if (specific.length === 0) {
    specific = [
      { id: 'city', title: 'City Sightseeing', price: 2000, icon: '🏙️', desc: 'Full day private cab' },
      { id: 'food', title: 'Local Food Walk', price: 1500, icon: '🥘', desc: 'Explore famous eateries' }
    ];
  }

  const common = [
    { id: 'cab', title: 'Airport Transfers', price: 1500, icon: '🚖', desc: 'Private AC Sedan' },
    { id: 'meal', title: 'All Meals Pass', price: 2000, icon: '🍽️', desc: 'Breakfast + Dinner' }
  ];

  return [...specific, ...common];
};

// 2. State update helper
const toggleAddon = (id: string) => {
  setSelectedAddons(prev => 
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
};
const [flightResults, setFlightResults] = useState<any[]>([])
const [isLoading, setIsLoading] = useState(false)
const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
const [step, setStep] = useState("flights");
// --- INSERT AT LINE 181 (Before Search Function) ---
const [hotelResults, setHotelResults] = useState<any[]>([]);
const [isHotelLoading, setIsHotelLoading] = useState(false);

const getCityCode = (name: string) => {
  const n = name.toLowerCase().trim();
  if (n.includes("patna")) return "PAT";
  if (n.includes("delhi")) return "DEL";
  if (n.includes("mumbai")) return "BOM";
  if (n.includes("goa")) return "GOI";
  if (n.includes("dehradun")) return "DED";
  if (n.includes("jaipur")) return "JAI";
  if (n.includes("ranchi")) return "IXR";
  if (n.includes("bangalore")) return "BLR";
  if (n.includes("chennai")) return "MAA";
  if (n.includes("kolkata")) return "CCU";
  if (n.includes("hyderabad")) return "HYD";
  if (n.includes("ahmedabad")) return "AMD";
  return "DEL"; // Default fallback
};

// 2. Main Function
const handleFindHotels = async () => {
  setIsHotelLoading(true);
  setStep("hotels"); // Screen change karo
  
  // Destination
  const cityCode = getCityCode(dest); 

  try {
    const res = await fetch(`/api/hotel-list?city=${cityCode}`);
    const data = await res.json();
    if (data.hotels) {
      setHotelResults(data.hotels);
    }
  } catch (error) {
    console.error("Hotel fetch failed:", error);
  } finally {
    setIsHotelLoading(false);
  }
};
// Search Function
const handleSearch = async () => {
  if (!startDate) {
    alert("Please select a travel date");
    return;
  }
  
  setIsLoading(true);
  
  // ✅ RESET PREVIOUS STATE ()
  setFlightResults([]);       
  setSelectedFlight(null);    
  setStep("flights");         
  
  try {
    const res = await fetch(`/api/flight-price?dest=${dest}&from=${origin}&date=${startDate}`);
    const data = await res.json();

    if (data.flights) {
      setFlightResults(data.flights);
    }
  } catch (e) {
    console.log("Frontend Error:", e);
  } finally {
    setIsLoading(false);
  }
};

// Total Cost Calculation



  const updatePrice = useCallback(async () => {
   // Check if .NS is there, if not, add it
   const searchSymbol = symbol.endsWith('.NS') ? symbol : `${symbol}.NS`;

// Now fetch using the correct symbol
const data = await fetchRealStockPrice(searchSymbol)
    if (data) {
      // Map filters to number of data points
      const pointsMap: Record<string, number> = {
        "1D": 40, "1W": 80, "1M": 150, "3M": 250, "1Y": 400, "ALL": 600
      }
      const points = pointsMap[timeFilter] || 40

      setStockData({
        ...data,
        data: generateProfessionalHistory(data.current, points, symbol, timeFilter),
        symbol,
      })
      setLastUpdated(new Date().toLocaleTimeString())
    }
  }, [symbol, timeFilter])

  useEffect(() => {
    updatePrice()
    const interval = setInterval(updatePrice, 15000)
    return () => clearInterval(interval)
  }, [symbol, timeFilter])

  // 👇 YAHAN PASTE — Stock search suggestions (Groww-style)
  useEffect(() => {
    if (symbol.length < 2 || symbol.includes('.')) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-stock?q=${encodeURIComponent(symbol)}`)
        const data = await res.json()
        setSuggestions(data.results || [])
      } catch { setSuggestions([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [symbol])
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 bg-background text-white overflow-hidden relative">
      
     {/* --- NAVBAR FIXED --- */}
     
  
      {/* Background Retained */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.03]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b981]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10b981]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">
              MONEXI
            </h1>
            <p className="text-gray-500 font-bold text-sm tracking-tight">Intelligence Suite • v2.0</p>
          </div>
          {activeTab === "market" && lastUpdated && (
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-4 py-2 rounded-full backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-[#10b981]"></span>
              </span>
              Live Tracking • {lastUpdated}
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl flex h-auto gap-1 backdrop-blur-3xl shadow-2xl overflow-x-auto whitespace-nowrap scrollbar-hide">
            <TabsTrigger
              value="market"
              className="px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-tighter data-[state=active]:bg-[#10b981] data-[state=active]:text-black transition-all shadow-lg"
            >
              Market
            </TabsTrigger>
            <TabsTrigger
              value="sip"
              className="px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-tighter data-[state=active]:bg-[#10b981] data-[state=active]:text-black transition-all shadow-lg"
            >
              SIP Engine
            </TabsTrigger>
            <TabsTrigger
              value="trip"
              className="px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-tighter data-[state=active]:bg-[#10b981] data-[state=active]:text-black transition-all shadow-lg"
            >
              Trip Planner
            </TabsTrigger>
            <TabsTrigger
              value="tax"
              className="px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-tighter transition-all"
            >
              Tax
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-sm uppercase tracking-tighter transition-all"
            >
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl">
                  <Label className="text-[10px] uppercase font-black text-gray-500 mb-4 block tracking-[0.2em]">
                    Asset Search
                  </Label>
                  <div className="relative mb-4">
                    <Input
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      onFocus={() => setShowSug(true)}
                      onBlur={() => setTimeout(() => setShowSug(false), 200)}
                      className="bg-black/50 border-white/10 h-14 rounded-xl font-black pl-10 text-emerald-500 tracking-widest placeholder:text-gray-800"
                      placeholder="Type a stock… Tata, Infosys"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-black">$</div>

                    {showSug && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                        {suggestions.map((s: any) => (
                          <button
                            key={s.symbol}
                            onClick={() => { setSymbol(s.symbol); setShowSug(false); setSuggestions([]) }}
                            className="w-full text-left px-4 py-3 hover:bg-[#10b981]/10 transition border-b border-white/5 last:border-0"
                          >
                            <p className="font-black text-white text-sm">{s.symbol.replace('.NS','').replace('.BO','')}</p>
                            <p className="text-[10px] text-gray-500 truncate">{s.name}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={updatePrice}
                    className="w-full bg-[#10b981] text-black font-black h-14 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    EXECUTE ANALYSIS
                  </Button>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-6 shadow-2xl overflow-hidden">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-6 italic">
                    Sector Watchlist
                  </h3>
                  <div className="space-y-4">
                    {watchlist.map((item) => (
                      <div
                        key={item.sym}
                        onClick={() => setSymbol(item.sym)}
                        className="flex justify-between items-center cursor-pointer hover:bg-[#10b981]/10 p-3 rounded-xl transition-all group border border-transparent hover:border-[#10b981]/20"
                      >
                        <div>
                          <p className="text-sm font-black group-hover:text-[#10b981] transition-colors tracking-tight">
                            {item.sym.split(".")[0]}
                          </p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase">NSE • Equity</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black tabular-nums tracking-tighter">
                            ₹{item.price > 0 ? item.price.toLocaleString() : "----"}
                          </p>
                          {item.price > 0 && (
                            <p
                              className={`text-[10px] font-black ${item.change >= 0 ? "text-[#10b981]" : "text-red-500"}`}
                            >
                              {item.change >= 0 ? "▲" : "▼"} {Math.abs(item.change).toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 bg-[#080808]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 min-h-[500px] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#10b981]/5 blur-[100px] rounded-full group-hover:bg-[#10b981]/10 transition-colors" />

                {stockData && (
                  <div className="space-y-12 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[#10b981] font-black tracking-[0.5em] uppercase text-[10px]">
                        {stockData.symbol} • REAL-TIME ANALYSIS
                      </p>
                      <div className="flex items-end gap-6">
                        <h2 className="text-6xl font-black tracking-tighter tabular-nums text-white leading-none">
                          ₹
                          {stockData.current?.toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}) || "0.00"}
                        </h2>
                        <div
                          className={`flex flex-col mb-1 ${stockData.change >= 0 ? "text-[#10b981]" : "text-red-500"}`}
                        >
                          <span className="text-3xl font-black tracking-tighter">
                            {stockData.change >= 0 ? "+" : ""}
                            {stockData.change.toFixed(2)}
                          </span>
                          <span className="text-base font-bold tracking-tighter opacity-80">
                            ({stockData.percent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
{/* Groww Style Time Filters */}
<div className="flex gap-2 my-6 bg-white/5 p-1 rounded-xl w-fit border border-white/10 relative z-20">
  {["1D", "1W", "1M", "3M", "1Y", "ALL"].map((filter) => (
    <button
      key={filter}
      onClick={() => setTimeFilter(filter)}
      className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${
        timeFilter === filter 
          ? "bg-[#10b981] text-black shadow-lg scale-105" 
          : "text-gray-500 hover:text-white"
      }`}
    >
      {filter}
    </button>
  ))}
</div>
                    <div className="h-[380px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stockData.data}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.03} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
                          <Tooltip
  cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }}
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e1e1e] border border-white/10 p-3 rounded-lg shadow-2xl min-w-[100px]">
          {/* Top: Price in White */}
          <p className="text-lg font-black text-white tracking-tight">
            ₹{payload[0].value?.toLocaleString()}
          </p>
          {/* Bottom: Date in Gray (Asian Paints Style) */}
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {payload[0].payload.time}
          </p>
        </div>
      );
    }
    return null;
  }}
/>
                          <Area
  type="monotone"
  dataKey="price"
  stroke="#10b981"
  strokeWidth={2} // Changed from 5 to 4 for a smoother, thick Groww look
  fillOpacity={1}
  fill="url(#colorPrice)"
  animationDuration={1500}
/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* SIP Content */}
          <TabsContent value="sip" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* SLIDER SECTION (LEFT) */}
              <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 space-y-12 shadow-2xl">
                <div className="space-y-2">
                  <h3 className="font-black text-2xl italic text-[#10b981] flex items-center gap-3 tracking-tighter">
                    <Landmark size={24} /> STRATEGY
                  </h3>
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
                    Optimization Parameters
                  </p>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between font-black text-xs uppercase tracking-widest">
                      <span className="text-gray-500">Monthly SIP</span>
                      <span className="text-[#10b981]">₹{sipM.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[sipM]}
                      min={500}
                      max={100000}
                      step={500}
                      onValueChange={(v) => setSipM(v[0])}
                      className="[&_[role=slider]]:bg-[#10b981]"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between font-black text-xs uppercase tracking-widest">
                      <span className="text-gray-500">Expected ROI</span>
                      <span className="text-[#10b981]">{sipR}%</span>
                    </div>
                    <Slider
                      value={[sipR]}
                      min={1}
                      max={30}
                      step={0.5}
                      onValueChange={(v) => setSipR(v[0])}
                      className="[&_[role=slider]]:bg-[#10b981]"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between font-black text-xs uppercase tracking-widest">
                      <span className="text-gray-500">Duration</span>
                      <span className="text-[#10b981]">{sipY} Years</span>
                    </div>
                    <Slider
                      value={[sipY]}
                      min={1}
                      max={40}
                      onValueChange={(v) => setSipY(v[0])}
                      className="[&_[role=slider]]:bg-[#10b981]"
                    />
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT (RIGHT) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Fixed Responsive Chart Card */}
                <div className="bg-[#080808]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#10b981]/5 blur-[120px] rounded-full" />

                  <div className="flex-1 text-center md:text-left relative z-10 w-full">
                    <p className="text-[10px] font-black text-gray-600 uppercase mb-4 tracking-[0.5em]">
                      Total Maturity Projection
                    </p>
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 md:mb-12 tabular-nums leading-none break-all">
                      ₹{Math.round(sipResult.total).toLocaleString("en-IN")}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="bg-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 shadow-xl">
                        <p className="text-[9px] md:text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Principal</p>
                        <p className="text-lg md:text-3xl font-black tabular-nums tracking-tighter break-all">
                          ₹{sipResult.invested.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-[#10b981]/10 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-[#10b981]/20 shadow-xl">
                        <p className="text-[9px] md:text-[10px] uppercase text-[#10b981] font-black tracking-widest mb-1">Gains</p>
                        <p className="text-lg md:text-3xl font-black text-[#10b981] tabular-nums tracking-tighter break-all">
                          ₹{Math.round(sipResult.gains).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-56 h-56 md:w-64 md:h-64 relative group flex-shrink-0">
                    <div className="absolute inset-0 bg-[#10b981]/20 blur-[50px] rounded-full group-hover:bg-[#10b981]/30 transition-all duration-700" />
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={[{ v: sipResult.invested }, { v: sipResult.gains }]}
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={10}
                          dataKey="v"
                          animationDuration={1500}
                        >
                          <Cell fill="#1a1a1a" stroke="none" />
                          <Cell fill="#10b981" stroke="none" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-black">
                      <span className="text-[9px] md:text-[10px] text-gray-500 tracking-[0.3em] uppercase mb-1">Growth</span>
                      <span className="text-3xl md:text-4xl tabular-nums tracking-tighter">
                        {Math.round((sipResult.gains / sipResult.invested) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Index Funds Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all shadow-xl group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="text-blue-500" />
                    </div>
                    <h4 className="font-black text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Index Funds</h4>
                    <p className="text-2xl font-black tracking-tighter">
                      12-14% <span className="text-[10px] text-gray-700 italic font-bold">AVG</span>
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-orange-500/30 transition-all shadow-xl group">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <BarChart4 className="text-orange-500" />
                    </div>
                    <h4 className="font-black text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Mid Cap</h4>
                    <p className="text-2xl font-black tracking-tighter">
                      15-18% <span className="text-[10px] text-gray-700 italic font-bold">AVG</span>
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#10b981]/30 transition-all shadow-xl group">
                    <div className="w-12 h-12 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Rocket className="text-[#10b981]" />
                    </div>
                    <h4 className="font-black text-gray-500 text-[10px] mb-2 uppercase tracking-widest">Small Cap</h4>
                    <p className="text-2xl font-black tracking-tighter">
                      20-25% <span className="text-[10px] text-gray-700 italic font-bold">AVG</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Trip Planner Content */}
          {/* TRIP PLANNER TAB (MakeMyTrip Style) */}
          <TabsContent value="trip" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* LEFT SIDE: SEARCH WIDGET */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden h-fit">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[80px] rounded-full" />
                   
                   <h3 className="text-xl font-black italic text-blue-400 mb-6 flex items-center gap-2">
                     <Plane className="rotate-45" /> FLIGHT SEARCH
                   </h3>

                   {/* FROM - TO */}
                   {/* FROM - TO SECTION */}
                   <div className="space-y-4 mb-6">
                      {/* FROM INPUT */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">From</p>
                        <div className="flex items-center gap-3">
                          <MapPin size={18} className="text-blue-500" />
                          <Input 
                            value={origin} 
                            onChange={(e) => setOrigin(e.target.value)} 
                            className="bg-transparent border-none text-lg font-black p-0 h-auto focus-visible:ring-0 placeholder:text-gray-600 text-white" 
                            placeholder="Origin City"
                          />
                        </div>
                      </div>

                      {/* ARROW ICON */}
                      <div className="flex justify-center -my-7 relative z-10">
                        <div className="bg-[#0a0a0a] border border-white/10 p-2 rounded-full shadow-lg">
                          <ArrowRight className="text-gray-400 rotate-90" size={16} />
                        </div>
                      </div>

                      {/* TO INPUT */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">To</p>
                        <div className="flex items-center gap-3">
                          <MapPin size={18} className="text-blue-500" />
                          <Input 
                            value={dest} 
                            onChange={(e) => setDest(e.target.value)} 
                            className="bg-transparent border-none text-lg font-black p-0 h-auto focus-visible:ring-0 placeholder:text-gray-600 text-white" 
                            placeholder="Destination City"
                          />
                        </div>
                      </div>
                   </div>
                   {/* DATE */}
                   <div className="space-y-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Departure Date</p>
                        <div className="flex items-center gap-2"><Calendar size={16} className="text-blue-500"/><input type="date" className="bg-transparent w-full text-sm font-bold outline-none uppercase text-white calendar-picker-indicator:invert" onChange={(e) => setStartDate(e.target.value)} /></div>
                      </div>
                      {/* --- PASTE THIS AT LINE 703 --- */}
                      <div className={`bg-white/5 p-4 rounded-xl border border-white/5 mt-4 transition-all ${step === "hotels" ? "opacity-50 grayscale pointer-events-none" : ""}`}>
  
  <div className="flex justify-between items-center mb-2">
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
      Travellers
    </p>
    {/*  */}
    {step === "hotels" && (
      <span className="text-[8px] bg-white/10 text-gray-400 px-2 py-0.5 rounded border border-white/10 uppercase font-black tracking-widest">
        Locked
      </span>
    )}
  </div>

  <div className="flex items-center gap-3">
    <Users size={16} className="text-blue-500" />
    <div className="flex items-center gap-4 w-full">
      {/* Minus Button - Disabled if step is hotels */}
      <button 
        disabled={step === "hotels"}
        onClick={() => setTravellers(prev => Math.max(1, prev - 1))}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:cursor-not-allowed"
      >
        -
      </button>
      
      {/* Number Display */}
      <span className="font-black text-xl w-8 text-center">{travellers}</span>
      
      {/* Plus Button - s */}
      <button 
        disabled={step === "hotels"}
        onClick={() => setTravellers(prev => Math.min(9, prev + 1))}
        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:cursor-not-allowed"
      >
        +
      </button>
      
      <span className="text-xs text-gray-500 font-bold uppercase ml-auto">
        Person{travellers > 1 ? 's' : ''}
      </span>
    </div>
  </div>
</div>
   
                   </div>


                   <button onClick={handleSearch} disabled={isLoading} className="w-full py-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02] active:scale-95 transition-all font-black text-lg tracking-widest uppercase shadow-xl flex items-center justify-center gap-3">
                     {isLoading ? <Loader2 className="animate-spin" /> : <Search size={20} />} {isLoading ? "Searching..." : "Search Flights"}
                   </button>
                   {/*  */}

                   {selectedFlight && step === "flights" && (
  <div className="mt-6 mb-6 p-5 bg-[#10b981]/10 border border-[#10b981]/30 rounded-2xl animate-in slide-in-from-bottom-2">
    <div className="flex justify-between items-end">
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
          Trip Total ({travellers} Pax)
        </p>
        <h3 className="text-3xl font-black text-[#10b981] tracking-tighter">
          ₹{(flightResults.find(f => f.id === selectedFlight)?.price * travellers).toLocaleString()}
        </h3>
      </div>
      <button 
        onClick={handleFindHotels}
        className="bg-[#10b981] text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#10b981]/20"
      >
        Find Hotels →
      </button>
    </div>
  </div>
)}
                </div>
              </div>
              
              {/* RIGHT SIDE: FLIGHT LIST RESULTS */}
              
              <div className="lg:col-span-8 space-y-4 h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                
                {/* CASE 1: FLIGHTS LIST  */}
                {step === "flights" && (
                  <>
                    {flightResults.length === 0 && !isLoading ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 border border-white/10 rounded-[2rem] bg-[#0a0a0a]">
                         <Globe size={80} className="mb-4" />
                         <h2 className="text-2xl font-black uppercase tracking-widest">Ready to Take Off?</h2>
                         <p className="mt-2 text-sm text-gray-500">Select a destination & date to view live flights.</p>
                      </div>
                    ) : (
                      flightResults.map((flight) => (
                        <div key={flight.id} className={`bg-[#0a0a0a] border ${selectedFlight === flight.id ? 'border-[#10b981]' : 'border-white/10'} p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/50 transition-all group animate-in slide-in-from-bottom-2`}>
                           
                           {/* Airline Logo & Name */}
                           <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${flight.logo === 'blue' ? 'bg-blue-500/20 text-blue-500' : flight.logo === 'orange' ? 'bg-orange-500/20 text-orange-500' : flight.logo === 'purple' ? 'bg-purple-500/20 text-purple-500' : 'bg-red-500/20 text-red-500'}`}>
                                 {flight.airline.charAt(0)}
                              </div>
                              <div>
                                 <h4 className="font-black text-lg">{flight.airline}</h4>
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{flight.code}</p>
                              </div>
                           </div>

                           {/* Flight Times */}
                           <div className="flex items-center gap-6 text-center">
                              <div>
                                <p className="font-black text-xl">{flight.time.split('-')[0]}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">DEL</p>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{flight.duration}</p>
                                 <div className="w-16 h-[2px] bg-white/10 relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"/></div>
                                 <p className="text-[9px] text-green-500 font-bold uppercase">Non-stop</p>
                              </div>
                              <div>
                                <p className="font-black text-xl">{flight.time.split('-')[1]}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{dest.slice(0,3).toUpperCase()}</p>
                              </div>
                           </div>

                           {/* Price & SELECT Button */}
                         
<div className="flex flex-col items-end gap-1 min-w-[160px]">
  {/* Per Person Breakdown (Gray/Small) */}
  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
    <span>₹{flight.price.toLocaleString()}</span>
    <span className="opacity-40">×</span>
    <span>{travellers} Traveller{travellers > 1 ? 's' : ''}</span>
  </div>
  
  {/* Total Bold Price (Green/Large) */}
  <h3 className="text-4xl font-black text-white tracking-tighter mb-2">
    ₹{(flight.price * travellers).toLocaleString()}
  </h3>

  <button 
    onClick={() => setSelectedFlight(flight.id)}
    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
      selectedFlight === flight.id 
      ? "bg-[#10b981] text-black scale-105 shadow-[#10b981]/20" 
      : "bg-blue-600 text-white hover:bg-blue-500 hover:translate-y-[-2px] active:translate-y-0"
    }`}
  >
    {selectedFlight === flight.id ? (
      <span className="flex items-center justify-center gap-2 italic"><Check size={14} strokeWidth={4} /> ADDED</span>
    ) : "SELECT"}
  </button>
</div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {/* CASE 2:  */}
                {step === "hotels" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-between mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
  <div>
    <h2 className="text-xl font-black italic text-white">
      STAYS IN <span className="text-blue-500 uppercase">{dest || "CITY"}</span>
    </h2>
    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
      {travellers} Guests • {rooms} Room{rooms > 1 ? 's' : ''} Required
    </p>
  </div>

  <div className="flex items-center gap-4">
    {/* ROOM CONTROLS */}
    <div className="bg-black/40 border border-white/10 rounded-xl p-2 flex items-center gap-3">
       <span className="text-[10px] text-gray-400 font-bold uppercase ml-2">Rooms:</span>
       
       <button 
         onClick={() => handleRoomChange(-1)}
         className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:opacity-30"
         disabled={rooms <= Math.ceil(travellers / 2)}
       >
         -
       </button>
       
       <span className="font-black text-lg w-4 text-center">{rooms}</span>
       
       <button 
         onClick={() => handleRoomChange(1)}
         className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all disabled:opacity-30"
         disabled={rooms >= travellers}
       >
         +
       </button>
    </div>

    <button onClick={() => setStep("flights")} className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest border border-white/10 px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
      ← Back
    </button>
  </div>
</div>

                    {/* Fake Hotel List Logic */}
                    {/* REPLACE THE OLD [1,2,3].map CODE WITH THIS: */}

    {/* Loading State */}
    {isHotelLoading ? (
      <div className="h-60 flex flex-col items-center justify-center border border-white/5 rounded-[2rem] bg-[#0a0a0a]">
         <Loader2 className="animate-spin text-[#10b981] mb-4" size={40} />
         <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Finding Best Rates...</p>
      </div>
    ) : (
      /* Real Hotel List Map */
      hotelResults.map((hotel) => (
        <div key={hotel.id} className="bg-[#0a0a0a] border border-white/10 p-4 rounded-[2rem] flex flex-col md:flex-row gap-6 hover:border-blue-500/50 transition-all group">
          
          {/* Hotel Image */}
          {/* New Image Code */}
<div className="w-full md:w-44 h-36 bg-gray-900 rounded-2xl shrink-0 relative overflow-hidden flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-500">
   
   {/* 📸 REAL IMAGE TAG ADDED HERE */}
   <img 
     src={hotel.image || "/images/hotels/hotel-1.jpg"} // Fallback agar image na ho
     alt={hotel.name}
     className="w-full h-full object-cover"
   />

   {/* Dark Overlay for text readability */}
   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
   
   <div className="absolute bottom-3 left-3 text-[10px] font-black bg-white text-black px-2 py-1 rounded shadow-lg flex items-center gap-1">
     <Star size={10} fill="black" /> {hotel.rating}
   </div>
</div>
          
          {/* Details */}
          <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-xl font-black text-white group-hover:text-blue-500 transition-colors leading-tight mb-2">
                {hotel.name}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={12} /> City Center • Luxury Stay
              </p>
              
              <div className="flex flex-wrap gap-2">
                {hotel.amenities && hotel.amenities.map((am: string, i: number) => (
                  <span key={i} className="text-[9px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-black uppercase border border-blue-500/20">
                    {am}
                  </span>
                ))}
              </div>
          </div>

          {/* Price & Book */}
          <div className="flex flex-col justify-center items-end min-w-[120px] border-l border-white/5 pl-4 md:pl-0 md:border-none">
    <p className="text-gray-600 text-[10px] font-bold uppercase line-through mb-1">
      ₹{((hotel.price * 1.4) * rooms).toFixed(0).toLocaleString()}
    </p>
    
    <h3 className="text-3xl font-black text-white tracking-tighter">
      ₹{(hotel.price * rooms).toLocaleString()}
    </h3>
    
    <p className="text-[9px] text-gray-500 font-bold uppercase mb-4 tracking-wider">
      For {rooms} Room{rooms > 1 ? 's' : ''} / Night
    </p>

    <button 
  onClick={() => {
    setSelectedHotel(hotel);
    setStep("addons"); // Step change logic
  }}
  className="w-full md:w-auto bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-[#10b981] hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
>
  Select Hotel →
</button>
</div>
        </div>
      ))
    )}
                  </div>
                )}

              </div>
            </div> 
          </TabsContent>
          {/* --- STEP 3: FINAL ADD-ONS & SUMMARY SCREEN --- */}
          {step === "addons" && selectedHotel && (
            <div className="absolute inset-0 z-50 bg-[#050505] p-6 overflow-y-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-[#10b981]/20 rounded-2xl flex items-center justify-center border border-[#10b981]/20">
                      <Rocket className="text-[#10b981]" size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic text-white tracking-tighter">TRIP FINALIZATION</h2>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Customize your experience in {dest}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setStep("hotels")} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest border border-white/10 px-6 py-4 rounded-xl hover:bg-white/5 transition-all">
                    ← Change Hotel
                  </button>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* LEFT: ADD-ON CARDS GRID */}
                  <div className="lg:col-span-8">
                    <h3 className="text-xl font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Recommended Experiences
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                    {getAddonsForCity(dest).map((addon) => (
                        <div 
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`p-6 rounded-[2rem] border cursor-pointer transition-all relative overflow-hidden group ${
                            selectedAddons.includes(addon.id) 
                            ? 'bg-[#10b981]/10 border-[#10b981] shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                            : 'bg-[#0a0a0a] border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-5xl bg-white/5 p-4 rounded-3xl backdrop-blur-sm">{addon.icon}</span>
                            {selectedAddons.includes(addon.id) && (
                              <div className="bg-[#10b981] text-black p-2 rounded-full animate-in zoom-in">
                                <Check size={16} strokeWidth={4} />
                              </div>
                            )}
                          </div>
                          <h4 className={`font-black text-xl mb-2 ${selectedAddons.includes(addon.id) ? 'text-[#10b981]' : 'text-white'}`}>
                            {addon.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-6 tracking-wide leading-relaxed">{addon.desc}</p>
                          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                            <span className="font-black text-2xl tracking-tight">₹{addon.price.toLocaleString()}</span>
                            <span className={`text-[10px] uppercase font-black tracking-widest py-2 px-3 rounded-lg ${selectedAddons.includes(addon.id) ? 'bg-[#10b981] text-black' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'}`}>
                              {selectedAddons.includes(addon.id) ? 'ADDED' : 'ADD +'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: FINAL TRIP SUMMARY (BILL) */}
                  <div className="lg:col-span-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 sticky top-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                      
                      <h3 className="font-black text-2xl italic text-white mb-8 flex items-center gap-3 relative z-10">
                        <Wallet className="text-blue-500" /> TRIP SUMMARY
                      </h3>

                      <div className="space-y-6 mb-8 relative z-10">
                        {/* Flight Cost */}
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Flights</p>
                            <p className="text-[10px] text-gray-600 font-bold">x {travellers} Travellers</p>
                          </div>
                          <span className="font-black text-xl">
                            ₹{(flightResults.find(f => f.id === selectedFlight)?.price * travellers).toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Hotel Cost */}
                        <div className="flex justify-between items-center">
                          <div>
                              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Hotel Stay</p>
                              <p className="text-[10px] text-gray-600 font-bold">{rooms} Room{rooms > 1 ? 's' : ''} • {selectedHotel.name}</p>
                          </div>
                          <span className="font-black text-xl">
                            ₹{(selectedHotel.price * rooms).toLocaleString()}
                          </span>
                        </div>

                        {/* Add-ons Cost */}
                        {selectedAddons.length > 0 && (
                          <div className="flex justify-between items-start bg-[#10b981]/5 p-4 rounded-xl border border-[#10b981]/20">
                            <div>
                              <p className="text-[#10b981] font-bold uppercase text-[10px] tracking-widest mb-1">Add-ons</p>
                              <p className="text-[10px] text-gray-500 font-bold">{selectedAddons.length} Selected</p>
                            </div>
                            <span className="font-black text-xl text-[#10b981]">
  + ₹{selectedAddons.reduce((acc, id) => acc + (getAddonsForCity(dest).find(a => a.id === id)?.price || 0), 0).toLocaleString()}
</span>

                          </div>
                        )}
                        
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-6" />
                        
                        {/* TOTAL */}
                        <div className="flex justify-between items-end">
                          <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">Grand Total</span>
                          <span className="text-5xl font-black text-white tracking-tighter leading-none">
                            ₹{(
                              (flightResults.find(f => f.id === selectedFlight)?.price * travellers) + 
                              (selectedHotel.price * rooms) + 
                              selectedAddons.reduce((acc, id) => acc + (getAddonsForCity(dest).find(a => a.id === id)?.price || 0), 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button className="w-full py-5 rounded-xl bg-gradient-to-r from-[#10b981] to-emerald-600 hover:scale-[1.02] active:scale-95 transition-all font-black text-black text-sm tracking-[0.2em] uppercase shadow-xl shadow-[#10b981]/20 relative z-10">
                       total cost
                      </button>
                      
                      <p className="text-[9px] text-center text-gray-600 font-bold uppercase mt-6 tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheck size={12} /> Secure Transaction
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
          <TabsContent value="tax">
            <TaxPlanner />
          </TabsContent>
          
         {/* ✅ Professional English Analysis UI */}
         <TabsContent value="analysis">
            {/* Hidden Input for File Handling */}
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept=".pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setIsAnalyzing(true);
                setTransactions([]); 
                setAnalysisResult(""); 

                const reader = new FileReader();
                reader.readAsDataURL(file);
                
                reader.onloadend = async () => {
                  const base64String = reader.result?.toString().split(',')[1];
                  try {
                    const res = await fetch('/api/analyze-statement', {
                      method: 'POST',
                      body: JSON.stringify({ pdfData: base64String }),
                    });
                    const json = await res.json();
                    
                    if (json.data) {
                      setDashboardData(json.data); // Store Full Dashboard Data
                      setTransactions(json.data.transactions); // Store List for Table
                    }
                  } catch (error) {
                    alert("Error analyzing statement.");
                  } finally {
                    setIsAnalyzing(false);
                  }
                };
              }}
            />

            {/* Main UI Container */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-8 md:p-16 bg-white/5 backdrop-blur-md relative overflow-hidden group w-full max-w-full">
              
              <div className="p-6 bg-[#10b981]/10 rounded-3xl mb-8 border border-[#10b981]/20">
                <BarChart4 className="h-12 w-12 text-[#10b981]" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-extrabold italic tracking-widest mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 uppercase">
  Monexi Statement Insights
</h2>
              <p className="text-gray-400 mb-10 text-center max-w-md font-medium">
                Upload your bank statement in pdf to understand spending patterns and get actionable insights <span className="text-[#10b981]">spending patterns</span> and provide actionable insights. 📊
              </p>

              <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex-1 bg-[#10b981] hover:bg-[#0da06f] text-black font-black h-16 rounded-2xl shadow-xl text-xs tracking-widest uppercase"
                >
                   <Plane className="mr-2 h-5 w-5 rotate-45" /> Upload PDF Statement
                </Button>
                
                {/* 👇 UPDATE THIS BUTTON (Connect Function) */}
                <Button 
  onClick={handleDemoAnalysis} 
  variant="outline" 
  className="flex-1 bg-white/5 border-white/10 h-16 rounded-2xl font-black text-xs tracking-widest uppercase transition-all hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] text-white"
>
   Try Demo Analysis
</Button>
              </div>

              {/* Loading State */}
              {isAnalyzing && (
                <div className="mt-8 text-center animate-pulse">
                  <Loader2 className="h-10 w-10 text-[#10b981] animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Reading Statement...</p>
                </div>
              )}
             {/* 👇 STEP 2: SAFETY & PRIVACY DASHBOARD (Updated) 👇 */}
    
    {/* --- 📊 MAIN DASHBOARD START --- */}
    {dashboardData && (
      <div className="mt-8 space-y-8 w-full max-w-full animate-in fade-in slide-in-from-bottom-8">
        
        {/* 1. PRIVACY BANNER (Compliance) */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl flex items-start sm:items-center gap-4">
           <div className="p-2 bg-yellow-500/10 rounded-full shrink-0">
             <ShieldCheck className="h-5 w-5 text-yellow-600" />
           </div>
           <div>
             <h4 className="text-xs font-black text-yellow-600 uppercase tracking-widest mb-1">Privacy First</h4>
             <p className="text-xs text-gray-400 font-medium leading-relaxed">
               Your statement is processed securely in real-time and immediately discarded. We do not store your financial data or sell it to third parties.
             </p>
           </div>
        </div>

        {/* 2. SUMMARY CARDS (With Negative Savings Logic) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="min-w-0 bg-[#0a0a0a] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Spent</p>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white tabular-nums break-words">₹{dashboardData.summary?.total_spent?.toLocaleString()}</h3>
          </div>
          <div className="min-w-0 bg-[#0a0a0a] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Income</p>
            <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-[#10b981] tabular-nums break-words">₹{dashboardData.summary?.total_income?.toLocaleString()}</h3>
          </div>
          <div className="min-w-0 bg-[#0a0a0a] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Savings Rate</p>
            <h3 className={`text-lg sm:text-2xl md:text-3xl font-black tabular-nums ${(dashboardData.summary?.savings_rate || 0) < 0 ? 'text-red-500' : 'text-blue-500'}`}>
              {(dashboardData.summary?.savings_rate || 0).toFixed(1)}%
            </h3>
          </div>
          <div className="min-w-0 bg-[#0a0a0a] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col">
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Risk Score</p>
            <span className={`self-start px-3 py-1 rounded-full text-xs font-black uppercase ${
              dashboardData.summary?.risk_score === 'High' ? 'bg-red-500/20 text-red-500' :
              dashboardData.summary?.risk_score === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-[#10b981]/20 text-[#10b981]'
            }`}>
              {dashboardData.summary?.risk_score || "N/A"}
            </span>
          </div>
        </div>
        {/* 3. CHARTS & INSIGHTS */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pie Chart */}
          {/* 👇 UPDATED PIE CHART SECTION (Paste Here) 👇 */}
         {/* 👇 UPDATED PIE CHART SECTION (Paste Here) 👇 */}
         <div className="lg:col-span-1 bg-[#0a0a0a] border border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 flex flex-col items-center justify-center h-[360px] sm:h-[420px] relative">
         <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Spending Mix</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="amount"
                  stroke="none"
                >
                  {dashboardData.categories?.map((entry:any, index:number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid #333' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* 👇 CENTER TOTAL AMOUNT */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-4">
               <span className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total</span>
               <span className="text-2xl font-black text-white">
                 ₹{(dashboardData.summary?.total_spent / 1000).toFixed(1)}k
               </span>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 justify-center absolute bottom-6 w-full px-4">
               {dashboardData.categories?.slice(0, 4).map((cat:any, i:number) => (
                 <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                   <span className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[80px]">{cat.name}</span>
                 </div>
               ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="lg:col-span-2 bg-[#10b981]/5 border border-[#10b981]/20 rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-8">
            <h3 className="flex items-center gap-3 text-xl font-black italic text-[#10b981] mb-8 uppercase tracking-tighter">
              <Sparkles size={20} /> Monexi AI Insights
            </h3>
            <div className="space-y-4">
              {(dashboardData.insights || []).map((insight: string, i: number) => (
                <div key={i} className="flex gap-4 p-5 bg-black/40 rounded-2xl border border-[#10b981]/10 backdrop-blur-md">
                  <div className="h-6 w-6 bg-[#10b981] rounded-full flex items-center justify-center font-bold text-black text-xs shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-300 font-medium leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. UPCOMING PAID FEATURE (Locked Report Teaser) */}
        <div className="relative mt-8">
          {/* Blurry Content Background */}

          {/* Transaction Table */}
{dashboardData?.recent_transactions?.length > 0 && (
  <TxnSearchTable
    txns={dashboardData.all_transactions || dashboardData.recent_transactions}
    payees={dashboardData.payees}
  />
)}
          
          {/* AI Analysis Report */}
          {analysisResult && (
            <div className="mt-8 w-full bg-black/40 border border-[#10b981]/30 p-8 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4 text-left shadow-2xl">
              <h3 className="text-[#10b981] font-black text-2xl mb-6 uppercase tracking-widest flex items-center gap-3">
                 <Sparkles size={24} /> Monexi Audit Report
              </h3>
              <div className="prose prose-invert prose-lg max-w-none text-gray-300 whitespace-pre-line leading-relaxed font-medium">
                 {analysisResult}
              </div>
            </div>
          )}

        </div> {/* <-- ADDED: Correctly closing the UPCOMING PAID FEATURE div */}

      </div>
    )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export function ToolsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-[#10b981]">Loading...</div>}>
      <ToolsContent />
    </Suspense>
  )
}