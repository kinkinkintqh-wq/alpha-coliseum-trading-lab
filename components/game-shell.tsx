'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import { Bot, ChevronRight, CircleHelp, Gamepad2, Languages, Music2, Radio, RotateCcw, Shield, Sparkles, Swords, Users, Volume2, Zap } from 'lucide-react';

import { useArenaAudio } from '@/hooks/use-arena-audio';
import { CARD_MAP, COMMANDERS, createGame, chooseAiMoves, eventForRound, fallbackClimate, LANES, marketFromPayload, resolveRound, validDeployment, type CommanderId, type Deployment, type GameState, type Lane, type Lang, type MarketPayload, type RoundResult } from '@/lib/game';

type Difficulty = 'rookie' | 'tactician' | 'oracle';
type Screen = 'home' | 'battle' | 'online';

const text = {
  zh: {
    eyebrow: '真实行情驱动的战术卡牌游戏', titleA: '行情会变。', titleB: '你的谋略也要变。',
    lead: '选择指挥官，用两张牌撬动三条战线。真实市场数据只改变战场环境，不涉及下注、下单或真实资产。',
    solo: '单人挑战', soloSub: '对战战术电脑 · 约 5 分钟', online: '在线房间', onlineSub: '2–4 人同步对战', rules: '30 秒规则',
    choose: '选择指挥官', market: '战场行情', difficulty: '电脑强度', start: '进入行情裂隙', loading: '正在捕获真实行情…',
    live: 'LIVE 行情快照', round: '回合', score: '影响力', energy: '行动力', hand: '你的手牌', deploy: '已部署', commit: '锁定并揭牌',
    pick: '先选择一张牌，再点击战线部署', selected: '已选择', next: '下一回合', again: '再战一局', home: '返回大厅',
    trend: '趋势', liquidity: '流动性', risk: '风险', player: '你', rival: 'NEXUS 电脑', victory: '你掌控了行情裂隙', defeat: 'NEXUS 抢先完成布局', draw: '势均力敌',
    rift: '发动逆势裂隙', riftHint: '落后 2 分时解锁，每局一次：最弱战线获得爆发增益。', result: '本回合结算', combo: '组合触发', noCombo: '未触发组合',
    ruleLines: ['每回合获得 3 点行动力，最多打出 2 张牌。', '把牌部署到趋势、流动性或风险战线。', '双方同时揭牌，战力更高者获得 1 点影响力。', '5 回合结束时，影响力最高者获胜。'],
    roomTitle: '在线竞技场', roomLead: '在线房间将使用服务端权威结算：对手看不到你的手牌，掉线后可以重连。', create: '创建房间', join: '加入房间', roomCode: '输入 6 位房间码', back: '返回', building: '联机服务正在接入本独立项目，不影响现有参赛站。',
    marketError: '实时行情暂不可用，本局改用中性训练环境。',
  },
  en: {
    eyebrow: 'TACTICAL CARD GAME POWERED BY LIVE MARKETS', titleA: 'Markets shift.', titleB: 'So must your strategy.',
    lead: 'Choose a commander and use two cards to bend three fronts. Live data changes the arena only—no betting, orders, or real assets.',
    solo: 'Solo Challenge', soloSub: 'Fight the tactical AI · about 5 min', online: 'Online Room', onlineSub: '2–4 player battles', rules: '30-sec rules',
    choose: 'Choose a commander', market: 'Market arena', difficulty: 'AI level', start: 'Enter the Market Rift', loading: 'Capturing live market…',
    live: 'LIVE MARKET SNAPSHOT', round: 'ROUND', score: 'INFLUENCE', energy: 'ENERGY', hand: 'YOUR HAND', deploy: 'DEPLOYED', commit: 'LOCK & REVEAL',
    pick: 'Pick a card, then deploy it to a front', selected: 'SELECTED', next: 'NEXT ROUND', again: 'PLAY AGAIN', home: 'LOBBY',
    trend: 'TREND', liquidity: 'LIQUIDITY', risk: 'RISK', player: 'YOU', rival: 'NEXUS AI', victory: 'You control the Market Rift', defeat: 'NEXUS completed its plan', draw: 'Perfect deadlock',
    rift: 'ACTIVATE COMEBACK RIFT', riftHint: 'Unlocks when 2 points behind. Once per match: empower your weakest front.', result: 'ROUND RESULT', combo: 'COMBO', noCombo: 'NO COMBO',
    ruleLines: ['Gain 3 energy and play up to 2 cards each round.', 'Deploy cards to Trend, Liquidity, or Risk.', 'Both sides reveal together; higher power gains 1 Influence.', 'Highest Influence after 5 rounds wins.'],
    roomTitle: 'ONLINE ARENA', roomLead: 'Authoritative server resolution keeps hands secret and supports reconnects.', create: 'CREATE ROOM', join: 'JOIN ROOM', roomCode: 'ENTER 6-DIGIT CODE', back: 'BACK', building: 'Online service is being wired into this isolated project. The contest site stays untouched.',
    marketError: 'Live data is unavailable. Using a neutral training climate for this match.',
  },
} as const;

