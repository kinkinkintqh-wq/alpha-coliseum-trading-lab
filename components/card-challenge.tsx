'use client';
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import { ChevronRight, Flame, Gamepad2, RefreshCw, Shield, Sparkles, Target, Zap } from 'lucide-react';

import { type ArenaResult, type FighterId } from '@/lib/arena-result';

type Lang = 'zh' | 'en';
type CardKind = 'momentum' | 'depth' | 'volume' | 'range' | 'risk' | 'counter';
type GameCard = { id: string; kind: CardKind; nameZh: string; nameEn: string; value: string; power: number; rarity: 'R' | 'SR' | 'SSR'; image: string; owner: FighterId };
type PlayedCard = GameCard & { target: FighterId; bonus: number; response: 'insist' | 'verify' | 'pivot' };

const fighters: Array<{ id: FighterId; zh: string; en: string; image: string; accent: string }> = [
  { id: 'bull', zh: '多头猛将', en: 'THE BULL', image: '/characters/bull-v2.jpg', accent: '#dfff00' },
  { id: 'bear', zh: '空头拆解师', en: 'THE BEAR', image: '/characters/bear-v2.jpg', accent: '#ff2b68' },
  { id: 'whale', zh: '巨鲸侦探', en: 'WHALE EYE', image: '/characters/whale-v2.jpg', accent: '#21d8ff' },
  { id: 'risk', zh: '风险刺客', en: 'VOID MONK', image: '/characters/risk-v2.jpg', accent: '#a970ff' },
];

const compatibility: Record<CardKind, FighterId> = {
  momentum: 'bull', depth: 'whale', volume: 'whale', range: 'bear', risk: 'risk', counter: 'bear',
};

function makeDeck(result: ArenaResult): GameCard[] {
  const byId = (id: FighterId) => result.fighters.find((fighter) => fighter.id === id)!;
  const fact = (index: number) => result.facts[index]?.value ?? '—';
  return [
    { id: 'momentum', kind: 'momentum', nameZh: '雷霆动量', nameEn: 'THUNDER MOMENTUM', value: byId('bull').evidence[0], power: Math.max(5, Math.round(byId('bull').score / 7)), rarity: byId('bull').score > 68 ? 'SSR' : 'SR', image: '/cards/momentum-v1.jpg', owner: 'bull' },
    { id: 'depth', kind: 'depth', nameZh: '深海盘口', nameEn: 'ABYSSAL DEPTH', value: byId('whale').evidence[0], power: Math.max(5, Math.round(byId('whale').score / 7)), rarity: byId('whale').score > 68 ? 'SSR' : 'SR', image: '/cards/depth-v1.jpg', owner: 'whale' },
    { id: 'volume', kind: 'volume', nameZh: '巨量回响', nameEn: 'VOLUME ECHO', value: fact(4), power: Math.max(6, Math.round(byId('whale').score / 8)), rarity: 'SR', image: '/cards/depth-v1.jpg', owner: 'whale' },
    { id: 'range', kind: 'range', nameZh: '区间牢笼', nameEn: 'RANGE PRISON', value: fact(2), power: Math.max(5, Math.round(byId('bear').score / 7)), rarity: byId('bear').score > 68 ? 'SSR' : 'R', image: '/cards/risk-v1.jpg', owner: 'bear' },
    { id: 'risk', kind: 'risk', nameZh: '风险结界', nameEn: 'RISK BARRIER', value: byId('risk').evidence[0], power: Math.max(5, Math.round(byId('risk').score / 7)), rarity: byId('risk').score > 68 ? 'SSR' : 'SR', image: '/cards/risk-v1.jpg', owner: 'risk' },
    { id: 'counter', kind: 'counter', nameZh: '反方证词', nameEn: 'COUNTER PROOF', value: byId('bear').counterpoint, power: Math.max(5, Math.round(byId('bear').score / 8)), rarity: 'R', image: '/cards/momentum-v1.jpg', owner: 'bear' },
  ];
}

function arenaEnvironment(result: ArenaResult, lang: Lang) {
  const bull = result.fighters.find((fighter) => fighter.id === 'bull')!.score;
  const bear = result.fighters.find((fighter) => fighter.id === 'bear')!.score;
  const whale = result.fighters.find((fighter) => fighter.id === 'whale')!.score;
  const risk = result.fighters.find((fighter) => fighter.id === 'risk')!.score;
  if (risk >= 68) return lang === 'zh' ? ['狂暴市场', '风险牌威力 +3，判断错误的代价更高'] : ['RAGING MARKET', 'Risk cards gain +3 power'];
  if (whale >= 65) return lang === 'zh' ? ['深海市场', '盘口与成交量卡获得额外共鸣'] : ['DEEP SEA MARKET', 'Depth and volume cards resonate'];
  if (Math.abs(bull - bear) < 8) return lang === 'zh' ? ['迷雾市场', '多空证据接近，连招分数翻倍'] : ['FOG MARKET', 'Bull and bear evidence are close'];
  return lang === 'zh' ? ['高台决斗', '最强证据角色获得额外加成'] : ['HIGH GROUND DUEL', 'The strongest fighter gains a bonus'];
}

