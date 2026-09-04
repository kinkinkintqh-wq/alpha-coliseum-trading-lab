'use client';

import type { Candle, IndicatorPoint, Trade } from '@/lib/trading-sim';

export function MarketChart({ candles, points, index, trades }: { candles: Candle[]; points: IndicatorPoint[]; index: number; trades: Trade[] }) {
  const start = Math.max(0, index - 39);
  const visible = candles.slice(start, index + 1);
  if (!visible.length) return null;
  const width = 900;
  const height = 350;
  const top = 22;
  const bottom = 48;
  const chartHeight = height - top - bottom;
  const max = Math.max(...visible.map((item) => item.high));
  const min = Math.min(...visible.map((item) => item.low));
  const range = Math.max(max - min, max * .001);
  const x = (offset: number) => 18 + offset * ((width - 36) / Math.max(visible.length, 1));
  const y = (price: number) => top + ((max - price) / range) * chartHeight;
  const candleWidth = Math.max(4, Math.min(13, (width - 36) / Math.max(visible.length, 1) * .58));
  const line = (key: 'maFast' | 'maSlow') => visible.map((_, offset) => {
    const value = points[start + offset]?.[key];
    return value === null || value === undefined ? null : `${x(offset)},${y(value)}`;
  }).filter(Boolean).join(' ');
  const visibleTrades = trades.filter((trade) => trade.index >= start && trade.index <= index);
  return <svg className="sim-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Historical candlestick replay">
    <defs><linearGradient id="chartFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#21d8ff" stopOpacity=".08"/><stop offset="1" stopColor="#21d8ff" stopOpacity="0"/></linearGradient></defs>
    {[0,.25,.5,.75,1].map((tick) => <g key={tick}><line x1="0" x2={width} y1={top + chartHeight * tick} y2={top + chartHeight * tick} stroke="rgba(255,255,255,.08)"/><text x={width - 8} y={top + chartHeight * tick - 4} textAnchor="end" fill="#696d75" fontSize="9">{(max-range*tick).toFixed(max < 10 ? 4 : 1)}</text></g>)}
    {visible.map((candle, offset) => {
      const up = candle.close >= candle.open;
      const color = up ? '#65ff95' : '#ff2b68';
      const bodyY = y(Math.max(candle.open, candle.close));
      const bodyHeight = Math.max(2, Math.abs(y(candle.open) - y(candle.close)));
      return <g key={candle.time}><line x1={x(offset)} x2={x(offset)} y1={y(candle.high)} y2={y(candle.low)} stroke={color} strokeWidth="1"/><rect x={x(offset)-candleWidth/2} y={bodyY} width={candleWidth} height={bodyHeight} fill={up ? '#071b15' : '#230914'} stroke={color}/></g>;
    })}
    <polyline points={line('maFast')} fill="none" stroke="#e5ff00" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    <polyline points={line('maSlow')} fill="none" stroke="#21d8ff" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
    {visibleTrades.map((trade) => {
      const offset = trade.index - start;
      const markerY = trade.side === 'buy' ? y(candles[trade.index].low) + 18 : y(candles[trade.index].high) - 18;
      return <g key={`${trade.index}-${trade.side}-${trade.quantity}`}><circle cx={x(offset)} cy={markerY} r="9" fill={trade.side === 'buy' ? '#e5ff00' : '#ff2b68'}/><text x={x(offset)} y={markerY+3} textAnchor="middle" fill="#050506" fontSize="8" fontWeight="900">{trade.side === 'buy' ? 'B' : 'S'}</text></g>;
    })}
    <text x="18" y={height-12} fill="#7c8087" fontSize="9">HISTORICAL REPLAY · DATE HIDDEN UNTIL SETTLEMENT</text>
    <g transform={`translate(${width-185},${height-24})`}><line x1="0" x2="24" y1="0" y2="0" stroke="#e5ff00" strokeWidth="2"/><text x="30" y="3" fill="#9da0a6" fontSize="9">FAST MA</text><line x1="88" x2="112" y1="0" y2="0" stroke="#21d8ff" strokeWidth="2"/><text x="118" y="3" fill="#9da0a6" fontSize="9">SLOW MA</text></g>
  </svg>;
}
