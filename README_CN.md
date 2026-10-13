# OpenCode Dock

[English](README.md) | [简体中文](README_CN.md)

这是一个很简单的扩展，它只有一个作用，就是任何情况下都无条件地在 VS Code 右下角状态栏提供一个可以点击的图标，点击之后就可以在活动的主窗口启动一个 [OpenCode](https://opencode.ai) TUI。

启动的时候会自动继承 VS Code 配置的用户启动终端环境。例如，当前代码仓库为 Python 项目，并且设置了 Conda 环境，那么 OpenCode 会继承该 Conda 环境，从而使得 OpenCode 内部工作的模型可以正确地调用包含正确环境的终端。

同时会自动将该终端标题命名为 `OpenCode`（标题文本可自定义），避免非常长并且占地方的选项卡。

此扩展还提供了默认 `Ctrl+Tab` 的快捷键，用于即刻启动，该快捷键和按下按钮的行为相同。

v0.2.2 · VS Code ^1.106.0 · TypeScript

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
  - [前提](#前提)
  - [从 VS Code 扩展市场安装](#从-vs-code-扩展市场安装)
  - [从 GitHub 下载 Release 文件](#从-github-下载-release-文件)
  - [从源码安装](#从源码安装)
  - [使用](#使用)
  - [配置](#配置)
  - [快捷键](#快捷键)
- [注意事项](#注意事项)
- [原理和开发说明](#原理和开发说明)
- [许可证与作者信息](#许可证与作者信息)

## 功能特性

- **一键启动**：点击状态栏右侧的 `OpenCode` 按钮，或按下默认的快捷键 `Ctrl+Tab`，即可快速启动一个 OpenCode TUI。这些方式都可以配置为可选项或者自定义。
- **编辑器区域标签页**：终端以标签页打开在主窗口（而非自动分屏，或者打开到终端窗口等），窗口会更大。
- **与手动开终端一致**：自动沿用 VS Code 默认终端 profile 与继承环境，这在 Conda 环境之类的场合非常有用，可以使得 OpenCode 自动使用正确的终端环境，而无需额外的 OpenCode 扩展支持。
- **前置环境可准备**：可自定义设置多行命令在启动 OpenCode 前逐条执行，适合 `cd`、`export`、`source` 等场景，针对每个项目文件夹都可自定义配置（在本扩展的设置中，选择配置到项目，而非配置到用户/全局）。
- **标题可配置且稳定**：避免非常长并且占地方的选项卡。

## 快速开始

### 前提

- VS Code `^1.106.0`：最低 VS Code 版本需要大于该版本号。
- 已另外安装 [OpenCode CLI](https://opencode.ai)。对于任何已经配置好 npm 的常规操作系统，可执行 `npm install -g @opencode/cli` 来安装。

### 从 VS Code 扩展市场安装

等待补充

### 从 GitHub 下载 Release 文件

等待补充

### 从源码安装

```bash
git clone https://github.com/NGC13009/OpenCode-Dock.git
cd OpenCode-Dock/
npm install       # 获取所需依赖
npm run compile   # 编译 Node
npm test          # 执行自动测试，可跳过
npm run package   # 打包为 VS Code 所需的 VSIX 扩展文件

# 在 VS Code 中右键 VSIX 文件选择安装本地扩展，或者执行下面的命令：
code --install-extension ./release/<*.vsix>
```

### 使用

点击状态栏右侧的 `🚀 OpenCode` 按钮，或按 `Ctrl+Tab`，即在编辑器区域打开终端并启动 OpenCode TUI。如果你没更改过任何扩展配置，那么这个 OpenCode TUI 会继承你在 VS Code 中启动的默认终端和环境变量（例如对于已经选择 Conda 环境和 Python 解释器的某个 VS Code 项目文件夹）。

### 配置

| 设置 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `opencodeDock.command` | string | `opencode` | 启动 OpenCode 的命令，例如 `opencode`、`bunx opencode`、`npx @sst/opencode` 或可执行文件绝对路径 |
| `opencodeDock.preCommand` | string | `""` | 启动 OpenCode 前依次执行的命令，每行一条，空行忽略（设置中以多行文本编辑） |
| `opencodeDock.terminalName` | string | `OpenCode` | 终端标签页标题；留空则回退为 `OpenCode`，改动只影响此后新建的终端 |

示例：

```json
{
  "opencodeDock.command": "opencode",
  "opencodeDock.preCommand": "cd D:/work/my-project\nexport OPENCODE_MODEL=anthropic/claude-sonnet-4-5\nsource ./.env",
  "opencodeDock.terminalName": "OpenCode"
}
```

### 快捷键

- 默认 `Ctrl+Tab`，与点击按钮等效（触发同一命令 `opencodeDock.launch`）。
- 改绑/删除：`Ctrl+K Ctrl+S` 搜索 “OpenCode Dock” 或命令 `opencodeDock.launch`，也可直接编辑 `keybindings.json`。

注意：扩展贡献的键位优先于 VS Code 内置键位，`Ctrl+Tab` 默认会覆盖内置的“最近使用的编辑器”切换；需要恢复时按上述方式删除键位即可。VS Code 扩展 API 不支持运行时注册快捷键，因此键位无法做成设置项。

## 注意事项

- 扩展每次触发都会新建终端，不会复用或自动关闭旧终端；不需要时请手动关闭。（这是故意如此设计的，因为我喜欢同时启动多个 OpenCode 窗口。虽然 OpenCode v2 的 TUI 已经自带标签页，但我还是更喜欢 VS Code 的标签页管理方式（可以自然地支持分屏，或者把该标签页独立为窗口，或者将其扔到底部终端面板中）。）
- `Ctrl+Tab` 是扩展贡献的默认键位，会覆盖 VS Code 内置的“最近使用的编辑器”切换，可按需改绑。
- `preCommand` 由默认 shell 逐条执行，属于真实 shell 命令（PowerShell、bash 等）；建议先 `cd` 到目标目录或使用绝对路径。一般来说，你在 VS Code 里配置的是什么默认终端，就会使用哪个终端。因此请务必确保默认终端内本身有可运行的 OpenCode TUI（即，在此终端内存在已安装的 OpenCode，并且它是可通过全局环境变量启动的程序）。
- `opencodeDock.terminalName` 只在新建终端时读取，改名后已打开的旧终端不会追溯重命名。
- 图标使用 VS Code 内置 codicon `$(rocket)`（看起来是小火箭 🚀，状态栏按钮与终端标签页都能看见），需要 VS Code 1.96+。

> 我其实最开始想把启动按钮设置为 VS Code 自己 Copilot 的那个按钮，也就是窗口标题栏中搜索框右侧的那个按钮。但是 VS Code 的扩展无法在窗口标题栏添加自定义按钮，这是因为 VS Code 官方扩展 API 不支持（Copilot 的标题栏按钮是 VS Code 核心硬编码），也没有“点击活动栏图标即执行命令”的扩展点；因此只能退而求其次，采用官方支持的状态栏右侧位置。
>
> 如需顶部按钮可改用 `editor/title` 菜单贡献，但这会让这个扩展看起来就如同 OpenCode 官方那个 VS Code 扩展的位置一样。这有个问题：如果不打开任何标签页，那么是看不见这个按钮的。

## 原理和开发说明

点击按钮或按快捷键后，扩展触发 `opencodeDock.launch` 命令：

```mermaid
flowchart LR
  A[点击按钮 / Ctrl+Tab] --> C[createTerminal<br/>name=terminalName<br/>location=ViewColumn.Active]
  C --> D[terminal.show]
  D --> E[逐行 sendText<br/>buildLaunchLines]
  E --> F[OpenCode TUI 在编辑器区域运行]
```

> Microsoft VS Code 的扩展说明页目前无法正确渲染 Mermaid 图，如果您发现图片看起来没渲染成功，或者是源代码形式的，可以前往[本项目的 GitHub 页面](https://github.com/NGC13009/OpenCode-Dock.git)查看该说明的配图。

- **编辑器标签页**：`createTerminal` 的 `location` 使用 `ViewColumn.Active`，使终端以标签页出现在编辑器区域；不设置该字段时 VS Code 默认放在底部终端面板。
- **复用默认终端环境**：不传 `shellPath`/`cwd`，与用户手动点击“+”新建终端行为一致。
- **标签名可控**：`name` 取自 `opencodeDock.terminalName`（经 `resolveTerminalName` 去空白、为空回退 `OpenCode`）；OpenCode TUI 会通过 OSC 序列改写终端标题，扩展在 `env` 中注入 `OPENCODE_DISABLE_TERMINAL_TITLE=1` 禁用之，保证标签名不被 TUI 覆盖。
- **命令组装**：`buildLaunchLines`（`src/launchPlan.ts`）是纯函数：`preCommand` 按行拆分、清理首尾空白、忽略空行，最后追加启动命令。与 VS Code API 解耦，因此可在无 GUI 环境下单元测试。
- **每次新建**：每次触发都新建终端、不复用旧终端，行为可预期。

总的来说，这个扩展实际上源代码非常的简洁……因为本来就没啥要做的。

技术栈：TypeScript + VS Code Extension API；测试使用 Node 内置的 test runner。

目录结构：核心的内容仅为如下内容

```text
./
├── src/
│   ├── extension.ts       # 激活：注册命令、状态栏按钮、终端
│   └── launchPlan.ts      # 启动命令组装 + 终端标题回退（纯函数）
├── test/                  # 单元测试（launchPlan）
├── scripts/
│   └── package.mjs        # vsce 打包（current / all / 指定 target）
├── out/                   # tsc 编译输出（构建生成）
└── release/               # 打包产物 VSIX（构建生成）
```

如需贡献：

- 保持 `launchPlan.ts` 中的函数为无副作用的纯函数；
- 新增逻辑应补充对应单元测试。

## 许可证与作者信息

[GPLv3](LICENSE.txt)

[NGC13009](https://github.com/NGC13009)
