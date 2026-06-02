import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];

  for (const host of hosts) {
    try {
      const url = `https://${host}/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        next: { revalidate: 60 },
      });
      const data = await response.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      if (meta?.regularMarketPrice == null) continue;

      const prevClose =
        meta.chartPreviousClose ??
        meta.previousClose ??
        meta.regularMarketPreviousClose ??
        meta.regularMarketPrice;

      return NextResponse.json({
        current: meta.regularMarketPrice,
        previousClose: prevClose,
      });
    } catch {
      // next host
    }
  }
  return NextResponse.json({ error: `No data for "${symbol}". Try TATAMOTORS.NS, TCS.NS, RELIANCE.NS` }, { status: 404 });
}
