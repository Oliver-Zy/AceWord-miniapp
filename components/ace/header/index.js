Component({
  /**
   * 组件的属性列表
   */
  properties: {
    titleType: String, // ['text', 'wordCard', 'wordGroup']
    text: String, // [titleType == 'text']
    date: String, // [titleType == 'wordCard']
    arrLen: Number, // [titleType == 'wordCard'、'wordGroup']

    iconType: String, // ['selectALl', 'learnRules']
    filterType: String, // ['today', 'practice']
    isSelectAll: Boolean,
    showMode: Number, // [english,chinese,both]
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
     * 监听点击新增单词卡片
     *
     * @event
     */
    onBtn: function (e) {
      let type = e.currentTarget.dataset.type
      switch (type) {
        case 'changeShowMode':
          // 
          this.setData({
            showMode: (this.data.showMode + 1) % 3
          })
          this.triggerEvent('headerEvent', {
            type: 'changeShowMode',
            showMode: this.data.showMode
          })
          break
        case 'selectAll':
          this.setData({
            isSelectAll: !this.data.isSelectAll
          })
          this.triggerEvent('headerEvent', {
            type: 'selectAll',
            isSelectAll: this.data.isSelectAll
          })
          break
        case 'learnRules':
          this.triggerEvent('headerEvent', {
            type: 'learnRules'
          })
          break
        case 'options':
          this.triggerEvent('headerEvent', {
            type: 'options'
          })
          break
        case 'feedback':
          this.triggerEvent('headerEvent', {
            type: 'feedback'
          })
          break
      }
    }
  }
})