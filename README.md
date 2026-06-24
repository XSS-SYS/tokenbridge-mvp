# TokenBridge

**OpenAI-compatible API proxy for DeepSeek models. Change one line of code, get 5-10x cheaper LLM access.**

[![Live Demo](https://img.shields.io/badge/demo-tb-api.top-blue)](https://tb-api.top)
[![Docs](https://img.shields.io/badge/docs-english-green)](https://tb-api.top/docs.en.html)
[![Docs](https://img.shields.io/badge/docs-中文-red)](https://tb-api.top/docs.html)

---

## Quick Start

```bash
curl https://tb-api.top/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tb_test_free" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

No signup, no API key needed to try. The test key `tb_test_free` has 1M shared quota (5 req/min/IP).

---

## Why TokenBridge?

| | Direct DeepSeek | TokenBridge |
|---|---|---|
| **Integration** | Custom SDK, Chinese docs | Any OpenAI SDK, swap base_url |
| **Latency** | Slow from US/EU | CDN-cached, fast globally |
| **Payment** | Chinese payment methods | Credit card or USDT |
| **Cost** | ~$0.5/M tokens | **$29/mo for 100M tokens** |

---

## SDK Examples

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
// Set base URL via environment: OPENAI_BASE_URL=https://tb-api.top/v1
```

---

## Pricing

| Plan | Price | Tokens/mo | Model |
|---|---|---|---|
| **Pro Flash** | $29/mo | 100M | deepseek-chat / v4-flash |
| **Team Flash** | $99/mo | 500M | deepseek-chat / v4-flash |
| **Pro Pro** | $199/mo | 100M | deepseek-pro / v4-pro |

Overage: $0.40/M (Flash) / $0.30/M (Team). Quota resets monthly.

Payment: **Credit card** (Visa/Mastercard via Lemon Squeezy) or **USDT** (TRC-20).

---

## How to Get an API Key

1. Go to [tb-api.top](https://tb-api.top)
2. Select a plan
3. Enter your email
4. Pay with credit card or USDT
5. Receive your API key via email — instantly

[→ Docs](https://tb-api.top/docs.en.html) · [→ Usage Dashboard](https://tb-api.top/usage.html)

---

## Tech Stack

- **Backend:** Node.js + Fastify
- **Proxy:** HTTP streaming, transparent pass-through to DeepSeek API
- **Infrastructure:** Cloudflare Tunnel (no public IP needed)
- **Payments:** Lemon Squeezy + USDT TRC-20 on-chain verification

---

## License

MIT
