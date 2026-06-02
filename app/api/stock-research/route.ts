import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const maxDuration = 30;

// Only the chart endpoint is open on Yahoo now — gives live price + 52wk + name.
async function getLiveBasics(symbol: string) {
  const hosts = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
  for (const host of hosts) {
    try {
      const url = `https://${host}/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      const m = data?.chart?.result?.[0]?.meta;
      if (!m?.regularMarketPrice) continue;
      return {
        name: m.longName || m.shortName || symbol,
        symbol,
        price: m.regularMarketPrice,
        currency: m.currency || "INR",
        week52High: m.fiftyTwoWeekHigh != null ? Number(m.fiftyTwoWeekHigh).toFixed(2) : "—",
        week52Low: m.fiftyTwoWeekLow != null ? Number(m.fiftyTwoWeekLow).toFixed(2) : "—",
        exchange: m.fullExchangeName || "NSE",
      };
    } catch {
      // next host
    }
  }
  return null;
}

async function getAIResearch(basics: any) {
    const prompt = `You are a balanced equity research analyst. Write a structured research note on this Indian-listed company.

    LANGUAGE: English only. No Hindi/Hinglish.
    
    LIVE DATA (accurate):
    - Company: ${basics.name} (${basics.symbol})
    - Exchange: ${basics.exchange}
    - Current price: ${basics.currency} ${basics.price}
    - 52-week range: ${basics.week52Low} – ${basics.week52High}
    
    For valuation/financial metrics (P/E, market cap, revenue growth, margins, ROE), use your general knowledge of this company. These are APPROXIMATE — clearly mark them as estimates.
    
    RULES:
    - BALANCED: fair bull case AND bear case. Never say "buy" or "sell".
    - Reference the live numbers where relevant.
    - Be SPECIFIC to this company — avoid generic statements that could apply to any firm. Use real numbers (growth %, sector, products).
    - The verdict weighs both sides and ends with "Always do your own research before investing."
    - No emojis. Professional but readable.
    - For valuation: estimate the company's P/E and its sector/industry average P/E, then judge: "Cheap" (well below sector), "Fair" (near sector), or "Premium" (well above sector).
    - outlook: one of "Positive", "Neutral", "Cautious" based on the balance of pros/cons.
    - confidence: integer 50-90 — how confident this outlook is given the data.
    - horizon: realistic holding period like "Long-term (3-5 years)" or "Medium-term (1-3 years)".
    
    Return ONLY JSON:
    {
      "businessSummary": "2-3 sentences: what the company does and how it makes money",
      "keyMetrics": [
        { "label": "Market Cap (approx)", "value": "..." },
        { "label": "P/E Ratio (approx)", "value": "..." },
        { "label": "Revenue Growth (approx)", "value": "..." },
        { "label": "Profit Margin (approx)", "value": "..." }
      ],
      "valuation": { "currentPE": "e.g. 45", "industryPE": "e.g. 32", "status": "Cheap | Fair | Premium" },
      "pros": ["3 specific, company-specific strengths with numbers where possible"],
      "cons": ["3 specific, company-specific risks with numbers where possible"],
      "outlook": "Positive | Neutral | Cautious",
      "confidence": 74,
      "horizon": "Long-term (3-5 years)",
      "verdict": "3-4 sentence balanced view, ending with the research reminder"
    }`;
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 900,
    temperature: 0.5,
    response_format: { type: "json_object" },
  });
  return JSON.parse(res.choices[0].message.content || "{}");
}

export async function POST(req: NextRequest) {
  try {
    const { symbol } = await req.json();
    if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });

    // Auto-append .NS if user gave a bare ticker (RELIANCE -> RELIANCE.NS)
    const sym = /\.(NS|BO)$/i.test(symbol) ? symbol : `${symbol}.NS`;

    let basics = await getLiveBasics(sym);
    // fallback: try BSE if NSE didn't work
    if (!basics && !/\.(NS|BO)$/i.test(symbol)) {
      basics = await getLiveBasics(`${symbol}.BO`);
    }
    if (!basics) {
      return NextResponse.json({ error: "Could not fetch data. Try a full ticker like TCS.NS" }, { status: 404 });
    }

    const ai = await getAIResearch(basics);
    return NextResponse.json({ basics, ai });
  } catch (error: any) {
    console.error("Stock research error:", error?.message);
    return NextResponse.json({ error: "Failed to generate research." }, { status: 500 });
  }
}