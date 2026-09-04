# 一句话运行 Alpha Coliseum

在已经接入官方 Binance MCP 的 Codex 中打开本项目，然后发送：

> 请按本项目的 Alpha Coliseum 工作流审判 DOGE/USDT，风格 BALANCED，只做分析。先通过 Binance MCP 获取最新可用市场数据，再输出格斗解说和完整 arena_result JSON；不要交易。

完成后，把回复末尾的 `arena_result` JSON 复制到网页右上角 **IMPORT AGENT RESULT**，即可生成可视化裁决卡。

## 可替换参数

- `DOGE/USDT`：换成想分析的 Binance 现货交易对。
- `BALANCED`：可换成 `CONSERVATIVE` 或 `DEGEN`，只影响分析风格，不授予交易权限。

## 安全边界

此流程默认只读取公开市场数据，不读取余额、不下单。不要向 Agent 提供密码、2FA、API 密钥或 OAuth 令牌。
