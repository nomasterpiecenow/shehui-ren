# 社会人 · 社会学知识图谱站点（源码仓库）

单文件 HTML + Canvas 力导向知识图谱，三学科（社会学 / 经济学 / 心理学）
+ 每日新闻页。正式站 https://shehui-ren.com （Netlify 托管）。

当前版本 **v1.49**（素材分类反向检索页 · 速用模式 · 作文主题受控词表 · 移动端适配）。
对应 service worker 缓存版本 `shehui-ren-v42`。

图谱规模：**311 节点 / 3 组连线表**（`CONCEPT_LINKS` / `THINKER_LINKS` / `EXTRA_CONCEPT_LINKS`）。
节点分四类 `cat ∈ {thinker, theory, concept, topic}`，三学科 `disc ∈ {soc, econ, psy}`。

---

## 仓库里有什么

| 文件 | 作用 |
|------|------|
| `sociology-map.html` | 主站（知识图谱 + 新闻页合一），~350KB 单文件 |
| `sw.js` | PWA service worker，**改 HTML/CSS 后必须 bump 缓存版本**（`const CACHE = 'shehui-ren-vN'`），否则手机端缓存旧页面 |
| `feature-manifest.html` | 功能契约（记录各模块真实状态 + 更新日志），每次大改动同步升版本 |
| `news-data.js` | 外置新闻数据（`var NEWS_DATA={...}`），自动化每天只改这个文件；**最多保留 7 个日期**，入新日期须修剪最旧的 |
| `manifest.webmanifest` / `*.svg` / `robots.txt` / `sitemap.xml` / `_redirects` | PWA 与站点元数据 |
| `NEWS_REVIEW_STANDARD.md` / `news-validate.js` / `news-review-log.json` | 新闻审核规范与校验脚本 |
| `deploy-netlify.js` | **跨设备通用版**部署脚本（自动探测 node / netlify-cli，详见下方） |
| `sync.js` / `sync.command` / `sync.bat` | **开工前同步检查**：确认已连 Gitee 且是最新状态，双击即跑 |
| `_check_refs.js` / `_validate_v11.js` / `_node_map.json` 等 `_` 前缀脚本 | 节点/数据维护工具（非必需，留作备用） |

> ⚠️ `.netlify_token` **不在仓库里**（已被 `.gitignore` 忽略），部署需要它，见下。

---

## ⚠️ 每次开工前：先跑同步检查

本项目在**公司 Windows + 家里 Mac 两台机器**上交替改动，动手前务必确认本地是最新的：

```bash
node sync.js
```

或直接**双击** `sync.command`（Mac）/ `sync.bat`（Windows）。

脚本会检查：是否 git 仓库 → origin 是否指向 Gitee → 分支跟踪关系 → fetch 最新 →
报告落后/领先/未提交改动。工作区干净且落后时会自动 `git pull --rebase`；
若本地也有改动则**不自动动**，只提示 `stash → pull --rebase → stash pop` 的处理顺序。

> 改完一轮记得 `git commit` + `git push`，否则另一台机器拿不到。

---

## 另一台设备第一次上手

### 1. 拿到代码
```bash
git clone https://gitee.com/no-works-yet/shehui-ren.git
cd shehui-ren
```

### 2. 装 netlify-cli（只需一次）
部署脚本调用 netlify-cli，装到 WorkBuddy 的 managed node 工作区里（不污染全局）：
```bash
# Mac
cd ~/.workbuddy/binaries/node/workspace && \
  ~/.workbuddy/binaries/node/versions/22.22.2/bin/npm install netlify-cli

# Windows（Git Bash / PowerShell 相应调整）
cd "$HOME/.workbuddy/binaries/node/workspace" && npm install netlify-cli
```

### 3. 放部署令牌（只需一次）
登录 Netlify 后台 → User settings → Applications → 生成一个 **Personal Access Token**，
把它存成仓库根文件 `.netlify_token`（纯文本，一行）：
```bash
echo "你的令牌内容" > .netlify_token
```
或导出环境变量 `NETLIFY_AUTH_TOKEN=你的令牌`（脚本优先读环境变量）。

