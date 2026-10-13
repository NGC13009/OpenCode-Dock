/**
 * 侧栏终端 Webview 入口：用 xterm.js 渲染 PTY 输出，并将输入/尺寸/重开事件回传扩展宿主。
 * 该文件由 esbuild 打包为 media/terminal.js，属于独立运行环境（浏览器）代码。
 */
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
};

const vscode = acquireVsCodeApi();
const host = document.getElementById('terminal');
if (!host) {
  throw new Error('未找到终端容器 #terminal');
}

const term = new Terminal({
  cursorBlink: true,
  fontSize: 13,
  fontFamily: 'var(--vscode-editor-font-family, monospace)',
  scrollback: 2000,
});
const fit = new FitAddon();
term.loadAddon(fit);
term.open(host);
term.focus();

// 进程退出后按 Enter 重新打开会话
let exited = false;
term.attachCustomKeyEventHandler((event) => {
  if (exited && event.key === 'Enter') {
    exited = false;
    vscode.postMessage({ type: 'restart' });
    return false;
  }
  return true;
});

term.onData((data) => vscode.postMessage({ type: 'input', data }));
term.onResize(({ cols, rows }) => vscode.postMessage({ type: 'resize', cols, rows }));

window.addEventListener('message', (event: MessageEvent) => {
  const message = event.data as { type: string; [key: string]: unknown };
  switch (message.type) {
    case 'output':
      term.write(String(message.data));
      break;
    case 'exit':
      exited = true;
      term.writeln(`\r\n[进程已退出（代码 ${String(message.code)}）] 按 Enter 重新打开`);
      term.focus();
      break;
    case 'reset':
      term.reset();
      break;
  }
});

// 容器尺寸变化时自适应并通知宿主同步 PTY 尺寸
const observer = new ResizeObserver(() => requestAnimationFrame(() => fit.fit()));
observer.observe(host);
fit.fit();
vscode.postMessage({ type: 'ready' });
