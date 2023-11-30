Component({
  /**
   * 组件的属性列表
   */
  properties: {
    placeholder: String,
    confirmtype: String,
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  lifetimes: {
    attached: function () {
      this.setData({ searchFieldWidth: wx.getSystemInfoSync().windowWidth - 16 - 62 })
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
    onFocus: function (e) {
      this.triggerEvent('focus', { height: e.detail.height })

      let currentPageList = getCurrentPages()
      let currentPage = currentPageList[currentPageList.length - 1]
      currentPage.setData({ keyboardHeight: e.detail.height })

      this.setData({ inputValue: '' })
      // this.setData({ inputValue: currentPage.data.dicCardList == undefined ? '' : currentPage.data.dicCardList[currentPage.data.currentSwiperIndex].selfDef == null ? currentPage.data.dicCardList[currentPage.data.currentSwiperIndex].wordCN : currentPage.data.dicCardList[currentPage.data.currentSwiperIndex].selfDef })
    },

    /**
     * 监听取消事件
     *
     * @event
     * @param { Object } e 事件参数
    */
    onCancel: function (e) {
      this.setData({ inputValue: '' })
      this.triggerEvent('cancel')
    },

    /**
    * 监听取消事件
    *
    * @event
    * @param { Object } e 事件参数
    */
    onConfirm: function (e) {
      this.triggerEvent('confirm', { value: e.detail.value })
    },
  }
})
