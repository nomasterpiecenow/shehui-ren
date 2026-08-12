/* scripts/news-pipeline.js — 云端每日新闻编排（无本机值守）
 * 流程：
 *   1. 取候选新闻（news-source：实时热榜优先，失败回退样例）
 *   2. 分 3 批（每批 5 条）调用 DeepSeek，产出结构化卡片
 *   3. 轻量校验（validate-light）；每批失败重试一次（带错误反馈）
 *   4. 合并 15 条、重编号、标 major/review，写回 news-data.js（保留近 7 天）
 *
 * 用法：
 *   node scripts/news-pipeline.js            # 生成并写入 news-data.js
 *   node scripts/news-pipeline.js --dry-run  # 只校验并打印，不写文件
 *
 * 依赖环境变量（云端由 GitHub Secret 注入）：DEEPSEEK_API_KEY / DEEPSEEK_MODEL / DEEPSEEK_BASE
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { chat, getUsage, resetUsage } = require('./llm');
const { recordCost } = require('./cost');
const { getCandidates } = require('./news-source');
const { validate } = require('./validate-light');
const { NODE_IDS, NODE_LABELS, nodeDisc, TOPIC_LIB, TOPIC_IDS } = require('./vocab');

// 反向映射：label(小写) -> id，用于把模型可能输出的“标签”纠正回受控词表 id
const idByLabel = {};
for (const [id, label] of Object.entries(NODE_LABELS)) idByLabel[label.toLowerCase()] = id;
const topicByLabel = {};
for (const [id, t] of Object.entries(TOPIC_LIB.topics)) topicByLabel[t.label.toLowerCase()] = id;

const ROOT = path.resolve(__dirname, '..');
const NEWS_FILE = path.join(ROOT, 'news-data.js');
const DRY = process.argv.includes('--dry-run');
const BATCH = 5; // 每批条数

// 速用语段「起型」全局分配表（15条：相邻不同、分布均匀 引3排2情2设2对3警3）
const ESSAY_SKELETON_SEQ = ['引', '排', '情', '设', '对', '警', '排', '引', '情', '对', '设', '警', '情', '引', '排'];
const SKELETON_LIB = {
  q: ['引', '排', '情', '设', '对', '警'],
  c: ['五', '正', '辩', '叠', '破'],
  z: ['升', '号', '展', '环', '隐'],
};

function shanghaiDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function loadNewsData() {
  const src = fs.readFileSync(NEWS_FILE, 'utf8');
  const sandbox = {};
  vm.runInNewContext(
    src + '\n; globalThis.__d = (typeof NEWS_DATA !== "undefined") ? NEWS_DATA : {};',
    sandbox
  );
  return sandbox.__d || {};
}

// —— 构造提示词所需的词表文本（供大模型严格选词）——
function vocabText() {
  const topics = Object.values(TOPIC_LIB.topics)
    .map((t) => `${t.id}|${t.label}`)
    .join('\n');
  const nodes = [...NODE_IDS]
    .map((id) => `${id}|${NODE_LABELS[id]}|${nodeDisc(id)}`)
    .join('\n');
  return { topics, nodes };
}

function systemPrompt(topics, nodes) {
  return `你是一位同时为「社会学、经济学、心理学」三种视角供稿的深度新闻编辑，尤其擅长把热点新闻改写成**高考满分作文水准的「金句素材段」**——既有理论思辨的深度，又有朗朗上口、可供背诵的警句密度（符合新课标卷「发展等级·有文采」要求）。

# 输入
你会收到 ${BATCH} 条候选新闻（含 title/source/url/platforms）。请为每一条产出 1 张结构化卡片。

# 受控词表（必须严格从中选择，不得造词）
## 作文主题 essayTopics（每条选 1–4 个 id）
${topics}

## 社科节点 theories / interpretations[].lensId（每条 theories 选 1–3 个；interpretations 的 lensId 必须是 theories 中某一个；第三列为学科 soc/econ/psy）
${nodes}

# 输出结构（严格 JSON，只输出 JSON，不要任何解释性文字）
{
  "items": [
    {
      "title": "同候选 title",
      "source": "同候选 source",
      "url": "同候选 url",
      "kicker": "如「财经 · 经济学 / 社会学」，按涉及学科组合",
      "gist": "立论导语，2–3 句，点明事件及其社会/经济意义",
      "thread": [ {"t":"背景","x":"..."}, ... 2–4 个 ],
      "interpretations": [
        {
          "q": "读者真正的疑问",
          "naive": "常见常识误判",
          "lens": "理论标签（与 lensId 对应）",
          "lensId": "节点 id",
          "body": "用该理论解读，含 <b>加粗关键词</b>",
          "aha": "顿悟收尾句"
        }
      ],
      "theories": [ {"id":"节点id","label":"节点label"}, ... ],
      "essayTopics": [ {"id":"主题id","label":"主题label"}, ... ],
      "essayQuote": "【作文素材段，200–280 字，成 1 段】一段可直接抄进高考作文的语段：用一根核心判断串起 1–3 颗可独立背诵的金句。写法：从「骨架库」选 起/承/转 各一型组合（起6型：引/排/情/设/对/警；承5型：五/正/辩/叠/破；转5型：升/号/展/环/隐）。本批起型须按用户消息中的「骨架分配表」使用，相邻不起同型、整体分布均匀。整段至少含 1 个可背诵金句，修辞不限；语言有思辨深度、少年意气、社会关怀，须显式点明人/社会角度。严禁写成纯抒情口号、说明文、简单复述标题。",
      "skeleton": "该条骨架标签，格式「起型·承型·转型」，如「引·辩·升」",
      "platforms": [ "同候选 platforms" ]
    }
  ]
}

# 规则
- 共 ${BATCH} 张卡片，与候选一一对应（title/source/url/platforms 原样保留）。
- thread 梳理该议题的背景/脉络：写普遍可核验的宏观事实；若缺乏具体事件细节，可写结构性背景脉络，不要编造具体日期或单一确凿事件。
- interpretations 至少 1 个；尽量覆盖不同学科视角（soc/econ/psy 各来一点更好）。
- lensId 必须出现在该条 theories 列表内；theories 与 lensId 的 id/label 必须与「社科节点」词表完全一致。
- 严禁混淆两套词表：theories / lensId 只能填「社科节点」的 id（第三列 soc/econ/psy）；essayTopics 只能填「作文主题」的 id。例如 trust / duty_devote / community / fairness 是作文主题 id，绝不是节点，不能放进 theories 或 lensId。
- essayTopics 的 id/label 必须与「作文主题」词表完全一致。
- essayQuote 必须是一段 **200–280 字**的「作文素材段」：用一根核心判断串起 1–3 颗可独立背诵的金句；从「骨架库」（起6型：引/排/情/设/对/警；承5型：五/正/辩/叠/破；转5型：升/号/展/环/隐）选 起/承/转 各一型组合；本批起型须严格按用户消息中的「骨架分配表」使用（相邻不起同型、整体分布均匀）；整段至少含 1 个可背诵金句，修辞不限；须显式点明新闻建构出的人/社会角度。严禁写成纯抒情口号、说明文段落、或简单复述标题。同时输出 skeleton 字段（「起型·承型·转型」），起型须与分配表一致。B 类新闻须显式写出其建构出的人/社会角度，纯描述通报不得作为金句。
- 所有文本用简体中文，措辞有思辨深度、有少年意气、有社会关怀，避免平铺直叙的社论腔。`;
}

function parseItems(content) {
  let txt = (content || '').trim();
  // 去掉可能的 ```json 围栏
  txt = txt.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const j = JSON.parse(txt);
  return Array.isArray(j.items) ? j.items : (Array.isArray(j) ? j : null);
}

// —— 把模型输出纠偏回受控词表（按 id 或 label 匹配）——
function normNode(ref) {
  if (!ref) return null;
  if (ref.id && NODE_IDS.has(ref.id)) return { id: ref.id, label: NODE_LABELS[ref.id] };
  const label = (ref.label || '').trim().toLowerCase();
  if (label && idByLabel[label]) {
    const id = idByLabel[label];
    return { id, label: NODE_LABELS[id] };
  }
  return null;
}
function normTopic(ref) {
  if (!ref) return null;
  if (ref.id && TOPIC_IDS.has(ref.id)) return { id: ref.id, label: TOPIC_LIB.topics[ref.id].label };
  const label = (ref.label || '').trim().toLowerCase();
  if (label && topicByLabel[label]) {
    const id = topicByLabel[label];
    return { id, label: TOPIC_LIB.topics[id].label };
  }
  return null;
}
// 归一化单条；返回 null 表示该条无法修复（如 theories 全部无效）
function normalizeItem(it) {
  const theories = (it.theories || []).map(normNode).filter(Boolean);
  if (!theories.length) return null;
  const essayTopics = (it.essayTopics || []).map(normTopic).filter(Boolean);
  const theoryIds = new Set(theories.map((t) => t.id));
  const interpretations = (it.interpretations || []).map((p) => {
    let lensId = p.lensId;
    if (!NODE_IDS.has(lensId)) {
      const lbl = (p.lens || '').trim().toLowerCase();
      if (lbl && idByLabel[lbl]) lensId = idByLabel[lbl];
    }
    if (!NODE_IDS.has(lensId)) lensId = theories[0].id; // 兜底：落到首个理论
    return { ...p, lensId, lens: NODE_LABELS[lensId] };
  });
  return { ...it, theories, essayTopics, interpretations };
}

async function generateBatch(batchCandidates, { topics, nodes, start = 0 }, prevErrors) {
    const seg = ESSAY_SKELETON_SEQ.slice(start, start + batchCandidates.length);
    const userMsg =
      (prevErrors && prevErrors.length
        ? '上一次输出未通过校验，请修正以下问题后重新输出：\n' + prevErrors.map((e) => '- ' + e).join('\n') + '\n\n'
        : '') +
      `本批为全局第 ${start + 1}–${start + batchCandidates.length} 条（共 15 条）。骨架分配表中对应起型为：${seg.join(' / ')}，请第 1 条用第 1 个、依次对应。\n\n` +
      '候选新闻（请逐条产出卡片，每条已标注【起型必须为：X】，严格据此生成）：\n' +
      batchCandidates.map((c, i) => `【第${i + 1}条 起型必须为：${seg[i] || ''}】\n` + JSON.stringify(c, null, 2)).join('\n\n');

    const content = await chat(
      [
        { role: 'system', content: systemPrompt(topics, nodes) },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.7, maxTokens: 5000 }
    );
    const items = parseItems(content);
    if (!items) throw new Error('无法解析模型输出为 items 数组');
    // 数量必须为 BATCH
    if (items.length !== BATCH) {
      throw new Error('必须恰好输出 ' + BATCH + ' 条，实际 ' + items.length + ' 条');
    }
    return items;
}

function decorate(finalItems) {
  // 重编号 id 1..15；按 platforms 数量取前 5 标 major；补 review
  const withCount = finalItems.map((it) => ({
    ...it,
    _pc: Array.isArray(it.platforms) ? it.platforms.length : 0,
  }));
  withCount.sort((a, b) => b._pc - a._pc);
  const topN = Math.min(5, withCount.length);
  const out = withCount.map((it, idx) => {
    const { _pc, id: _oldId, ...rest } = it;
    const theories = Array.isArray(rest.theories) ? rest.theories : [];
    const discs = [...new Set(theories.map((t) => nodeDisc(t.id)).filter(Boolean))];
    return {
      ...rest,
      id: idx + 1,
      major: idx < topN,
      review: {
        strength: discs.length >= 2 ? 'strong' : 'medium',
        disciplines: discs,
      },
    };
  });
  return out;
}

async function main() {
  resetUsage();
  console.log('[pipeline] 加载候选新闻…');
  const candidates = await getCandidates();
  if (!candidates || candidates.length < 15) {
    console.error('[pipeline] 候选不足 15 条，退出');
    process.exit(1);
  }
  const chosen = candidates.slice(0, 15);
  const { topics, nodes } = vocabText();

  const batches = [];
  for (let i = 0; i < chosen.length; i += BATCH) batches.push(chosen.slice(i, i + BATCH));

  const allItems = [];
  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`[pipeline] 生成第 ${b + 1}/${batches.length} 批（${batch.length} 条）…`);
    let items = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await generateBatch(batch, { topics, nodes, start: b * BATCH }, attempt === 1 ? lastErr : null);
        // 归一化（纠偏回受控词表）
        const norm = raw.map(normalizeItem);
        if (norm.some((x) => x === null)) {
          lastErr = ['部分条目 theories 全部无法映射到「社科节点」词表，请严格从上方节点 id 中选，不要用作文主题 id'];
          console.warn(`[pipeline] 第 ${b + 1} 批归一化失败（第${attempt + 1}次），重试…`);
          continue;
        }
        // 临时编号（供校验去重；最终由 decorate 重排为 1..15）
        norm.forEach((it, i) => { it.id = i + 1; });
        // 基本结构校验（按本批条数）
        const v = validate(norm, { expectedCount: BATCH });
        if (!v.ok) {
          lastErr = v.errors;
          console.warn(`[pipeline] 第 ${b + 1} 批校验失败（第${attempt + 1}次）: ${v.errors.slice(0, 3).join(' | ')}`);
          continue;
        }
        items = norm;
        break;
      } catch (e) {
        lastErr = [e.message];
        console.warn(`[pipeline] 第 ${b + 1} 批调用异常（第${attempt + 1}次）: ${e.message}`);
      }
    }
    if (!items) {
      console.error(`[pipeline] 第 ${b + 1} 批两次均失败，放弃本次生成`);
      process.exit(1);
    }
    allItems.push(...items);
  }

  const finalItems = decorate(allItems);
  const v = validate(finalItems);
  console.log(`[pipeline] 总校验: FAIL=${v.errors.length} WARN=${v.warns.length} 学科=${v.discs.join('/')}`);
  if (!v.ok) {
    v.errors.forEach((e) => console.error('  ✗ ' + e));
    console.error('[pipeline] 存在硬性失败，不写文件');
    process.exit(1);
  }
  v.warns.forEach((w) => console.warn('  ⚠ ' + w));

  if (DRY) {
    console.log('[pipeline] --dry-run，不写文件。预览首条：');
    console.log(JSON.stringify(finalItems[0], null, 2).slice(0, 1200));
    console.log(`[pipeline] 共 ${finalItems.length} 条，校验通过。`);
    return;
  }

  // 写回 news-data.js，保留近 7 天
  const data = loadNewsData();
  const today = shanghaiDate();
  data[today] = finalItems.map(({ skeleton, ...r }) => r);
  const keep = Object.keys(data)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7);
  const trimmed = {};
  keep.forEach((d) => (trimmed[d] = data[d]));

  const header = `/* NEWS_DATA — auto-managed data layer for 社会人 (C2).
  每日由云端脚本（scripts/news-pipeline.js + DeepSeek）自动生成并写回。
  结构见 NEWS_REVIEW_STANDARD.md：每日期 15 条，theories[] 仅用真实节点 id，
  essayTopics[] 由 AI 语义直写（受控词表）。加载方式：<script src="news-data.js"></script> */
