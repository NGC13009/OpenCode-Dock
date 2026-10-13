/**
 * 侧栏终端 Webview 的 HTML 模板（纯函数，便于单元测试）。
 * 脚本使用 nonce、样式与脚本均来自 webview 资源，CSP 不放开 unsafe-inline。
 */

export interface WebviewHtmlOptions {
  /** CSP 允许的资源来源（webview.cspSource） */
  cspSource: string;
  /** 终端脚本 URI（webview.asWebviewUri 转换后的字符串） */
  scriptUri: string;
  /** xterm 样式 URI */
  styleUri: string;
  /** 脚本 nonce */
  nonce: string;
}

export function renderWebviewHtml({ cspSource, scriptUri, styleUri, nonce }: WebviewHtmlOptions): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${cspSource} data:; style-src ${cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="terminal"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
