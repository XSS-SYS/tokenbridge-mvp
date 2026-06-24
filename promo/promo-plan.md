# TokenBridge 推广执行计划

> 标题：一站式 AI API 中心，价格低 95%
> 核心定位：开发者只需要一个 API Key，就能以 GPT-4o 的 1/20 价格调用顶级模型
> 时间：2026年6月15日（周一）起
> 目标：周期 3 周内获得 ≥ 50 个真实用户注册（付费或至少测试过）

---

## 📊 核心数据看板

每次推广后，在这个表格里记录结果：

| 日期 | 渠道 | 帖子标题 | 展示量 | 点击/访问 | 新增API调用 | 新增付费 | 收入 |
|------|------|----------|--------|-----------|------------|---------|------|
|      |      |          |        |           |            |         |      |
|      |      |          |        |           |            |         |      |

**收益计算公式：** 每 1 个付费用户 ≈ $29-$199/月
**核心指标（KPI）：** 日活跃 API 调用数、日新增注册/测试、付费转化率

---

## 📋 第一阶段：周一至周三 — 基础建设（同时进行）

### 🅰️ 补齐产品短板（1-2天搞定）

在开始大规模推广前，先确保产品能接住流量：

- [ ] **1. 增加体验 Key 展示**：在 `tb-api.top` 首页更显眼地展示 `tb_test_free` 的 curl 示例，让访客 30 秒内能跑通
- [ ] **2. 增加模型列表页**：目前首页用户不知道"有什么模型可以用"，加一个 `/models` 页面列出所有可用模型、定价、速度对比
- [ ] **3. 增加使用量统计 API**：让用户能通过 API 查自己用了多少 token（减少客服负担）
- [ ] **4. 注册引导优化**：`pay.html` 增加免费试用引导（"不想先付钱？用测试 Key 体验 10 秒"）

### 🅱️ 准备好推广素材（半天）

- [ ] **5. 准备一张产品截图**：截一个 curl 在终端运行的图 + 一个 Dashboard 截图（用于 Reddit/HN）
- [ ] **6. 准备好 3 个"用后感"片段**：比如用 TokenBridge 前后的 API 账单对比截图

**产出：「马上就能用」的冲动。**

---

## 📋 第二阶段：周三至周末 — 第一波发布（高强度）

### 🎯 目标：打透 2-3 个渠道，每天花 30 分钟

---

### 🔥 **渠道 1：Hacker News（周三发，最高 ROI）**

**发帖账号：** `xss2026`（此时已养号 12 天，尽快蹭到 2 周整）
**发帖时间：** 北京时间 21:00（美东 9:00，最佳曝光窗口）

**标题（选一个）：**
- **A** (推荐)：*Show HN: TokenBridge – One API Key for All LLMs, 95% Cheaper Than GPT-4o*
- **B** (备选)：*Show HN: I Built an AI API Hub – $29/mo for 100M Tokens, OpenAI-Compatible*

**正文模板：**

```
TokenBridge is a unified API hub for LLMs. One base_url, one API key, access to DeepSeek and more models at a fraction of OpenAI pricing.

Try it in 10 seconds (no signup, no payment):

curl https://tb-api.top/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello!"}]}'

That's it. Works with ANY OpenAI SDK (Python, Node, Go, Java, etc.)

The market is flooded with cheap inference providers, but they all require:
• New SDKs to learn
• New API clients to install
• Region-specific accounts (China-based)

TokenBridge fixes this. It's a drop-in proxy.

Pricing:
• Pro Flash: $29/mo – 100M tokens (deepseek-chat)
• Team Flash: $99/mo – 500M tokens
• Pro Pro: $199/mo – 100M tokens (deepseek-pro)

Additional models coming soon. Ideas welcome.

Why I built this: I was tired of managing multiple API keys for different providers. I wanted ONE key, ONE endpoint, and the cheapest prices possible. So I built it.

Payment: Credit card (Lemon Squeezy) or USDT (TRC-20).
Docs: https://tb-api.top/docs.en.html

Feedback wanted on pricing and the overall experience. Thanks!

```

**效果追踪：**
- 发后 2 小时、6 小时、24 小时查看 HN 帖子状态
- 截图留存（评论数、点赞数、任何反馈）
- 观察服务器日志的 API 调用量变化
- 🔴 **若再次被 dead** → 立即执行渠道 2

---

### 🔥 **渠道 2：Reddit 多个子版块（当天同步发）**

**发帖账号：** 准备 1 个 Reddit 老号（若无，现注册的号需要 3-7 天养）
**发帖时间：** 与 HN 同一天，或第二天

**目标 subreddits（按优先级）：**

| Subreddit | 规则 | 标题风格 |
|-----------|------|----------|
| r/SideProject | 展示个人项目（最友好） | "I built an …" |
| r/SaaS | B2B 风格 | "Launched a SaaS …" |
| r/OpenAI | 开发者向 | 价格对比 + 技术细节 |
| r/deeplearning | 学术/工程向 | 成本优化角度 |
| r/programming | 注意规则严，贴帖子要谨慎 | 纯技术角度 |

