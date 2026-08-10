# 付费下载 PDF 链路 · 接入与部署指南

本文件说明「社会人」素材册付费下载功能的**生产接入**步骤。本地联调（mock 模式）已开箱即用，真实收款需按本文配置商户号与密钥。

---

## 0. 架构总览

```
news-export.html (前端)
   │  点击「下载 PDF（付费）」
   ▼
create-order  ──POST──▶  生成订单（mock / 微信 / 支付宝）
   │
   ▼  (mock) 返回 confirmUrl ｜ (真实) 返回收款码 code_url
pay-confirm   ◀──GET─── 模拟支付成功回调（仅 mock）
   │  签发 HMAC 权益令牌 token
   ▼
download      ──GET ?token──▶  校验令牌 → 服务端用 pdf-lib 生成 PDF → 返回 application/pdf
```

- **权益令牌**：`HMAC-SHA256` 签名，`{paid, plan, iat, exp}`，下载时只验签名+有效期，**不查库**，可水平扩展。
- **字体**：`api/_common.js` 的 `loadFontBytes()` 加载黑体 `simhei.ttf`；本地读 `assets/fonts/simhei.ttf`，生产回退到站点静态资源 `https://shehui-ren.com/assets/fonts/simhei.ttf`，**无需把 9.7MB 字体打进函数包**。
- **价格/密钥/有效期**：全部走环境变量（见下），**不要硬编码**。

---

## 1. 本地联调（无需商户号）

```bash
# 在 sociology-map/ 目录下
node paywall-dev.js
# 浏览器打开 http://localhost:8787/news-export.html
```

- 默认 `PAYMENT_PROVIDER=mock`：点「模拟支付成功（测试）」即签发令牌并下载，全流程可验证。
- 可用 `node .test-flow.js`（默认端口 8787）跑自动化全链路断言：订单→支付→令牌→PDF(%PDF-)→无令牌拦截 403。
- 可用 `node .debug-pdf.js` 单独验证 PDF 生成（看 `%PDF-` 头与字节数）。

---

## 2. 部署到 Netlify（Functions 自动生效）

`netlify.toml` 已配置 `functions.directory = "api"`，部署时 Netlify 会：

1. 读取仓库根的 `netlify.toml`，把 `api/` 下每个 `*.js`（含 `exports.handler`）识别为函数。
2. 按 `api/package.json` 自动 `npm install`（已声明 `pdf-lib` + `@pdf-lib/fontkit`），**无需提交 `api/node_modules`**。
3. 随站点发布 `assets/fonts/simhei.ttf`，作为函数字体的回退源。

> ⚠️ 当前 Netlify 免费额度已耗尽，生产部署走 `deploy-netlify.js` 的「草稿 + restore」兜底即可正常上线（详见 README）。函数会随站点一同发布。

部署后函数地址形如：`https://shehui-ren.com/.netlify/functions/download`。

---

## 3. 接入真实支付（微信 / 支付宝）

### 3.1 两种方式任选其一

| 方式 | 用户体验 | 你需要做的 |
|------|----------|-----------|
| **自动支付**（推荐，已实现 mock 占位） | 扫码→付款→系统自动开通下载 | 申请商户号，填密钥到环境变量，补全 `unifiedorder`/`precreate` 调用 |
| 激活码 | 付款后人工发码，用户输码下载 | 另做发码系统，**当前未实现** |

本文按「自动支付」说明。

### 3.2 微信支付（Native 扫码）

1. **申请**：微信支付商户平台（pay.weixin.qq.com）申请**公众号/小程序/普通商户号**，开通 Native 支付。
2. **拿到**：`WX_APPID`、`WX_MCH_ID`（商户号）、`WX_API_KEY`（APIv2 密钥，32 位）、`WX_NOTIFY_URL`（支付成功异步通知地址，填 `https://shehui-ren.com/.netlify/functions/pay-webhook`）。
3. **配置环境变量**（Netlify 后台 → Site settings → Environment variables）：
   ```
   PAYMENT_PROVIDER=wechat
   WX_APPID=...
   WX_MCH_ID=...
   WX_API_KEY=...
   WX_NOTIFY_URL=https://shehui-ren.com/.netlify/functions/pay-webhook
   PAYWALL_SECRET=<强随机值，生产必改>
   PRICE_YUAN=9.9
   ```
