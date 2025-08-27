// components/ace/button/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    size: String,
    text: String,
    textLeft: String,
    textRight: String,
    isLowRemaining: Boolean,
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
        isDarkMode: getApp().globalData.isDarkMode
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 添加单词卡片
     *
     * @event 
     */
    onTap: function (e) {
      this.triggerEvent('btnEvent', {
        name: e.currentTarget.dataset.name
      })
    }
  }
})