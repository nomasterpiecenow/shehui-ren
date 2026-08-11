/* scripts/llm.js — DeepSeek 客户端（OpenAI 兼容）
 * 设计要点：
 *   - 非思考模式（thinking:{type:'disabled'}），便宜且够用（已实测验证）。
 *   - 用 JSON 模式（response_format json_object）保证结构化输出稳定。
 *   - 密钥优先级：环境变量 DEEPSEEK_API_KEY > 本地 .env（本地测试用，勿提交）。
 *     云端由 GitHub Secret 注入环境变量，无需 .env。
 */
const fs = require('fs');
const path = require('path');

// 简易 .env 解析（不上 dotenv 依赖）：仅当环境变量未设置时填补
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    const txt = fs.readFileSync(envPath, 'utf8');
    txt.split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    });
  } catch (e) {
    /* 无 .env：依赖已注入的环境变量（云端 Secret） */
  }
}
loadEnv();

const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const BASE = process.env.DEEPSEEK_BASE || 'https://api.deepseek.com';

if (!API_KEY) {
  console.error('[llm] 缺少 DEEPSEEK_API_KEY（本地用 .env，云端用 GitHub Secret）');
  process.exit(2);
}

/**
 * 调用一次对话补全，返回文本。
 * @param {Array} messages OpenAI 格式消息
 * @param {{temperature?:number, maxTokens?:number}} opts
 */
async function chat(messages, { temperature = 0.7, maxTokens = 4000 } = {}) {
  const resp = await fetch(BASE + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + API_KEY,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      thinking: { type: 'disabled' }, // 非思考模式
      response_format: { type: 'json_object' },
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error('DeepSeek HTTP ' + resp.status + ': ' + txt.slice(0, 600));
  }
  const j = await resp.json();
  return j.choices[0].message.content;
}

module.exports = { chat, MODEL, API_KEY, BASE };
