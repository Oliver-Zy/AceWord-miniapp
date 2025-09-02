// components/index/review-card/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    reviewCard: Object,
    isFinished: Boolean,
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
    * 生命周期
   */
  lifetimes: {
    attached: function () {
      let date = new Date()
      if (date.getHours() >= 10 && date.getHours() <= 22) {
        this.setData({ practiceUserNum: parseInt(Math.random() * (2000 - 1000) + 1000) })
      } else if (date.getHours() >= 8 && date.getHours() <= 2) {
        this.setData({ practiceUserNum: parseInt(Math.random() * (1000 - 500) + 500) })
      } else {
        this.setData({ practiceUserNum: parseInt(Math.random() * (200 - 100) + 100) })
      }

      this.setData({ isDarkMode: getApp().globalData.isDarkMode })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onReview: function () {
      this.triggerEvent('review', { showActionSheet: true })
    },
  }
})