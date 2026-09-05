export type SimLang = 'zh' | 'en';
export type SymbolId = string;
export type IntervalId = '1m' | '5m' | '15m';
export type MarketMode = 'spot' | 'perp';
export type ModuleId = 'ma' | 'macd' | 'wr' | 'volume' | 'discipline' | 'scale' | 'patience' | 'momentum';

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type SimConfig = {
  symbol: SymbolId;
  interval: IntervalId;
  mode: MarketMode;
  leverage: 1 | 2 | 3 | 5;
  maFast: number;
  maSlow: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  wrPeriod: number;
  modules: ModuleId[];
};
export type Trade = { index: number; side: 'buy' | 'sell' | 'long' | 'short' | 'close' | 'liquidation'; price: number; quantity: number; fee: number; value: number; reason: string };
export type Portfolio = {
  mode: MarketMode;
  leverage: number;
  initialCash: number;
  cash: number;
  quantity: number;
  avgEntry: number;
  fees: number;
  trades: Trade[];
  peakEquity: number;
  maxDrawdown: number;
  disciplineHits: number;
  disciplineTotal: number;
  realizedPnl: number;
  liquidated: boolean;
};
export type IndicatorPoint = {
  maFast: number | null;
  maSlow: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  wr: number | null;
  volumeRatio: number | null;
  score: number;
  reasons: string[];
};
export type Personality = {
  title: { zh: string; en: string };
  subtitle: { zh: string; en: string };
  traits: { trend: number; reversal: number; speed: number; defense: number; discipline: number };
  color: string;
  commander: 'bull' | 'bear' | 'whale' | 'risk';
};

export const MODULES: Record<ModuleId, {
  name: { zh: string; en: string };
  short: { zh: string; en: string };
  lesson: { zh: string; en: string };
  kind: 'indicator' | 'strategy' | 'risk';
  art: string;
}> = {
  ma: { name: { zh: '双均线雷达', en: 'Dual MA Radar' }, short: { zh: '识别趋势方向与交叉', en: 'Read direction and crossovers' }, lesson: { zh: '短均线高于长均线代表近期价格更强，但震荡中容易反复交叉。', en: 'Fast MA above slow MA suggests strength, but choppy markets create false crosses.' }, kind: 'indicator', art: '/game-art/event-trend-surge-v1.png' },
  macd: { name: { zh: 'MACD 动量核', en: 'MACD Momentum Core' }, short: { zh: '观察动量与变化速度', en: 'Track momentum and acceleration' }, lesson: { zh: '柱体扩大代表动量增强，缩小则说明原方向正在减弱。', en: 'An expanding histogram means momentum is strengthening; contraction means it is fading.' }, kind: 'indicator', art: '/cards/momentum-v1.jpg' },
  wr: { name: { zh: 'WR 极值镜', en: 'WR Extremes Lens' }, short: { zh: '寻找超买与超卖区域', en: 'Find overbought and oversold zones' }, lesson: { zh: 'WR 低于 -80 常被视为超卖，但超卖不代表价格一定立即反弹。', en: 'WR below -80 is often called oversold, but it does not guarantee an immediate bounce.' }, kind: 'indicator', art: '/game-art/event-volatility-storm-v1.png' },
  volume: { name: { zh: '成交量脉冲', en: 'Volume Pulse' }, short: { zh: '判断突破是否有资金确认', en: 'Check whether volume confirms a move' }, lesson: { zh: '放量可增强信号可信度，但单次异常成交也可能造成误导。', en: 'Volume can confirm a move, though one abnormal print can mislead.' }, kind: 'indicator', art: '/game-art/event-liquidity-abyss-v1.png' },
  discipline: { name: { zh: '止损戒律', en: 'Stop-Loss Discipline' }, short: { zh: '亏损达到阈值时提醒退出', en: 'Warn when loss reaches the limit' }, lesson: { zh: '控制单次损失比追求每次判断正确更重要。', en: 'Limiting one loss matters more than being right every time.' }, kind: 'risk', art: '/cards/risk-v1.jpg' },
  scale: { name: { zh: '分批建仓', en: 'Scale-In Protocol' }, short: { zh: '用多次小决策替代一次重仓', en: 'Replace one big bet with smaller decisions' }, lesson: { zh: '分批交易可以降低入场时点风险，但会增加手续费。', en: 'Scaling reduces entry-timing risk but increases fees.' }, kind: 'risk', art: '/cards/depth-v1.jpg' },
  patience: { name: { zh: '等待确认', en: 'Confirmation Gate' }, short: { zh: '多个条件一致才提高置信度', en: 'Demand agreement across signals' }, lesson: { zh: '更多确认能过滤噪声，也可能让入场变晚。', en: 'More confirmation filters noise but may make entries late.' }, kind: 'strategy', art: '/rounds/round-opening-v1.jpg' },
  momentum: { name: { zh: '趋势追击', en: 'Trend Pursuit' }, short: { zh: '顺着已经形成的方向行动', en: 'Follow established direction' }, lesson: { zh: '趋势策略通常胜率未必很高，但依靠截断亏损和持有盈利获利。', en: 'Trend systems may win less often; they rely on small losses and larger winners.' }, kind: 'strategy', art: '/rounds/round-clash-v1.jpg' },
};

