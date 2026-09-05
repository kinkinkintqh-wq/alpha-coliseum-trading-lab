const SPOT_API = 'https://api.binance.com';
const FUTURES_API = 'https://fapi.binance.com';

type SymbolInfo = {
  symbol: string;
  status: string;
  quoteAsset: string;
  baseAsset: string;
  contractType?: string;
};

type Ticker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
};

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get('mode') === 'perp' ? 'perp' : 'spot';
  const base = mode === 'perp' ? FUTURES_API : SPOT_API;
  const infoPath = mode === 'perp' ? '/fapi/v1/exchangeInfo' : '/api/v3/exchangeInfo';
  const tickerPath = mode === 'perp' ? '/fapi/v1/ticker/24hr' : '/api/v3/ticker/24hr';
  try {
    const [infoResponse, tickerResponse] = await Promise.all([
      fetch(`${base}${infoPath}`, { next: { revalidate: 900 } }),
      fetch(`${base}${tickerPath}`, { next: { revalidate: 60 } }),
    ]);
    if (!infoResponse.ok || !tickerResponse.ok) throw new Error('market');
    const info = await infoResponse.json() as { symbols: SymbolInfo[] };
    const tickers = await tickerResponse.json() as Ticker[];
    const tickerMap = new Map(tickers.map((ticker) => [ticker.symbol, ticker]));
    const markets = info.symbols
      .filter((item) => item.status === 'TRADING' && item.quoteAsset === 'USDT' && (mode === 'spot' || item.contractType === 'PERPETUAL'))
      .map((item) => {
        const ticker = tickerMap.get(item.symbol);
        return {
          symbol: item.symbol,
          baseAsset: item.baseAsset,
          lastPrice: Number(ticker?.lastPrice ?? 0),
          change24h: Number(ticker?.priceChangePercent ?? 0),
          quoteVolume: Number(ticker?.quoteVolume ?? 0),
        };
      })
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, 400);
    return Response.json({ mode, source: 'Binance public market data', markets }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
  } catch {
    return Response.json({ error: 'Binance market discovery unavailable' }, { status: 502 });
  }
}
