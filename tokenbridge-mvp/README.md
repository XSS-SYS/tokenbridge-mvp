# TokenBridge

**OpenAI-compatible API proxy for DeepSeek models. Pay with USDT from anywhere.**

[![Live Demo](https://img.shields.io/badge/demo-tb-api.top-blue)](https://tb-api.top)
[![Docs EN](https://img.shields.io/badge/docs-english-green)](https://tb-api.top/docs.en.html)
[![Docs 中文](https://img.shields.io/badge/docs-中文-red)](https://tb-api.top/docs.html)
[![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/XSS-SYS/tokenbridge-mvp?style=social)](https://github.com/XSS-SYS/tokenbridge-mvp)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/XSS-SYS/tokenbridge-mvp/pulls)

**No Chinese bank account, no overseas payment method needed. Just swap your base URL and go.**

---

## Try It Now

```bash
# No signup needed — use the test key
curl https://tb-api.top/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tb_test_free" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

> Test key: `tb_test_free` — 1M shared quota, 5 req/min/IP

---

## Why TokenBridge?

| | Direct DeepSeek | TokenBridge |
|---|---|---|
| **Integration** | Custom SDK, Chinese docs | Drop-in — swap `base_url`, use any OpenAI SDK |
| **Latency** | Slow from US/EU | CDN-cached, fast globally |
| **Payment** | Chinese payment methods only | **USDT (TRC-20)** |
| **Cost** | ~$0.50/M tokens | **$29/mo for 100M tokens** |

### The Problem

DeepSeek is excellent — but if you're outside China, you can't pay with foreign payment methods, Alipay, or WeChat Pay. 

TokenBridge wraps it in an OpenAI-compatible API and lets you pay with what you actually have. One line of code change. Done.

---

## Feature Highlights

- ✅ **Drop-in replacement** — OpenAI SDK compatible, change `base_url` only
- ✅ **Pay with USDT (TRC-20)** — on-chain verification, arrives in ~3 minutes
- ✅ **No Chinese account needed** — no local bank account, no phone number
- ✅ **Instant API key delivery** — via email, right after payment
- ✅ **Test before buying** — free test key, no signup

---

## SDK Examples

Change one line. Works with any OpenAI SDK.

### Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="your_key_here",
    base_url="https://tb-api.top/v1"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

### Node.js

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your_key_here',
  baseURL: 'https://tb-api.top/v1',
});

const response = await client.chat.completions.create({
  model: 'deepseek-chat',
  messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(response.choices[0].message.content);
```

### Go

```go
import "github.com/openai/openai-go"

client := openai.NewClient(openai.WithHeader("Authorization", "Bearer your_key_here"))
// Override base URL via env: OPENAI_BASE_URL=https://tb-api.top/v1
```

---

## Pricing

| Plan | Price | Tokens/mo | Model |
|---|---|---|---|
| **Pro Flash** | **$29/mo** | 100M | deepseek-chat / v4-flash |
| **Team Flash** | **$99/mo** | 500M | deepseek-chat / v4-flash |
| **Pro Pro** | **$199/mo** | 100M | deepseek-pro / v4-pro |

_Overage: $0.40/M (Flash), $0.30/M (Team). Quota resets monthly._

₿ USDT (TRC-20) — on-chain verification, instant activation

---

## How to Get an API Key

1. Go to [tb-api.top](https://tb-api.top)
2. Select a plan
3. Enter your email
4. Pay with USDT (TRC-20)
5. Receive your API key via email — instantly

| Resource | Link |
|---|---|
| 📖 Documentation (EN) | [tb-api.top/docs.en.html](https://tb-api.top/docs.en.html) |
| 📖 文档 (中文) | [tb-api.top/docs.html](https://tb-api.top/docs.html) |
| 📊 Usage Dashboard | [tb-api.top/usage.html](https://tb-api.top/usage.html) |
| 💳 Buy API Key | [tb-api.top/pay.html](https://tb-api.top/pay.html) |

---

## Project Structure

```
tokenbridge-mvp/
├── index.mjs              # Main server (Fastify)
├── package.json
├── admin.html              # Admin panel
├── dashboard.html          # Usage dashboard
├── pay.html                # Payment page
├── pay-success.html        # Post-payment confirmation
├── docs.html               # API docs (中文)
├── docs.en.html            # API docs (English)
├── usage.html              # Token usage page
├── index.html              # Landing page
├── index.zh.html           # Landing page (中文)
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── _check_payout.mjs       # Payout verification script
├── data/                   # API keys, payments, stats (JSON)
├── assets/                 # Icons, logos
├── scripts/                # Watchdog, deployment scripts
├── promo/                  # Marketing materials
└── tweets/                 # Social media content
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Fastify |
| **API Proxy** | HTTP streaming, transparent pass-through to DeepSeek API |
| **Infrastructure** | Cloudflare Tunnel (no public IP needed) |
| **Payments** | USDT TRC-20 on-chain verification (TronGrid) |
| **Notifications** | 163 SMTP email (instant API key delivery) |

---

## Self-Hosting

Want to run your own instance?

1. Clone this repo
2. `npm install`
3. Copy `.env.example` → `.env` and fill in your config
4. `node index.mjs`

You'll need API keys for:
- DeepSeek (upstream provider)
- TronGrid (USDT verification)
- 163 SMTP (email delivery)

---

## Star History

If you find this project useful, [give it a star ⭐](https://github.com/XSS-SYS/tokenbridge-mvp) — it helps more developers discover it.

---

## Contributing

PRs and issues are welcome! Ideas we'd love help with:

- [ ] New payment methods (Solana, BTC)
- [ ] More model providers (Claude, Gemini)
- [ ] Better docs & translations
- [ ] Performance tuning
- [ ] Usage analytics dashboard

---

## License

[MIT](LICENSE) — free to use, modify, and share.
