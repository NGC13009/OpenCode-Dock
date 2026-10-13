import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { buildLaunchLines } from '../src/launchPlan';

test('preCommand 按行拆分，忽略空行并清理首尾空白', () => {
  const lines = buildLaunchLines({
    preCommand: 'cd /tmp\n\nexport A=1\n  source .env  ',
    command: 'opencode',
  });
  assert.deepEqual(lines, ['cd /tmp', 'export A=1', 'source .env', 'opencode']);
});

test('无 preCommand 时仅返回启动命令', () => {
  assert.deepEqual(buildLaunchLines({ preCommand: '', command: 'opencode' }), ['opencode']);
});

test('支持 CRLF 换行', () => {
  const lines = buildLaunchLines({ preCommand: 'cd /tmp\r\nexport A=1', command: 'bunx opencode' });
  assert.deepEqual(lines, ['cd /tmp', 'export A=1', 'bunx opencode']);
});

test('启动命令同样会清理首尾空白', () => {
  const lines = buildLaunchLines({ preCommand: '', command: '  opencode --model x  ' });
  assert.deepEqual(lines, ['opencode --model x']);
});

test('全部为空时仅剩一条空启动命令（不抛出异常）', () => {
  const lines = buildLaunchLines({ preCommand: '\n  \n', command: 'opencode' });
  assert.deepEqual(lines, ['opencode']);
});
