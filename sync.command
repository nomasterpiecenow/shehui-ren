#!/bin/bash
# 「社会人」开工前同步检查 —— Mac 双击即跑
# 双击这个文件会打开终端、检查仓库是否已连 Gitee 并更新到最新。

cd "$(dirname "$0")" || exit 1

# 找一个可用的 node：先看 PATH，再看 WorkBuddy managed node
NODE_BIN="$(command -v node 2>/dev/null)"
if [ -z "$NODE_BIN" ]; then
  for d in "$HOME/.workbuddy/binaries/node/versions/"*/bin/node; do
    [ -x "$d" ] && NODE_BIN="$d" && break
  done
fi

if [ -z "$NODE_BIN" ]; then
  echo "✗ 找不到 node，无法运行检查脚本。"
  echo "  请安装 Node.js，或确认 ~/.workbuddy/binaries/node/versions/ 下有 node。"
  echo ""
  read -n 1 -s -r -p "按任意键关闭…"
  exit 2
fi

"$NODE_BIN" sync.js "$@"
CODE=$?

echo ""
if [ $CODE -eq 0 ]; then
  echo "（检查通过，可以关闭本窗口）"
else
  echo "（有需要处理的地方，见上方提示）"
fi
read -n 1 -s -r -p "按任意键关闭…"
exit $CODE
