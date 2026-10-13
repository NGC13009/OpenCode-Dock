// 打包脚本：node scripts/package.mjs
// 产出通用 VSIX 文件（不带 --target），一个包覆盖全部平台。
// 本扩展没有运行时依赖、没有原生模块或平台二进制，平台专属包（--target）的内容
// 与通用包完全相同，因此不再分别打包。
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const VSCE_CLI = path.join('node_modules', '@vscode', 'vsce', 'vsce');

mkdirSync('release', { recursive: true });

console.log('> vsce package --out release');
const result = spawnSync(
  process.execPath,
  [VSCE_CLI, 'package', '--out', 'release'],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
