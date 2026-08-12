/* scripts/fix-essayquote.js — 一次性修复：只重生成指定日期的 essayQuote
 * 保留该日新闻的全部其他字段（title/gist/thread/interpretations/theories/essayTopics…），
 * 仅按规范（160–220 字高考议论文论证段，五步结构）重写 essayQuote。
 * 用法：node scripts/fix-essayquote.js [YYYY-MM-DD] [baseFile]
 *   默认日期 = 2026-08-12；baseFile 默认 news-live-tmp.js（线上抓取），缺失则回退 news-data.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { chat, getUsage } = require('./llm');
const { recordCost } = require('./cost');

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
- 输出一段 **200–260 字（汉字计）** 的「高考议论文标准论证段」，可直接作为高考议论文的一个完整论证段落使用，必须遵守「五步结构」：
  ① 观点句：用一句话亮明本段分论点（紧扣新闻社科内核，如「极端天气常态化下，气候风险正在悄然重塑社会的分配逻辑」）；
  ② 阐释句：解释该观点与论题的关联；
  ③ 材料句：引入本条新闻事实作为论据；
  ④ 分析句（最关键）：务必对材料做因果/假设/对比分析，点明「为何如此」「说明什么」，严禁只罗列现象；
  ⑤ 结论句：回扣观点并适度升华。
- 语言规范流畅、论证有力、有文采但不浮夸，可当作文素材直接引用。
- 严禁写成一句格言式鸡汤短句、严禁纯抒情口号、严禁说明文段落、严禁简单重复标题。
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
    // 长度校验（规范：160–220 字高考论证段，余量 120–260）
    const bad = got.filter((g) => {
      const n = countChars(g.essayQuote);
      return n < 120 || n > 260;
    });
    if (bad.length) {
      lastErr = `以下 id 字数不在 120–260： ${bad.map((g) => g.id + '(' + countChars(g.essayQuote) + ')').join(', ')}`;
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

  // 记录本次 DeepSeek 成本（手动修复也消耗额度，计入实际调用当天）
  try {
    const u = getUsage();
    const cost = recordCost({ type: 'manual-fix', usage: u, note: '修复 ' + TARGET + ' 的 essayQuote' });
    console.log(`[fix] DeepSeek 成本记录: ${u.calls} 次调用 → ¥${cost.toFixed(4)}`);
  } catch (e) {
    console.warn('[fix] 成本记录失败(非致命):', e.message);
  }
}

main().catch((e) => {
  console.error('[fix] 致命错误:', e);
  process.exit(1);
});
