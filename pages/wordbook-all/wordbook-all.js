import { Common } from '../../models/common.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'

const common = new Common()
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    wordBookCategories: [],
    activeNames: [], // 展开的分类
    currentWordBookCode: '',
    selectedCategoryCode: '', // 选中的分类代码
    selectedCategoryName: '', // 选中的分类名称
    isLoaded: false,
    isRefresherTriggered: false,
    naviBarHeight: 44,
    scrollViewHeight: 600,
    showNaviBarDivider: false,
    // 搜索相关
    showSearchBar: false,
    showOverlay: false,
    keyboardHeight: 0,
    wordInfo: null,
    showDicCard: false,
    // 搜索结果
    searchResults: [],
    isSearching: false,
    searchKeyword: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this._setInitInfo()
    
    // 获取传递的分类参数
    const categoryCode = options.categoryCode || ''
    const categoryName = decodeURIComponent(options.categoryName || '')
    
    this.setData({
      selectedCategoryCode: categoryCode,
      selectedCategoryName: categoryName,
      // 重置页面状态，清除之前的数据
      activeNames: [],
      wordBookCategories: [],
      isLoaded: false,
      isRefresherTriggered: false
    })
    
    await this._loadWordBookData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置状态栏颜色
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
    
    // 确保清除任何残留的Toast状态
    Toast.clear()
    
    // 强制重置折叠面板状态，防止状态残留
    this.setData({
      activeNames: []
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // 清除可能存在的Toast
    Toast.clear()
    
    // 页面隐藏时重置折叠面板状态，防止下次进入时状态冲突
    this.setData({
      activeNames: [],
      isLoaded: false
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 清除可能存在的Toast
    Toast.clear()
  },

  /**
   * 设置初始信息
   */
  _setInitInfo: function () {
    const systemInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    
    // 确保获取最新的当前词书代码
    const currentWordBookCode = app.globalData.settings?.currentWordBookCode || ''
    console.log('Init current wordbook code:', currentWordBookCode)
    
    this.setData({
      naviBarHeight: menuButton.bottom + 6,
      scrollViewHeight: systemInfo.windowHeight - (menuButton.bottom + 6) - (app.globalData.isIOS ? 30 : 0),
      currentWordBookCode: currentWordBookCode
    })
  },

  /**
   * 加载词书数据
   */
  _loadWordBookData: async function () {
    try {
      // 检查页面是否还存在，避免异步竞争
      if (!this.data) return
      
      // 先清除可能存在的Toast，然后显示新的加载状态
      Toast.clear()
      Toast.loading({ message: '加载中...', forbidClick: true })
      
      // 根据分类代码选择不同的API
      let wordBookListInfo
      if (this.data.selectedCategoryCode === '99') {
        // 我的词书使用专门的接口
        wordBookListInfo = await common.request({
          url: `/wordbooks-official?wordbook-category-code=99`
        })
      } else {
        // 其他分类使用原有接口
        wordBookListInfo = await common.request({
          url: `/wordbooks-official?wordbook-category-code=${this.data.selectedCategoryCode}`
        })
      }
      
      // 处理真实API返回的词书数据
      const wordBookList = wordBookListInfo.wordBookList || []
      const subCategoryMap = new Map()
      
      // 如果是我的词书，按学习状态分组
      if (this.data.selectedCategoryCode === '99') {
        // 按学习状态分组我的词书
        wordBookList.forEach(book => {
          // 判断学习状态
          const isCompleted = book.userProgressNum >= book.totalWordNum
          const isLearning = book.userProgressNum > 0 && book.userProgressNum < book.totalWordNum
          
          let statusCode, statusName
          if (isCompleted) {
            statusCode = 'completed'
            statusName = '已学完'
          } else if (isLearning) {
            statusCode = 'learning'
            statusName = '正在学习'
          } else {
            // 未开始学习的词书不显示，或者归类到"未开始"
            return // 跳过未开始的词书
          }
          
          if (!subCategoryMap.has(statusCode)) {
            subCategoryMap.set(statusCode, {
              categoryCode: statusCode,
              categoryName: statusName,
              wordBooks: []
            })
          }
          
          subCategoryMap.get(statusCode).wordBooks.push(book)
        })
      } else {
        // 其他分类按原有逻辑分组
        wordBookList.forEach(book => {
          const subCategoryCode = book.wordBookSubCategoryCode || 'default'
          const subCategoryName = book.wordBookSubCategoryName || '其他'
          
          if (!subCategoryMap.has(subCategoryCode)) {
            subCategoryMap.set(subCategoryCode, {
              categoryCode: subCategoryCode,
              categoryName: subCategoryName,
              wordBooks: []
            })
          }
          
          subCategoryMap.get(subCategoryCode).wordBooks.push(book)
        })
      }
      
      // 处理子分类数据
      let wordBookCategories = Array.from(subCategoryMap.values())
      
      // 如果是我的词书，按学习状态排序：正在学习 -> 已学完
      if (this.data.selectedCategoryCode === '99') {
        wordBookCategories.sort((a, b) => {
          const order = { 'learning': 0, 'completed': 1 }
          return (order[a.categoryCode] || 999) - (order[b.categoryCode] || 999)
        })
      }
      
      wordBookCategories = wordBookCategories.map(category => {
        if (category.wordBooks) {
          const processedBooks = category.wordBooks.map(book => ({
            ...book,
            // 添加标签逻辑
            isHot: book.userNum > 50000,
            isNew: this._isNewBook(book.createTime),
            // 确保进度数据
            userProgressNum: book.userProgressNum || 0,
            totalWordNum: book.totalWordNum || 0
          }))
          
          return {
            ...category,
            wordBooks: processedBooks
          }
        }
        return category
      }).filter(cat => cat.wordBooks && cat.wordBooks.length > 0)
      
      // 先设置数据，不展开任何分类
      this.setData({
        wordBookCategories: wordBookCategories,
        activeNames: [],
        isLoaded: true,
        isRefresherTriggered: false
      })
      
      Toast.clear()
      
      // 延迟一下确保组件状态完全重置
      setTimeout(() => {
        if (this.data && this.data.wordBookCategories) {
          this.setData({
            activeNames: []
          })
        }
      }, 100)
    } catch (error) {
      console.error('Failed to load wordbook data:', error)
      Toast.clear()
      Toast.fail('加载失败，请稍后重试')
      this.setData({
        isLoaded: true,
        isRefresherTriggered: false
      })
    }
  },



  /**
   * 判断是否为新词书
   */
  _isNewBook: function (createTime) {
    if (!createTime) return false
    const now = new Date().getTime()
    const bookTime = new Date(createTime).getTime()
    const daysDiff = (now - bookTime) / (1000 * 60 * 60 * 24)
    return daysDiff <= 30
  },

  /**
   * 折叠面板变化事件
   */
  onCollapseChange: function (e) {
    this.setData({
      activeNames: e.detail
    })
  },

  /**
   * 搜索相关方法
   */
  onSearchBoxTap: function () {
    this.setData({
      showSearchBar: true,
      showOverlay: true
    })
  },

  onSearchBarFocus: function (e) {
    this.setData({
      keyboardHeight: e.detail.height
    })
  },

  onSearchBarCancel: function () {
    this.setData({
      showSearchBar: false,
      showOverlay: false,
      keyboardHeight: 0,
      searchResults: [],
      isSearching: false,
      searchKeyword: ''
    })
  },

  onSearchBarConfirm: async function (e) {
    const keyword = e.detail.value.trim()
    if (!keyword) {
      Toast('请输入搜索关键词')
      return
    }
    
    try {
      Toast.loading({ message: '搜索中...', forbidClick: true })
      
      // 搜索词书
      const searchParams = {
        'name-like': keyword
      }
      
      // 如果不是"我的词书"，添加分类码参数
      if (this.data.selectedCategoryCode !== '99') {
        searchParams['wordbook-category-code'] = this.data.selectedCategoryCode
      }
      
      const queryString = Object.keys(searchParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(searchParams[key])}`)
        .join('&')
      
      const searchResult = await common.request({
        url: `/wordbooks/search?${queryString}`
      })
      
      // 处理不同的返回格式
      let wordBooks = []
      if (Array.isArray(searchResult)) {
        // 直接返回数组格式
        wordBooks = searchResult
      } else if (searchResult && searchResult.data && Array.isArray(searchResult.data)) {
        // 包装在data字段中的格式
        wordBooks = searchResult.data
      } else if (searchResult && searchResult.wordBookList && Array.isArray(searchResult.wordBookList)) {
        // 包装在wordBookList字段中的格式
        wordBooks = searchResult.wordBookList
      }
      
      if (wordBooks && wordBooks.length > 0) {
        // 显示搜索结果
        // 先重置状态，再设置新数据，确保页面重新渲染
        this.setData({
          isSearching: false,
          searchResults: []
        })
        
        // 立即设置新的搜索结果
        this.setData({
          searchResults: wordBooks,
          isSearching: true,
          searchKeyword: keyword,
          showSearchBar: false,
          showOverlay: false
        })

      } else {
        Toast('未找到相关词书')
        this.setData({
          searchResults: [],
          isSearching: true,
          searchKeyword: keyword,
          showSearchBar: false,
          showOverlay: false
        })

      }
      
      Toast.clear()
    } catch (error) {
      console.error('搜索词书失败:', error)
      Toast.clear()
      Toast.fail('搜索失败，请重试')
    }
  },

  onClickHideOverlay: function () {
    this.setData({
      showSearchBar: false,
      showOverlay: false,
      showDicCard: false,
      keyboardHeight: 0
    })
  },

  /**
   * 清空搜索结果
   */
  onClearSearch: function () {
    this.setData({
      isSearching: false,
      searchResults: [],
      searchKeyword: ''
    })
  },

  onDicCardEvent: function (e) {
    // 处理词典卡片事件，可以根据需要扩展
    console.log('词典卡片事件:', e.detail)
  },



  /**
   * 选择词书
   */
  onSelectWordBook: function (e) {
    const book = e.currentTarget.dataset.book
    
    if (book.wordBookCode === this.data.currentWordBookCode) {
      Toast('当前已是学习词书')
      return
    }

    wx.showModal({
      title: '切换词书',
      content: `确定要切换到「${book.wordBookName}」吗？`,
      confirmText: '确定切换',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this._switchWordBook(book)
        }
      }
    })
  },

  /**
   * 切换词书
   */
  _switchWordBook: async function (book) {
    try {
      Toast.loading({ message: '切换中...', forbidClick: true })
      
      // 使用与分类词书相同的API调用方式
      // 1. 更新用户设置中的当前词书
      await common.request({
        url: '/settings',
        method: 'PUT',
        data: {
          currentWordBookCode: book.wordBookCode
        }
      })
      
      // 2. 设置词书为学习计划
      await common.request({
        url: '/wordbook',
        method: 'PUT',
        data: {
          wordBookCode: book.wordBookCode,
          isInLearningPlan: true
        }
      })
      
      // 更新全局数据
      app.globalData.settings.currentWordBookCode = book.wordBookCode
      
      // 更新词书状态
      book.isInLearningPlan = true
      book.userNum = book.userNum + 1
      
      // 更新当前页面状态
      this.setData({
        currentWordBookCode: book.wordBookCode
      })
      
      Toast.success('切换成功')
      
      // 设置标记，通知首页需要刷新数据
      wx.setStorageSync('needRefreshHomeData', true)
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      
    } catch (error) {
      console.error('Failed to switch wordbook:', error)
      Toast.clear()
      Toast.fail('切换失败，请稍后重试')
    }
  },



  /**
   * 发音功能
   */
  _pronounce: function (word) {
    if (!word) return
    
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings?.pronType == 'US' ? 0 : 1}`
    innerAudioContext.play()
    
    innerAudioContext.onError((res) => {
      console.error('音频播放失败:', res)
    })
  },

  /**
   * 下拉刷新
   */
  onScrollViewRefresh: function () {
    this._loadWordBookData()
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: '发现更多优质词书 - AceWord',
      path: 'pages/wordbook-all/wordbook-all'
    }
  }
})
