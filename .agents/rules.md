# 项目经验笔记（AI 专用）

每次添加功能或者修改功能后，一定记得更改项目版本号。

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

  - 打包命令：`node scripts/package.mjs [current|all|<target>]`，用 `process.execPath` + vsce 垫片执行，避免 npx/shell 弃用警告。
- **Webview 实现要点**（已随方案删除）：CSP 用 nonce、不放开 unsafe-inline（xterm 主题色别用 CSS var）；`retainContextWhenHidden: true`；宿主侧在 webview `ready` 前暂存输出等。
- **PowerShell 包装器坑（再次强调）**：node -e 内联代码里的 `{for(`、`})` 等组合会被包装器误解析，甚至把命令片段当成文件名创建垃圾文件。复杂 JS 一律写成脚本文件再执行。
