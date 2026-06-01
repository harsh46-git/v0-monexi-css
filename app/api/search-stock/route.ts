// app/api/search-stock/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    const data = await res.json();   // 👈 YE LINE MISSING THI

    const results = (data?.quotes || [])
      .filter((it: any) =>
        it.symbol &&
        (it.symbol.endsWith('.NS') || it.symbol.endsWith('.BO')) &&
        it.quoteType === 'EQUITY' &&
        !/^0P/.test(it.symbol)
      )
      .map((it: any) => ({
        symbol: it.symbol,
        name: it.shortname || it.longname || it.symbol,
      }))
      .slice(0, 8);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}