`;
  fs.writeFileSync(NEWS_FILE, header + 'var NEWS_DATA = ' + JSON.stringify(trimmed, null, 2) + ';\n');
  console.log(`[pipeline] 已写入 ${today} 的 ${finalItems.length} 条新闻到 news-data.js（保留近 ${keep.length} 天）`);

  // 记录本次 DeepSeek 成本（真实用量 → 单价换算，详见 支出文档.html）
  try {
    const u = getUsage();
    const cost = recordCost({ date: today, type: 'pipeline', usage: u });
    console.log(`[pipeline] DeepSeek 成本记录: ${u.calls} 次调用 / 输入 ${u.prompt}(缓存 ${u.cached}) / 输出 ${u.completion} → ¥${cost.toFixed(4)}`);
  } catch (e) {
    console.warn('[pipeline] 成本记录失败(非致命):', e.message);
  }

  // 同步更新 review log（轻量）
  try {
    const logPath = path.join(ROOT, 'news-review-log.json');
    let log = [];
    try { log = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch (e) { log = []; }
    log.unshift({ date: today, generatedBy: 'cloud-pipeline', count: finalItems.length, discs: v.discs, model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' });
    fs.writeFileSync(logPath, JSON.stringify(log.slice(0, 30), null, 2));
  } catch (e) { /* log 非关键 */ }
}

main().catch((e) => {
  console.error('[pipeline] 致命错误:', e);
  process.exit(1);
});
