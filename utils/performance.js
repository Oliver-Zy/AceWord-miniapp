/**
 * 性能监控工具
 * performance.js
 */
const { logger } = require('./logger.js')

class PerformanceMonitor {
  constructor() {
    this.marks = new Map()
    this.measures = new Map()
    this.isEnabled = true
  }

  /**
   * 开始性能标记
   * @param {string} name 标记名称
   */
  mark(name) {
    if (!this.isEnabled) return
    
    this.marks.set(name, Date.now())
    logger.debug(`Performance mark: ${name}`)
  }

  /**
   * 测量性能
   * @param {string} name 测量名称
   * @param {string} startMark 开始标记
   * @param {string} endMark 结束标记（可选）
   */
  measure(name, startMark, endMark) {
    if (!this.isEnabled) return
    
    const startTime = this.marks.get(startMark)
    const endTime = endMark ? this.marks.get(endMark) : Date.now()
    
    if (!startTime) {
      logger.warn(`Performance mark not found: ${startMark}`)
      return
    }
    
    const duration = endTime - startTime
    this.measures.set(name, duration)
    
    logger.info(`Performance measure: ${name} = ${duration}ms`)
    
    // 如果耗时过长，记录警告
    if (duration > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${duration}ms`)
    }
    
    return duration
  }

  /**
   * 获取所有测量结果
   */
  getAllMeasures() {
    return Object.fromEntries(this.measures)
  }

  /**
   * 清除所有标记和测量
   */
  clear() {
    this.marks.clear()
    this.measures.clear()
  }

  /**
   * 监控页面加载性能
   */
  monitorPageLoad(pageName) {
    this.mark(`${pageName}_start`)
    
    return {
      onReady: () => {
        this.mark(`${pageName}_ready`)
        this.measure(`${pageName}_load_time`, `${pageName}_start`, `${pageName}_ready`)
      },
      onShow: () => {
        this.mark(`${pageName}_show`)
        this.measure(`${pageName}_show_time`, `${pageName}_ready`, `${pageName}_show`)
      }
    }
  }

  /**
   * 监控网络请求性能
   */
  monitorRequest(url) {
    const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.mark(`${requestId}_start`)
    
    return {
      onSuccess: () => {
        this.measure(`${requestId}_duration`, `${requestId}_start`)
        this.reportNetworkPerformance(url, this.measures.get(`${requestId}_duration`), 'success')
      },
      onError: () => {
        this.measure(`${requestId}_duration`, `${requestId}_start`)
        this.reportNetworkPerformance(url, this.measures.get(`${requestId}_duration`), 'error')
      }
    }
  }

  /**
   * 上报网络性能数据
   */
  reportNetworkPerformance(url, duration, status) {
    logger.info(`Network performance: ${url} - ${duration}ms - ${status}`)
    
    // 可以在这里集成性能监控服务
    try {
      wx.reportMonitor('network_performance', {
        url,
        duration,
        status,
        timestamp: Date.now()
      })
    } catch (error) {
      // 静默处理上报失败
    }
  }

  /**
   * 监控内存使用
   */
  checkMemoryUsage() {
    try {
      const memoryInfo = wx.getPerformance().memory
      if (memoryInfo) {
        logger.info('Memory usage:', {
          used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        })
        
        // 内存使用率超过80%时警告
        const usageRate = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
        if (usageRate > 0.8) {
          logger.warn(`High memory usage: ${Math.round(usageRate * 100)}%`)
        }
      }
    } catch (error) {
      logger.debug('Memory info not available:', error)
    }
  }

  /**
   * 启用/禁用性能监控
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor()

module.exports = {
  performanceMonitor,
  PerformanceMonitor
}
