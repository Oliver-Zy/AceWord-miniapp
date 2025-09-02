import {
  Common
} from '../../models/common.js'
import {
  HTTP
} from '../../utils/http.js'
import {
  CalendarPageHandler
} from '../../models/handler.js'
const common = new Common()
const http = new HTTP()
const calendarPageHandler = new CalendarPageHandler()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    wordCardIDCheckedList: [],
    pageIndex: 1,
    filterType: 'practice',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    // Toast.loading({ forbidClick: true })
    wx.showNavigationBarLoading()
    this._setInitInfo()

    // get & setDate: dateInfo
    let dateInfo = calendarPageHandler._setDateInfo({
      event: 'init'
    })
    this.setData({
      dateInfo
    })
    // console.log(dateInfo)

    // get & setDate: wordBookCodeToName
    let wordBookCodeToName = await common.request({
      url: `/wordbooks-map`
    })
    this.setData({
      wordBookCodeToName
    })

    // setData: wordCardList
    let pageInfo = await common.request({
      url: `/wordcards${this.data.filterType == 'today' ? '' : '/practice'}?date=${app.globalData.todayDate}`
    })
    let wordCardList = calendarPageHandler._updateWordCardList(pageInfo.data, wordBookCodeToName)
    this.setData({
      wordCardList: wordCardList.length == 0 ? [{
        _type: 'blank',
        content: '这里空空如也'
      }] : wordCardList,
      hasNextPage: pageInfo.hasNextPage,
      totalCount: pageInfo.totalCount
    })

    // setData: calendarInfoList
    let obj = await common.request({
      url: `/calendarinfos?year=${dateInfo.year}&month=${dateInfo.month}`
    })
    let calendarInfoList = Object.values(obj)
    for (let i = 0; i < dateInfo.emptyDayLen; i++) calendarInfoList.unshift({
      practiceWordCardNum: 0,
      actualTodayCardNum: 0
    })
    this.setData({
      loading: false,
      calendarInfoList
    })

    // Toast.success('加载成功')
    this.setData({
      isRefresherTriggered: false
    })
  },

  /**
   * 监听日历卡片事件
   *
   * @event
   */
  onCalendarCardEvent: async function (e) {

    let type = e.detail.type

    if (type == 'changeDay') {

      // Toast.loading()
      wx.showNavigationBarLoading()

      let dateInfo = calendarPageHandler._setDateInfo({
        event: 'changeDay',
        dateInfo_new: {
          dayIndex: (e.detail.dayIndex)
        },
        dateInfo_old: this.data.dateInfo
      })

      this.setData({
        dateInfo
      })

      // setData: wordCardList
      let pageInfo = await common.request({
        url: `/wordcards${this.data.filterType == 'today' ? '' : '/practice'}?date=${dateInfo.currentDate}`
      })
      let wordCardList = calendarPageHandler._updateWordCardList(pageInfo.data, this.data.wordBookCodeToName)
      if (wordCardList.length == 0) wordCardList.push({
        _type: 'blank'
      })
      this.setData({
        wordCardList,
        hasNextPage: pageInfo.hasNextPage,
        totalCount: pageInfo.totalCount
      })

      // Toast.success('加载成功')

    } else if (type == 'prevMonth' || type == 'nextMonth') {
      // Toast.loading()
      wx.showNavigationBarLoading()
      let currentMonthIndex = parseInt(app.globalData.todayDate.slice(4, 6)) - 1
      let currentYear = parseInt(app.globalData.todayDate.slice(0, 4))
      let monthIndex = type == 'prevMonth' ? this.data.dateInfo.monthIndex - 1 : this.data.dateInfo.monthIndex + 1
      

      // todo：年
      if (monthIndex <= currentMonthIndex || this.data.dateInfo.year!='2023') {
        let dateInfo = calendarPageHandler._setDateInfo({
          event: 'prevMonth',
          currentMonthIndex,
          dateInfo_new: {
            monthIndex
          },
          dateInfo_old: this.data.dateInfo,
          isThisMonth: monthIndex == currentMonthIndex
        })
        this.setData({
          dateInfo
        })

        // setData: wordCardList
        let pageInfo = await common.request({
          url: `/wordcards${this.data.filterType == 'today' ? '' : '/practice'}?date=${dateInfo.currentDate}`
        })
        let wordCardList = calendarPageHandler._updateWordCardList(pageInfo.data, this.data.wordBookCodeToName)
        if (wordCardList.length == 0) wordCardList.push({
          _type: 'blank'
        })
        this.setData({
          wordCardList,
          hasNextPage: pageInfo.hasNextPage,
          totalCount: pageInfo.totalCount
        })

        // setData: calendarInfoList
        let obj = await common.request({
          url: `/calendarinfos?year=${dateInfo.year}&month=${dateInfo.month}`
        })
        let calendarInfoList = Object.values(obj)
        for (let i = 0; i < dateInfo.emptyDayLen; i++) calendarInfoList.unshift({
          practiceWordCardNum: 0,
          actualTodayCardNum: 0
        })
        this.setData({
          loading: false,
          calendarInfoList
        })
        // Toast.success('加载成功')

      } else {

        wx.showModal({
          title: '提示',
          content: '当前已经是最新的一个月',
          confirmText: '好的',
          showCancel: false,
        })

      }
    }
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
    this.getTabBar().setData({
      show: true
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
    this.getTabBar().setData({
      show: true
    })
  },

  /**
   * 监听标题栏事件
   *
   * @event
   */
  onHeaderEvent: function (e) {

    this.getTabBar().setData({
      show: false
    })
    this.setData({
      showPopupVant: true,
      actionSheetType: 'options',
      showActionSheet: true,
      actionSheetDesc: '列表选项',
      actions: [{
          name: `显示当日${this.data.filterType == 'today' ? '练习' : '新学'}卡片`
        },
        {
          name: `${this.data.isSelectAll ? '取消全选' : '全选卡片'}`,
          subname: ''
        }
      ]
    })

  },

  /**
   * 监听完成修改自定义释义事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarConfirmSelfDef: async function (e) {

    if (this.data.showDicCardSwiper) {

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

    }
  },

  /**
   * 练习相关事件
   *
   * @event
   */
  onPractice: async function () {
    this.setData({
      showPopupVant: true,
      actionSheetType: 'practice',
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
    this.getTabBar().setData({
      show: false
    })
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
    this.setData({
      currentWordCard,
      currentSwiperIndex,
      currentWordCardIndex
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
      let dicCardList = calendarPageHandler._getDicCardList(wordInfo, wordList, currentSwiperIndex)

      this.setData({
        showOverlay: true,
        showDicCardSwiper: true,
        dicCardList,
        currentSwiperIndex
      })
      this.getTabBar().setData({
        show: false
      })

    } else if (e.detail.type == 'delete') {

      this.getTabBar().setData({
        show: false
      })
      let isDeleted = wordCardList[currentWordCardIndex].isDeleted

      wx.showModal({
        title: '提示',
        content: `${isDeleted ? '是否恢复该卡片？' : '是否删除该卡片？（后续将不再出现在复习计划）'}`,
        showCancel: true,
        confirmText: '确认',
      }).then(res => {
        if (res.confirm) {
          this.getTabBar().setData({
            show: true
          })
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
              [`wordCardList[${currentWordCardIndex}]._relatedAction`]: 'deleteWordCard',
              [`wordCardList[${currentWordCardIndex}].isDeleted`]: !isDeleted
            })
          })
        } else if (res.cancel) this.getTabBar().setData({
          show: true
        })
      })

    } else if (e.detail.type == 'check') {

      let wordCardIDCheckedList = this.data.wordCardIDCheckedList
      if (currentWordCard.isChecked) {
        wordCardIDCheckedList.push(currentWordCard.wordCardID)
      } else wordCardIDCheckedList.splice(wordCardIDCheckedList.indexOf(currentWordCard.wordCardID), 1)
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
    let wordList = this.data.wordCardList[this.data.currentWordCardIndex].wordList
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
    let currentWordCardIndex = this.data.currentWordCardIndex

    if (e.detail.type == 'selfDef') {

      this.setData({
        showSearchBarSelfDef: true,
        showOverlay: true,
        showOverlayZIndex: true
      })

    } else if (e.detail.type == 'collect') {

      if (this.data.showDicCardSwiper) {
        this.setData({
          [`dicCardList[${currentSwiperIndex}].isCollected`]: e.detail.isCollected
        })
      } else this.setData({
        [`wordInfo.isCollected`]: e.detail.isCollected
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
        // Toast.loading()
        wx.showNavigationBarLoading()
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
        [`wordCardList[${currentWordCardIndex}].wordInfoList[${currentSwiperIndex}]`]: {
          wordName: word,
          opacity: 100
        },
        [`wordCardList[${currentWordCardIndex}].wordList[${currentSwiperIndex}]`]: word,
        [`wordCardList[${currentWordCardIndex}]._relatedAction`]: 'replaceWord',
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
        [`wordCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].opacity`]: e.detail.opacity,
        [`wordCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.wordCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.wordCardList[this.data.currentWordCardIndex].wordInfoList
        }
      })

    } else if (e.detail.type == 'bgColor') {

      this.setData({
        [`wordCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].bgColor`]: e.detail.bgColor,
        [`wordCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.wordCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.wordCardList[this.data.currentWordCardIndex].wordInfoList
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
 
    if (this.data.showDicCardSwiper) {

      let wordList = this.data.wordCardList[this.data.currentWordCardIndex].wordList
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

    } else {

      let data = [{
        word: this.data.wordInfo.word,
        wordGroupID: this.data.wordGroupList[e.detail.index].id,
        isCollected: e.detail.isCollected
      }]
      this.setData({
        [`wordInfo.isCollected`]: true
      })
      await common.request({
        url: `/wordinfos`,
        data: data,
        method: 'PUT'
      })

    }

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
              url: `/pages/vip/vip?event=${'vip_wordgroup'}`
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

      wordCardList.shift(), wordCardList.push({
        _type: 'loading'
      })

    } else {

      wordCardList.forEach((item, index) => wordCardList[index]._relatedAction = 'addWordCard')
      wordCardList.push({
        _type: 'loading'
      })

    }

    let wordCard = await common.request({
      url: '/wordcard',
      method: 'POST'
    })
    wordCardList.pop(), wordCardList.push(wordCard)
    this.setData({
      wordCardList: this._updateWordCardList(wordCardList),
      toView: 'scrollBottom'
    })
    setTimeout(() => {
      this.setData({
        toView: ''
      })
    }, 400)
  },

  /**
   * 监听选择弹出框事件
   *
   * @event
   */
  onSelectActionSheet: async function (e) {

    let actionSheetType = this.data.actionSheetType
    if (actionSheetType == 'practice') {

      Toast.loading({
        forbidClick: true
      })
      setTimeout(() => {
        this.onCancelActionSheet()
      }, 400)
      // let wordList = calendarPageHandler._getWordListFromWordCardIDCheckedList(this.data.wordCardList, this.data.wordCardIDCheckedList)
      app.globalData.practiceInfo = {}
      app.globalData.practiceInfo.wordInfoList = await common.request({
        url: `/wordinfos/search?word-card-id-list=${this.data.wordCardIDCheckedList.join(',')}`
      })
      app.globalData.practiceInfo.wordCardIDCheckedList = this.data.wordCardIDCheckedList

      app.globalData.practiceInfo.practiceMode = e.detail.name == '记忆模式' ? 'memorize' : e.detail.name == '复习模式' ? 'review' : 'spell'
      wx.navigateTo({
        url: '../practice/practice?entryPage=calendar'
      })

    } else if (actionSheetType == 'options') {

      this.onCancelActionSheet()
      this._onSelectActionSheetOptions(e)

    }
  },

  _onSelectActionSheetOptions: async function (e) {

    if (e.detail.name == '显示当日新学卡片') {

      // setData: wordCardList
      let pageInfo = await common.request({
        url: `/wordcards?date=${this.data.dateInfo.currentDate}`
      })
      let wordCardList = calendarPageHandler._updateWordCardList(pageInfo.data, this.data.wordBookCodeToName)
      this.setData({
        wordCardList,
        hasNextPage: pageInfo.hasNextPage,
        totalCount: pageInfo.totalCount,
        filterType: 'today',
        pageIndex: 1
      })

    } else if (e.detail.name == '显示当日练习卡片') {

      // setData: wordCardList
      let pageInfo = await common.request({
        url: `/wordcards/practice?date=${this.data.dateInfo.currentDate}`
      })
      let wordCardList = calendarPageHandler._updateWordCardList(pageInfo.data, this.data.wordBookCodeToName)
      this.setData({
        wordCardList,
        hasNextPage: pageInfo.hasNextPage,
        totalCount: pageInfo.totalCount,
        filterType: 'practice',
        pageIndex: 1
      })

    } else if (e.detail.name == '全选卡片') {

      // setData: wordCardList
      let wordCardIDCheckedList = this.data.wordCardList.map(item => item.wordCardID)
      this.setData({
        wordCardIDCheckedList,
        isSelectAll: true
      })

    } else if (e.detail.name == '取消全选') {

      let wordCardIDCheckedList = []
      this.setData({
        wordCardIDCheckedList,
        isSelectAll: false
      })

    }
  },

  /**
   * 加载下一页事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onNextPage: async function (e) {
    if (!this.data.hasNextPage) return

    // setData: wordCardList
    let pageInfo = await common.request({
      url: `/wordcards${this.data.filterType == 'today' ? '' : '/practice'}?date=${this.data.dateInfo.currentDate}&pageIndex=${this.data.pageIndex + 1}`
    })
    let wordCardList_new = calendarPageHandler._updateWordCardList(pageInfo.data, this.data.wordBookCodeToName)
    let wordCardList_old = this.data.wordCardList.map((item) => {
      item._relatedAction = 'addWordCard';
      return item;
    })
    this.setData({
      wordCardList: wordCardList_old.concat(wordCardList_new),
      hasNextPage: pageInfo.hasNextPage,
      totalCount: pageInfo.totalCount,
      pageIndex: this.data.pageIndex + 1
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

  onScrollViewRefresh: function () {
    this.onLoad()
    setTimeout(() => this.setData({
      isRefresherTriggered: false
    }), 400)
  },

  onShow: function () {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
    
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1  // 调整：移除word-list后，calendar从索引2改为1
      })
    }
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 48 - (app.globalData.isIOS ? 30 : 0),
      isIOS: app.globalData.isIOS,
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