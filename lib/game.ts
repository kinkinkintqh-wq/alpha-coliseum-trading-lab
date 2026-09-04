export type Lang = 'zh' | 'en';
export type Lane = 'trend' | 'liquidity' | 'risk';
export type Faction = 'momentum' | 'macro' | 'flow' | 'hedge';
export type CommanderId = 'bull' | 'bear' | 'whale' | 'risk';

export type MarketPayload = {
  symbol: string;
  capturedAt: string;
  ticker: Record<string, string | number>;
  depth: { bidTotal: number; askTotal: number; bestBid: string | null; bestAsk: string | null };
};

export type MarketClimate = {
  symbol: string;
  price: number;
  change: number;
  trend: number;
  volatility: number;
  liquidity: number;
  flow: number;
  capturedAt: string;
};

export type Card = {
  id: string;
  name: { zh: string; en: string };
  text: { zh: string; en: string };
  faction: Faction;
  lane: Lane | 'wild';
  cost: 1 | 2;
  power: number;
  art: string;
  tags: string[];
};

export type Deployment = { cardId: string; lane: Lane };
export type Player = {
  name: string;
  commander: CommanderId;
  deck: string[];
  hand: string[];
  points: number;
  laneWins: Record<Lane, number>;
  riftReady: boolean;
  riftUsed: boolean;
};

export type LaneResult = {
  lane: Lane;
  playerPower: number;
  rivalPower: number;
  winner: 'player' | 'rival' | 'tie';
  playerCards: string[];
  rivalCards: string[];
};

export type RoundResult = {
  round: number;
  event: MarketEvent;
  lanes: LaneResult[];
  playerCombo?: string;
  rivalCombo?: string;
};

export type GameState = {
  seed: number;
  round: number;
  climate: MarketClimate;
  player: Player;
  rival: Player;
  history: RoundResult[];
  winner?: 'player' | 'rival' | 'draw';
};

export type MarketEvent = {
  id: string;
  name: { zh: string; en: string };
  text: { zh: string; en: string };
  favoredLane: Lane;
  bonus: number;
  art: string;
};

export const LANES: Lane[] = ['trend', 'liquidity', 'risk'];

export const COMMANDERS: Record<CommanderId, {
  name: { zh: string; en: string };
  title: { zh: string; en: string };
  passive: { zh: string; en: string };
  faction: Faction;
  art: string;
  color: string;
}> = {
  bull: { name: { zh: '暴冲阿牛', en: 'Rex Bull' }, title: { zh: '趋势先锋', en: 'Trend Vanguard' }, passive: { zh: '每回合第一张趋势牌 +2 战力', en: 'First Trend card each round gains +2' }, faction: 'momentum', art: '/characters/bull-v2.jpg', color: '#e5ff00' },
  bear: { name: { zh: '冷面熊叔', en: 'Noir Bear' }, title: { zh: '逆向猎手', en: 'Contrarian Hunter' }, passive: { zh: '在风险战线落后时获得 +3 战力', en: 'Gain +3 while behind in Risk' }, faction: 'macro', art: '/characters/bear-v2.jpg', color: '#ff2b68' },
  whale: { name: { zh: '深蓝之眼', en: 'Whale Eye' }, title: { zh: '流动性操盘手', en: 'Liquidity Architect' }, passive: { zh: '流动性牌与万能牌组合额外 +2', en: 'Flow + Wild combos gain +2' }, faction: 'flow', art: '/characters/whale-v2.jpg', color: '#21d8ff' },
  risk: { name: { zh: '虚空戒律', en: 'Void Monk' }, title: { zh: '风险守卫', en: 'Risk Warden' }, passive: { zh: '每局第一次逆势裂隙额外 +2', en: 'First comeback Rift gains +2' }, faction: 'hedge', art: '/characters/risk-v2.jpg', color: '#a970ff' },
};

const art = {
  trend: '/game-art/event-trend-surge-v1.png',
  liquidity: '/game-art/event-liquidity-abyss-v1.png',
  risk: '/game-art/event-volatility-storm-v1.png',
  momentum: '/cards/momentum-v1.jpg',
  flow: '/cards/depth-v1.jpg',
  hedge: '/cards/risk-v1.jpg',
};

