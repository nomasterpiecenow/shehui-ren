/* _annotate_topics.js — 为 news-data.js 每条【尚未标注】的新闻补 essayTopics
 *
 * 设计原则：
 *   - 受控词表（topic-lib.js）只定义作文主题本身（id/label/dim/def/keywords），
 *     不含社科节点——「作文主题不关联社科节点」是产品决策（界面不展示节点关联）。
 *   - 「新闻社科节点 → 作文主题」的映射放在本脚本内部的 NODE_TO_TOPIC（打标规则，
 *     非展示），职责分离：词表给用户看，打标规则内部用。
 *   - 幂等：已含 essayTopics 的块严格跳过、绝不改写；可每日重复运行只补新增新闻。
 *
 * 命中规则（与原逻辑等价，nodes 来源由 topic-lib 改为 NODE_TO_TOPIC）：
 *   - 节点命中：新闻 theories[]/lensId 节点集 命中 某主题的 NODE_TO_TOPIC 节点 → 该主题
 *   - 关键词兜底：仅当某主题无节点命中时，用 topic.keywords 在新闻块内命中（青春/家国/思辨等纯关键词维度）
 *   - 每条新闻最多 4 个主题
 *
 * 运行：node _annotate_topics.js   （在 sociology-map 目录；自动化每日新闻入库后调用）
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = __dirname;
const libSrc = fs.readFileSync(path.join(root, 'topic-lib.js'), 'utf8');
const libCtx = {};
vm.runInNewContext(libSrc, libCtx);
const TOPIC_LIB = libCtx.TOPIC_LIB;
const TOPIC_IDS = Object.keys(TOPIC_LIB.topics);

/* ── 打标规则：社科节点 id → 作文主题 id[]（内部用，非展示）──
 * 来源：基于语义归类 + 历史标注频率强信号重建（覆盖新闻实际用到的 64 个节点）。
 * 节点 id 必须与 sociology-map.html 的社科节点全集一致。 */
const NODE_TO_TOPIC = {
  // 科技与人文
  technology: ['tech_for_good','ai_ethics','virtual_real','self_aware','green_dev'],
  digital: ['tech_for_good','ai_ethics','info_cocoon','virtual_real'],
  goffman: ['info_cocoon','virtual_real'],
  panopticon: ['tech_for_good','ai_ethics','info_cocoon'],
  attention_economy: ['info_cocoon','virtual_real','deep_think','fast_slow'],
  media: ['info_cocoon','virtual_real','deep_think','fast_slow'],
  psy_attachment: ['virtual_real','self_aware'],
  psy_cognitive_bias: ['info_cocoon','deep_think','knowledge_anxiety'],
  psy_emotion: ['info_cocoon','deep_think','self_aware','virtual_real','fast_slow'],
  psy_social_influence: ['info_cocoon','virtual_real','fast_slow','deep_think'],
  psy_conformity: ['info_cocoon','community','virtual_real'],
  rationalization_concept: ['tech_for_good','ai_ethics','freedom_rules','persist_flex'],
  rationalization_theory: ['tech_for_good','ai_ethics','virtual_real','gain_loss','harmony_nature'],
  econ_monopoly: ['tech_for_good','ai_ethics','info_cocoon','fairness'],
  econ_public_goods: ['tech_for_good','info_cocoon'],
  science: ['tech_for_good','green_dev'],
  econ_growth: ['tech_for_good','green_dev','self_vs_greater'],
  // 社会现实·人类关怀
  social_capital: ['altruism','trust','community','risk_uncertain'],
  risk_society: ['risk_uncertain','community','altruism','trust','gain_loss','harmony_nature'],
  stratification: ['fairness','prejudice','youth_struggle'],
  econ_welfare: ['fairness','altruism','trust','community','risk_uncertain','youth_struggle'],
  poverty: ['altruism','fairness','risk_uncertain'],
  urban: ['community','fairness','altruism','risk_uncertain'],
  globalization: ['civ_exchange','community','fairness','prejudice'],
  othering: ['civ_exchange','prejudice','community','altruism'],
  gender: ['fairness','prejudice','self_aware'],
  meritocracy: ['fairness','prejudice','self_aware'],
  // 道德修养 + 规则 + 经济伦理
  law: ['freedom_rules','persist_flex','integrity','fairness'],
  institutionalism: ['persist_flex','fairness','integrity','lifelong_learn'],
  econ_moral_hazard: ['integrity','righteousness_interest','freedom_rules','trust'],
  econ_info_asym: ['righteousness_interest','trust','knowledge_anxiety','freedom_rules'],
  econ_adverse_selection: ['freedom_rules','integrity','righteousness_interest'],
  econ_monetary_policy: ['fairness','risk_uncertain','harmony_nature'],
  econ_macro: ['fairness','risk_uncertain','self_vs_greater'],
  econ_supply_demand: ['fairness','green_dev','self_vs_greater'],
  econ_public_finance: ['righteousness_interest','fairness','community'],
  econ_finance: ['righteousness_interest','fairness'],
  econ_inflation: ['fairness','community'],
  econ_gdp: ['fairness','prejudice','community'],
  econ_human_capital: ['duty_devote','fairness','lifelong_learn'],
  econ_labor: ['duty_devote','fairness','ai_ethics','times_mission'],
  econ_environmental_econ: ['harmony_nature','green_dev'],
  econ_veblen: ['righteousness_interest','fairness','harmony_nature'],
  capital_forms: ['inherit_innovate','info_cocoon'],
  econ_behavioral: ['righteousness_interest','fairness','knowledge_anxiety','freedom_rules','deep_think'],
  // 青春 / 自我 / 学习 / 心理
  education: ['lifelong_learn','fairness','youth_struggle','no_lying_flat','deep_think','knowledge_anxiety','self_aware'],
  psy_mental_health: ['self_aware','youth_struggle','ai_ethics','community'],
  psy_self_efficacy: ['duty_devote','self_aware','youth_struggle'],
  psy_obedience: ['freedom_rules','lifelong_learn','self_aware','youth_struggle'],
  psy_milgram: ['freedom_rules','lifelong_learn','self_aware','youth_struggle'],
  psy_positive: ['self_aware','youth_struggle','times_mission','ai_ethics'],
  psy_growth_mindset: ['lifelong_learn','deep_think','no_lying_flat','self_aware'],
  psy_stress: ['fairness','prejudice','self_aware','youth_struggle'],
  socialization: ['duty_devote','self_aware','deep_think'],
  family: ['community','lifelong_learn','youth_struggle','info_cocoon','deep_think'],
  health: ['risk_uncertain','fairness','freedom_rules','harmony_nature','gain_loss'],
  durkheim: ['righteousness_interest','fairness','community'],
  psy_loss_aversion: ['integrity','righteousness_interest','gain_loss'],
  // 文化自信
  cultural_capital: ['inherit_innovate','tradition_activate'],
  // 生态
  environment: ['harmony_nature','green_dev'],
  // 其他通用
  alienation: ['self_aware','duty_devote','tech_for_good'],
  deviance: ['freedom_rules','integrity','righteousness_interest','trust'],
  emotional_labor: ['duty_devote','deep_think'],
  work: ['duty_devote','fairness','youth_struggle','persist_flex','freedom_rules','integrity','self_aware','ai_ethics'],
};

