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
    // 内测阶段暂时注释VIP限制，所有用户都可以无限使用
    return { allowed: true, remaining: -1, limit: -1 }
    
    /* 原VIP限制逻辑，内测期间暂时注释
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
    */
  }

  /**
   * 检查是否可以换词
   */
  canReplaceWord() {
    // 内测阶段暂时注释VIP限制，所有用户都可以无限使用
    return { allowed: true, remaining: -1, limit: -1 }
    
    /* 原VIP限制逻辑，内测期间暂时注释
    try {
      const app = getApp()
      const isVip = app && app.globalData && app.globalData.settings && !app.globalData.settings.isVipExpired
      
      if (isVip) {
        return { allowed: true, remaining: -1, limit: -1 }
      }
      
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
    */
  }

  /**
   * 显示限制达到提示
   */
  showLimitReached(type) {
    const messages = {
      cards: {
        title: '今日卡片已用完',
        content: '今日新建卡片已达上限(10个)\n开通会员解锁无限制学习',
        event: 'limit_cards'
      },
      replaces: {
        title: '换词次数已用完', 
        content: '今日换词次数已达上限(15次)\n会员用户可无限制换词',
        event: 'limit_replaces'
      }
    }
    
    const message = messages[type]
    if (!message) return
    
    wx.showModal({
      title: message.title,
      content: message.content,
      confirmText: '升级会员',
      cancelText: '明天再来',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ 
            url: `/pages/vip/vip?event=${message.event}` 
          })
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
    // 内测阶段暂时注释VIP限制，直接返回成功
    return true
    
    /* 原VIP限制逻辑，内测期间暂时注释
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
    */
  }

  /**
   * 记录换词操作
   */
  recordWordReplace() {
    // 内测阶段暂时注释VIP限制，直接返回成功
    return true
    
    /* 原VIP限制逻辑，内测期间暂时注释
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
    */
  }

  /**
   * 获取使用统计信息（用于"我的"页面显示）
   */
  getUsageStats() {
    // 内测阶段暂时注释VIP限制，返回无限制状态
    return {
      isVip: true, // 内测期间所有用户都按VIP处理
      cards: {
        used: 0,
        limit: -1, // 无限制
        percentage: 0
      },
      replaces: {
        used: 0,
        limit: -1, // 无限制
        percentage: 0
      }
    }
    
    /* 原VIP限制逻辑，内测期间暂时注释
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
    */
  }
}

// 创建全局实例
const dailyLimits = new DailyLimits()

module.exports = {
  dailyLimits,
  DailyLimits
}
