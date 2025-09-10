/**
 * 每日限制管理工具
 * dailyLimits.js
 */

const { logger } = require('./logger.js')

class DailyLimits {
  constructor() {
    this.LIMITS = {
      free: {
        dailyCards: 10,        // 每日新建卡片上限
        dailyReplaces: 15,     // 每日换词次数上限
        customBooks: 1,        // 自定义词书数量限制
        bgColors: 2           // 背景色选择限制（黄色+无色）
      },
      vip: {
        dailyCards: -1,        // 无限制
        dailyReplaces: -1,     // 无限制  
        customBooks: -1,       // 无限制
        bgColors: -1          // 全部背景色
      }
    }
  }

  /**
   * 获取今日日期字符串
   */
  getTodayKey() {
    const date = new Date()
    return date.getFullYear().toString() + 
           (date.getMonth() < 9 ? '0' + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString()) + 
           (date.getDate() < 10 ? '0' + date.getDate() : date.getDate().toString())
  }

  /**
   * 获取用户今日使用情况
   */
  getTodayUsage() {
    const todayKey = this.getTodayKey()
    const storageKey = `dailyUsage_${todayKey}`
    
    try {
      const usage = wx.getStorageSync(storageKey)
      return usage || {
        cards: 0,
        replaces: 0,
        date: todayKey
      }
    } catch (error) {
      logger.error('Failed to get daily usage:', error)
      return {
        cards: 0,
        replaces: 0,
        date: todayKey
      }
    }
  }

  /**
   * 更新今日使用情况
   */
  updateTodayUsage(type, increment = 1) {
    const todayKey = this.getTodayKey()
    const storageKey = `dailyUsage_${todayKey}`
    
    try {
      let usage = this.getTodayUsage()
      
      // 如果日期不匹配，重置使用量
      if (usage.date !== todayKey) {
        usage = {
          cards: 0,
          replaces: 0,
          date: todayKey
        }
      }
      
      // 更新对应类型的使用量
      if (type === 'cards') {
        usage.cards += increment
      } else if (type === 'replaces') {
        usage.replaces += increment
      }
      
      wx.setStorageSync(storageKey, usage)
      logger.debug('Daily usage updated:', { type, usage })
      
      return usage
    } catch (error) {
      logger.error('Failed to update daily usage:', error)
      return this.getTodayUsage()
    }
  }

  /**
   * 检查是否可以创建新卡片
   */
  canCreateCard() {
    try {
      const app = getApp()
      const isVip = app && app.globalData && app.globalData.settings && !app.globalData.settings.isVipExpired
      
      if (isVip) {
        return { allowed: true, remaining: -1, limit: -1 }
      }
      
      const usage = this.getTodayUsage()
      const limit = this.LIMITS.free.dailyCards
      const remaining = Math.max(0, limit - usage.cards)
      
      return {
        allowed: usage.cards < limit,
        used: usage.cards,
        limit: limit,
        remaining: remaining
      }
    } catch (error) {
      logger.error('Error in canCreateCard:', error)
      // 发生错误时返回默认的免费用户限制
      const usage = this.getTodayUsage()
      const limit = this.LIMITS.free.dailyCards
      const remaining = Math.max(0, limit - usage.cards)
      
      return {
        allowed: usage.cards < limit,
        used: usage.cards,
        limit: limit,
        remaining: remaining
      }
    }
  }

  /**
   * 检查是否可以换词
   */
  canReplaceWord() {
    try {
      const app = getApp()
      const isVip = app && app.globalData && app.globalData.settings && !app.globalData.settings.isVipExpired
      
      if (isVip) {
        return { allowed: true, remaining: -1, limit: -1 }
      }
      
      // 优先使用服务端返回的换词限制
      const serverReplaceData = this.getServerReplaceCount()
      if (serverReplaceData !== null) {
        return {
          allowed: serverReplaceData.remaining > 0,
          used: serverReplaceData.used,
          limit: serverReplaceData.limit,
          remaining: serverReplaceData.remaining
        }
      }
      
      // 如果没有服务端数据，使用本地限制（向后兼容）
      const usage = this.getTodayUsage()
      const limit = this.LIMITS.free.dailyReplaces
      const remaining = Math.max(0, limit - usage.replaces)
      
      return {
        allowed: usage.replaces < limit,
        used: usage.replaces,
        limit: limit,
        remaining: remaining
      }
    } catch (error) {
      logger.error('Error in canReplaceWord:', error)
      // 发生错误时返回默认的免费用户限制
      const usage = this.getTodayUsage()
      const limit = this.LIMITS.free.dailyReplaces
      const remaining = Math.max(0, limit - usage.replaces)
      
      return {
        allowed: usage.replaces < limit,
        used: usage.replaces,
        limit: limit,
        remaining: remaining
      }
    }
  }

