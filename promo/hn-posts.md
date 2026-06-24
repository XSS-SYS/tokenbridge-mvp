# TokenBridge 推广材料

## Show HN 帖子（账号养熟后发）

### 备选标题（按推荐顺序）

**A** (推荐 — 价格对比，直接冲击)
> Show HN: TokenBridge – Swap your OpenAI base_url, cut API costs by 90%

**B** (推荐 — 简洁明了，卖点直给)
> Show HN: TokenBridge – $29/mo for 100M DeepSeek tokens, OpenAI-compatible

**C** (备选 — 强调痛点+解决方案)
> Show HN: TokenBridge – One line of code, 95% cheaper LLM API than GPT-4o

**正文：**

TokenBridge is an API proxy that routes your OpenAI-format requests to DeepSeek's models. You just change one line – your base URL.

Try it now (no signup, no API key needed):

```
curl https://tb-api.top/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello!"}]}'
```

That's it. Works with any OpenAI SDK in any language.

Pricing (all monthly, quota resets each month):
- Pro Flash: $29/mo – 100M tokens (deepseek-chat / v4-flash)
- Team Flash: $99/mo – 500M tokens (deepseek-chat / v4-flash)
- Pro Pro: $199/mo – 100M tokens (deepseek-pro / v4-pro)

What you get vs calling DeepSeek directly:
- No need to manage a China-based API account
- Faster access from US/EU (CDN-cached)
- Same SDK, same code – just swap the base URL
- Email delivery of API keys
- Usage dashboard with real-time tracking

Payment: Credit card (Lemon Squeezy) or USDT (TRC-20).
Docs: https://tb-api.top/docs.en.html
GitHub: (if you want to make it public)

This is a side project. I built it because I wanted cheaper API access without the hassle of managing multiple API keys and regional restrictions. It's been running for a few weeks and handling real requests.

Would love any feedback – especially on the pricing and the onboarding flow.

---

## Reddit r/SideProject 帖子

**标题：**
I built an OpenAI-compatible API proxy that costs $29/mo for 100M tokens. Just change your base URL.

**正文：**
I got tired of paying $10+/M tokens for GPT-4o. DeepSeek is actually really good and much cheaper, but the API access from outside China is slow and annoying to set up.

So I built TokenBridge – a simple proxy that:
- Accepts standard OpenAI API calls (SDK compatible)
- Routes to DeepSeek models
- Costs $29/mo for 100M tokens
- Sends your API key to your email after purchase

You can test it right now with a public key:
```
curl https://tb-api.top/v1/chat/completions \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello"}]}'
```

It's just a side project I've been working on. Would love to hear what you think!

---

## Twitter / X 帖子模板

**Thread 1:**
Need LLM API access on a budget? 🧵

I built TokenBridge – an OpenAI-compatible proxy for DeepSeek models.

$29/mo for 100M tokens. No setup. Just change your base URL.

Test it in 10 seconds (no signup):
curl https://tb-api.top/v1/chat/completions \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hi"}]}'

Works with Python, Node.js, Go, Java, any language with an OpenAI SDK.

Payment: Credit card or USDT.

https://tb-api.top

Built as a side project. Solo dev. Would love your feedback.

---

## Reddit r/OpenAI 帖子

**标题：**
OpenAI pricing too high? I built a $29/mo proxy for DeepSeek (OpenAI-compatible API)

**正文：**
DeepSeek is about 5-10x cheaper than GPT-4o and honestly holds up pretty well for most tasks. The problem is getting easy API access from outside China.

TokenBridge solves that. It's a simple proxy:
- Full OpenAI SDK compatibility (change base_url, that's it)
- Routes through a CDN for US/EU performance
- $29-199/mo with various token quotas
- API key delivered to your email after purchase

Public test key available (no registration):
```
curl https://tb-api.top/v1/chat/completions \
  -H "Authorization: Bearer tb_test_free" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello"}]}'
```

Docs: https://tb-api.top/docs.en.html

Not trying to sell anything – just sharing what I built. Thoughts?