export const defaultConfig: SimConfig = {
  symbol: 'BTCUSDT', interval: '5m', mode: 'spot', leverage: 2, maFast: 7, maSlow: 21, macdFast: 8, macdSlow: 17, macdSignal: 6, wrPeriod: 14,
  modules: ['ma', 'macd', 'wr', 'discipline'],
};

function ema(values: number[], period: number) {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (values.length < period) return result;
  let current = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = current;
  const alpha = 2 / (period + 1);
  for (let index = period; index < values.length; index += 1) {
    current = values[index] * alpha + current * (1 - alpha);
    result[index] = current;
  }
  return result;
}

function sma(values: number[], period: number, index: number) {
  if (index + 1 < period) return null;
  return values.slice(index - period + 1, index + 1).reduce((sum, value) => sum + value, 0) / period;
}

export function indicators(candles: Candle[], config: SimConfig): IndicatorPoint[] {
  const closes = candles.map((candle) => candle.close);
  const fastEma = ema(closes, config.macdFast);
  const slowEma = ema(closes, config.macdSlow);
  const macdLine = closes.map((_, index) => fastEma[index] !== null && slowEma[index] !== null ? fastEma[index]! - slowEma[index]! : null);
  const firstMacd = macdLine.findIndex((value) => value !== null);
  const signalInput = firstMacd < 0 ? [] : macdLine.slice(firstMacd).map((value) => value ?? 0);
  const signalSeries = ema(signalInput, config.macdSignal);
  return candles.map((candle, index) => {
    const maFast = sma(closes, config.maFast, index);
    const maSlow = sma(closes, config.maSlow, index);
    const macd = macdLine[index];
    const signalOffset = index - firstMacd;
    const macdSignal = signalOffset >= 0 ? signalSeries[signalOffset] : null;
    const wrSlice = index + 1 >= config.wrPeriod ? candles.slice(index - config.wrPeriod + 1, index + 1) : [];
    const highest = wrSlice.length ? Math.max(...wrSlice.map((item) => item.high)) : null;
    const lowest = wrSlice.length ? Math.min(...wrSlice.map((item) => item.low)) : null;
    const wr = highest !== null && lowest !== null && highest !== lowest ? ((highest - candle.close) / (highest - lowest)) * -100 : null;
    const avgVolume = sma(candles.map((item) => item.volume), 20, index);
    const volumeRatio = avgVolume ? candle.volume / avgVolume : null;
    let score = 0;
    const reasons: string[] = [];
    if (config.modules.includes('ma') && maFast !== null && maSlow !== null) {
      score += maFast > maSlow ? 1 : -1;
      reasons.push(maFast > maSlow ? 'MA_BULL' : 'MA_BEAR');
    }
    if (config.modules.includes('macd') && macd !== null && macdSignal !== null) {
      score += macd > macdSignal ? 1 : -1;
      reasons.push(macd > macdSignal ? 'MACD_BULL' : 'MACD_BEAR');
    }
    if (config.modules.includes('wr') && wr !== null) {
      if (wr < -80) { score += 1; reasons.push('WR_OVERSOLD'); }
      if (wr > -20) { score -= 1; reasons.push('WR_OVERBOUGHT'); }
    }
    if (config.modules.includes('volume') && volumeRatio !== null && volumeRatio > 1.5) {
      score += Math.sign(candle.close - candle.open);
      reasons.push('VOLUME_SPIKE');
    }
    if (config.modules.includes('patience') && Math.abs(score) < 2) score = 0;
    if (config.modules.includes('momentum') && maFast !== null && maSlow !== null) score += Math.sign(maFast - maSlow);
    return { maFast, maSlow, macd, macdSignal, macdHistogram: macd !== null && macdSignal !== null ? macd - macdSignal : null, wr, volumeRatio, score, reasons };
  });
}

