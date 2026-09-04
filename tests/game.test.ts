import assert from 'node:assert/strict';
import test from 'node:test';

import { CARDS, CARD_MAP, chooseAiMoves, createGame, eventForRound, fallbackClimate, resolveRound, starterDeck, validDeployment } from '../lib/game.ts';

test('formal card pool has 32 unique cards', () => {
  assert.equal(CARDS.length, 32);
  assert.equal(new Set(CARDS.map((card) => card.id)).size, 32);
});

test('starter decks contain 18 available cards', () => {
  const deck = starterDeck('bull', 42);
  assert.equal(deck.length, 18);
  assert.ok(deck.every((id) => CARD_MAP.has(id)));
});

test('AI deployment respects hand, card count, and energy rules', () => {
  const game = createGame({ ...fallbackClimate, capturedAt: '2026-09-04T00:00:00.000Z' }, 'bull');
  const moves = chooseAiMoves(game, 'oracle');
  assert.ok(moves.length > 0 && moves.length <= 2);
  assert.equal(validDeployment(game.rival, moves), true);
});

test('a round resolves all three fronts and advances deterministically', () => {
  const game = createGame({ ...fallbackClimate, capturedAt: '2026-09-04T00:00:00.000Z' }, 'bull');
  const first = game.player.hand[0];
  const card = CARD_MAP.get(first)!;
  const next = resolveRound(game, [{ cardId: first, lane: card.lane === 'wild' ? 'trend' : card.lane }], chooseAiMoves(game));
  assert.equal(next.history.length, 1);
  assert.equal(next.history[0].lanes.length, 3);
  assert.equal(next.round, 2);
  assert.equal(eventForRound(game).id, eventForRound(game).id);
});

test('illegal duplicate deployment is rejected', () => {
  const game = createGame(fallbackClimate, 'risk');
  const id = game.player.hand[0];
  assert.equal(validDeployment(game.player, [{ cardId: id, lane: 'risk' }, { cardId: id, lane: 'trend' }]), false);
});
