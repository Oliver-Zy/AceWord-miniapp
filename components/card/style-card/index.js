Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordInfo: Object,
    showReplaceBtn: Boolean,
    hiddenCollectBtn: Boolean,
    opacity: Number,
    bgColor: String,
    isVipExpired: Boolean,
  },

  /**
   * 组件的初始数据
   */
  data: {
    defListIndex: 0,
    isCollected: false,
  },

  lifetimes: {
    attached: function () {
      this.setData({
        dicCardWidth: wx.getSystemInfoSync().windowWidth - 40,
        pronType: getApp().globalData.settings.pronType,
        isDarkMode: getApp().globalData.isDarkMode,
        sliderValue: 100 - this.data.opacity,
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听点击关闭卡片
     *
     * @event
     * @param { String } word 单词名    
     */
    onClose: function () {
      this.triggerEvent('styleCardEvent', { type: 'close' })
    },

    /**
     * 监听进度条改变
     *
     * @event
     */
    onSliderChange: function (e) {
      this.setData({ sliderValue: e.detail })
      this.triggerEvent('styleCardEvent', { type: 'opacity', opacity: 100 - this.data.sliderValue })
    },

    /**
     * 监听进度条改变
     *
     * @event
     */
    onBgColor: function (e) {

      let bgColor = e.currentTarget.dataset.bgcolor
      if (this.data.isVipExpired && bgColor != 'yellow' && bgColor != 'none') {
  
        wx.showModal({
          title: '该功能为会员功能',
          content: '开通会员解锁全部背景色',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            // 泣释掉VIP页面跳转，改为显示客服联系弹窗
            /*
            wx.navigateTo({ url: `/pages/vip/vip?event=${'vip_textbgcolor'}` })
            */
            wx.showModal({
              title: '联系客服',
              content: '如需升级会员，请联系客服\n客服微信：MiddleRain_',
              confirmText: '复制',
              cancelText: '我知道了',
              success: (res) => {
                if (res.confirm) {
                  wx.setClipboardData({
                    data: 'MiddleRain_',
                    success: () => {
                      wx.showToast({
                        title: '客服微信号已复制',
                        icon: 'success'
                      })
                    },
                    fail: () => {
                      wx.showToast({
                        title: '复制失败，请手动复制：MiddleRain_',
                        icon: 'none',
                        duration: 3000
                      })
                    }
                  })
                }
              }
            })
          }
        })
  
      } else {
  
        this.setData({ bgColor })
        this.triggerEvent('styleCardEvent', { type: 'bgColor', bgColor: this.data.bgColor })
  
      }
    },

    /**
     * 监听复制单词事件
     *
     * @event
     * @param { String } word 单词名 
     */
    onCopyWord: function () {
      wx.setClipboardData({ data: this.data.wordInfo.word })
    },
  }
})