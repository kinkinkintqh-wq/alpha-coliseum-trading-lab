const BINANCE_API = 'https://api.binance.com';

type DepthLevel = [string, string];

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') ?? '').toUpperCase();
  if (!/^[A-Z0-9]{5,18}$/.test(symbol))
    return json({ error: 'Invalid symbol' }, 400);

  try {
    const [tickerResponse, depthResponse] = await Promise.all([
      fetch(`${BINANCE_API}/api/v3/ticker/24hr?symbol=${symbol}`, {
        cache: 'no-store',
      }),
      fetch(`${BINANCE_API}/api/v3/depth?symbol=${symbol}&limit=20`, {
        cache: 'no-store',
      }),
    ]);
    if (!tickerResponse.ok || !depthResponse.ok) {
      const status = tickerResponse.status === 400 ? 404 : 502;
      return json(
        { error: status === 404 ? 'Trading pair not found' : 'Binance market data unavailable' },
        status,
      );
    }
    const ticker = await tickerResponse.json();
    const depth = (await depthResponse.json()) as {
      bids: DepthLevel[];
      asks: DepthLevel[];
    };
    const sumDepth = (levels: DepthLevel[]) =>
      levels.reduce((total, level) => total + Number(level[1]), 0);

    return json({
      symbol,
      capturedAt: new Date().toISOString(),
      ticker,
      depth: {
        bidTotal: sumDepth(depth.bids),
        askTotal: sumDepth(depth.asks),
        bestBid: depth.bids[0]?.[0] ?? null,
        bestAsk: depth.asks[0]?.[0] ?? null,
      },
    });
  } catch {
    return json({ error: 'Unable to reach Binance public market data' }, 502);
  }
}
