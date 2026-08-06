# 项目长期记忆 — sociology-map（社会人 新闻站）

## ⚠️ 开工前必做（用户明确要求，2026-08-02）
用户在**公司 Win + 家里 Mac 两台机器**交替改动。**每次执行任务前**必须先跑：
`cd /Users/wangtianyi/shehui-ren && node sync.js`
确认已连 Gitee（origin = https://gitee.com/no-works-yet/shehui-ren.git）且不落后远程，然后再动手。

**为什么必须 pull 最新（用户 2026-08-03 强调）**：新闻数据经常是**在另一台机器上 push 到 Git** 的（例如 28–31 号新闻就是 Windows 那台推上 Gitee 的）。如果这台 Mac 不先拉最新就动手，两边就会分叉、事后冲突。sync.js 在「工作区干净且落后」时会自动 `git pull --rebase` 把最新代码 down 下来；若本地也有改动则只给 `stash → pull --rebase → stash pop` 顺序、绝不自动动，避免搅乱半截改动。

收尾必须 `git commit && git push`，否则另一台机器丢改动。
详细工作流见项目技能 `.workbuddy/skills/shehui-ren-iterate/SKILL.md`。

## 🚦 发布流程：预览优先（用户 2026-08-03 准则）
- **任何改动先出预览链接、用户验收通过后再正式发布**。`deploy-netlify.js` 已支持：
  - `node deploy-netlify.js --staging` → 只发**草稿**（生成独立 `https://xxxx.netlify.app` 预览 URL，**不发布到 shehui-ren.com 生产域**），把链接发用户验收；
  - 用户确认后 `node deploy-netlify.js`（不带 `--staging`）→ 正式上线生产。
- 预览 URL 在手机/电脑均可打开验收；改完需再 `--staging` 一次生成新预览（旧草稿失效）。
- 配套安全：仓库根已加 `.netlifyignore`，排除 `.netlify_token`/`.gitee_token`/`.workbuddy/`/`_*.js`/`sync.*`/`deploy-netlify.js` 等，避免内部/密钥文件随发布公开。部署时仍建议把 `.netlify_token` 临时移出、改走环境变量 `NETLIFY_AUTH_TOKEN`。

## 📄 feature-manifest.html — 改造沟通主文件（用户 2026-08-03 同步）
- 这是「社会人」项目的**核心沟通 / 功能契约文档**（标题：功能模块说明文档）。每次网站有新内容更新，都先把内容整理进此文件；**后续改造讨论、需求反馈、改动记录优先通过此文件交流**（而非只在聊天里说）。
- 文件结构：顶部版本徽章（`vX.Y · YYYY-MM-DD`）+ 中段各功能模块技术说明 + 底部「更新日志」表（日期 / 版本 / 改动内容 / 涉及模块）。
- 版本三处必须同步（含此处）：① `sw.js` 的 `CACHE='shehui-ren-vN'`；② `feature-manifest.html` 顶部徽章 + 底部更新日志表（每次改动在表头追加一行）；③ README 当前版本行。**改 HTML/CSS 必 bump sw 缓存并同步此文件。**
- 我方改完后：在更新日志表**顶部**追加一行（最新日期 / 版本 / 改动摘要 / 涉及模块），保持与 sw 缓存版本、README 一致，再 deploy。

## 🎯 产品定位：速用 / 深度双模式（2026-08-04 用户调研结论）
- **用户调研**：一位高中语文老师看站后反馈——不仔细看解释，联想不到这是"积累作文素材"的；素材偏"高深"、应用门槛高。
- **分层需求**：冲 985 的学生有耐心积累、自己琢磨应用角度；**中等偏低学生痛点不是"写不好"而是"根本写不出来"**，要的是"能直接放进作文里的句子"或"一个事例"。
- **决策（A 方向：加速用层）**：首页 + 导出卡片都做「速用 / 深度」切换开关，**默认速用**，打开切深度。
  - **速用模式**（面向中下层 / 写不出作文的学生）= 时事新闻**摘要**（`gist`）+ **一句直接能套用的句子**。
  - **套用句调性（2026-08-04 用户明确要求）**：须用应试"假大空"金句风——参考高考满分作文套路（对仗/四字格/宏大意象如时代·岁月·良知·初心/回扣材料再升华），让学生能直接抄进作文、阅卷加分。已联网调研真实样本（阅卷老师私藏万能开头结尾、满分作文核心技巧、法治类素材）。普通白话句不行。
  - **三风格交叉原则（2026-08-04 用户明确）**：排比三连 / 对称标题句 / 青年呼告 **三者不互斥、按素材特性交叉选**，不能一页全用排比（排比只能当结尾句）。采编"选择器"：① 法治/正义类（自带文明·良知宏大词）→ 对称句，适合作分论点/标题；② 经济/民生类 → 排比三连，收尾升华拔高到时代/创新；③ 社会互助/责任类 → 青年呼告，扣"青年担当"立意、收尾必扣青年。每条采编时定风格，随 `usable` 字段入库（demo 见 news-speed-demo.html 三篇交叉演示）。
  - **适用话题标签（受控词表 taxonomy，2026-08-04 升级）**：对标小红书 [适用主题]，但用户指出自由生成词（"社会观察/人间万象"）太泛、无指向、不可反向检索/不可拓展。改为建立**有限、有指向的受控主题词表**：① 调研全网高考/联考/人民日报时评，抽象出 8 大领域 × 35 个受控标签（青春成长/家国时代/文化传承/科技人文/社会公义/品德修身/自然生态/思辨哲理），每标签对应一类明确作文命题方向；② 节点 `lensId` 映射到受控标签（而非自由词），新闻→标签正向、标签→新闻反向检索都成立；③ 后续可拓展，边界清晰。草案 `topic-taxonomy.js`（提案，未部署）。待用户审阅领域/标签划分后，再做 lensId→受控标签映射 + 标签反查新闻原型。原 `topic-tags.js` 自由词方案已弃用。
  - **⚡ 2026-08-06 现状：Windows 端已实现官方版并上线（v1.39→v1.48）**：`topic-lib.js` 受控词表（9 维度 ~34 标签，带 def+keywords 兜底，封闭词表）、新闻 `essayTopics`（AI 语义直写方案C，全新闻覆盖 1–4 个）+ `essayQuote`（速用金句必填硬闸）、速用模式 UI 已落地（热点页/卡片/详情/导出）。实现路线选"AI 直写"而非 lensId 映射（更灵活且同样满足封闭词表+可反向检索）。我方 `topic-taxonomy.js`/`topic-tags.js`/`news-speed-demo.html` 草案已无必要，归档即可。**待做：标签→新闻反向检索 UI**（数据已具备，浏览页未做）。
  - **深度模式**（面向 985 苗子）= 现有全套多视角解读（lens / naive / body / aha / research）。
