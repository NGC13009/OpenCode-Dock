import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderWebviewHtml } from '../src/sidebar/webviewHtml';

const options = {
  cspSource: 'https://file+.vscode-resource.vscode-cdn.net',
  scriptUri: 'https://file+.vscode-resource.vscode-cdn.net/media/terminal.js',
  styleUri: 'https://file+.vscode-resource.vscode-cdn.net/media/xterm.css',
  nonce: 'abc123',
};

test('脚本与样式引用正确且脚本使用 nonce', () => {
  const html = renderWebviewHtml(options);
  assert.match(html, /nonce="abc123"/);
  assert.match(html, /src="https:\/\/file\+\.vscode-resource\.vscode-cdn\.net\/media\/terminal\.js"/);
  assert.match(html, /href="https:\/\/file\+\.vscode-resource\.vscode-cdn\.net\/media\/xterm\.css"/);
});

test('CSP 允许来源为 cspSource 且不放开 unsafe-inline / unsafe-eval', () => {
  const html = renderWebviewHtml(options);
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);
  assert.ok(csp, '应包含 CSP');
  assert.match(csp[1], new RegExp(options.cspSource.replace(/[.+]/g, '\\$&')));
  assert.doesNotMatch(csp[1], /unsafe-inline/);
  assert.doesNotMatch(csp[1], /unsafe-eval/);
});

test('除终端容器与带 nonce 的脚本外无其他 script 标签', () => {
  const html = renderWebviewHtml(options);
  const scripts = html.match(/<script/g) ?? [];
  assert.equal(scripts.length, 1);
  assert.match(html, /<div id="terminal"><\/div>/);
});
