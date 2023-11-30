Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordBook: Object,
    currentWordBookCode: String,
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
        dailyTargetNum: getApp().globalData.settings.dailyTargetNum,
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
      this.triggerEvent('wordBook')
    }
  }
})