const rawCards: Array<[string, string, string, string, Faction, Lane | 'wild', 1 | 2, number, string[]]> = [
  ['breakout', '突破点火', 'Breakout Ignition', '趋势为正时额外 +2', 'momentum', 'trend', 2, 5, ['trend-up']],
  ['follow-through', '动量续航', 'Follow Through', '与另一张动量牌同出时 +3', 'momentum', 'trend', 1, 3, ['pair']],
  ['fomo-rush', '追涨狂潮', 'FOMO Rush', '高波动时 +3，但低波动时 -1', 'momentum', 'trend', 2, 6, ['volatile']],
  ['green-candle', '长阳贯日', 'Emerald Candle', '基础战力稳定', 'momentum', 'trend', 1, 4, []],
  ['squeeze', '空头挤压', 'Short Squeeze', '对手在趋势战线出牌时 +2', 'momentum', 'trend', 2, 4, ['contest']],
  ['second-wave', '第二浪', 'Second Wave', '第 4–5 回合 +3', 'momentum', 'wild', 1, 3, ['late']],
  ['conviction', '信念加仓', 'Conviction', '同战线两张牌时 +2', 'momentum', 'wild', 1, 2, ['stack']],
  ['price-discovery', '价格发现', 'Price Discovery', '市场趋势极端时 +3', 'momentum', 'trend', 2, 5, ['extreme']],
  ['rate-cut', '降息预期', 'Rate Cut Signal', '与趋势牌同出时双方 +2', 'macro', 'wild', 2, 3, ['bridge']],
  ['dollar-fade', '美元走弱', 'Dollar Fade', '宏观牌组合时 +3', 'macro', 'trend', 1, 2, ['pair']],
  ['risk-off', '避险切换', 'Risk-Off Rotation', '波动越高战力越强', 'macro', 'risk', 2, 4, ['volatile']],
  ['event-window', '事件窗口', 'Event Window', '第 3 回合 +4', 'macro', 'wild', 1, 2, ['round3']],
  ['narrative-shift', '叙事切换', 'Narrative Shift', '万能部署，不受战线惩罚', 'macro', 'wild', 2, 4, []],
  ['mean-revert', '均值回归', 'Mean Reversion', '趋势越极端越强', 'macro', 'risk', 1, 3, ['extreme']],
  ['bad-news-priced', '利空出尽', 'Bad News Priced In', '落后时 +3', 'macro', 'risk', 2, 4, ['comeback']],
  ['macro-ambush', '宏观伏击', 'Macro Ambush', '对手使用动量牌时 +3', 'macro', 'wild', 2, 3, ['counter-momentum']],
  ['bid-wall', '买墙筑城', 'Bid Wall', '流动性较强时 +3', 'flow', 'liquidity', 1, 3, ['liquid']],
  ['order-sweep', '扫单突袭', 'Order Sweep', '流动性较弱时 +3', 'flow', 'liquidity', 2, 5, ['thin']],
  ['absorption', '巨量吸收', 'Absorption', '对手同战线战力高时 +2', 'flow', 'liquidity', 2, 5, ['contest']],
  ['hidden-size', '冰山挂单', 'Iceberg Order', '与另一张流动性牌同出时 +3', 'flow', 'wild', 1, 2, ['pair']],
  ['spread-trap', '点差陷阱', 'Spread Trap', '高波动时 +2', 'flow', 'liquidity', 1, 4, ['volatile']],
  ['whale-print', '巨鲸足迹', 'Whale Print', '盘口偏斜明显时 +3', 'flow', 'wild', 2, 5, ['flow']],
  ['liquidity-vacuum', '流动性真空', 'Liquidity Vacuum', '本回合事件偏向流动性时 +3', 'flow', 'liquidity', 2, 5, ['event']],
  ['maker-rebate', '做市回响', 'Maker Echo', '低费用：同回合可轻松组合', 'flow', 'wild', 1, 3, []],
  ['stop-loss', '止损结界', 'Stop-Loss Ward', '落后时 +3', 'hedge', 'risk', 1, 3, ['comeback']],
  ['delta-shield', '德尔塔护盾', 'Delta Shield', '高波动时 +3', 'hedge', 'risk', 2, 5, ['volatile']],
  ['vol-crush', '波动坍缩', 'Volatility Crush', '低波动时 +3', 'hedge', 'risk', 1, 3, ['calm']],
  ['false-break', '假突破', 'False Break', '反制动量牌 +3', 'hedge', 'trend', 2, 4, ['counter-momentum']],
  ['circuit-breaker', '熔断裁决', 'Circuit Breaker', '第 5 回合 +4', 'hedge', 'risk', 2, 5, ['late']],
  ['position-sizing', '仓位纪律', 'Position Discipline', '稳定获得基础战力', 'hedge', 'wild', 1, 4, []],
  ['black-swan', '黑天鹅', 'Black Swan', '波动极高时 +5', 'hedge', 'risk', 2, 3, ['extreme-vol']],
  ['counter-trend', '逆势反击', 'Counter Trend', '比分落后时 +4', 'hedge', 'wild', 2, 3, ['comeback']],
];

