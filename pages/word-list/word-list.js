const { Common } = require('../../models/common.js')
const common = new Common()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    wordList: [],
    selectedWordIds: [], // 改为选择单词ID列表
    wordBookMyInfo: {},
    isLoaded: false, // 标记是否已完成加载
    // 单词弹窗相关
    showDicCard: false,
    showOverlay: false,
    wordInfo: {},
    // 释义显示状态
    visibleMeanings: {} // 用于记录哪些单词的释义是可见的
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this._setInitInfo()
    await this._loadTodayWords()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1, // 列表页面在TabBar中的索引
        show: true
      })
    }

    this.setData({
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 48 - (app.globalData.isIOS ? 30 : 0),
    })
  },

  /**
   * 监听标题栏事件
   */
  onHeaderEvent: function (e) {
    let isSelectAll = e.detail.isSelectAll

    if (e.detail.type == 'selectAll' && isSelectAll) {
      // 选择所有单词
      const allWordIds = this.data.wordList.map(item => item.wordId)
      this.setData({
        selectedWordIds: allWordIds
      })
    } else if (e.detail.type == 'selectAll' && !isSelectAll) {
      this.setData({
        selectedWordIds: []
      })
    }
  },

  /**
   * 监听单词项点击事件（显示单词弹窗）
   */
  onWordItemTap: async function (e) {
    const index = e.currentTarget.dataset.index
    const wordItem = this.data.wordList[index]
    
    if (wordItem && wordItem.wordName) {
      // 优先使用预加载的wordInfo数据
      if (wordItem.wordInfo && wordItem.wordInfo.word) {
        // 发音
        this._pronounce(wordItem.wordName)
        
        // 显示弹窗
        this.setData({
          wordInfo: wordItem.wordInfo,
          showDicCard: true,
          showOverlay: true
        })
        
        // 隐藏底部TabBar
        this.getTabBar().setData({
          show: false
        })
      } else {
        // 如果没有预加载数据，实时获取
        try {
          Toast.loading({ forbidClick: true })
          
          // 尝试使用批量接口获取
          const wordInfoList = await common.request({
            url: `/wordinfos/search?wordlist=${wordItem.wordName}`
          })
          
          let wordInfo = null
          if (wordInfoList && wordInfoList.length > 0) {
            wordInfo = wordInfoList[0]
          } else {
            throw new Error('未找到单词信息')
          }
          
          Toast.clear()
          
          // 发音
          this._pronounce(wordItem.wordName)
          
          // 显示弹窗
          this.setData({
            wordInfo,
            showDicCard: true,
            showOverlay: true
          })
          
          // 隐藏底部TabBar
          this.getTabBar().setData({
            show: false
          })
          
        } catch (error) {
          Toast.clear()
          console.error('Failed to load word info:', error)
          Toast.fail('加载失败，请稍后重试')
        }
      }
    }
  },

  /**
   * 监听复选框点击事件（选择）
   */
  onCheckboxTap: function (e) {
    const wordId = e.currentTarget.dataset.wordId
    let selectedWordIds = [...this.data.selectedWordIds]
    const index = selectedWordIds.indexOf(wordId)
    
    if (index > -1) {
      selectedWordIds.splice(index, 1)
    } else {
      selectedWordIds.push(wordId)
    }
    
    this.setData({
      selectedWordIds
    })
  },

  /**
   * 监听开始练习按钮
   */
  onPractice: async function () {
    if (this.data.selectedWordIds.length === 0) {
      Toast('请先选择要练习的单词')
      return
    }

    Toast.loading({
      forbidClick: true,
      duration: 0,
      message: '资源加载中',
    })

    try {
      // 从选中的单词ID中提取唯一的卡片ID
      const selectedWordCardIds = [...new Set(
        this.data.selectedWordIds.map(wordId => wordId.split('_')[0])
      )]
      
      app.globalData.practiceInfo = {}
      app.globalData.practiceInfo.wordInfoList = await common.request({
        url: `/wordinfos/search?word-card-id-list=${selectedWordCardIds.join(',')}`
      })
      app.globalData.practiceInfo.wordCardIDCheckedList = selectedWordCardIds
      app.globalData.practiceInfo.practiceMode = 'memorize'
      
      Toast.clear()
      wx.navigateTo({
        url: '../practice/practice?entryPage=word-list'
      })
    } catch (error) {
      Toast.clear()
      Toast.fail('加载失败，请稍后重试')
    }
  },

  /**
   * 下拉刷新
   */
  onScrollViewRefresh: function () {
    this._loadTodayWords()
  },

  /**
   * 加载今日单词数据
   */
  _loadTodayWords: async function () {
    try {
      Toast.loading()
      
      // 获取今日单词卡片数据
      const homeData = await common.request({ url: `/homedata` })
      const pageInfo = homeData.todayCardList
      
      // 处理单词列表数据
      const wordList = this._processWordList(pageInfo.data, homeData.bookMap)
      
      // 获取词书信息
      const settings = homeData.settings
      const currentWordBook = settings.currentWordBook
      const wordBookMyInfo = {
        currentWordBookName: currentWordBook.wordBookName,
        dailyTargetNum: settings.dailyTargetNum,
        totalWordNum: currentWordBook.totalWordNum,
        userProgressNum: currentWordBook.userProgressNum
      }

      // 预加载所有单词的完整信息
      await this._preloadWordInfos(wordList)

      this.setData({
        wordList,
        wordBookMyInfo,
        isRefresherTriggered: false,
        isLoaded: true
      })
      
      Toast.clear()
    } catch (error) {
      console.error('Failed to load today words:', error)
      Toast.fail('加载失败，请稍后重试')
      this.setData({
        isRefresherTriggered: false,
        isLoaded: true
      })
    }
  },

  /**
   * 处理单词列表数据
   */
  _processWordList: function (wordCardList, wordBookCodeToName) {
    if (!wordCardList || wordCardList.length === 0) {
      return []
    }

    // 将所有单词卡片的单词展开成一个扁平列表
    const wordList = []
    
    wordCardList.forEach(wordCard => {
      if (wordCard.wordInfoList && wordCard.wordInfoList.length > 0) {
        wordCard.wordInfoList.forEach((wordInfo, index) => {
          wordList.push({
            wordName: wordInfo.wordName,
            wordCardID: wordCard.wordCardID,
            wordIndex: index,
            // 创建唯一的单词ID：卡片ID + 单词索引
            wordId: `${wordCard.wordCardID}_${index}`,
            practiceNum: wordCard.realPracticeNum || 0,
            createDate: wordCard.createDate,
            wordBookName: wordBookCodeToName[wordCard.wordBookCode] || '未知词书',
            wordBookCode: wordCard.wordBookCode,
            isDeleted: wordCard.isDeleted || false,
            // 添加自定义释义和完整的wordInfo数据
            selfDef: wordInfo.selfDef || wordInfo.wordCN || '',
            wordCN: wordInfo.wordCN || '',
            wordInfo: wordInfo
          })
        })
      }
    })

    return wordList
  },

  /**
   * 预加载单词完整信息
   */
  _preloadWordInfos: async function (wordList) {
    if (!wordList || wordList.length === 0) {
      return
    }

    try {
      // 提取所有单词名称
      const wordNames = [...new Set(wordList.map(item => item.wordName))]
      
      if (wordNames.length === 0) {
        return
      }

      // 批量获取单词信息
      const wordInfoList = await common.request({
        url: `/wordinfos/search?wordlist=${wordNames.join(',')}`
      })

      // 创建单词信息映射
      const wordInfoMap = {}
      if (wordInfoList && Array.isArray(wordInfoList)) {
        wordInfoList.forEach(wordInfo => {
          if (wordInfo && wordInfo.word) {
            wordInfoMap[wordInfo.word] = wordInfo
          }
        })
      }

      // 更新wordList中的wordInfo
      wordList.forEach(item => {
        if (wordInfoMap[item.wordName]) {
          item.wordInfo = wordInfoMap[item.wordName]
          // 更新释义，优先使用自定义释义，其次使用简明释义
          const wordInfo = wordInfoMap[item.wordName]
          item.selfDef = wordInfo.selfDef || wordInfo.wordCN || item.selfDef || ''
          item.wordCN = wordInfo.wordCN || ''
        }
      })

    } catch (error) {
      console.error('Failed to preload word infos:', error)
      // 预加载失败不影响主流程，继续执行
    }
  },

  /**
   * 监听释义点击事件（切换显示/隐藏）
   */
  onMeaningTap: function (e) {
    const wordId = e.currentTarget.dataset.wordId
    const visibleMeanings = { ...this.data.visibleMeanings }
    
    // 切换显示状态
    visibleMeanings[wordId] = !visibleMeanings[wordId]
    
    this.setData({
      visibleMeanings
    })
  },

  /**
   * 关闭弹窗
   */
  onClickHideOverlay: function () {
    this.setData({
      showDicCard: false,
      showOverlay: false
    })
    
    // 显示底部TabBar
    this.getTabBar().setData({
      show: true
    })
  },

  /**
   * 监听dic-card事件
   */
  onDicCardEvent: function (e) {
    // 处理dic-card组件的事件，如收藏等
    console.log('dic-card event:', e.detail)
  },

  /**
   * 发音功能
   */
  _pronounce: function (word) {
    const innerAudioContext = wx.createInnerAudioContext()
    const pronType = app.globalData.settings?.pronType || 'US'
    const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${pronType === 'US' ? 0 : 1}`
    
    innerAudioContext.src = audioUrl
    innerAudioContext.play()
    
    innerAudioContext.onError((res) => {
      console.log("Audio error:", res)
      const backgroundAudioManager = wx.getBackgroundAudioManager()
      backgroundAudioManager.title = word
      backgroundAudioManager.src = audioUrl
    })
  },

  /**
   * 设置初始信息
   */
  _setInitInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      isIOS: app.globalData.isIOS,
    })
  },

  onShareAppMessage() {
    return {
      title: '我的单词学习列表 - AceWord',
      path: 'pages/word-list/word-list',
    }
  }
})
