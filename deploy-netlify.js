// 部署「社会人」站点到 Netlify —— 跨设备通用版
// 与 ctrip-claw 内的「写死本机绝对路径」版本不同，本脚本一律用相对路径 + 环境变量，
// 这样 git clone 到任何机器（Win/Mac）后都能直接跑，只需少量本机配置。
//
// 2026-07-31 起内置「草稿部署 + 发布」兜底：
//   Netlify 免费额度耗尽时，POST /deploys（生产）会返回 403
//   "Account credit usage exceeded - new deploys are blocked until credits are added"，
//   但**草稿部署（不带 --prod）仍然允许**。此时改为：
//     1) netlify deploy（草稿，--json 取 deploy_id）
//     2) POST /sites/{siteId}/deploys/{deployId}/restore  → 把该草稿发布为生产版本
//   restore 走的是「回滚/发布已有部署」通道，不受 new-deploy 拦截，实测可正常上线。
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;            // 本仓库根（即 sociology-map 目录）
const SITE_DIR = ROOT;             // 发布目录 = 仓库自身
const SITE_ID = '1c681e5b-9d1b-4a63-bf84-6a79e4a62cd2';

// 令牌优先级：环境变量 NETLIFY_AUTH_TOKEN > 仓库根 .netlify_token 文件
let token = process.env.NETLIFY_AUTH_TOKEN;
if (!token) {
  try { token = fs.readFileSync(path.join(ROOT, '.netlify_token'), 'utf8').trim(); }
  catch (e) { token = null; }
}
if (!token) {
  console.error('[deploy] NO_TOKEN: 请设置环境变量 NETLIFY_AUTH_TOKEN，或在仓库根放置 .netlify_token 文件（内容=Netlify Personal Access Token）');
  process.exit(2);
}

// node 与 netlify-cli 路径：优先环境变量 WB_NODE / WB_NETLIFY，
// 否则按当前系统自动探测 WorkBuddy managed node 工作区（Mac/Linux 与 Windows 布局不同）。
const IS_WIN = process.platform === 'win32';
const WB_HOME = process.env.WORKBUDDY_HOME
  || path.join(process.env.HOME || process.env.USERPROFILE || '', '.workbuddy');

function detectNode() {
  // 1) 本进程自身就是一个可用 node，最稳妥
  const versionsDir = path.join(WB_HOME, 'binaries', 'node', 'versions');
  try {
    const vs = fs.readdirSync(versionsDir)
      .filter((v) => /^\d+\./.test(v))
      // 版本号倒序，取最新
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const v of vs) {
      const p = IS_WIN
        ? path.join(versionsDir, v, 'node.exe')
        : path.join(versionsDir, v, 'bin', 'node');
      if (fs.existsSync(p)) return p;
    }
  } catch (e) { /* 目录不存在，继续回退 */ }
  // 2) 回退：Windows 老路径 / 其它系统用当前解释器
  if (IS_WIN && fs.existsSync('D:/Users/wtianyi/.workbuddy/binaries/node/versions/22.22.2/node.exe')) {
    return 'D:/Users/wtianyi/.workbuddy/binaries/node/versions/22.22.2/node.exe';
  }
  return process.execPath;
}

function detectNetlify() {
  const candidates = [
    path.join(WB_HOME, 'binaries', 'node', 'workspace', 'node_modules', 'netlify-cli', 'bin', 'run.js'),
    path.join(ROOT, 'node_modules', 'netlify-cli', 'bin', 'run.js'),
    'D:/Users/wtianyi/.workbuddy/binaries/node/workspace/node_modules/netlify-cli/bin/run.js',
  ];
  for (const c of candidates) { if (fs.existsSync(c)) return c; }
  return null;
}

const NODE = process.env.WB_NODE || detectNode();
const NETLIFY_BIN = process.env.WB_NETLIFY || detectNetlify();

if (!NETLIFY_BIN) {
  console.error('[deploy] NO_NETLIFY_CLI: 未找到 netlify-cli。请先安装：');
  console.error('  cd "' + path.join(WB_HOME, 'binaries', 'node', 'workspace') + '" && npm install netlify-cli');
  console.error('或用环境变量 WB_NETLIFY 指定 netlify-cli 的 bin/run.js 路径。');
  process.exit(2);
}

const CLI_ENV = Object.assign({}, process.env, { NETLIFY_AUTH_TOKEN: token });

console.log('[deploy] 发布到 Netlify:', SITE_ID);
console.log('[deploy] 目录:', SITE_DIR);
console.log('[deploy] node:', NODE);
console.log('[deploy] netlify-cli:', NETLIFY_BIN);

// ---------- 主路径：直接生产部署 ----------
const prod = spawnSync(
  NODE,
  [NETLIFY_BIN, 'deploy', '--prod', '--dir=' + SITE_DIR, '--site=' + SITE_ID],
  { env: CLI_ENV, stdio: 'inherit', windowsHide: true }
);

if (!prod.error && prod.status === 0) {
  console.log('[deploy] 生产部署成功');
  process.exit(0);
}

console.warn('[deploy] 生产部署失败（退出码 ' + prod.status + '），改用「草稿部署 + 发布」兜底…');

// ---------- 兜底：草稿部署 ----------
const draft = spawnSync(
  NODE,
  [NETLIFY_BIN, 'deploy', '--dir=' + SITE_DIR, '--site=' + SITE_ID, '--json'],
  { env: CLI_ENV, encoding: 'utf8', windowsHide: true }
);

if (draft.error || draft.status !== 0) {
  console.error('[deploy] 草稿部署也失败:', (draft.stderr || draft.error || '').toString().slice(0, 800));
  process.exit(1);
}

let deployId;
try {
  const m = (draft.stdout || '').match(/\{[\s\S]*\}/);
  deployId = JSON.parse(m[0]).deploy_id;
} catch (e) {
  console.error('[deploy] 无法从草稿部署输出解析 deploy_id:\n', (draft.stdout || '').slice(0, 800));
  process.exit(1);
}
console.log('[deploy] 草稿部署完成:', deployId, '→ 正在发布为生产版本…');

// ---------- 兜底：把草稿发布为生产 ----------
const req = https.request({
  hostname: 'api.netlify.com',
  path: '/api/v1/sites/' + SITE_ID + '/deploys/' + deployId + '/restore',
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Length': 0 },
}, (res) => {
  let body = '';
  res.on('data', (d) => { body += d; });
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let state = '';
      try { state = JSON.parse(body).state; } catch (e) { /* ignore */ }
      console.log('[deploy] 发布成功 state=' + state + ' → https://shehui-ren.com');
      process.exit(0);
    }
    console.error('[deploy] 发布失败 HTTP ' + res.statusCode + ':', body.slice(0, 400));
    process.exit(1);
  });
});
req.on('error', (e) => { console.error('[deploy] 发布请求异常:', e.message); process.exit(1); });
req.end();
