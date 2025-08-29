import { Common } from '../../models/common.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'

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
    await this._loadWordBookData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置状态栏颜色
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
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
      Toast.loading({ message: '加载中...', forbidClick: true })
      
      // 获取所有词书分类
      const categories = await common.request({ url: '/wordbook-categories' })
      
      // 为每个分类加载词书列表
      const wordBookCategories = await Promise.all(
        categories.map(async (category) => {
          try {
            const wordBookListInfo = await common.request({
              url: `/wordbooks-official?wordbook-category-code=${category.wordBookCategoryCode}`
            })
            
            return {
              categoryCode: category.wordBookCategoryCode,
              categoryName: category.wordBookCategoryName,
              wordBooks: this._processWordBooks(wordBookListInfo.wordBookList || [])
            }
          } catch (error) {
            console.error(`Failed to load wordbooks for category ${category.wordBookCategoryCode}:`, error)
            return {
              categoryCode: category.wordBookCategoryCode,
              categoryName: category.wordBookCategoryName,
              wordBooks: []
            }
          }
        })
      )

      // 过滤掉空分类
      const filteredCategories = wordBookCategories.filter(cat => cat.wordBooks.length > 0)
      
      // 将"计划"分类排在最前面
      const sortedCategories = filteredCategories.sort((a, b) => {
        const aIsPlan = a.categoryName === '计划' || a.categoryCode === 'plan'
        const bIsPlan = b.categoryName === '计划' || b.categoryCode === 'plan'
        
        if (aIsPlan && !bIsPlan) return -1
        if (!aIsPlan && bIsPlan) return 1
        return 0
      })
      
      console.log('Categories sorted with plan first:')
      console.log('Sorted categories:', sortedCategories.map(cat => ({
        name: cat.categoryName,
        code: cat.categoryCode
      })))
      
      // 默认不展开任何分类
      this.setData({
        wordBookCategories: sortedCategories,
        activeNames: [],
        isLoaded: true,
        isRefresherTriggered: false
      })
      
      Toast.clear()
    } catch (error) {
      console.error('Failed to load wordbook data:', error)
      Toast.fail('加载失败，请稍后重试')
      this.setData({
        isLoaded: true,
        isRefresherTriggered: false
      })
    }
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