let src = fs.readFileSync(path.join(root, 'news-data.js'), 'utf8');
const NL = src.includes('\r\n') ? '\r\n' : '\n';

// 找到每个新闻块的起始位置（id: N,）—— 兼容 CRLF，不锚定换行符
const startRe = /id:\s*(\d+),/g;
const starts = [];
let m;
while ((m = startRe.exec(src))) starts.push(m.index);
const totalEnd = src.lastIndexOf('};'); // NEWS_DATA 结尾

function topicsForBlock(block) {
  const nodeSet = new Set();
  let mm;
  const lensRe = /lensId:'([^']+)'/g;
  while ((mm = lensRe.exec(block))) nodeSet.add(mm[1]);
  const tidRe = /theories:\s*\[([\s\S]*?)\]/;
  const tm = block.match(tidRe);
  if (tm) {
    const idRe = /id:'([^']+)'/g;
    while ((mm = idRe.exec(tm[1]))) nodeSet.add(mm[1]);
  }
  const nodeHits = [];
  const kwHits = [];
  for (const tid of TOPIC_IDS) {
    const t = TOPIC_LIB.topics[tid];
    const nodeMap = NODE_TO_TOPIC[tid] || [];
    if (nodeMap.length && nodeMap.some(n => nodeSet.has(n))) {
      nodeHits.push(tid);
    } else if (t.keywords && t.keywords.length && t.keywords.some(k => block.includes(k))) {
      kwHits.push(tid);
    }
  }
  // 节点命中优先，再补关键词命中；每条新闻最多 4 个
  const combined = nodeHits.concat(kwHits).filter((v, i, a) => a.indexOf(v) === i);
  return combined.slice(0, 4).map(tid => ({ id: tid, label: TOPIC_LIB.topics[tid].label }));
}

// 从后往前插入，避免索引偏移
let inserted = 0, skipped = 0;
for (let i = starts.length - 1; i >= 0; i--) {
  const newsStart = starts[i];
  const blockEnd = (i + 1 < starts.length) ? starts[i + 1] : totalEnd;
  const block = src.slice(newsStart, blockEnd);
  if (/essayTopics:/.test(block)) { skipped++; continue; }   // 已标注：严格跳过，绝不改写
  const thRe = /theories:\s*\[[^\]]*\]/;
  const thm = block.match(thRe);
  if (!thm) { skipped++; continue; }                          // 无 theories：跳过（防误插）
  const topics = topicsForBlock(block);
  if (!topics.length) { skipped++; continue; }
  const insertAt = newsStart + thm.index + thm[0].length;
  const snippet = ',' + NL + '      essayTopics: ' + JSON.stringify(topics);
  src = src.slice(0, insertAt) + snippet + src.slice(insertAt);
  inserted++;
}

fs.writeFileSync(path.join(root, 'news-data.js'), src, 'utf8');
console.log(`done. inserted=${inserted}, skipped(no topics / already has / no theories)=${skipped}, total news blocks=${starts.length}`);
