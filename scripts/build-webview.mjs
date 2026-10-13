// 构建 webview 侧资源：用 esbuild 将 xterm.js 终端入口打包为单文件，并拷贝 xterm 样式。
// 该脚本被 npm run compile 调用，产物输出到 media/。.
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

const OUT_DIR = 'media';
mkdirSync(OUT_DIR, { recursive: true });

await build({
  entryPoints: ['src/webview/terminalMain.ts'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2022',
  outfile: `${OUT_DIR}/terminal.js`,
});

copyFileSync('node_modules/@xterm/xterm/css/xterm.css', `${OUT_DIR}/xterm.css`);
console.log(`> webview 构建完成：${OUT_DIR}/terminal.js、${OUT_DIR}/xterm.css`);
