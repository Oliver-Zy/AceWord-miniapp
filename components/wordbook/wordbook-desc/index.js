const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordBook: Object
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
        rightContainerWidth: wx.getSystemInfoSync().windowWidth - 16 * 3 - 14 * 2 - 67,
        bookCoverImg: Math.floor(Math.random() * 5 + 1),
        dailyTargetNum: app.globalData.settings.dailyTargetNum
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听点击词书卡片
     *
     * @event
    */
    onWordBook() {
      this.triggerEvent('wordBook', { wordBook: this.data.wordBook }, {})
    }
  }
})
