const {
  Common
} = require('../../models/common.js')
const {
  HTTP
} = require('../../utils/http.js')
const {
  ShareCardHandler
} = require('../../models/handler.js')
const { logger } = require('../../utils/logger.js')
const { dailyLimits } = require('../../utils/dailyLimits.js')
const { IndexService } = require('./indexService.js')

const common = new Common()
const http = new HTTP()
const shareCardHandler = new ShareCardHandler()
const indexService = new IndexService()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    rateColor: "#ee0a24",
    showForgetDialog: false,
    tempWord: "abandon",
    showUpdateOverlay: true,
    currentSwiperIndex: 0,
    showTabBarShadow: true,
    todayCardList: [{
      _type: 'loading'
    }],
    wordCardIDCheckedList: [],
    isInit: false,
    addCardButtonText: '添加卡片',
    showVipButton: false,
    vipButtonText: '剩余0张',
    isLowRemaining: false,
    // 新手引导相关
    showNewUserGuide: false,
    newUserGuideStep: 0, // 0: 选择词书, 1: 开始练习
    isNewUser: false,
    // 布局相关 - 设置合理的初始值，避免undefined导致的布局问题
    scrollViewHeight: 600, // 默认高度，会在_setInitInfo中被正确计算的值覆盖
    naviBarHeight: 88, // 默认导航栏高度，会在_setInitInfo中被正确计算的值覆盖
  },
  onChangeRate(e) {
    let colorList = [
      "#bab4e6",
      "#a095ef",
      "#8778ee",
      "#6c58f4",
      "#4c34f0",
    ]
    logger.debug('Rate color changed:', colorList[e.detail])
    this.setData({
      rateColor: colorList[e.detail - 1]
    })
  },
  error(e) {
    logger.error('Index page error:', e)
  },
  showTempMeaning() {
    this.onSearchBarConfirm({
      detail: {
        value: "abandon"
      }
    })
    this.setData({
      showForgetDialog: false
    })
    // this.setData({
    //   tempWord: "抛弃；放弃"
    // })
  },
  onClickHideUpdateOverlay() {
    this.setData({
      showUpdateOverlay: false
    })
    this.getTabBar().setData({
      show: true
    })
  },
  fetchUnSavePracticeData() {
    if (wx.getStorageSync('hasUnfinishedTask')) {
      wx.showModal({
        title: '提示',
        content: '是否从上次进度开始练习？',
        showCancel: true,
        cancelText: '舍弃',
        confirmText: '进入',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '../practice/practice?resumeMode=true'
            })
            wx.setStorageSync('hasUnfinishedTask', false)
            this.setData({
              hasUnfinishedTask: false
            })
            return
          }
          // cancel 
          else {
            this.setData({
              hasUnfinishedTask: false
            })
            wx.setStorageSync('hasUnfinishedTask', false)
            wx.removeStorage({
              key: 'data',
            })
          }
        }
      })
    }

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 首先设置初始布局信息，确保页面有正确的初始尺寸
    this._setInitInfo()

    // !!! Test Only !!!
    // let token = await common.request({ url: `/tokenFromOpenid?openid=o4nOp5Kn8M67yz1Oc7m9BBe5Cn4A` })
    // console.log(token)
    
    // 获取当前用户的openid并在控制台输出
    try {
      let openID = await common.request({
        url: `/openid`
      })
      console.log('当前用户的openid:', openID)
    } catch (error) {
      console.error('获取openid失败:', error)
    }
    
    // // !!! 注销账户调试代码 !!!
    // try {
    //   console.log('开始执行账户注销...')
    //   const deleteResult = await common.request({
    //     url: `/account`,
    //     method: 'DELETE'
    //   })
    //   console.log('账户注销成功:', deleteResult)
    //   Toast.success('账户注销成功')
    // } catch (error) {
    //   console.error('账户注销失败:', error)
    //   Toast.fail('账户注销失败: ' + (error.message || error))
    // }

    // 获取首页数据
    try {
      const homeData = await common.request({
        url: `/homedata`
      })
      
      logger.info('Home data loaded:', homeData)
      Toast.clear()
      // set globalData: settings
      let settings = homeData.settings

      app.globalData.settings = settings
      
      // 在设置完 globalData.settings 后更新按钮文案
      this._updateAddCardButtonText(homeData.todayCardList)

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

      this.setData({
        isVipExpired: settings.isVipExpired,
        showGuideOfAddToMyMiniApp: settings.showGuideOfAddToMyMiniApp,
        senCard,
        wordBookMyInfo,
        wordBookCodeToName,
        reviewCard: reviewCard,
        isRefresherTriggered: false,
      })
      let todayCardList = this._updateWordCardList(pageInfo.data)
      console.log(todayCardList)
      
      // 首页加载时，如果没有卡片，先显示空数组，等自动添加完成后再处理
      this.setData({
        todayCardList: todayCardList.length == 0 ? [] : todayCardList,
      })

      wx.setStorageSync('todayCardList', todayCardList)
      
      // 检查是否需要自动添加卡片以满足每日计划（首页加载时）
      const finalCardList = await this._autoAddCardsForDailyTarget(todayCardList, settings.dailyTargetNum, 'onLoad')
      
      // 自动添加完成后，同步最终的卡片数量到 dailyLimits
      this._syncTodayCardCount(finalCardList)
      
      // 同步完成后，重新更新按钮状态
      this._updateAddCardButtonText()
      
      // 自动添加完成后，如果最终还是没有卡片，才显示空白卡片
      if (finalCardList.length === 0) {
        logger.info('[首页加载] 自动添加后仍无卡片，显示空白卡片')
        this.setData({
          todayCardList: [{
            _type: 'blank'
          }]
        })
      } else {
        // 如果自动添加了卡片，需要更新页面数据
        logger.info(`[首页加载] 自动添加完成，最终卡片数: ${finalCardList.length}`)
        // 注意：_autoAddCardsForDailyTarget 函数内部已经通过 setData 更新了 todayCardList
        // 这里不需要再次 setData，避免重复设置
      }
      
      // 检查是否需要显示新手引导
      this._checkAndShowNewUserGuide(settings, todayCardList)
      
    } catch (e) {
      logger.error('Failed to load home data:', e)
      Toast.fail('加载失败，请稍后重试')
      
      // 显示错误状态而不是递归调用，避免无限循环
      this.setData({
        todayCardList: [{ 
          _type: 'error',
          message: '网络连接失败，请下拉刷新重试'
        }]
      })
    }
  },

  /**
   * 监听点击取消事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onClickHideOverlay: function (e) {
    this.setData({
      showSearchBar: false,
      showOverlay: false,
      showDicCard: false,
      showShareCard: false,
      showDicCardSwiper: false,
      showStyleCard: false
    })
    this.getTabBar().setData({
      show: true
    })
  },

  onClickHideOverlayZIndex: function (e) {
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false,
      showPopup: false
    })
  },

  onCancelActionSheet: function () {
    this.setData({
      showPopupVant: false,
      showActionSheet: false
    })
    this.getTabBar().setData({
      show: true
    })
  },

  /**
   * 监听标题栏事件
   *
   * @event
   */
  onHeaderEvent: function (e) {

    // this.setData({
    //   showForgetDialog: true
    // })
    // return

    let isSelectAll = e.detail.isSelectAll
    let wordCardIDCheckedList = this.data.wordCardIDCheckedList

    if (e.detail.type == 'selectAll' && isSelectAll) {

      wordCardIDCheckedList = this.data.todayCardList.map(item => item.wordCardID)
      this.setData({
        showPracticeBtn: true,
        wordCardIDCheckedList
      })

    } else if (e.detail.type == 'selectAll' && !isSelectAll) {

      this.setData({
        showPracticeBtn: false,
        wordCardIDCheckedList: []
      })

    } else if (e.detail.type == 'learnRules') {

      wx.navigateTo({
        url: '../review-rules/review-rules'
      })

    }
  },

  /**
   * 监听点击开始练习事件
   *
   * @event
   */
  onReview: function (e) {
    if (e.detail && e.detail.showActionSheet) {
      // 显示一键复习选择弹窗
      this.setData({
        showPopupVant: true,
        actionSheetType: 'quickReview',
        showActionSheet: true,
        actionSheetDesc: '选择复习方式',
        actions: [{
          name: '一键复习',
          subname: '开始复习所有待复习卡片'
        }, {
          name: '进入复习页',
          subname: '按日期分组查看待复习卡片'
        }]
      })
      this.getTabBar().setData({
        show: false
      })
    } else {
      // 兼容旧的直接跳转逻辑
      wx.navigateTo({
        url: `/pages/review/review`
      })
    }
  },

  /**
   * 监听完成搜索事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarConfirm: async function (e) {
    console.log(e.detail.value)
    Toast.loading()
    this.setData({
      showSearchBar: false,
      showOverlay: false
    })
    this.getTabBar().setData({
      show: false
    })
    let wordInfo = await common.request({
      url: `/wordinfo/search?word=${e.detail.value}`
    }).catch(() => {
      // 单词未找到
      Toast.fail("未找到该单词")
      this.getTabBar().setData({
        show: true
      })
    })

    // 判断wordInfo
    if (wordInfo != undefined) {
      this._pronounce(wordInfo.word)
      Toast.clear()

      this.setData({
        wordInfo,
        showDicCard: true,
        showOverlay: true
      })
    }
  },

  /**
   * 监听完成修改自定义释义事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarConfirmSelfDef: async function (e) {

    if (this.data.showDicCardSwiper) {

      let word = this.data.dicCardList[this.data.currentSwiperIndex].word
      let data = [{
        word: word,
        selfDef: e.detail.value
      }]
      this.setData({
        [`dicCardList[${this.data.currentSwiperIndex}].selfDef`]: e.detail.value
      })
      this.setData({
        showSearchBarSelfDef: false,
        showOverlayZIndex: false
      })

      await common.request({
        url: `/wordinfos`,
        data: data,
        method: 'PUT'
      })
      Toast.success('修改成功')

    } else {

      let word = this.data.wordInfo.word
      let data = [{
        word: word,
        selfDef: e.detail.value
      }]
      this.setData({
        [`wordInfo.selfDef`]: e.detail.value
      })
      this.setData({
        showSearchBarSelfDef: false,
        showOverlayZIndex: false
      })

      await common.request({
        url: `/wordinfos`,
        data: data,
        method: 'PUT'
      })
      Toast.success('修改成功')

    }
  },

  /**
   * 检查并显示新手引导
   */
  _checkAndShowNewUserGuide: function(settings, todayCardList) {
    // 检查是否已经显示过新手引导
    const hasShownGuide = wx.getStorageSync('hasShownNewUserGuide')
    if (hasShownGuide) {
      return
    }
    
    // 判断是否为新用户（使用示例词书或词书名包含"示例"）
    const currentWordBook = settings.currentWordBook
    const isUsingExampleWordbook = 
      currentWordBook.wordBookName.includes('示例') || 
      currentWordBook.wordBookName.includes('Example') ||
      currentWordBook.wordBookCode === 'example' ||
      currentWordBook.wordBookCode === '0000' // 根据实际情况调整
    
    if (isUsingExampleWordbook) {
      console.log('检测到新用户使用示例词书，显示选择词书引导')
      this.setData({
        isNewUser: true,
        newUserGuideStep: 0
      })
      
      // 延迟显示，确保页面加载完成
      setTimeout(() => {
        this._showNewUserWordbookGuide()
      }, 1000)
    }
  },

  /**
   * 显示新用户词书选择引导
   */
  _showNewUserWordbookGuide: function() {
    // 新用户直接显示分类词书选择，跳过词书类型选择
    this.setData({
      showNewUserGuide: true
    })
    
    // 直接调用分类选择函数
    this._showCategorySelection()
    
    // 修改ActionSheet的描述文案为新用户引导
    setTimeout(() => {
      this.setData({
        actionSheetDesc: '👋 欢迎使用AceWord！\n请选择适合你的学习阶段'
      })
    }, 100)
  },

  /**
   * 显示新用户练习引导
   */
  _showNewUserPracticeGuide: function() {
    // 检查是否有可练习的卡片
    const todayCardList = this.data.todayCardList
    const practiceableCards = todayCardList.filter(card => 
      card._type !== 'loading' && 
      card._type !== 'blank' && 
      card._type !== 'error'
    )

    if (practiceableCards.length > 0) {
      // 自动选中第一张卡片
      const firstCard = practiceableCards[0]
      this.setData({
        wordCardIDCheckedList: [firstCard.wordCardID],
        newUserGuideStep: 1
      })

      // 显示练习引导提示
      wx.showModal({
        title: '🎉 词书选择成功！',
        content: '我已经为你选中了第一张单词卡片，点击"开始练习"按钮开始你的第一次学习吧！',
        showCancel: false,
        confirmText: '开始练习',
        success: (res) => {
          if (res.confirm) {
            this.onPractice()
          }
        }
      })
    } else {
      // 没有可练习的卡片，引导用户添加卡片
      wx.showModal({
        title: '词书选择成功！',
        content: '请点击"添加卡片"按钮来添加今日要学习的单词',
        showCancel: false,
        confirmText: '知道了'
      })
    }

    // 标记新手引导已完成
    wx.setStorageSync('hasShownNewUserGuide', true)
    this.setData({
      showNewUserGuide: false,
      isNewUser: false
    })
  },

  /**
   * 检查是否需要刷新首页数据（词书切换后）
   */
  _checkAndRefreshHomeData: function() {
    const needRefresh = wx.getStorageSync('needRefreshHomeData')
    if (needRefresh) {
      logger.info('检测到词书切换标记，开始刷新首页数据并自动添加卡片')
      // 清除标记
      wx.removeStorageSync('needRefreshHomeData')
      
      // 显示加载提示
      Toast.loading({
        message: '更新数据中...',
        forbidClick: true
      })
      
      // 重新加载首页数据
      this._refreshHomeDataAfterWordbookSwitch()
    } else {
      logger.info('未检测到词书切换标记，不执行自动添加卡片')
    }
  },

  /**
   * 刷新首页数据（词书切换后）
   */
  _refreshHomeDataAfterWordbookSwitch: async function() {
    logger.info('开始执行词书切换后的数据刷新和自动添加卡片逻辑')
    try {
      const homeData = await common.request({
        url: `/homedata`
      })
      
      logger.info('词书切换后首页数据已刷新:', homeData)
      Toast.clear()
      
      // 更新全局设置
      let settings = homeData.settings
      app.globalData.settings = settings
      
      // 更新按钮文案
      this._updateAddCardButtonText(homeData.todayCardList)

      // 更新页面数据
      let senCard = homeData.sentence
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

      this.setData({
        isVipExpired: settings.isVipExpired,
        showGuideOfAddToMyMiniApp: settings.showGuideOfAddToMyMiniApp,
        senCard,
        wordBookMyInfo,
        wordBookCodeToName,
        reviewCard: reviewCard,
        isRefresherTriggered: false,
      })
      
      let todayCardList = this._updateWordCardList(pageInfo.data)
      
      // 词书切换后，如果没有卡片，先不显示空白卡片，等自动添加完成后再处理
      if (todayCardList.length === 0) {
        logger.info('[词书切换] 当前无卡片，准备自动添加')
        this.setData({
          todayCardList: [] // 先设置为空数组，不显示blank卡片
        })
      } else {
        this.setData({
          todayCardList: todayCardList
        })
      }

      wx.setStorageSync('todayCardList', todayCardList)
      
      // 检查是否需要自动添加卡片以满足每日计划（词书切换后）
      const finalCardList = await this._autoAddCardsForDailyTarget(todayCardList, settings.dailyTargetNum, 'wordBookSwitch')
      
      // 自动添加完成后，如果最终还是没有卡片，才显示空白卡片
      if (finalCardList.length === 0) {
        logger.info('[词书切换] 自动添加后仍无卡片，显示空白卡片')
        this.setData({
          todayCardList: [{
            _type: 'blank'
          }]
        })
      }
      
      // 词书切换后自动全选卡片（使用最终的卡片列表）
      this._autoSelectAllCardsAfterSwitch(finalCardList)
      
      // 显示成功提示
      Toast.success('数据已更新')
      
    } catch (e) {
      logger.error('Failed to refresh home data:', e)
      Toast.fail('更新失败，请稍后重试')
    }
  },

  /**
   * 根据每日计划自动添加卡片
   * @param {Array} todayCardList 当前卡片列表
   * @param {Number} dailyTargetNum 每日目标单词数
   * @param {String} source 触发来源：'onLoad' | 'wordBookSwitch'
   */
  _autoAddCardsForDailyTarget: async function(todayCardList, dailyTargetNum, source = 'onLoad') {
    try {
      // 检查是否启用自动添加卡片功能（可以后续添加到设置中）
      // const autoAddEnabled = app.globalData.settings.autoAddCards !== false // 默认启用
      // if (!autoAddEnabled) {
      //   logger.info('自动添加卡片功能已禁用')
      //   return
      // }
      // 过滤掉非正常卡片（loading、blank、error等）
      const validCards = todayCardList.filter(card => 
        card._type !== 'loading' && 
        card._type !== 'blank' && 
        card._type !== 'error' &&
        card.wordList && 
        card.wordList.length > 0
      )
      
      // 计算当前已有的卡片数量
      const currentCardCount = validCards.length
      
      // 计算每日目标卡片数（每张卡片5个单词）
      const dailyTargetCardNum = Math.ceil(dailyTargetNum / 5)
      
      const sourceText = source === 'onLoad' ? '首页加载' : '词书切换'
      logger.info(`[${sourceText}] 当前卡片数: ${currentCardCount}, 每日目标卡片数: ${dailyTargetCardNum}`)
      
      // 如果当前卡片数已经达到或超过每日目标卡片数，则不需要添加
      if (currentCardCount >= dailyTargetCardNum) {
        logger.info(`[${sourceText}] 当前卡片数已满足每日目标，无需自动添加卡片`)
        return todayCardList
      }
      
      // 计算需要添加的卡片数
      let cardsNeeded = dailyTargetCardNum - currentCardCount
      
      // 限制一次最多添加的卡片数量，避免一次性添加过多
      const MAX_AUTO_ADD_CARDS = 10
      if (cardsNeeded > MAX_AUTO_ADD_CARDS) {
        logger.warn(`需要添加${cardsNeeded}张卡片，但限制为最多${MAX_AUTO_ADD_CARDS}张`)
        cardsNeeded = MAX_AUTO_ADD_CARDS
      }
      
      logger.info(`[${sourceText}] 需要添加 ${cardsNeeded} 张卡片来满足每日目标`)
      
      // 检查每日限制（如果有的话）
      const check = dailyLimits.canCreateCard()
      if (!check.allowed) {
        logger.warn(`[${sourceText}] 达到每日卡片创建限制，无法自动添加卡片`)
        return todayCardList
      }
      
      // 显示添加提示
      Toast.loading({
        message: `添加${cardsNeeded}张卡片`,
        forbidClick: true
      })
      
      // 先添加loading卡片到页面显示
      const currentCardList = [...this.data.todayCardList]
      for (let i = 0; i < cardsNeeded; i++) {
        currentCardList.push({
          _type: 'loading'
        })
      }
      this.setData({
        todayCardList: currentCardList
      })
      
      // 批量添加卡片
      const addedCards = []
      for (let i = 0; i < cardsNeeded; i++) {
        try {
          const wordCard = await common.request({
            url: '/wordcard',
            method: 'POST'
          })
          addedCards.push(wordCard)
          
          // 立即替换对应的loading卡片
          const updatedWordCard = this._updateWordCardList([wordCard])[0]
          const currentList = [...this.data.todayCardList]
          // 找到第一个loading卡片的位置并替换
          const loadingIndex = currentList.findIndex(card => card._type === 'loading')
          if (loadingIndex !== -1) {
            currentList[loadingIndex] = updatedWordCard
            this.setData({
              todayCardList: currentList
            })
          }
          
          logger.info(`[${sourceText}] 成功添加第${i + 1}张卡片`)
        } catch (error) {
          logger.error(`[${sourceText}] 添加第${i + 1}张卡片失败:`, error)
          
          // 移除对应的loading卡片
          const currentList = [...this.data.todayCardList]
          const loadingIndex = currentList.findIndex(card => card._type === 'loading')
          if (loadingIndex !== -1) {
            currentList.splice(loadingIndex, 1)
            this.setData({
              todayCardList: currentList
            })
          }
          
          // 如果是词书已背完的错误，停止继续添加
          if (error.errcode === 412) {
            logger.info(`[${sourceText}] 词书已背完，停止自动添加卡片`)
            break
          }
          
          // 如果是达到限制的错误，停止继续添加
          if (error.errcode === 410) {
            logger.info(`[${sourceText}] 达到每日限制，停止自动添加卡片`)
            break
          }
          
          // 其他错误也停止添加，避免无限重试
          break
        }
      }
      
      Toast.clear()
      
      // 清理剩余的loading卡片（如果有的话）
      let finalCardList = [...this.data.todayCardList]
      finalCardList = finalCardList.filter(card => card._type !== 'loading')
      this.setData({
        todayCardList: finalCardList
      })
      
      if (addedCards.length > 0) {
        // 更新进度信息
        const newProgressNum = this.data.wordBookMyInfo.userProgressNum + (addedCards.length * 5)
        this.setData({
          [`wordBookMyInfo.userProgressNum`]: newProgressNum
        })
        
        // 更新本地存储
        wx.setStorageSync('todayCardList', finalCardList)
        
        // 刷新按钮文案
        this._refreshAddCardButtonText()
        
        const addedWordsCount = addedCards.length * 5
        const successMessage = source === 'onLoad' 
          ? `已为您添加${addedCards.length}张卡片(${addedWordsCount}个单词)` 
          : `已自动添加${addedCards.length}张卡片(${addedWordsCount}个单词)`
        // Toast.success(successMessage)
        logger.info(`[${sourceText}] 自动添加卡片完成，共添加${addedCards.length}张卡片，${addedWordsCount}个单词`)
        
        // 返回更新后的卡片列表，供后续全选使用
        return finalCardList
      } else {
        logger.warn(`[${sourceText}] 未能添加任何卡片`)
        return finalCardList
      }
      
    } catch (error) {
      logger.error(`[${sourceText}] 自动添加卡片过程中发生错误:`, error)
      Toast.clear()
      
      // 清理所有loading卡片
      let cleanCardList = [...this.data.todayCardList]
      cleanCardList = cleanCardList.filter(card => card._type !== 'loading')
      this.setData({
        todayCardList: cleanCardList
      })
      
      // 不显示错误提示，避免影响用户体验
      return cleanCardList
    }
  },

  /**
   * 词书切换后自动全选卡片
   * @param {Array} cardList 要选择的卡片列表，如果不传则使用当前页面的卡片列表
   */
  _autoSelectAllCardsAfterSwitch: function(cardList) {
    try {
      const todayCardList = cardList || this.data.todayCardList
      
      // 过滤出有效的卡片（排除loading、blank、error等类型）
      const validCards = todayCardList.filter(card => 
        card._type !== 'loading' && 
        card._type !== 'blank' && 
        card._type !== 'error' &&
        card.wordCardID && 
        card.wordList && 
        card.wordList.length > 0
      )
      
      if (validCards.length === 0) {
        logger.info('[词书切换] 没有有效卡片可选择')
        return
      }
      
      // 获取所有有效卡片的ID
      const wordCardIDCheckedList = validCards.map(card => card.wordCardID)
      
      logger.info(`[词书切换] 自动选中${validCards.length}张卡片`)
      
      // 更新选中状态
      this.setData({
        wordCardIDCheckedList: wordCardIDCheckedList,
        showPracticeBtn: wordCardIDCheckedList.length > 0
      })
      
      // 显示提示
      Toast({
        message: `已为您选中${validCards.length}张卡片，可直接开始练习`,
        duration: 2000
      })
      
    } catch (error) {
      logger.error('[词书切换] 自动全选卡片失败:', error)
      // 不显示错误提示，避免影响用户体验
    }
  },

  /**
   * 检查新用户练习引导（在onShow中调用）
   */
  _checkNewUserPracticeGuide: function() {
    // 检查是否是从词书选择页面返回的新用户
    const fromNewUserGuide = wx.getStorageSync('fromNewUserGuide')
    const hasShownGuide = wx.getStorageSync('hasShownNewUserGuide')
    
    if (fromNewUserGuide && !hasShownGuide) {
      // 清除标记
      wx.removeStorageSync('fromNewUserGuide')
      
      // 延迟显示练习引导，确保页面数据已更新
      setTimeout(() => {
        this._showNewUserPracticeGuide()
      }, 1500)
    }
  },

  /**
   * 词书相关事件
   *
   * @event
   */
  onChangeDic: function () {
    // 先弹出词书类型选择
    this._showWordbookTypeSelection()
  },

  /**
   * 显示词书类型选择
   */
  _showWordbookTypeSelection: function() {
    const actions = [
      { 
        name: '我的词书', 
        subname: '正在学习和已学完的词书',
        type: 'my'
      },
      { 
        name: '分类词书', 
        subname: '按学习阶段和考试类型分类',
        type: 'category'
      },
      { 
        name: '自定义词书', 
        subname: '创建和管理自己的专属词书',
        type: 'custom'
      }
      // { 
      //   name: '真题词书', 
      //   subname: '【会员专享】考研英语真题词汇，带真题例句',
      //   type: 'exam'
      // }
    ]

    this.setData({
      showPopupVant: true,
      actionSheetType: 'wordbookType',
      showActionSheet: true,
      actionSheetDesc: '选择词书类型',
      actions: actions
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 显示分类选择
   */
  _showCategorySelection: function() {
    // 使用新的后端分类代码
    const categories = [
      { name: '基础教育阶段', code: '21', description: '小学至高中英语教材词汇，夯实基础' },
      { name: '大学英语考试', code: '22', description: '四六级、专四专八，大学必备' },
      { name: '研究生考试', code: '23', description: '考研考博词汇，学术深造必选' },
      { name: '出国留学考试', code: '24', description: '托福雅思GRE，留学申请利器' },
      { name: '成人继续教育', code: '25', description: '专升本自考PETS，提升学历必备' }
    ]

    const actions = categories.map(cat => ({
      name: cat.name,
      subname: cat.description,
      categoryCode: cat.code,
      description: cat.description
    }))

    this.setData({
      showPopupVant: true,
      actionSheetType: 'categorySelection',
      showActionSheet: true,
      actionSheetDesc: '选择词书分类',
      actions: actions
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 练习相关事件
   *
   * @event
   */
  onPractice: async function () {
    this.setData({
      showPopupVant: true,
      actionSheetType: 'practice',
      showActionSheet: true,
      actionSheetDesc: '选择练习模式',
      actions: [{
        name: '记忆模式',
        subname: '循环迭代记忆法，激发你的记忆潜力'
      }, {
        name: '复习模式',
        subname: '单词一遍过，快速检测掌握情况'
      }, {
        name: '拼写模式',
        subname: '默认开启拼写栏，深度巩固已学单词'
      }]
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 监听单词卡片事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onWordCardEvent: async function (e) {
    let currentWordCard = e.detail.currentWordCard
    let currentSwiperIndex = e.detail.currentSwiperIndex

    let wordCardList = this.data.todayCardList
    let currentWordCardIndex = e.currentTarget.dataset.index
    let wordList = wordCardList.find(item => item.wordCardID == currentWordCard.wordCardID).wordList
    this.setData({
      currentWordCard,
      currentSwiperIndex,
      currentWordCardIndex
    })

    if (e.detail.type == 'showDic') {

      Toast.loading({
        forbidClick: true
      })
      let wordInfolist = await common.request({
        url: `/wordinfos/search?wordlist=${wordList.join(',')}`
      })
      Toast.clear()
      this._pronounce(wordList[currentSwiperIndex])
      this._getDicCardList(wordInfolist, wordList, currentSwiperIndex)

    } else if (e.detail.type == 'delete') {

      let isDeleted = wordCardList[currentWordCardIndex].isDeleted
      wx.showModal({
        title: '提示',
        content: `${isDeleted ? '是否恢复该卡片？' : '是否删除该卡片？（后续将不再出现在复习计划）'}`,
        showCancel: true,
        confirmText: '确认',
      }).then(res => {
        if (res.confirm) {
          this.getTabBar().setData({
            show: true
          })
          http.request({
            url: '/wordcard',
            method: 'PUT',
            data: {
              wordCardID: currentWordCard.wordCardID,
              isDeleted: !isDeleted
            }
          }).then(res => {
            // console.log(res)

            Toast.success(`${isDeleted ? '恢复成功' : '删除成功'}`)
            this.setData({
              [`todayCardList[${currentWordCardIndex}]._relatedAction`]: 'deleteWordCard',
              [`todayCardList[${currentWordCardIndex}].isDeleted`]: !isDeleted
            })
          })
        } else if (res.cancel) this.getTabBar().setData({
          show: true
        })
      })

    } else if (e.detail.type == 'check') {

      let wordCardIDCheckedList = this.data.wordCardIDCheckedList
      if (currentWordCard.isChecked) {
        wordCardIDCheckedList.push(currentWordCard.wordCardID)
      } else wordCardIDCheckedList.splice(wordCardIDCheckedList.indexOf(currentWordCard.wordCardID), 1)
      this.setData({
        wordCardIDCheckedList,
        showPracticeBtn: wordCardIDCheckedList.length == 0 ? false : true
      })

    }

  },

  /**
   * 监听swiper变化
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSwiperChange: async function (e) {

    let previousSwiperIndex = this.data.currentSwiperIndex
    let currentSwiperIndex = e.detail.current

    let dicCardList = this.data.dicCardList
    dicCardList[currentSwiperIndex].isActive = true
    dicCardList[previousSwiperIndex].isActive = false

    this._pronounce(dicCardList[currentSwiperIndex].word)
    this.setData({
      dicCardList,
      currentSwiperIndex
    })

  },

  /**
   * 监听单词卡片事件
   *
   * @event
   */
  onDicCardEvent: async function (e) {

    let currentSwiperIndex = e.currentTarget.dataset.index
    let currentWordCardIndex = this.data.currentWordCardIndex

    if (e.detail.type == 'selfDef') {

      this.setData({
        showSearchBarSelfDef: true,
        showOverlay: true,
        showOverlayZIndex: true
      })

    } else if (e.detail.type == 'collect') {

      if (this.data.showDicCardSwiper) {
        this.setData({
          [`dicCardList[${currentSwiperIndex}].isCollected`]: e.detail.isCollected
        })
      } else this.setData({
        [`wordInfo.isCollected`]: e.detail.isCollected
      })
      await common.request({
        method: 'PUT',
        url: `/wordinfos`,
        data: [{
          word: e.detail.word,
          isCollected: e.detail.isCollected
        }]
      })
      e.detail.isCollected ? Toast('　　　收藏成功　　　\n长按可选择单词本分组') : Toast('已取消收藏')

    } else if (e.detail.type == 'wordGroup') {

      if (e.detail.isCollected) {
        Toast('请先取消收藏')
      } else {
        Toast.loading()
        let wordGroupList = await common.request({
          url: '/wordgroup'
        })
        Toast.clear()

        let defaultWordGroup = wordGroupList.splice(wordGroupList.findIndex(item => item.id == 0), 1)[0]
        wordGroupList.unshift(defaultWordGroup)
        wordGroupList = wordGroupList.map(item => {
          item.isChecked = false;
          return item
        })
        this.setData({
          wordGroupList,
          showOverlayZIndex: true,
          showPopup: true
        })
      }

    } else if (e.detail.type == 'pronounce') {

      this._pronounce(e.detail.word)

    } else if (e.detail.type == 'replace') {
      Toast.loading({
        forbidClick: true
      })
      
      try {
        // 使用新的v2接口
        const response = await common.request({
          url: `/wordcard/word/v2`,
          method: 'PUT',
          data: {
            word: e.detail.word,
            wordBookCode: this.data.currentWordCard.wordBookCode,
            wordCardID: this.data.currentWordCard.wordCardID
          }
        })
        
        // 检查服务端返回的换词次数（已使用次数）
        if (response.replaceCountDaily !== undefined) {
          // 更新本地的换词次数记录（replaceCountDaily是已使用次数）
          dailyLimits.updateServerReplaceCount(response.replaceCountDaily)
          
          // 检查是否已达上限（15次），但VIP用户无限制
          const check = dailyLimits.canReplaceWord()
          if (!check.allowed) {
            Toast.clear()
            dailyLimits.showLimitReached('replaces')
            return
          }
        }
        
        const word = response.newWord
        if (!word) {
          throw new Error('服务端未返回新单词')
        }
        
        let wordInfo = await common.request({
          url: `/wordinfo/search?word=${word}`
        })
        Toast.clear()

        this._pronounce(word)
        wordInfo.isActive = true
        this.setData({
          [`dicCardList[${currentSwiperIndex}]`]: wordInfo,
          [`todayCardList[${currentWordCardIndex}].wordInfoList[${currentSwiperIndex}]`]: {
            wordName: word,
            opacity: 100
          },
          [`todayCardList[${currentWordCardIndex}].wordList[${currentSwiperIndex}]`]: word,
          [`todayCardList[${currentWordCardIndex}]._relatedAction`]: 'replaceWord',
        })
        
        // 更新换词按钮文案
        this._updateReplaceButtonText()
      } catch (error) {
        Toast.clear()
        console.error('换词失败:', error)
        wx.showToast({
          title: '换词失败，请重试',
          icon: 'none'
        })
      }

    } else if (e.detail.type == 'showStyleCard') {

      this.setData({
        showDicCardSwiper: false
      })
      let wordInfo = await common.request({
        url: `/wordinfo/search?word=${e.detail.word}`
      })
      this.setData({
        showStyleCard: true,
        showOverlay: true,
        wordInfo
      })

    } else if (e.detail.type == 'showVip') {

      // 引导用户升级会员
      wx.navigateTo({
        url: '/pages/vip/vip'
      })

    }
  },

  /**
   * 监听样式卡片事件
   *
   * @event
   */
  onStyleCardEvent: async function (e) {

    if (e.detail.type == 'close') {

      this.setData({
        showStyleCard: false,
        showDicCardSwiper: true
      })

    } else if (e.detail.type == 'opacity') {

      this.setData({
        [`todayCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].opacity`]: e.detail.opacity,
        [`todayCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.todayCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.todayCardList[this.data.currentWordCardIndex].wordInfoList
        }
      })

    } else if (e.detail.type == 'bgColor') {

      this.setData({
        [`todayCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].bgColor`]: e.detail.bgColor,
        [`todayCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.todayCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.todayCardList[this.data.currentWordCardIndex].wordInfoList
        }
      })

    }
  },

  /**
   * 监听样式卡片事件
   *
   * @event
   */
  onSenCardEvent: async function (e) {

    if (e.detail.type == 'search') {

      try {

        this._pronounce(e.detail.word)
        let wordInfo = await common.request({
          url: `/wordinfo/search?word=${e.detail.word}`
        })
        this.getTabBar().setData({
          show: false
        })
        this.setData({
          showOverlay: true,
          showDicCard: true,
          wordInfo
        })

      } catch (err) {

        if (err.errcode == 404) {

          Toast('单词未找到')

        }

      }

    }

  },

  /**
   * 监听添加词汇到单词本事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onCollectToWordGroup: async function (e) {

    if (this.data.showDicCardSwiper) {

      let wordList = this.data.todayCardList[this.data.currentWordCardIndex].wordList
      let word = wordList[this.data.currentSwiperIndex]
      this.setData({
        [`dicCardList[${this.data.currentSwiperIndex}].isCollected`]: true
      })
      let data = [{
        word: word,
        wordGroupID: this.data.wordGroupList[e.detail.index].id,
        isCollected: e.detail.isCollected
      }]
      await common.request({
        url: `/wordinfos`,
        data: data,
        method: 'PUT'
      })

    } else {

      let data = [{
        word: this.data.wordInfo.word,
        wordGroupID: this.data.wordGroupList[e.detail.index].id,
        isCollected: e.detail.isCollected
      }]
      this.setData({
        [`wordInfo.isCollected`]: true
      })
      await common.request({
        url: `/wordinfos`,
        data: data,
        method: 'PUT'
      })

    }

    Toast.success('添加成功')
    this.setData({
      showOverlayZIndex: false,
      showPopup: false
    })
  },

  /**
   * 创建单词本相关事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onAddWordGroup: function (e) {
    this.setData({
      showFieldDialog: true
    })
  },

  onFieldDialogCancel: async function (e) {
    this.setData({
      fieldValue: ''
    })
  },

  onFieldChange(e) {
    this.setData({
      wordGroupName: e.detail
    })
  },

  onFieldDialogConfirm: async function (e) {

    try {

      let wordGroup = await common.request({
        url: '/wordgroup',
        method: 'POST',
        data: {
          wordGroupName: this.data.wordGroupName
        }
      })
      Toast.success('创建成功')
      this.data.wordGroupList.unshift(wordGroup)
      this.setData({
        fieldValue: '',
        wordGroupList: this.data.wordGroupList
      })

    } catch (err) {

      // console.log(err)
      if (err.errcode == 410) {
        wx.showModal({
          title: '用量已达上限',
          content: '开通会员解锁更多单词本用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            // 检查设备类型
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
                url: `/pages/vip/vip?event=${'vip_wordgroup'}`
              })
            }
          }
        })
      }

    }
  },

  /**
   * 监听点击新增单词卡片事件
   *
   * @event
   */
  onAddWordCard: async function () {

    try {

      let todayCardList = this.data.todayCardList

      // 如果只有空白卡片，则添加一张loading卡片，然后回调本函数
      if (todayCardList[0]._type == 'blank') {
        this.setData({
          todayCardList: [{
            _type: 'loading'
          }]
        })
        this.onAddWordCard()
        return
      }

      // 如果最新的卡片是loading卡片，则向服务端请求新添一张
      if (todayCardList[todayCardList.length - 1]._type == 'loading') {
        let wordCard = await indexService.addWordCard()
        todayCardList.pop()
        todayCardList.push(wordCard)
        this.setData({
          todayCardList: this._updateWordCardList(todayCardList)
        })
        this.setData({
          [`wordBookMyInfo.userProgressNum`]: this.data.wordBookMyInfo.userProgressNum + 5
        })
        this.setData({
          toView: 'scrollBottom'
        })
        
        // 重新获取数据来更新按钮文案
        this._refreshAddCardButtonText()
        
        // 同时立即更新按钮状态（基于本地数据）
        this._updateAddCardButtonText()
        return
      }

      // 正常情况：添加一张loading卡片，然后回调本函数，实际新增的逻辑放在loading中
      // 额度预检查
      const check = dailyLimits.canCreateCard()
      if (!check.allowed) {
        dailyLimits.showLimitReached('cards')
        return
      }
      todayCardList.forEach((item, index) => todayCardList[index]._relatedAction = 'addWordCard')
      todayCardList.push({
        _type: 'loading'
      })
      this.setData({
        todayCardList
      })
      this.onAddWordCard()

    } catch (err) {

      // console.log(err)
      this.data.todayCardList.pop()
      this.setData({
        todayCardList: this.data.todayCardList
      })
      if (err.errcode == 410) {

        wx.showModal({
          title: '今日用量已达上限',
          content: '开通会员解锁更多卡片用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            // 检查设备类型
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
                url: `/pages/vip/vip?event=${'vip_wordcard'}`
              })
            }
          }
        })

      } else if (err.errcode == 412) {

        // 超出了词书长度，直接抛出
        wx.showModal({
          title: '提示',
          content: '词书已背完',
          showCancel: false,
          confirmText: '好的'
        })
        return
      }
    }
  },

  /**
   * 监听选择弹出框事件
   *
   * @event
   */
  onSelectActionSheet: function (e) {
    let actionSheetType = this.data.actionSheetType
    if (actionSheetType == 'changeDic') {

      this._onSelectActionSheetChangeDic(e)

    } else if (actionSheetType == 'practice') {

      this._onSelectActionSheetPractice(e)

    } else if (actionSheetType == 'categorySelection') {

      this._onSelectActionSheetCategorySelection(e)

    } else if (actionSheetType == 'wordbookType') {

      this._onSelectActionSheetWordbookType(e)
      
    } else if (actionSheetType == 'examWordbook') {

      this._onSelectActionSheetExamWordbook(e)

    } else if (actionSheetType == 'quickReview') {

      this._onSelectActionSheetQuickReview(e)

    }
  },

  _onSelectActionSheetPractice: async function (e) {

    Toast.loading({
      forbidClick: true,
      duration: 0,
      message: '资源加载中',
    })
    // 20个单词，4秒

    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    // let wordList = this._getWordListFromWordCardIDCheckedList(this.data.wordCardIDCheckedList)
    app.globalData.practiceInfo = {}
    app.globalData.practiceInfo.wordInfoList = await common.request({
      url: `/wordinfos/search?word-card-id-list=${this.data.wordCardIDCheckedList.join(',')}`
    })
    app.globalData.practiceInfo.wordCardIDCheckedList = this.data.wordCardIDCheckedList
    Toast.clear()
    app.globalData.practiceInfo.practiceMode = e.detail.name == '记忆模式' ? 'memorize' : e.detail.name == '复习模式' ? 'review' : 'spell'
    wx.navigateTo({
      url: '../practice/practice?entryPage=index'
    })

  },

  _onSelectActionSheetChangeDic: function (e) {
    if (e.detail.name == '词书广场') {
      setTimeout(() => {
        this.onCancelActionSheet()
      }, 400)
      wx.navigateTo({
        url: `/pages/wordbook-category/wordbook-category`
      })
    } else if (e.detail.name == '自定义词书') {
      setTimeout(() => {
        this.onCancelActionSheet()
      }, 400)
      wx.navigateTo({
        url: `/pages/wordbook-custom-app/wordbook-custom-app`
      })
    }
  },

  _onSelectActionSheetCategorySelection: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    const selectedAction = this.data.actions.find(action => action.name === e.detail.name)
    
    // 检查是否是新用户引导状态
    const isNewUserGuide = this.data.showNewUserGuide
    
    if (selectedAction && selectedAction.categoryCode) {
      // 跳转到词书广场页面，传递分类信息
      const url = isNewUserGuide 
        ? `/pages/wordbook-all/wordbook-all?categoryCode=${selectedAction.categoryCode}&categoryName=${encodeURIComponent(selectedAction.name)}&fromNewUserGuide=true`
        : `/pages/wordbook-all/wordbook-all?categoryCode=${selectedAction.categoryCode}&categoryName=${encodeURIComponent(selectedAction.name)}`
      wx.navigateTo({ url })
    }
  },


  /**
   * 处理词书类型选择
   */
  _onSelectActionSheetWordbookType: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    const selectedAction = this.data.actions.find(action => action.name === e.detail.name)
    
    if (selectedAction) {
      if (selectedAction.type === 'my') {
        // 选择了我的词书，跳转到我的词书页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/wordbook-all/wordbook-all?categoryCode=99&categoryName=${encodeURIComponent('我的词书')}`
          })
        }, 500)
      } else if (selectedAction.type === 'category') {
        // 选择了分类词书，显示原来的分类选择
        setTimeout(() => {
          this._showCategorySelection()
        }, 500)
      } else if (selectedAction.type === 'custom') {
        // 选择了自定义词书，跳转到自定义词书页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/wordbook-custom-app/wordbook-custom-app`
          })
        }, 500)
      }
      // else if (selectedAction.type === 'exam') {
      //   // 选择了真题词书，显示真题词书选择
      //   setTimeout(() => {
      //     this._showExamWordbookSelection()
      //   }, 500)
      // }
    }
  },

  /**
   * 显示真题词书选择
   */
  _showExamWordbookSelection: function() {
    const examActions = [
      { 
        name: '考研英语一真题', 
        subname: '2010-2024年考研英语一真题词汇',
        examType: 'kaoyan1'
      },
      { 
        name: '考研英语二真题', 
        subname: '2010-2024年考研英语二真题词汇',
        examType: 'kaoyan2'
      }
    ]

    this.setData({
      showPopupVant: true,
      actionSheetType: 'examWordbook',
      showActionSheet: true,
      actionSheetDesc: '选择真题词书',
      actions: examActions
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 处理真题词书选择
   */
  _onSelectActionSheetExamWordbook: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    const selectedAction = this.data.actions.find(action => action.name === e.detail.name)
    
    if (selectedAction && selectedAction.examType) {
      // 跳转到真题词书页面
      wx.navigateTo({
        url: `/pages/exam-wordbook/exam-wordbook?examType=${selectedAction.examType}&examName=${encodeURIComponent(selectedAction.name)}`
      })
    }
  },

  /**
   * 处理一键复习选择
   */
  _onSelectActionSheetQuickReview: async function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    if (e.detail.name === '一键复习') {
      // 一键复习逻辑
      try {
        Toast.loading({
          forbidClick: true,
          message: '加载中'
        })

        // 调用新的一键复习API
        const reviewData = await common.request({
          url: `/list/need-review/all`,
          method: 'GET'
        })

        // 兼容多种可能的数据格式
        let wordList = null
        let cardIDList = null
        
        if (reviewData && reviewData.data && reviewData.data.wordList) {
          // 包装在data字段中的格式: {data: {wordList: [...], cardIDList: [...]}}
          wordList = reviewData.data.wordList
          cardIDList = reviewData.data.cardIDList
        } else if (reviewData && reviewData.wordList) {
          // 直接返回的格式: {wordList: [...], cardIDList: [...]}
          wordList = reviewData.wordList
          cardIDList = reviewData.cardIDList
        }

        if (wordList && wordList.length > 0) {
          // 设置全局练习数据
          app.globalData.practiceInfo = {
            wordInfoList: wordList,
            cardIDList: cardIDList || [],
            practiceMode: 'review',
            isQuickReview: true
          }

          Toast.clear()
          
          // 直接跳转到练习页面
          wx.navigateTo({
            url: '../practice/practice?entryPage=quickReview'
          })
        } else {
          Toast.clear()
          wx.showToast({
            title: '暂无待复习卡片',
            icon: 'none'
          })
        }
      } catch (error) {
        Toast.clear()
        console.error('一键复习失败:', error)
        wx.showToast({
          title: '获取复习数据失败',
          icon: 'none'
        })
      }
    } else if (e.detail.name === '进入复习页') {
      // 原有逻辑，跳转到复习页面
      wx.navigateTo({
        url: `/pages/review/review`
      })
    }
  },

  catchDoubleBtnEvent: function (e) {
    let eventName = e.detail.name
    if (eventName == 'startLearning') {
      this.onPractice()
    } else {
      this.fetchUnSavePracticeData()
    }
  },

  /**
   * 处理VIP按钮点击事件
   */
  onShowVip: function() {
    // 检查设备类型
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
        url: '/pages/vip/vip?event=vip_wordcard'
      })
    }
  },

  /**
   * 生命周期事件
   *
   * @event
   */
  onShow: function () {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
    
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
        show: true
      })
    }

    let hasUnfinishedTask = wx.getStorageSync('hasUnfinishedTask')
    this.setData({
      hasUnfinishedTask,
    })
    
    // 检查是否需要刷新首页数据（词书切换后）
    this._checkAndRefreshHomeData()
    
    // 检查是否需要显示新用户练习引导
    this._checkNewUserPracticeGuide()
  },

  onScroll: function (e) {
    e.detail.scrollTop > 50 ? this.setData({
      showNaviBarDivider: true
    }) : this.setData({
      showNaviBarDivider: false
    })
  },

  onScrollViewRefresh: function () {
    this._refreshHomeData()
  },

  /**
   * 下拉刷新数据（区别于初始加载）
   */
  _refreshHomeData: async function() {
    try {
      console.log('开始下拉刷新首页数据')
      
      // 显示刷新状态，但不显示Toast，避免干扰用户体验
      this.setData({
        isRefresherTriggered: true
      })
      
      // 获取最新的首页数据
      const homeData = await common.request({
        url: `/homedata`
      })
      
      logger.info('下拉刷新数据获取成功:', homeData)
      
      // 更新全局设置
      let settings = homeData.settings
      app.globalData.settings = settings
      
      // 更新按钮文案
      this._updateAddCardButtonText(homeData.todayCardList)

      // 更新页面数据
      let senCard = homeData.sentence
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

      this.setData({
        isVipExpired: settings.isVipExpired,
        showGuideOfAddToMyMiniApp: settings.showGuideOfAddToMyMiniApp,
        senCard,
        wordBookMyInfo,
        wordBookCodeToName,
        reviewCard: reviewCard,
      })
      
      let todayCardList = this._updateWordCardList(pageInfo.data)
      
      // 下拉刷新时的处理逻辑：
      // 1. 如果有卡片数据，直接显示
      // 2. 如果没有卡片数据，显示空白卡片，但不自动添加
      if (todayCardList.length > 0) {
        this.setData({
          todayCardList: todayCardList
        })
        console.log(`下拉刷新完成，显示${todayCardList.length}张卡片`)
      } else {
        // 下拉刷新时如果没有卡片，显示提示用户添加卡片的状态
        this.setData({
          todayCardList: [{
            _type: 'refresh-empty',
            message: '当前没有学习卡片，点击下方"添加卡片"开始学习吧！'
          }]
        })
        console.log('下拉刷新完成，当前无卡片，显示添加提示状态')
      }

      wx.setStorageSync('todayCardList', todayCardList)
      
      // 同步卡片数量到 dailyLimits
      this._syncTodayCardCount(todayCardList)
      
      // 更新按钮状态
      this._updateAddCardButtonText()
      
    } catch (e) {
      logger.error('下拉刷新失败:', e)
      // 刷新失败时不显示Toast，避免干扰用户
      console.error('下拉刷新失败，保持当前状态')
    } finally {
      // 确保刷新状态被清除
      this.setData({
        isRefresherTriggered: false
      })
    }
  },

  /**
   * 导航栏准备就绪事件
   */
  onNaviBarReady: function(e) {
    const naviBarHeight = e.detail.naviBarHeight
    const systemInfo = wx.getSystemInfoSync()
    const newScrollViewHeight = systemInfo.windowHeight - naviBarHeight - 48 - (app.globalData.isIOS ? 30 : 0)
    
    console.log('导航栏组件准备就绪:', { 
      currentScrollViewHeight: this.data.scrollViewHeight, 
      newScrollViewHeight: newScrollViewHeight,
      naviBarHeight: naviBarHeight,
      windowHeight: systemInfo.windowHeight
    })
    
    // 只有当高度发生变化时才更新，避免不必要的重渲染
    if (this.data.scrollViewHeight !== newScrollViewHeight) {
      console.log('导航栏高度确定，更新scroll-view高度:', { 
        oldHeight: this.data.scrollViewHeight, 
        newHeight: newScrollViewHeight,
        naviBarHeight: naviBarHeight
      })
      this.setData({
        scrollViewHeight: newScrollViewHeight
      })
    } else {
      console.log('导航栏高度无变化，无需更新scroll-view高度')
    }
  },

  onShareAppMessage(options) {
    console.log('分享来源:', options.from) // button 或 menu
    return {
      title: '快来AceWord背单词吧！',
      path: '/pages/index/index',
      imageUrl: '' // 可以设置自定义分享图片
    }
  },

  onShareTimeline() {
    return {
      title: 'AceWord - 智能背单词助手',
      query: '', // 可以携带参数
      imageUrl: '' // 可以设置自定义分享图片，朋友圈要求1:1比例
    }
  },

  onAddToFavorites(res) {
    console.log('用户收藏页面')
    return {
      title: 'AceWord - 智能背单词助手',
      imageUrl: '/images/logos/logo.png', // 使用应用Logo作为收藏图标
      query: 'from=favorites'
    }
  },

  /**
   * 分享相关事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onShareCardEvent: async function (e) {

    Toast.loading()
    let type = e.currentTarget.dataset.type
    if (type == 'download') {
      let tempFilePath = await this.getCanvasTempFilePath()
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => Toast.success('保存成功')
      })
    } else if (type == 'wechat') {
      let tempFilePath = await this.getCanvasTempFilePath()
      wx.showShareImageMenu({
        path: tempFilePath,
        success: () => Toast.clear()
      })
    }

    await common.request({
      method: 'POST',
      url: `/sen/share`,
      data: {
        date: app.globalData.todayDate
      }
    })
  },

  showShareCard: async function () {
    Toast.loading()
    let bgImageSrc = await common.request({
      url: `/resources/sharecard/background?date=${app.globalData.todayDate}`
    })
    Toast.clear()
    this.setData({
      showOverlay: true,
      showShareCard: true
    })
    this.getTabBar().setData({
      show: false
    })

    shareCardHandler.showShareCard(this.data.canvasWidth, this.data.senCard, app.globalData.todayDate, bgImageSrc)
  },

  getCanvasTempFilePath: async function () {
    return await shareCardHandler.downloadCanvas()
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitInfo: function () {
    try {
      const capsuleInfo = wx.getMenuButtonBoundingClientRect()
      const systemInfo = wx.getSystemInfoSync()
      const naviBarHeight = capsuleInfo.bottom + 6
      const scrollViewHeight = systemInfo.windowHeight - naviBarHeight - 48 - (app.globalData.isIOS ? 30 : 0)
      
      console.log('_setInitInfo 计算布局参数:', {
        windowHeight: systemInfo.windowHeight,
        naviBarHeight: naviBarHeight,
        scrollViewHeight: scrollViewHeight,
        capsuleInfo: capsuleInfo
      })
      
      this.setData({
        naviBarHeight: naviBarHeight,
        // 立即计算并设置scrollView高度，避免内容重叠
        scrollViewHeight: scrollViewHeight,

        canvasWidth: systemInfo.windowWidth - 64,
        canvasHeight: parseInt(((systemInfo.windowWidth - 64) * 311) / 311) + 78,

        capsuleInfo: capsuleInfo,
        windowWidth: systemInfo.windowWidth,

        isIOS: app.globalData.isIOS,
      })
      
      console.log('_setInitInfo 完成，当前scrollViewHeight:', this.data.scrollViewHeight)
    } catch (error) {
      console.error('_setInitInfo 执行失败:', error)
      // 如果获取系统信息失败，使用默认值
      this.setData({
        naviBarHeight: 88,
        scrollViewHeight: 600,
        isIOS: app.globalData.isIOS || false,
      })
    }
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _getDicCardList: function (wordInfolist, wordList, currentSwiperIndex) {
    let dicCardList = []

    for (let i = 0; i < wordList.length; i++) dicCardList[i] = {}
    dicCardList = dicCardList.map((item, index) => {
      if (index == currentSwiperIndex) {

        wordInfolist[index].isActive = true
        wordInfolist[index].currentWordCard = this.data.currentWordCard
        currentSwiperIndex = index
        return wordInfolist[index]

      } else {

        wordInfolist[index].isActive = false
        return wordInfolist[index]

      }
    })

    this.setData({
      showOverlay: true,
      showDicCardSwiper: true,
      dicCardList,
      currentSwiperIndex
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 发音事件
   *
   * @inner
   */
  _pronounce: function (word) {
    console.log(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`)
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {
      console.log("error",res)
      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    })
  },

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
   */
  _getWordListFromWordCardIDCheckedList: function (wordCardIDCheckedList) {

    let todayCardList = this.data.todayCardList
    let wordList = Array()

    for (let i = 0; i < todayCardList.length; i++) {
      if (wordCardIDCheckedList.indexOf(todayCardList[i].wordCardID) != -1) {
        wordList = wordList.concat(todayCardList[i].wordList)
      }
    }

    return wordList
  },

  /**
   * 更新单词卡片列表方法
   *
   * @inner
   */
  _updateWordCardList: function (wordCardList) {

    return wordCardList.map(item => {
      item.wordBookName = this.data.wordBookMyInfo.currentWordBookName
      item.wordList = item.wordInfoList.map(item => item.wordName)

      return item
    })

  },

  /**
   * 提示事件
   *
   * @inner
   */
  _showGuideOfAutolyCreated: function () {

    if (app.globalData.settings.showGuideOfAutolyCreated) {
      wx.showModal({
        content: '点击被遮挡部分可显示中文',
        showCancel: true,
        cancelText: '不再提醒',
        confirmText: '我知道啦',
        success: res => {
          if (res.cancel) {
            app.globalData.settings.showGuideOfTapToCancelBlur = false
            common.request({
              url: `/settings`,
              method: 'PUT',
              data: {
                showGuideOfTapToCancelBlur: false
              }
            })
          }
        }
      })
    }
  },

  /**
   * 提示事件
   *
   * @inner
   */
  _showGuideOfAddToMyMiniApp: function () {

    this.setData({
      showGuideOfAddToMyMiniApp: false
    })
    common.request({
      url: `/settings`,
      method: 'PUT',
      data: {
        showGuideOfAddToMyMiniApp: false
      }
    })

  },

  /**
   * 更新添加卡片按钮文案和VIP按钮显示
   */
  _updateAddCardButtonText: function(todayCardListData) {
    try {
      const isVip = app && app.globalData && app.globalData.settings && !app.globalData.settings.isVipExpired
      if (isVip) {
        this.setData({ 
          addCardButtonText: '添加卡片',
          showVipButton: false,
          isLowRemaining: false
        })
        return
      }

      const check = dailyLimits.canCreateCard()
      const remaining = check.remaining
      const used = dailyLimits.getTodayUsage().cards
      
      console.log('VIP按钮逻辑检查:', { used, remaining, limit: check.limit })
      
      // 超过5张（即已用>5张）时显示VIP按钮
      if (used > 5) {
        this.setData({
          addCardButtonText: '添加卡片',
          showVipButton: true,
          vipButtonText: `今日余${remaining}张 · 升级无限制`,
          isLowRemaining: remaining <= 3 // 剩余≤3张时按钮变红
        })
      } else {
        this.setData({
          addCardButtonText: '添加卡片',
          showVipButton: false,
          isLowRemaining: false
        })
      }
    } catch (error) {
      console.error('Error updating add card button text:', error)
      this.setData({
        addCardButtonText: '添加卡片',
        showVipButton: false
      })
    }
  },

  /**
   * 刷新添加卡片按钮文案（重新获取服务端数据）
   */
  _refreshAddCardButtonText: async function() {
    try {
      const homeData = await common.request({ url: `/homedata` })
      this._updateAddCardButtonText(homeData.todayCardList)
    } catch (error) {
      console.error('Failed to refresh add card button text:', error)
    }
  },

  /**
   * 更新换词按钮文案
   */
  _updateReplaceButtonText: function() {
    // 通过全局事件通知所有dic-card组件更新按钮文案
    wx.eventBus = wx.eventBus || {}
    wx.eventBus.updateReplaceButtonText = true
    
    // 延迟执行，确保组件能接收到事件
    setTimeout(() => {
      wx.eventBus.updateReplaceButtonText = false
    }, 100)
  },

  /**
   * 同步今日卡片数量到 dailyLimits
   */
  _syncTodayCardCount: function(todayCardList) {
    try {
      console.log('todayCardList 类型和内容:', typeof todayCardList, todayCardList)
      
      // 确保 todayCardList 是数组
      if (!Array.isArray(todayCardList)) {
        console.warn('todayCardList 不是数组，跳过同步')
        return
      }
      
      // 过滤掉非正常卡片（loading、blank、error等）
      const validCards = todayCardList.filter(card => 
        card && !card._type && card.wordCardID
      )
      
      const todayCardCount = validCards.length
      console.log('同步今日卡片数量:', { todayCardCount, validCards })
      
      // 直接将今日卡片数量设置为使用量
      const todayKey = dailyLimits.getTodayKey()
      const storageKey = `dailyUsage_${todayKey}`
      const currentUsage = dailyLimits.getTodayUsage()
      
      console.log('当前 dailyLimits 使用量:', currentUsage)
      console.log('直接设置使用量为今日卡片数量:', todayCardCount)
      
      // 直接设置使用量为当前卡片数量
      const newUsage = {
        cards: todayCardCount,
        replaces: currentUsage.replaces, // 保持换词记录不变
        date: todayKey
      }
      wx.setStorageSync(storageKey, newUsage)
      
      console.log('设置后的使用量:', newUsage)
    } catch (error) {
      console.error('同步今日卡片数量失败:', error)
    }
  },
})