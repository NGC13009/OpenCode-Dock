# 项目经验笔记（AI 专用）

## 关键结论（已验证官方文档/源码）

- VS Code 官方扩展 API **不支持**在窗口标题栏添加按钮；GitHub Copilot 标题栏按钮是 VS Code 核心硬编码，扩展无法复用（issue #90268 / #233861，out of scope）。
- 官方支持的按钮位置：`editor/title` 菜单（编辑器标签页右侧）、状态栏（createStatusBarItem，Right 对齐）、`view/title`（视图标题栏）。
- 活动栏 `viewsContainers` 只有 id/title/icon，**没有点击即执行命令**的能力。
- `vscode.window.createTerminal` 的 `TerminalOptions.location` 可指定 `{ viewColumn }`（编辑器区域标签页）或 `TerminalLocation.Panel`（默认底部面板）；不指定 shellPath 即使用默认 profile、自动继承终端环境。
- `Terminal.sendText(text, true)` 把文本写入 pty stdin 并追加回车；多行文本建议自行按行拆分逐条发送，行为确定。
- opencode 无参数启动 TUI；`OPENCODE_DISABLE_TERMINAL_TITLE=1` 可阻止 TUI 改写终端标题（保证 VS Code 标签名固定）。
- 设置项 `"editPresentation": "multilineText"` 让 string 设置在 UI 中渲染为多行文本框（VS Code 1.59+）。
- 扩展 API 没有运行时注册快捷键的能力；给扩展加快捷键只能通过 `package.json` 的 `contributes.keybindings` 提供默认键位，用户改绑/禁用走键盘快捷方式界面（UI 或 keybindings.json）。
- 扩展贡献的键位追加在内置键位之后（优先级更高），会覆盖 VS Code 内置同键位功能（如 Ctrl+Tab 的“最近使用的编辑器”切换），README 中需提示该冲突。

## 本机/工具坑

- PowerShell 中 `curl` 是 Invoke-WebRequest 别名，下载文件必须用 `curl.exe`。
- Node 24 的 `node --test` 不接受目录参数（会 MODULE_NOT_FOUND），需传 glob：`node --test "out/test/*.test.js"`。
- npm 安装 `@vscode/vsce` 时 vsce-sign 的 postinstall 会被 allowScripts 策略拦截，不影响 `vsce package`（仅签名受影响）。
- vsce package 缺 repository/LICENSE 只有 WARNING，加 `--allow-missing-repository` 可静默（当前直接接受警告）。

## 项目结构

- src/extension.ts：激活、状态栏按钮、命令；src/launchPlan.ts：纯函数 buildLaunchLines（已覆盖单元测试）。
- tsconfig rootDir "." → 输出 out/src、out/test；package.json main 指向 out/src/extension.js。

## 侧栏终端 / node-pty / vsce（2026-10 新增，已验证）

- **原生终端不能放第二侧栏**：`createTerminal` 的 `TerminalLocation` 只有 `Panel`/`Editor`（2026 年 API 参考仍如此，AuxiliaryBar 零命中）；侧栏终端必须用 Webview + node-pty 方案。
- **`viewsContainers.secondarySidebar` 自 VS Code 1.106（2025-11）起支持**，可直接把 WebviewView 视图贡献到第二侧栏（贡献点名称是 `secondarySidebar`，不是 `secondarybar`/`auxiliarybar`）；icon 支持 `"$(rocket)"` codicon 写法；视图需 `"type": "webview"`。
- **node-pty@1.1.0**：npm 包自带 `prebuilds/<platform>-<arch>/`（只有 win32-x64 / win32-arm64 / darwin-x64 / darwin-arm64，linux 无预编译需源码编译）；运行时按 `process.platform-arch` 选目录（`lib/utils.js`），因此**单机可交叉打包 win/mac 目标**；`onExit` 回调是 `{exitCode,signal}` 对象（不是老版的 number）。Windows 运行时用 conpty（`prebuilds/<plat>/conpty/`），不需要 winpty（但保留也无妨）。
- **webview 侧 tsconfig**：需 `moduleResolution: "bundler"` + `lib: ["ES2022","DOM"]` + `noEmit`，并与主 tsconfig 互斥 include（src/webview 从主 tsconfig exclude）。
- **esbuild 在本机的坑**：postinstall 被 `npm install-scripts` 白名单拦截，需 `npm install-scripts approve esbuild`；批准后 `npx esbuild --version` 验证。
- **vsce@4 的坑**：
  - CLI 入口是 `node_modules/@vscode/vsce/vsce`（垫片 `require('./out/main')(process.argv)`）；直接 `node out/main.js` 是**空操作且退出码 0**（曾导致以为打包成功）。
  - `.vscodeignore` 对依赖目录同样生效：`node_modules/node-pty/src/**`、`deps/**`、`third_party/**`、`typings/**`、`scripts/**`、`prebuilds/**/*.pdb`（PDB 占约 50MB，可裁掉）有效；`node_modules/**` 一行会连生产依赖一起裁掉，不能保留。
  - 打包命令：`node scripts/package.mjs [current|all|<target>]`，用 `process.execPath` + vsce 垫片执行，避免 npx/shell 弃用警告。
- **Windows + node-pty 交叉打包**：win32-arm64/darwin-* 均可从 Windows 本机出包（预编译已在 node_modules）；linux 目标必须在该平台 `npm install`（源码编译）后打包；`.github/workflows/release.yml` 已配矩阵（ubuntu-latest/ubuntu-24.04-arm/macos-13/macos-latest/windows-latest）。
- **Webview 实现要点**（本项目已落地）：CSP 用 nonce、不放开 unsafe-inline（xterm 主题色别用 CSS var，xterm 颜色解析不认）；`retainContextWhenHidden: true` 保住隐藏时的会话与渲染；宿主侧在 webview `ready` 前暂存输出；进程退出后 xterm 用 `attachCustomKeyEventHandler` 拦截 Enter 实现重开，无需内联样式/脚本按钮。
- **PowerShell 包装器坑（再次强调）**：node -e 内联代码里的 `{for(`、`})` 等组合会被包装器误解析，甚至把命令片段当成文件名创建垃圾文件（本仓库曾出现 `{for(const`、`b[1]-a[1])` 两个文件被打进 vsix）。复杂 JS 一律写成脚本文件再执行。
