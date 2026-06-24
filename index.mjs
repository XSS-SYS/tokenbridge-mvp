import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// ===== Lemon Squeezy 配置 =====
const LS_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '386430';
const LS_PRODUCT_ID = process.env.LEMONSQUEEZY_PRODUCT_ID || '1085016';

// 变体 ID 映射（套餐 ID → Lemon Squeezy Variant ID）
// 这些 ID 从后台获取，必须与实际创建的 Variant 匹配
const VARIANT_MAP = {
  'default':    '1744913',
  'pro-flash':  '1744913',
  'team-flash': '1745081',
  'pro-pro':    '1745116',
  'topup-10':   '1744913',
  'topup-50':   '1745081',
  'topup-100':  '1745116',
};

function hasLemonSqueezy() {
  return !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}

// ===== API Key 管理（内存 + JSON 持久化） =====
const KEYS_FILE = path.join(__dirname, 'data', 'api-keys.json');
const PAYMENTS_FILE = path.join(__dirname, 'data', 'payments.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');
import fs from 'fs';

function ensureDir(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJson(file, defaultVal) {
  try {
    ensureDir(file);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.log(`  ⚠️ 无法读取 ${file}，使用默认值`);
  }
  return defaultVal;
}

function saveJson(file, data) {
  ensureDir(file);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

let apiKeys = loadJson(KEYS_FILE, {});

function ensureDefaultKeys() {
  const defaults = {
    [process.env.ADMIN_API_KEY || '123456']: {
      name: '管理员', used_tokens: 0, quota_tokens: null,
      enabled: true, created_at: new Date().toISOString(), plan: 'admin',
    },
    'tb_test_free': {
      name: '公共测试 Key', used_tokens: 0, quota_tokens: 1_000_000,
      enabled: true, created_at: new Date().toISOString(), plan: 'test',
    },
  };
  for (const [key, info] of Object.entries(defaults)) {
    if (!apiKeys[key]) apiKeys[key] = info;
  }
  saveJson(KEYS_FILE, apiKeys);
}
ensureDefaultKeys();

let payments = loadJson(PAYMENTS_FILE, []);

// ===== 套餐定价 =====
const PLANS = {
  'pro-flash':   { name: 'Pro Flash',          amount: 2900,  tokens: 100_000_000, desc: '100M tokens/月 v4-flash',       usd: 29 },
  'team-flash':  { name: 'Team Flash',         amount: 9900,  tokens: 500_000_000, desc: '500M tokens/月 v4-flash',       usd: 99 },
  'pro-pro':     { name: 'Pro Pro',            amount: 19900, tokens: 100_000_000, desc: '100M tokens/月 v4-pro',         usd: 199 },
  'topup-10':    { name: '10M 充值包',         amount: 500,   tokens: 10_000_000,  desc: '一次性充值，永不过期',           usd: 5.00 },
  'topup-50':    { name: '50M 充值包',         amount: 2200,  tokens: 50_000_000,  desc: '一次性充值，永不过期',           usd: 22.00 },
  'topup-100':   { name: '100M 充值包',        amount: 3900,  tokens: 100_000_000, desc: '一次性充值，永不过期',           usd: 39.00 },
};

// ===== 订阅制逻辑：月套餐重置额度，充值包叠加 =====
const MONTHLY_PLANS = ['pro-flash', 'team-flash', 'pro-pro'];

/**
 * 将套餐额度应用到现有 Key
 * @param {object} keyInfo — apiKeys[key] 对象
 * @param {string} planId — 套餐 ID（如 'pro-flash', 'topup-10'）
 * @param {number} tokens — 套餐 token 数
 */
function applyPlanQuota(keyInfo, planId, tokens) {
  if (MONTHLY_PLANS.includes(planId)) {
    // 月套餐：重置额度（续费归零，重新计算）
    keyInfo.quota_tokens = tokens;
    keyInfo.used_tokens = 0;
    // 记录续费时间，用于前端显示
    keyInfo.renewed_at = new Date().toISOString();
  } else {
    // 充值包：额度永久叠加
    keyInfo.quota_tokens = (keyInfo.quota_tokens || 0) + tokens;
  }
}

const server = Fastify({ logger: false });

await server.register(cors, { origin: '*' });

// ===== 根路径 → 首页 =====
server.get('/', async (request, reply) => {
  reply.redirect('/index.html');
});

// 中文首页独立入口
server.get('/zh', async (request, reply) => {
  reply.redirect('/index.zh.html');
});

// ===== 静态文件服务（禁用缓存） =====
await server.register(fastifyStatic, {
  root: __dirname,
  prefix: '/',
  cacheControl: false,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
});

// ===== 注入配置到前端 =====
server.get('/api/config', async () => ({
  publishableKey: process.env.LEMONSQUEEZY_API_KEY ? 'ls_test' : 'demo',
  plans: Object.entries(PLANS).map(([id, cfg]) => ({ id, ...cfg })),
  payment_mode: hasLemonSqueezy() ? 'lemonsqueezy' : 'demo',
  has_paypal: false,
  has_usdt: hasUsdtPayment(),
  usdt_address: hasUsdtPayment() ? USDT_WALLET_ADDRESS : '',
  usdt_chain: USDT_CHAIN,
}));

// ===== Key 鉴权中间件 =====
function validateApiKey(request, reply) {
  const auth = request.headers.authorization;
  if (!auth) {
    reply.status(401).send({ error: 'unauthorized', message: 'Missing Authorization header' });
    return false;
  }
  const key = auth.replace(/^Bearer\s+/i, '').trim();
  const keyInfo = apiKeys[key];
  if (!keyInfo || !keyInfo.enabled) {
    reply.status(401).send({ error: 'unauthorized', message: 'API Key 无效或已禁用' });
    return false;
  }
  return key;
}

function isAdminKey(key) {
  const info = apiKeys[key];
  return info && info.plan === 'admin';
}

// ===== 模型路由映射 =====
// All models are powered by DeepSeek V4 Flash under the hood.
// See https://tb-api.top/terms.html for details.
const MODEL_MAP = {
  'deepseek-chat':        { upstream: 'deepseek', model: 'deepseek-chat' },
  'deepseek':             { upstream: 'deepseek', model: 'deepseek-chat' },
  'deepseek-v4-flash':    { upstream: 'deepseek', model: 'deepseek-chat' },
};

function routeModel(model) {
  return MODEL_MAP[model] || MODEL_MAP['deepseek-chat'];
}

async function callDeepSeek(messages) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({ model: 'deepseek-chat', messages }),
  });
  if (!response.ok) {
    throw new Error(`DeepSeek error (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

// ===== 统计（持久化） =====
const STATS_SAVE_INTERVAL = 30000; // 30 秒

function loadStats() {
  const saved = loadJson(STATS_FILE, null);
  if (saved && saved.startTime) {
    // 恢复上次的统计数据
    saved.startTime = saved.startTime; // 保留原始启动时间

    // 从 apiKeys 恢复各 Key 的用量
    if (!saved.byKeyId) saved.byKeyId = {};
    for (const [key, info] of Object.entries(apiKeys)) {
      if (info.used_tokens > 0) {
        const keyId = key.slice(0, 10) + '...';
        if (!saved.byKeyId[keyId]) {
          saved.byKeyId[keyId] = { requests: 0, tokens: 0, cost: 0, ips: [], lastRequest: '' };
        }
        // 确保 tokens 至少与 used_tokens 一致（可能比实际少，但不丢失）
        if (saved.byKeyId[keyId].tokens < info.used_tokens) {
          saved.byKeyId[keyId].tokens = info.used_tokens;
        }
      }
    }

    return saved;
  }
  // 首次启动或文件损坏：从 apiKeys 反算
  const fresh = {
    totalRequests: 0, totalTokens: 0, totalCost: 0,
    todayRequests: 0, todayTokens: 0, todayCost: 0,
    todayDate: new Date().toISOString().slice(0, 10),
    byModel: {},
    byKeyId: {},
    startTime: new Date().toISOString(),
  };
  for (const [key, info] of Object.entries(apiKeys)) {
    if (info.used_tokens > 0) {
      const keyId = key.slice(0, 10) + '...';
      fresh.byKeyId[keyId] = {
        requests: 1, tokens: info.used_tokens,
        cost: (info.used_tokens / 1000000) * 0.15,
        ips: [], lastRequest: info.created_at || '',
      };
      fresh.totalTokens += info.used_tokens;
      fresh.totalRequests++;
    }
  }
  return fresh;
}

let stats = loadStats();

function saveStats() {
  saveJson(STATS_FILE, stats);
}

function record(apiKey, model, tokens, clientIp) {
  const cost = (tokens / 1000000) * 0.15;
  const now = new Date().toISOString().slice(0, 10);
  if (now !== stats.todayDate) {
    stats.todayRequests = 0; stats.todayTokens = 0; stats.todayCost = 0;
    stats.todayDate = now;
  }
  stats.totalRequests++;
  stats.totalTokens += tokens;
  stats.totalCost += cost;
  stats.todayRequests++;
  stats.todayTokens += tokens;
  stats.todayCost += cost;
  stats.byModel[model] = (stats.byModel[model] || 0) + tokens;

  if (apiKeys[apiKey]) {
    apiKeys[apiKey].used_tokens = (apiKeys[apiKey].used_tokens || 0) + tokens;
  }

  const keyId = apiKey.slice(0, 10) + '...';
  if (!stats.byKeyId[keyId]) {
    stats.byKeyId[keyId] = { requests: 0, tokens: 0, cost: 0, ips: [], lastRequest: '' };
  }
  stats.byKeyId[keyId].requests++;
  stats.byKeyId[keyId].tokens += tokens;
  stats.byKeyId[keyId].cost += cost;
  if (!stats.byKeyId[keyId].ips.includes(clientIp)) stats.byKeyId[keyId].ips.push(clientIp);
  stats.byKeyId[keyId].lastRequest = new Date().toISOString();
}

function saveKeys() {
  saveJson(KEYS_FILE, apiKeys);
}
setInterval(saveKeys, 60000);
setInterval(saveStats, STATS_SAVE_INTERVAL);

function generateApiKey() {
  return 'tb_' + crypto.randomBytes(24).toString('hex');
}

// ===== 管理员端点 =====
server.get('/admin/api-keys', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  return { keys: Object.entries(apiKeys).map(([key, info]) => ({ key, ...info })) };
});

server.post('/admin/api-keys', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  const { name, quota_tokens, email, plan } = request.body || {};
  const newKey = generateApiKey();
  apiKeys[newKey] = {
    name: name || '未命名',
    quota_tokens: quota_tokens || 10_000_000,
    used_tokens: 0, enabled: true,
    created_at: new Date().toISOString(),
    email: email || '', plan: plan || 'custom',
  };
  saveKeys();
  return { key: newKey, info: apiKeys[newKey] };
});

server.patch('/admin/api-keys/:keyId', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  const targetKey = request.params.keyId;
  if (!apiKeys[targetKey]) return reply.status(404).send({ error: 'Key not found' });
  const { enabled } = request.body || {};
  if (typeof enabled === 'boolean') apiKeys[targetKey].enabled = enabled;
  saveKeys();
  return { key: targetKey, info: apiKeys[targetKey] };
});

server.delete('/admin/api-keys/:keyId', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  const targetKey = request.params.keyId;
  if (!apiKeys[targetKey]) return reply.status(404).send({ error: 'Key not found' });
  delete apiKeys[targetKey];
  saveKeys();
  return { deleted: targetKey };
});

server.get('/admin/payments', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  return { payments: payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) };
});

server.get('/admin/stats', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  return {
    ...stats,
    estimated_revenue_usd: Math.round(stats.totalTokens / 1000000 * 1.20 * 100) / 100,
    estimated_revenue_cny: Math.round(stats.totalTokens / 1000000 * 1.20 * 7.2 * 100) / 100,
    tunnel_url: process.env.TUNNEL_URL || 'https://realtors-dive-moisture-documented.trycloudflare.com',
    key_count: Object.keys(apiKeys).length,
    active_key_count: Object.values(apiKeys).filter(k => k.enabled).length,
    payments_count: payments.length,
    payments_total_usd: payments.reduce((s, p) => s + (p.amount_usd || 0), 0),
  };
});

server.get('/admin/all-stats', async (request, reply) => {
  const authKey = validateApiKey(request, reply);
  if (!authKey) return;
  if (!isAdminKey(authKey)) return reply.status(403).send({ error: 'forbidden' });
  return {
    stats,
    apiKeys: Object.entries(apiKeys).map(([key, info]) => ({ key, ...info })),
    payments: payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
  };
});

// ===== API 端点 =====
server.get('/v1/models', async (request, reply) => {
  const key = validateApiKey(request, reply);
  if (!key) return;
  return {
    object: 'list',
    data: Object.keys(MODEL_MAP).map((id, i) => ({
      id, object: 'model', created: 1712345678 + i, owned_by: 'tokenbridge',
    })),
  };
});

server.post('/v1/chat/completions', async (request, reply) => {
  const key = validateApiKey(request, reply);
  if (!key) return;

  const { model, messages } = request.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return reply.status(400).send({ error: 'messages is required' });
  }

  const keyInfo = apiKeys[key];

  // 公共测试 Key 限流（每 IP 每分钟 5 次）
  if (key === TEST_KEY_ID) {
    const clientIp = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const rateCheck = checkTestKeyRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return reply.status(429).send({
        error: 'rate_limited',
        message: `Test key 已达到每分钟上限（${rateCheck.used}/${rateCheck.limit}），请稍后重试或获取专属 Key`,
        used: rateCheck.used, limit: rateCheck.limit,
      });
    }
  }

  if (keyInfo && keyInfo.quota_tokens != null) {
    if ((keyInfo.used_tokens || 0) >= keyInfo.quota_tokens) {
      return reply.status(402).send({
        error: 'quota_exhausted',
        message: '当月额度已用完，请续费或购买充值包 → https://tb-api.top',
        used: keyInfo.used_tokens, quota: keyInfo.quota_tokens,
      });
    }
  }

  try {
    const upstream = await callDeepSeek(messages);
    const tokens = upstream.usage?.total_tokens || 0;
    const clientIp = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    record(key, model || 'gpt-4o-mini', tokens, clientIp);

    return {
      id: upstream.id || `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model || 'gpt-4o-mini',
      choices: upstream.choices?.map(c => ({
        index: c.index, message: c.message, finish_reason: c.finish_reason,
      })) || [],
      usage: upstream.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  } catch (err) {
    return reply.status(502).send({ error: 'upstream_error', message: err.message });
  }
});

