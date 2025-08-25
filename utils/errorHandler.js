/**
 * 全局错误处理工具
 * errorHandler.js
 */
const { logger } = require('./logger.js')

class ErrorHandler {
  constructor() {
    this.setupGlobalErrorHandling()
  }

  /**
   * 设置全局错误处理
   */
  setupGlobalErrorHandling() {
    // 监听小程序错误
    wx.onError((error) => {
      this.handleError(error, 'global')
    })

    // 监听未处理的Promise拒绝
    wx.onUnhandledRejection((res) => {
      this.handleError(res.reason, 'unhandledRejection')
    })
  }

  /**
   * 处理错误
   * @param {Error|string} error 错误对象或错误信息
   * @param {string} type 错误类型
   * @param {Object} context 错误上下文
   */
  handleError(error, type = 'unknown', context = {}) {
    const errorInfo = {
      type,
      message: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: wx.getSystemInfoSync(),
      accountInfo: wx.getAccountInfoSync()
    }

    logger.error('Error handled:', errorInfo)

    // 根据错误类型进行不同处理
    switch (type) {
      case 'network':
        this.handleNetworkError(error, context)
        break
      case 'business':
        this.handleBusinessError(error, context)
        break
      case 'global':
        this.handleGlobalError(error, context)
        break
      default:
        this.handleUnknownError(error, context)
    }

    // 上报错误（生产环境）
    this.reportError(errorInfo)
  }

  /**
   * 处理网络错误
   */
  handleNetworkError(error, context) {
    const errorCode = error?.errcode || error?.statusCode
    
    switch (errorCode) {
      case -1:
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        })
        break
      case 404:
        wx.showToast({
          title: '请求的资源不存在',
          icon: 'none',
          duration: 2000
        })
        break
      case 500:
        wx.showToast({
          title: '服务器内部错误',
          icon: 'none',
          duration: 2000
        })
        break
      default:
        wx.showToast({
          title: '网络请求失败，请稍后重试',
          icon: 'none',
          duration: 2000
        })
    }
  }

  /**
   * 处理业务错误
   */
  handleBusinessError(error, context) {
    const message = error?.message || '操作失败'
    
    wx.showModal({
      title: '提示',
      content: message,
      showCancel: false,
      confirmText: '确定'
    })
  }

  /**
   * 处理全局错误
   */
  handleGlobalError(error, context) {
    logger.error('Global error occurred:', error)
    
    // 全局错误通常比较严重，可能需要重启应用
    if (this.isCriticalError(error)) {
      wx.showModal({
        title: '应用异常',
        content: '应用遇到异常，建议重启小程序',
        showCancel: true,
        cancelText: '继续使用',
        confirmText: '重启应用',
        success: (res) => {
          if (res.confirm) {
            wx.reLaunch({
              url: '/pages/index/index'
            })
          }
        }
      })
    }
  }

  /**
   * 处理未知错误
   */
  handleUnknownError(error, context) {
    logger.warn('Unknown error type:', error)
    
    wx.showToast({
      title: '操作失败，请重试',
      icon: 'none',
      duration: 2000
    })
  }

  /**
   * 判断是否为严重错误
   */
  isCriticalError(error) {
    const criticalKeywords = [
      'Cannot read property',
      'undefined is not a function',
      'Maximum call stack',
      'Out of memory'
    ]
    
    const errorMessage = error?.message || error?.toString() || ''
    return criticalKeywords.some(keyword => errorMessage.includes(keyword))
  }

  /**
   * 上报错误
   */
  reportError(errorInfo) {
    try {
      // 只在生产环境上报
      const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
      if (envVersion === 'release') {
        wx.reportMonitor('error_report', errorInfo)
      }
    } catch (e) {
      // 静默处理上报失败
      logger.debug('Error reporting failed:', e)
    }
  }

  /**
   * 包装异步函数，自动处理错误
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn.apply(this, args)
      } catch (error) {
        this.handleError(error, 'async', { ...context, args })
        throw error
      }
    }
  }

  /**
   * 包装同步函数，自动处理错误
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn.apply(this, args)
      } catch (error) {
        this.handleError(error, 'sync', { ...context, args })
        throw error
      }
    }
  }
}

// 创建全局实例
const errorHandler = new ErrorHandler()

module.exports = {
  errorHandler,
  ErrorHandler
}
