---
name: frontend-layout
description: 「社会人」站点（sociology-map.html，单文件原生 HTML/CSS）的前端布局与视觉规范。任何改动 UI/CSS、做移动端或桌面端排版、调整新闻模块/知识图谱页视觉时，都必须先加载本技能，并与 responsive-design、shehui-ren-iterate 配套使用。固化了设计变量表、移动端铁律、断点约定、预览验收流程和反模式清单。关键词：布局、响应式、移动端、CSS、视觉、排版、社会热点、详情面板。
agent_created: true
---

# 前端布局规范（社会人 · sociology-map.html）

单文件 HTML + 原生 CSS（无 Tailwind/无框架）。本技能把本项目的**设计变量、移动端踩坑、断点约定、验收流程、反模式**固化下来，让每次改 UI 第一版就对齐项目审美，减少来回轮次。

**配套加载**：改 UI 时同时加载 `responsive-design`（通用响应式方法论）+ `shehui-ren-iterate`（发版/部署工作流）。三件套组合最稳。

## 1. 设计变量表（一律用 token，禁止随手写 hex/rgb）

所有颜色/圆角/字体都走 `:root` 里定义的 CSS 变量，新增样式**不要硬编码颜色值**，保持全站一致。

| 变量 | 值 | 用途 |
|------|-----|------|
| `--bg` | `#F5F0E8` | 页面底色（暖米） |
| `--bg-card` | `#FEFCF8` | 卡片/面板底色（近白） |
| `--text` | `#2D304B` | 主文字（深靛） |
| `--text-light` | `#6B6F8A` | 次要文字 |
| `--text-muted` | `#9B97A8` | 更弱/占位文字 |
| `--red` | `#C84B3A` | 主题强调色（导航、激活态、链接 hover） |
| `--red-soft` | `rgba(200,75,58,.12)` | 红色浅底（标签/引用块背景） |
| `--teal` | `#3A8C8C` | 辅助色（关联概念标签） |
| `--teal-soft` | `rgba(58,140,140,.12)` | 青色浅底 |
| `--navy` | `#3D4F8F` | 深色按钮底（如"在图谱中查看"） |
| `--border` | `#E5DFD4` | 常规边框 |
| `--border-light` | `#EDE8DE` | 浅边框/分割线 |
| `--radius` | `14px` | 大圆角（卡片） |
| `--radius-sm` | `8px` | 小圆角（按钮/标签/内联块） |
| `--font-display` | Fraunces / Noto Serif SC / Georgia | 标题/新闻标题/金句（衬线，有书卷气） |
| `--font-body` | Inter / -apple-system | 正文/按钮 |
| `--font-mono` | JetBrains Mono | eyebrow 小标/日期/来源等等宽技术感文字 |

> 配色定调：暖米底 + 深靛字 + 砖红强调；不要引入第 4 个主色。新增组件优先复用上表，而非造新色。

## 2. 移动端铁律（每条都来自真实踩坑）

1. **导航栏 56px**：所有页面若有固定/浮层头部，必须让出 56px（如 `#page-map{padding-top:56px}`）。浮层高度用 `calc(100dvh - 56px)`。
2. **高度用 `dvh` 不用裸 `vh`**：全屏面板/抽屉用 `height:calc(100dvh - 56px)`（带 `100vh` 兜底），避免 iOS 地址栏导致超出可见区/橡皮筋留白。
3. **iOS Safari 的 z-index 坑**：`nav` 上的 `backdrop-filter:blur` 会破坏 `position:fixed` 兄弟元素的层叠（Chromium 正常、iOS 异常）。**修法：别只靠 z-index，让浮层结构性不重叠**——抽屉 `top:56px; height:calc(100dvh-56px)` 下沉到导航栏下方，导航常驻可见。
4. **`top`/`bottom` 是相对"最近定位祖先"，不是视口**：任何 `position:absolute` 浮层改位置时，先确认最近 `position:relative/absolute/fixed` 容器在哪。例：图谱页 `.map-legend` 容器是 `.map-container`（已在导航栏正下方 56px 处），故 `.map-legend-disc{top:14px}` 是相对容器=相对导航栏底；想和底部 `bottom:14px` 对称，顶部也要 `14px`，不要误设 `70px`（会相对容器=距导航栏底70，叠56=距屏顶126，严重不对称）。
5. **触摸目标 ≥ 44×44px**（iOS HIG，也是 responsive-design 最佳实践）：按钮、分段控件、标签可点区都要达标，别做太小的点。
6. **杜绝横向溢出**：`html,body{overflow-x:hidden}` + `body{overscroll-behavior-y:contain}`。
7. **双视口验证，别靠读代码猜**：改完用无头 Chromium 跑 390×844（手机）+ 1280（桌面）两个视口，查 computed style（曾两次失手靠猜）。重点查：开关是否在一行、详情头部是否一行、有无横向滚动、浮层是否盖住导航。

