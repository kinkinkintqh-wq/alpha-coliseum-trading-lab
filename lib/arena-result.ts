export const fighterIds = ['bull', 'bear', 'whale', 'risk'] as const;
export const riskStyles = ['CONSERVATIVE', 'BALANCED', 'DEGEN'] as const;
export const verdicts = ['BUY', 'WAIT', 'AVOID'] as const;

export type FighterId = (typeof fighterIds)[number];
export type RiskStyle = (typeof riskStyles)[number];
export type Verdict = (typeof verdicts)[number];

export type ArenaFighterResult = {
  id: FighterId;
  score: number;
  claim: string;
  evidence: string[];
  counterpoint: string;
};

export type ArenaResult = {
  schema_version: '1.0';
  source: 'Binance MCP' | 'Binance Public API';
  pair: string;
  captured_at: string;
  market_status: string;
  style: RiskStyle;
  facts: Array<{ label: string; value: string; source: string }>;
  fighters: ArenaFighterResult[];
  verdict: Verdict;
  confidence: number;
  largest_risk: string;
  invalidation: string;
  trade_executed: false;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, field: string, max = 240): string {
  if (typeof value !== 'string' || value.trim().length === 0)
    throw new Error(field + ' 缺失');
  if (value.length > max) throw new Error(field + ' 过长');
  return value.trim();
}

function boundedScore(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 85
  )
    throw new Error(field + ' 必须是 0–85 的数字');
  return Math.round(value);
}

function unwrapJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = String.fromCharCode(96).repeat(3);
  let candidate = trimmed;
  if (trimmed.startsWith(fence)) {
    const firstLineEnd = trimmed.indexOf('\n');
    const fenceEnd = trimmed.lastIndexOf(fence);
    if (firstLineEnd > -1 && fenceEnd > firstLineEnd)
      candidate = trimmed.slice(firstLineEnd + 1, fenceEnd).trim();
  }
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('没有找到有效 JSON');
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      throw new Error('JSON 格式错误，请复制完整的 arena_result');
    }
  }
}

export function parseArenaResult(raw: string): ArenaResult {
  const decoded = unwrapJson(raw);
  if (!isRecord(decoded)) throw new Error('顶层必须是 JSON 对象');
  const value = isRecord(decoded.arena_result) ? decoded.arena_result : decoded;

  if (value.schema_version !== '1.0')
    throw new Error('仅支持 schema_version 1.0');
  if (value.source !== 'Binance MCP' && value.source !== 'Binance Public API')
    throw new Error('source 必须是 Binance MCP 或 Binance Public API');

  const pair = requiredText(value.pair, 'pair', 18).toUpperCase();
  if (!/^[A-Z0-9]{4,18}$/.test(pair)) throw new Error('pair 格式无效');
  const capturedAt = requiredText(value.captured_at, 'captured_at', 64);
  if (Number.isNaN(Date.parse(capturedAt)))
    throw new Error('captured_at 不是有效时间');
  const style = value.style;
  if (!riskStyles.includes(style as RiskStyle)) throw new Error('style 无效');
  const verdict = value.verdict;
  if (!verdicts.includes(verdict as Verdict)) throw new Error('verdict 无效');
  if (value.trade_executed !== false)
    throw new Error('本演示仅接受 trade_executed=false 的分析结果');

  if (!Array.isArray(value.fighters) || value.fighters.length !== 4)
    throw new Error('fighters 必须包含四名角色');
  const fighters = value.fighters.map((fighter, index): ArenaFighterResult => {
    if (!isRecord(fighter)) throw new Error('fighters[' + index + '] 格式无效');
    const id = fighter.id;
    if (!fighterIds.includes(id as FighterId))
      throw new Error('fighters[' + index + '].id 无效');
    if (!Array.isArray(fighter.evidence) || fighter.evidence.length === 0)
      throw new Error('fighters[' + index + '].evidence 缺失');
    return {
      id: id as FighterId,
      score: boundedScore(fighter.score, 'fighters[' + index + '].score'),
      claim: requiredText(fighter.claim, 'fighters[' + index + '].claim'),
      evidence: fighter.evidence
        .slice(0, 2)
        .map((item, evidenceIndex) =>
          requiredText(
            item,
            'fighters[' + index + '].evidence[' + evidenceIndex + ']',
          ),
        ),
      counterpoint: requiredText(
        fighter.counterpoint,
        'fighters[' + index + '].counterpoint',
      ),
    };
  });
  if (new Set(fighters.map((fighter) => fighter.id)).size !== 4)
    throw new Error('四名 fighter 的 id 必须唯一');

  const facts = Array.isArray(value.facts)
    ? value.facts.slice(0, 8).map((fact, index) => {
        if (!isRecord(fact)) throw new Error('facts[' + index + '] 格式无效');
        return {
          label: requiredText(fact.label, 'facts[' + index + '].label', 80),
          value: requiredText(fact.value, 'facts[' + index + '].value', 120),
          source: requiredText(fact.source, 'facts[' + index + '].source', 80),
        };
      })
    : [];

  return {
    schema_version: '1.0',
    source: value.source,
    pair,
    captured_at: capturedAt,
    market_status: requiredText(value.market_status, 'market_status', 40),
    style: style as RiskStyle,
    facts,
    fighters,
    verdict: verdict as Verdict,
    confidence: boundedScore(value.confidence, 'confidence'),
    largest_risk: requiredText(value.largest_risk, 'largest_risk'),
    invalidation: requiredText(value.invalidation, 'invalidation'),
    trade_executed: false,
  };
}
