'use strict';
// 服务端 PDF 生成：用 pdf-lib + 黑体(simhei) 按 A4 精确排版。
// 特性：所有设备拿到同一份文件、中文正常、自动分页、绝不在卡片中间截断。
// 升级像素级还原(完全照搬网页设计)可后续换 puppeteer；MVP 用 pdf-lib 保证零原生依赖、到处能部署。
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { loadFontBytes } = require('./_common');

// 嵌入自定义字体（黑体）必须先注册 fontkit（实例方法，在 create 后调用）

// ---------- 调色板（对应站点视觉）----------
const C = {
  ink: rgb(0.10, 0.10, 0.18),
  sub: rgb(0.33, 0.33, 0.33),
  faint: rgb(0.60, 0.60, 0.60),
  accent: rgb(0.78, 0.20, 0.18),
  gist: rgb(0.95, 0.96, 0.97),
  accentSoft: rgb(1.0, 0.92, 0.90),
  major: rgb(0.85, 0.20, 0.20),
  ahaBg: rgb(1.0, 0.97, 0.85),
  ahaInk: rgb(0.62, 0.45, 0.10),
  line: rgb(0.85, 0.86, 0.90),
  sheet: rgb(1, 1, 1),
};

// A4
const PW = 595.28, PH = 841.89;
const M = 39.69; // 14mm 边距
const CONTENT_X = M, CONTENT_W = PW - M * 2;
const CONTENT_BOTTOM = PH - M;

// 字号（按密度）
function sizes(density) {
  if (density === 'compact') return { title: 9, meta: 7, body: 7.5, pad: 7, gap: 6 };
  if (density === 'loose') return { title: 16, meta: 12, body: 13, pad: 18, gap: 18 };
  return { title: 13, meta: 10, body: 11, pad: 12, gap: 12 }; // standard
}

function stripTags(s) { return (s || '').replace(/<[^>]+>/g, ''); }

