import { Common } from '../../models/common.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
import mockDataService from '../../services/mockDataService.js'

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
    showNaviBarDivider: false
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
      
      // 使用mock数据
      const mockData = await this._loadMockData()
      
      // 如果有选中的分类，只显示该分类下的子分类
      let wordBookCategories = []
      
      if (this.data.selectedCategoryCode) {
        // 过滤出选中分类的词书
        const selectedCategory = mockData.categories.main_categories.find(
          cat => cat.code === this.data.selectedCategoryCode
        )
        
        if (selectedCategory) {
          // 获取该分类下的所有子分类，每个子分类作为一个折叠项
          const subCategories = mockData.categories.sub_categories.filter(
            subCat => subCat.parent_code === selectedCategory.code
          )
          
          // 每个子分类作为一个独立的分类项
          wordBookCategories = subCategories.map(subCat => ({
            categoryCode: subCat.code,
            categoryName: subCat.name,
            wordBooks: this._getWordBooksByCategory(mockData.wordbooks, selectedCategory.name, subCat.name)
          })).filter(cat => cat.wordBooks.length > 0)
        }
      } else {
        // 显示所有子分类（扁平化显示）
        const allSubCategories = []
        
        mockData.categories.main_categories.forEach(category => {
          const subCategories = mockData.categories.sub_categories.filter(
            subCat => subCat.parent_code === category.code
          )
          
          subCategories.forEach(subCat => {
            const wordBooks = this._getWordBooksByCategory(mockData.wordbooks, category.name, subCat.name)
            if (wordBooks.length > 0) {
              allSubCategories.push({
                categoryCode: subCat.code,
                categoryName: subCat.name,
                parentCategoryName: category.name,
                wordBooks: wordBooks
              })
            }
          })
        })
        
        wordBookCategories = allSubCategories
      }
      
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
   * 加载mock数据
   */
  _loadMockData: async function() {
    return await mockDataService.loadMockData()
  },

  /**
   * 根据分类获取词书
   */
  _getWordBooksByCategory: function(wordbooks, categoryName, subCategoryName) {
    // 从mock数据服务获取词书
    const books = mockDataService.getWordBooksByCategory(categoryName, subCategoryName)
    
    // 转换数据格式以匹配现有的处理逻辑
    const formattedBooks = books.map(book => ({
      wordBookCode: book.code,
      wordBookName: book.name,
      description: book.description,
      totalWordNum: book.total_word_num,
      userNum: book.userNum || 0,
      createTime: book.createTime,
      isHot: book.isHot,
      isNew: book.isNew
    }))
    
    return this._processWordBooks(formattedBooks)
  },

  /**
   * 处理词书数据
   */
  _processWordBooks: function (wordBooks) {
    return wordBooks.map(book => ({
      ...book,
      // 添加标签逻辑
      isHot: book.userNum > 1000, // 超过1000人学习标记为热门
      isNew: this._isNewBook(book.createTime), // 30天内创建的标记为新书
      // 确保进度数据
      userProgressNum: book.userProgressNum || 0,
      totalWordNum: book.totalWordNum || 0
    }))
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
   * 选择词书
   */
  onSelectWordBook: function (e) {
    const book = e.currentTarget.dataset.book
    
    if (book.wordBookCode === this.data.currentWordBookCode) {
      Toast('当前已是学习词书')
      return
    }

    Dialog.confirm({
      title: '切换词书',
      message: `确定要切换到「${book.wordBookName}」吗？`,
      confirmButtonText: '确定切换',
      cancelButtonText: '取消'
    }).then(() => {
      this._switchWordBook(book)
    }).catch(() => {
      // 用户取消
    })
  },

  /**
   * 切换词书
   */
  _switchWordBook: async function (book) {
    try {
      Toast.loading({ message: '切换中...', forbidClick: true })
      
      // 调用切换词书接口
      await common.request({
        url: '/user/switch-wordbook',
        method: 'POST',
        data: {
          wordBookCode: book.wordBookCode
        }
      })
      
      // 更新全局数据
      app.globalData.settings.currentWordBookCode = book.wordBookCode
      
      // 更新当前页面状态
      this.setData({
        currentWordBookCode: book.wordBookCode
      })
      
      Toast.success('切换成功')
      
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
