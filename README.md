  # TokenBridge

  **OpenAI-compatible API proxy for DeepSeek models. Change one line of code, get 5-10x cheaper LLM access.**

  [![Live Demo](https://img.shields.io/badge/demo-tb-api.top-blue)](https://tb-api.top)
  [![Docs EN](https://img.shields.io/badge/docs-english-green)](https://tb-api.top/docs.en.html)
  [![Docs 中文](https://img.shields.io/badge/docs-中文-red)](https://tb-api.top/docs.html)
  [![License](https://img.shields.io/badge/license-MIT-purple)](LICENSE)
  [![GitHub
stars](https://img.shields.io/github/stars/XSS-SYS/tokenbridge-mvp?style=social)](https://github.com/XSS-SYS/tokenbridge-mvp
)

  Pay with **USDT (TRC-20) or credit card** — no Chinese bank card or overseas credit card required.

  ---

  ## Quick Start

  Try it right now — no signup needed:

  ```bash
  curl https://tb-api.top/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer tb_test_free" \
    -d '{
      "model": "deepseek-chat",
      "messages": [{"role": "user", "content": "Hello!"}]
    }'
```

Test key: tb_test_free — 1M shared quota (5 req/min/IP).

────────────────────────────────────────────────────────────────────────────────

Why TokenBridge?

┌─────────────┬──────────────────────────────┬─────────────────────────────────────────────┐
│             │ Direct DeepSeek              │ TokenBridge                                 │
├─────────────┼──────────────────────────────┼─────────────────────────────────────────────┤
│ Integration │ Custom SDK, Chinese docs     │ Drop-in — swap base_url, use any OpenAI SDK │
├─────────────┼──────────────────────────────┼─────────────────────────────────────────────┤
│ Latency     │ Slow from US/EU              │ CDN-cached, fast globally                   │
├─────────────┼──────────────────────────────┼─────────────────────────────────────────────┤
│ Payment     │ Chinese payment methods only │ Credit card or USDT (TRC-20)                │
├─────────────┼──────────────────────────────┼─────────────────────────────────────────────┤
│ Cost        │ ~$0.50/M tokens              │ $29/mo for 100M tokens                      │
└─────────────┴──────────────────────────────┴─────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────────────

SDK Examples

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

  client := openai.NewClient(openai.WithHead er("Authorization", "Bearer your_key_here"))
  // Set base URL via environment: OPENAI_BASE_URL=https://tb-api.top/v1
```

────────────────────────────────────────────────────────────────────────────────

Pricing

┌────────────┬─────────┬───────────┬──────────────────────────┐
│ Plan       │ Price   │ Tokens/mo │ Model                    │
├────────────┼─────────┼───────────┼──────────────────────────┤
│ Pro Flash  │ $29/mo  │ 100M      │ deepseek-chat / v4-flash │
├────────────┼─────────┼───────────┼──────────────────────────┤
│ Team Flash │ $99/mo  │ 500M      │ deepseek-chat / v4-flash │
├────────────┼─────────┼───────────┼──────────────────────────┤
│ Pro Pro    │ $199/mo │ 100M      │ deepseek-pro / v4-pro    │
└────────────┴─────────┴───────────┴──────────────────────────┘

Overage: $0.40/M (Flash) / $0.30/M (Team). Quota resets monthly.

Payment: Credit card (Visa/Mastercard via Lemon Squeezy) or USDT (TRC-20).

────────────────────────────────────────────────────────────────────────────────

How to Get an API Key

1. Go to tb-api.top
2. Select a plan
3. Enter your email
4. Pay with credit card or USDT
5. Receive your API key via email — instantly

→ Docs · → Usage Dashboard

────────────────────────────────────────────────────────────────────────────────

Project Structure

```
  tokenbridge-mvp/
  ├── index.mjs           # Main server (Fastify)
  ├── package.json
  ├── pay.html            # Payment page
  ├── docs.html           # API docs
  ├── admin.html          # Admin panel
  ├── dashboard.html      # Usage dashboard
  ├── data/               # API keys, payments, stats
  └── assets/             # Icons, logos
```

────────────────────────────────────────────────────────────────────────────────

Tech Stack

- Backend: Node.js + Fastify
- Proxy: HTTP streaming, transparent pass-through to DeepSeek API
- Infrastructure: Cloudflare Tunnel (no public IP needed)
- Payments: Lemon Squeezy + USDT TRC-20 on-chain verification

────────────────────────────────────────────────────────────────────────────────

License

MIT