export const CARDS: Card[] = rawCards.map(([id, zh, en, zhText, faction, lane, cost, power, tags]) => ({
  id,
  name: { zh, en },
  text: { zh: zhText, en: zhText },
  faction,
  lane,
  cost,
  power,
  tags,
  art: lane === 'trend' ? art.trend : lane === 'liquidity' ? art.liquidity : lane === 'risk' ? art.risk : faction === 'flow' ? art.flow : faction === 'hedge' ? art.hedge : art.momentum,
}));

export const CARD_MAP = new Map(CARDS.map((card) => [card.id, card]));

export const EVENTS: MarketEvent[] = [
  { id: 'trend-surge', name: { zh: '趋势爆发', en: 'Trend Surge' }, text: { zh: '趋势战线所有卡牌 +2', en: 'All Trend cards gain +2' }, favoredLane: 'trend', bonus: 2, art: art.trend },
  { id: 'liquidity-abyss', name: { zh: '流动性深渊', en: 'Liquidity Abyss' }, text: { zh: '流动性战线所有卡牌 +2', en: 'All Liquidity cards gain +2' }, favoredLane: 'liquidity', bonus: 2, art: art.liquidity },
  { id: 'volatility-storm', name: { zh: '波动风暴', en: 'Volatility Storm' }, text: { zh: '风险战线所有卡牌 +2', en: 'All Risk cards gain +2' }, favoredLane: 'risk', bonus: 2, art: art.risk },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const hash = (input: string) => [...input].reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 2166136261) >>> 0;

export function marketFromPayload(payload: MarketPayload): MarketClimate {
  const last = Number(payload.ticker.lastPrice);
  const high = Number(payload.ticker.highPrice);
  const low = Number(payload.ticker.lowPrice);
  const change = Number(payload.ticker.priceChangePercent);
  const bid = payload.depth.bidTotal;
  const ask = payload.depth.askTotal;
  return {
    symbol: payload.symbol,
    price: last,
    change,
    trend: clamp01((change + 6) / 12),
    volatility: clamp01(((high - low) / Math.max(low, 0.0000001)) / 0.12),
    liquidity: clamp01(Math.min(bid, ask) / Math.max(bid, ask, 0.0000001)),
    flow: clamp01(bid / Math.max(bid + ask, 0.0000001)),
    capturedAt: payload.capturedAt,
  };
}

export const fallbackClimate: MarketClimate = {
  symbol: 'BTCUSDT', price: 0, change: 0, trend: .5, volatility: .5, liquidity: .5, flow: .5, capturedAt: new Date(0).toISOString(),
};

