import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js'
import { Common } from '../../models/common.js'
const common = new Common()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function() {

    this._setInitInfo()

    // setData: senCardList
    Toast.loading()
    let senCardList = await common.request({ url: `/senlist?year=2023&month=11` })
    Toast.clear()
    this.setData({ senCardList })
  },

    /**
   * 监听标题栏事件
   *
   * @event
  */
  onHeaderEvent: function (e) {

    if (e.detail.type == 'feedback') {

      wx.showModal({
        content: `反馈问题或提供句子请添加微信：Ace-Oliver`,
        showCancel: false,
        confirmText: '好的'
      })

    }

  },


  /**
   * 生命周期事件
   *
   * @event
  */
  onScroll: function (e) {
    e.detail.scrollTop > 50 ? this.setData({ showNaviBarDivider: true }) : this.setData({ showNaviBarDivider: false })
  },

  /**
   * 设置初始位置信息
   *
   * @inner
  */
  _setInitInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6),

      isIOS: app.globalData.isIOS,
    })
  },
})