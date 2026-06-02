// app/api/search-stock/route.ts
import { NextResponse } from 'next/server';
import stocks from '@/lib/nse-stocks.json';

type Stock = { symbol: string; name: string };
const ALL = stocks as Stock[];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const ql = q.toLowerCase().trim();

  const scored = ALL
    .map((s) => {
      const sym = s.symbol.replace('.NS', '').toLowerCase();
      const name = s.name.toLowerCase();
      let score = -1;
      if (sym === ql) score = 0;
      else if (sym.startsWith(ql)) score = 1;
      else if (name.startsWith(ql)) score = 2;
      else if (sym.includes(ql)) score = 3;
      else if (name.includes(ql)) score = 4;
      return { s, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)
    .map((x) => x.s);

  return NextResponse.json({ results: scored });
}