/**
 * PTY 会话：封装 node-pty 子进程的生命周期与输入输出转发。
 * 通过注入 spawn 工厂与 node-pty 解耦，便于单元测试。
 */

/** 与 node-pty 返回对象形态一致的进程最小接口 */
export interface PtyProcessLike {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
  onData(listener: (data: string) => void): void;
  onExit(listener: (exitCode: number) => void): void;
}

/** spawn 参数（对应 node-pty.spawn 的常用字段） */
export interface PtySpawnOptions {
  /** 可执行文件路径（shell） */
  command: string;
  /** 工作目录 */
  cwd: string;
  /** 环境变量 */
  env: Record<string, string>;
  cols: number;
  rows: number;
}

export type PtySpawner = (options: PtySpawnOptions) => PtyProcessLike;

export interface PtySessionEvents {
  /** 进程输出（原始字节流） */
  onData: (data: string) => void;
  /** 进程退出 */
  onExit: (exitCode: number) => void;
}

export class PtySession {
  private readonly process: PtyProcessLike;
  private disposed = false;

  constructor(
    options: PtySpawnOptions,
    spawner: PtySpawner,
    private readonly events: PtySessionEvents,
  ) {
    this.process = spawner(options);
    this.process.onData((data) => this.events.onData(data));
    this.process.onExit((exitCode) => this.events.onExit(exitCode));
  }

  /** 向进程 stdin 写入数据 */
  write(data: string): void {
    this.process.write(data);
  }

  /** 调整终端尺寸 */
  resize(cols: number, rows: number): void {
    this.process.resize(cols, rows);
  }

  /** 结束会话（杀死进程）；重复调用只生效一次 */
  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.process.kill();
  }
}