server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// ===== 管理后台 API（兼容 admin.html 的 /api/admin/* 路由） =====
function adminAuth(request, reply) {
  const auth = request.headers.authorization;
  const key = auth?.replace(/^Bearer\s+/i, '').trim();
  if (!key || !apiKeys[key] || apiKeys[key].plan !== 'admin') {
    reply.status(403).send({ error: 'forbidden' });
    return null;
  }
  return key;
}

function formatKeyEntry(k, info) {
  return { key: k, name: info.name, plan: info.plan, tokens: info.quota_tokens, quota_tokens: info.quota_tokens, used_tokens: info.used_tokens || 0, email: info.email || '', enabled: info.enabled !== false, renewed_at: info.renewed_at, created_at: info.created_at };
}

server.get('/api/admin/dashboard', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const keyCount = Object.keys(apiKeys).filter(k => k !== TEST_KEY_ID).length;
  const rev = payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.amount_usd || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const todayReqs = (stats.byKeyId ? Object.values(stats.byKeyId).reduce((s, v) => s + v.requests, 0) : 0);
  const recentReqs = stats.recentRequests ? stats.recentRequests.slice(-20).map(r => ({ model: r.model, tokens: r.tokens, created_at: r.created_at })) : [];
  // 查找最近一条付费 payment 的 model 映射
  return {
    total_keys: keyCount, total_payments: payments.length, total_revenue: rev, today_requests: todayReqs,
    realtime: { total_requests: stats.totalRequests || 0, total_tokens: stats.totalTokens || 0, avg_latency_ms: stats.avgLatency || 0 },
    recent_requests: recentReqs,
    system: { uptime: process.uptime ? Math.floor(process.uptime() / 60) + 'm' : '-', node_version: process.version || '-', memory_usage: process.memoryUsage ? Math.round(process.memoryUsage().rss / 1024 / 1024) : '-', cpu: '-' },
  };
});

