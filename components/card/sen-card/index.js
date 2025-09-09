import {
  Common
} from '../../../models/common.js'
const common = new Common()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    senCard: Object
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
      let currentPageList = getCurrentPages()
      let currentPage = currentPageList[currentPageList.length - 1]
      this.setData({
        route: currentPage.route == 'pages/sentence/sentence' ? 'sentence' : 'index'
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 监听点赞事件 - 已注释
     *
     * @event
     * @param { Object } e 事件参数
     */
    /*
    onLike: async function () {
      let currentPageList = getCurrentPages()
      let currentPage = currentPageList[currentPageList.length - 1]
      if (currentPage.route == 'pages/sentence/sentence') {

        wx.showModal({
          content: `当前页面暂时仅支持浏览`,
          showCancel: false,
          confirmText: '好的'
        })

      } else {

        this.setData({
          ['senCard.isLike']: !this.data.senCard.isLike,
          ['senCard.likeNum']: !this.data.senCard.isLike ? this.data.senCard.likeNum + 1 : this.data.senCard.likeNum - 1
        })
        await common.request({
          url: '/sen',
          method: 'PUT',
          data: {
            date: getApp().globalData.todayDate,
            isLike: this.data.senCard.isLike
          }
        })

      }
    },
    */

    /**
     * 监听分享事件
     *  
     * @event
     * @param { Object } e 事件参数
     */
    onShare: function () {
      let currentPageList = getCurrentPages()
      let currentPage = currentPageList[currentPageList.length - 1]
      if (currentPage.route == 'pages/sentence/sentence') {

        wx.showModal({
          content: `当前页面暂时仅支持浏览`,
          showCancel: false,
          confirmText: '好的'
        })

      } else currentPage.showShareCard()
    },

    /**
     * 监听点击单词事件
     *  
     * @event
     * @param { Object } e 事件参数
     */
    onEnglish: function (e) {
      let englishArr = this._englishHandler(this.data.senCard.english)
      let word = englishArr[parseInt(e.currentTarget.dataset.index)]
      word = word.replace(/[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g, '');
      word != 'nbsp' ? this.triggerEvent('senCardEvent', {
        type: 'search',
        word: word
      }) : ''
    },

    /**
     * 监听点击单词事件
     *  
     * @event
     * @param { Object } e 事件参数
     */
    _englishHandler: function (english) {
      var arr = english.split(' ')
      var arr_new = []
      for (var i = 0; i < arr.length; i++) {
        arr_new.push(arr[i])
        i != (arr.length - 1) ? arr_new.push('&nbsp;') : ''
      }

      return arr_new
    },
  }
})