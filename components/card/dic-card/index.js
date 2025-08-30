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
    replaceButtonText: '换一个词',
  },

  lifetimes: {
    attached: function () {
      this.setData({ 
        dicCardWidth: wx.getSystemInfoSync().windowWidth - 40, 
        pronType: getApp().globalData.settings.pronType,
        isDarkMode: getApp().globalData.isDarkMode
      })
      this._updateReplaceButtonText()
      
      // 监听全局事件
      this._checkGlobalEvent = setInterval(() => {
        if (wx.eventBus && wx.eventBus.updateReplaceButtonText) {
          this._updateReplaceButtonText()
        }
      }, 50)
    },
    
    detached: function () {
      if (this._checkGlobalEvent) {
        clearInterval(this._checkGlobalEvent)
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 查看更多真题例句
     */
    onViewMoreExamples: function() {
      this.triggerEvent('dicCardEvent', {
        eventName: 'viewMoreExamples',
        wordInfo: this.data.wordInfo
      })
    },
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

    /**
     * 更新换词按钮文案
     */
    _updateReplaceButtonText: function() {
      // 内测期间暂时注释掉限制逻辑
      // const { dailyLimits } = require('../../../utils/dailyLimits.js')
      // const check = dailyLimits.canReplaceWord()
      
      let buttonText = '换一个词'
      // if (!check.allowed) {
      //   buttonText = '今日已达上限'
      // } else if (check.limit > 0 && check.remaining <= 3) {
      //   buttonText = `换词 (剩余${check.remaining}次)`
      // }
      
      this.setData({
        replaceButtonText: buttonText
      })
    },
  }
})