server.get('/api/admin/keys', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  return { keys: Object.entries(apiKeys).filter(([k]) => k !== TEST_KEY_ID).sort((a, b) => new Date(b[1].created_at || 0) - new Date(a[1].created_at || 0)).map(([k, info]) => formatKeyEntry(k, info)) };
});

server.post('/api/admin/keys', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const { name, plan, tokens, email } = request.body || {};
  const newKey = generateApiKey();
  apiKeys[newKey] = { name: name || '新Key', quota_tokens: tokens || 10_000_000, used_tokens: 0, enabled: true, created_at: new Date().toISOString(), email: email || '', plan: plan || 'custom' };
  saveKeys();
  return { key: newKey, ...formatKeyEntry(newKey, apiKeys[newKey]) };
});

server.get('/api/admin/keys/:keyId', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const info = apiKeys[request.params.keyId];
  if (!info) return reply.status(404).send({ error: 'not found' });
  return formatKeyEntry(request.params.keyId, info);
});

server.patch('/api/admin/keys/:keyId', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const info = apiKeys[request.params.keyId];
  if (!info) return reply.status(404).send({ error: 'not found' });
  const { name, tokens, enabled } = request.body || {};
  if (name !== undefined) info.name = name;
  if (tokens !== undefined) info.quota_tokens = tokens;
  if (enabled !== undefined) info.enabled = enabled;
  saveKeys();
  return { success: true };
});

server.post('/api/admin/keys/:keyId/enable', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const info = apiKeys[request.params.keyId];
  if (!info) return reply.status(404).send({ error: 'not found' });
  info.enabled = true;
  saveKeys();
  return { success: true };
});