4. **补全下单调用**：在 `api/create-order.js` 的 `wechat` 分支调用
   `https://api.mch.weixin.qq.com/pay/unifiedorder`（XML 报文，sign 用 `WX_API_KEY`），
   取返回的 `code_url` 作为 `qrText` 返回前端生成二维码。
5. **补全异步通知**：在 `api/pay-webhook.js` 校验签名 → 标记订单已付 → 签发令牌（或直接让前端轮询订单状态）。

> 推荐用官方/社区 SDK（如 `wechatpay-node-v3` 或 `wechatpay-api-v2`）代替手写 XML，降低踩坑概率。

### 3.3 支付宝（当面付 / 预创建）

1. **申请**：支付宝开放平台（open.alipay.com）创建**网页&移动应用**，开通「当面付」。
2. **拿到**：`ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`（应用私钥，PKCS8）、`ALIPAY_PUBLIC_KEY`（支付宝公钥）、`ALIPAY_NOTIFY_URL`。
3. **配置环境变量**：
   ```
   PAYMENT_PROVIDER=alipay
   ALIPAY_APP_ID=...
   ALIPAY_PRIVATE_KEY=...
   ALIPAY_PUBLIC_KEY=...
   ALIPAY_NOTIFY_URL=https://shehui-ren.com/.netlify/functions/pay-webhook
   ```
4. **补全下单调用**：在 `api/create-order.js` 的 `alipay` 分支调用 `alipay.trade.precreate`，取 `qr_code` 返回前端。
5. **异步通知**：`api/pay-webhook.js` 用 `ALIPAY_PUBLIC_KEY` 验签 → 标记已付。

---

## 4. 必须改的生产项

| 项 | 默认（危险） | 生产应设 |
|----|--------------|----------|
| `PAYWALL_SECRET` | `dev-only-secret-change-me`（写死） | 强随机值，仅存环境变量，不入库 |
| `PAYMENT_PROVIDER` | `mock` | `wechat` 或 `alipay` |
| `PRICE_YUAN` | `9.9` | 实际定价 |
| `ENTITLEMENT_DAYS` | `365` | 按需（0=永久） |
| `PDF_FONT_URL` | `https://shehui-ren.com/...` | 自定义域名时覆盖 |

---

## 5. 排错

- **下载 500 / 字体缺失**：确认 `assets/fonts/simhei.ttf` 已随站点发布；或设 `PDF_FONT_PATH` 指向可用字体文件。
- **函数部署后 404**：检查 `netlify.toml` 的 `functions.directory` 是否为 `api`，且函数文件含 `exports.handler`。
- **支付成功但没开通**：检查 `pay-webhook` 是否收到异步通知、验签是否通过；微信/支付宝沙箱先测通。
- **本地 mock 正常、生产报错**：多半是环境变量未设或商户号配置错，先看函数日志（Netlify Functions 日志）。

---

## 6. 文件清单

| 文件 | 作用 |
|------|------|
| `api/_common.js` | 配置、新闻加载、HMAC 令牌签发/校验、字体加载 |
| `api/create-order.js` | 创建订单（mock / 微信 / 支付宝分支） |
| `api/pay-confirm.js` | mock 支付确认，签发令牌 |
| `api/pay-webhook.js` | 真实支付异步通知占位 |
| `api/download.js` | 校验令牌 → 生成 PDF 返回 |
| `api/pdf-builder.js` | pdf-lib + 黑体，A4 精确排版、自动分页、绝不在卡片中间截断 |
| `api/package.json` | 函数依赖（pdf-lib + @pdf-lib/fontkit） |
| `assets/fonts/simhei.ttf` | 中文黑体（静态资源，生产字体回退源） |
| `netlify.toml` | Functions 目录与 Node 版本 |
| `news-export.html` | 前端：付费按钮 + 支付弹窗 + 下载 |
| `paywall-dev.js` | 本地联调 runner（模拟 Functions + 静态托管） |
| `.test-flow.js` / `.debug-pdf.js` | 本地自动化测试脚本 |
