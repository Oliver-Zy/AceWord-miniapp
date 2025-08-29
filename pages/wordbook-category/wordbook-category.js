import { Common } from '../../models/common.js'
const common = new Common()

// import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
// const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    this._setInitPosiInfo()

    // set globalData: settings
    let wordBookCategoryList = await common.request({ url: `/wordbook-categories` })
    wordBookCategoryList.unshift(wordBookCategoryList.splice(wordBookCategoryList.length - 1)[0])
    this.setData({ wordBookCategoryList })
  },

  /**
   * 点击词书分类事件
   *
   * @event
  */
  onWordBookCategory: function (e) {
    let wordBookCategoryCode = e.currentTarget.dataset.wordbookcategorycode
    let wordBookCategoryName = e.currentTarget.dataset.wordbookcategoryname || ''
    wx.navigateTo({ 
      url: `../wordbook-new/wordbook-detail?isCustom=${false}&categoryCode=${wordBookCategoryCode}&categoryName=${encodeURIComponent(wordBookCategoryName)}` 
    })
  },

  /**
   * 监听退出页面事件
   *
   * @inner
  */
  onUnload: function () {
    if (!this.data.isBackReLoad) return
    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]
    prevPage.onLoad()
  },

  /**
   * 设置初始位置信息
   *
   * @inner
  */
  _setInitPosiInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 48 - 30,
      wordBookCategoryWidth: (wx.getSystemInfoSync().windowWidth - 3 * 16) / 2
    })
  },
})