const DATA_API = 'https://data-api.binance.vision';
const FUTURES_API = 'https://fapi.binance.com';
const intervals = new Set(['1m', '5m', '15m']);

type RawKline = [number, string, string, string, string, string, number, string, number, string, string, string];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') ?? 'BTCUSDT').toUpperCase();
  const interval = url.searchParams.get('interval') ?? '5m';
  const mode = url.searchParams.get('mode') === 'perp' ? 'perp' : 'spot';
  if (!/^[A-Z0-9]{5,18}$/.test(symbol) || !symbol.endsWith('USDT') || !intervals.has(interval)) return Response.json({ error: 'Unsupported simulation market' }, { status: 400 });
  const intervalMs = interval === '1m' ? 60_000 : interval === '5m' ? 300_000 : 900_000;
  const seed = Number(url.searchParams.get('seed')) || Date.now();
  const daysBack = mode === 'perp' ? 2 + (Math.abs(seed) % 20) : 7 + (Math.abs(seed) % 120);
  const endTime = Date.now() - daysBack * 86_400_000;
  const endpoint = new URL(mode === 'perp' ? '/fapi/v1/klines' : '/api/v3/klines', mode === 'perp' ? FUTURES_API : DATA_API);
  endpoint.searchParams.set('symbol', symbol);
  endpoint.searchParams.set('interval', interval);
  endpoint.searchParams.set('limit', '120');
  endpoint.searchParams.set('endTime', String(endTime - (endTime % intervalMs)));
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return Response.json({ error: 'Historical market data unavailable' }, { status: 502 });
    const rows = await response.json() as RawKline[];
    if (!Array.isArray(rows) || rows.length < 80) return Response.json({ error: 'Insufficient historical data' }, { status: 502 });
    let futuresContext: null | { fundingRate: number | null; openInterestValue: number | null; longShortRatio: number | null; capturedAt: number } = null;
    if (mode === 'perp') {
      const capturedAt = rows[Math.min(42, rows.length - 1)][0];
      const [fundingResponse, interestResponse, ratioResponse] = await Promise.all([
        fetch(`${FUTURES_API}/fapi/v1/fundingRate?symbol=${symbol}&endTime=${capturedAt}&limit=1`, { cache: 'no-store' }),
        fetch(`${FUTURES_API}/futures/data/openInterestHist?symbol=${symbol}&period=5m&endTime=${capturedAt}&limit=1`, { cache: 'no-store' }),
        fetch(`${FUTURES_API}/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&endTime=${capturedAt}&limit=1`, { cache: 'no-store' }),
      ]);
      const funding = fundingResponse.ok ? await fundingResponse.json() as Array<{ fundingRate: string }> : [];
      const interest = interestResponse.ok ? await interestResponse.json() as Array<{ sumOpenInterestValue: string }> : [];
      const ratio = ratioResponse.ok ? await ratioResponse.json() as Array<{ longShortRatio: string }> : [];
      futuresContext = { fundingRate: funding[0] ? Number(funding[0].fundingRate) : null, openInterestValue: interest[0] ? Number(interest[0].sumOpenInterestValue) : null, longShortRatio: ratio[0] ? Number(ratio[0].longShortRatio) : null, capturedAt };
    }
    return Response.json({
      symbol, interval, mode, futuresContext, source: mode === 'perp' ? 'Binance USDⓈ-M Futures public market data' : 'Binance Spot public market data',
      candles: rows.map((row) => ({ time: row[0], open: Number(row[1]), high: Number(row[2]), low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]) })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Unable to reach Binance public market data' }, { status: 502 });
  }
}
