# Claude 固定出口 · Mihomo

仅将 Claude 相关域名送往自己的固定公网出口。现有机场节点负责中转，其他流量继续按订阅原有规则处理。

`设备 → 机场中转节点或策略组 → 固定 SOCKS5 代理 → Claude`

## 手动配置

1. 在使用 Mihomo 内核的客户端中导入机场订阅，记下一个可用中转节点或策略组的完整名称。用策略组时，选择只会在机场中转节点之间切换的组。
2. 将 [覆写模板](claude-fixed-exit.override.js) 另存为私用文件 `claude-fixed-exit.local.js`。在文件开头填写固定代理的 `server`、`port`、`username`、`password` 以及中转名称 `relay`。无需认证时，用户名和密码都留空。请在本机保管填写过的文件。
3. 在 Clash Party 中导入这份 JavaScript 覆写，只将它绑定到目标订阅，并排在该订阅的其他规则覆写之后。启用规则模式，再重新加载订阅。[Mihomo 链式代理说明](https://wiki.metacubex.one/config/proxies/dialer-proxy/)

模板使用 TCP SOCKS5。匹配到的 Claude UDP 流量会被拒绝。配置缺失、无效或中转名称找不到时，匹配到的 Claude 流量也会被拒绝。填写前请先保留一份现有配置。

## 分流范围

| 类型 | 匹配目标 |
| --- | --- |
| `DOMAIN-SUFFIX` | `claude.ai`、`claude.com`、`anthropic.com`、`claudeusercontent.com`、`claude.app`、`claudemcpcontent.com`、`clau.de` |
| `DOMAIN` | `servd-anthropic-website.b-cdn.net` |

Claude 规则优先于通用分流和 `MATCH`。国内白名单和其余流量继续走原有策略。第一版省略 `siftscience.com` 和 `34.8.0.0/16`。

## 实测公网出口

- 通过实际使用的本机代理打开 `claude.ai`，并对 `api.anthropic.com` 建立一次连接。在客户端的连接记录里确认实际命中的规则、策略和中转节点。
- 如果 Claude 站点提供公网 IP 回显，可以直接读取。否则，使用明确绑定到同一固定出口链路的测试入口查询公网 IP。普通查 IP 网站可能由现有规则分到其他线路。
- 将测得的 IP 与服务商提供的预期公网出口 IP 比对。如果配置了自动切换，可以逐个验证候选中转。记录实际中转、命中策略、测得的 IP 和结果。

## 发给 AI 的提示词

```text
我使用【客户端名称和版本】，已导入【机场订阅名称】。我买了一个固定 SOCKS5 代理，预期公网出口 IP 是【我的固定公网 IP】。

请只给 Claude 配置固定出口，链路是 设备 → 机场节点中转 → 我的固定 SOCKS5 代理 → Claude。

先检查我的客户端、内核和真实的中转节点或策略组名。如果使用 Mihomo，请在固定代理节点上配置 dialer-proxy，指向能连通固定代理的现有中转。参照本仓库的模板做一份只绑定目标订阅的独立覆写。固定代理服务器地址、端口、认证信息先用占位符，我在本机的私用副本填写。

以下域名按 DOMAIN-SUFFIX 匹配，包括域名本身及子域名：
claude.ai
claude.com
anthropic.com
claudeusercontent.com
claude.app
claudemcpcontent.com
clau.de

用 DOMAIN 精确匹配 servd-anthropic-website.b-cdn.net。

让 Claude 规则优先于通用分流和 MATCH。先不加 siftscience.com 与 34.8.0.0/16。国内白名单和其他所有流量沿用原规则。固定出口不可用时，Claude 连接应该失败。固定代理仅支持 TCP 时，拒绝命中 Claude 规则的 UDP，避免走到其他出口。

启用后，请用实时连接记录验证 claude.ai 和 api.anthropic.com 实际命中的链路。优先使用 Claude 站点的 IP 回显，否则从明确绑定的同一出口链路测公网 IP。配置了多个候选中转时，请逐个验证。

请报告每项实际命中的规则、实际中转、测得的公网 IP、回显来源，以及它是否等于我的预期固定 IP。无法实测的项目请标注未验证。
```