function random(seed: number) {
  let next = seed || 1;
  return () => {
    next = (next * 1664525 + 1013904223) >>> 0;
    return next / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number) {
  const result = [...items];
  const rand = random(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function starterDeck(commander: CommanderId, seed: number) {
  const faction = COMMANDERS[commander].faction;
  const primary = CARDS.filter((card) => card.faction === faction).map((card) => card.id);
  const support = CARDS.filter((card) => card.faction !== faction).map((card) => card.id);
  return [...shuffled(primary, seed).slice(0, 8), ...shuffled(support, seed + 31).slice(0, 10)];
}

function makePlayer(name: string, commander: CommanderId, seed: number): Player {
  const cards = shuffled(starterDeck(commander, seed), seed + 7);
  return { name, commander, hand: cards.slice(0, 5), deck: cards.slice(5), points: 0, laneWins: { trend: 0, liquidity: 0, risk: 0 }, riftReady: false, riftUsed: false };
}

export function createGame(climate: MarketClimate, commander: CommanderId, rivalCommander: CommanderId = 'bear'): GameState {
  const seed = hash(`${climate.symbol}:${climate.capturedAt}:${commander}`);
  return { seed, round: 1, climate, player: makePlayer('YOU', commander, seed), rival: makePlayer('NEXUS AI', rivalCommander, seed + 93), history: [] };
}

export function eventForRound(state: GameState): MarketEvent {
  if (state.round === 1) return state.climate.trend >= .55 ? EVENTS[0] : state.climate.volatility >= .55 ? EVENTS[2] : EVENTS[1];
  const weights = [state.climate.trend + .2, 1 - state.climate.liquidity + .25, state.climate.volatility + .2];
  const roll = random(state.seed + state.round * 101)() * weights.reduce((a, b) => a + b, 0);
  let cursor = 0;
  return EVENTS.find((_, index) => (cursor += weights[index]) >= roll) ?? EVENTS[2];
}

function cardPower(card: Card, lane: Lane, state: GameState, event: MarketEvent, owner: Player, opponent: Player, deployments: Deployment[]) {
  let power = card.power;
  const climate = state.climate;
  if (card.lane !== 'wild' && card.lane !== lane) power -= 2;
  if (event.favoredLane === lane) power += event.bonus;
  if (card.tags.includes('trend-up') && climate.trend > .55) power += 2;
  if (card.tags.includes('volatile')) power += climate.volatility > .55 ? 3 : -1;
  if (card.tags.includes('calm') && climate.volatility <= .55) power += 3;
  if (card.tags.includes('extreme-vol') && climate.volatility > .78) power += 5;
  if (card.tags.includes('liquid') && climate.liquidity > .6) power += 3;
  if (card.tags.includes('thin') && climate.liquidity < .55) power += 3;
  if (card.tags.includes('flow') && Math.abs(climate.flow - .5) > .12) power += 3;
  if (card.tags.includes('late') && state.round >= 4) power += 3;
  if (card.tags.includes('round3') && state.round === 3) power += 4;
  if (card.tags.includes('extreme') && (climate.trend > .75 || climate.trend < .25)) power += 3;
  if (card.tags.includes('comeback') && owner.points < opponent.points) power += card.id === 'counter-trend' ? 4 : 3;
  if (card.tags.includes('event') && event.favoredLane === lane) power += 3;
  if (card.tags.includes('stack') && deployments.filter((item) => item.lane === lane).length > 1) power += 2;
  return Math.max(0, power);
}

function commanderBonus(commander: CommanderId, lane: Lane, cards: Card[], behind: boolean, usedRift: boolean) {
  if (commander === 'bull' && lane === 'trend' && cards.length) return 2;
  if (commander === 'bear' && lane === 'risk' && behind) return 3;
  if (commander === 'whale' && cards.some((card) => card.faction === 'flow') && cards.some((card) => card.lane === 'wild')) return 2;
  if (commander === 'risk' && usedRift) return 2;
  return 0;
}

function comboBonus(cards: Card[]) {
  if (cards.length < 2) return { power: 0 };
  if (cards[0].faction === cards[1].faction) return { power: 3, name: `${cards[0].faction.toUpperCase()} CHAIN` };
  if (cards.some((card) => card.tags.includes('bridge'))) return { power: 2, name: 'CROSS-MARKET LINK' };
  return { power: 0 };
}

export function validDeployment(player: Player, moves: Deployment[]) {
  if (moves.length > 2) return false;
  const ids = new Set<string>();
  let cost = 0;
  for (const move of moves) {
    if (ids.has(move.cardId) || !player.hand.includes(move.cardId) || !LANES.includes(move.lane)) return false;
    ids.add(move.cardId);
    cost += CARD_MAP.get(move.cardId)?.cost ?? 99;
  }
  return cost <= 3;
}

export function chooseAiMoves(state: GameState, difficulty: 'rookie' | 'tactician' | 'oracle' = 'tactician') {
  const event = eventForRound(state);
  const options: Deployment[] = [];
  for (const id of state.rival.hand) {
    const card = CARD_MAP.get(id)!;
    const lanes = card.lane === 'wild' ? LANES : [card.lane];
    for (const lane of lanes) options.push({ cardId: id, lane });
  }
  const score = (move: Deployment) => {
    const card = CARD_MAP.get(move.cardId)!;
    let value = cardPower(card, move.lane, state, event, state.rival, state.player, [move]);
    if (difficulty === 'rookie') value += random(state.seed + state.round + hash(move.cardId))() * 7;
    if (difficulty === 'oracle' && event.favoredLane === move.lane) value += 2;
    return value;
  };
  options.sort((a, b) => score(b) - score(a));
  const first = options[0];
  if (!first) return [];
  const firstCard = CARD_MAP.get(first.cardId)!;
  const second = options.find((move) => move.cardId !== first.cardId && (CARD_MAP.get(move.cardId)!.cost + firstCard.cost <= 3));
  return second ? [first, second] : [first];
}

export function resolveRound(state: GameState, playerMoves: Deployment[], rivalMoves: Deployment[], playerRift = false): GameState {
  if (!validDeployment(state.player, playerMoves) || !validDeployment(state.rival, rivalMoves)) throw new Error('INVALID_DEPLOYMENT');
  const event = eventForRound(state);
  const playerCombo = comboBonus(playerMoves.map((move) => CARD_MAP.get(move.cardId)!));
  const rivalCombo = comboBonus(rivalMoves.map((move) => CARD_MAP.get(move.cardId)!));
  const canRift = playerRift && state.player.riftReady && !state.player.riftUsed;
  const weakestLane = [...LANES].sort((a, b) => state.player.laneWins[a] - state.player.laneWins[b])[0];
  const lanes: LaneResult[] = LANES.map((lane) => {
    const pCards = playerMoves.filter((move) => move.lane === lane).map((move) => CARD_MAP.get(move.cardId)!);
    const rCards = rivalMoves.filter((move) => move.lane === lane).map((move) => CARD_MAP.get(move.cardId)!);
    let playerPower = pCards.reduce((sum, card) => sum + cardPower(card, lane, state, event, state.player, state.rival, playerMoves), 0);
    let rivalPower = rCards.reduce((sum, card) => sum + cardPower(card, lane, state, event, state.rival, state.player, rivalMoves), 0);
    if (pCards.length) playerPower += playerCombo.power + commanderBonus(state.player.commander, lane, pCards, state.player.points < state.rival.points, canRift);
    if (rCards.length) rivalPower += rivalCombo.power + commanderBonus(state.rival.commander, lane, rCards, state.rival.points < state.player.points, false);
    if (canRift && lane === weakestLane) playerPower += 4;
    const winner = playerPower === rivalPower ? 'tie' : playerPower > rivalPower ? 'player' : 'rival';
    return { lane, playerPower, rivalPower, winner, playerCards: pCards.map((card) => card.id), rivalCards: rCards.map((card) => card.id) };
  });
  const playerRoundPoints = lanes.filter((lane) => lane.winner === 'player').length;
  const rivalRoundPoints = lanes.filter((lane) => lane.winner === 'rival').length;
  const usedPlayerIds = new Set(playerMoves.map((move) => move.cardId));
  const usedRivalIds = new Set(rivalMoves.map((move) => move.cardId));
  const draw = (player: Player, used: Set<string>, points: number, side: 'player' | 'rival'): Player => {
    const remaining = player.hand.filter((id) => !used.has(id));
    const drawCount = Math.min(state.round === 3 ? 2 : 1, player.deck.length);
    const nextPoints = player.points + points;
    return {
      ...player,
      hand: [...remaining, ...player.deck.slice(0, drawCount)],
      deck: player.deck.slice(drawCount),
      points: nextPoints,
      riftReady: side === 'player' ? nextPoints + 2 <= state.rival.points + rivalRoundPoints : player.riftReady,
      riftUsed: side === 'player' ? player.riftUsed || canRift : player.riftUsed,
      laneWins: LANES.reduce((acc, lane) => ({ ...acc, [lane]: player.laneWins[lane] + (lanes.find((result) => result.lane === lane)?.winner === side ? 1 : 0) }), player.laneWins),
    };
  };
  const player = draw(state.player, usedPlayerIds, playerRoundPoints, 'player');
  const rival = draw(state.rival, usedRivalIds, rivalRoundPoints, 'rival');
  const finished = state.round >= 5;
  return {
    ...state,
    round: finished ? state.round : state.round + 1,
    player,
    rival,
    history: [...state.history, { round: state.round, event, lanes, playerCombo: playerCombo.name, rivalCombo: rivalCombo.name }],
    winner: finished ? (player.points === rival.points ? 'draw' : player.points > rival.points ? 'player' : 'rival') : undefined,
  };
}
