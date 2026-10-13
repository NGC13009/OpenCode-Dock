# 项目经验笔记（AI 专用）

## 项目规则

每次添加功能或者修改功能后，一定记得更改项目版本号。三位版本号，除非整个重构，或者更新大发布版本，否则第一位永远不动。功能更新第二位增加，如果仅修复bug等第三位增加。

**版本号永远以 `package.json` 的 `version` 字段为唯一来源。** README（`README.md` / `README_CN.md`）只能向 `package.json` 对齐，不得出现任何其他版本号；两者冲突时以 `package.json` 为准，直接改文档。

README 为双语：`README.md`（英文，仓库首页/市场默认读取）与 `README_CN.md`（中文）。任何内容改动**两份都要同步**，顶部保留语言切换行 `[English](README.md) | [简体中文](README_CN.md)`。

本项目不使用自动目录，只能使用手工目录。每次修改完成后，如果 readme 更新，那么记得同步更新两份 readme 的手工目录（标题文字或层级变了就要改锚点）。

## 写作规范（术语与写法统一）

README 及一切文档统一按下表书写（左列为唯一标准写法）：

| 标准写法 | 禁止/错误写法 |
| --- | --- |
| VS Code | VSCode、vscode、vsc、vs code、VSCODE |
| VS Code 扩展 / 扩展 | 插件（官方中文用语是「扩展」，全文档统一） |
| VSIX 文件 | vsix 文件、.vsix（仅路径/后缀处保留 `.vsix`） |
| OpenCode、OpenCode CLI、OpenCode TUI | opencode（仅命令与包名处保留小写） |
| GitHub、GitHub Release | github、Github、release 文件（指 GitHub Releases 时首字母大写） |
| Copilot（GitHub Copilot） | copilot |
| Conda | conda |
| Python | python |
| Node、Node.js | node（指运行时名称时；`node` 命令本身保留小写） |
| PowerShell | powershell |
| Mermaid | mermaid（仅代码块语言标记保留小写） |
| npm、git、bash、tsc、vsce、codicon | 分别的大写变体（这些工具官方即为小写） |

排版规则：

- 中英文之间加一个半角空格（如「在 VS Code 中」「启动 OpenCode TUI」）；数字与中文之间同样加空格，除非紧邻单位符号或标点。
- 中文句子用全角标点；英文单词、路径、命令用半角。括号开闭必须成对且同类（不要「（……)」混用）。
- 半角标点后跟中文时不额外加空格（如「VS Code：」是全角冒号，前面不留空格）。
- 行文中出现易混淆搭配时保留连字符/空格，如 `VS Code Extension API`、`Node 内置的 test runner`。

## 关键结论（已验证官方文档/源码）

- VS Code 官方扩展 API **不支持**在窗口标题栏添加按钮；GitHub Copilot 标题栏按钮是 VS Code 核心硬编码，扩展无法复用（issue #90268 / #233861，out of scope）。
- 官方支持的按钮位置：`editor/title` 菜单（编辑器标签页右侧）、状态栏（createStatusBarItem，Right 对齐）、`view/title`（视图标题栏）。
- 活动栏 `viewsContainers` 只有 id/title/icon，**没有点击即执行命令**的能力。
- `vscode.window.createTerminal` 的 `TerminalOptions.location` 可指定 `{ viewColumn }`（编辑器区域标签页）或 `TerminalLocation.Panel`（默认底部面板）；不指定 shellPath 即使用默认 profile、自动继承终端环境。
- `Terminal.sendText(text, true)` 把文本写入 pty stdin 并追加回车；多行文本建议自行按行拆分逐条发送，行为确定。
- opencode 无参数启动 TUI；`OPENCODE_DISABLE_TERMINAL_TITLE=1` 可阻止 TUI 改写终端标题（保证 VS Code 标签名固定）。
- 设置项 `"editPresentation": "multilineText"` 让 string 设置在 UI 中渲染为多行文本框（VS Code 1.59+）。
- `TerminalOptions.name` 是**纯文本**，扩展传入什么就显示什么；**不会**做 `${workspaceFolder}` 这类变量替换（VS Code 的变量替换只覆盖 launch.json / tasks.json 等，官方文档明确「预定义变量不支持在 settings.json 中使用」）。因此 `opencodeDock.terminalName` 只做去空白 + 空值回退。同名终端由 VS Code 自行处理，无需扩展去重。
- 扩展 API 没有运行时注册快捷键的能力；给扩展加快捷键只能通过 `package.json` 的 `contributes.keybindings` 提供默认键位，用户改绑/禁用走键盘快捷方式界面（UI 或 keybindings.json）。
- 扩展贡献的键位追加在内置键位之后（优先级更高），会覆盖 VS Code 内置同键位功能（如 Ctrl+Tab 的“最近使用的编辑器”切换），README 中需提示该冲突。

## 本机/工具坑

- PowerShell 中 `curl` 是 Invoke-WebRequest 别名，下载文件必须用 `curl.exe`。
- Node 24 的 `node --test` 不接受目录参数（会 MODULE_NOT_FOUND），需传 glob：`node --test "out/test/*.test.js"`。
- npm 安装 `@vscode/vsce` 时 vsce-sign 的 postinstall 会被 allowScripts 策略拦截，不影响 `vsce package`（仅签名受影响）。
- vsce package 缺 repository/LICENSE 只有 WARNING，加 `--allow-missing-repository` 可静默（当前直接接受警告）。

## 项目结构

- src/extension.ts：激活、状态栏按钮、命令；src/launchPlan.ts：纯函数 buildLaunchLines / resolveTerminalName（已覆盖单元测试）。
- tsconfig rootDir "." → 输出 out/src、out/test；package.json main 指向 out/src/extension.js。

  - 打包命令：`node scripts/package.mjs [current|all|<target>]`，用 `process.execPath` + vsce 垫片执行，避免 npx/shell 弃用警告。
- **Webview 实现要点**（已随方案删除）：CSP 用 nonce、不放开 unsafe-inline（xterm 主题色别用 CSS var）；`retainContextWhenHidden: true`；宿主侧在 webview `ready` 前暂存输出等。
- **PowerShell 包装器坑（再次强调）**：node -e 内联代码里的 `{for(`、`})` 等组合会被包装器误解析，甚至把命令片段当成文件名创建垃圾文件。复杂 JS 一律写成脚本文件再执行。
