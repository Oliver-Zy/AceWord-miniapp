import {
  Common
} from '../../models/common.js'
import {
  ReviewPageHandler
} from '../../models/handler.js'
import {
  HTTP
} from '../../utils/http.js'
const common = new Common()
const reviewPageHandler = new ReviewPageHandler()
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
    wordCardIDCheckedList: [],
    selectAllList: [],
    isFinishedPractice: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    Toast.loading()
    this._setInitInfo()

    // get & setData: wordBookCodeToName
    let wordBookCodeToName = await common.request({
      url: `/wordbooks-map`
    })
    this.setData({
      wordBookCodeToName
    })

    // get & update: reviewCardDateList
    let reviewCardDateList = await common.request({
      url: `/reviewcards/datelist`
    })
    this.setData({
      reviewCardDateList: reviewPageHandler._updateReviewCardDateList(reviewCardDateList, wordBookCodeToName)
    })

    Toast.clear()
  },

  /**
   * 监听点击取消事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onClickHideOverlay: function (e) {
    this.setData({
      showSearchBar: false,
      showOverlay: false,
      showDicCard: false,
      showShareCard: false,
      showDicCardSwiper: false,
      showStyleCard: false
    })
  },

  onClickHideOverlayZIndex: function (e) {
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false,
      showPopup: false
    })
  },

  onCancelActionSheet: function () {
    this.setData({
      showPopupVant: false,
      showActionSheet: false
    })
  },

  /**
   * 监听标题栏事件
   *
   * @event
   */
  onHeaderEvent: function (e) {

    let isSelectAll = e.detail.isSelectAll
    let outerIndex = e.currentTarget.dataset.outerindex
    let wordCardIDCheckedList = this.data.wordCardIDCheckedList

    if (e.detail.type == 'selectAll' && isSelectAll) {
      // 转成String
      wordCardIDCheckedList = wordCardIDCheckedList.concat(this.data.reviewCardDateList[outerIndex].wordCardList.map(item => item.wordCardID + ""))
      wordCardIDCheckedList = wordCardIDCheckedList.concat(this.data.reviewCardDateList[outerIndex].cardIDList)

      // SET 去重
      wordCardIDCheckedList = Array.from(new Set(wordCardIDCheckedList))
      this.setData({
        wordCardIDCheckedList
      })
      // 取消全选
    } else if (e.detail.type == 'selectAll' && !isSelectAll) {
      this.data.reviewCardDateList[outerIndex].cardIDList.forEach(cardID => {
        if (wordCardIDCheckedList.indexOf(cardID) != -1) {
          wordCardIDCheckedList.splice(wordCardIDCheckedList.indexOf(cardID), 1)
        }
      })

      this.setData({
        wordCardIDCheckedList
      })
    }
  },

  /**
   * 监听展开事件
   *
   * @event
   */
  onExpand: async function (e) {
    let outerIndex = e.currentTarget.dataset.outerindex

    Toast.loading()
    let reviewCardList = await common.request({
      url: `/reviewcards?date=${this.data.reviewCardDateList[outerIndex].date}`
    })
    reviewCardList = reviewPageHandler._updateWordCardList(reviewCardList, this.data.wordBookCodeToName)
    Toast.clear()

    this.setData({
      [`reviewCardDateList[${outerIndex}].isExpanded`]: true,
      [`reviewCardDateList[${outerIndex}].wordCardList`]: reviewCardList,
      [`reviewCardDateList[${outerIndex}].wordCardList[${0}]._relatedAction`]: 'expandOrCollapse',
    })
  },

  /**
   * 监听完成修改自定义释义事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarConfirmSelfDef: async function (e) {

    let word = this.data.dicCardList[this.data.currentSwiperIndex].word
    let data = [{
      word: word,
      selfDef: e.detail.value
    }]
    this.setData({
      [`dicCardList[${this.data.currentSwiperIndex}].selfDef`]: e.detail.value
    })
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false
    })

    await common.request({
      url: `/wordinfos`,
      data: data,
      method: 'PUT'
    })
    Toast.success('修改成功')

  },

  /**
   * 练习相关事件
   *
   * @event
   */
  onPractice: async function () {

    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]

    if (prevPage.route == 'pages/mine/mine') {

      Toast.loading({
        forbidClick: true
      })

      app.globalData.radioInfo = {}

      app.globalData.radioInfo.wordInfoList = await common.request({
        url: `/wordinfos/search?word-card-id-list=${this.data.wordCardIDCheckedList.join(',')}`
      })

      wx.navigateTo({
        url: '../radio/radio'
      })

    } else {

      this.setData({
        showPopupVant: true,
        showActionSheet: true,
        actionSheetDesc: '选择练习模式',
        actions: [{
          name: '记忆模式',
          subname: '适合对新学单词强化记忆'
        }, {
          name: '复习模式',
          subname: '适合对已学单词快速巩固'
        }, {
          name: '拼写模式',
          subname: '适合对已学单词检测拼写'
        }]
      })

    }
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

    let currentWordCardOuterIndex = e.currentTarget.dataset.outerindex
    let currentWordCardIndex = e.currentTarget.dataset.innerindex

    let wordCardList = this.data.reviewCardDateList[currentWordCardOuterIndex].wordCardList
    let wordList = wordCardList.find(item => item.wordCardID == currentWordCard.wordCardID).wordList
    this.setData({
      currentWordCard,
      currentSwiperIndex,
      currentWordCardIndex,
      currentWordCardOuterIndex
    })

    if (e.detail.type == 'showDic') {

      Toast.loading({
        forbidClick: true
      })
      let wordInfo = await common.request({
        url: `/wordinfo/search?word=${wordList[currentSwiperIndex]}`
      })
      Toast.clear()
      this._pronounce(wordList[currentSwiperIndex])
      this.setData({
        showOverlay: true,
        showDicCardSwiper: true,
        dicCardList: reviewPageHandler._getDicCardList(wordInfo, wordList, currentSwiperIndex)
      })

    } else if (e.detail.type == 'delete') {

      let isDeleted = wordCardList[currentWordCardIndex].isDeleted

      wx.showModal({
        title: '提示',
        content: `${isDeleted ? '是否恢复该卡片？' : '是否删除该卡片？（后续将不再出现在复习计划）'}`,
        showCancel: true,
        confirmText: '确认',
      }).then(res => {
        if (res.confirm) {
          http.request({
            url: '/wordcard',
            method: 'PUT',
            data: {
              wordCardID: currentWordCard.wordCardID,
              isDeleted: !isDeleted
            }
          }).then(res => {
            // console.log(res)

            Toast.success(`${isDeleted ? '恢复成功' : '删除成功'}`)
            this.setData({
              [`reviewCardDateList[${currentWordCardOuterIndex}].wordCardList[${currentWordCardIndex}]._relatedAction`]: 'deleteWordCard',
              [`reviewCardDateList[${currentWordCardOuterIndex}].wordCardList[${currentWordCardIndex}].isDeleted`]: !isDeleted
            })
          })
        }
      })

    } else if (e.detail.type == 'check') {

      let wordCardIDCheckedList = this.data.wordCardIDCheckedList
      if (currentWordCard.isChecked) {
        wordCardIDCheckedList.push(currentWordCard.wordCardID + "")
      } else wordCardIDCheckedList.splice(wordCardIDCheckedList.indexOf(currentWordCard.wordCardID + ""), 1)
      this.setData({
        wordCardIDCheckedList,
        showPracticeBtn: wordCardIDCheckedList.length == 0 ? false : true
      })

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
    let wordList = this.data.reviewCardDateList[this.data.currentWordCardOuterIndex].wordCardList[this.data.currentWordCardIndex].wordList
    let wordInfo = await common.request({
      url: `/wordinfo/search?word=${wordList[currentSwiperIndex]}`,
      method: 'GET'
    })
    wordInfo.isActive = true

    let dicCardList = this.data.dicCardList
    dicCardList[currentSwiperIndex] = wordInfo
    dicCardList[previousSwiperIndex].isActive = false

    this._pronounce(wordInfo.word)
    this.setData({
      dicCardList,
      currentSwiperIndex
    })

  },

  /**
   * 监听单词卡片事件
   *
   * @event
   */
  onDicCardEvent: async function (e) {

    let currentSwiperIndex = e.currentTarget.dataset.index
    let currentWordCardOuterIndex = this.data.currentWordCardOuterIndex
    let currentWordCardIndex = this.data.currentWordCardIndex

    if (e.detail.type == 'selfDef') {

      this.setData({
        showSearchBarSelfDef: true,
        showOverlay: true,
        showOverlayZIndex: true
      })

    } else if (e.detail.type == 'collect') {

      this.setData({
        [`dicCardList[${currentSwiperIndex}].isCollected`]: e.detail.isCollected
      })
      await common.request({
        method: 'PUT',
        url: `/wordinfos`,
        data: [{
          word: e.detail.word,
          isCollected: e.detail.isCollected
        }]
      })
      e.detail.isCollected ? Toast('　　　收藏成功　　　\n长按可选择单词本分组') : Toast('已取消收藏')

    } else if (e.detail.type == 'wordGroup') {

      if (e.detail.isCollected) {
        Toast('请先取消收藏')
      } else {
        Toast.loading()
        let wordGroupList = await common.request({
          url: '/wordgroup'
        })
        Toast.clear()

        let defaultWordGroup = wordGroupList.splice(wordGroupList.findIndex(item => item.id == 0), 1)[0]
        wordGroupList.unshift(defaultWordGroup)
        wordGroupList = wordGroupList.map(item => {
          item.isChecked = false;
          return item
        })
        this.setData({
          wordGroupList,
          showOverlayZIndex: true,
          showPopup: true
        })
      }

    } else if (e.detail.type == 'pronounce') {

      this._pronounce(e.detail.word)

    } else if (e.detail.type == 'replace') {

      Toast.loading({
        forbidClick: true
      })
      let word = await common.request({
        url: `/wordcard/word`,
        method: 'PUT',
        data: {
          word: e.detail.word,
          wordBookCode: this.data.currentWordCard.wordBookCode,
          wordCardID: this.data.currentWordCard.wordCardID
        }
      })
      let wordInfo = await common.request({
        url: `/wordinfo/search?word=${word}`
      })
      Toast.clear()

      this._pronounce(word)
      wordInfo.isActive = true
      this.setData({
        [`dicCardList[${currentSwiperIndex}]`]: wordInfo,
        [`reviewCardDateList[${currentWordCardOuterIndex}].wordCardList[${currentWordCardIndex}].wordInfoList[${currentSwiperIndex}]`]: {
          wordName: word,
          opacity: 100
        },
        [`reviewCardDateList[${currentWordCardOuterIndex}].wordCardList[${currentWordCardIndex}].wordList[${currentSwiperIndex}]`]: word,
        [`reviewCardDateList[${currentWordCardOuterIndex}].wordCardList[${currentWordCardIndex}]._relatedAction`]: 'replaceWord',
      })
    } else if (e.detail.type == 'showStyleCard') {

      this.setData({
        showDicCardSwiper: false
      })
      let wordInfo = await common.request({
        url: `/wordinfo/search?word=${e.detail.word}`
      })
      this.setData({
        showStyleCard: true,
        showOverlay: true,
        wordInfo
      })

    }
  },

  /**
   * 监听样式卡片事件
   *
   * @event
   */
  onStyleCardEvent: async function (e) {

    if (e.detail.type == 'close') {

      this.setData({
        showStyleCard: false,
        showDicCardSwiper: true
      })

    } else if (e.detail.type == 'opacity') {

      this.setData({
        [`reviewCardDateList[${this.data.currentWordCardOuterIndex}].wordCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].opacity`]: e.detail.opacity,
        [`reviewCardDateList[${this.data.currentWordCardOuterIndex}].wordCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.reviewCardDateList[this.data.currentWordCardOuterIndex].wordCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.reviewCardDateList[this.data.currentWordCardOuterIndex].wordCardList[this.data.currentWordCardIndex].wordInfoList,
        }
      })

    } else if (e.detail.type == 'bgColor') {

      this.setData({
        [`reviewCardDateList[${this.data.currentWordCardOuterIndex}].wordCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].bgColor`]: e.detail.bgColor,
        [`reviewCardDateList[${this.data.currentWordCardOuterIndex}].wordCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.reviewCardDateList[this.data.currentWordCardOuterIndex].wordCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.reviewCardDateList[this.data.currentWordCardOuterIndex].wordCardList[this.data.currentWordCardIndex].wordInfoList,
        }
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

    let wordList = this.data.reviewCardDateList[this.data.currentWordCardOuterIndex].wordCardList[this.data.currentWordCardIndex].wordList
    let word = wordList[this.data.currentSwiperIndex]
    this.setData({
      [`dicCardList[${this.data.currentSwiperIndex}].isCollected`]: true
    })
    let data = [{
      word: word,
      wordGroupID: this.data.wordGroupList[e.detail.index].id,
      isCollected: e.detail.isCollected
    }]
    await common.request({
      url: `/wordinfos`,
      data: data,
      method: 'PUT'
    })

    Toast.success('添加成功')
    this.setData({
      showOverlayZIndex: false,
      showPopup: false
    })
  },

  /**
   * 创建单词本相关事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onAddWordGroup: function (e) {
    this.setData({
      showFieldDialog: true
    })
  },

  onFieldDialogCancel: async function (e) {
    this.setData({
      fieldValue: ''
    })
  },

  onFieldChange(e) {
    this.setData({
      wordGroupName: e.detail
    })
  },

  onFieldDialogConfirm: async function (e) {
    try {

      let wordGroup = await common.request({
        url: '/wordgroup',
        method: 'POST',
        data: {
          wordGroupName: this.data.wordGroupName
        }
      })
      Toast.success('创建成功')
      this.data.wordGroupList.unshift(wordGroup)
      this.setData({
        fieldValue: '',
        wordGroupList: this.data.wordGroupList
      })

    } catch (err) {

      // console.log(err)
      if (err.errcode == 410) {
        wx.showModal({
          title: '用量已达上限',
          content: '开通会员解锁更多单词本用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            wx.navigateTo({
              // 注释掉VIP页面跳转
              // url: `/pages/vip/vip?event=${'vip_wordgroup'}`
            })
          }
        })
      }

    }
  },

  /**
   * 监听选择弹出框事件
   *
   * @event
   */
  onSelectActionSheet: async function (e) {

    Toast.loading({
      forbidClick: true
    })
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)
    // let wordList = reviewPageHandler._getWordListFromWordCardIDCheckedList(this.data.reviewCardDateList, this.data.wordCardIDCheckedList)
    app.globalData.practiceInfo = {}
    app.globalData.practiceInfo.wordInfoList = await common.request({
      url: `/wordinfos/search?word-card-id-list=${this.data.wordCardIDCheckedList.join(',')}`
    })
    app.globalData.practiceInfo.wordCardIDCheckedList = this.data.wordCardIDCheckedList

    app.globalData.practiceInfo.practiceMode = e.detail.name == '记忆模式' ? 'memorize' : e.detail.name == '复习模式' ? 'review' : 'spell'
    wx.navigateTo({
      url: '../practice/practice?entryPage=review'
    })
  },

  /**
   * 监听生命周期事件
   *
   * @event
   */
  onScroll: function (e) {
    e.detail.scrollTop > 50 ? this.setData({
      showNaviBarDivider: true
    }) : this.setData({
      showNaviBarDivider: false
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
  },

  onUnload: async function () {
    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]

    // setData: reviewCard
    if (!this.data.isFinishedPractice) return
    prevPage.setData({
      reviewCard: null
    })
    let reviewCard = await common.request({
      url: `/statistic/review`
    })
    prevPage.setData({
      reviewCard
    })
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
    })
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