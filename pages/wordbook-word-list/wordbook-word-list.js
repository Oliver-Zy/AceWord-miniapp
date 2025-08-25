// pages/wordbook-word-list/wordbook-word-list.js
import {
  HTTP
} from '../../utils/http.js'
import {
  Common
} from '../../models/common.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js'

const common = new Common()
const http = new HTTP()
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()

const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

    showActionSheet: false,
    actions: [{
      name: '显示全部单词',
    }, {
      name: '未学习单词',
    }, {
      name: '已学习单词',
    }],
    totalCount: 0,
    // 0,只显示英文，1只显示中文，2全显示
    showMode: 0,
    wordList: [],
    pageIndex: 1,
    startIndex: 0,
    endIndex: 0,
    hasNextPage: true
  },
  /**
   * 监听点击单词事件
   *
   * @event
   */
  onWord: async function (e) {
    console.log(e)
    Toast.loading()
    this.setData({
      showOverlay: false
    })
    let wordInfo = await common.request({
      url: `/wordinfo/search?word=${e.currentTarget.dataset.index.wordName}`
    })
    this._pronounce(e.currentTarget.dataset.index.wordName)
    Toast.clear()

    this.setData({
      showOverlay: true,
      showDicCard: true,
      wordInfo
    })
  },
  onDicCardEvent(e) {
    if(e.detail.type == 'pronounce'){
      this._pronounce(e.detail.word)
    }
    console.log(e)
  },
  onClickHideOverlay: function (e) {
    this.setData({
      showSearchBar: false,
      showDicCard: false,
      showOverlay: false,
      showDicCard: false,
      showShareCard: false,
      showDicCardSwiper: false
    })
  },
  onSelectActionSheet(e) {
    let option = e.detail.name;
    let pageIndex = 1
    let endIndex = 0
    let startIndex = 0
    switch (option) {
      case '显示全部单词': {
        break
      }
      case '未学习单词': {
        startIndex = this.data.book.userProgressNum
        break
      }
      case '已学习单词': {
        // endIndex
        endIndex = this.data.book.userProgressNum
        break
      }
    }

    this.setData({
      pageIndex,
      startIndex,
      endIndex,
      showActionSheet: false,
      wordList: []
    })

    this.fetchWordList()
  },
  onCloseActionSheet() {
    this.setData({
      showActionSheet: false
    })
  },
  onHeaderEvent(e) {
    // changeShowMode是切换中英
    // options是右侧选项
    let type = e.detail.type;
    if (type == 'options') {
      this.setData({
        showActionSheet: true
      })
      return;
    }

    if (type == 'changeShowMode') {
      this.setData({
        showMode: e.detail.showMode
      })
      return;
    }
  },
  onReachBottom() {
    if (!this.data.hasNextPage) {
      return
    }
    console.log("onReachBottom")
    this.setData({
      pageIndex: this.data.pageIndex + 1
    })

    this.fetchWordList()
  },
  async fetchWordList() {

    let data = await http.request({
      url: `/wordbook/wordlist?wordbook-code=${this.data.book.wordBookCode}&pageIndex=${this.data.pageIndex}&startIndex=${this.data.startIndex}&endIndex=${this.data.endIndex}`
    })
    console.log(data)
    this.setData({
      hasNextPage: data.hasNextPage,
      totalPage: data.totalPage,
      wordList: this.data.wordList.concat(data.data),
      totalCount: data.totalCount
    })
  },
  onTapRight(e) {
    let word = e.currentTarget.dataset.word;
    let wordList = this.data.wordList
    wordList.forEach(e => {
      if (e.wordName == word.wordName) {
        // 反着来
        if (e['show'] == undefined) {
          e['show'] = true
        } else {
          e['show'] = !e['show']
        }

      }
    })
    this.setData({
      wordList
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.book == null) {
      wx.navigateBack();
      return
    }

    this.setData({
      book: JSON.parse(options.book),
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6),
    })
    this.fetchWordList()

    // console.log(options.book.wordBookCode);
    // console.log(options.book.wordBookName);
    // console.log(options.book.totalWordNum);
    // console.log(options.book.userProgressNum);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },



  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },




  /**
   * 发音事件
   *
   * @inner
   */
  _pronounce: function (word) {
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 1 : 2}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {

      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 1 : 2}`

    })
  },
})