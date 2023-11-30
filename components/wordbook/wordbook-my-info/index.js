Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordBookMyInfo: Object,
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的生命周期
  */
  lifetimes: {
    attached: function () {
      this.setData({ 
        downContainerWidth: wx.getSystemInfoSync().windowWidth - 16 * 2,
        isDarkMode: getApp().globalData.isDarkMode
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChangeDic: function () { this.triggerEvent('changeDic', { type: 'dicBook' }) }
  }
})
