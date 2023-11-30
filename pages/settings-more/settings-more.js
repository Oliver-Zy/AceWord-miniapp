// pages/settings-more/settings-more.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)

    this.setData({ naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6 })
    this.setData({ type: options.type })
  },

})