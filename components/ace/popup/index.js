import Toast from "../../../miniprogram_npm/@vant/weapp/toast/toast"

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    type: String,
    wordGroupList: Array,
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
    /**
     * 监听点击单词事件
     *
     * @event
    */
    onAddWordGroup: function () {
      this.triggerEvent('addWordGroup')
    },

    /**
     * 监听点击单词事件
     *
     * @event
    */
    onCancel: function () {
      this.triggerEvent('cancel')
    },

    /**
     * 监听点击单词事件
     *
     * @event
    */
    onCheck: function (e) {
      let index_new = e.currentTarget.dataset.index
      let index_old = this.data.wordGroupList.findIndex(item => item.isChecked == true) == -1 ? -1 : this.data.wordGroupList.findIndex(item => item.isChecked == true) 
      // console.log(this.data.wordGroupList)
      // console.log(index_new)
      // console.log(index_old)

      if (index_old == -1) {

        this.setData({ [`wordGroupList[${index_new}].isChecked`]: !this.data.wordGroupList[index_new].isChecked })
        this.setData({ wordGroupIndex: index_new })

      } else if (index_new == index_old) {

        this.setData({ [`wordGroupList[${index_new}].isChecked`]: !this.data.wordGroupList[index_new].isChecked })
        if (this.data.wordGroupList[index_new].isChecked) this.setData({ wordGroupIndex: index_new })
        
      } else if (index_new != index_old) {

        this.setData({ [`wordGroupList[${index_new}].isChecked`]: !this.data.wordGroupList[index_new].isChecked })
        this.setData({ [`wordGroupList[${index_old}].isChecked`]: !this.data.wordGroupList[index_old].isChecked })
        this.setData({ wordGroupIndex: index_new })
        
      } 
    },

    /**
     * 监听点击单词事件
     *
     * @event
    */
    onCollectToWordGroup: function (e) {
      this.triggerEvent('collectToWordGroup', { index: this.data.wordGroupIndex, isCollected: this.data.wordGroupList[this.data.wordGroupIndex].isChecked })
    },
  }
})
