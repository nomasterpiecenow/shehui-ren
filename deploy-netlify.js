// 部署「社会人」站点到 Netlify —— 跨设备通用版
// 与 ctrip-claw 内的「写死本机绝对路径」版本不同，本脚本一律用相对路径 + 环境变量，
// 这样 git clone 到任何机器（Win/Mac）后都能直接跑，只需少量本机配置。
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// node 与 netlify-cli 路径：优先环境变量，否则回退本机（Windows）常见位置
// Mac 用户请 export WB_NODE / WB_NETLIFY 指向本机的 managed node 与 netlify-cli
const NODE = process.env.WB_NODE
  || 'D:/Users/wtianyi/.workbuddy/binaries/node/versions/22.22.2/node.exe';
const NETLIFY_BIN = process.env.WB_NETLIFY
  || 'D:/Users/wtianyi/.workbuddy/binaries/node/workspace/node_modules/netlify-cli/bin/run.js';

console.log('[deploy] 发布到 Netlify:', SITE_ID);
console.log('[deploy] 目录:', SITE_DIR);

const res = spawnSync(
  NODE,
  [NETLIFY_BIN, 'deploy', '--prod', '--dir=' + SITE_DIR, '--site=' + SITE_ID],
  {
    env: Object.assign({}, process.env, { NETLIFY_AUTH_TOKEN: token }),
    stdio: 'inherit',
    windowsHide: true,
  }
);

if (res.error) {
  console.error('[deploy] 执行失败:', res.error.message);
  process.exit(1);
}
console.log('[deploy] 退出码:', res.status);
process.exit(res.status === null ? 1 : res.status);
