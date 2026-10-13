// 打包脚本：node scripts/package.mjs [current|all|<target>]
// - current     打包当前平台（默认）
// - all         遍历全部支持平台
// - <target>    显式指定平台，如 win32-x64、darwin-arm64、linux-x64
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const TARGETS = ['win32-x64', 'win32-arm64', 'darwin-x64', 'darwin-arm64', 'linux-x64', 'linux-arm64'];
const VSCE_CLI = path.join('node_modules', '@vscode', 'vsce', 'vsce');

const mode = process.argv[2] ?? 'current';
const targets =
  mode === 'all'
    ? TARGETS
    : mode === 'current'
      ? [`${process.platform}-${process.arch}`]
      : [mode];

mkdirSync('release', { recursive: true });

for (const target of targets) {
  if (!TARGETS.includes(target)) {
    console.error(`不支持的平台: ${target}（支持: ${TARGETS.join(', ')}）`);
    process.exit(1);
  }
  console.log(`> vsce package --target ${target}`);
  const result = spawnSync(
    process.execPath,
    [VSCE_CLI, 'package', '--target', target, '--out', 'release'],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
console.log('> 打包完成');