function wrap(text, maxW, font, size) {
  const lines = []; let line = '';
  for (const ch of [...(text || '')]) {
    if (ch === '\n') { lines.push(line); line = ''; continue; }
    const test = line + ch;
    if (font.widthOfTextAtSize(test, size) > maxW && line) { lines.push(line); line = ch; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// 把一条新闻转成"行序列"（含文本框），供测量与绘制共用。
function cardRows(card, colW, opt, F) {
  const s = opt.size;
  const rows = [];
  let meta = (card._date || '') + (card.source ? ' · ' + card.source : '');
  if (card.major) meta = '【特大】' + meta;
  rows.push({ kind: 'text', text: meta, size: s.meta, color: C.faint, leading: s.meta * 1.4 });
  rows.push({ kind: 'text', text: card.title || '', size: s.title, color: C.ink, leading: s.title * 1.45 });
  rows.push({ kind: 'gap', h: 3 });
  if (opt.mode === 'quick') {
    if (card.gist) rows.push({ kind: 'box', text: card.gist, size: s.body, color: C.ink, bg: C.gist, line: C.accent, padV: 5, leading: s.body * 1.55 });
    if (card.essayQuote) rows.push({ kind: 'box', text: card.essayQuote, size: s.body, color: C.ink, bg: C.accentSoft, line: C.accent, padV: 6, leading: s.body * 1.6 });
  } else {
    (card.interpretations || []).forEach((ip, i) => {
      if (i) rows.push({ kind: 'gap', h: 5 });
      if (ip.lens) rows.push({ kind: 'text', text: ip.lens, size: s.meta, color: C.accent, leading: s.meta * 1.4 });
      if (ip.q) rows.push({ kind: 'text', text: 'Q：' + ip.q, size: s.body, color: C.ink, leading: s.body * 1.5 });
      if (ip.body) rows.push({ kind: 'box', text: stripTags(ip.body), size: s.body, color: C.ink, bg: null, indent: 6, line: C.line, padV: 0, leading: s.body * 1.55 });
      if (ip.aha) rows.push({ kind: 'text', text: '💡 ' + ip.aha, size: s.body * 0.95, color: C.ahaInk, leading: s.body * 1.5 });
    });
  }
  if (card.essayTopics && card.essayTopics.length) {
    rows.push({ kind: 'gap', h: 4 });
    rows.push({ kind: 'text', text: '主题：' + card.essayTopics.map(t => t.label).join('、'), size: s.meta, color: C.sub, leading: s.meta * 1.4 });
  }
  return rows;
}

function cardHeight(rows, pad, colW, F) {
  let h = pad * 2;
  for (const r of rows) {
    if (r.kind === 'gap') h += r.h;
    else if (r.kind === 'text') h += r.leading;
    else if (r.kind === 'box') {
      const maxW = colW - pad * 2 - (r.indent || 0);
      const lines = wrap(r.text, maxW, F.cn, r.size);
      h += r.padV * 2 + lines.length * r.leading;
    }
  }
  return h;
}

function drawCard(page, x, yTop, colW, rows, pad, F) {
  const h = cardHeight(rows, pad, colW, F);
  page.drawRectangle({ x, y: yTop - h, width: colW, height: h, color: C.sheet, borderColor: C.line, borderWidth: 0.8 });
  let cy = yTop - pad;
  for (const r of rows) {
    if (r.kind === 'gap') { cy -= r.h; continue; }
    if (r.kind === 'text') {
      const tx = x + pad + (r.indent || 0);
      page.drawText(r.text, { x: tx, y: cy - r.leading * 0.8, size: r.size, font: F.cn, color: r.color, maxWidth: colW - pad * 2 - (r.indent || 0) });
      cy -= r.leading;
    } else if (r.kind === 'box') {
      const maxW = colW - pad * 2 - (r.indent || 0);
      const lines = wrap(r.text, maxW, F.cn, r.size);
      const boxH = r.padV * 2 + lines.length * r.leading;
      if (r.bg) page.drawRectangle({ x: x + pad, y: cy - boxH, width: colW - pad * 2, height: boxH, color: r.bg, borderColor: r.line, borderWidth: 0.6 });
      let ty = cy - r.padV;
      for (const ln of lines) {
        page.drawText(ln, { x: x + pad + (r.indent || 0), y: ty - r.leading * 0.8, size: r.size, font: F.cn, color: r.color, maxWidth: maxW });
        ty -= r.leading;
      }
      cy -= boxH;
    }
  }
  return h;
}

function drawHeader(page, opt, F) {
  const x = CONTENT_X;
  let y = PH - M;
  page.drawText(opt.title, { x, y: y - 22, size: 22, font: F.cn, color: C.ink });
  y -= 30;
  if (opt.subtitle) { page.drawText(opt.subtitle, { x, y: y - 14, size: 12, font: F.cn, color: C.sub }); y -= 18; }
  if (opt.range) { page.drawText(opt.range, { x, y: y - 12, size: 10, font: F.cn, color: C.faint }); y -= 14; }
  // 红色分隔线
  const ruleY = y - 6;
  page.drawRectangle({ x, y: ruleY, width: CONTENT_W, height: 2, color: C.accent });
  return ruleY - 10; // contentTop
}

async function buildPdf(news, opt) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontBytes = await loadFontBytes();
  const cn = await pdf.embedFont(fontBytes, { subset: true });
  const F = { cn };
  const s = sizes(opt.density);
  const opt2 = Object.assign({ size: s, pad: s.pad }, opt);
  const cols = opt.density === 'compact' ? 3 : opt.density === 'loose' ? 1 : 2;
  const colGap = opt.density === 'compact' ? 6 : 12;
  const colW = (CONTENT_W - colGap * (cols - 1)) / cols;

  let page = pdf.addPage([PW, PH]);
  let contentTop = drawHeader(page, opt, F);
  let yTop = contentTop;
  let colIdx = 0;

  function newCol() {
    colIdx++;
    if (colIdx >= cols) { page = pdf.addPage([PW, PH]); contentTop = drawHeader(page, opt, F); colIdx = 0; }
    yTop = contentTop;
  }

  if (!news.length) {
    page.drawText('暂无素材', { x: CONTENT_X, y: contentTop - 20, size: 14, font: cn, color: C.faint });
  }

  for (const card of news) {
    const rows = cardRows(card, colW, opt2, F);
    const h = cardHeight(rows, s.pad, colW, F);
    if (yTop - h < CONTENT_BOTTOM) newCol();
    const x = CONTENT_X + colIdx * (colW + colGap);
    drawCard(page, x, yTop, colW, rows, s.pad, F);
    yTop -= (h + s.gap);
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

module.exports = { buildPdf };
