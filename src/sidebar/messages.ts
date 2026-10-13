/**
 * 侧栏终端 Webview 与扩展宿主之间的消息协议（单一类型来源）。
 * webview 侧为独立打包产物，通过 `import type` 共享类型，编译期擦除，不产生运行时依赖。
 */

/** 宿主 → Webview */
export type HostToWebviewMessage =
  | { type: 'output'; data: string }
  | { type: 'exit'; code: number }
  | { type: 'reset' };

/** Webview → 宿主 */
export type WebviewToHostMessage =
  | { type: 'ready' }
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number }
  | { type: 'restart' };
