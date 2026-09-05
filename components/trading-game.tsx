'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, CircleHelp, FastForward, History, Languages, Music2, Pause, Play, Radio, RefreshCw, Search, Shield, Swords, Volume2, WalletCards, X, Zap } from 'lucide-react';

import { useArenaAudio } from '@/hooks/use-arena-audio';
import { MarketChart } from '@/components/market-chart';
import { MODULES, availableMargin, createPortfolio, defaultConfig, equity, executePerpTrade, executeTrade, indicators, liquidationPrice, markPortfolio, personalityFromConfig, runAiStep, scorePortfolio, type Candle, type IntervalId, type MarketMode, type ModuleId, type Portfolio, type SimConfig, type SimLang } from '@/lib/trading-sim';

type Screen = 'builder' | 'game' | 'result';
type FuturesContext = { fundingRate: number | null; openInterestValue: number | null; longShortRatio: number | null; capturedAt: number };
type ReplayPayload = { symbol: string; interval: string; source: string; candles: Candle[]; futuresContext?: FuturesContext | null };
type Market = { symbol: string; baseAsset: string; lastPrice: number; change24h: number; quoteVolume: number };
type MatchRecord = { id: string; playedAt: string; symbol: string; interval: string; mode: MarketMode; leverage: number; persona: string; score: number; returnPct: number; maxDrawdown: number; trades: number; liquidated: boolean; historicalStart: string };
const playableStart = 42;
const historyKey = 'alpha-coliseum-match-history-v1';

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean }; execute: (input: unknown) => unknown }, options?: { signal?: AbortSignal }) => void | Promise<void> };
  }
}

