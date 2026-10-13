/**
 * 侧栏终端视图：管理第二侧栏 Webview 的生命周期、消息协议与 PTY 会话。
 * 通过 opencodeDock.launch（location=sidebar）或直接打开视图触发启动。
 */
import * as os from 'node:os';
import * as vscode from 'vscode';
import * as pty from 'node-pty';
import { buildLaunchLines } from '../launchPlan';
import type { HostToWebviewMessage, WebviewToHostMessage } from './messages';
import { PtySession, type PtyProcessLike, type PtySpawnOptions } from './ptySession';
import { renderWebviewHtml } from './webviewHtml';

export const SIDEBAR_VIEW_ID = 'opencodeDock.sidebarTerminal';

/** 将 node-pty 适配为可注入的 PtySpawner（统一 onExit 的退出码形态） */
function spawnPty(options: PtySpawnOptions): PtyProcessLike {
  const process = pty.spawn(options.command, [], {
    name: 'xterm-256color',
    cols: options.cols,
    rows: options.rows,
    cwd: options.cwd,
    env: options.env,
  });
  return {
    write: (data) => process.write(data),
    resize: (cols, rows) => process.resize(cols, rows),
    kill: () => process.kill(),
    onData: (listener) => {
      process.onData(listener);
    },
    onExit: (listener) => {
      process.onExit((event) => listener(event.exitCode));
    },
  };
}

export class SidebarTerminalProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  private view: vscode.WebviewView | undefined;
  private session: PtySession | undefined;
  /** Webview 尚未就绪时暂存的终端输出 */
  private ready = false;
  private pending: string[] = [];

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    const webview = webviewView.webview;
    webview.options = { enableScripts: true };
    webview.html = renderWebviewHtml({
      cspSource: webview.cspSource,
      scriptUri: webview
        .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'terminal.js'))
        .toString(),
      styleUri: webview
        .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'xterm.css'))
        .toString(),
      nonce: getNonce(),
    });

    webview.onDidReceiveMessage((message: WebviewToHostMessage) => this.handleMessage(message));
    webviewView.onDidDispose(() => this.disposeSession());

    // 打开视图即启动 OpenCode，与点击状态栏按钮行为一致
    this.ensureSession();
  }

  /** 由 opencodeDock.launch（location=sidebar）调用：显示视图并确保会话在运行 */
  async open(): Promise<void> {
    await vscode.commands.executeCommand(`${SIDEBAR_VIEW_ID}.focus`);
    this.ensureSession();
  }

  dispose(): void {
    this.disposeSession();
  }

  private handleMessage(message: WebviewToHostMessage): void {
    switch (message.type) {
      case 'ready':
        this.ready = true;
        for (const data of this.pending) {
          this.post({ type: 'output', data });
        }
        this.pending = [];
        break;
      case 'input':
        this.session?.write(message.data);
        break;
      case 'resize':
        this.session?.resize(message.cols, message.rows);
        break;
      case 'restart':
        this.restartSession();
        break;
    }
  }

  private restartSession(): void {
    this.disposeSession();
    this.post({ type: 'reset' });
    this.ensureSession();
  }

  private ensureSession(): void {
    if (this.session) {
      return;
    }
    const config = vscode.workspace.getConfiguration('opencodeDock');
    const preCommand = config.get<string>('preCommand', '');
    const command = config.get<string>('command', 'opencode');

    this.session = new PtySession(
      {
        command: this.resolveShell(),
        cwd: this.resolveCwd(),
        env: this.buildEnv(),
        cols: 80,
        rows: 24,
      },
      spawnPty,
      {
        onData: (data) => this.post({ type: 'output', data }),
        onExit: (exitCode) => {
          this.session = undefined;
          this.post({ type: 'exit', code: exitCode });
        },
      },
    );

    // preCommand 逐行执行后，最后执行启动 OpenCode 的命令（与编辑器区域路径一致）
    for (const line of buildLaunchLines({ preCommand, command })) {
      this.session.write(`${line}\r`);
    }
  }

  private disposeSession(): void {
    this.session?.dispose();
    this.session = undefined;
  }

  /** 默认 shell：与 VS Code 终端 profile 一致（vscode.env.shell 受 terminal.integrated.defaultProfile 影响） */
  private resolveShell(): string {
    const shell = vscode.env.shell;
    if (shell) {
      return shell;
    }
    return process.platform === 'win32' ? 'powershell.exe' : '/bin/bash';
  }

  /** 默认工作目录：首个工作区根目录，无工作区时用用户主目录 */
  private resolveCwd(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? os.homedir();
  }

  /** 继承扩展宿主环境，并固定 OpenCode 终端标题行为（与编辑器区域路径一致） */
  private buildEnv(): Record<string, string> {
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    env.OPENCODE_DISABLE_TERMINAL_TITLE = '1';
    return env;
  }

  /** 向 Webview 发送消息；未就绪时仅暂存输出，避免首屏数据丢失 */
  private post(message: HostToWebviewMessage): void {
    if (!this.view || !this.ready) {
      if (message.type === 'output') {
        this.pending.push(message.data);
      }
      return;
    }
    void this.view.webview.postMessage(message);
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