export function CardChallenge({ result, lang, aliases }: { result: ArenaResult | null; lang: Lang; aliases: Record<FighterId, string> }) {
  const [mode, setMode] = useState<'watch' | 'cards'>('watch');
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState<FighterId | null>(null);
  const [pending, setPending] = useState<{ card: GameCard; target: FighterId; bonus: number } | null>(null);
  const [played, setPlayed] = useState<PlayedCard[]>([]);
  const [focus, setFocus] = useState(2);
  const deck = useMemo(() => result ? makeDeck(result) : [], [result]);
  const environment = result ? arenaEnvironment(result, lang) : null;
  const round = Math.min(played.length + 1, 3);
  const finished = played.length === 3;
  const available = deck.filter((card) => !played.some((used) => used.id === card.id));
  const selectedCard = available.find((card) => card.id === selected) ?? null;
  const combo = useMemo(() => {
    const kinds = new Set(played.map((card) => card.kind));
    if (kinds.has('momentum') && kinds.has('volume')) return lang === 'zh' ? '量价共振' : 'PRICE × VOLUME';
    if (kinds.has('depth') && kinds.has('risk')) return lang === 'zh' ? '深海结界' : 'ABYSS BARRIER';
    if (kinds.has('momentum') && kinds.has('risk')) return lang === 'zh' ? '钢索冲锋' : 'TIGHTROPE RUSH';
    if (kinds.has('range') && kinds.has('counter')) return lang === 'zh' ? '证据包围' : 'EVIDENCE LOCK';
    return null;
  }, [lang, played]);
  const total = played.reduce((sum, card) => sum + card.power + card.bonus + (card.response === 'verify' ? 5 : card.response === 'insist' ? 3 : 1), 0) + (combo ? 12 : 0);
  const grade = total >= 58 ? 'S' : total >= 48 ? 'A' : total >= 38 ? 'B' : total >= 28 ? 'C' : 'F';

  function stageCard() {
    if (!selectedCard || !target || finished) return;
    const specialist = compatibility[selectedCard.kind] === target;
    const personaBonus = selectedCard.owner === target ? 4 : 0;
    const environmentBonus = environment?.[0].includes(lang === 'zh' ? '深海' : 'DEEP') && ['depth', 'volume'].includes(selectedCard.kind) ? 3 : 0;
    setPending({ card: selectedCard, target, bonus: (specialist ? 5 : -2) + personaBonus + environmentBonus });
  }

  function resolve(response: PlayedCard['response']) {
    if (!pending || (response === 'verify' && focus === 0)) return;
    if (response === 'verify') setFocus((value) => value - 1);
    setPlayed((cards) => [...cards, { ...pending.card, target: pending.target, bonus: pending.bonus, response }]);
    setPending(null); setSelected(null); setTarget(null);
  }

  function reset() { setSelected(null); setTarget(null); setPending(null); setPlayed([]); setFocus(2); }

  const t = lang === 'zh' ? {
    watch: '观战模式', cards: '卡牌挑战', title: '实时行情卡牌战', intro: '六张牌来自同一份 Binance 行情；每局只能打三张。选牌、指定角色，再回应对手质疑。', noData: '先同步一个交易对，实时牌组才会入场。', hand: '本局手牌', pick: '① 选一张行情牌', fighter: '② 选择出牌角色', deploy: '发动卡牌', round: `第 ${round} / 3 回合`, focus: `复核点 ${focus}/2`, best: '擅长', challenge: '对手发动质疑', insist: '坚持证据 · 威力 +3', verify: '交叉复核 · 可信度 +5', pivot: '承认局限 · 稳定 +1', result: '本局结算', score: '证据指挥分', restart: '再来一局', combo: '连招发动', verdict: '实时市场裁决', disclaimer: '行情数值来自 Binance；卡牌威力、稀有度与段位属于游戏机制，不构成投资建议。',
  } : {
    watch: 'WATCH MODE', cards: 'CARD CHALLENGE', title: 'REAL-TIME MARKET DECK', intro: 'Six cards come from the same Binance snapshot. Play only three: choose a card, assign a fighter, then answer the counterattack.', noData: 'Sync a market pair before the live deck can enter.', hand: 'YOUR HAND', pick: '① PICK A MARKET CARD', fighter: '② ASSIGN A FIGHTER', deploy: 'PLAY CARD', round: `ROUND ${round} / 3`, focus: `VERIFY ${focus}/2`, best: 'BEST', challenge: 'COUNTERATTACK', insist: 'Insist · Power +3', verify: 'Cross-check · Trust +5', pivot: 'Admit limits · Stability +1', result: 'MATCH RESULT', score: 'EVIDENCE COMMAND', restart: 'PLAY AGAIN', combo: 'COMBO', verdict: 'LIVE MARKET VERDICT', disclaimer: 'Market values come from Binance. Card power, rarity, and rank are game mechanics—not investment advice.',
  };

  return <section className="card-mode" id="market-deck">
    <div className="mode-switch"><button className={mode === 'watch' ? 'active' : ''} onClick={() => setMode('watch')}><Target />{t.watch}</button><button className={mode === 'cards' ? 'active' : ''} onClick={() => setMode('cards')}><Gamepad2 />{t.cards}<i>NEW</i></button></div>
    {mode === 'watch' ? <div className="mode-preview"><div><small>OPTIONAL GAME MODE</small><h2>{t.title}</h2><p>{t.intro}</p></div><button onClick={() => setMode('cards')}>{t.cards}<ChevronRight /></button></div> : !result ? <div className="deck-empty"><RefreshCw /><p>{t.noData}</p></div> : <div className="deck-game">
      <header className="deck-game-head"><div><small>MARKET DECK · {result.pair}</small><h2>{t.title}</h2><p>{t.intro}</p></div><div className="arena-condition"><Flame /><span>{environment?.[0]}</span><small>{environment?.[1]}</small></div></header>
      <div className="game-hud"><b>{finished ? t.result : t.round}</b><span><Zap />{t.focus}</span><i>{played.map((_, index) => <em key={index} />)}{Array.from({ length: 3 - played.length }).map((_, index) => <em className="empty" key={`e-${index}`} />)}</i></div>
      {!finished ? <>
        <div className="deck-label"><span>{t.hand}</span><b>{t.pick}</b></div>
        <div className="market-hand">{available.map((card) => <button key={card.id} className={`market-card ${selected === card.id ? 'selected' : ''}`} onClick={() => { setSelected(card.id); setTarget(null); }}>
          <img src={card.image} alt="" /><div className="market-card-shade" /><span className={`rarity rarity-${card.rarity.toLowerCase()}`}>{card.rarity}</span><small>{card.kind.toUpperCase()}</small><strong>{lang === 'zh' ? card.nameZh : card.nameEn}</strong><p>{card.value}</p><b>POWER {card.power}</b>
        </button>)}</div>
        {selectedCard ? <div className="fighter-pick"><b>{t.fighter}</b><div>{fighters.map((fighter) => <button key={fighter.id} className={target === fighter.id ? 'selected' : ''} onClick={() => setTarget(fighter.id)} style={{ '--fighter-accent': fighter.accent } as React.CSSProperties}><img src={fighter.image} alt="" /><span>{lang === 'zh' ? fighter.zh : fighter.en}<small>“{aliases[fighter.id]}”</small></span>{compatibility[selectedCard.kind] === fighter.id ? <em>{t.best} +9</em> : null}</button>)}</div><button className="deploy-card" disabled={!target} onClick={stageCard}><Sparkles />{t.deploy}<ChevronRight /></button></div> : null}
      </> : <div className="game-result"><div className="rank-burst"><small>RANK</small><b>{grade}</b></div><div><small>{t.score}</small><strong>{total}</strong><p>{combo ? `${t.combo}：${combo} +12` : lang === 'zh' ? '本局未触发连招' : 'No combo triggered'}</p></div><div><small>{t.verdict}</small><strong>{result.verdict}</strong><p>{result.largest_risk}</p></div><button onClick={reset}><RefreshCw />{t.restart}</button></div>}
      {pending ? <div className="card-counter"><div className="counter-avatar"><img src="/characters/bear-v2.jpg" alt="" /></div><div><small>{t.challenge}</small><strong>{pending.card.kind === 'depth' ? result.fighters.find((fighter) => fighter.id === 'whale')?.counterpoint : result.fighters.find((fighter) => fighter.id === 'bear')?.counterpoint}</strong><p>{lang === 'zh' ? '你的回应会改变本局得分，但不会改变真实行情。' : 'Your response changes the game score—not the market data.'}</p></div><div><button onClick={() => resolve('insist')}>{t.insist}</button><button disabled={focus === 0} onClick={() => resolve('verify')}>{t.verify}</button><button onClick={() => resolve('pivot')}>{t.pivot}</button></div></div> : null}
      {combo && !finished ? <div className="combo-toast"><Sparkles /><span>{t.combo}</span><b>{combo}</b></div> : null}
      <p className="deck-disclaimer"><Shield />{t.disclaimer}</p>
    </div>}
  </section>;
}
