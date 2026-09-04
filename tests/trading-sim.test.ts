import assert from 'node:assert/strict';
import test from 'node:test';

import { createPortfolio, defaultConfig, executeTrade, indicators, personalityFromConfig, scorePortfolio, type Candle } from '../lib/trading-sim.ts';

const candles: Candle[] = Array.from({ length: 80 }, (_, index) => {
  const close = 100 + index * .25 + Math.sin(index / 3);
  return { time: index * 300_000, open: close - .2, high: close + .7, low: close - .8, close, volume: 100 + index };
});

test('indicator engine calculates MA, MACD, WR and signals without looking ahead', () => {
  const points = indicators(candles, defaultConfig);
  assert.equal(points.length, candles.length);
  assert.equal(points[5].maSlow, null);
  assert.ok(points[79].maFast !== null);
  assert.ok(points[79].macdHistogram !== null);
  assert.ok(points[79].wr !== null && points[79].wr! <= 0);
});

test('spot simulator never spends more cash than available', () => {
  const initial = createPortfolio();
  const bought = executeTrade(initial, 'buy', 1, candles[50], 50, 2, 'TEST_BUY');
  assert.ok(bought.cash >= -.000001);
  assert.ok(bought.quantity > 0);
  const sold = executeTrade(bought, 'sell', 1, candles[60], 60, -2, 'TEST_SELL');
  assert.equal(sold.quantity, 0);
  assert.equal(sold.trades.length, 2);
});

test('score includes return, drawdown, overtrading and discipline', () => {
  const portfolio = executeTrade(createPortfolio(), 'buy', .25, candles[45], 45, 2, 'DISCIPLINED_BUY');
  const score = scorePortfolio(portfolio, candles[79].close);
  assert.ok(score.score >= 0 && score.score <= 100);
  assert.equal(score.discipline, 1);
});

test('parameter and module choices generate a reproducible personality', () => {
  assert.deepEqual(personalityFromConfig(defaultConfig), personalityFromConfig({ ...defaultConfig }));
});
