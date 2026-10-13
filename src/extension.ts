import * as vscode from 'vscode';
import { buildLaunchLines } from './launchPlan';

const TERMINAL_NAME = 'OpenCode';

export function activate(context: vscode.ExtensionContext): void {
  // 状态栏右侧的启动按钮（官方不支持在窗口标题栏添加扩展按钮）；图标为内置 codicon
  const launchItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  launchItem.text = '$(rocket) OpenCode';
  launchItem.tooltip = '启动 OpenCode Dock';
  launchItem.command = 'opencodeDock.launch';
  launchItem.show();
  context.subscriptions.push(launchItem);

  context.subscriptions.push(
    vscode.commands.registerCommand('opencodeDock.launch', () => {
      const config = vscode.workspace.getConfiguration('opencodeDock');
      const preCommand = config.get<string>('preCommand', '');
      const command = config.get<string>('command', 'opencode');

      // 不指定 shellPath：使用 VS Code 默认终端配置（默认 profile、继承终端环境），
      // 与用户手动点击“+”新建终端的行为一致。
      const terminal = vscode.window.createTerminal({
        name: TERMINAL_NAME,
        // 终端标签页图标：内置 codicon（ThemeIcon），需 VS Code 1.96+ 支持
        iconPath: new vscode.ThemeIcon('rocket'),
        // 在编辑器区域（主窗口）以标签页打开，而非底部终端面板
        location: { viewColumn: vscode.ViewColumn.Active },
        // 避免 OpenCode TUI 通过 OSC 序列改写终端标题，保证标签始终显示为 OpenCode
        env: { OPENCODE_DISABLE_TERMINAL_TITLE: '1' },
      });
      terminal.show();

      // preCommand 逐行执行后，最后执行启动 OpenCode 的命令
      for (const line of buildLaunchLines({ preCommand, command })) {
        terminal.sendText(line, true);
      }
    }),
  );
}

export function deactivate(): void {}
