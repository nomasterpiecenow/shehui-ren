/* scripts/vocab.js — 受控词表加载（无 DOM 依赖，可在云端纯 Node 运行）
 * 提供：
 *   NODE_IDS      311 个社科/经济/心理节点 id 集合
 *   NODE_LABELS   id -> label 映射
 *   nodeDisc(id)  推断学科：econ_/psy_ 前缀 + 其余为 soc
 *   TOPIC_LIB     34 个作文主题词表
 *   TOPIC_IDS     34 个主题 id 集合
 * 用在轻量校验（validate-light.js）与提示词构造（news-pipeline.js）。
 */
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // sociology-map 目录
const nodeIndex = require(path.join(ROOT, 'node-index.json'));
const TOPIC_LIB = require(path.join(ROOT, 'topic-lib.js'));

// 学科推断：econ_/psy_ 前缀一眼可分，其余（THINKERS/THEORIES/CONCEPTS/TOPICS 基础词表）一律 soc
function nodeDisc(id) {
  if (typeof id !== 'string') return null;
  if (id.startsWith('econ_')) return 'econ';
  if (id.startsWith('psy_')) return 'psy';
  return 'soc';
}

const NODE_IDS = new Set(Object.keys(nodeIndex.map));
const NODE_LABELS = nodeIndex.map;
const TOPIC_IDS = new Set(Object.keys(TOPIC_LIB.topics));

function topicLabel(id) {
  return TOPIC_LIB.topics[id] ? TOPIC_LIB.topics[id].label : null;
}

module.exports = {
  NODE_IDS,
  NODE_LABELS,
  nodeDisc,
  TOPIC_LIB,
  TOPIC_IDS,
  topicLabel,
  count: nodeIndex.count,
};