**Reddit 帖子模板（r/SideProject 版）：**

```
Title: I built an OpenAI-compatible API hub that cuts your LLM costs by 95%

Body:

I got tired of paying $10+/M tokens for GPT-4o. DeepSeek is fantastic and 10x cheaper, but accessing it from outside China is a pain.

So I built TokenBridge – a simple API proxy that:
• Works with any OpenAI SDK (change base_url, that's it)
• Routes to DeepSeek and other models
• Costs $29/mo for 100M tokens (vs ~$1,500+ for equivalent GPT-4o usage)
• No China account needed – just a credit card or USDT

Try it right now with a public test key:

curl https://tb-api.top/v1/chat/completions \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hi"}]}'

10 seconds, no signup. That's the whole point.

Would love your feedback. What models would you want added?
```

**效果追踪：**
- 记录每个帖子的 upvote 数、评论数
- 观察 Reddit 引流过来的访问 IP 数量
- 对比 HN 和 Reddit 哪个来源的注册转化率高

---

### 🔥 **渠道 3：Product Hunt（选做，高投入高回报）**

**条件：** 需要准备 Landing Page 截图 + Logo + 一句话描述
**适合时间：** HN/Reddit 效果不错后再上 PH

**备选方案：** 不投 PH，而是利用 PH 的 Maker 社区在 Twitter/X 上发帖

---

## 📋 第三阶段：第二周 — 持续加热 + 转化优化

### 🅰️ 跟进反馈
- [ ] 回复所有 HN/Reddit 上的评论，收集价格、模型、使用体验反馈
- [ ] 根据反馈调整定价或功能（比如用户要求加什么模型）
- [ ] 将用户反馈截图作为"社会证明"发到社交媒体

### 🅱️ 启动 SEO/内容营销
- [ ] 写一篇 Medium/Dev.to 博客：《How We Cut Our API Costs by 95% with One Line of Code》
- [ ] 发到 r/programming 和 r/OpenAI
- [ ] 优化 `tb-api.top` 的 SEO 基础（Title, Description, OG tags）

### 🅲 Twitter/X 持续发帖
- [ ] 每天发 1-2 条推文，内容交替：
  - 使用技巧（"用 Python 一行切换模型"）
  - 价格对比图（"GPT-4o vs DeepSeek: 价格差多少"）
  - 用户反馈截图（如果有的话）
  - 新功能发布
- [ ] 带话题：#buildinpublic #indiehackers #AI #LLM

---

## 📋 第四阶段：第三周 — 收割 + 复盘

### 🅰️ 用户留存
- [ ] 给已注册用户发邮件（可用 163 手动发），询问使用体验
- [ ] 推出 "推荐朋友，双方各得 10% 额度" 的 referral 计划

### 🅱️ 数据分析复盘

回答这 5 个问题：
1. 哪个渠道带来的用户最多？
2. 哪个渠道的转化率最高？
3. 付费用户和免费测试用户的比例是多少？
4. 用户主要在用哪个模型？
5. 单用户平均 token 消耗量是多少？

### 🅲 决定下一步
- **如果用户量 ≥ 50 且收入 ≥ $500/月** → 继续加模型、优化产品
- **如果用户量 < 20** → 重新思考定位和定价，换个角度再试

---

## 📋 养号检查清单

### HN (`xss2026`)
| 事项 | 状态 |
|------|------|
| 每天上 HN 逛 20 分钟，给帖子点赞 | ☐ |
| 每天留 1-2 条有质量的评论 | ☐ |
| 账号目标：2 周 + karma ≥ 10 | ☐ 已 7 天/karma=1 |
| 预定发帖日：6月17日（周三）或 6月18日（周四） | ☐ |

### Reddit（如果注册新号）
| 事项 | 状态 |
|------|------|
| 注册账号，设置头像和简介 | ☐ |
| 先在 r/SideProject 回几个帖刷存在感 | ☐ |
| 养 3-7 天后再发帖 | ☐ |

---

## 🔄 每日执行清单（推广期间）

每天早上花 15 分钟：
- [ ] 看 HN 和 Reddit 帖子有没有新评论 → 回复
- [ ] 检查服务器日志 → 记录新增 API 调用数
- [ ] 更新数据看板表格
- [ ] 规划今天要发的 1 条推文或帖子

---

## 📈 预期效果底线

| 时间 | 最低目标 | 理想目标 |
|------|---------|---------|
| 第一周 | 500+ API 调用（含测试） | 5,000+ API 调用 |
| 第一周 | 0-5 个付费用户 | 10+ 付费用户 |
| 第一周 | $0-$145 收入 | $290+ 收入 |
| 第三周 | 10 个付费用户 | 50+ 付费用户 |
| 第三周 | $290+ 月收入 | $1,450+ 月收入 |

---

*这份文档会根据实际效果持续更新。每推广一次，就更新一次数据。*