### 4. node / netlify-cli 路径（一般不用管）
脚本会**按当前系统自动探测**：
- Mac / Linux：`~/.workbuddy/binaries/node/versions/*/bin/node` + `~/.workbuddy/binaries/node/workspace/node_modules/netlify-cli/bin/run.js`
- Windows：`D:/Users/wtianyi/.workbuddy/...` 下的对应路径

只有在路径特殊时才需要手动覆盖：
```bash
export WB_NODE=/path/to/node
export WB_NETLIFY=/path/to/netlify-cli/bin/run.js
```

### 5. 改完代码后部署
改完 `sociology-map.html` / `sw.js` / `feature-manifest.html` 后：
1. 若改了 HTML/CSS → **先 bump `sw.js` 的 `CACHE` 版本号**（v11→v12…），强制手机刷新；
2. 同步 `feature-manifest.html` 顶部版本徽章 + 底部更新日志表格；
3. 跑部署：
```bash
node deploy-netlify.js
```

---

## 部署脚本的兜底机制

Netlify 免费额度耗尽时，生产部署（`deploy --prod`）会返回 **403
`Account credit usage exceeded`**，但**草稿部署仍被允许**。脚本因此内置两段式兜底：

1. 先试 `netlify deploy --prod` —— 成功即结束；
2. 失败则 `netlify deploy`（草稿，`--json` 取 `deploy_id`）；
3. 再 `POST /sites/{siteId}/deploys/{deployId}/restore` 把草稿发布为生产版本
   （走「回滚/发布已有部署」通道，不受 new-deploy 拦截，实测可正常上线）。

---

## 本地约定

- 改完主文件 → 跑 `deploy-netlify.js` 直接发布源目录（脚本 `SITE_DIR` 即仓库自身）。
- 本仓库的 `deploy-netlify.js` 是跨设备版；原 `ctrip-claw` 目录里另有一份写死本机绝对路径的版本，
  那是本机每日新闻自动化（9:06 / 21:06）调用的，二者并存不冲突。
- 新闻自动化只改 `news-data.js`，改完 `cp news-data.js ../ctrip-claw/`（若仍沿用镜像流程）。
- `news-validate.js` 直接跑会报 `navigator is not defined`：需用临时副本，在
  `sandbox.globalThis = sandbox;` 之后注入 `navigator` / `matchMedia` / `localStorage` /
  `location` 桩再运行，跑完删除临时副本（不改项目原文件）。

---

## 版本历史（摘要，完整见 `feature-manifest.html`）

| 版本 | 日期 | 要点 |
|------|------|------|
| v1.36 | 2026-08-03 | 新增「素材卡片一键导出」（news-export.html，近7天全量105条，浏览器原生打印 A4/PDF，免费） |
| v1.30–v1.35 | 2026-08-03 | 知识图谱节点学科圆点、移动端学科筛选/时间轴/间距适配（详见 feature-manifest.html） |
| v1.29 | 2026-07-31 | 默认只勾核心概念 / 取消节点静态抖动 / 链接颜色加深 |
| v1.28 | 2026-07-31 | 标签字号再次大幅缩小（thinker 11→8px 等） |
| v1.27 | 2026-07-31 | 深度对齐 Obsidian：边改中性灰低 alpha、节点降饱和、删背景点阵 |
| v1.26 | 2026-07-29 | 删节点外环/光晕、边改细直线（对齐 Obsidian Graph View） |
| v1.25 | 2026-07-29 | 标签阈值反转（视口内 ≤60 节点才显名）、节点极小化、移动端筛选适配 |
| v1.24 | 2026-07-29 | 手机端进页面可读、画布满屏铺散、重置视角按钮 |
| v1.23 | — | 手机端三学科聚簇 + 语义缩放 + 学科色环加粗 |
