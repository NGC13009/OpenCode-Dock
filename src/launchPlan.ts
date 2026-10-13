/**
 * 启动计划的纯逻辑模块，便于单元测试。
 */

/** 终端标签页的默认标题 */
export const DEFAULT_TERMINAL_NAME = 'OpenCode';

export interface LaunchConfig {
  /** 启动 OpenCode 前要执行的命令文本，支持多行（每行一条命令） */
  preCommand: string;
  /** 启动 OpenCode TUI 的命令 */
  command: string;
}

/**
 * 解析终端标签标题：去掉首尾空白；为空（未配置/仅空白）时回退为默认标题。
 */
export function resolveTerminalName(name: string | undefined | null): string {
  const trimmed = (name ?? '').trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_TERMINAL_NAME;
}

/**
 * 将配置转换为终端中依次执行的命令行列表：
 * - preCommand 按行拆分，忽略空行（首尾空白会被去掉）
 * - 最后追加启动 OpenCode 的命令
 */
export function buildLaunchLines({ preCommand, command }: LaunchConfig): string[] {
  const lines = preCommand
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return [...lines, command.trim()];
}
