# Alpha Coliseum｜AI 币圈斗兽场

Alpha Coliseum 是一个用 **Binance Agent OS** 搭建的市场分析 Agent。它把同一份 Binance 实时数据交给四个对立角色：多头、空头、巨鲸侦探和风险刺客。四方必须引用证据进行三轮对战，最后交付一张可解释的 BUY / WAIT / AVOID 裁决卡。

## 参赛定位

- 活动要求：用 Binance Agent OS 搭建你的 AI Agent
- 申报主题：数据分析
- 核心 Agent：Codex 中的 Alpha Coliseum Referee 工作流
- 数据工具：Binance MCP（读取市场数据）
- 演示层：热血漫画风互动斗兽场，支持中英文切换和角色自定义
- 交易原则：默认只分析；任何真实交易必须再次明确确认

## 本地运行

    npm run dev

打开开发服务器显示的本地地址。网页会通过本站只读接口请求 Binance 官方公开市场 API；切换 BTC、ETH、DOGE 等币种并点击“同步真实行情”后，最新价、24H 数据和前 20 档深度会同步变化。网页不会读取账户或下单。

如果需要完成真正的 Agent OS 工作流，可在网页复制包含当前交易对和四位自定义角色设定的一键提示词，发送给已连接 Binance MCP 的 Codex，再将 `arena_result` 导回网页。页面会明确区分 `Binance Public API` 实时预览和 `Binance MCP` Agent 裁决。

## 用 Binance Agent OS 在 Codex 中搭建

Binance Agent OS 是面向 Codex、Claude Desktop、CLI 和 Agent 框架的开发平台，并非一个必须在网页内“新建 Agent”的托管产品。本项目采用官方支持的 **Codex + Binance MCP** 形态。

1. 在支持 MCP 的 Codex 环境中打开本项目。
2. 接入官方 Binance MCP：`https://agent.binance.com/mcp/agentic`，仅授予读取市场数据所需权限。
3. Codex 会读取项目根目录的 [AGENTS.md](AGENTS.md)，并按 [系统提示词](agent-os/SYSTEM_PROMPT.md) 与 [输出契约](agent-os/OUTPUT_SCHEMA.md) 运行。
4. 直接复制 [一句话运行指令](RUN_AGENT.md)；Agent 必须先调用 Binance MCP，再生成裁决。
5. 把回复结尾的 `arena_result` JSON 导入网页，即可展示真实 MCP 证据。

网页导入器内置一份 2026-09-03 17:19 CST 获取的 DOGE/USDT 脱敏只读 MCP 快照，供离线演示。它是有时间戳的历史证据，不冒充当前行情。

## 文件地图

- app/：可交互演示界面
- agent-os/：Agent OS 系统提示词与输出契约
- AGENTS.md：Codex 项目级 Agent 定义
- RUN_AGENT.md：用户可直接发送的一句话指令
- public/examples/：带时间戳的已验证 Binance MCP 只读快照
- public/characters/：由内置 ImageGen 生成的四名原创漫画角色立绘
- submission/：表单文案、90 秒视频脚本和发布检查表

## 责任边界

本项目是数据分析和人机决策演示，不构成投资建议。不得绕过地区限制、KYC、2FA、账户权限或 Binance 安全控制。
