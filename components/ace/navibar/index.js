const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // type = ["search", "calendar", "mine", "back", "practice"]
    type: String,
    backgroundColor: String,
    title: String,
    showDivider: Boolean,
    showVantDivider: Boolean,
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
      let capsuleInfo = wx.getMenuButtonBoundingClientRect()
      this.setData({
        naviBarHeight: capsuleInfo.bottom + 6,
        searchBarWidth: capsuleInfo.right - capsuleInfo.width - 20 - 16,
        // 带返回按钮的搜索框宽度：需要减去返回按钮宽度(24px) + 左右间距(16px + 8px + 8px + 16px)
        searchBarWithBackWidth: capsuleInfo.right - capsuleInfo.width - 20 - 16 - 24 - 32,
        searchBarHeight: capsuleInfo.height,
        windowHeight: wx.getSystemInfoSync().windowHeight,
        
        isDarkMode: app.globalData.isDarkMode
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听搜索事件
     *
     * @event
     * @param { Object } e 事件参数
    */
    onSearch: function () {
      let currentPageList = getCurrentPages()
      let currentPage = currentPageList[currentPageList.length - 1]
      currentPage.setData({ showSearchBar: true, showOverlay: true })
    },

    /**
      * 监听返回事件
      *
      * @event
      * @param { Object } e 事件参数
    */
    onBack: function () {
      this.triggerEvent('back')
      wx.navigateBack()
    },
  }
})
