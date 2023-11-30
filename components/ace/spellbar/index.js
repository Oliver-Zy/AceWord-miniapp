// components/ace/search-bar/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    focus: true
  },

  lifetimes: {
    attached: function () {

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
      this.triggerEvent('focus', {
        height: e.detail.height
      })
    },

    onBlur: function (e) {
      this.triggerEvent('blur', {})
    },

    /**
     * 监听搜索事件
     *
     * @event
     * @param { Object } e 事件参数
     */
    // onChange: function (e) {
    //   console.log(e.detail)
    //   this.setData({ inputValue: e.detail })
    // },

    /**
     * 监听键盘完成按钮点击事件
     *
     * @event
     * @param { Object } e 事件参数
     */
    onConfirm: function (e) {
      let that = this
      this.setData({
        focus: false
      })

      setTimeout(() => {
        that.triggerEvent('spellBarEvent', {
          type: 'confirm',
          word: e.detail
        })
        that.setData({
          focus: false
        })
      }, 10);
    },

    /**
     * 监听输入框右侧，检测按钮点击事件
     * 需要让input短暂失焦
     *
     * @event
     * @param { Object } e 事件参数
     */
    onTapConfirm: function (e) {
      // 应该焦点转移
      this.setData({
        focus: false
      })
      let that = this
      setTimeout(() => {
        that.triggerEvent('spellBarEvent', {
          type: 'confirm',
          word: this.data.inputValue
        })
        that.setData({
          focus: true
        })
      }, 100);
    },

    /**
     * 监听提示事件
     *
     * @event
     * @param { Object } e 事件参数
     */
    onHint: function (e) {
      this.triggerEvent('spellBarEvent', {
        type: 'hint'
      })
    },

    // /**
    //   * 监听取消事件
    //   *
    //   * @event
    //   * @param { Object } e 事件参数
    // */
    // onCancel: function (e) {
    //   this.setData({ inputValue: '' })
    //   // this.triggerEvent('spellBarEvent', { type: 'cancel' })
    // },
  }
})