const laneIcon: Record<Lane, string> = { trend: '↗', liquidity: '≋', risk: '◇' };

function formatPrice(value: number) {
  if (!value) return 'TRAINING';
  return value < 1 ? value.toFixed(6) : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function GameShell() {
  const [lang, setLang] = useState<Lang>('zh');
  const [screen, setScreen] = useState<Screen>('home');
  const [commander, setCommander] = useState<CommanderId>('bull');
  const [symbol, setSymbol] = useState('BTC');
  const [difficulty, setDifficulty] = useState<Difficulty>('tactician');
  const [game, setGame] = useState<GameState | null>(null);
  const [moves, setMoves] = useState<Deployment[]>([]);
  const [pendingCard, setPendingCard] = useState<string | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketWarning, setMarketWarning] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [useRift, setUseRift] = useState(false);
  const c = text[lang];
  const audio = useArenaAudio(game ? game.round : 0);
  const energyUsed = moves.reduce((sum, move) => sum + (CARD_MAP.get(move.cardId)?.cost ?? 0), 0);
  const currentEvent = game ? eventForRound(game) : null;

  async function startSolo() {
    setLoading(true);
    setMarketWarning('');
    const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'BTC';
    setSymbol(clean);
    let climate = fallbackClimate;
    try {
      const response = await fetch(`/api/market?symbol=${clean}USDT`, { cache: 'no-store' });
      if (!response.ok) throw new Error('market');
      climate = marketFromPayload(await response.json() as MarketPayload);
    } catch {
      setMarketWarning(c.marketError);
      climate = { ...fallbackClimate, symbol: `${clean}USDT`, capturedAt: new Date().toISOString() };
    }
    const rivals = (['bear', 'whale', 'risk'] as CommanderId[]).filter((id) => id !== commander);
    setGame(createGame(climate, commander, rivals[Math.floor(Math.random() * rivals.length)]));
    setMoves([]);
    setRoundResult(null);
    setScreen('battle');
    setLoading(false);
  }

  function selectCard(cardId: string) {
    if (moves.some((move) => move.cardId === cardId)) {
      setMoves((current) => current.filter((move) => move.cardId !== cardId));
      setPendingCard(null);
      audio.strike('card');
      return;
    }
    setPendingCard((current) => current === cardId ? null : cardId);
    audio.strike('card');
  }

  function deploy(lane: Lane) {
    if (!game || !pendingCard || moves.length >= 2) return;
    const next = [...moves, { cardId: pendingCard, lane }];
    if (!validDeployment(game.player, next)) return;
    setMoves(next);
    setPendingCard(null);
    audio.strike('card');
  }

  function reveal() {
    if (!game || !moves.length) return;
    const next = resolveRound(game, moves, chooseAiMoves(game, difficulty), useRift);
    setGame(next);
    setRoundResult(next.history[next.history.length - 1]);
    setMoves([]);
    setPendingCard(null);
    setUseRift(false);
    audio.strike(next.winner === 'player' ? 'victory' : 'reveal');
  }

  function resetToLobby() {
    setGame(null);
    setMoves([]);
    setRoundResult(null);
    setScreen('home');
  }

  return (
    <main className="rift-app">
      <div className="rift-noise" />
      <header className="rift-header">
        <button className="rift-brand" onClick={resetToLobby} aria-label="Alpha Coliseum">
          <span><Swords /></span><b>ALPHA COLOSSEUM</b><small>MARKET RIFT</small>
        </button>
        <div className="rift-header-actions">
          <span className="rift-live"><i /> MARKET ENGINE</span>
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}><Languages />{lang === 'zh' ? 'EN' : '中文'}</button>
          <button className={audio.enabled ? 'is-on' : ''} onClick={audio.toggle}>{audio.enabled ? <Volume2 /> : <Music2 />}{audio.enabled ? 'ON' : 'OFF'}</button>
        </div>
      </header>

      {screen === 'home' && (
        <section className="rift-home">
          <div className="rift-hero-art"><img src="/game-art/market-rift-keyart-v1.png" alt="Market Rift arena" /><div /></div>
          <div className="rift-hero-copy">
            <p className="rift-kicker"><Radio /> {c.eyebrow}</p>
            <h1>{c.titleA}<br/><em>{c.titleB}</em></h1>
            <p>{c.lead}</p>
            <div className="rift-mode-row">
              <button className="rift-mode primary" onClick={() => document.getElementById('loadout')?.scrollIntoView({ behavior: 'smooth' })}><Bot /><span><b>{c.solo}</b><small>{c.soloSub}</small></span><ChevronRight /></button>
              <button className="rift-mode" onClick={() => setScreen('online')}><Users /><span><b>{c.online}</b><small>{c.onlineSub}</small></span><ChevronRight /></button>
              <button className="rift-rule-button" onClick={() => setShowRules(!showRules)}><CircleHelp />{c.rules}</button>
            </div>
            {showRules && <div className="rift-rules">{c.ruleLines.map((line, index) => <p key={line}><b>0{index + 1}</b>{line}</p>)}</div>}
          </div>
          <div id="loadout" className="rift-loadout">
            <div className="rift-section-title"><small>01 / COMMANDER</small><h2>{c.choose}</h2></div>
            <div className="rift-commanders">
              {(Object.keys(COMMANDERS) as CommanderId[]).map((id) => {
                const hero = COMMANDERS[id];
                return <button key={id} className={commander === id ? 'active' : ''} style={{ '--accent': hero.color } as React.CSSProperties} onClick={() => setCommander(id)}>
                  <img src={hero.art} alt={hero.name[lang]} /><span><small>{hero.title[lang]}</small><b>{hero.name[lang]}</b><em>{hero.passive[lang]}</em></span>
                </button>;
              })}
            </div>
            <div className="rift-start-panel">
              <label><span>{c.market}</span><div><input value={symbol} maxLength={10} onChange={(event) => setSymbol(event.target.value.toUpperCase())}/><b>/ USDT</b></div></label>
              <label><span>{c.difficulty}</span><div className="rift-difficulty">{(['rookie','tactician','oracle'] as Difficulty[]).map((level) => <button key={level} className={difficulty === level ? 'active' : ''} onClick={() => setDifficulty(level)}>{level.toUpperCase()}</button>)}</div></label>
              <button className="rift-start" disabled={loading} onClick={() => { if (!audio.enabled) audio.toggle(); void startSolo(); }}><Zap />{loading ? c.loading : c.start}</button>
            </div>
            {marketWarning && <p className="rift-warning">{marketWarning}</p>}
          </div>
        </section>
      )}

      {screen === 'online' && (
        <section className="rift-online">
          <div><small>NETWORK / ARENA</small><h1>{c.roomTitle}</h1><p>{c.roomLead}</p></div>
          <div className="rift-room-actions"><button><Users />{c.create}</button><label><input placeholder={c.roomCode}/><button>{c.join}</button></label></div>
          <p className="rift-building"><Radio />{c.building}</p>
          <button className="rift-back" onClick={() => setScreen('home')}>{c.back}</button>
        </section>
      )}

      {screen === 'battle' && game && currentEvent && (
        <section className="rift-battle">
          <div className="rift-marketbar"><span><i />{c.live}</span><b>{game.climate.symbol}</b><strong>{formatPrice(game.climate.price)}</strong><em className={game.climate.change >= 0 ? 'up' : 'down'}>{game.climate.change >= 0 ? '+' : ''}{game.climate.change.toFixed(2)}%</em><small>{c.round} {game.round}/5</small></div>
          <div className="rift-scoreboard"><PlayerBadge side="rival" game={game} lang={lang} /><div className="rift-score"><b>{game.player.points}</b><span>{c.score}</span><b>{game.rival.points}</b></div><PlayerBadge side="player" game={game} lang={lang} /></div>
          <div className="rift-event" style={{ backgroundImage: `linear-gradient(90deg,rgba(5,6,8,.98),rgba(5,6,8,.55)),url(${currentEvent.art})` }}><Sparkles /><span><small>MARKET EVENT / GAME</small><b>{currentEvent.name[lang]}</b><em>{currentEvent.text[lang]}</em></span></div>
          <div className="rift-board">
            {LANES.map((lane) => {
              const latest = roundResult?.lanes.find((item) => item.lane === lane);
              const deployed = moves.filter((move) => move.lane === lane);
              return <button key={lane} className={`rift-lane ${pendingCard ? 'can-deploy' : ''} ${latest?.winner ?? ''}`} onClick={() => deploy(lane)}>
                <div className="rift-lane-title"><span>{laneIcon[lane]}</span><b>{c[lane]}</b><small>{currentEvent.favoredLane === lane ? '+2 EVENT' : 'NEUTRAL'}</small></div>
                <div className="rift-lane-score"><b>{latest?.rivalPower ?? '—'}</b><i>VS</i><b>{latest?.playerPower ?? '—'}</b></div>
                <div className="rift-slots">{[0,1].map((slot) => { const card = deployed[slot] ? CARD_MAP.get(deployed[slot].cardId) : null; return <span key={slot} className={card ? 'filled' : ''}>{card ? card.name[lang] : '+'}</span>; })}</div>
              </button>;
            })}
          </div>
          <div className="rift-actionbar">
            <div><small>{c.deploy}</small><b>{moves.length}/2</b><small>{c.energy}</small><b>{energyUsed}/3</b></div>
            <p>{pendingCard ? `${c.selected}: ${CARD_MAP.get(pendingCard)?.name[lang]}` : c.pick}</p>
            {game.player.riftReady && !game.player.riftUsed && <button className={`rift-toggle ${useRift ? 'active' : ''}`} onClick={() => setUseRift(!useRift)}><Shield />{c.rift}</button>}
            <button className="rift-commit" disabled={!moves.length || !!roundResult} onClick={reveal}><Swords />{c.commit}</button>
          </div>
          {game.player.riftReady && !game.player.riftUsed && <p className="rift-hint">{c.riftHint}</p>}
          <div className="rift-hand-title"><span>{c.hand}</span><b>{game.player.hand.length} CARDS</b></div>
          <div className="rift-hand">
            {game.player.hand.map((id) => {
              const card = CARD_MAP.get(id)!;
              const selected = pendingCard === id || moves.some((move) => move.cardId === id);
              const unaffordable = !moves.some((move) => move.cardId === id) && (energyUsed + card.cost > 3 || moves.length >= 2);
              return <button key={id} disabled={unaffordable} className={`${selected ? 'selected' : ''} faction-${card.faction}`} onClick={() => selectCard(id)}><img src={card.art} alt=""/><div className="rift-card-shade"/><span className="rift-cost">{card.cost}</span><small>{card.faction.toUpperCase()} · {card.lane.toUpperCase()}</small><strong>{card.name[lang]}</strong><p>{card.text[lang]}</p><b>{card.power} PWR</b></button>;
            })}
          </div>
          {roundResult && <RoundModal result={roundResult} game={game} lang={lang} onNext={() => setRoundResult(null)} onAgain={() => void startSolo()} onHome={resetToLobby} />}
        </section>
      )}
    </main>
  );
}

