const { Common } = require('../../models/common.js')
const common = new Common()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    wordGroupsByDate: [], // 按日期分组的单词数据 [{date: 'YYYYMMDD', dateDisplay: 'X月X日', wordList: [...], wordCount: N}]
    wordBookMyInfo: {},
    isLoaded: false, // 标记是否已完成加载
    // 单词弹窗相关
    showDicCard: false,
    showOverlay: false,
    wordInfo: {},
    // 释义显示状态
    visibleMeanings: {}, // 用于记录哪些单词的释义是可见的
    // 选择功能
    selectedWordIds: [], // 选中的单词ID列表
    // 历史数据加载相关
    currentDate: '', // 当前加载的日期（用于追溯）
    todayDate: '', // 今日日期（固定不变，用于WXS判断）
    loadedDates: [], // 已加载的日期列表
    isLoadingMore: false, // 是否正在加载更多数据
    hasMoreData: true, // 是否还有更多数据可以加载
    // 折叠展开相关
    activeNames: [], // 当前展开的日期列表
    defaultLoadDays: 5 // 默认加载天数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this._setInitInfo()
    // 设置固定的今日日期，供WXS使用
    const todayDate = app.globalData.todayDate
    this.setData({
      todayDate: todayDate,
      currentDate: todayDate
    })
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
   * 监听单词项点击事件（显示单词弹窗）
   */
  onWordItemTap: async function (e) {
    const dateIndex = e.currentTarget.dataset.dateIndex
    const wordIndex = e.currentTarget.dataset.wordIndex
    const wordItem = this.data.wordGroupsByDate[dateIndex].wordList[wordIndex]
    
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
   * 监听header事件（全选/取消全选）
   */
  onHeaderEvent: function (e) {
    if (e.detail.type === 'selectAll') {
      const isSelectAll = e.detail.isSelectAll
      
      // 获取所有单词ID
      const allWordIds = []
      this.data.wordGroupsByDate.forEach(group => {
        group.wordList.forEach(word => {
          allWordIds.push(word.wordId)
        })
      })
      
      if (isSelectAll) {
        // 当前是全选状态，执行取消全选
        this.setData({
          selectedWordIds: []
        })
      } else {
        // 当前不是全选状态，执行全选
        this.setData({
          selectedWordIds: allWordIds
        })
      }
    }
  },

  /**
   * 监听日期分组header事件（分组全选/取消全选）
   */
  onDateGroupHeaderEvent: function (e) {
    if (e.detail.type === 'selectAll') {
      const dateIndex = e.currentTarget.dataset.dateIndex
      const dateGroup = this.data.wordGroupsByDate[dateIndex]
      const isSelectAll = e.detail.isSelectAll
      
      if (!dateGroup || !dateGroup.wordList) {
        return
      }
      
      // 获取当前日期分组的所有单词ID
      const groupWordIds = dateGroup.wordList.map(word => word.wordId)
      let selectedWordIds = [...this.data.selectedWordIds]
      
      if (isSelectAll) {
        // 当前分组是全选状态，执行取消全选（从selectedWordIds中移除该分组的所有单词ID）
        selectedWordIds = selectedWordIds.filter(wordId => !groupWordIds.includes(wordId))
      } else {
        // 当前分组不是全选状态，执行全选（将该分组的所有单词ID添加到selectedWordIds中）
        groupWordIds.forEach(wordId => {
          if (!selectedWordIds.includes(wordId)) {
            selectedWordIds.push(wordId)
          }
        })
      }
      
      this.setData({
        selectedWordIds
      })
    }
  },

  /**
   * 监听释义点击事件（显示/隐藏释义）
   */
  onMeaningTap: function (e) {
    const wordId = e.currentTarget.dataset.wordId
    const visibleMeanings = { ...this.data.visibleMeanings }
    visibleMeanings[wordId] = !visibleMeanings[wordId]
    
    this.setData({
      visibleMeanings
    })
  },

  /**
   * 监听折叠面板变化事件
   */
  onCollapseChange: function(e) {
    this.setData({
      activeNames: e.detail
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
   * 加载更多历史练习单词（一次加载5天）
   */
  onLoadMore: async function () {
    if (this.data.isLoadingMore) {
      return
    }

    try {
      this.setData({ isLoadingMore: true })
      Toast.loading({ message: '加载中...', forbidClick: true })

      // 获取词书映射信息（如果还没有的话）
      let wordBookCodeToName = this.data.wordBookCodeToName
      if (!wordBookCodeToName) {
        wordBookCodeToName = await common.request({
          url: `/wordbooks-map`
        })
        this.setData({ wordBookCodeToName })
      }

      // 一次性加载5天的数据
      const daysToLoad = 5
      const newDateGroups = []
      let currentDate = this.data.currentDate
      let totalWordsLoaded = 0
      let daysWithData = 0

      for (let i = 0; i < daysToLoad; i++) {
        // 获取前一天的日期
        const previousDate = this._getPreviousDate(currentDate)
        
        // 检查是否已经加载过这个日期
        if (this.data.loadedDates.includes(previousDate)) {
          currentDate = previousDate
          continue
        }

        try {
          // 获取历史练习单词数据
          const pageInfo = await common.request({
            url: `/wordcards/practice?date=${previousDate}`
          })

          if (pageInfo.data && pageInfo.data.length > 0) {
            // 处理新的单词列表数据
            const newWordList = this._processWordList(pageInfo.data, wordBookCodeToName, previousDate)
            
            if (newWordList.length > 0) {
              // 预加载新单词的完整信息
              await this._preloadWordInfos(newWordList)

              // 按熟练度排序：最陌生的（opacity最低）排在前面
              newWordList.sort((a, b) => {
                return (a.opacity || 0) - (b.opacity || 0)
              })

              // 创建新的日期分组
              const newDateGroup = {
                date: previousDate,
                dateDisplay: null, // 让WXS函数处理日期格式
                wordList: newWordList,
                wordCount: newWordList.length
              }

              newDateGroups.push(newDateGroup)
              totalWordsLoaded += newWordList.length
              daysWithData++
            }
          }
        } catch (error) {
          console.error(`Failed to load data for ${previousDate}:`, error)
          // 单个日期加载失败不影响其他日期
        }

        // 更新loadedDates
        this.data.loadedDates.push(previousDate)
        currentDate = previousDate
      }

      // 更新页面数据
      if (newDateGroups.length > 0) {
        const updatedWordGroupsByDate = [...this.data.wordGroupsByDate, ...newDateGroups]
        
        this.setData({
          wordGroupsByDate: updatedWordGroupsByDate,
          currentDate: currentDate,
          loadedDates: this.data.loadedDates
        })

        Toast.success(`加载了${daysWithData}天的历史记录，共${totalWordsLoaded}个单词`)
      } else {
        // 没有更多数据了
        this.setData({
          currentDate: currentDate,
          loadedDates: this.data.loadedDates,
          hasMoreData: false
        })
        Toast('近期暂无更多练习记录')
      }

    } catch (error) {
      console.error('Failed to load more words:', error)
      Toast.fail('加载失败，请稍后重试')
    } finally {
      this.setData({ isLoadingMore: false })
      Toast.clear()
    }
  },

  /**
   * 加载练习单词数据（今日+历史7天）
   */
  _loadTodayWords: async function () {
    try {
      Toast.loading({ message: '加载中...', forbidClick: true })
      
      const todayDate = app.globalData.todayDate
      
      // 获取词书映射信息
      const wordBookCodeToName = await common.request({
        url: `/wordbooks-map`
      })
      
      // 获取基本设置信息
      const homeData = await common.request({ url: `/homedata` })
      const settings = homeData.settings
      const currentWordBook = settings.currentWordBook
      const wordBookMyInfo = {
        currentWordBookName: currentWordBook.wordBookName,
        dailyTargetNum: settings.dailyTargetNum,
        totalWordNum: currentWordBook.totalWordNum,
        userProgressNum: currentWordBook.userProgressNum
      }

      // 一次性加载今日+历史4天的数据（总共5天）
      const daysToLoad = this.data.defaultLoadDays
      const dateGroups = []
      const loadedDates = []
      let currentDate = todayDate
      let totalWordsLoaded = 0

      for (let i = 0; i < daysToLoad; i++) {
        try {
          // 获取当前日期的练习单词数据
          const pageInfo = await common.request({
            url: `/wordcards/practice?date=${currentDate}`
          })

          if (pageInfo.data && pageInfo.data.length > 0) {
            // 处理单词列表数据
            const wordList = this._processWordList(pageInfo.data, wordBookCodeToName, currentDate)
            
            if (wordList.length > 0) {
              // 预加载单词的完整信息
              await this._preloadWordInfos(wordList)

              // 按熟练度排序：最陌生的（opacity最低）排在前面
              wordList.sort((a, b) => {
                return (a.opacity || 0) - (b.opacity || 0)
              })

              // 创建日期分组
              const dateGroup = {
                date: currentDate,
                dateDisplay: i === 0 ? '今日练习' : null, // 让WXS函数处理历史日期格式
                wordList: wordList,
                wordCount: wordList.length
              }

              dateGroups.push(dateGroup)
              totalWordsLoaded += wordList.length
            }
          }
        } catch (error) {
          console.error(`Failed to load data for ${currentDate}:`, error)
          // 单个日期加载失败不影响其他日期
        }

        loadedDates.push(currentDate)
        
        // 获取前一天的日期（除了第一次，因为第一次是今天）
        if (i < daysToLoad - 1) {
          currentDate = this._getPreviousDate(currentDate)
        }
      }

      // 设置默认展开第一个日期
      const activeNames = dateGroups.length > 0 ? [dateGroups[0].date] : []
      
      this.setData({
        wordGroupsByDate: dateGroups,
        wordBookMyInfo,
        wordBookCodeToName,
        isRefresherTriggered: false,
        isLoaded: true,
        loadedDates: loadedDates,
        currentDate: currentDate, // 设置为最后加载的日期，便于后续"加载更多"
        activeNames: activeNames, // 默认展开第一个日期
        hasMoreData: true // 重置加载更多状态
      })
      
      Toast.clear()
      
      if (totalWordsLoaded > 0) {
        // Toast.success('加载成功')
      }
      
    } catch (error) {
      console.error('Failed to load practice words:', error)
      Toast.fail('加载失败，请稍后重试')
      this.setData({
        isRefresherTriggered: false,
        isLoaded: true
      })
    }
  },

  /**
   * 隐藏弹窗
   */
  onClickHideOverlay: function () {
    this.setData({
      showDicCard: false,
      showOverlay: false
    })
    this.getTabBar().setData({
      show: true
    })
  },

  /**
   * 处理dic-card事件
   */
  onDicCardEvent: function (e) {
    // 处理dic-card的各种事件
    console.log('dic-card event:', e.detail)
  },

  /**
   * 设置初始信息
   */
  _setInitInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      isIOS: app.globalData.isIOS
    })
  },

  /**
   * 发音功能
   */
  _pronounce: function (word) {
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`
    innerAudioContext.play()
  },

  /**
   * 处理单词列表数据
   */
  _processWordList: function (wordCardList, wordBookCodeToName, practiceDate = null) {
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
            // 创建唯一的单词ID：卡片ID + 单词索引 + 日期（避免重复）
            wordId: `${wordCard.wordCardID}_${index}_${practiceDate || app.globalData.todayDate}`,
            practiceNum: wordCard.realPracticeNum || 0,
            createDate: wordCard.createDate,
            practiceDate: practiceDate || app.globalData.todayDate, // 添加练习日期
            wordBookName: wordBookCodeToName[wordCard.wordBookCode] || '未知词书',
            wordBookCode: wordCard.wordBookCode,
            isDeleted: wordCard.isDeleted || false,
            // 保存原始的opacity值用于排序
            opacity: wordInfo.opacity || 0,
            // 添加自定义释义和完整的wordInfo数据
            selfDef: wordInfo.selfDef || wordInfo.wordCN || '',
            wordCN: wordInfo.wordCN || '',
            wordInfo: wordInfo,
            // 添加熟练度文案 - 使用opacity分数
            proficiencyText: this._getProficiencyText(wordInfo.opacity || 0)
          })
        })
      }
    })

    return wordList
  },

  /**
   * 根据熟练度分数获取熟练度文案
   * @param {number} opacity 熟练度分数 (0-100)
   */
  _getProficiencyText: function(opacity) {
    if (opacity >= 80) {
      return '完全掌握'
    } else if (opacity >= 60) {
      return '比较熟练'
    } else if (opacity >= 40) {
      return '初步了解'
    } else if (opacity >= 20) {
      return '略有印象'
    } else {
      return '非常陌生'
    }
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

  /**
   * 获取前一天的日期
   */
  _getPreviousDate: function (currentDate) {
    // currentDate 格式：YYYYMMDD
    const year = parseInt(currentDate.substring(0, 4))
    const month = parseInt(currentDate.substring(4, 6)) - 1 // JavaScript月份从0开始
    const day = parseInt(currentDate.substring(6, 8))
    
    const date = new Date(year, month, day)
    date.setDate(date.getDate() - 1) // 减去一天
    
    const prevYear = date.getFullYear()
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0')
    const prevDay = String(date.getDate()).padStart(2, '0')
    
    return `${prevYear}${prevMonth}${prevDay}`
  },

  /**
   * 格式化日期显示
   */
  _formatDateDisplay: function (dateString) {
    // dateString 格式：YYYYMMDD
    const year = dateString.substring(0, 4)
    const month = dateString.substring(4, 6)
    const day = dateString.substring(6, 8)
    
    return `${year}年${month}月${day}日`
  },

  onShareAppMessage() {
    return {
      title: '我的单词学习列表 - AceWord',
      path: 'pages/word-list/word-list',
    }
  }
})
