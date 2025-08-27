/**
 * 首页业务逻辑服务
 * indexService.js
 */
const { Common } = require('../../models/common.js')
const { HTTP } = require('../../utils/http.js')
const { logger } = require('../../utils/logger.js')
const Toast = require('../../miniprogram_npm/@vant/weapp/toast/toast')

const common = new Common()
const http = new HTTP()

class IndexService {
  constructor() {
    this.innerAudioContext = wx.createInnerAudioContext()
    this.backgroundAudioManager = wx.getBackgroundAudioManager()
  }

  /**
   * 获取首页数据
   */
  async getHomeData() {
    try {
      const homeData = await common.request({ url: `/homedata` })
      logger.info('Home data loaded:', homeData)
      return homeData
    } catch (error) {
      logger.error('Failed to load home data:', error)
      throw error
    }
  }

  /**
   * 处理首页数据
   */
  processHomeData(homeData, context) {
    const app = getApp()
    
    // set globalData: settings
    let settings = homeData.settings
    app.globalData.settings = settings

    // setData: senCard
    let senCard = homeData.sentence

    // setData: wordBookMyInfo, wordBookList
    let wordBookCodeToName = homeData.bookMap
    let currentWordBook = settings.currentWordBook
    let wordBookMyInfo = {
      currentWordBookName: currentWordBook.wordBookName,
      dailyTargetNum: settings.dailyTargetNum,
      totalWordNum: currentWordBook.totalWordNum,
      userProgressNum: currentWordBook.userProgressNum
    }
    let reviewCard = homeData.reviewData
    let pageInfo = homeData.todayCardList

    context.setData({
      isVipExpired: settings.isVipExpired,
      showGuideOfAddToMyMiniApp: settings.showGuideOfAddToMyMiniApp,
      senCard,
      wordBookMyInfo,
      wordBookCodeToName,
      reviewCard: reviewCard,
      isRefresherTriggered: false,
    })

    let todayCardList = this.updateWordCardList(pageInfo.data, wordBookMyInfo)
    context.setData({
      todayCardList: todayCardList.length == 0 ? [{ _type: 'blank' }] : todayCardList,
    })

    wx.setStorageSync('todayCardList', todayCardList)
    return todayCardList
  }

  /**
   * 更新单词卡片列表
   */
  updateWordCardList(wordCardList, wordBookMyInfo) {
    return wordCardList.map(item => {
      item.wordBookName = wordBookMyInfo.currentWordBookName
      item.wordList = item.wordInfoList.map(item => item.wordName)
      return item
    })
  }

  /**
   * 搜索单词
   */
  async searchWord(word) {
    try {
      Toast.loading()
      const wordInfo = await common.request({
        url: `/wordinfo/search?word=${word}`
      })
      Toast.clear()
      return wordInfo
    } catch (error) {
      Toast.fail("未找到该单词")
      throw error
    }
  }

  /**
   * 发音
   */
  pronounce(word) {
    const app = getApp()
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    
    logger.debug('Playing pronunciation:', audioUrl)
    
    this.innerAudioContext.src = audioUrl
    this.innerAudioContext.play()
    
    this.innerAudioContext.onError((res) => {
      logger.warn("Audio play failed, trying background audio:", res)
      this.backgroundAudioManager.title = word
      this.backgroundAudioManager.src = audioUrl
    })
  }

  /**
   * 添加单词卡片
   */
  async addWordCard() {
    // 检查每日限制 - 内测期间暂时注释
    // const { dailyLimits } = require('../../utils/dailyLimits.js')
    
    // if (!dailyLimits.recordCardCreation()) {
    //   // 已达到限制，dailyLimits会显示相应提示
    //   throw new Error('Daily card limit reached')
    // }
    
    try {
      const wordCard = await common.request({
        url: '/wordcard',
        method: 'POST'
      })
      return wordCard
    } catch (err) {
      logger.error('Failed to add word card:', err)
      
      if (err.errcode == 410) {
        wx.showModal({
          title: '今日用量已达上限',
          content: '开通会员解锁更多卡片用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            wx.navigateTo({
              url: `/pages/vip/vip?event=${'vip_wordcard'}`
            })
          }
        })
      } else if (err.errcode == 412) {
        wx.showModal({
          title: '提示',
          content: '词书已背完',
          showCancel: false,
          confirmText: '好的'
        })
      }
      throw err
    }
  }

  /**
   * 删除/恢复单词卡片
   */
  async toggleWordCard(wordCardID, isDeleted) {
    try {
      await http.request({
        url: '/wordcard',
        method: 'PUT',
        data: {
          wordCardID: wordCardID,
          isDeleted: !isDeleted
        }
      })
      
      Toast.success(`${isDeleted ? '恢复成功' : '删除成功'}`)
      return !isDeleted
    } catch (error) {
      logger.error('Failed to toggle word card:', error)
      throw error
    }
  }

  /**
   * 获取单词信息列表
   */
  async getWordInfoList(wordList) {
    try {
      Toast.loading({ forbidClick: true })
      const wordInfolist = await common.request({
        url: `/wordinfos/search?wordlist=${wordList.join(',')}`
      })
      Toast.clear()
      return wordInfolist
    } catch (error) {
      Toast.clear()
      logger.error('Failed to get word info list:', error)
      throw error
    }
  }

  /**
   * 收藏/取消收藏单词
   */
  async toggleWordCollection(word, isCollected, wordGroupID = null) {
    try {
      const data = [{
        word: word,
        isCollected: isCollected,
        ...(wordGroupID && { wordGroupID })
      }]
      
      await common.request({
        method: 'PUT',
        url: `/wordinfos`,
        data: data
      })
      
      if (isCollected) {
        Toast(wordGroupID ? '添加成功' : '　　　收藏成功　　　\n长按可选择单词本分组')
      } else {
        Toast('已取消收藏')
      }
      
      return true
    } catch (error) {
      logger.error('Failed to toggle word collection:', error)
      throw error
    }
  }
}

module.exports = {
  IndexService
}
