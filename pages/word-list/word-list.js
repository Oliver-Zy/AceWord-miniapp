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
    
    // 新接口相关的分页和排序筛选参数
    sortOrder: 'desc', // 排序方向：desc | asc
    sortKey: 'familiar', // 排序字段：familiar | date
    startDate: '', // 筛选开始日期 yyyymmdd
    endDate: '', // 筛选结束日期 yyyymmdd
    startOpacity: 0, // 最低熟练度
    endOpacity: 100, // 最高熟练度
    pageIndex: 1, // 当前页码
    pageSize: 30, // 每页数量
    totalCount: 0, // 总数量
    totalPage: 0, // 总页数
    hasNextPage: false, // 是否有下一页
    
    // UI状态相关
    isLoadingMore: false, // 是否正在加载更多数据
    hasMoreData: true, // 是否还有更多数据可以加载
    activeNames: [], // 当前展开的日期列表
    
    // 筛选和排序UI相关
    dateFilterText: '全部日期',
    opacityFilterText: '全部熟练度',
    showDateFilterPopup: false,
    showOpacityFilterPopup: false,
    opacityRangeOptions: [
      { name: '未学习', value: 100 },
      { name: '陌生', value: 80 },
      { name: '了解', value: 50 },
      { name: '熟练', value: 30 },
      { name: '掌握', value: 10 }
    ],
    minOpacityIndex: 0, // 最低熟练度选择器索引
    maxOpacityIndex: 4, // 最高熟练度选择器索引
    
    // 熟练度调整相关
    showProficiencyPopup: false,
    showProficiencySheet: false,
    currentEditingWord: null, // 当前编辑的单词信息
    proficiencyActions: [
      { name: '掌握', opacity: 10 },   // opacity = 10 (高掌握度)
      { name: '熟练', opacity: 30 },   // opacity = 30 (较高掌握度)
      { name: '了解', opacity: 50 },   // opacity = 50 (中等掌握度)
      { name: '陌生', opacity: 80 },   // opacity = 80 (较低掌握度)
      { name: '未学习', opacity: 100 } // opacity = 100 (未学习)
    ],
    
    // 自定义释义编辑相关
    showSearchBarSelfDef: false,
    keyboardHeight: 0,
    currentEditingDefinition: null // 当前编辑释义的单词信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this._setInitInfo()
    // 设置固定的今日日期，供WXS使用
    const todayDate = app.globalData.todayDate
    this.setData({
      todayDate: todayDate
    })
    await this._loadWordList()
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
   * 监听熟练度点击事件
   * 注释：暂时禁用熟练度更新功能，避免更新不生效的问题
   */
  onProficiencyTap: function (e) {
    // 暂时禁用熟练度更新功能
    console.log('熟练度更新功能已暂时禁用')
    return
    
    /* 原有的熟练度更新逻辑，暂时注释
    const dataset = e.currentTarget.dataset
    const dateIndex = dataset.dateIndex
    const wordIndex = dataset.wordIndex
    const wordItem = this.data.wordGroupsByDate[dateIndex].wordList[wordIndex]
    
    const currentEditingWord = {
      dateIndex: dateIndex,
      wordIndex: wordIndex,
      wordId: dataset.wordId,
      wordName: dataset.wordName,
      currentOpacity: dataset.currentOpacity || 0,
      wordCardID: wordItem.wordCardID // 添加卡片ID
    }
    
    this.setData({
      showProficiencyPopup: true,
      showProficiencySheet: true,
      currentEditingWord
    })
    */
  },

  /**
   * 选择熟练度
   */
  onSelectProficiency: async function (e) {
    const selectedAction = e.detail
    const { currentEditingWord } = this.data
    
    if (!currentEditingWord) return
    
    try {
      Toast.loading({ message: '更新中...', forbidClick: true })
      
      // 更新本地数据
      const newOpacity = selectedAction.opacity
      const newProficiencyText = this._getProficiencyText(newOpacity)
      const newProficiencyColor = this._getProficiencyColor(newOpacity)
      
      this.setData({
        [`wordGroupsByDate[${currentEditingWord.dateIndex}].wordList[${currentEditingWord.wordIndex}].opacity`]: newOpacity,
        [`wordGroupsByDate[${currentEditingWord.dateIndex}].wordList[${currentEditingWord.wordIndex}].proficiencyText`]: newProficiencyText,
        [`wordGroupsByDate[${currentEditingWord.dateIndex}].wordList[${currentEditingWord.wordIndex}].proficiencyColor`]: newProficiencyColor,
        showProficiencyPopup: false,
        showProficiencySheet: false,
        currentEditingWord: null
      })
      
      // 调用API更新服务器数据
      await common.request({
        url: `/word/familiar/batch`,
        method: 'PUT',
        data: [{
          word: currentEditingWord.wordName,
          opacity: newOpacity, // 使用正确的参数名opacity
          cardID: currentEditingWord.wordCardID
        }]
      })
      
      Toast.clear()
      Toast.success(`更新成功`)
      
    } catch (error) {
      console.error('更新熟练度失败:', error)
      Toast.clear()
      Toast.fail('更新失败，请重试')
      
      // 恢复原始数据
      const originalOpacity = currentEditingWord.currentOpacity
      const originalProficiencyText = this._getProficiencyText(originalOpacity)
      const originalProficiencyColor = this._getProficiencyColor(originalOpacity)
      this.setData({
        [`wordGroupsByDate[${currentEditingWord.dateIndex}].wordList[${currentEditingWord.wordIndex}].opacity`]: originalOpacity,
        [`wordGroupsByDate[${currentEditingWord.dateIndex}].wordList[${currentEditingWord.wordIndex}].proficiencyText`]: originalProficiencyText,
        [`wordGroupsByDate[${currentEditingWord.dateIndex}].wordList[${currentEditingWord.wordIndex}].proficiencyColor`]: originalProficiencyColor
      })
    }
  },

  /**
   * 关闭熟练度选择弹窗
   */
  onCloseProficiencySheet: function () {
    this.setData({
      showProficiencyPopup: false,
      showProficiencySheet: false,
      currentEditingWord: null
    })
  },

  /**
   * 排序切换
   */
  onSortChange: function (e) {
    const sortKey = e.currentTarget.dataset.sortKey
    let sortOrder = 'desc'
    
    // 如果点击的是当前排序字段，则切换排序方向
    if (this.data.sortKey === sortKey) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc'
    }
    
    this.setData({
      sortKey,
      sortOrder,
      pageIndex: 1,
      wordGroupsByDate: []
    })
    
    this._loadWordList()
  },

  /**
   * 显示日期筛选弹窗
   */
  onShowDateFilter: function () {
    this.setData({
      showDateFilterPopup: true
    })
  },

  /**
   * 关闭日期筛选弹窗
   */
  onCloseDateFilter: function () {
    this.setData({
      showDateFilterPopup: false
    })
  },

  /**
   * 开始日期变化
   */
  onStartDateChange: function (e) {
    const startDate = e.detail.value.replace(/-/g, '') // 转换为yyyymmdd格式
    this.setData({
      startDate
    })
  },

  /**
   * 结束日期变化
   */
  onEndDateChange: function (e) {
    const endDate = e.detail.value.replace(/-/g, '') // 转换为yyyymmdd格式
    this.setData({
      endDate
    })
  },

  /**
   * 重置日期筛选
   */
  onResetDateFilter: function () {
    this.setData({
      startDate: '',
      endDate: '',
      dateFilterText: '全部日期'
    })
  },

  /**
   * 应用日期筛选
   */
  onApplyDateFilter: function () {
    const { startDate, endDate } = this.data
    let filterText = '全部日期'
    
    if (startDate && endDate) {
      const startDateFormatted = this._formatDateForDisplay(startDate)
      const endDateFormatted = this._formatDateForDisplay(endDate)
      filterText = `${startDateFormatted} 至 ${endDateFormatted}`
    } else if (startDate) {
      const startDateFormatted = this._formatDateForDisplay(startDate)
      filterText = `${startDateFormatted} 之后`
    } else if (endDate) {
      const endDateFormatted = this._formatDateForDisplay(endDate)
      filterText = `${endDateFormatted} 之前`
    }
    
    this.setData({
      dateFilterText: filterText,
      showDateFilterPopup: false,
      pageIndex: 1,
      wordGroupsByDate: []
    })
    
    this._loadWordList()
  },

  /**
   * 显示熟练度筛选弹窗
   */
  onShowOpacityFilter: function () {
    this.setData({
      showOpacityFilterPopup: true
    })
  },

  /**
   * 关闭熟练度筛选弹窗
   */
  onCloseOpacityFilter: function () {
    this.setData({
      showOpacityFilterPopup: false
    })
  },

  /**
   * 最低熟练度变化
   */
  onMinOpacityChange: function (e) {
    const minOpacityIndex = parseInt(e.detail.value)
    this.setData({
      minOpacityIndex
    })
  },

  /**
   * 最高熟练度变化
   */
  onMaxOpacityChange: function (e) {
    const maxOpacityIndex = parseInt(e.detail.value)
    this.setData({
      maxOpacityIndex
    })
  },

  /**
   * 重置熟练度筛选
   */
  onResetOpacityFilter: function () {
    this.setData({
      minOpacityIndex: 0,
      maxOpacityIndex: 4,
      startOpacity: 0,
      endOpacity: 100,
      opacityFilterText: '全部熟练度'
    })
  },

  /**
   * 应用熟练度筛选
   */
  onApplyOpacityFilter: function () {
    const { minOpacityIndex, maxOpacityIndex, opacityRangeOptions } = this.data
    
    // 注意：opacity值越高表示熟练度越低，所以需要反向处理
    const maxOpacity = opacityRangeOptions[minOpacityIndex].value // 最低熟练度对应最高opacity
    const minOpacity = opacityRangeOptions[maxOpacityIndex].value // 最高熟练度对应最低opacity
    
    const minName = opacityRangeOptions[maxOpacityIndex].name
    const maxName = opacityRangeOptions[minOpacityIndex].name
    
    let filterText = '全部熟练度'
    if (minOpacityIndex !== 0 || maxOpacityIndex !== 4) {
      filterText = `${minName} 至 ${maxName}`
    }
    
    this.setData({
      startOpacity: minOpacity,
      endOpacity: maxOpacity,
      opacityFilterText: filterText,
      showOpacityFilterPopup: false,
      pageIndex: 1,
      wordGroupsByDate: []
    })
    
    this._loadWordList()
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
    this.setData({
      pageIndex: 1,
      isRefresherTriggered: true
    })
    // 不清空 wordGroupsByDate，避免显示空状态
    this._loadWordList()
  },

  /**
   * 加载更多单词（分页加载）
   */
  onLoadMore: async function () {
    if (this.data.isLoadingMore || !this.data.hasNextPage) {
      return
    }

    try {
      this.setData({ isLoadingMore: true })
      Toast.loading({ message: '加载中...', forbidClick: true })

      // 增加页码
      const nextPageIndex = this.data.pageIndex + 1
      this.setData({ pageIndex: nextPageIndex })

      // 调用加载函数，但不清空现有数据
      await this._loadWordList(true) // 传入append参数表示追加数据

      Toast.clear()

    } catch (error) {
      console.error('Failed to load more words:', error)
      Toast.fail('加载失败，请稍后重试')
    } finally {
      this.setData({ isLoadingMore: false })
    }
  },

  /**
   * 加载单词列表数据（使用新接口）
   */
  _loadWordList: async function (append = false) {
    try {
      if (!append) {
        Toast.loading({ message: '加载中...', forbidClick: true })
      }
      
      // 构建请求参数
      const params = {
        sortOrder: this.data.sortOrder,
        sortKey: this.data.sortKey,
        pageIndex: this.data.pageIndex,
        pageSize: this.data.pageSize
      }
      
      // 添加筛选条件（如果有）
      if (this.data.startDate) {
        params.startDate = this.data.startDate
      }
      if (this.data.endDate) {
        params.endDate = this.data.endDate
      }
      if (this.data.startOpacity > 0) {
        params.startOpacity = this.data.startOpacity
      }
      if (this.data.endOpacity < 100) {
        params.endOpacity = this.data.endOpacity
      }
      
      // 手动构建URL参数字符串
      const urlParams = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
      
      // 调用新接口
      const response = await common.request({
        url: `/cardword/list${urlParams ? '?' + urlParams : ''}`
      })
      
      if (!response) {
        throw new Error('接口返回数据为空')
      }
      
      console.log('Full response structure:', response)
      console.log('response.data:', response.data)
      
      // response 本身就包含了所有需要的数据
      const { totalCount, totalPage, pageSize, hasNextPage, currentPage, data: wordList } = response
      
      console.log('Raw wordList from API:', wordList)
      console.log('wordList length:', wordList ? wordList.length : 'null')
      if (wordList && wordList.length > 0) {
        console.log('First word item:', wordList[0])
      }
      
      // 处理单词数据
      const processedWordList = this._processNewWordList(wordList)
      console.log('Processed word list:', processedWordList)
      
      // 预加载单词完整信息
      await this._preloadWordInfos(processedWordList)
      
      // 按日期分组
      const groupedWords = this._groupWordsByDate(processedWordList)
      console.log('Grouped words:', groupedWords)
      
      // 更新页面数据
      let finalWordGroups = []
      if (append && this.data.wordGroupsByDate.length > 0) {
        // 追加模式：合并数据
        finalWordGroups = this._mergeWordGroups(this.data.wordGroupsByDate, groupedWords)
      } else {
        // 重新加载模式：直接使用新数据
        finalWordGroups = groupedWords
      }
      
      // 设置默认展开第一个日期
      const activeNames = finalWordGroups.length > 0 && !append ? [finalWordGroups[0].date] : this.data.activeNames
      
      console.log('Final word groups to set:', finalWordGroups)
      console.log('Active names:', activeNames)
      
      this.setData({
        wordGroupsByDate: finalWordGroups,
        totalCount,
        totalPage,
        hasNextPage,
        isRefresherTriggered: false,
        isLoaded: true,
        hasMoreData: hasNextPage,
        activeNames: activeNames
      })
      
      console.log('Data set complete. Current wordGroupsByDate:', this.data.wordGroupsByDate)
      
      if (!append) {
        Toast.clear()
      }
      
    } catch (error) {
      console.error('Failed to load word list:', error)
      if (!append) {
        Toast.fail('加载失败，请稍后重试')
        this.setData({
          isRefresherTriggered: false,
          isLoaded: true
        })
      }
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
   * 处理新接口返回的单词数据
   */
  _processNewWordList: function (wordList) {
    console.log('_processNewWordList called with:', wordList)
    
    if (!wordList || wordList.length === 0) {
      console.log('wordList is empty or null')
      return []
    }

    // 检查数据格式：是单词数组还是卡片数组
    const firstItem = wordList[0]
    console.log('First item structure:', firstItem)
    
    // 如果是卡片格式（包含wordList和wordInfoList）
    if (firstItem && firstItem.wordList && firstItem.wordInfoList) {
      console.log('Detected card format, using _processWordCardList')
      return this._processWordCardList(wordList)
    }
    
    console.log('Detected direct word array format, processing...')
    // 如果是直接的单词数组格式
    return wordList.map((wordItem, index) => {
      return {
        wordName: wordItem.wordName,
        wordCardID: wordItem.dictCode || wordItem.wordName, // 使用dictCode或wordName作为wordCardID
        wordIndex: index,
        // 创建唯一的单词ID
        wordId: `${wordItem.wordName}_${index}_${wordItem.createTime}`,
        practiceNum: 0, // 新接口暂无此字段
        createDate: wordItem.createTime,
        learnDate: wordItem.createTime,
        wordBookName: '当前词书', // 新接口暂无词书信息
        wordBookCode: '',
        isDeleted: false,
        // 保存原始的opacity值用于排序
        opacity: wordItem.opacity || 0,
        // 添加自定义释义和完整的wordInfo数据
        selfDef: wordItem.definition?.wordCN || '',
        wordCN: wordItem.definition?.wordCN || '',
        wordInfo: wordItem.definition || null,
        // 添加熟练度文案和颜色 - 使用opacity分数
        proficiencyText: this._getProficiencyText(wordItem.opacity || 0),
        proficiencyColor: this._getProficiencyColor(wordItem.opacity || 0),
        // 保存原始数据
        originalData: wordItem
      }
    })
  },

  /**
   * 处理卡片格式的单词数据（备用）
   */
  _processWordCardList: function (wordCardList) {
    const processedWords = []
    
    // 遍历每个单词卡片
    wordCardList.forEach(wordCard => {
      if (wordCard.wordList && wordCard.wordList.length > 0) {
        // 遍历卡片中的每个单词
        wordCard.wordList.forEach((wordName, wordIndex) => {
          // 获取对应的单词信息
          const wordInfo = wordCard.wordInfoList && wordCard.wordInfoList[wordIndex] 
            ? wordCard.wordInfoList[wordIndex] 
            : null
          
          const processedWord = {
            wordName: wordName,
            wordCardID: wordCard.wordCardID,
            wordIndex: wordIndex,
            // 创建唯一的单词ID
            wordId: `${wordCard.wordCardID}_${wordIndex}_${wordCard.createDate}`,
            practiceNum: wordCard.realPracticeNum || 0,
            createDate: wordCard.createDate,
            learnDate: wordCard.createDate,
            wordBookName: wordCard.wordBookName || '当前词书',
            wordBookCode: wordCard.wordBookCode || '',
            isDeleted: wordCard.isDeleted || false,
            // 从wordInfo中获取opacity，如果没有则默认为100（未学习）
            opacity: wordInfo?.opacity || 100,
            // 添加自定义释义和完整的wordInfo数据
            selfDef: wordInfo?.selfDef || wordInfo?.wordCN || '',
            wordCN: wordInfo?.wordCN || '',
            wordInfo: wordInfo,
            // 添加熟练度文案和颜色
            proficiencyText: this._getProficiencyText(wordInfo?.opacity || 100),
            proficiencyColor: this._getProficiencyColor(wordInfo?.opacity || 100),
            // 保存原始数据
            originalData: wordCard
          }
          
          processedWords.push(processedWord)
        })
      }
    })

    return processedWords
  },

  /**
   * 按日期分组单词
   */
  _groupWordsByDate: function (wordList) {
    if (!wordList || wordList.length === 0) {
      return []
    }

    // 按日期分组
    const dateGroups = {}
    
    wordList.forEach(word => {
      const date = word.createDate
      if (!dateGroups[date]) {
        dateGroups[date] = []
      }
      dateGroups[date].push(word)
    })

    // 转换为数组格式并排序
    const groupedArray = Object.keys(dateGroups)
      .sort((a, b) => b.localeCompare(a)) // 日期降序
      .map(date => ({
        date: date,
        dateDisplay: date === app.globalData.todayDate ? '今日添加' : null,
        wordList: dateGroups[date],
        wordCount: dateGroups[date].length
      }))

    console.log('Date groups created:', groupedArray)
    return groupedArray
  },

  /**
   * 合并单词分组（用于分页追加）
   */
  _mergeWordGroups: function (existingGroups, newGroups) {
    if (!newGroups || newGroups.length === 0) {
      return existingGroups
    }

    const mergedGroups = [...existingGroups]
    
    newGroups.forEach(newGroup => {
      const existingIndex = mergedGroups.findIndex(group => group.date === newGroup.date)
      
      if (existingIndex >= 0) {
        // 合并同日期的数据
        const existingWords = mergedGroups[existingIndex].wordList
        const newWords = newGroup.wordList.filter(newWord => 
          !existingWords.some(existingWord => existingWord.wordId === newWord.wordId)
        )
        
        mergedGroups[existingIndex].wordList = [...existingWords, ...newWords]
        mergedGroups[existingIndex].wordCount = mergedGroups[existingIndex].wordList.length
      } else {
        // 添加新日期分组
        mergedGroups.push(newGroup)
      }
    })

    // 重新排序
    mergedGroups.sort((a, b) => b.date.localeCompare(a.date))

    return mergedGroups
  },

  /**
   * 处理单词列表数据（保留原有函数以兼容其他功能）
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
            learnDate: practiceDate || app.globalData.todayDate, // 添加学习日期
            wordBookName: wordBookCodeToName[wordCard.wordBookCode] || '未知词书',
            wordBookCode: wordCard.wordBookCode,
            isDeleted: wordCard.isDeleted || false,
            // 保存原始的opacity值用于排序
            opacity: wordInfo.opacity || 0,
            // 添加自定义释义和完整的wordInfo数据
            selfDef: wordInfo.selfDef || wordInfo.wordCN || '',
            wordCN: wordInfo.wordCN || '',
            wordInfo: wordInfo,
            // 添加熟练度文案和颜色 - 使用opacity分数
            proficiencyText: this._getProficiencyText(wordInfo.opacity || 0),
            proficiencyColor: this._getProficiencyColor(wordInfo.opacity || 0)
          })
        })
      }
    })

    return wordList
  },

  /**
   * 计算统计数据 - 已注释
   */
  /*
  _calculateStatistics: function() {
    let totalWords = 0
    let beginnerWords = 0  // 陌生+了解 (0-59)
    let advancedWords = 0  // 熟练+掌握 (60-100)
    
    this.data.wordGroupsByDate.forEach(dateGroup => {
      if (dateGroup.wordList) {
        dateGroup.wordList.forEach(word => {
          totalWords++
          const opacity = word.opacity || 0
          
          if (opacity >= 60) {
            advancedWords++  // 熟练/掌握
          } else {
            beginnerWords++  // 陌生/了解
          }
        })
      }
    })
    
    this.setData({
      statistics: {
        totalWords,
        beginnerWords,
        advancedWords
      }
    })
  },
  */

  /**
   * 根据熟练度分数获取熟练度文案
   * @param {number} opacity 熟练度分数 (0-100)，100表示未学过，0表示掌握
   */
  _getProficiencyText: function(opacity) {
    if (opacity >= 100) {
      return '未学习'  // 100分 = 未学过
    } else if (opacity >= 70) {
      return '陌生'    // 70-99分
    } else if (opacity >= 40) {
      return '了解'    // 40-69分
    } else if (opacity >= 15) {
      return '熟练'    // 15-39分
    } else {
      return '掌握'    // 0-14分
    }
  },

  /**
   * 根据熟练度分数获取颜色
   * @param {number} opacity 熟练度分数 (0-100)，100表示未学过，0表示掌握
   */
  _getProficiencyColor: function(opacity) {
    if (opacity >= 100) {
      return '#C9CDD4' // 浅灰色 - 未学习
    } else if (opacity >= 70) {
      return '#969799' // 灰色 - 陌生
    } else if (opacity >= 40) {
      return '#ff976a' // 橙色 - 了解
    } else if (opacity >= 15) {
      return '#1989fa' // 蓝色 - 熟练
    } else {
      return '#07c160' // 绿色 - 掌握
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
    
    if (e.detail.type === 'selfDef') {
      // 编辑自定义释义
      this.setData({
        showSearchBarSelfDef: true,
        currentEditingDefinition: {
          wordName: this.data.wordInfo.word,
          currentSelfDef: this.data.wordInfo.selfDef || this.data.wordInfo.wordCN || ''
        }
      })
    }
  },

  /**
   * 监听自定义释义输入框获得焦点事件
   */
  onSearchBarSelfDefFocus: function (e) {
    this.setData({
      keyboardHeight: e.detail.height
    })
  },

  /**
   * 监听完成修改自定义释义事件
   */
  onSearchBarSelfDefConfirm: async function (e) {
    const { currentEditingDefinition } = this.data
    if (!currentEditingDefinition) return

    try {
      Toast.loading({ message: '保存中...', forbidClick: true })

      // 更新服务器数据
      await common.request({
        url: `/wordinfos`,
        method: 'PUT',
        data: [{
          word: currentEditingDefinition.wordName,
          selfDef: e.detail.value
        }]
      })

      // 更新当前弹窗显示的数据
      this.setData({
        'wordInfo.selfDef': e.detail.value,
        showSearchBarSelfDef: false,
        keyboardHeight: 0,
        currentEditingDefinition: null
      })

      // 更新列表中对应单词的释义
      this._updateWordListSelfDef(currentEditingDefinition.wordName, e.detail.value)

      Toast.clear()
      Toast.success('修改成功')

    } catch (error) {
      console.error('修改自定义释义失败:', error)
      Toast.clear()
      Toast.fail('修改失败，请重试')
    }
  },

  /**
   * 监听取消修改自定义释义事件
   */
  onSearchBarSelfDefCancel: function () {
    this.setData({
      showSearchBarSelfDef: false,
      keyboardHeight: 0,
      currentEditingDefinition: null
    })
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
   * 更新单词列表中指定单词的自定义释义
   */
  _updateWordListSelfDef: function (wordName, newSelfDef) {
    const { wordGroupsByDate } = this.data
    let updated = false

    // 遍历所有日期分组
    for (let dateIndex = 0; dateIndex < wordGroupsByDate.length; dateIndex++) {
      const dateGroup = wordGroupsByDate[dateIndex]
      if (dateGroup.wordList) {
        // 遍历该日期分组下的所有单词
        for (let wordIndex = 0; wordIndex < dateGroup.wordList.length; wordIndex++) {
          const wordItem = dateGroup.wordList[wordIndex]
          if (wordItem.wordName === wordName) {
            // 更新找到的单词的释义
            this.setData({
              [`wordGroupsByDate[${dateIndex}].wordList[${wordIndex}].selfDef`]: newSelfDef
            })
            
            // 同时更新wordInfo中的释义（如果存在）
            if (wordItem.wordInfo) {
              this.setData({
                [`wordGroupsByDate[${dateIndex}].wordList[${wordIndex}].wordInfo.selfDef`]: newSelfDef
              })
            }
            
            updated = true
          }
        }
      }
    }

    if (!updated) {
      console.warn('未找到需要更新的单词:', wordName)
    }
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

  /**
   * 格式化日期显示（用于筛选显示）
   */
  _formatDateForDisplay: function (dateString) {
    // dateString 格式：YYYYMMDD
    const month = parseInt(dateString.substring(4, 6))
    const day = parseInt(dateString.substring(6, 8))
    
    return `${month}月${day}日`
  },

  onShareAppMessage() {
    return {
      title: '我的新学单词列表 - AceWord',
      path: 'pages/word-list/word-list',
    }
  }
})