- **数据缺口**：当前 `news-data.js` 无"套用句"字段。方案：新增 `usable` 字段（一句可落笔的套用句），由采编在 Windows 端生成入库；正式落地前可先用 `aha` 占位做 UI 验证（临时版）。
- **对盈利的含义**：家长付费买的是"孩子能用上"，导出卡片的"套用句"块是最有付费意愿的锚点；建议免费给深度浏览、付费给"能直接打印带去学校套用"的速用版。

## 代码结构要点（2026-08-02 核实）
- 版本三处必须同步：`sw.js` 的 `CACHE='shehui-ren-vN'`、`feature-manifest.html` 顶部徽章 + 底部更新日志表、README 的当前版本行。改 HTML/CSS 必 bump 缓存。
- 连线**不是**单一 EDGES 数组，分三张表：`EXTRA_CONCEPT_LINKS`(~1017) / `CONCEPT_LINKS`(~1028) / `THINKER_LINKS`(~1089)，运行时在 `edges=[]`(~2895/2976) 组装。写校验脚本别只找 EDGES。
- `rationalization` 重名 bug **已修复**（拆为 `rationalization_theory` / `rationalization_concept`），311 节点当前无重复 id。

## 部署环境（2026-08-02）
- `deploy-netlify.js` 已跨平台化：自动探测 `~/.workbuddy/binaries/node/versions/*/bin/node` 与 workspace 下 netlify-cli，WB_NODE/WB_NETLIFY 可覆盖。
- Mac 端首次使用需两步：① `cd ~/.workbuddy/binaries/node/workspace && ~/.workbuddy/binaries/node/versions/22.22.2/bin/npm install netlify-cli`；② 仓库根放 `.netlify_token` 或设 `NETLIFY_AUTH_TOKEN`。
- 干跑验证技巧：`NETLIFY_AUTH_TOKEN=dummy node deploy-netlify.js`，在 cli 缺失时安全退出，不会触发真实部署。

## news-validate.js 运行须知（重要，2026-07-28 更新）
- 直接用 `node news-validate.js` 会报 `navigator is not defined`；只补 navigator 后又报 `window.matchMedia is not a function`（HTML 内联脚本已新增 matchMedia 调用）。
- 解决：用临时副本，在 `sandbox.globalThis = sandbox;` 之后注入全套桩再运行、跑完删除（不要改项目原文件）：
  - `sandbox.navigator = {userAgent,language,platform,maxTouchPoints:0,standalone:false,serviceWorker:undefined}` + `sandbox.window.navigator`
  - `sandbox.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}})` + `sandbox.window.matchMedia`
  - `localStorage/sessionStorage`（getItem 返回 null）、`location`（href/search/hash/pathname）桩
- HTML 若再新增浏览器 API，报错会逐个暴露，按同样方式补桩即可。

## 失效/禁用节点 id（写入 theories/lensId 前务必避开）
- 当前 311 节点集中确认缺失：`social_work`、`social_governance`、`social_comparison`、`consumption`、`aging`、`econ_incentive`、`modernity`、`fertility`、`population`、`psy_loneliness`（以及历史上被禁的 `urbanization` 等）。
- 可用替代：`social_capital`、`family`、`work`、`alienation`、`urban`、`econ_welfare`(福利经济学)、`institutionalism`(新制度主义)、`technology`(科技社会学)、`econ_industrial_org`(产业组织)、`late_modern`、`econ_veblen`。
- 校验前用 `_node_map.json` 的 `.map` 子对象批量核对 id 是否∈节点集。
- 文案质检：AI 生成长中文文案偶发混入外文词（曾出现 первый/precisely），入库后跑一次非中文字符扫描。

## 新闻数据契约
- 数据文件 `news-data.js`：`var NEWS_DATA = { 'YYYY-MM-DD': [15 items] }`，每个日期恰好 15 条。
- S7：最多保留 7 个日期，入库新日期时须修剪最旧日期。
- 镜像目录：`D:/Users/wtianyi/ctrip-claw/`，每次更新同步 news-data.js + news-review-log.json。
- S9 前沿研究：嵌套在 interpretation.research 内，fromNode 必须∈节点集；仅 best-effort，不强制。