## 3. 断点约定

- 桌面：默认样式（导航整列、新闻详情是右侧 440px 固定侧栏 `right:-440px`→`.open{right:0}`）。
- **手机：`@media (max-width:768px)`**：详情面板改为全屏抽屉（`width:100%`）；日期侧栏改为左侧滑入抽屉；网格单栏 `grid-template-columns:1fr`。
- 不用 `max-width:768px` 之外的花哨断点；如需微调用内容断点（responsive-design 的 Content Breakpoints 原则）。
- 流式单位优先：字号/间距能用 `clamp()` 流式缩放的优先用，减少硬编码 px（参考 responsive-design 的 fluid type/spacing scale）。

## 4. 预览验收流程（改完必走）

1. 改完 `sociology-map.html` 等 → **先 cp 同名到 `ctrip-claw`**（部署脚本读那里）。
2. 改了 HTML/CSS → **bump `sw.js` 缓存版本**（`const CACHE='shehui-ren-vN'`→N+1），否则手机 PWA 吃旧缓存。
3. 跑 `cd ctrip-claw && node deploy-netlify.js --staging` → 拿到**草稿预览地址**。
4. **把预览链接明文写进回复正文**（不要只说"已部署"），让用户手机/浏览器验收。
5. 用户说**「发布」**后，才跑 `node deploy-netlify.js`（不带 --staging）转正上线。
6. 同步 `feature-manifest.html` 版本徽标 + 更新日志；代码改动走 Gitee 手动 push（部署脚本仅在新闻变更时自动推）。

## 5. 反模式清单（来自用户多轮反馈，避免重犯）

- **不要在速用列表卡片里做红色跨卡 quote 框**：预览卡片沿用现有卡片样式，金句只替换灰字（gist→essayQuote），红色 `dp-quick` 强调块只用在**详情面板**里。
- **内外模式开关要解耦**：顶部大开关 = "打开详情的默认模式"；详情内小开关 = "仅当前这篇"。详情内切换**不要**反向覆盖外部大开关（曾因 `detailMode=newsMode` 每帧重置导致锁死切不动）。关闭再开仍按外部默认。
- **手机端别把"日期选择器"和"模式开关"分成两行**：用 `.topics-topbar` 横向 flex 一行放（左日期触发器 `flex:1` + 右模式开关 `margin:0`）。
- **详情头部元信息一行对齐**：分类小 title（`dp-kicker`，如"社会·社会学"）与分类标（`dp-cat`，"社会热点"）放同一行；"速用/完整"小开关**打头**放这一行最前，标题单独成行。别让 kicker 换行后再来一个 cat。
- **别把开关状态和列表卡片强绑到让人困惑**：开关效果要可见、可预期（用户曾因"切了看不出控制什么"而改方案）。
- **视觉一致性**：区块标题左对齐、用统一间距标度、`--font-display` 衬线做标题、保证对比度可读；不要混用多种圆角/阴影风格。

## 6. 加载组合建议

| 场景 | 加载 |
|------|------|
| 改新闻模块/知识图谱 UI、移动端排版 | `frontend-layout` + `responsive-design` + `shehui-ren-iterate` |
| 只发版/部署/新闻更新 | `shehui-ren-iterate` |
| 只做通用响应式方法论参考 | `responsive-design` |
