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
    continuousDays: Number, // [type == 'calendar'] 连续打卡天数
  },

  /**
   * 组件的初始数据
   */
  data: {
    isDarkMode: false,
    naviBarHeight: 0,
    searchBarWidth: 0,
    searchBarWithBackWidth: 0,
    searchBarHeight: 0
  },

  /**
   * 组件的生命周期 
   */
  lifetimes: {
    attached: function () {
      this.setData({
        isDarkMode: getApp().globalData.isDarkMode
      })
      this._initNaviBarHeight()
    },
    ready: function () {
      // 确保组件完全准备好后再次检查高度
      this._initNaviBarHeight()
    }
  },


  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化导航栏高度
     */
    _initNaviBarHeight: function () {
      try {
        let capsuleInfo = wx.getMenuButtonBoundingClientRect()
        const naviBarHeight = capsuleInfo.bottom + 6
        
        this.setData({
          naviBarHeight: naviBarHeight,
          searchBarWidth: capsuleInfo.right - capsuleInfo.width - 20 - 16,
          // 带返回按钮的搜索框宽度：需要减去返回按钮宽度(24px) + 左右间距(16px + 8px + 8px + 16px)
          searchBarWithBackWidth: capsuleInfo.right - capsuleInfo.width - 20 - 16 - 24 - 32,
          searchBarHeight: capsuleInfo.height,
          windowHeight: wx.getSystemInfoSync().windowHeight,
          
          isDarkMode: app.globalData.isDarkMode
        })
        
        // 通知父页面导航栏高度已确定
        this.triggerEvent('navibarready', { naviBarHeight: naviBarHeight })
      } catch (error) {
        console.error('导航栏高度初始化失败:', error)
        // 使用默认值作为备用方案
        const defaultHeight = 88 // 一般情况下的默认高度
        this.setData({
          naviBarHeight: defaultHeight,
          isDarkMode: app.globalData.isDarkMode
        })
        this.triggerEvent('navibarready', { naviBarHeight: defaultHeight })
      }
    },

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