export function personalityFromConfig(config: SimConfig): Personality {
  const trend = Math.min(100, 25 + (config.modules.includes('ma') ? 35 : 0) + (config.modules.includes('momentum') ? 30 : 0));
  const reversal = Math.min(100, 20 + (config.modules.includes('wr') ? 50 : 0));
  const speed = Math.max(10, Math.min(100, 110 - config.maFast * 4 - (config.interval === '1m' ? 0 : config.interval === '5m' ? 15 : 30)));
  const defense = Math.min(100, 20 + (config.modules.includes('discipline') ? 45 : 0) + (config.modules.includes('scale') ? 25 : 0));
  const discipline = Math.min(100, 25 + (config.modules.includes('patience') ? 35 : 0) + (config.modules.includes('discipline') ? 40 : 0));
  if (trend >= 70 && speed >= 55) return { title: { zh: '裂隙趋势猎手', en: 'Rift Trend Hunter' }, subtitle: { zh: '追随动量，迅速确认', en: 'Fast confirmation, momentum first' }, traits: { trend, reversal, speed, defense, discipline }, color: '#e5ff00', commander: 'bull' };
  if (reversal >= 60) return { title: { zh: '极值反转术士', en: 'Extreme Reversal Adept' }, subtitle: { zh: '等待过热，在极端处出手', en: 'Wait for extremes, then strike' }, traits: { trend, reversal, speed, defense, discipline }, color: '#ff2b68', commander: 'bear' };
  if (defense >= 70) return { title: { zh: '虚空风险守卫', en: 'Void Risk Warden' }, subtitle: { zh: '先活下来，再寻找机会', en: 'Survive first, seek opportunity second' }, traits: { trend, reversal, speed, defense, discipline }, color: '#a970ff', commander: 'risk' };
  return { title: { zh: '深流数据侦察者', en: 'Deep-Flow Data Scout' }, subtitle: { zh: '平衡信号，重视确认', en: 'Balanced signals and confirmation' }, traits: { trend, reversal, speed, defense, discipline }, color: '#21d8ff', commander: 'whale' };
}

export function createPortfolio(initialCash = 10000, mode: MarketMode = 'spot', leverage = 1): Portfolio {
  return { mode, leverage, initialCash, cash: initialCash, quantity: 0, avgEntry: 0, fees: 0, trades: [], peakEquity: initialCash, maxDrawdown: 0, disciplineHits: 0, disciplineTotal: 0, realizedPnl: 0, liquidated: false };
}

export function equity(portfolio: Portfolio, price: number) {
  return portfolio.mode === 'spot' ? portfolio.cash + portfolio.quantity * price : portfolio.cash + (price - portfolio.avgEntry) * portfolio.quantity;
}

export function availableMargin(portfolio: Portfolio, price: number) {
  if (portfolio.mode !== 'perp') return portfolio.cash;
  const used = Math.abs(portfolio.quantity) * price / Math.max(1, portfolio.leverage);
  return Math.max(0, equity(portfolio, price) - used);
}

export function liquidationPrice(portfolio: Portfolio) {
  if (portfolio.mode !== 'perp' || !portfolio.quantity || !portfolio.avgEntry) return null;
  const maintenance = .005;
  return portfolio.quantity > 0
    ? portfolio.avgEntry * (1 - 1 / portfolio.leverage + maintenance)
    : portfolio.avgEntry * (1 + 1 / portfolio.leverage - maintenance);
}

