Component({
  /**
   * 组件的属性列表
   */
  properties: {
    date: String,
    wordInfoList: Array,
    isLastCellGroup: Boolean,
    showMode: Number
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onCheckWord: function (e) {
      let index = e.currentTarget.dataset.index
      let wordInfo = this.data.wordInfoList[index]
      this.setData({
        [`wordInfoList[${index}].isChecked`]: !wordInfo.isChecked
      })
      this.triggerEvent('checkWord', {
        word: wordInfo.word,
        isChecked: wordInfo.isChecked
      })
    },

    /**
     * 监听点击删除事件
     *
     * @event
     * @param { Object } e 事件参数
     */
    onDeleteWord: async function (e) {
      if (e.detail == 'right') {
        this.triggerEvent('deleteWord', {
          word: this.data.wordInfoList[e.currentTarget.dataset.index].word
        }, {})
      }
    },

    /**
     * 监听点击单词事件
     *
     * @event
     * @param { Object } e 事件参数
     */
    onWord: async function (e) {
      this.triggerEvent('word', {
        word: this.data.wordInfoList[e.currentTarget.dataset.index].word
      }, {})
    },
  }
})