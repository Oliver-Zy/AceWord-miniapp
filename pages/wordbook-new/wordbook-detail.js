import { Common } from '../../models/common.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'

// Mock数据已移除，使用真实API

const common = new Common()
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    categoryCode: '',
    categoryName: '',
    subCategories: [],
    activeNames: [], // 展开的子分类
    currentWordBookCode: '',
    isLoaded: false,
    naviBarHeight: 44,
    scrollViewHeight: 600,
    showNaviBarDivider: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    const { categoryCode, categoryName } = options
    this.setData({
      categoryCode: categoryCode,
      categoryName: decodeURIComponent(categoryName || ''),
      // 重置页面状态，清除之前的数据
      activeNames: [],
      subCategories: [],
      isLoaded: false
    })
    
    this._setInitInfo()
    await this._loadCategoryDetail()
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
    
    // 获取当前词书代码
    const currentWordBookCode = app.globalData.settings?.currentWordBookCode || ''
    
    this.setData({
      naviBarHeight: menuButton.bottom + 6,
      scrollViewHeight: systemInfo.windowHeight - (menuButton.bottom + 6) - (app.globalData.isIOS ? 30 : 0),
      currentWordBookCode: currentWordBookCode
    })
  },

  /**
   * 加载分类详情
   */
  _loadCategoryDetail: async function () {
    try {
      // 检查页面是否还存在，避免异步竞争
      if (!this.data) return
      
      // 先清除可能存在的Toast，然后显示新的加载状态
      Toast.clear()
      Toast.loading({ message: '加载中...', forbidClick: true })
      
      // 调用真实API获取词书列表
      const wordBookListInfo = await common.request({
        url: `/wordbooks-official?wordbook-category-code=${this.data.categoryCode}`
      })
      
      // 处理词书数据，按子分类分组
      const wordBookList = wordBookListInfo.wordBookList || []
      const subCategoryMap = new Map()
      
      // 按子分类分组词书
      wordBookList.forEach(book => {
        const subCategoryCode = book.wordBookSubCategoryCode || 'default'
        const subCategoryName = book.wordBookSubCategoryName || '其他'
        
        if (!subCategoryMap.has(subCategoryCode)) {
          subCategoryMap.set(subCategoryCode, {
            subCategory: subCategoryCode,
            subCategoryName: subCategoryName,
            books: []
          })
        }
        
        subCategoryMap.get(subCategoryCode).books.push(book)
      })
      
      // 处理子分类数据
      const processedSubCategories = Array.from(subCategoryMap.values()).map(subCategory => {
        if (subCategory.books) {
          const processedBooks = subCategory.books.map(book => ({
            ...book,
            // 添加标签逻辑
            isHot: book.userNum > 50000,
            isNew: this._isNewBook(book.createTime),
            // 确保进度数据
            userProgressNum: book.userProgressNum || 0,
            totalWordNum: book.totalWordNum || 0
          }))
          
          return {
            ...subCategory,
            books: processedBooks
          }
        }
        return subCategory
      }).filter(subCat => subCat.books && subCat.books.length > 0)
      
      // 先设置数据，暂时不展开任何分类
      this.setData({
        subCategories: processedSubCategories,
        activeNames: [],
        isLoaded: true
      })
      
      Toast.clear()
      
      // 延迟一下确保组件状态完全重置，然后再设置默认展开
      setTimeout(() => {
        if (this.data && this.data.subCategories && this.data.subCategories.length > 0) {
          this.setData({
            activeNames: [this.data.subCategories[0].subCategory]
          })
        }
      }, 100)
    } catch (error) {
      console.error('Failed to load category detail:', error)
      Toast.clear()
      Toast.fail('加载失败，请稍后重试')
      this.setData({
        isLoaded: true,
        subCategories: [],
        activeNames: [] // 确保错误时也重置展开状态
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
    return daysDiff <= 90 // 3个月内的算新书
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
      message: `确定要切换到「${book.wordBookName}」吗？\n\n📚 词汇量：${book.totalWordNum}个单词\n👥 ${book.userNum}人正在学习`,
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
      
      // 调用真实API切换词书（与原逻辑保持一致）
      await common.request({
        url: '/settings',
        method: 'PUT',
        data: {
          currentWordBookCode: book.wordBookCode
        }
      })
      
      // 设置词书为学习计划（与原逻辑保持一致）
      await common.request({
        url: '/wordbook',
        method: 'PUT',
        data: {
          wordBookCode: book.wordBookCode,
          isInLearningPlan: true
        }
      })
      
      // 更新全局数据（与原逻辑保持一致）
      app.globalData.settings.currentWordBookCode = book.wordBookCode
      
      // 更新词书状态（与原逻辑保持一致）
      book.isInLearningPlan = true
      book.userNum = book.userNum + 1
      
      // 更新当前页面状态
      this.setData({
        currentWordBookCode: book.wordBookCode
      })
      
      Toast.success('切换成功')
      
      // 设置标记，通知首页需要刷新数据
      wx.setStorageSync('needRefreshHomeData', true)
      
      // 延迟返回首页
      setTimeout(() => {
        wx.navigateBack({
          delta: 2 // 返回到首页，跳过分类选择页
        })
      }, 1500)
      
    } catch (error) {
      console.error('Failed to switch wordbook:', error)
      Toast.clear()
      Toast.fail('切换失败，请稍后重试')
    }
  },

  /**
   * 分享功能
   */
  onShareAppMessage() {
    return {
      title: `${this.data.categoryName} - AceWord`,
      path: `pages/wordbook-new/wordbook-detail?categoryCode=${this.data.categoryCode}&categoryName=${encodeURIComponent(this.data.categoryName)}`
    }
  }
})