export function executeTrade(portfolio: Portfolio, side: 'buy' | 'sell', fraction: number, candle: Candle, index: number, signal: number, reason: string, feeRate = .001, slippageRate = .0004): Portfolio {
  if (portfolio.mode !== 'spot') return portfolio;
  const safeFraction = Math.max(0, Math.min(1, fraction));
  if (!safeFraction) return portfolio;
  const price = candle.close * (side === 'buy' ? 1 + slippageRate : 1 - slippageRate);
  let quantity = side === 'buy' ? (portfolio.cash * safeFraction) / (price * (1 + feeRate)) : portfolio.quantity * safeFraction;
  quantity = Math.max(0, quantity);
  if (quantity <= 0.000000001) return portfolio;
  const value = quantity * price;
  const fee = value * feeRate;
  const disciplined = side === 'buy' ? signal > 0 : signal < 0;
  let cash = portfolio.cash;
  let held = portfolio.quantity;
  let avgEntry = portfolio.avgEntry;
  if (side === 'buy') {
    const oldCost = held * avgEntry;
    cash -= value + fee;
    held += quantity;
    avgEntry = held ? (oldCost + value + fee) / held : 0;
  } else {
    cash += value - fee;
    held -= quantity;
    if (held < 0.000000001) { held = 0; avgEntry = 0; }
  }
  const currentEquity = cash + held * candle.close;
  const peakEquity = Math.max(portfolio.peakEquity, currentEquity);
  const maxDrawdown = Math.max(portfolio.maxDrawdown, peakEquity ? (peakEquity - currentEquity) / peakEquity : 0);
  return {
    ...portfolio, cash, quantity: held, avgEntry, fees: portfolio.fees + fee, peakEquity, maxDrawdown,
    disciplineHits: portfolio.disciplineHits + (disciplined ? 1 : 0), disciplineTotal: portfolio.disciplineTotal + 1,
    trades: [...portfolio.trades, { index, side, price, quantity, fee, value, reason }],
  };
}

export function executePerpTrade(portfolio: Portfolio, action: 'long' | 'short' | 'close', fraction: number, candle: Candle, index: number, signal: number, reason: string, feeRate = .0005, slippageRate = .00035): Portfolio {
  if (portfolio.mode !== 'perp' || portfolio.liquidated) return portfolio;
  const safeFraction = Math.max(0, Math.min(1, fraction));
  if (!safeFraction) return portfolio;
  const direction = action === 'long' ? 1 : action === 'short' ? -1 : 0;
  const price = candle.close * (action === 'long' ? 1 + slippageRate : action === 'short' ? 1 - slippageRate : portfolio.quantity > 0 ? 1 - slippageRate : 1 + slippageRate);
  let cash = portfolio.cash;
  let quantity = portfolio.quantity;
  let avgEntry = portfolio.avgEntry;
  let realizedPnl = portfolio.realizedPnl;
  let tradedQty = 0;
  if (action === 'close') {
    tradedQty = Math.abs(quantity) * safeFraction;
    if (tradedQty <= 0.000000001) return portfolio;
    const signedClosed = Math.sign(quantity) * tradedQty;
    const pnl = (price - avgEntry) * signedClosed;
    const fee = tradedQty * price * feeRate;
    cash += pnl - fee;
    realizedPnl += pnl;
    quantity -= signedClosed;
    if (Math.abs(quantity) <= 0.000000001) { quantity = 0; avgEntry = 0; }
    const next = { ...portfolio, cash, quantity, avgEntry, realizedPnl, fees: portfolio.fees + fee, disciplineHits: portfolio.disciplineHits + (signal * signedClosed < 0 ? 1 : 0), disciplineTotal: portfolio.disciplineTotal + 1, trades: [...portfolio.trades, { index, side: 'close' as const, price, quantity: tradedQty, fee, value: tradedQty * price, reason }] };
    return markPortfolio(next, candle.close);
  }
  if (quantity && Math.sign(quantity) !== direction) return portfolio;
  const margin = availableMargin(portfolio, candle.close) * safeFraction;
  const notional = margin * portfolio.leverage;
  tradedQty = notional / price;
  if (tradedQty <= 0.000000001) return portfolio;
  const signedAdded = direction * tradedQty;
  const oldNotional = Math.abs(quantity) * avgEntry;
  const fee = notional * feeRate;
  cash -= fee;
  quantity += signedAdded;
  avgEntry = Math.abs(quantity) ? (oldNotional + notional) / Math.abs(quantity) : 0;
  const disciplined = action === 'long' ? signal > 0 : signal < 0;
  const next = { ...portfolio, cash, quantity, avgEntry, fees: portfolio.fees + fee, disciplineHits: portfolio.disciplineHits + (disciplined ? 1 : 0), disciplineTotal: portfolio.disciplineTotal + 1, trades: [...portfolio.trades, { index, side: action, price, quantity: tradedQty, fee, value: notional, reason }] };
  return markPortfolio(next, candle.close);
}