  /**
   * 显示限制达到提示
   */
  showLimitReached(type) {
    const messages = {
      cards: {
        title: '今日卡片已用完',
        content: '今日新建卡片已达上限(10个)\n如需升级会员，请联系客服',
        event: 'limit_cards'
      },
      replaces: {
        title: '换词次数已用完', 
        content: '今日换词次数已达上限(15次)\n如需升级会员，请联系客服',
        event: 'limit_replaces'
      }
    }
    
    const message = messages[type]
    if (!message) return
    
    wx.showModal({
      title: message.title,
      content: message.content,
      confirmText: '联系客服',
      cancelText: '明天再来',
      success: (res) => {
        if (res.confirm) {
          // 检查设备类型
          const app = getApp()
          if (app.globalData.isIOS) {
            // iOS显示客服联系信息
            wx.showModal({
              title: '联系客服',
              content: '由于苹果应用商店政策限制，iOS用户暂时无法在小程序内购买会员。请联系客服获取其他开通方式\n\n客服微信：MiddleRain_',
              confirmText: '复制',
              cancelText: '我知道了',
              success: (res) => {
                if (res.confirm) {
                  wx.setClipboardData({
                    data: 'MiddleRain_',
                    success: () => {
                      wx.showToast({
                        title: '客服微信号已复制',
                        icon: 'success'
                      })
                    }
                  })
                }
              }
            })
          } else {
            // 安卓跳转到VIP页面
            wx.navigateTo({ 
              url: `/pages/vip/vip?event=${message.event}` 
            })
          }
        }
      }
    })
  }

  /**
   * 显示使用量提醒
   */
  showUsageWarning(type, used, limit) {
    const remaining = limit - used
    
    if (remaining <= 3 && remaining > 0) {
      const messages = {
        cards: `今日还可创建${remaining}张卡片`,
        replaces: `今日还可换词${remaining}次`
      }
      
      wx.showToast({
        title: messages[type] || '',
        icon: 'none',
        duration: 2000
      })
    }
  }

  /**
   * 记录卡片创建
   */
  recordCardCreation() {
    const check = this.canCreateCard()
    if (!check.allowed) {
      this.showLimitReached('cards')
      return false
    }
    
    // 更新使用量
    const newUsage = this.updateTodayUsage('cards', 1)
    
    // 显示提醒
    if (check.limit > 0) {
      this.showUsageWarning('cards', newUsage.cards, check.limit)
    }
    
    return true
  }

  /**
   * 记录换词操作
   */
  recordWordReplace() {
    const check = this.canReplaceWord()
    if (!check.allowed) {
      this.showLimitReached('replaces')
      return false
    }
    
    // 更新使用量
    const newUsage = this.updateTodayUsage('replaces', 1)
    
    // 显示提醒
    if (check.limit > 0) {
      this.showUsageWarning('replaces', newUsage.replaces, check.limit)
    }
    
    return true
  }

  /**
   * 更新服务端返回的换词次数
   * @param {number} serverUsedCount - 服务端返回的已使用换词次数
   */
  updateServerReplaceCount(serverUsedCount) {
    try {
      const todayKey = this.getTodayKey()
      const storageKey = `serverReplaceCount_${todayKey}`
      const dailyLimit = 15 // 每日换词限制15次
      const remaining = Math.max(0, dailyLimit - serverUsedCount)
      
      wx.setStorageSync(storageKey, {
        used: serverUsedCount,
        remaining: remaining,
        limit: dailyLimit,
        date: todayKey,
        lastUpdate: Date.now()
      })
      
      logger.debug('Server replace count updated:', { 
        used: serverUsedCount, 
        remaining: remaining, 
        limit: dailyLimit,
        date: todayKey 
      })
    } catch (error) {
      logger.error('Failed to update server replace count:', error)
    }
  }

  /**
   * 获取服务端返回的换词次数限制信息
   */
  getServerReplaceCount() {
    try {
      const todayKey = this.getTodayKey()
      const storageKey = `serverReplaceCount_${todayKey}`
      
      const data = wx.getStorageSync(storageKey)
      if (data && data.date === todayKey) {
        return {
          used: data.used,
          remaining: data.remaining,
          limit: data.limit
        }
      }
      
      return null
    } catch (error) {
      logger.error('Failed to get server replace count:', error)
      return null
    }
  }

  /**
   * 获取使用统计信息（用于"我的"页面显示）
   */
  getUsageStats() {
    try {
      const app = getApp()
      const isVip = app && app.globalData && app.globalData.settings && !app.globalData.settings.isVipExpired
      const usage = this.getTodayUsage()
      
      return {
        isVip,
        cards: {
          used: usage.cards,
          limit: isVip ? -1 : this.LIMITS.free.dailyCards,
          percentage: isVip ? 0 : Math.min(100, (usage.cards / this.LIMITS.free.dailyCards) * 100)
        },
        replaces: {
          used: usage.replaces,
          limit: isVip ? -1 : this.LIMITS.free.dailyReplaces,
          percentage: isVip ? 0 : Math.min(100, (usage.replaces / this.LIMITS.free.dailyReplaces) * 100)
        }
      }
    } catch (error) {
      logger.error('Error in getUsageStats:', error)
      // 发生错误时返回默认的免费用户统计
      const usage = this.getTodayUsage()
      return {
        isVip: false,
        cards: {
          used: usage.cards,
          limit: this.LIMITS.free.dailyCards,
          percentage: Math.min(100, (usage.cards / this.LIMITS.free.dailyCards) * 100)
        },
        replaces: {
          used: usage.replaces,
          limit: this.LIMITS.free.dailyReplaces,
          percentage: Math.min(100, (usage.replaces / this.LIMITS.free.dailyReplaces) * 100)
        }
      }
    }
  }
}

// 创建全局实例
const dailyLimits = new DailyLimits()

module.exports = {
  dailyLimits,
  DailyLimits
}
