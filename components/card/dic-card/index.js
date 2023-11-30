Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordInfo: Object,
    showReplaceBtn: Boolean,
    showStyleBtn: Boolean,
    hiddenCollectBtn: Boolean,
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
        isDarkMode: getApp().globalData.isDarkMode
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听收藏单词
     *
     * @event 
    */
    onCollect: function () {
      this.setData({ ['wordInfo.isCollected']: !this.data.wordInfo.isCollected })
      this.triggerEvent('dicCardEvent', { type:'collect', word: this.data.wordInfo.word, isCollected: this.data.wordInfo.isCollected })
    },

    /**
     * 监听切换释义
     *
     * @event 
    */
    onSwitchDefinition: function (e) {
      this.setData({ defListIndex: e.currentTarget.dataset.index })
    },

    /**
     * 监听删除单词
     *
     * @event
     * @param { String } wordCardID 事件参数    
     * @param { String } word 单词名    
    */
    onDelete: function () {
      this.triggerEvent('dicCardEvent', { type: 'delete', word: this.data.wordInfo.word })
    },

    /**
     * 监听替换单词
     *
     * @event
     * @param { String } wordCardID 事件参数    
     * @param { String } wordBookCode 词典编码   
     * @param { String } word 单词名     
    */
    onReplace: async function (e) {
      this.triggerEvent('dicCardEvent', { type: 'replace', word: this.data.wordInfo.word })
    },

    /**
     * 监听点击自定义编辑
     *
     * @event
     * @param { String } word 单词名    
    */
    onSelfDef: function() {
      this.triggerEvent('dicCardEvent', { type:'selfDef', word: this.data.wordInfo.word })
    },

    /**
     * 监听点击自定义编辑
     *
     * @event
     * @param { String } word 单词名    
    */
    onPronounce: function() {
      this.triggerEvent('dicCardEvent', { type:'pronounce', word: this.data.wordInfo.word })
    },

    /**
     * 监听点击自定义编辑
     *
     * @event
     * @param { String } word 单词名    
    */
    onWordGroup: function() {
      this.triggerEvent('dicCardEvent', { type:'wordGroup', word: this.data.wordInfo.word, isCollected: this.data.wordInfo.isCollected })
    },

    /**
     * 监听复制单词事件
     *
     * @event
     * @param { String } word 单词名 
    */
    onCopyWord: function() {
      wx.setClipboardData({
        data: this.data.wordInfo.word,
      })
    },

    /**
     * 监听点击自定义编辑
     *
     * @event
     * @param { String } word 单词名    
    */
    onShowStyleCard: function() {
      this.triggerEvent('dicCardEvent', { type:'showStyleCard', word: this.data.wordInfo.word })
    },
  }
})