export function markPortfolio(portfolio: Portfolio, price: number): Portfolio {
  const current = equity(portfolio, price);
  const peakEquity = Math.max(portfolio.peakEquity, current);
  const maxDrawdown = Math.max(portfolio.maxDrawdown, peakEquity ? (peakEquity - current) / peakEquity : 0);
  if (portfolio.mode === 'perp' && portfolio.quantity && current <= Math.abs(portfolio.quantity) * price * .005) {
    const fee = Math.abs(portfolio.quantity) * price * .001;
    return { ...portfolio, cash: Math.max(0, current - fee), quantity: 0, avgEntry: 0, fees: portfolio.fees + fee, peakEquity, maxDrawdown, liquidated: true, trades: [...portfolio.trades, { index: portfolio.trades.at(-1)?.index ?? 0, side: 'liquidation', price, quantity: Math.abs(portfolio.quantity), fee, value: Math.abs(portfolio.quantity) * price, reason: 'LIQUIDATION' }] };
  }
  return { ...portfolio, peakEquity, maxDrawdown };
}

export function scorePortfolio(portfolio: Portfolio, price: number) {
  const endingEquity = equity(portfolio, price);
  const returnPct = ((endingEquity / portfolio.initialCash) - 1) * 100;
  const discipline = portfolio.disciplineTotal ? portfolio.disciplineHits / portfolio.disciplineTotal : .5;
  const overtradePenalty = Math.max(0, portfolio.trades.length - 8) * .35;
  const score = Math.round(50 + returnPct * 6 - portfolio.maxDrawdown * 100 * 2 - overtradePenalty + discipline * 18);
  return { endingEquity, returnPct, discipline, overtradePenalty, score: Math.max(0, Math.min(100, score)) };
}

export function runAiStep(portfolio: Portfolio, candle: Candle, point: IndicatorPoint, index: number) {
  if (portfolio.mode === 'perp') {
    if (!portfolio.quantity && point.score >= 2) return executePerpTrade(portfolio, 'long', .28, candle, index, point.score, 'AI_LONG');
    if (!portfolio.quantity && point.score <= -2) return executePerpTrade(portfolio, 'short', .28, candle, index, point.score, 'AI_SHORT');
    if (portfolio.quantity > 0 && point.score <= -1) return executePerpTrade(portfolio, 'close', 1, candle, index, point.score, 'AI_CLOSE_LONG');
    if (portfolio.quantity < 0 && point.score >= 1) return executePerpTrade(portfolio, 'close', 1, candle, index, point.score, 'AI_CLOSE_SHORT');
    return markPortfolio(portfolio, candle.close);
  }
  if (point.score >= 2 && portfolio.cash > 100) return executeTrade(portfolio, 'buy', .35, candle, index, point.score, 'AI_SIGNAL_BUY');
  if (point.score <= -2 && portfolio.quantity > 0) return executeTrade(portfolio, 'sell', .5, candle, index, point.score, 'AI_SIGNAL_SELL');
  if (portfolio.quantity > 0 && portfolio.avgEntry && candle.close < portfolio.avgEntry * .97) return executeTrade(portfolio, 'sell', 1, candle, index, -1, 'AI_STOP_LOSS');
  return markPortfolio(portfolio, candle.close);
}
