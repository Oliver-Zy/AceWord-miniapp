Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordList: Array,
    wordIndex: Number,
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
        scrollViewHeight: wx.getSystemInfoSync().windowHeight * 0.66 - 64,
        isIOS: getApp().globalData.isIOS,
      })
    },
  },


  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 监听选中事件
     *
     * @event
    */
    onCancel: function () {
      this.triggerEvent('cancel', { type: 'cancel' })
    },

    /**
     * 监听选中事件
     *
     * @event
    */
    onWord: function (e) {
      this.triggerEvent('word', { index: e.currentTarget.dataset.index })
    },
  }
})
