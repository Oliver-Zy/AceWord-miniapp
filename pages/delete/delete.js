import { Common } from '../../models/common.js'
import { HTTP } from '../../utils/http.js'
const common = new Common()
const http = new HTTP()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordCardList: [],
    currentSwiperIndex: 0,
    wordCardIDCheckedList: [],
  },

  /**
   * 生命周期函数--监听页面加载
  */
  onLoad: async function (options) {

    this._setInitInfo()

    // get & setData: wordBookCodeToName
    let wordBookCodeToName =  await common.request({ url: `/wordbooks-map` })
    this.setData({ wordBookCodeToName })

    // setData: wordCardList
    Toast.loading()
    let pageInfo = await common.request({ url: `/wordcards?isdeleted=${true}` })
    let wordCardList = this._updateWordCardList(pageInfo.data)
    this.setData({ wordCardList })

    this.setData({ isRefresherTriggered: false })
    Toast.success({ message: '加载成功', duration: 1000 })

  },

  /**
   * 监听点击取消事件
   *
   * @event
   * @param { Object } e 事件参数
  */
  onClickHideOverlay: function (e) {
    this.setData({ showSearchBar: false, showOverlay: false, showDicCard: false, showShareCard: false, showDicCardSwiper: false })
  },

  onClickHideOverlayZIndex: function (e) {
    this.setData({ showSearchBarSelfDef: false, showOverlayZIndex: false, showPopup: false })
  },

  onCancelActionSheet: function () {
    this.setData({ showPopupVant: false, showActionSheet: false })
  },

  /**
   * 监听标题栏事件
   *
   * @event
  */
  onHeaderEvent: function (e) {

    let isSelectAll = e.detail.isSelectAll
    let wordCardIDCheckedList = this.data.wordCardIDCheckedList

    if (e.detail.type == 'selectAll' && isSelectAll) {

      wordCardIDCheckedList = this.data.wordCardList.map(item => item.wordCardID)
      this.setData({ showPracticeBtn: true, wordCardIDCheckedList })

    } else if (e.detail.type == 'selectAll' && !isSelectAll) {

      this.setData({ showPracticeBtn: false, wordCardIDCheckedList: [] })

    }
  },

  /**
   * 练习相关事件
   *
   * @event
  */
  onPractice: async function () {
    this.setData({ showPopupVant: true, actionSheetType: 'practice', showActionSheet: true, actionSheetDesc: '选择练习模式', actions: [{ name: '记忆模式', subname: '循环迭代记忆法，激发你的记忆潜力' }, { name: '复习模式', subname: '单词一遍过，快速检测掌握情况' }, { name: '拼写模式', subname: '默认开启拼写栏，深度巩固已学单词' }] })
  },

  /**
   * 监听单词卡片事件
   *
   * @event
   * @param { Object } e 事件参数
  */
  onWordCardEvent: async function (e) {
    let currentWordCard = e.detail.currentWordCard
    let currentSwiperIndex = e.detail.currentSwiperIndex

    let wordCardList = this.data.wordCardList
    let currentWordCardIndex = e.currentTarget.dataset.index
    let wordList = wordCardList.find(item => item.wordCardID == currentWordCard.wordCardID).wordList
    this.setData({ currentWordCard, currentSwiperIndex, currentWordCardIndex })

    if (e.detail.type == 'showDic') {

      Toast.loading({ forbidClick: true })
      let wordInfo = await common.request({ url: `/wordinfo/search?word=${wordList[currentSwiperIndex]}` })
      Toast.clear()
      this._pronounce(wordList[currentSwiperIndex])
      this._getDicCardList(wordInfo, wordList, currentSwiperIndex)

    } else if (e.detail.type == 'delete') {

      let isDeleted = wordCardList[currentWordCardIndex].isDeleted

      wx.showModal({ title: '提示', content: `${isDeleted ? '是否恢复该卡片？' : '是否删除该卡片？（后续将不再出现在复习计划）'}`, showCancel: true, confirmText: '确认', }).then(res => {
        if (res.confirm) {
          http.request({ url: '/wordcard', method: 'PUT', data: { wordCardID: currentWordCard.wordCardID, isDeleted: !isDeleted } }).then(res => {
            // console.log(res)

            Toast.success(`${isDeleted ? '恢复成功' : '删除成功'}`)
            this.setData({
              [`wordCardList[${currentWordCardIndex}]._relatedAction`]: 'deleteWordCard',
              [`wordCardList[${currentWordCardIndex}].isDeleted`]: !isDeleted
            })
          })
        } 
      })

    } else if (e.detail.type == 'check') {

      let wordCardIDCheckedList = this.data.wordCardIDCheckedList
      if (currentWordCard.isChecked) {
        wordCardIDCheckedList.push(currentWordCard.wordCardID)
      } else wordCardIDCheckedList.splice(wordCardIDCheckedList.indexOf(currentWordCard.wordCardID), 1)
      this.setData({ wordCardIDCheckedList, showPracticeBtn: wordCardIDCheckedList.length == 0 ? false : true })

    }

  },

  /**
   * 监听swiper变化
   *
   * @event
   * @param { Object } e 事件参数
  */
  onSwiperChange: async function (e) {

    let previousSwiperIndex = this.data.currentSwiperIndex
    let currentSwiperIndex = e.detail.current
    let wordList = this.data.wordCardList[this.data.currentWordCardIndex].wordList
    let wordInfo = await common.request({ url: `/wordinfo/search?word=${wordList[currentSwiperIndex]}`, method: 'GET' })
    wordInfo.isActive = true

    let dicCardList = this.data.dicCardList
    dicCardList[currentSwiperIndex] = wordInfo
    dicCardList[previousSwiperIndex].isActive = false

    this._pronounce(wordInfo.word)
    this.setData({ dicCardList, currentSwiperIndex })

  },

  /**
   * 监听单词卡片事件
   *
   * @event
  */
  onDicCardEvent: async function (e) {

    let currentSwiperIndex = e.currentTarget.dataset.index
    let currentWordCardIndex = this.data.currentWordCardIndex

    if (e.detail.type == 'selfDef') {

      this.setData({ showSearchBarSelfDef: true, showOverlay: true, showOverlayZIndex: true })

    } else if (e.detail.type == 'collect') {

      if (this.data.showDicCardSwiper) {
        this.setData({ [`dicCardList[${currentSwiperIndex}].isCollected`]: e.detail.isCollected })
      } else this.setData({ [`wordInfo.isCollected`]: e.detail.isCollected })
      await common.request({ method: 'PUT', url: `/wordinfos`, data: [{ word: e.detail.word, isCollected: e.detail.isCollected }] })
      e.detail.isCollected ? Toast('　　　收藏成功　　　\n长按可选择单词本分组') : Toast('已取消收藏')

    } else if (e.detail.type == 'wordGroup') {

      if (e.detail.isCollected) {
        Toast('请先取消收藏')
      } else {
        Toast.loading()
        let wordGroupList = await common.request({ url: '/wordgroup' })
        Toast.clear()

        let defaultWordGroup = wordGroupList.splice(wordGroupList.findIndex(item => item.id == 0), 1)[0]
        wordGroupList.unshift(defaultWordGroup)
        wordGroupList = wordGroupList.map(item => { item.isChecked = false; return item })
        this.setData({ wordGroupList, showOverlayZIndex: true, showPopup: true })
      }

    } else if (e.detail.type == 'pronounce') {

      this._pronounce(e.detail.word)

    } else if (e.detail.type == 'replace') {

      Toast.loading({ forbidClick: true })
      let word = await common.request({ url: `/wordcard/word`, method: 'PUT', data: { word: e.detail.word, wordBookCode: this.data.currentWordCard.wordBookCode, wordCardID: this.data.currentWordCard.wordCardID } })
      let wordInfo = await common.request({ url: `/wordinfo/search?word=${word}` })
      Toast.clear()

      this._pronounce(word)
      wordInfo.isActive = true
      this.setData({
        [`dicCardList[${currentSwiperIndex}]`]: wordInfo,
        [`wordCardList[${currentWordCardIndex}].wordInfoList[${currentSwiperIndex}]`]: { wordName: word, opacity: 100 },
        [`wordCardList[${currentWordCardIndex}].wordList[${currentSwiperIndex}]`]: word,
        [`wordCardList[${currentWordCardIndex}]._relatedAction`]: 'replaceWord',
      })
    }
  },

  /**
   * 监听添加词汇到单词本事件
   *
   * @event
   * @param { Object } e 事件参数
  */
  onCollectToWordGroup: async function (e) {

    if (this.data.showDicCardSwiper) {

      let wordList = this.data.wordCardList[this.data.currentWordCardIndex].wordList
      let word = wordList[this.data.currentSwiperIndex]
      this.setData({ [`dicCardList[${this.data.currentSwiperIndex}].isCollected`]: true })
      let data = [{ word: word, wordGroupID: this.data.wordGroupList[e.detail.index].id, isCollected: e.detail.isCollected }]
      await common.request({ url: `/wordinfos`, data: data, method: 'PUT' })

    } else {

      let data = [{ word: this.data.wordInfo.word, wordGroupID: this.data.wordGroupList[e.detail.index].id, isCollected: e.detail.isCollected }]
      this.setData({ [`wordInfo.isCollected`]: true })
      await common.request({ url: `/wordinfos`, data: data, method: 'PUT' })

    }

    Toast.success('添加成功')
    this.setData({ showOverlayZIndex: false, showPopup: false })
  },

  /**
   * 创建单词本相关事件
   *
   * @event
   * @param { Object } e 事件参数
  */
  onAddWordGroup: function (e) {
    this.setData({ showFieldDialog: true })
  },

  onFieldDialogCancel: async function (e) {
    this.setData({ fieldValue: '' })
  },

  onFieldChange(e) {
    this.setData({ wordGroupName: e.detail })
  },

  onFieldDialogConfirm: async function (e) {
    try {

      let wordGroup = await common.request({ url: '/wordgroup', method: 'POST', data: { wordGroupName: this.data.wordGroupName } })
      Toast.success('创建成功')
      this.data.wordGroupList.unshift(wordGroup)
      this.setData({ fieldValue: '', wordGroupList: this.data.wordGroupList })

    } catch (err) {

      // console.log(err)
      if (err.errcode == 410) {
        wx.showModal({
          title: '用量已达上限',
          content: '开通会员解锁更多单词本用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            // 注释掉VIP页面跳转，改为显示客服联系弹窗
            /*
            wx.navigateTo({ url: `/pages/vip/vip?event=${'vip_wordgroup'}` })
            */
            wx.showModal({
              title: '联系客服',
              content: '如需升级会员，请联系客服\n客服微信：MiddleRain_',
              confirmText: '复制',
              cancelText: '我知道了',
              success: (res) => {
                if (res.confirm) {
                  wx.setClipboardData({
                    data: 'MiddleRain_',
                    success: () => {
                      wx.showToast({
                        title: '客服微信号已复制',
                        icon: 'success'
                      })
                    },
                    fail: () => {
                      wx.showToast({
                        title: '复制失败，请手动复制：MiddleRain_',
                        icon: 'none',
                        duration: 3000
                      })
                    }
                  })
                }
              }
            })
          }
        })
      }

    }
  },

  /**
   * 监听点击新增单词卡片事件
   *
   * @event
  */
  onAddWordCard: async function () {

    let wordCardList = this.data.wordCardList
    if (wordCardList.length == 1 && wordCardList[0]._type == 'blank') {

      wordCardList.shift(), wordCardList.push({ _type: 'loading' })

    } else {

      wordCardList.forEach((item, index) => wordCardList[index]._relatedAction = 'addWordCard')
      wordCardList.push({ _type: 'loading' })
      this.setData({ wordCardList })

    }

    let wordCard = await common.request({ url: '/wordcard', method: 'POST' })
    wordCardList.pop(), wordCardList.push(wordCard)
    this.setData({ wordCardList: this._updateWordCardList(wordCardList) })
    this.setData({ toView: 'scrollBottom' })
  },

  /**
   * 监听选择弹出框事件
   *
   * @event
  */
  onSelectActionSheet: function (e) {
    let actionSheetType = this.data.actionSheetType
    if (actionSheetType == 'practice') {
      this._onSelectActionSheetPractice(e)
    }
  },

  _onSelectActionSheetPractice: async function (e) {

    Toast.loading({ forbidClick: true })
    setTimeout(() => { this.onCancelActionSheet() }, 400)

    // let wordList = this._getWordListFromWordCardIDCheckedList(this.data.wordCardIDCheckedList)
    app.globalData.practiceInfo = {}
    app.globalData.practiceInfo.wordInfoList = await common.request({ url: `/wordinfos/search?word-card-id-list=${this.data.wordCardIDCheckedList.join(',')}` })
    app.globalData.practiceInfo.wordCardIDCheckedList = this.data.wordCardIDCheckedList

    app.globalData.practiceInfo.practiceMode = e.detail.name == '记忆模式' ? 'memorize' : e.detail.name == '复习模式' ? 'review' : 'spell'
    wx.navigateTo({ url: '../practice/practice?entryPage=deleted' })

  },

  /**
   * 生命周期事件
   *
   * @event
  */
  onScroll: function (e) {
    e.detail.scrollTop > 50 ? this.setData({ showNaviBarDivider: true }) : this.setData({ showNaviBarDivider: false })
  },

  /**
   * 设置初始位置信息
   *
   * @inner
  */
  _setInitInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6),

      isIOS: app.globalData.isIOS,
    })
  },

  /**
   * 设置初始位置信息
   *
   * @inner
  */
  _getDicCardList: function (wordInfo, wordList, currentSwiperIndex) {
    let dicCardList = []

    for (let i = 0; i < wordList.length; i++) dicCardList[i] = {}
    dicCardList = dicCardList.map((item, index) => {
      if (index == currentSwiperIndex) {
        wordInfo.isActive = true
        wordInfo.currentWordCard = this.data.currentWordCard
        currentSwiperIndex = index
        return wordInfo
      } else return { isActive: false }
    })

    this.setData({ showOverlay: true, showDicCardSwiper: true, dicCardList, currentSwiperIndex })
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

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
  */
  _getWordListFromWordCardIDCheckedList: function (wordCardIDCheckedList) {

    let wordCardList = this.data.wordCardList
    let wordList = Array()

    for (let i = 0; i < wordCardList.length; i++) {
      if (wordCardIDCheckedList.indexOf(wordCardList[i].wordCardID) != -1) {
        wordList = wordList.concat(wordCardList[i].wordList)
      }
    }

    return wordList
  },

  /**
   * 更新单词卡片列表方法
   *
   * @inner
  */
  _updateWordCardList: function (wordCardList) {

    return wordCardList.map(item => {
      item.wordBookName = this.data.wordBookCodeToName[item.wordBookCode]
      item.wordList = item.wordInfoList.map(item => item.wordName)

      return item
    })
  },

  /**
   * 获取词书名事件
   *
   * @inner
  */
  _getWordBookCodeToName(wordBookList) {
    let wordBookCodeToName = {}
    wordBookList.forEach(item => wordBookCodeToName[item.wordBookCode] = item.wordBookName)

    return wordBookCodeToName
  },
})