const copy = {
  zh: {
    kicker: '真实行情驱动的虚拟交易卡牌游戏', titleA: '训练你的策略。', titleB: '塑造你的交易人格。', lead: '选择指标、调整参数、组建策略卡组，再进入一段未知的真实历史行情。使用 10,000 USDT 模拟资金，与电脑在同一个市场中验证判断。',
    real: '真实数据', virtual: '纯模拟资金', noTrade: '不会连接账户或执行真实交易', step1: '01 选择市场', step2: '02 调整参数', step3: '03 组建卡组', persona: '你的交易人格', start: '开始盲测挑战', loading: '正在抽取真实历史行情…', modules: '选择 4 张能力卡', modulesHint: '指标卡决定你能看见什么；策略与风控卡决定你怎样行动。',
    market: '市场', timeframe: 'K 线周期', ma: '均线参数', macd: 'MACD 参数', wr: 'WR 周期', trend: '趋势', reversal: '反转', speed: '速度', defense: '防守', discipline: '纪律',
    round: '行情进度', hidden: '历史日期将在结算时公开', cash: '可用资金', holding: '持仓价值', equity: '总权益', pnl: '收益率', fee: '累计费用', ai: '电脑权益', signal: '组合信号', buy25: '买入 25%', buy50: '买入 50%', sell50: '卖出 50%', sellAll: '全部卖出', pause: '暂停', play: '继续', finish: '提前结算',
    score: '综合评分', return: '模拟收益', drawdown: '最大回撤', disciplineScore: '策略纪律', trades: '交易次数', win: '本次挑战胜出', lose: '电脑策略更稳健', draw: '双方表现接近', retry: '换一段行情再试', coach: '即时教练', warm: '先观察几根 K 线，再根据卡牌信号决定是否行动。', strongBuy: '多个指标偏多，但仍需考虑仓位和止损。', strongSell: '多个指标转弱，检查持仓风险与退出条件。', neutral: '指标没有形成一致方向，等待也是一种决策。', error: '无法取得 Binance 真实历史数据，没有使用虚构行情。请稍后重试。',
    disclaimer: '教育与娱乐用途；模拟结果不代表未来表现，也不构成投资建议。', source: '数据来源：Binance 公开市场数据', intro: '玩法', introText: '行情每隔数秒推进一根。指标卡实时解读数据，你负责使用模拟资金开仓、减仓或退出。最终评分同时考虑收益、回撤、手续费与策略纪律。', spot: '现货训练', perp: '合约竞技', leverage: '逐仓杠杆', searchMarket: '搜索 Binance 市场', marketRank: '24H 热门市场', history: '历史战绩', historyEmpty: '还没有完成的对局', long25: '做多 25%', short25: '做空 25%', close50: '平仓 50%', closeAll: '全部平仓', available: '可用保证金', position: '合约仓位', liquidation: '预估强平价', noPosition: '暂无持仓', localOnly: '仅保存在当前浏览器', musicTheme: '曲目', liquidated: '已强平',
  },
  en: {
    kicker: 'VIRTUAL TRADING CARD GAME POWERED BY REAL MARKETS', titleA: 'Train your strategy.', titleB: 'Forge your trading persona.', lead: 'Pick indicators, tune parameters, build a strategy deck, then enter an unseen slice of real historical price action with 10,000 virtual USDT.',
    real: 'REAL DATA', virtual: 'VIRTUAL FUNDS', noTrade: 'Never connects to an account or places a real order', step1: '01 CHOOSE MARKET', step2: '02 TUNE PARAMETERS', step3: '03 BUILD DECK', persona: 'YOUR TRADING PERSONA', start: 'START BLIND CHALLENGE', loading: 'Drawing a real historical market…', modules: 'Choose 4 ability cards', modulesHint: 'Indicator cards shape what you see. Strategy and risk cards shape how you act.',
    market: 'MARKET', timeframe: 'TIMEFRAME', ma: 'MA SETTINGS', macd: 'MACD SETTINGS', wr: 'WR PERIOD', trend: 'TREND', reversal: 'REVERSAL', speed: 'SPEED', defense: 'DEFENSE', discipline: 'DISCIPLINE',
    round: 'MARKET PROGRESS', hidden: 'Historical date revealed at settlement', cash: 'CASH', holding: 'POSITION', equity: 'EQUITY', pnl: 'RETURN', fee: 'FEES', ai: 'AI EQUITY', signal: 'COMBINED SIGNAL', buy25: 'BUY 25%', buy50: 'BUY 50%', sell50: 'SELL 50%', sellAll: 'SELL ALL', pause: 'PAUSE', play: 'PLAY', finish: 'SETTLE NOW',
    score: 'TOTAL SCORE', return: 'SIM RETURN', drawdown: 'MAX DRAWDOWN', disciplineScore: 'DISCIPLINE', trades: 'TRADES', win: 'YOU WON THE CHALLENGE', lose: 'THE AI MANAGED RISK BETTER', draw: 'CLOSE MATCH', retry: 'TRY ANOTHER MARKET', coach: 'LIVE COACH', warm: 'Observe a few candles, then use card signals to decide.', strongBuy: 'Several signals lean bullish. Position size and exits still matter.', strongSell: 'Several signals weakened. Review position risk and exit rules.', neutral: 'Signals disagree. Waiting is also a decision.', error: 'Could not load real Binance history. No synthetic market was substituted. Try again later.',
    disclaimer: 'For education and entertainment. Simulated results do not predict future performance or provide investment advice.', source: 'Source: Binance public market data', intro: 'HOW TO PLAY', introText: 'A new candle arrives every few seconds. Your cards interpret the data; you manage virtual entries and exits. Return, drawdown, fees, and discipline all affect the final score.', spot: 'SPOT TRAINING', perp: 'PERP ARENA', leverage: 'ISOLATED LEVERAGE', searchMarket: 'Search Binance markets', marketRank: '24H ACTIVE MARKETS', history: 'MATCH HISTORY', historyEmpty: 'No completed matches yet', long25: 'LONG 25%', short25: 'SHORT 25%', close50: 'CLOSE 50%', closeAll: 'CLOSE ALL', available: 'AVAILABLE MARGIN', position: 'PERP POSITION', liquidation: 'EST. LIQUIDATION', noPosition: 'NO POSITION', localOnly: 'Saved on this browser only', musicTheme: 'TRACK', liquidated: 'LIQUIDATED',
  },
} as const;

const moduleOrder: ModuleId[] = ['ma','macd','wr','volume','discipline','scale','patience','momentum'];
const characterArt = { bull: '/characters/bull-v2.jpg', bear: '/characters/bear-v2.jpg', whale: '/characters/whale-v2.jpg', risk: '/characters/risk-v2.jpg' };

