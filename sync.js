// 「社会人」开工前同步检查 —— 跨设备（公司 Win / 家里 Mac）必跑
//
// 用途：在动手改代码之前，确认这个文件夹确实连着 Gitee、并且已经是最新状态，
//      避免两台机器各改各的、事后冲突。
//
// 跑法：
//   node sync.js          正常检查（安全：只在无本地改动时才自动拉取）
//   node sync.js --pull   同上（等价，保留兼容）
//   node sync.js --check  只报告，绝不改动工作区
//
// 也可以双击 sync.command（Mac）/ sync.bat（Windows）。
//
// 退出码：0 = 可以开工；1 = 需要人工处理（有冲突风险）；2 = 环境问题（不是 git 仓库等）

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const CHECK_ONLY = process.argv.includes('--check');
const EXPECT_REMOTE = 'gitee.com';   // 期望的远程主机关键字

function git(args, opts) {
  const r = spawnSync('git', args, {
    cwd: ROOT, encoding: 'utf8', windowsHide: true, ...(opts || {}),
  });
  return {
    ok: !r.error && r.status === 0,
    out: (r.stdout || '').trim(),
    err: (r.stderr || '').trim(),
    status: r.status,
  };
}

function line(s) { console.log(s); }
function hr() { console.log('─'.repeat(52)); }

hr();
line('  社会人 · 开工前同步检查');
line('  ' + ROOT);
hr();

// ---------- 1. 是不是 git 仓库 ----------
if (!git(['rev-parse', '--is-inside-work-tree']).ok) {
  line('✗ 这个文件夹不是 git 仓库，没有连接任何远程。');
  line('  需要先 git init 并 git remote add origin <Gitee 地址>。');
  process.exit(2);
}

// ---------- 2. 远程是否是 Gitee ----------
const remote = git(['remote', 'get-url', 'origin']);
if (!remote.ok) {
  line('✗ 没有配置 origin 远程 —— 这是一个纯本地文件夹，改动不会同步到任何地方。');
  line('  修复：git remote add origin https://gitee.com/no-works-yet/shehui-ren.git');
  process.exit(2);
}
const remoteUrl = remote.out;
const isGitee = remoteUrl.includes(EXPECT_REMOTE);
line((isGitee ? '✓' : '⚠') + ' 远程 origin：' + remoteUrl);
if (!isGitee) line('  注意：这不是 Gitee 地址，确认一下是不是你想要的仓库。');

// ---------- 3. 当前分支与跟踪关系 ----------
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).out || '(游离 HEAD)';
const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
if (!upstream.ok) {
  line('⚠ 当前分支 ' + branch + ' 没有跟踪远程分支。');
  line('  修复：git branch --set-upstream-to=origin/' + branch + ' ' + branch);
  process.exit(1);
}
line('✓ 当前分支：' + branch + ' → 跟踪 ' + upstream.out);

// ---------- 4. 拉取远程最新引用 ----------
process.stdout.write('… 正在向 Gitee 拉取最新状态');
const fetched = git(['fetch', 'origin', '--prune']);
process.stdout.write('\r' + ' '.repeat(30) + '\r');
if (!fetched.ok) {
  line('✗ fetch 失败：' + (fetched.err || '未知错误').split('\n')[0]);
  line('  常见原因：网络不通、Gitee 凭据过期。先手动跑一次 git fetch 看看提示。');
  process.exit(1);
}
line('✓ 已拉取 Gitee 最新引用');

// ---------- 5. 领先 / 落后 ----------
const counts = git(['rev-list', '--left-right', '--count', upstream.out + '...HEAD']).out;
const [behindStr, aheadStr] = counts.split(/\s+/);
const behind = parseInt(behindStr, 10) || 0;
const ahead = parseInt(aheadStr, 10) || 0;

// ---------- 6. 本地未提交改动 ----------
const dirtyList = git(['status', '--porcelain']).out;
const dirty = dirtyList ? dirtyList.split('\n').filter(Boolean) : [];

hr();
line('  落后远程：' + behind + ' 个提交');
line('  领先远程：' + ahead + ' 个提交');
line('  未提交改动：' + dirty.length + ' 个文件');
if (dirty.length) {
  dirty.slice(0, 12).forEach((f) => line('    ' + f.trim()));
  if (dirty.length > 12) line('    …还有 ' + (dirty.length - 12) + ' 个');
}
hr();

// ---------- 7. 决策 ----------
if (behind === 0 && ahead === 0 && dirty.length === 0) {
  line('✅ 完全同步，可以放心开工。');
  process.exit(0);
}

if (behind === 0) {
  if (ahead > 0) line('ℹ 本地有 ' + ahead + ' 个提交还没推上去，改完记得 git push。');
  if (dirty.length) line('ℹ 有未提交改动（多半是上次没收尾），确认是你自己的再继续。');
  line('✅ 没有落后远程，可以开工。');
  process.exit(0);
}

// behind > 0
if (CHECK_ONLY) {
  line('⚠ 落后远程 ' + behind + ' 个提交（--check 模式不自动拉取）。');
  line('  执行：git pull --rebase');
  process.exit(1);
}

if (dirty.length > 0 || ahead > 0) {
  line('⚠ 落后远程 ' + behind + ' 个提交，但本地也有改动/提交 —— 不自动拉取，避免冲突。');
  line('  建议按顺序处理：');
  line('    1) git stash            （先把未提交改动收起来）');
  line('    2) git pull --rebase    （拉取另一台机器的改动）');
  line('    3) git stash pop        （再放回来，此时若冲突会明确提示）');
  process.exit(1);
}

// 干净且落后 → 安全快进
line('… 工作区干净且落后 ' + behind + ' 个提交，自动执行 git pull --rebase');
const pulled = git(['pull', '--rebase'], { stdio: 'inherit' });
if (!pulled.ok) {
  line('✗ 拉取失败，请手动处理后再开工。');
  process.exit(1);
}
const newHead = git(['log', '-1', '--oneline']).out;
line('✅ 已更新到最新：' + newHead);
process.exit(0);
