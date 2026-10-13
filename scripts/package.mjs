// 打包脚本：node scripts/package.mjs [current|all|<target>]
// node-pty 是原生模块，vsix 必须携带目标平台的二进制，因此按平台分别产出：
// - current     打包当前平台（默认）
// - all         遍历全部支持平台；缺少对应平台二进制时明确报错，禁止产出损坏的 vsix
// - <target>    显式指定平台，如 win32-x64、darwin-arm64、linux-x64
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
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
  // node-pty 二进制必须存在：npm 包自带预编译（win32/darwin）或源码构建产物 build/Release（linux）
  const hasPrebuilt = existsSync(`node_modules/node-pty/prebuilds/${target}`);
  const hasSourceBuild = existsSync('node_modules/node-pty/build/Release');
  if (!hasPrebuilt && !hasSourceBuild) {
    console.error(
      `缺少 node-pty 在 ${target} 平台的二进制。\n` +
        'win32/darwin 使用 npm 包自带预编译；linux 需要先在该平台执行 npm install（源码编译）再打包，' +
        '或使用 .github/workflows/release.yml 的矩阵构建。',
    );
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
