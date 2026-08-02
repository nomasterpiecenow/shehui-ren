@echo off
chcp 65001 >nul
REM 「社会人」开工前同步检查 —— Windows 双击即跑
REM 双击这个文件会检查仓库是否已连 Gitee 并更新到最新。

cd /d "%~dp0"

set "NODE_BIN="
where node >nul 2>nul && set "NODE_BIN=node"

if not defined NODE_BIN (
  for /d %%D in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
    if exist "%%D\node.exe" set "NODE_BIN=%%D\node.exe"
  )
)

if not defined NODE_BIN (
  echo [X] 找不到 node，无法运行检查脚本。
  echo     请安装 Node.js，或确认 .workbuddy\binaries\node\versions\ 下有 node.exe
  echo.
  pause
  exit /b 2
)

"%NODE_BIN%" sync.js %*
set CODE=%ERRORLEVEL%

echo.
if "%CODE%"=="0" (
  echo （检查通过，可以关闭本窗口）
) else (
  echo （有需要处理的地方，见上方提示）
)
pause
exit /b %CODE%
