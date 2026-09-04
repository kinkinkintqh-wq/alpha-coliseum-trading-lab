# Agent 输出契约

Agent 先给人类可读的格斗解说，再在结尾附上一个 arena_result JSON 代码块。演示界面可以读取这个对象，而不需要猜测自然语言。

    {
      "arena_result": {
        "schema_version": "1.0",
        "source": "Binance MCP",
        "pair": "DOGEUSDT",
        "captured_at": "ISO-8601 timestamp",
        "market_status": "TRADING",
        "style": "BALANCED",
        "facts": [
          { "label": "last_price", "value": "MCP value", "source": "ticker" }
        ],
        "fighters": [
          {
            "id": "bull",
            "score": 0,
            "claim": "short claim",
            "evidence": ["numbered MCP fact"],
            "counterpoint": "strongest opposing fact"
          }
        ],
        "verdict": "BUY | WAIT | AVOID",
        "confidence": 0,
        "largest_risk": "single sentence",
        "invalidation": "condition that changes the verdict",
        "trade_executed": false
      }
    }

## 校验条件

- fighters 必须恰好包含 bull、bear、whale、risk。
- score 和 confidence 范围为 0–85；分数表示证据强度，不是收益概率。
- source 只有在当次真实调用 MCP 后才能写 Binance MCP。
- 未下单时 trade_executed 必须是 false。