server.post('/api/admin/keys/:keyId/disable', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const info = apiKeys[request.params.keyId];
  if (!info) return reply.status(404).send({ error: 'not found' });
  info.enabled = false;
  saveKeys();
  return { success: true };
});

server.get('/api/admin/payments', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const ps = (payments || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return { payments: ps.map(p => ({
    email: p.email || '-', plan: p.plan || '-', amount: p.amount_usd || 0,
    method: p.id?.startsWith('usdt') ? 'usdt' : p.id?.startsWith('pp') ? 'paypal' : 'ls',
    status: 'succeeded', created_at: p.created_at,
  })) };
});

server.get('/api/admin/logs', async (request, reply) => {
  if (!adminAuth(request, reply)) return;
  const rawLogs = stats.recentRequests || [];
  return { logs: rawLogs.slice(-200).reverse().map(l => ({
    key: l.key || '', model: l.model || '-', status: l.status || 200, tokens: l.tokens || 0, latency_ms: l.latency || 0, created_at: l.created_at,
  })) };
});

// ===== PayPal 支付 =====
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

function hasPayPal() {
  return !!(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET);
}

async function getPayPalAccessToken() {
  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const resp = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error(`PayPal auth failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.access_token;
}

async function createPayPalOrder(planId, amountUsd, planName, email, returnKey) {
  const token = await getPayPalAccessToken();
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

  const resp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: planId,
        description: `TokenBridge - ${planName}`,
        custom_id: `${planId}|${returnKey || ''}|${email || ''}`,
        amount: {
          currency_code: 'USD',
          value: amountUsd,
        },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${baseUrl}/api/paypal-return`,
            cancel_url: `${baseUrl}/pay.html?cancel=1`,
          },
        },
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(`PayPal order creation failed: ${JSON.stringify(data)}`);

  // 找到 PayPal 跳转链接
  const approvalLink = data.links?.find(l => l.rel === 'payer-action')?.href;
  return { orderId: data.id, approvalUrl: approvalLink, orderData: data };
}

async function capturePayPalOrder(orderId) {
  const token = await getPayPalAccessToken();
  const resp = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`PayPal capture failed: ${JSON.stringify(data)}`);

  // 提取支付信息
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  const customId = data.purchase_units?.[0]?.custom_id || '';
  const [planId, returnKey, email] = customId.split('|');
  const amountUsd = parseFloat(capture?.amount?.value || '0');

  return {
    status: data.status,
    orderId: data.id,
    captureId: capture?.id,
    planId,
    returnKey,
    email,
    amountUsd,
  };
}

// ===== USDT (TRC-20) 支付 =====
const USDT_WALLET_ADDRESS = process.env.USDT_WALLET_ADDRESS || '';
const USDT_CHAIN = process.env.USDT_CHAIN || 'TRC20';
const USDT_TEST_MODE = process.env.USDT_TEST_MODE !== 'false'; // 默认为 true（测试模式）
const USDT_TEST_AMOUNT = 5; // 测试模式下的固定金额（USDT）

// USDT 合约地址（TRC-20）
const TRC20_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// ===== SMTP 邮件配置 =====
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.163.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