export function TradingGame() {
  const [lang, setLang] = useState<SimLang>('zh');
  const [screen, setScreen] = useState<Screen>('builder');
  const [config, setConfig] = useState<SimConfig>(defaultConfig);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [index, setIndex] = useState(playableStart);
  const [portfolio, setPortfolio] = useState<Portfolio>(() => createPortfolio());
  const [aiPortfolio, setAiPortfolio] = useState<Portfolio>(() => createPortfolio());
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [marketSearch, setMarketSearch] = useState('');
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [futuresContext, setFuturesContext] = useState<FuturesContext | null>(null);
  const points = useMemo(() => indicators(candles, config), [candles, config]);
  const point = points[index];
  const personality = useMemo(() => personalityFromConfig(config), [config]);
  const audio = useArenaAudio(screen === 'game' ? Math.floor((index / Math.max(candles.length, 1)) * 5) : 0);
  const finishingRef = useRef(false);
  const savedRef = useRef(false);
  const c = copy[lang];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setHistory(JSON.parse(window.localStorage.getItem(historyKey) ?? '[]') as MatchRecord[]); } catch { setHistory([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'read_local_match_history', title: 'Read Alpha Coliseum match history',
      description: 'Read completed simulated trading matches stored on this browser. This never reads a Binance account or executes a trade.',
      inputSchema: { type: 'object', properties: { limit: { type: 'number', minimum: 1, maximum: 50 } }, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const limit = typeof input === 'object' && input && 'limit' in input && typeof input.limit === 'number' ? Math.max(1, Math.min(50, input.limit)) : 10;
        let records: MatchRecord[] = [];
        try { records = JSON.parse(window.localStorage.getItem(historyKey) ?? '[]') as MatchRecord[]; } catch { records = []; }
        return { local_only: true, simulated_only: true, matches: records.slice(0, limit) };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({
      name: 'stage_market_challenge', title: 'Stage an Alpha Coliseum challenge',
      description: 'Prepare the visible game builder for a simulated Binance market challenge. It does not start a match or place any real order.',
      inputSchema: { type: 'object', properties: { symbol: { type: 'string', pattern: '^[A-Z0-9]{5,18}$' }, mode: { type: 'string', enum: ['spot', 'perp'] }, interval: { type: 'string', enum: ['1m', '5m', '15m'] }, leverage: { type: 'number', enum: [1, 2, 3, 5] } }, required: ['symbol', 'mode'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object') throw new Error('Invalid challenge configuration');
        const value = input as { symbol?: unknown; mode?: unknown; interval?: unknown; leverage?: unknown };
        const symbol = typeof value.symbol === 'string' ? value.symbol.toUpperCase() : '';
        const mode = value.mode === 'perp' ? 'perp' : value.mode === 'spot' ? 'spot' : null;
        if (!/^[A-Z0-9]{5,18}$/.test(symbol) || !symbol.endsWith('USDT') || !mode) throw new Error('Invalid Binance USDT market');
        const interval = value.interval === '1m' || value.interval === '15m' ? value.interval : '5m';
        const leverage = value.leverage === 1 || value.leverage === 3 || value.leverage === 5 ? value.leverage : 2;
        setConfig((current) => ({ ...current, symbol, mode, interval, leverage }));
        setScreen('builder'); setMarketSearch('');
        return { staged: true, simulated_only: true, symbol, mode, interval, leverage: mode === 'perp' ? leverage : 1 };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/markets?mode=${config.mode}`).then(async (response) => {
      if (!response.ok) throw new Error('markets');
      return await response.json() as { markets: Market[] };
    }).then((data) => {
      if (!cancelled) setMarkets(data.markets);
    }).catch(() => { if (!cancelled) setMarkets([]); });
    return () => { cancelled = true; };
  }, [config.mode]);

  const filteredMarkets = useMemo(() => {
    const query = marketSearch.trim().toUpperCase();
    return markets.filter((market) => !query || market.symbol.includes(query)).slice(0, query ? 12 : 8);
  }, [markets, marketSearch]);

  async function startGame() {
    if (config.modules.length !== 4) return;
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/simulation?symbol=${config.symbol}&interval=${config.interval}&mode=${config.mode}&seed=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('history');
      const data = await response.json() as ReplayPayload;
      setCandles(data.candles); setFuturesContext(data.futuresContext ?? null); setIndex(playableStart); setPortfolio(createPortfolio(10000, config.mode, config.mode === 'perp' ? config.leverage : 1)); setAiPortfolio(createPortfolio(10000, config.mode, config.mode === 'perp' ? config.leverage : 1)); setScreen('game'); setPlaying(false); setShowIntro(true); finishingRef.current = false; savedRef.current = false;
      if (!audio.enabled) audio.toggle();
    } catch { setError(c.error); }
    finally { setLoading(false); }
  }

  function toggleModule(id: ModuleId) {
    setConfig((current) => current.modules.includes(id) ? { ...current, modules: current.modules.filter((item) => item !== id) } : current.modules.length < 4 ? { ...current, modules: [...current.modules, id] } : current);
  }

  function settle() {
    if (finishingRef.current || !candles.length) return;
    finishingRef.current = true; setPlaying(false);
    setPortfolio((current) => current.quantity ? current.mode === 'perp' ? executePerpTrade(current, 'close', 1, candles[index], index, point?.score ?? 0, 'AUTO_SETTLEMENT') : executeTrade(current, 'sell', 1, candles[index], index, point?.score ?? 0, 'AUTO_SETTLEMENT') : current);
    setAiPortfolio((current) => current.quantity ? current.mode === 'perp' ? executePerpTrade(current, 'close', 1, candles[index], index, points[index]?.score ?? 0, 'AUTO_SETTLEMENT') : executeTrade(current, 'sell', 1, candles[index], index, points[index]?.score ?? 0, 'AUTO_SETTLEMENT') : current);
    window.setTimeout(() => { setScreen('result'); audio.strike('victory'); }, 150);
  }

  function advance() {
    if (!candles.length || index >= candles.length - 1) { settle(); return; }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setPortfolio((current) => markPortfolio(current, candles[nextIndex].close));
    setAiPortfolio((current) => runAiStep(current, candles[nextIndex], points[nextIndex], nextIndex));
  }

  useEffect(() => {
    if (!playing || screen !== 'game') return;
    const timer = window.setInterval(advance, 2200);
    return () => window.clearInterval(timer);
  });

  function trade(side: 'buy' | 'sell', fraction: number) {
    if (!point) return;
    setPortfolio((current) => executeTrade(current, side, fraction, candles[index], index, point.score, side === 'buy' ? 'PLAYER_BUY' : 'PLAYER_SELL'));
    audio.strike('card');
  }

  function perpTrade(action: 'long' | 'short' | 'close', fraction: number) {
    if (!point) return;
    setPortfolio((current) => executePerpTrade(current, action, fraction, candles[index], index, point.score, `PLAYER_${action.toUpperCase()}`));
    audio.strike('card');
  }

  const currentPrice = candles[index]?.close ?? 0;
  const userScore = scorePortfolio(portfolio, currentPrice);
  const aiScore = scorePortfolio(aiPortfolio, currentPrice);
  const signalText = !point || point.score === 0 ? c.neutral : point.score >= 2 ? c.strongBuy : point.score <= -2 ? c.strongSell : c.neutral;
  const startDate = candles[0] ? new Date(candles[0].time).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US') : '';

  function exportCoachPack() {
    const payload = { schema_version: '1.0', game: 'Alpha Coliseum: Futures Arena', simulated_only: true, source: config.mode === 'perp' ? 'Binance USDⓈ-M Futures public market data' : 'Binance Spot public market data', request: '请使用 Binance MCP 核对该市场的 K 线、行情与可用的合约数据，分析这局的市场结构、交易纪律与风险，只做教育复盘，不执行真实交易。', match: { symbol: config.symbol, interval: config.interval, mode: config.mode, leverage: config.mode === 'perp' ? config.leverage : 1, historical_start: new Date(candles[0].time).toISOString(), historical_end: new Date(candles[index].time).toISOString(), opening_futures_context: futuresContext, persona: personality.title.zh, modules: config.modules, score: userScore.score, return_pct: userScore.returnPct, max_drawdown_pct: portfolio.maxDrawdown * 100, fees: portfolio.fees, liquidated: portfolio.liquidated, trades: portfolio.trades } };
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    link.download = `alpha-coliseum-${config.symbol}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  useEffect(() => {
    if (screen !== 'result' || !candles.length || savedRef.current) return;
    savedRef.current = true;
    const record: MatchRecord = { id: `${Date.now()}-${config.symbol}`, playedAt: new Date().toISOString(), symbol: config.symbol, interval: config.interval, mode: config.mode, leverage: config.mode === 'perp' ? config.leverage : 1, persona: personality.title.zh, score: userScore.score, returnPct: userScore.returnPct, maxDrawdown: portfolio.maxDrawdown * 100, trades: portfolio.trades.length, liquidated: portfolio.liquidated, historicalStart: new Date(candles[0].time).toISOString() };
    setHistory((current) => {
      const next = [record, ...current].slice(0, 50);
      window.localStorage.setItem(historyKey, JSON.stringify(next));
      return next;
    });
  }, [screen, candles, config, personality.title.zh, portfolio, userScore.returnPct, userScore.score]);

  return <main className="sim-app">
    <div className="sim-noise"/>
    <header className="sim-header"><button className="sim-brand" onClick={() => { setPlaying(false); setScreen('builder'); }}><Swords/><span><b>ALPHA COLOSSEUM</b><small>TRADING LAB</small></span></button><div><span className="sim-engine"><i/> MARKET REPLAY ENGINE</span><button onClick={() => setShowHistory(true)}><History/>{c.history}</button><button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}><Languages/>{lang === 'zh' ? 'EN' : '中文'}</button><button className="sim-track" onClick={audio.cycleTheme}><Music2/>{audio.theme.toUpperCase()}</button><button className={audio.enabled ? 'on' : ''} onClick={audio.toggle}>{audio.enabled ? <Volume2/> : <Music2/>}{audio.enabled ? 'ON' : 'OFF'}</button></div></header>

    {screen === 'builder' && <>
      <section className="sim-hero"><img src="/game-art/market-rift-keyart-v1.png" alt="Market Rift"/><div className="sim-hero-shade"/><div className="sim-hero-copy"><p><Radio/>{c.kicker}</p><h1>{c.titleA}<br/><em>{c.titleB}</em></h1><span>{c.lead}</span><div><b><Radio/>{c.real}</b><b><WalletCards/>{c.virtual}</b><small><Shield/>{c.noTrade}</small></div></div></section>
      <section className="sim-builder">
        <div className="sim-config">
          <section><small>{c.step1}</small><div className="sim-mode-tabs"><button className={config.mode === 'spot' ? 'active' : ''} onClick={() => setConfig({ ...config, mode: 'spot' })}><WalletCards/>{c.spot}</button><button className={config.mode === 'perp' ? 'active' : ''} onClick={() => setConfig({ ...config, mode: 'perp' })}><Swords/>{c.perp}</button></div><div className="sim-market-search"><Search/><input value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder={c.searchMarket}/><b>{markets.length || '…'} USDT</b></div><div className="sim-market-rank"><small>{c.marketRank}</small><div>{filteredMarkets.map((market) => <button key={market.symbol} className={config.symbol === market.symbol ? 'active' : ''} onClick={() => { setConfig({ ...config, symbol: market.symbol }); setMarketSearch(''); }}><b>{market.baseAsset}</b><span>{market.lastPrice ? market.lastPrice.toLocaleString('en-US', { maximumFractionDigits: market.lastPrice < 1 ? 6 : 2 }) : '—'}</span><em className={market.change24h >= 0 ? 'up' : 'down'}>{market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%</em></button>)}</div></div><div className="sim-market-options"><label><span>{c.market}</span><div><button className="active">{config.symbol.replace('USDT','')} / USDT</button></div></label><label><span>{c.timeframe}</span><div>{(['1m','5m','15m'] as IntervalId[]).map((interval) => <button key={interval} className={config.interval === interval ? 'active' : ''} onClick={() => setConfig({ ...config, interval })}>{interval}</button>)}</div></label>{config.mode === 'perp' && <label><span>{c.leverage}</span><div>{([1,2,3,5] as const).map((leverage) => <button key={leverage} className={config.leverage === leverage ? 'active' : ''} onClick={() => setConfig({ ...config, leverage })}>{leverage}×</button>)}</div></label>}</div></section>
          <section><small>{c.step2}</small><div className="sim-parameters"><Parameter label={c.ma} value={`${config.maFast} / ${config.maSlow}`} min={3} max={15} current={config.maFast} onChange={(maFast) => setConfig({ ...config, maFast, maSlow: Math.max(config.maSlow, maFast + 5) })}/><Parameter label={c.macd} value={`${config.macdFast}/${config.macdSlow}/${config.macdSignal}`} min={5} max={15} current={config.macdFast} onChange={(macdFast) => setConfig({ ...config, macdFast, macdSlow: Math.max(config.macdSlow, macdFast + 5) })}/><Parameter label={c.wr} value={String(config.wrPeriod)} min={6} max={28} current={config.wrPeriod} onChange={(wrPeriod) => setConfig({ ...config, wrPeriod })}/></div></section>
          <section><small>{c.step3}</small><h2>{c.modules}<b>{config.modules.length}/4</b></h2><p>{c.modulesHint}</p><div className="sim-module-grid">{moduleOrder.map((id) => { const card = MODULES[id]; const selected = config.modules.includes(id); return <button key={id} className={selected ? 'active' : ''} onClick={() => toggleModule(id)}><img src={card.art} alt=""/><i/><em>{card.kind}</em><strong>{card.name[lang]}</strong><span>{card.short[lang]}</span><b>{selected ? 'EQUIPPED' : '+'}</b></button>; })}</div></section>
        </div>
        <aside className="sim-persona" style={{ '--persona': personality.color } as React.CSSProperties}><div className="sim-persona-art"><img src={characterArt[personality.commander]} alt=""/><i/></div><small>{c.persona}</small><h2>{personality.title[lang]}</h2><p>{personality.subtitle[lang]}</p><div className="sim-traits">{(['trend','reversal','speed','defense','discipline'] as const).map((trait) => <label key={trait}><span>{c[trait]}</span><i><b style={{ width: `${personality.traits[trait]}%` }}/></i><em>{personality.traits[trait]}</em></label>)}</div><button disabled={loading || config.modules.length !== 4} onClick={() => void startGame()}><Zap/>{loading ? c.loading : c.start}<ChevronRight/></button>{error && <p className="sim-error">{error}</p>}</aside>
      </section>
    </>}

    {screen === 'game' && candles.length > 0 && point && <section className="sim-game">
      <div className="sim-game-top"><div><span><i/>{c.source}</span><b>{config.symbol} · {config.interval} · {config.mode === 'perp' ? `${c.perp} ${config.leverage}×` : c.spot}</b><small>{c.hidden}</small></div><div><span>{c.round}</span><b>{index-playableStart+1}/{candles.length-playableStart}</b><i><em style={{ width: `${((index-playableStart+1)/(candles.length-playableStart))*100}%` }}/></i></div></div>
      <div className="sim-portfolio"><Metric label={config.mode === 'perp' ? c.available : c.cash} value={`${(config.mode === 'perp' ? availableMargin(portfolio,currentPrice) : portfolio.cash).toFixed(0)} U`}/><Metric label={config.mode === 'perp' ? c.position : c.holding} value={config.mode === 'perp' ? portfolio.quantity ? `${portfolio.quantity > 0 ? 'LONG' : 'SHORT'} ${(Math.abs(portfolio.quantity)*currentPrice).toFixed(0)} U` : c.noPosition : `${(portfolio.quantity*currentPrice).toFixed(0)} U`}/><Metric label={c.equity} value={`${equity(portfolio,currentPrice).toFixed(0)} U`} hot/><Metric label={c.pnl} value={`${userScore.returnPct>=0?'+':''}${userScore.returnPct.toFixed(2)}%`} positive={userScore.returnPct>=0}/><Metric label={config.mode === 'perp' ? c.liquidation : c.fee} value={config.mode === 'perp' ? liquidationPrice(portfolio)?.toLocaleString('en-US',{maximumFractionDigits:currentPrice<1?6:2}) ?? '—' : `${portfolio.fees.toFixed(2)} U`}/><Metric label={c.ai} value={`${equity(aiPortfolio,currentPrice).toFixed(0)} U`}/></div>
      {config.mode === 'perp' && futuresContext && <div className="sim-futures-context"><small>BINANCE FUTURES · OPENING CONTEXT</small><span><b>FUNDING</b>{futuresContext.fundingRate === null ? '—' : `${(futuresContext.fundingRate * 100).toFixed(4)}%`}</span><span><b>OPEN INTEREST</b>{futuresContext.openInterestValue === null ? '—' : `${(futuresContext.openInterestValue / 1_000_000).toFixed(1)}M U`}</span><span><b>LONG / SHORT</b>{futuresContext.longShortRatio?.toFixed(3) ?? '—'}</span><em>Snapshot aligned to the first playable candle · no look-ahead</em></div>}
      <div className="sim-chart-shell"><div className="sim-chart-price"><small>{config.symbol}</small><b>{currentPrice.toLocaleString('en-US',{maximumFractionDigits:currentPrice<1?6:2})}</b><em className={candles[index].close>=candles[index].open?'up':'down'}>{candles[index].close>=candles[index].open?'▲':'▼'} CURRENT CANDLE</em></div><MarketChart candles={candles} points={points} index={index} trades={portfolio.trades}/></div>
      <div className="sim-decision"><section><div className="sim-signal-head"><span><small>{c.signal}</small><b className={point.score>0?'buy':point.score<0?'sell':''}>{point.score>0?'+':''}{point.score}</b></span><p>{signalText}</p></div><div className="sim-live-cards">{config.modules.map((id) => <LiveCard key={id} id={id} lang={lang} point={point}/>)}</div></section><aside><small>{config.mode === 'perp' ? `VIRTUAL PERP · ISOLATED ${config.leverage}×` : 'VIRTUAL SPOT EXECUTION'}</small>{config.mode === 'spot' ? <><div className="sim-buy"><button onClick={() => trade('buy',.25)}>{c.buy25}</button><button onClick={() => trade('buy',.5)}>{c.buy50}</button></div><div className="sim-sell"><button disabled={!portfolio.quantity} onClick={() => trade('sell',.5)}>{c.sell50}</button><button disabled={!portfolio.quantity} onClick={() => trade('sell',1)}>{c.sellAll}</button></div></> : <><div className="sim-buy"><button disabled={portfolio.quantity < 0 || portfolio.liquidated} onClick={() => perpTrade('long',.25)}>{c.long25}</button><button disabled={portfolio.quantity > 0 || portfolio.liquidated} onClick={() => perpTrade('short',.25)}>{c.short25}</button></div><div className="sim-sell"><button disabled={!portfolio.quantity} onClick={() => perpTrade('close',.5)}>{c.close50}</button><button disabled={!portfolio.quantity} onClick={() => perpTrade('close',1)}>{c.closeAll}</button></div></>}<div className="sim-playback"><button onClick={() => setPlaying(!playing)}>{playing?<Pause/>:<Play/>}{playing?c.pause:c.play}</button><button onClick={advance}><FastForward/></button><button onClick={settle}>{c.finish}</button></div>{portfolio.liquidated && <b className="sim-liquidated">{c.liquidated}</b>}</aside></div>
      <div className="sim-coach"><CircleHelp/><span><b>{c.coach}</b><p>{signalText}</p></span></div>
      {showIntro && <div className="sim-intro-back"><section><img src="/game-art/event-trend-surge-v1.png" alt=""/><div><small>{c.intro}</small><h2>{personality.title[lang]}，进入盲测行情</h2><p>{c.introText}</p><button onClick={() => {setShowIntro(false);setPlaying(true)}}><Play/>{c.play}</button></div></section></div>}
    </section>}

    {screen === 'result' && candles.length > 0 && <section className="sim-result"><div className="sim-result-hero"><img src="/game-art/event-volatility-storm-v1.png" alt=""/><i/><span><small>SETTLEMENT COMPLETE</small><h1>{portfolio.liquidated ? c.liquidated : userScore.score>aiScore.score?c.win:userScore.score<aiScore.score?c.lose:c.draw}</h1><p>{startDate} · {config.symbol} · {config.interval} · {config.mode === 'perp' ? `${config.leverage}× PERP` : 'SPOT'}</p></span></div><div className="sim-score-duel"><article><small>PLAYER · {personality.title[lang]}</small><b>{userScore.score}</b><em>{c.score}</em></article><i>VS</i><article><small>NEXUS · BALANCED BOT</small><b>{aiScore.score}</b><em>{c.score}</em></article></div><div className="sim-report"><Report label={c.return} user={userScore.returnPct} ai={aiScore.returnPct} suffix="%"/><Report label={c.drawdown} user={portfolio.maxDrawdown*100} ai={aiPortfolio.maxDrawdown*100} suffix="%" invert/><Report label={c.disciplineScore} user={userScore.discipline*100} ai={aiScore.discipline*100} suffix="%"/><Report label={c.trades} user={portfolio.trades.length} ai={aiPortfolio.trades.length} suffix=""/></div><div className="sim-lessons">{config.modules.map((id)=><p key={id}><b>{MODULES[id].name[lang]}</b><span>{MODULES[id].lesson[lang]}</span></p>)}</div><div className="sim-result-actions"><button className="sim-retry" onClick={() => {setScreen('builder');setCandles([])}}><RefreshCw/>{c.retry}</button><button className="sim-coach-export" onClick={exportCoachPack}><Zap/>AGENT OS COACH PACK</button></div><p className="sim-disclaimer">{c.disclaimer}</p></section>}

    {showHistory && <div className="sim-history-back"><section><header><span><History/><b>{c.history}</b><small>{c.localOnly}</small></span><button onClick={() => setShowHistory(false)} aria-label="Close history"><X/></button></header>{history.length ? <div className="sim-history-list">{history.map((record) => <article key={record.id}><div><b>{record.symbol}</b><em>{record.mode === 'perp' ? `${record.leverage}× PERP` : 'SPOT'} · {record.interval}</em></div><strong className={record.returnPct >= 0 ? 'up' : 'down'}>{record.returnPct >= 0 ? '+' : ''}{record.returnPct.toFixed(2)}%</strong><span><b>{record.score}</b><small>SCORE</small></span><p>{record.persona}<br/>{new Date(record.playedAt).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US')}</p>{record.liquidated && <i>{c.liquidated}</i>}</article>)}</div> : <p className="sim-history-empty">{c.historyEmpty}</p>}</section></div>}
  </main>;
}

function Parameter({ label,value,min,max,current,onChange }:{label:string;value:string;min:number;max:number;current:number;onChange:(value:number)=>void}) { return <label><span>{label}<b>{value}</b></span><input type="range" min={min} max={max} value={current} onChange={(event)=>onChange(Number(event.target.value))}/></label>; }
function Metric({label,value,hot,positive}:{label:string;value:string;hot?:boolean;positive?:boolean}) { return <div className={hot?'hot':positive?'positive':''}><small>{label}</small><b>{value}</b></div>; }
function LiveCard({id,lang,point}:{id:ModuleId;lang:SimLang;point:ReturnType<typeof indicators>[number]}) { const card=MODULES[id]; const value=id==='ma'?`${point.maFast?.toFixed(2)??'—'} / ${point.maSlow?.toFixed(2)??'—'}`:id==='macd'?`${point.macdHistogram?.toFixed(4)??'—'}`:id==='wr'?`${point.wr?.toFixed(1)??'—'}`:id==='volume'?`${point.volumeRatio?.toFixed(2)??'—'}×`:'ACTIVE'; return <article><img src={card.art} alt=""/><i/><small>{card.kind}</small><b>{card.name[lang]}</b><em>{value}</em></article>; }
function Report({label,user,ai,suffix,invert}:{label:string;user:number;ai:number;suffix:string;invert?:boolean}) { const userWins=invert?user<ai:user>ai; const digits=suffix?2:0; return <div><b>{label}</b><span className={userWins?'win':''}>{user.toFixed(digits)}{suffix}</span><i/><span className={!userWins?'win':''}>{ai.toFixed(digits)}{suffix}</span></div>; }
