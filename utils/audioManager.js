/**
 * 音频管理服务
 * audioManager.js
 */
const { logger } = require('./logger.js')

class AudioManager {
  constructor() {
    this.innerAudioContext = wx.createInnerAudioContext()
    this.backgroundAudioManager = wx.getBackgroundAudioManager()
    this.setupErrorHandling()
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    this.innerAudioContext.onError((res) => {
      logger.warn("Inner audio failed, trying background audio:", res)
      // 如果内部音频播放失败，尝试使用背景音频
      if (this.currentWord && this.currentAudioUrl) {
        this.backgroundAudioManager.title = this.currentWord
        this.backgroundAudioManager.src = this.currentAudioUrl
      }
    })

    this.backgroundAudioManager.onError((res) => {
      logger.error("Background audio also failed:", res)
    })
  }

  /**
   * 播放单词发音
   * @param {string} word 单词
   * @param {string} pronType 发音类型 'US' | 'UK'
   */
  playPronunciation(word, pronType = 'US') {
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${pronType === 'US' ? 0 : 1}`
    
    this.currentWord = word
    this.currentAudioUrl = audioUrl
    
    logger.debug('Playing pronunciation:', { word, audioUrl })
    
    this.innerAudioContext.src = audioUrl
    this.innerAudioContext.play()
  }

  /**
   * 停止播放
   */
  stop() {
    try {
      this.innerAudioContext.stop()
    } catch (error) {
      logger.warn('Failed to stop inner audio:', error)
    }
  }

  /**
   * 暂停播放
   */
  pause() {
    try {
      this.innerAudioContext.pause()
    } catch (error) {
      logger.warn('Failed to pause inner audio:', error)
    }
  }

  /**
   * 销毁音频上下文
   */
  destroy() {
    try {
      this.innerAudioContext.destroy()
    } catch (error) {
      logger.warn('Failed to destroy inner audio:', error)
    }
  }

  /**
   * 设置音量
   * @param {number} volume 音量 0-1
   */
  setVolume(volume) {
    this.innerAudioContext.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 获取播放状态
   */
  getPlayState() {
    return {
      paused: this.innerAudioContext.paused,
      currentTime: this.innerAudioContext.currentTime,
      duration: this.innerAudioContext.duration
    }
  }
}

// 创建全局实例
const audioManager = new AudioManager()

module.exports = {
  audioManager,
  AudioManager
}
