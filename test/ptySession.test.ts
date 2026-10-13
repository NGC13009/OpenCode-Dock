import * as assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PtySession,
  type PtyProcessLike,
  type PtySpawnOptions,
  type PtySpawner,
} from '../src/sidebar/ptySession';

interface FakeState {
  writes: string[];
  resizes: Array<[number, number]>;
  killed: boolean;
  dataListener: ((data: string) => void) | undefined;
  exitListener: ((exitCode: number) => void) | undefined;
}

function createFakePty(): PtyProcessLike & { state: FakeState } {
  const state: FakeState = { writes: [], resizes: [], killed: false, dataListener: undefined, exitListener: undefined };
  return {
    state,
    write: (data) => state.writes.push(data),
    resize: (cols, rows) => state.resizes.push([cols, rows]),
    kill: () => {
      state.killed = true;
    },
    onData: (listener) => {
      state.dataListener = listener;
    },
    onExit: (listener) => {
      state.exitListener = listener;
    },
  };
}

function createCaptureSpawner(): { spawner: PtySpawner; options: PtySpawnOptions[]; pty: ReturnType<typeof createFakePty> } {
  const pty = createFakePty();
  const options: PtySpawnOptions[] = [];
  const spawner: PtySpawner = (opt) => {
    options.push(opt);
    return pty;
  };
  return { spawner, options, pty };
}

test('构造时以给定参数启动进程', () => {
  const { spawner, options } = createCaptureSpawner();
  const events = { onData: () => {}, onExit: () => {} };
  new PtySession({ command: 'powershell.exe', cwd: 'C:/work', env: { A: '1' }, cols: 80, rows: 24 }, spawner, events);
  assert.deepEqual(options, [{ command: 'powershell.exe', cwd: 'C:/work', env: { A: '1' }, cols: 80, rows: 24 }]);
});

test('进程输出与退出事件被转发给监听者', () => {
  const { spawner, pty } = createCaptureSpawner();
  const received: string[] = [];
  let exitCode: number | undefined;
  new PtySession(
    { command: 'bash', cwd: '/', env: {}, cols: 80, rows: 24 },
    spawner,
    { onData: (data) => received.push(data), onExit: (code) => (exitCode = code) },
  );
  pty.state.dataListener?.('hello');
  pty.state.exitListener?.(42);
  assert.deepEqual(received, ['hello']);
  assert.equal(exitCode, 42);
});

test('write 与 resize 透传给进程', () => {
  const { spawner, pty } = createCaptureSpawner();
  const session = new PtySession(
    { command: 'bash', cwd: '/', env: {}, cols: 80, rows: 24 },
    spawner,
    { onData: () => {}, onExit: () => {} },
  );
  session.write('opencode\r');
  session.resize(120, 40);
  assert.deepEqual(pty.state.writes, ['opencode\r']);
  assert.deepEqual(pty.state.resizes, [[120, 40]]);
});

test('dispose 杀死进程且重复调用只生效一次', () => {
  const { spawner, pty } = createCaptureSpawner();
  const session = new PtySession(
    { command: 'bash', cwd: '/', env: {}, cols: 80, rows: 24 },
    spawner,
    { onData: () => {}, onExit: () => {} },
  );
  session.dispose();
  session.dispose();
  assert.equal(pty.state.killed, true);
});