async function sendApiKeyEmail(to, apiKey, plan, tokens, amount) {
  if (!to || !apiKey) return;
  try {
    await smtpTransporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'TokenBridge - 支付成功！您的 API Key',
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="text-align: center; padding: 32px 0; font-size: 28px; color: #4a90d9;">⚡ TokenBridge</div>
          <div style="background: #f8fbff; border: 1px solid #e0e8f0; border-radius: 12px; padding: 32px;">
            <h2 style="margin: 0 0 8px; color: #222;">支付成功！🎉</h2>
            <p style="color: #888; margin: 0 0 24px;">${plan || '套餐'} 已激活</p>

            <div style="background: #ffffff; border: 1px solid #d5e8d5; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <div style="font-size: 12px; color: #888; margin-bottom: 6px;">您的 API Key</div>
              <div style="font-size: 14px; font-family: monospace; color: #2d7d2d; word-break: break-all; user-select: all;">${apiKey}</div>
            </div>

            <table style="width: 100%; font-size: 14px; color: #555;">
              <tr><td style="padding: 6px 0;">套餐</td><td style="font-weight: 600; text-align: right;">${plan || '-'}</td></tr>
              <tr><td style="padding: 6px 0;">Tokens</td><td style="font-weight: 600; text-align: right;">${(tokens / 1000000).toLocaleString()}M</td></tr>
              <tr><td style="padding: 6px 0;">金额</td><td style="font-weight: 600; text-align: right;">${amount || '-'}</td></tr>
            </table>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

            <p style="font-size: 13px; color: #888; margin: 0;">
              🔗 管理后台：<a href="https://tb-api.top/admin.html" style="color: #4a90d9;">https://tb-api.top/admin.html</a><br>
              📖 API 文档：<a href="https://tb-api.top/docs.html" style="color: #4a90d9;">https://tb-api.top/docs.html</a><br>
              💳 充值：<a href="https://tb-api.top/pay.html" style="color: #4a90d9;">https://tb-api.top/pay.html</a>
            </p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #aaa;">
            TokenBridge ⚡ · 一站式 AI API 中转服务
          </div>
        </div>
      `,
    });
    console.log(`  📧 邮件已发送至 ${to}`);
  } catch (err) {
    console.error(`  ❌ 邮件发送失败: ${err.message}`);
  }
}

async function sendAdminNotification(plan, userEmail, apiKey, tokens, amount, txid) {
  try {
    await smtpTransporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: 'songsongxia@163.com',
      subject: `💰 新订单: ${plan} - ${amount}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #e8f8e8; border: 1px solid #d5e8d5; border-radius: 12px; padding: 24px;">
            <h2 style="margin: 0 0 16px; color: #2d7d2d;">💰 新订单通知</h2>
            <table style="width: 100%; font-size: 14px; color: #555; line-height: 2;">
              <tr><td style="padding: 4px 0; color: #888;">套餐</td><td style="font-weight: 600; text-align: right;">${plan}</td></tr>
              <tr><td style="padding: 4px 0; color: #888;">金额</td><td style="font-weight: 600; text-align: right; color: #2d7d2d;">${amount}</td></tr>
              <tr><td style="padding: 4px 0; color: #888;">Tokens</td><td style="font-weight: 600; text-align: right;">${(tokens / 1000000).toLocaleString()}M</td></tr>
              <tr><td style="padding: 4px 0; color: #888;">用户邮箱</td><td style="font-weight: 600; text-align: right;">${userEmail || '无'}</td></tr>
              <tr><td style="padding: 4px 0; color: #888;">API Key</td><td style="font-family: monospace; font-size: 12px; text-align: right; word-break: break-all;">${apiKey || 'N/A'}</td></tr>
              ${txid ? `<tr><td style="padding: 4px 0; color: #888;">TXID</td><td style="font-family: monospace; font-size: 12px; text-align: right; word-break: break-all;">${txid.slice(0, 24)}...</td></tr>` : ''}
              <tr><td style="padding: 4px 0; color: #888;">时间</td><td style="font-weight: 600; text-align: right;">${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</td></tr>
            </table>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
            <p style="font-size: 12px; color: #aaa; margin: 0;">
              <a href="https://tb-api.top/admin.html" style="color: #4a90d9;">管理后台 →</a>
            </p>
          </div>
        </div>
      `,
    });
    console.log(`  📧 管理员通知已发送`);
  } catch (err) {
    console.error(`  ❌ 管理员通知失败: ${err.message}`);
  }
}

function hasUsdtPayment() {
  return !!USDT_WALLET_ADDRESS;
}

// 验证 TRC-20 USDT 交易（含区块确认数检查）
async function verifyTrc20Payment(txid, expectedAmountUsdt, expectedTo) {
  try {
    // 查询 TRC-20 转账记录
    const url = `https://api.trongrid.io/v1/transactions/${txid}/events?only_confirmed=true`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`TronGrid error: ${resp.status}`);
    const data = await resp.json();

    if (!data.data || data.data.length === 0) {
      return { valid: false, error: '交易未找到或未确认' };
    }

    // 获取区块确认数
    let txBlockNumber = data.data[0]?.block_number;
    let confirmations = 0;
    if (txBlockNumber) {
      try {
        const blockResp = await fetch('https://api.trongrid.io/wallet/getnowblock');
        if (blockResp.ok) {
          const blockData = await blockResp.json();
          const currentBlock = parseInt(blockData.block_header?.raw_data?.number || 0);
          confirmations = currentBlock - txBlockNumber + 1;
        }
      } catch (e) {
        console.warn('获取最新区块失败:', e.message);
      }
    }

    // 要求至少 19 个确认（约 1 分钟）
    const MIN_CONFIRMATIONS = 19;
    if (confirmations > 0 && confirmations < MIN_CONFIRMATIONS) {
      return {
        valid: false,
        error: `交易确认数不足: ${confirmations}/${MIN_CONFIRMATIONS}，请稍后再试`,
        confirmations,
        required: MIN_CONFIRMATIONS,
      };
    }

    // 查找 USDT Transfer 事件
    for (const event of data.data) {
      // TRC-20 USDT 合约地址
      if (event.contract_address === TRC20_USDT_CONTRACT && event.event_name === 'Transfer') {
        const to = event.result?.to; // 收款地址
        const value = event.result?.value; // 金额（最小单位，USDT 是 6 位小数）

        if (!to || !value) continue;

        const receivedAddress = to; // 已经是 base58 格式
        const receivedAmount = parseInt(value) / 1_000_000; // 换算成 USDT

        if (receivedAddress.toLowerCase() === expectedTo.toLowerCase()) {
          if (receivedAmount === expectedAmountUsdt) {
            return {
              valid: true,
              from: event.result?.from,
              amount: receivedAmount,
              expected: expectedAmountUsdt,
            };
          } else {
            return {
              valid: false,
              error: `金额不匹配: 收到 ${receivedAmount} USDT，需要恰好 ${expectedAmountUsdt} USDT`,
              amount: receivedAmount,
              expected: expectedAmountUsdt,
            };
          }
        }
      }
    }

    return { valid: false, error: '未找到匹配的 USDT 转账' };
  } catch (err) {
    return { valid: false, error: `验证失败: ${err.message}` };
  }
}

// ===== 套餐列表 =====
server.get('/api/plans', async () => ({
  plans: Object.entries(PLANS).map(([id, cfg]) => ({ id, ...cfg })),
}));

// ===== Lemon Squeezy 支付 API =====

/**
 * 创建 Lemon Squeezy Checkout 链接
 * 前端拿到 URL 后跳转让用户完成支付
 */
server.post('/api/create-payment', async (request, reply) => {
  const { plan, email, returnKey } = request.body || {};
  const planConfig = PLANS[plan];
  if (!planConfig) {
    return reply.status(400).send({ error: '无效的套餐' });
  }

  const variantId = VARIANT_MAP[plan] || VARIANT_MAP['default'];

  // 降级模式（无 LS Key）
  if (!hasLemonSqueezy()) {
    console.log(`  🎲 [降级] 支付: ${planConfig.name} | $${(planConfig.amount/100).toFixed(2)}`);
    // 模拟延迟
    await new Promise(r => setTimeout(r, 800));

    // 生成 Key
    let newKey = returnKey;
    if (!newKey) {
      newKey = generateApiKey();
      apiKeys[newKey] = {
        name: email || '降级用户',
        quota_tokens: planConfig.tokens,
        used_tokens: 0, enabled: true,
        created_at: new Date().toISOString(),
        email: email || '', plan: plan,
      };
    } else if (apiKeys[newKey]) {
      applyPlanQuota(apiKeys[newKey], plan, planConfig.tokens);
    }
    saveKeys();

    payments.push({
      id: 'demo_' + Date.now(),
      plan, amount_usd: planConfig.amount / 100,
      tokens: planConfig.tokens,
      email: email || '', api_key: newKey,
      status: 'succeeded',
      created_at: new Date().toISOString(),
    });
    saveJson(PAYMENTS_FILE, payments);

    return { demo: true, checkout_url: null, api_key: newKey, plan: planConfig.name };
  }

  // 生产模式：创建 Lemon Squeezy Checkout
  try {
    const redirectUrl = `${process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`}/pay-success.html?plan=${plan}`;

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: email || '',
              custom: {
                plan,
                returnKey: returnKey || undefined,
                tokens: String(planConfig.tokens),
              },
            },
            product_options: {
              redirect_url: redirectUrl,
              enabled_variants: [parseInt(variantId)],
            },
            checkout_options: {
              embed: false,
              logo: true,
              desc: true,
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: String(LS_STORE_ID),
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: String(variantId),
              },
            },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Checkout creation failed');
    }

    const checkoutUrl = data.data?.attributes?.url;
    console.log(`  🛒 Checkout: ${planConfig.name} → ${checkoutUrl}`);

    return { checkout_url: checkoutUrl, plan: planConfig.name, demo: false };
  } catch (err) {
    console.error('  ❌ Lemon Squeezy error:', err.message);
    return reply.status(500).send({ error: err.message });
  }
});

/**
 * Lemon Squeezy Webhook（处理支付成功）
 * 需要在 LS 后台 Settings → Webhooks 配置 Endpoint
 */
// Webhook 端点（同时支持 GET 和 POST）
server.all('/api/ls-webhook', async (request, reply) => {
  const body = request.body;
  if (!body) return reply.status(400).send({ error: 'missing body' });

  const eventName = body.meta?.event_name;
  console.log(`  📨 Webhook: ${eventName}`);

  if (eventName === 'order_created') {
    const order = body.data;
    const attributes = order?.attributes;
    const customData = attributes?.first_order_item?.product_options?.checkout_data?.custom;

    if (!customData) {
      console.log('  ⚠️ No custom data in order, trying user metadata');
    }

    const planKey = customData?.plan || 'pro-flash';
    const returnKey = customData?.returnKey || '';
    const tokens = parseInt(customData?.tokens || PLANS[planKey]?.tokens || 100_000_000);
    const email = customData?.email || attributes?.user_email || 'unknown';
    const amountUsd = attributes?.total_usd ? parseInt(attributes.total_usd) / 100 : (PLANS[planKey]?.amount / 100 || 0);
    const orderId = order?.id || 'ls_' + Date.now();

    console.log(`  💰 支付成功: ${planKey} | $${amountUsd} | ${email}`);

    // 生成 Key 或充值
    let newKey = returnKey;
    if (!newKey || !apiKeys[newKey]) {
      newKey = generateApiKey();
      apiKeys[newKey] = {
        name: email || '充值用户',
        quota_tokens: tokens,
        used_tokens: 0, enabled: true,
        created_at: new Date().toISOString(),
        email: email, plan: planKey,
      };
    } else if (apiKeys[newKey]) {
      applyPlanQuota(apiKeys[newKey], planKey, tokens);
    }
    saveKeys();

    payments.push({
      id: orderId,
      plan: planKey,
      amount_usd: amountUsd,
      tokens, email,
      api_key: newKey,
      status: 'succeeded',
      created_at: new Date().toISOString(),
    });
    saveJson(PAYMENTS_FILE, payments);

    console.log(`  🔑 Key: ${newKey.slice(0, 12)}...`);
  }

  return { received: true };
});

// ===== PayPal 端点 =====
server.post('/api/create-paypal-order', async (request, reply) => {
  const { plan, email, returnKey } = request.body || {};
  const planConfig = PLANS[plan];
  if (!planConfig) return reply.status(400).send({ error: '无效的套餐' });

  if (!hasPayPal()) {
    return reply.status(400).send({ error: 'PayPal 未配置，请在 .env 中设置 PAYPAL_CLIENT_ID 和 PAYPAL_CLIENT_SECRET' });
  }

  try {
    const amountUsd = (planConfig.amount / 100).toFixed(2);
    const result = await createPayPalOrder(plan, amountUsd, planConfig.name, email, returnKey);
    return { approval_url: result.approvalUrl, order_id: result.orderId };
  } catch (err) {
    console.error('  ❌ PayPal create order error:', err.message);
    return reply.status(500).send({ error: err.message });
  }
});

// PayPal 支付成功回调（用户从 PayPal 跳转回来）
server.all('/api/paypal-return', async (request, reply) => {
  const token = request.query?.token; // PayPal 返回的 order ID 在 token 参数中
  if (!token) {
    return reply.redirect('/pay.html?error=missing_token');
  }

  try {
    const result = await capturePayPalOrder(token);
    console.log(`  💰 PayPal 支付成功: ${result.planId} | $${result.amountUsd} | order=${result.orderId}`);

    if (result.status === 'COMPLETED') {
      const planConfig = PLANS[result.planId];
      const tokens = planConfig?.tokens || 100_000_000;
      const email = result.email || 'unknown';
      let newKey = result.returnKey;

      // 生成或充值 Key
      if (!newKey || !apiKeys[newKey]) {
        newKey = generateApiKey();
        apiKeys[newKey] = {
          name: email || 'PayPal 用户',
          quota_tokens: tokens,
          used_tokens: 0, enabled: true,
          created_at: new Date().toISOString(),
          email: email, plan: result.planId || 'custom',
        };
      } else if (apiKeys[newKey]) {
        applyPlanQuota(apiKeys[newKey], result.planId || 'custom', tokens);
      }
      saveKeys();

      payments.push({
        id: 'pp_' + result.captureId,
        plan: result.planId,
        amount_usd: result.amountUsd,
        tokens, email,
        api_key: newKey,
        status: 'succeeded',
        provider: 'paypal',
        created_at: new Date().toISOString(),
      });
      saveJson(PAYMENTS_FILE, payments);

      console.log(`  🔑 Key: ${newKey.slice(0, 12)}...`);

      // 重定向到成功页面
      return reply.redirect(`/pay-success.html?paypal=success&key=${newKey}&plan=${result.planId || ''}&amount=${result.amountUsd}`);
    } else {
      return reply.redirect(`/pay-success.html?paypal=pending&order=${result.orderId}`);
    }
  } catch (err) {
    console.error('  ❌ PayPal capture error:', err.message);
    return reply.redirect('/pay.html?error=capture_failed');
  }
});

// ===== USDT 支付端点 =====

// 获取 USDT 支付信息
server.get('/api/usdt-payment-info', async (request, reply) => {
  const plan = request.query?.plan || 'pro-flash';
  const planConfig = PLANS[plan];
  if (!planConfig) return reply.status(400).send({ error: '无效的套餐' });

  const amountUsdt = USDT_TEST_MODE
    ? USDT_TEST_AMOUNT.toFixed(3)
    : (planConfig.amount / 100).toFixed(2);

  return {
    address: USDT_WALLET_ADDRESS,
    chain: USDT_CHAIN,
    amount: amountUsdt,
    plan: planConfig.name,
    tokens: planConfig.tokens,
    test_mode: USDT_TEST_MODE,
  };
});

// 已使用的 TXID 池（防重复）
const usedTxids = new Set();

// 验证 USDT 支付
server.post('/api/verify-usdt-payment', async (request, reply) => {
  const { plan, email, returnKey, txid } = request.body || {};
  const planConfig = PLANS[plan];
  if (!planConfig) return reply.status(400).send({ error: '无效的套餐' });
  if (!txid) return reply.status(400).send({ error: '请输入交易哈希 (TXID)' });

  // TXID 格式校验
  if (USDT_TEST_MODE && txid.startsWith('test')) {
    // 测试模式：允许 test 开头的虚拟 TXID
  } else if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
    return reply.status(400).send({ error: '无效的 TXID 格式，应为 64 位十六进制字符串' });
  }

  // 防重复使用
  if (usedTxids.has(txid)) {
    return reply.status(400).send({ error: '该 TXID 已被使用过，请勿重复提交' });
  }

  const expectedAmount = USDT_TEST_MODE && txid.startsWith('test')
    ? USDT_TEST_AMOUNT
    : (planConfig.amount / 100);
  let result;

  // 测试模式：跳过扫链验证
  if (USDT_TEST_MODE && txid.startsWith('test')) {
    console.log(`  🧪 测试模式: 跳过扫链验证, plan=${plan}, txid=${txid}, amount=${USDT_TEST_AMOUNT} USDT`);
    result = { valid: true, from: 'test_user', amount: USDT_TEST_AMOUNT, expected: USDT_TEST_AMOUNT };
  } else {
    // 扫链验证
    result = await verifyTrc20Payment(txid, expectedAmount, USDT_WALLET_ADDRESS);
  }

  if (!result.valid) {
    return reply.status(400).send({
      error: result.error,
      amount: result.amount,
      expected: result.expected,
    });
  }

  // 标记 TXID 已使用
  usedTxids.add(txid);

  if (!result.valid) {
    return reply.status(400).send({
      error: result.error,
      amount: result.amount,
      expected: result.expected,
    });
  }

  // 验证通过，发 Key
  const tokens = planConfig.tokens;
  const userEmail = email || result.from || 'usdt_user';
  let newKey = returnKey;

  if (!newKey || !apiKeys[newKey]) {
    newKey = generateApiKey();
    apiKeys[newKey] = {
      name: userEmail || 'USDT 用户',
      quota_tokens: tokens,
      used_tokens: 0, enabled: true,
      created_at: new Date().toISOString(),
      email: userEmail, plan: plan,
    };
  } else if (apiKeys[newKey]) {
    applyPlanQuota(apiKeys[newKey], plan, tokens);
  }
  saveKeys();

  payments.push({
    id: 'usdt_' + txid.slice(0, 16),
    plan, amount_usd: expectedAmount,
    tokens, email: userEmail,
    api_key: newKey,
    status: 'succeeded',
    provider: 'usdt_' + USDT_CHAIN,
    txid,
    created_at: new Date().toISOString(),
  });
  saveJson(PAYMENTS_FILE, payments);

  console.log(`  💰 USDT 支付成功: ${planConfig.name} | ${expectedAmount} USDT | tx=${txid.slice(0, 16)}...`);
  console.log(`  🔑 Key: ${newKey.slice(0, 12)}...`);

  // 发送邮件给用户
  sendApiKeyEmail(userEmail, newKey, planConfig.name, tokens, `${expectedAmount} USDT`);

  // 通知管理员
  sendAdminNotification(planConfig.name, userEmail, newKey, tokens, `${expectedAmount} USDT`, txid);

  return {
    success: true,
    api_key: newKey,
    tokens,
    plan: planConfig.name,
    amount: expectedAmount,
  };
});

// ===== 按邮箱查找 API Key =====
server.post('/api/lookup-keys', async (request, reply) => {
  const { email } = request.body || {};
  if (!email || !email.includes('@')) {
    return reply.status(400).send({ error: '请输入有效的邮箱地址' });
  }

  const matched = Object.entries(apiKeys)
    .filter(([, info]) => info.email && info.email.toLowerCase() === email.toLowerCase())
    .map(([key, info]) => ({
      key_masked: key.slice(0, 8) + '...' + key.slice(-4),
      key_full: key,
      name: info.name,
      plan: info.plan,
      enabled: info.enabled,
      created_at: info.created_at,
    }));

  if (matched.length === 0) {
    return reply.status(404).send({ error: '未找到该邮箱关联的 API Key' });
  }

  return { matched };
});

// ===== 用户用量查询 =====
server.post('/api/key-usage', async (request, reply) => {
  const { key } = request.body || {};
  if (!key) return reply.status(400).send({ error: '请提供 API Key' });

  const keyInfo = apiKeys[key];
  if (!keyInfo) return reply.status(404).send({ error: 'API Key 无效' });

  const usedPct = keyInfo.quota_tokens != null && keyInfo.quota_tokens > 0
    ? Math.round((keyInfo.used_tokens / keyInfo.quota_tokens) * 10000) / 100
    : null;

  // 查询该 Key 在各模型的用量统计
  const keyStatsByModel = {};
  const rawLogs = stats.recentRequests || [];
  for (const log of rawLogs) {
    if (log.key && log.key.startsWith(keyShort)) {
      const m = log.model || 'unknown';
      if (!keyStatsByModel[m]) keyStatsByModel[m] = { requests: 0, tokens: 0 };
      keyStatsByModel[m].requests++;
      keyStatsByModel[m].tokens += log.tokens || 0;
    }
  }

  // 查询该 Key 的支付记录
  const keyPayments = payments
    .filter(p => p.api_key === key && p.status === 'succeeded')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // 查询 stats 中的请求记录
  const keyShort = key.slice(0, 10) + '...';
  const keyStats = stats.byKeyId[keyShort] || null;

  return {
    key_info: {
      name: keyInfo.name,
      plan: keyInfo.plan,
      enabled: keyInfo.enabled,
      created_at: keyInfo.created_at,
      email: keyInfo.email || '',
    },
    usage: {
      used_tokens: keyInfo.used_tokens || 0,
      quota_tokens: keyInfo.quota_tokens,
      used_percent: usedPct,
      remaining_tokens: keyInfo.quota_tokens != null
        ? Math.max(0, keyInfo.quota_tokens - (keyInfo.used_tokens || 0))
        : null,
    },
    requests: keyStats ? {
      total: keyStats.requests,
      tokens: keyStats.tokens,
      last_request: keyStats.lastRequest,
    } : { total: 0, tokens: 0, last_request: null },
    model_stats: Object.keys(keyStatsByModel).length > 0 ? keyStatsByModel : null,
    payments: keyPayments.map(p => ({
      id: p.id,
      plan: p.plan,
      amount_usd: p.amount_usd,
      tokens: p.tokens,
      created_at: p.created_at,
      provider: p.provider || 'lemonsqueezy',
    })),
  };
});

// ===== 优雅关闭：退出前保存数据 =====
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(sig => {
  process.on(sig, () => {
    console.log(`\n  ⚡ 收到 ${sig}，保存数据后退出...`);
    saveKeys();
    saveStats();
    saveJson(PAYMENTS_FILE, payments);
    process.exit(0);
  });
});

// ===== Demo 测试区（无需 Key，IP 限流） =====
const DEMO_MAX_REQUESTS_PER_IP = 20;
const DEMO_RESET_WINDOW_MS = 60 * 60 * 1000; // 1 小时
const demoIpCounts = new Map();

// ===== 公共测试 Key 限流 =====
const TEST_KEY_MIN_REQUESTS_PER_IP = 5;
const TEST_KEY_ID = 'tb_test_free';
const TEST_KEY_WINDOW_MS = 60 * 1000; // 1 分钟
const testKeyIpCounts = new Map();

function checkTestKeyRateLimit(ip) {
  const now = Date.now();
  let entry = testKeyIpCounts.get(ip);
  if (!entry || now - entry.resetAt > TEST_KEY_WINDOW_MS) {
    entry = { count: 0, resetAt: now + TEST_KEY_WINDOW_MS };
    testKeyIpCounts.set(ip, entry);
  }
  entry.count++;
  return { allowed: entry.count <= TEST_KEY_MIN_REQUESTS_PER_IP, used: entry.count, limit: TEST_KEY_MIN_REQUESTS_PER_IP };
}

function checkDemoRateLimit(ip) {
  const now = Date.now();
  let entry = demoIpCounts.get(ip);
  if (!entry || now - entry.resetAt > DEMO_RESET_WINDOW_MS) {
    entry = { count: 0, resetAt: now + DEMO_RESET_WINDOW_MS };
    demoIpCounts.set(ip, entry);
  }
  entry.count++;
  return { allowed: entry.count <= DEMO_MAX_REQUESTS_PER_IP, used: entry.count, limit: DEMO_MAX_REQUESTS_PER_IP };
}

server.post('/api/demo-chat', async (request, reply) => {
  const clientIp = request.ip || request.headers['x-forwarded-for'] || 'unknown';
  const rateCheck = checkDemoRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return reply.status(429).send({
      error: 'rate_limited',
      message: `Demo 请求已达到每小时上限（${rateCheck.used}/${rateCheck.limit}），请休息一下或使用自己的 API Key`,
      used: rateCheck.used,
      limit: rateCheck.limit,
    });
  }

  const { model, messages } = request.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return reply.status(400).send({ error: 'messages is required' });
  }

  // Demo 只支持特定模型
  const allowedModels = ['deepseek-chat'];
  const useModel = allowedModels.includes(model) ? model : 'deepseek-chat';

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个 AI 助手，请用简洁的方式回答用户问题。' },
          ...messages.slice(-6), // 限制上下文长度
        ],
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return reply.status(502).send({ error: 'upstream_error', message: `上游 API 错误 (${response.status}): ${errText}` });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const tokens = data.usage?.total_tokens || 0;

    // 记录 demo 使用量
    if (!stats.byModel['__demo__']) stats.byModel['__demo__'] = 0;
    stats.byModel['__demo__'] += tokens;
    stats.totalRequests++;
    stats.totalTokens += tokens;

    return {
      id: `demo-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: useModel,
      choices: [{
        index: 0,
        message: choice?.message || { role: 'assistant', content: '（没有返回内容）' },
        finish_reason: choice?.finish_reason || 'stop',
      }],
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: tokens },
    };

  } catch (err) {
    return reply.status(502).send({ error: 'upstream_error', message: err.message });
  }
});

// ===== 启动 =====
const PORT = parseInt(process.env.PORT || '3000');
await server.listen({ port: PORT, host: '0.0.0.0' });
console.log('');
console.log('═══════════════════════════════════════');
console.log('  TokenBridge MVP 已启动! 🦞');
console.log(`  地址: http://localhost:${PORT}`);
console.log(`  充值: http://localhost:${PORT}/pay.html`);
console.log(`  管理: http://localhost:${PORT}/admin.html`);
console.log(`  API:  http://localhost:${PORT}/v1/chat/completions`);
if (hasLemonSqueezy()) {
  console.log('  🍋 Lemon Squeezy: ✅ 已连接（测试模式）');
  console.log('  完成实名认证并激活商店可接收真实支付');
} else {
  console.log('  🎲 降级模式（模拟支付，仅供演示）');
  console.log('  配置 LEMONSQUEEZY_API_KEY 启用真实支付');
}
console.log('═══════════════════════════════════════');
console.log('');


