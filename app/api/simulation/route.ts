const DATA_API = 'https://data-api.binance.vision';
const allowedSymbols = new Set(['BTCUSDT', 'ETHUSDT', 'DOGEUSDT']);
const intervals = new Set(['1m', '5m', '15m']);

type RawKline = [number, string, string, string, string, string, number, string, number, string, string, string];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') ?? 'BTCUSDT').toUpperCase();
  const interval = url.searchParams.get('interval') ?? '5m';
  if (!allowedSymbols.has(symbol) || !intervals.has(interval)) return Response.json({ error: 'Unsupported simulation market' }, { status: 400 });
  const intervalMs = interval === '1m' ? 60_000 : interval === '5m' ? 300_000 : 900_000;
  const seed = Number(url.searchParams.get('seed')) || Date.now();
  const daysBack = 7 + (Math.abs(seed) % 120);
  const endTime = Date.now() - daysBack * 86_400_000;
  const endpoint = new URL('/api/v3/klines', DATA_API);
  endpoint.searchParams.set('symbol', symbol);
  endpoint.searchParams.set('interval', interval);
  endpoint.searchParams.set('limit', '120');
  endpoint.searchParams.set('endTime', String(endTime - (endTime % intervalMs)));
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return Response.json({ error: 'Historical market data unavailable' }, { status: 502 });
    const rows = await response.json() as RawKline[];
    if (!Array.isArray(rows) || rows.length < 80) return Response.json({ error: 'Insufficient historical data' }, { status: 502 });
    return Response.json({
      symbol, interval, source: 'Binance Spot public market data',
      candles: rows.map((row) => ({ time: row[0], open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Unable to reach Binance public market data' }, { status: 502 });
  }
}
