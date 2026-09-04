# Alpha Coliseum Referee

本项目使用 Binance Agent OS 支持的 **Codex + Binance MCP** 工作流运行。处理项目内的市场审判请求时：

1. 完整阅读 `agent-os/SYSTEM_PROMPT.md` 与 `agent-os/OUTPUT_SCHEMA.md`。
2. 使用官方 Binance MCP 的只读市场工具取得当次数据；不得把网页演示值当成实时行情。
3. 依次完成四角色分析、三轮证据交锋与最终裁决。
4. 在回答末尾输出可被网页导入器读取的 `arena_result` JSON。
5. 默认只分析，`trade_executed` 必须为 `false`。
6. 未获得用户针对当前订单的明确确认，不得调用任何下单、转账、授权或其他写入工具。
7. 不得索取密码、2FA 或密钥，也不得绕过地区限制、KYC 或安全控制。

用户可直接发送：

> 请按本项目的 Alpha Coliseum 工作流审判 DOGE/USDT，风格 BALANCED，只做分析。先通过 Binance MCP 获取最新可用市场数据，再输出格斗解说和完整 arena_result JSON；不要交易。
