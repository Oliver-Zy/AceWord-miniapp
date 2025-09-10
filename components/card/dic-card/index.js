const { dailyLimits } = require('../../../utils/dailyLimits.js')

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
    showPopupVant: false,
    showActionSheet: false,
    actionSheetDesc: '操作选项',
    actions: []
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
     * 显示操作菜单
     *
     * @event
    */
    onShowActionSheet: function() {
      // 检查换词限制
      const check = dailyLimits.canReplaceWord()
      let actionName = '换个单词'
      let subname = '从当前词书中替换一个新单词'
      
      // 如果有限制且剩余次数 <= 5，显示剩余次数
      if (check.remaining !== -1 && check.remaining <= 5) {
        if (check.remaining > 0) {
          actionName = `换个单词（剩余${check.remaining}次）`
        } else {
          actionName = '换个单词（已达上限）'
          subname = '升级会员解锁无限换词'
        }
      }
      
      const actions = [
        { name: actionName, subname: subname }
      ]
      
      this.setData({
        showPopupVant: true,
        showActionSheet: true,
        actions: actions
      })
    },

    /**
     * 取消操作菜单
     */
    onCancelActionSheet: function() {
      this.setData({
        showPopupVant: false,
        showActionSheet: false
      })
    },

    /**
     * 选择操作菜单项
     */
    onSelectActionSheet: function(e) {
      const { name } = e.detail
      
      // 先关闭弹窗
      this.onCancelActionSheet()
      
      // 检查是否超出限制
      if (name.includes('已达上限')) {
        // 引导用户升级会员
        this.triggerEvent('dicCardEvent', { type: 'showVip' })
        return
      }
      
      // 执行换个单词操作
      if (name.includes('换个单词')) {
        this.onReplace()
      }
    },

    /**
     * 更新换词按钮文案
     */
    _updateReplaceButtonText: function() {
      const check = dailyLimits.canReplaceWord()
      
      let buttonText = '换一个词'
      if (!check.allowed) {
        buttonText = '今日已达上限'
      } else if (check.remaining !== -1 && check.remaining <= 3) {
        buttonText = `换词 (剩余${check.remaining}次)`
      }
      
      this.setData({
        replaceButtonText: buttonText
      })
    },
  }
})