function PlayerBadge({ side, game, lang }: { side: 'player' | 'rival'; game: GameState; lang: Lang }) {
  const player = game[side];
  const hero = COMMANDERS[player.commander];
  return <div className={`rift-player ${side}`} style={{ '--accent': hero.color } as React.CSSProperties}><img src={hero.art} alt=""/><span><small>{side === 'player' ? 'PLAYER 01' : 'NEXUS AI'}</small><b>{hero.name[lang]}</b><em>{hero.title[lang]}</em></span></div>;
}

function RoundModal({ result, game, lang, onNext, onAgain, onHome }: { result: RoundResult; game: GameState; lang: Lang; onNext: () => void; onAgain: () => void; onHome: () => void }) {
  const c = text[lang];
  const title = game.winner === 'player' ? c.victory : game.winner === 'rival' ? c.defeat : game.winner === 'draw' ? c.draw : c.result;
  return <div className="rift-modal-backdrop"><section className="rift-result-modal">
    <div className="rift-result-art"><img src={result.event.art} alt=""/><div/><span><small>ROUND {result.round}</small><b>{title}</b></span></div>
    <div className="rift-result-grid">{result.lanes.map((lane) => <article key={lane.lane} className={lane.winner}><small>{c[lane.lane]}</small><div><b>{lane.rivalPower}</b><i>:</i><b>{lane.playerPower}</b></div><em>{lane.winner === 'player' ? c.player : lane.winner === 'rival' ? c.rival : c.draw}</em></article>)}</div>
    <div className="rift-combos"><p><small>{c.player} · {c.combo}</small><b>{result.playerCombo ?? c.noCombo}</b></p><p><small>{c.rival} · {c.combo}</small><b>{result.rivalCombo ?? c.noCombo}</b></p></div>
    <div className="rift-result-actions">{game.winner ? <><button onClick={onHome}><RotateCcw />{c.home}</button><button className="primary" onClick={onAgain}><Gamepad2 />{c.again}</button></> : <button className="primary" onClick={onNext}>{c.next}<ChevronRight /></button>}</div>
  </section></div>;
}
