/* scripts/fix-essayquote.js — 一次性修复：只重生成指定日期的 essayQuote
 * 保留该日新闻的全部其他字段（title/gist/thread/interpretations/theories/essayTopics…），
 * 仅按规范（100–130 字议论文素材语段）重写 essayQuote。
 * 用法：node scripts/fix-essayquote.js [YYYY-MM-DD] [baseFile]
 *   默认日期 = 2026-08-12；baseFile 默认 news-live-tmp.js（线上抓取），缺失则回退 news-data.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chat } = require('./llm');

const ROOT = path.resolve(__dirname, '..');
const TARGET = process.argv[2] || '2026-08-12';
const BASE = process.argv[3] || (fs.existsSync(path.join(ROOT, 'news-live-tmp.js')) ? 'news-live-tmp.js' : 'news-data.js');
const BASE_PATH = path.join(ROOT, BASE);
const OUT_PATH = path.join(ROOT, 'news-data.js');

function loadNews(file) {
  const src = fs.readFileSync(file, 'utf8');
  const sandbox = {};
  vm.runInNewContext(src + '\n; globalThis.__d = (typeof NEWS_DATA !== "undefined") ? NEWS_DATA : {};', sandbox);
  return sandbox.__d || {};
}

function countChars(s) {
  return [...String(s).trim()].length;
}

function systemPrompt() {
  return `你是一位高考议论文素材编辑。我将给你若干条热点新闻（含 id、标题、导语 gist、关联理论视角），请只为每条重写「essayQuote」字段。

# 要求
- 输出一段 **100–130 字（汉字计）** 的议论文素材语段：成段、有论证、可直接引用作为作文素材。
- 紧扣该新闻真实社科内核：先点明现象背后的结构性矛盾或人/社会角度（例如「极端天气常态化下，谁在为气候风险买单」），再展开一两句有依据的议论。
- 严禁写成一句格言式鸡汤短句、严禁纯抒情口号、严禁简单重复标题。
- 只输出 JSON，不要任何解释：{"items":[{"id":<原id>,"essayQuote":"..."}]}`;
}

function buildUser(items) {
  const lines = items.map((it) => {
    const theories = (it.theories || []).map((t) => t.label || t.id).join(' / ');
    const lenses = (it.interpretations || []).map((p) => p.lens || p.lensId).filter(Boolean).join(' / ');
    return `id: ${it.id}\n标题: ${it.title}\n导语: ${it.gist}\n关联理论视角: ${theories || lenses || '（无）'}`;
  });
  return '请为以下新闻重写 essayQuote（逐条对应 id）：\n\n' + lines.join('\n\n');
}

function parseItems(content) {
  let txt = (content || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const j = JSON.parse(txt);
  return Array.isArray(j.items) ? j.items : (Array.isArray(j) ? j : null);
}

async function main() {
  const base = loadNews(BASE_PATH);
  if (!base[TARGET]) {
    console.error(`[fix] base(${BASE}) 中无 ${TARGET} 数据，退出`);
    process.exit(1);
  }
  const items = base[TARGET];
  console.log(`[fix] 目标 ${TARGET} 共 ${items.length} 条，base=${BASE}`);

  let result = null;
  let lastErr = null;
  for (let attempt = 0; attempt < 3 && !result; attempt++) {
    const userMsg =
      (attempt > 0 && lastErr ? '上一次输出有问题，请修正：\n' + lastErr + '\n\n' : '') + buildUser(items);
    const content = await chat(
      [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.6, maxTokens: 5000 }
    );
    const got = parseItems(content);
    if (!got || got.length !== items.length) {
      lastErr = `必须恰好输出 ${items.length} 条，实际 ${got ? got.length : 0} 条`;
      console.warn(`[fix] 第 ${attempt + 1} 次解析失败: ${lastErr}`);
      continue;
    }
    // 长度校验
    const bad = got.filter((g) => {
      const n = countChars(g.essayQuote);
      return n < 80 || n > 160;
    });
    if (bad.length) {
      lastErr = `以下 id 字数不在 80–160： ${bad.map((g) => g.id + '(' + countChars(g.essayQuote) + ')').join(', ')}`;
      console.warn(`[fix] 第 ${attempt + 1} 次长度不达标: ${lastErr}`);
      continue;
    }
    result = got;
  }
  if (!result) {
    console.error('[fix] 三次均失败，放弃');
    process.exit(1);
  }

  const byId = {};
  result.forEach((g) => (byId[g.id] = g.essayQuote));
  const updated = items.map((it) => ({ ...it, essayQuote: byId[it.id] || it.essayQuote }));

  console.log('[fix] 新 essayQuote 预览：');
  updated.forEach((it) => console.log(`  #${it.id} (${countChars(it.essayQuote)}字) ${it.essayQuote}`));

  base[TARGET] = updated;
  const header = `/* NEWS_DATA — auto-managed data layer for 社会人 (C2).
  每日由云端脚本（scripts/news-pipeline.js + DeepSeek）自动生成并写回。
  结构见 NEWS_REVIEW_STANDARD.md：每日期 15 条，theories[] 仅用真实节点 id，
  essayTopics[] 由 AI 语义直写（受控词表）。加载方式：<script src="news-data.js"></script> */
`;
  fs.writeFileSync(OUT_PATH, header + 'var NEWS_DATA = ' + JSON.stringify(base, null, 2) + ';\n');
  console.log(`[fix] 已写回 ${OUT_PATH}（${TARGET} 的 essayQuote 已更新，其余日期不变）`);
}

main().catch((e) => {
  console.error('[fix] 致命错误:', e);
  process.exit(1);
});
