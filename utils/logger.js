/**
 * 日志管理工具
 * logger.js
 */

class Logger {
  constructor() {
    // 根据环境判断是否启用日志
    try {
      const accountInfo = wx.getAccountInfoSync()
      this.isDev = accountInfo.miniProgram.envVersion === 'develop' || accountInfo.miniProgram.envVersion === 'trial'
      this.isEnabled = this.isDev
    } catch (error) {
      // 如果获取账户信息失败，默认启用日志（开发环境）
      this.isDev = true
      this.isEnabled = true
    }
  }

  /**
   * 普通日志
   */
  log(...args) {
    if (this.isEnabled) {
      console.log('[LOG]', ...args)
    }
  }

  /**
   * 信息日志
   */
  info(...args) {
    if (this.isEnabled) {
      console.info('[INFO]', ...args)
    }
  }

  /**
   * 警告日志
   */
  warn(...args) {
    if (this.isEnabled) {
      console.warn('[WARN]', ...args)
    }
  }

  /**
   * 错误日志 - 生产环境也会输出
   */
  error(...args) {
    console.error('[ERROR]', ...args)
    
    // 生产环境可以考虑上报错误
    if (!this.isDev) {
      this.reportError(args)
    }
  }

  /**
   * 调试日志 - 仅开发环境
   */
  debug(...args) {
    if (this.isDev) {
      console.debug('[DEBUG]', ...args)
    }
  }

  /**
   * 性能日志
   */
  time(label) {
    if (this.isEnabled) {
      console.time(label)
    }
  }

  timeEnd(label) {
    if (this.isEnabled) {
      console.timeEnd(label)
    }
  }

  /**
   * 上报错误到服务器（生产环境）
   */
  reportError(errorArgs) {
    try {
      // 这里可以集成错误上报服务
      // 比如微信小程序的错误上报或第三方服务
      wx.reportMonitor('error_log', 1)
    } catch (e) {
      // 静默处理上报失败
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    const levels = {
      'debug': 0,
      'log': 1,
      'info': 2,
      'warn': 3,
      'error': 4,
      'none': 5
    }
    this.level = levels[level] || 1
  }
}

// 创建全局日志实例
const logger = new Logger()

module.exports = {
  logger,
  Logger
}
