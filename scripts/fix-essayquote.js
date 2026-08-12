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

// 速用语段「起型」全局分配表（15条：相邻不同、分布均匀 引3排2情2设2对3警3）
const ESSAY_SKELETON_SEQ = ['引', '排', '情', '设', '对', '警', '排', '引', '情', '对', '设', '警', '情', '引', '排'];
const SKELETON_LIB = {
  q: ['引', '排', '情', '设', '对', '警'],
  c: ['五', '正', '辩', '叠', '破'],
  z: ['升', '号', '展', '环', '隐'],
};

function systemPrompt() {
  return `你是一位高考满分作文金句素材编辑。我将给你若干条热点新闻（含 id、标题、导语 gist、关联理论视角），请只为每条重写「essayQuote」字段。

# 要求
- 输出一段 **200–280 字（汉字计）** 的「作文素材段」，可直接抄进高考作文：用一根清晰的核心判断串起 1–3 颗可独立背诵的金句珠子。**务必写满 200 字以上（汉字计），少于 200 字无效；建议控制在 300 字以内。**
- **骨架库（起 / 承 / 转 各选一型组合）**：
  - 起（开头）6 型：引=引用名言或古语；排=排比铺陈；情=情景意象；设=设问反问；对=对比对立；警=警句突现
  - 承（展开）5 型：五=五步标准论证；正=正反对比；辩=辩证思辨；叠=同类叠加；破=驳论破立
  - 转（收尾）5 型：升=升华立意；号=号召行动；展=展望寄语；环=呼应回环；隐=哲理隐喻
- **本批骨架分配（严格照此生成，保证整体多样）**：
  每条新闻条目后已用【本条起型必须为：X】标注，X 为起型（引/排/情/设/对/警），你必须严格按标注的起型生成该条开头，不得自行更换。
  起型整体分布为：引3 排2 情2 设2 对3 警3（已均匀）。承型、转型请你在本批内也轮换使用、不要扎堆同一种。
- 整段须含 **至少 1 个可背诵金句**（对仗 / 比喻 / 警策 / 引用皆可）；修辞不限，但严禁为凑字数堆砌排比而空洞无物。
- 语言有思辨深度、少年意气、社会关怀，须显式点明新闻建构出的人 / 社会角度。
- 严禁写成纯抒情口号、说明文段落、简单复述标题。
- 同时输出 skeleton 字段，格式「起型·承型·转型」（如「引·辩·升」），起型须与本批分配一致。
- 只输出 JSON，不要任何解释：{"items":[{"id":<原id>,"essayQuote":"...","skeleton":"起型·承型·转型"}]}`;
}

function buildUser(items) {
  const lines = items.map((it, idx) => {
    const theories = (it.theories || []).map((t) => t.label || t.id).join(' / ');
    const lenses = (it.interpretations || []).map((p) => p.lens || p.lensId).filter(Boolean).join(' / ');
    const q = ESSAY_SKELETON_SEQ[idx] || '';
    return `id: ${it.id}\n标题: ${it.title}\n导语: ${it.gist}\n关联理论视角: ${theories || lenses || '（无）'}\n【本条起型必须为：${q}】`;
  });
  return '请为以下新闻重写 essayQuote（逐条对应 id，严格按每条标注的起型生成）：\n\n' + lines.join('\n\n');
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
    // 长度校验（规范：200–260 字高考论证段，余量 180–260）
    const bad = got.filter((g) => {
      const n = countChars(g.essayQuote);
      return n < 180 || n > 300;
    });
    if (bad.length) {
      lastErr = `以下 id 字数不在 180–260： ${bad.map((g) => g.id + '(' + countChars(g.essayQuote) + ')').join(', ')}`;
      console.warn(`[fix] 第 ${attempt + 1} 次长度不达标: ${lastErr}`);
      continue;
    }
    // 骨架标签校验：起型须严格对应全局分配表，承/转须在库
    const skBad = [];
    got.forEach((g, i) => {
      const sk = (g.skeleton || '').split('·');
      const expectQ = ESSAY_SKELETON_SEQ[i] || '';
      if (sk.length !== 3 || !SKELETON_LIB.q.includes(sk[0]) || !SKELETON_LIB.c.includes(sk[1]) || !SKELETON_LIB.z.includes(sk[2])) {
        skBad.push(`#${g.id} skeleton格式非法(${g.skeleton})`);
      } else if (sk[0] !== expectQ) {
        skBad.push(`#${g.id} 起型应=${expectQ}实=${sk[0]}`);
      }
    });
    if (skBad.length) {
      lastErr = '骨架标签问题：' + skBad.join('，');
      console.warn(`[fix] 第 ${attempt + 1} 次骨架不达标: ${lastErr}`);
      continue;
    }
    result = got;
  }
  if (!result) {
    console.error('[fix] 三次均失败，放弃');
    process.exit(1);
  }

  // 预览（含 skeleton，便于验收多样性）
  console.log('[fix] 新 essayQuote 预览：');
  result.forEach((g, i) =>
    console.log(`  #${g.id} [${g.skeleton || '-'}] (${countChars(g.essayQuote)}字) ${g.essayQuote}`)
  );

  const byId = {};
  result.forEach((g) => (byId[g.id] = g.essayQuote));
  const updated = items.map((it) => ({ ...it, essayQuote: byId[it.id] || it.essayQuote }));

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
