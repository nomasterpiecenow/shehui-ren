# 社会人 · 社会学知识图谱站点（源码仓库）

单文件 HTML + Canvas 力导向知识图谱，三学科（社会学 / 经济学 / 心理学）
+ 每日新闻页。正式站 https://shehui-ren.com （Netlify 托管）。

当前版本 **v1.23**（手机端三学科聚簇 + 语义缩放 + 学科色环加粗）。

---

## 仓库里有什么

| 文件 | 作用 |
|------|------|
| `sociology-map.html` | 主站（知识图谱 + 新闻页合一） |
| `sw.js` | PWA service worker，**改 HTML/CSS 后必须 bump 缓存版本**（`const CACHE = 'shehui-ren-vN'`），否则手机端缓存旧页面 |
| `feature-manifest.html` | 功能契约（记录各模块真实状态 + 更新日志），每次大改动同步升版本 |
| `news-data.js` | 外置新闻数据（`var NEWS_DATA={...}`），自动化每天只改这个文件 |
| `manifest.webmanifest` / `*.svg` / `robots.txt` / `sitemap.xml` / `_redirects` | PWA 与站点元数据 |
| `NEWS_REVIEW_STANDARD.md` / `news-validate.js` / `news-review-log.json` | 新闻审核规范与校验脚本 |
| `deploy-netlify.js` | **跨设备通用版**部署脚本（相对路径，详见下方） |
| `_check_refs.js` / `_validate_v11.js` / `_node_map.json` 等 `_` 前缀脚本 | 节点/数据维护工具（非必需，留作备用） |

> ⚠️ `.netlify_token` **不在仓库里**（已被 `.gitignore` 忽略），部署需要它，见下。

---

## 另一台设备第一次上手

### 1. 拿到代码
```bash
git clone <你的远程仓库地址> shehui-ren
cd shehui-ren
```

### 2. 放部署令牌（只需一次）
登录 Netlify 后台 → User settings → Applications → 生成一个 **Personal Access Token**，
把它存成仓库根文件 `.netlify_token`（纯文本，一行）：
```bash
# 例如（Windows Git Bash / Mac 终端）
echo "你的令牌内容" > .netlify_token
```
或导出环境变量 `NETLIFY_AUTH_TOKEN=你的令牌`（脚本优先读环境变量）。

### 3. 配置 node / netlify-cli 路径（Mac 尤其需要）
脚本默认回退到 Windows 本机路径。Mac 上请先定位本机的 managed node 与 netlify-cli：
```bash
# 一般在 ~/.workbuddy/binaries/... 下
export WB_NODE="$HOME/.workbuddy/binaries/node/versions/22.22.2/node.exe"   # Mac 上是 node 可执行文件，无 .exe
export WB_NETLIFY="$HOME/.workbuddy/binaries/node/workspace/node_modules/netlify-cli/bin/run.js"
```
（Windows 本机若路径一致则无需设，脚本会自动用默认值。）

### 4. 改完代码后部署
改完 `sociology-map.html` / `sw.js` / `feature-manifest.html` 后：
1. 若改了 HTML/CSS → **先 bump `sw.js` 的 `CACHE` 版本号**（v5→v6…），强制手机刷新；
2. 同步 `feature-manifest.html` 版本与更新日志；
3. 跑部署：
```bash
node deploy-netlify.js        # 或 WB_NODE=... WB_NETLIFY=... node deploy-netlify.js
```

---

## 本地约定（与本仓库一致）

- 改完主文件 → 跑 `deploy-netlify.js` 直接发布源目录（脚本 `SITE_DIR` 即仓库自身）。
- 本仓库的 `deploy-netlify.js` 是跨设备版；原 `ctrip-claw` 目录里另有一份写死本机绝对路径的版本，
  那是本机每日新闻自动化（9:06 / 21:06）调用的，二者并存不冲突。
- 新闻自动化只改 `news-data.js`，改完 `cp news-data.js ../ctrip-claw/`（若仍沿用镜像流程）。
