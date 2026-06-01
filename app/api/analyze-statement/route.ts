import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const maxDuration = 30;

type Txn = {
  date: string;
  desc: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  category: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#F59E0B",
  "Groceries": "#14B8A6",
  "Shopping": "#EC4899",
  "Travel": "#3B82F6",
  "Rent & Bills": "#10B981",
  "Health": "#EF4444",
  "Entertainment": "#A855F7",
  "Loans & EMI": "#F97316",
  "Cloud & Software": "#06B6D4",
  "Charges & Fees": "#EAB308",
  "Transfers": "#64748B",
  "Others": "#8B5CF6",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toNum = (s: string) => parseFloat(s.replace(/,/g, "")) || 0;

function getMerchant(p: string): string {
  let s = p
    .replace(/^\s*(?:\d{1,2}[ \/\-][A-Za-z]{3}[ \/\-]\d{2,4}|\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\s*/, "")
    .replace(/^\s*\d+\s+/, "") // leading row number (Kotak: "1 ", "2 ")
    .trim();
  if (s.includes("/")) {
    const parts = s.split("/").map((x) => x.trim()).filter(Boolean);
    const cand = parts.find(
      (x, i) => i >= 1 && /[a-zA-Z]{3,}/.test(x) && !/^(P2M|P2A|UPI|NA|Yes|Sent|Paymen|Pay)/i.test(x)
    );
    if (cand) return cand.replace(/UPI-?\d+.*/, "").slice(0, 40).trim();
  }
  return s.slice(0, 40) || "Unknown";
}

function getCategory(particulars: string): string {
  const t = particulars.toLowerCase();
  if (/aws|amazon web|google cloud|gcp|azure|vercel|netlify|github|openai|\bapi\b|digitalocean|cloudflare/.test(t))
    return "Cloud & Software";
  if (/decline fee|\bcharge\b|chrg|service fee|\bgst\b|penalty|min bal|\bamb\b|sms charge|annual fee|atm decl/.test(t))
    return "Charges & Fees";
  if (/blinkit|bigbasket|dmart|instamart|grocer|kirana|supermarket|general store|provision|amazon pay groceries|kwality|tiwari general|reliance fresh|jiomart|more retail/.test(t))
    return "Groceries";
  if (/zomato|swiggy|kfc|burger|cafe|restaurant|dominos|pizza|dosa|chinese|sweets|dhaba|bakes|\btea\b|dine|frisco|hungry|paratha|biryani|zaika|chole|roll|tulips|brew|food|pump taj|idli|tfs|nandani|mcdonald|haldiram|barbeque|chaayos/.test(t))
    return "Food & Dining";
  if (/amazon|flipkart|myntra|lifestyle|stationery|nykaa|ajio|fraicheur|summersalt|alan scott|mohini|igp|retail|\bstore\b|meesho|tatacliq|reliance digital|croma|decathlon/.test(t))
    return "Shopping";
  if (/uber|ola|irctc|railway|makemytrip|make my trip|indigo|goibibo|ibibo|air india|metro|petrol|filling|fuel|indian oil|bharat petrol|hp petrol|hamara pump|m m petro|redbus|flight|\bcab\b|hotel|resort|parking|autom|rapido|vistara|spicejet/.test(t))
    return "Travel";
  if (/\bjio\b|airtel|\bvi\b|vodafone|recharge|electricity|broadband|\bgas\b|\bbill\b|\bdth\b|fastag|apple services|youtube|netflix|spotify|prime|tata power|adani|bses|water bill|municipal/.test(t))
    return "Rent & Bills";
  if (/pharmacy|medical store|hospital|apollo|clinic|\bhealth\b|medico|medicale|pharmeasy|netmeds|1mg|tata 1mg|practo|diagnostic/.test(t))
    return "Health";
  if (/bookmyshow|\bpvr\b|inox|winzo|movie|cinema|gaming|dream11|rummy|hotstar|sony liv|zee5/.test(t))
    return "Entertainment";
  if (/kreditbee|lazypay|stucred|pocketly|\bslice\b|\bsip\b|mutual|kredit|payu|omni card|eroute|emi|loan|insurance|lic|premium|zerodha|groww|upstox|nps|ppf/.test(t))
    return "Loans & EMI";
  if (/\/p2a\/|tpft|imps\/p2a|payment from ph|sent using payt|neft|rtgs|\bby clg\b|to transfer|self/.test(t))
    return "Transfers";
  return "Others";
}

// ---------- Universal deterministic parser (Axis, Kotak, HDFC, ICICI, SBI ...) ----------
function parseStatement(rawText: string): {
  txns: Txn[];
  totalDebit: number | null;
  totalCredit: number | null;
} {
  // collapse whitespace, then strip trailing branch/init codes (e.g. Axis " 1483")
  let norm = rawText.replace(/\s+/g, " ");
  norm = norm.replace(/(\d[\d,]*\.\d{2})\s+\d{3,4}(?=\s|$)/g, "$1");
  // strip "Cr"/"Dr" suffix some banks append to the balance (HDFC, SBI)
  norm = norm.replace(/(\d[\d,]*\.\d{2})\s*(Cr|Dr)\b/gi, "$1");

  // authoritative totals if printed (Axis "TRANSACTION TOTAL")
  let totalDebit: number | null = null;
  let totalCredit: number | null = null;
  const tot = norm.match(/TRANSACTION TOTAL\s+(\d[\d,]*\.\d{2})\s+(\d[\d,]*\.\d{2})/i);
  if (tot) {
    totalDebit = toNum(tot[1]);
    totalCredit = toNum(tot[2]);
  }

  // cut off footer/summary so its numbers don't attach to the last transaction row
  const footerIdx = norm.search(/TRANSACTION TOTAL|CLOSING BALANCE|Account Summary|End of Statement|Statement Generated/i);
  if (footerIdx > 0) norm = norm.slice(0, footerIdx);

  // opening balance (handles "OPENING BALANCE 4649.15" and "Opening Balance - - - 19.12")
  const ob = norm.match(/Opening Balance[\s\-:]*?(\d[\d,]*\.\d{2})/i);
  let prev = ob ? toNum(ob[1]) : NaN;

  const moneyRe = /\d[\d,]*\.\d{2}/g;
  // split into rows at each date. Supports:
  //  "12 May 2026" | "09-12-2024" | "09/12/2024" | "12-May-24" | "2024-12-09"
  const dateAnchor = /(?=\b(?:\d{1,2}[ \/\-][A-Za-z]{3}[ \/\-]\d{2,4}|\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b)/;
  const dateGrab = /\b(\d{1,2}[ \/\-][A-Za-z]{3}[ \/\-]\d{2,4}|\d{2}[\/\-]\d{2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const rows = norm.split(dateAnchor);

  const txns: Txn[] = [];
  for (const row of rows) {
    const monies = row.match(moneyRe);
    if (!monies || monies.length < 2) continue;
    const dm = row.match(dateGrab);
    if (!dm) continue;

    // last money token = running balance, second-last = transaction amount
    const bal = toNum(monies[monies.length - 1]);
    const amt = toNum(monies[monies.length - 2]);
    if (!isFinite(bal) || amt <= 0) continue;

    let type: "DEBIT" | "CREDIT" = "DEBIT";
    if (isFinite(prev)) type = bal < prev ? "DEBIT" : "CREDIT";
    prev = bal;

    txns.push({
      date: dm[1],
      desc: getMerchant(row),
      amount: amt,
      type,
      category: getCategory(row),
    });
  }

  return { txns, totalDebit, totalCredit };
}

async function getInsights(summary: any, topCats: any[], attempt = 0): Promise<string[]> {
  const topCat = topCats[0];
  const prompt = `You are a sharp Indian personal finance advisor analysing a bank statement.

LANGUAGE: Respond ONLY in clear, professional English. Never use Hindi, Hinglish, or any other language.

DATA:
- Total money out: ₹${summary.total_spent}
- Total money in: ₹${summary.total_income}
- Savings rate: ${summary.savings_rate}%
- Top spending categories: ${topCats.map((c) => `${c.name} ₹${c.amount}`).join(", ")}

CONTEXT: P2A / Transfer amounts are usually money moved between the user's own or family accounts, so treat them as low-priority for cutting unless they dominate everything else.

TASK: Write exactly 4 insights. Each insight must:
- Be ONE clear sentence in English.
- Reference a SPECIFIC number or percentage from the data (e.g. "Your Shopping spend of ₹${topCat?.amount || 0} is X% of total outflow").
- Give a concrete, realistic action (a rupee target or percentage), not vague advice.
- Sound like a real advisor, not a robot. No emojis. No preamble.

Cover a mix of: the biggest spending leak, the savings rate, one realistic cut target, and one growth/investment suggestion (SIP, emergency fund, etc.).

Return ONLY JSON: { "insights": ["...", "...", "...", "..."] }`;
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(res.choices[0].message.content || "{}");
    return Array.isArray(parsed.insights) ? parsed.insights.slice(0, 4) : [];
  } catch (err: any) {
    if (err?.status === 429 && attempt < 1) {
      await sleep(5000);
      return getInsights(summary, topCats, attempt + 1);
    }
    return [
      `Your savings rate is ${summary.savings_rate}% — aim for at least 20% by trimming your top category.`,
      "Set a monthly cap on your largest discretionary category and track it weekly.",
      "Automate a SIP of ₹2,000–5,000 so savings happen before you spend.",
      "Build an emergency fund covering 3–6 months of expenses before investing aggressively.",
    ];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pdfData } = await req.json();
    if (!pdfData) return NextResponse.json({ error: "No PDF provided" }, { status: 400 });

    const { extractText } = await import("unpdf");
    const buffer = Buffer.from(pdfData, "base64");
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    const fullText = text || "";

    if (fullText.trim().length < 50) {
      return NextResponse.json(
        { error: "This PDF has no readable text (likely scanned). OCR not supported yet." },
        { status: 422 }
      );
    }

    const { txns, totalDebit, totalCredit } = parseStatement(fullText);

    if (txns.length === 0) {
      console.log("PARSE FAIL textlen:", fullText.length, "sample:", fullText.slice(0, 500));
      return NextResponse.json(
        { error: "Could not detect transactions. This statement layout is not supported yet." },
        { status: 422 }
      );
    }

    const sumDebit = txns.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
    const sumCredit = txns.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);

    const total_spent = Math.round(totalDebit ?? sumDebit);
    const total_income = Math.round(totalCredit ?? sumCredit);
    const savings_rate =
      total_income > 0 ? Math.round(((total_income - total_spent) / total_income) * 100) : 0;

    let risk_score: "Low" | "Medium" | "High" = "Medium";
    if (savings_rate >= 30) risk_score = "Low";
    else if (savings_rate < 10) risk_score = "High";

    const catMap: Record<string, number> = {};
    for (const t of txns) {
      if (t.type === "DEBIT") catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    }
    const categories = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount),
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS["Others"],
      }))
      .sort((a, b) => b.amount - a.amount);

    const summary = { total_spent, total_income, savings_rate, risk_score };
    const insights = await getInsights(summary, categories.slice(0, 4));

    // Top transactions for the default (collapsed) view
    const recent_transactions = txns
      .filter((t) => t.type === "DEBIT")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // ALL transactions (newest first) for the "View more" + search view
    const all_transactions = [...txns].reverse();

    // Per-payee summary: how many times + total paid to each name
    const payeeMap: Record<string, { name: string; count: number; total: number; type: string }> = {};
    for (const t of txns) {
      const key = t.desc.toLowerCase();
      if (!payeeMap[key]) payeeMap[key] = { name: t.desc, count: 0, total: 0, type: t.type };
      payeeMap[key].count += 1;
      payeeMap[key].total += t.amount;
    }
    const payees = Object.values(payeeMap).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      data: {
        summary,
        categories,
        insights,
        recent_transactions,
        all_transactions,
        payees,
        meta: {
          parsed_count: txns.length,
          totals_source: totalDebit != null ? "statement" : "computed",
        },
      },
    });
  } catch (error: any) {
    console.error("Error analyzing statement:", error?.message);
    return NextResponse.json({ error: "Failed to process PDF." }, { status: 500 });
  }
}