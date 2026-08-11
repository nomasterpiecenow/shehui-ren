/* scripts/validate-light.js — 轻量校验（不依赖 HTML/DOM，可在云端纯 Node 运行）
 * 镜像 news-validate.js 的硬性规则（S1/S2/S3/S4/S6/S7 的硬闸），作为云端发布门槛。
 * 本地仍可用 news-validate.js 做完整校验（含图谱节点集一致性）。
 *
 * 用法：const { validate } = require('./validate-light');
 *       const { ok, errors, warns } = validate(itemsArray);
 */
const {
  NODE_IDS,
  NODE_LABELS,
  nodeDisc,
  TOPIC_IDS,
  TOPIC_LIB,
} = require('./vocab');

const REQUIRED = ['id', 'title', 'source', 'url', 'theories'];

// S0 来源分层：疑似 UGC 个人源 -> 软告警（提示人工复核）
const UGC_PATTERNS = [
  /\/toutiao\.com\/w\//i,
  /xiaohongshu\.com/i,
  /douyin\.com/i,
  /iesdouyin\.com/i,
  /\/weibo\.com\/\d{4,}\//i,
  /\/weibo\.com\/[A-Za-z0-9_]+\/status/i,
  /\/m\.weibo\.cn\/(detail|status)\//i,
  /\/zhihu\.com\/(question|answer|people)\//i,
];
const looksUGC = (u) => UGC_PATTERNS.some((re) => re.test(u || ''));

function validate(items, { expectedCount = 15 } = {}) {
  const errors = [];
  const warns = [];
  const ok = (c, m) => { if (!c) errors.push(m); };
  const warn = (c, m) => { if (!c) warns.push(m); };

  ok(Array.isArray(items), 'items 不是数组');
  if (!Array.isArray(items)) return { ok: false, errors, warns, discs: [] };

  // S1 精确条数（整批默认 15；分批校验时传 expectedCount）
  ok(items.length === expectedCount, '应为 ' + expectedCount + ' 条, 实际 ' + items.length);

  const ids = items.map((i) => i.id);
  const titles = items.map((i) => (i.title || '').trim());
  if (new Set(ids).size !== ids.length) errors.push('存在重复 item.id');
  if (new Set(titles).size !== titles.length) errors.push('存在重复 title');

  const discs = new Set();
  items.forEach((it, i) => {
    const tag = '#' + (it.id ?? i);
    REQUIRED.forEach((f) =>
      ok(it[f] !== undefined && it[f] !== null && String(it[f]).trim() !== '', tag + ': 缺字段 ' + f)
    );
    // 速用金句必填
    ok(it.essayQuote && String(it.essayQuote).trim(), tag + ': 缺 essayQuote');
    // 作文主题必填
    ok(Array.isArray(it.essayTopics) && it.essayTopics.length >= 1, tag + ': 缺 essayTopics');
    (it.essayTopics || []).forEach((t, ti) => {
      const tt = tag + '.essayTopics[' + ti + ']';
      ok(t && TOPIC_IDS.has(t.id), tt + ': id 不在词表 -> ' + (t && t.id));
      if (t && TOPIC_IDS.has(t.id)) ok(t.label === TOPIC_LIB.topics[t.id].label, tt + ': label 与词表不一致');
    });
    // url 形如 http(s)
    ok(typeof it.url === 'string' && /^https?:\/\//.test(it.url.trim()), tag + ': url 非法 -> ' + it.url);
    if (looksUGC(it.url)) warns.push(tag + ': url 疑似 UGC 个人源 (' + it.url + ')');
    // theories 数组 + id 合法 + 至少 1 有效链接
    ok(Array.isArray(it.theories) && it.theories.length >= 1, tag + ': theories 为空');
    let validLink = 0;
    (it.theories || []).forEach((t) => {
      ok(t && NODE_IDS.has(t.id), tag + ': theory id 不在节点集 -> ' + (t && t.id));
      if (t && NODE_IDS.has(t.id)) {
        validLink++;
        discs.add(nodeDisc(t.id));
      }
    });
    ok(validLink >= 1, tag + ': 无有效理论链接');
    if (it.major === true) ok(validLink >= 1, tag + ': 标记为特大(major)但无有效链接');
    // 新结构必填：gist / thread / interpretations
    ok(typeof it.gist === 'string' && it.gist.trim(), tag + ': 缺 gist');
    ok(Array.isArray(it.thread) && it.thread.length >= 1, tag + ': 缺 thread');
    (it.thread || []).forEach((s, si) =>
      ok(s && typeof s.t === 'string' && typeof s.x === 'string', tag + '.thread[' + si + '] 缺 t/x')
    );
    ok(Array.isArray(it.interpretations) && it.interpretations.length >= 1, tag + ': 缺 interpretations');
    (it.interpretations || []).forEach((p, pi) => {
      const pt = tag + '.interpretations[' + pi + ']';
      ok(p && String(p.q).trim(), pt + ': 缺 q');
      ok(p && String(p.naive).trim(), pt + ': 缺 naive');
      ok(p && String(p.lens).trim(), pt + ': 缺 lens');
      ok(p && typeof p.lensId === 'string' && NODE_IDS.has(p.lensId), pt + ': lensId 不在节点集 -> ' + (p && p.lensId));
      ok(p && String(p.body).trim(), pt + ': 缺 body');
      ok(p && String(p.aha).trim(), pt + ': 缺 aha');
    });
  });

  // S3 整体学科覆盖（宽松告警）
  warn(discs.size === 3, '学科覆盖=' + [...discs].sort().join('/') + ' (期望三科)');

  return { ok: errors.length === 0, errors, warns, discs: [...discs] };
}

module.exports = { validate };
