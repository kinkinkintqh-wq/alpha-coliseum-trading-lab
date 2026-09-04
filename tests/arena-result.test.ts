import assert from 'node:assert/strict';
import test from 'node:test';

import { parseArenaResult } from '../lib/arena-result.ts';

function fixture() {
  return {
    arena_result: {
      schema_version: '1.0',
      source: 'Binance MCP',
      pair: 'DOGEUSDT',
      captured_at: '2026-09-03T08:00:00Z',
      market_status: 'TRADING',
      style: 'BALANCED',
      facts: [{ label: 'last_price', value: '0.08272', source: 'ticker' }],
      fighters: ['bull', 'bear', 'whale', 'risk'].map((id, index) => ({
        id,
        score: 50 + index,
        claim: id + ' claim',
        evidence: ['MCP evidence ' + index],
        counterpoint: 'opposing evidence',
      })),
      verdict: 'WAIT',
      confidence: 64,
      largest_risk: 'short-term volatility',
      invalidation: 'volume confirms breakout',
      trade_executed: false,
    },
  };
}

void test('imports a valid Agent OS arena result', () => {
  const parsed = parseArenaResult(JSON.stringify(fixture()));
  assert.equal(parsed.pair, 'DOGEUSDT');
  assert.equal(parsed.fighters.length, 4);
  assert.equal(parsed.trade_executed, false);
});

void test('accepts a fenced JSON response copied from Agent OS', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const parsed = parseArenaResult(
    fence + 'json\n' + JSON.stringify(fixture()) + '\n' + fence,
  );
  assert.equal(parsed.verdict, 'WAIT');
});

void test('accepts a read-only Binance public API preview result', () => {
  const preview = fixture();
  Object.assign(preview.arena_result, { source: 'Binance Public API' });
  const parsed = parseArenaResult(JSON.stringify(preview));
  assert.equal(parsed.source, 'Binance Public API');
});

void test('rejects an untrusted data source label', () => {
  const unsafeSource = fixture();
  Object.assign(unsafeSource.arena_result, { source: 'Unknown Feed' });
  assert.throws(() => parseArenaResult(JSON.stringify(unsafeSource)), /source/);
});

void test('rejects a payload that claims a real trade was executed', () => {
  const unsafe = fixture();
  Object.assign(unsafe.arena_result, { trade_executed: true });
  assert.throws(() => parseArenaResult(JSON.stringify(unsafe)), /仅接受/);
});

void test('rejects duplicate fighter identities', () => {
  const duplicate = fixture();
  duplicate.arena_result.fighters[3].id = 'bull';
  assert.throws(() => parseArenaResult(JSON.stringify(duplicate)), /必须唯一/);
});
