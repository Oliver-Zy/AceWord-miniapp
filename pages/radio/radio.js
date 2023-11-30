import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据wordNameCN
   */
  data: {
    wordIndex: 0,
    defListIndex: 0,
    isPlaying: true,
    playType: 'order',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // console.log(options)

    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,

      wordInfoList: app.globalData.radioInfo.wordInfoList,
      wordList: app.globalData.radioInfo.wordInfoList.map(item => item.word),
      pronType: app.globalData.settings.pronType,
      isDarkMode: app.globalData.isDarkMode,
    })

    this.onSound()
  },

  /**
   * 监听点击更多
   *
   * @event
   * @param { Object } e 事件参数
  */
  onBlur: function (e) {
    this.setData({ iswordNameCNBlur: !this.data.iswordNameCNBlur })
    this.setData({ isExplainAndExampleBlur: !this.data.isExplainAndExampleBlur })
  },

  /**
   * 监听点击更多
   *
   * @event
   * @param { Object } e 事件参数
  */
  onSwitchDefinition: function (e) {
    this.setData({ defListIndex: e.currentTarget.dataset.index })
  },

  /**
   * 监听点击更多
   *
   * @event
   * @param { Object } e 事件参数
  */
  onPlayList: function (e) {
    this.setData({ showPlayList: true, showOverlay: true })
  },

  onPlayType: function (e) {
    Toast('暂时仅支持顺序播放')
  },

  onPlayListCancel: function (e) {
    this.setData({ showPlayList: false, showOverlay: false })
  },

  onPlayListWord: function (e) {
    let wordIndex = e.detail.index
    this.data.innerAudioContext.destroy()
    this.setData({ wordIndex })
    this.onSound(this.data.wordList[wordIndex])
  },

  /**
    * 监听搜索事件
    *
    * @event
    * @param { Object } e 事件参数
  */
  onClickHideOverlay: function (e) {
    this.setData({ showPlayList: false, showOverlay: false, })
  },

  /**
  * 监听点击更多
  *
  * @event
  * @param { Object } e 事件参数
*/
  onLeftTouchstart: function (e) {
    this.setData({ ifLeftOpacity: true })
  },

  /**
    * 监听点击更多
    *
    * @event
    * @param { Object } e 事件参数
  */
  onPrev: function (e) {

    this.data.innerAudioContext.destroy()
    this.setData({ ifLeftOpacity: false, defListIndex: 0 })

    if (this.data.wordIndex == 0) {
      Toast('已经是第一个单词')
    } else {
      this.setData({ wordIndex: this.data.wordIndex - 1, isPlaying: true })
      this.onSound(this.data.wordInfoList[this.data.wordIndex].word)
    }

  },

  /**
    * 监听点击更多
    *
    * @event
    * @param { Object } e 事件参数
  */
  onRightTouchstart: function (e) {
    this.setData({ ifRightOpacity: true })
  },

  /**
    * 监听点击更多
    *
    * @event
    * @param { Object } e 事件参数
  */
  onNext: function (e) {

    this.data.innerAudioContext.destroy()
    this.setData({ ifRightOpacity: false, defListIndex: 0 })

    if (this.data.wordIndex == (this.data.wordInfoList.length - 1)) {

      Toast('播放完毕，即将从头开始播放')
      this.setData({ wordIndex :0 })
      this.onSound()

    } else {

      this.setData({ wordIndex: this.data.wordIndex + 1, isPlaying: true })
      this.onSound()

    }
  },

  /**
    * 监听点击更多
    *
    * @event
    * @param { Object } e 事件参数
  */
  onPlay: function (e) {
    this.setData({ isPlaying: !this.data.isPlaying })
    this.data.isPlaying ? this.data.innerAudioContext.play() : this.data.innerAudioContext.pause()
  },

  /**
    * 发音事件
    *
    * @event
  */
  onSound: function () {
    const innerAudioContext = wx.createInnerAudioContext()
    this.setData({ innerAudioContext })
    innerAudioContext.src = `https://cdn.uuorb.com/a4/listen/${this.data.wordList[this.data.wordIndex]}@1.mp3`
    innerAudioContext.play()
    innerAudioContext.onEnded((res) => {
      this.onNext()
    })
    innerAudioContext.onError((res) => {
      this.onNext()
    })
  },

  /**
   * 监听退出页面事件
   *
   * @inner
  */
  onUnload: function () {
    this.data.innerAudioContext.destroy()
  },

  /**
    * 发音事件
    *
    * @inner
  */
  _pronounce: function () {
    const innerAudioContext = wx.createInnerAudioContext()
    this.setData({ innerAudioContext })
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${this.data.wordList[this.data.wordIndex]}&type=${app.globalData.settings.pronType == 'US' ? 1 : 2}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {
      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${this.data.wordList[this.data.wordIndex]}&type=${app.globalData.settings.pronType == 'US' ? 1 : 2}`
    })
  },

  _shuffle: function (arr) {
    for (let i = arr.length; i; i--) {
      let j = Math.floor(Math.random() * i);
      [arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
    }

    return arr
  },
})