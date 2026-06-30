# TokenBridge 推广计划

> 更新时间：2026-06-24
> 状态：GitHub 仓库已上线，推文已发 2 条

---

## 渠道策略

### 1. Twitter/X — @ji_yu37215（雨季）

**养号节奏：** 每天 1-2 条，低频自然

| 天数 | 日期 | 类型 | 状态 |
|------|------|------|------|
| Day 1 | 6/23 | 产品评价型 — DeepSeek V4 好用但充值难 | ✅ 已发 |
| Day 2 | 6/24 | 故事型 — 凌晨断粮，USDT 3分钟救场 | ✅ 已发 |
| Day 3 | 6/25 | **技术对比型** — DeepSeek V4 vs GPT-4 vs Claude，性价比对比 | ⏳ 待发 |
| Day 4 | 6/26 | **用户案例型** — 开发者/小团队的省钱故事 | ⏳ 待发 |
| Day 5 | 6/27 | **总结/Call to Action** — 开源了，自己看代码 | ⏳ 待发 |

**推文优化要点：**
- 真实故事 + 情绪曲线 + 细节画面 + 反差收尾
- 末尾附链接 → GitHub 仓库（已开源）
- 发推后在评论区补 GitHub 链接

---

### 2. Hacker News — Show HN

**发布时间：** 建议 Day 5（6/27）或 GitHub 仓库完善后立即发
**最佳时间窗口：** 美国东部时间早上 9-11 点（北京时间晚 9-11 点）

**Show HN 帖子框架：**

```
Title: Show HN: TokenBridge – OpenAI-compatible API proxy, pay with USDT

Body:
TokenBridge wraps DeepSeek models in an OpenAI-compatible API.
Change one line of code (base_url), keep your existing OpenAI SDK.

Why I built this:
DeepSeek is excellent (especially V4), but if you're outside China,
recharging is a nightmare — no international credit cards, no Alipay.

TokenBridge solves this:
• OpenAI-compatible (swap base_url, done)
• Pay with USDT (TRC-20)
• $29/mo for 100M tokens vs ~$50/M direct
• Global CDN caching
• Open source (MIT)

Quick start:
curl https://tb-api.top/v1/chat/completions \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello!"}]}'

Test key with 1M shared quota — no signup needed.

https://github.com/XSS-SYS/tokenbridge-mvp
```

---

### 3. GitHub 自然流量

**优化项（已完成 ✅）：**
- ✅ 完整 README（英文）
- ✅ MIT 许可证
- ✅ 清晰的定价表
- ✅ SDK 示例代码
- ✅ GitHub 徽章（Demo / Docs / License）

**待优化：**
- ⏳ 添加 `.env.example` 模板
- ⏳ 补充贡献指南（CONTRIBUTING.md）
- ⏳ 发布 Release 版本（v0.1.0）

---

### 4. 其他渠道（后续考虑）

- **Reddit** — r/deepseek, r/SideProject, r/programming
- **Dev.to** — 写一篇"我是怎么解决境外支付 DeepSeek 问题的"技术博客
- **Product Hunt** — 等用户基础上去后再考虑

---

## 每日检查清单

### 早上（09:00 CST）
1. 检查 TokenBridge 服务在线（tb-api.top）
2. 查看推文数据（展示、互动、点击）
3. 回复评论区/私信

### 晚間（21:00 CST）
1. 发当日推文
2. 推文回复 GitHub 链接
3. 检查服务日志

---

## 指标目标（第一周）

- Twitter：100+ 展示/推文，10+ 互动/推文
- GitHub：5+ Stars
- Show HN：10+ upvotes
- 注册用户：2-5 个付费用户
