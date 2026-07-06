/**
 * Logger — 統一格式的日誌工具.
 *
 * 固定輸出格式: `[ISO-time] [LEVEL] [module?] message`
 * 例: `2026-05-28T14:23:12.345Z [ERROR] [useMouFields] fetchBlocks failed`
 *
 * 目前只 wrap console (沒 remote sink); 等加 Sentry 時, 統一在這檔 forward.
 * 全專案 console.error / console.warn 應改走 logger, 避免 prod 漏抓.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  /** 模組名稱, 會 prefix 進每一行 log. 例: 'useMouFields'. */
  module?: string
}

class Logger {
  private module?: string

  constructor(options: LoggerOptions = {}) {
    this.module = options.module
  }

  /** 建立子 logger; 沿用父 module name (除非提供新的). */
  child(module: string): Logger {
    return new Logger({ module })
  }

  private prefix(level: Level): string {
    const time = new Date().toISOString()
    const mod = this.module ? ` [${this.module}]` : ''
    return `${time} [${level.toUpperCase()}]${mod}`
  }

  debug(message: string, ...args: unknown[]): void {
    if (!import.meta.dev) return
    console.debug(this.prefix('debug'), message, ...args)
  }

  info(message: string, ...args: unknown[]): void {
    console.info(this.prefix('info'), message, ...args)
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(this.prefix('warn'), message, ...args)
  }

  error(message: string, ...args: unknown[]): void {
    console.error(this.prefix('error'), message, ...args)
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options)
}

/** 預設無 module 的 logger (給沒指定 module 的 caller; 之後可以加 caller 自動 prefix). */
export const logger = createLogger()
