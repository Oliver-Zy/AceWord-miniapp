import {
  Common
} from '../../models/common.js'
const common = new Common()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js'
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordCheckedList: [],
    wordCardIndexCheckedList:[],
    isSelectedAll: false,
    showMode: 0,
    // 以卡片还是列表形式展示
    cardType: false,
  },
  /**
   * 按指定个数切割数组
   * @param {arr} options 
   */
  arrSlice: function (arr) {
    let arrLength = arr.length; // 数组长度
    let num = 5; // 每组 5 条
    let index = 0;
    let newArr = []
    for (let i = 0; i < arrLength; i++) {
      if (i % num === 0 && i !== 0) { // 可以被 10 整除
        newArr.push(arr.slice(index, i));
        index = i;
      };
      if ((i + 1) === arrLength) {
        newArr.push(arr.slice(index, (i + 1)));
      }
    };
    return newArr
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let pageInfo = JSON.parse(options.pageInfo)
    let wordListByDate = pageInfo.data
    this.setData({
      wordCheckedList: []
    })
    // 获取所有单词的释义map
    let allWordList = []
    pageInfo.data.forEach(wordListByDate => {
      allWordList = allWordList.concat(wordListByDate.wordList)
    })
    // 
    var newWordArr = this.arrSlice(allWordList)
    var cardList = []
    newWordArr.forEach(e => {
      var wordInfoList = []
      e.forEach(word => {
        wordInfoList.push({
          "wordName": word,
          "opacity": 100,
          "bgColor": "none",
          "passed": 0
        })
      })
      var tempCard = {
        wordList: e,
        wordInfoList
      }
      cardList.push(tempCard)
    })
    this.setData({
      cardList
    })
    // 每五个组成cardList
    // cardList: [{
    //   "wordInfoList": [{
    //       "wordName": "burst",
    //       "opacity": 100,
    //       "bgColor": "none",
    //       "passed": 0
    //     },
    //   ],
    //   "wordList": ["burst", "centimetre", "depend", "fragile", "wake up"]
    // }, ]

    wx.showLoading({
      title: '正在加载资源',
    })
    // 获取释义
    let meaningMap = {}
    if (allWordList.length == 0) {
      wx.hideLoading()

      this.setData({
        wordListByDate: [],
      })

      return
    }
    common.request({
      url: `/wordinfos/search?wordlist=${allWordList}`
    }).then(e => {
      wx.hideLoading()
      e.forEach(item => {
        meaningMap[item.word] = item
      })

      for (let i = 0; i < wordListByDate.length; i++) {
        wordListByDate[i].wordInfoList = wordListByDate[i].wordList.map(item => {
          return {
            word: item,
            isChecked: false,
            nameCN: meaningMap[item].selfDef == null ? meaningMap[item].wordCN : meaningMap[item].selfDef
          }
        })
      }

      this.setData({
        meaningMap,
        naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
        scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6),
        isIOS: getApp().globalData.isIOS,
        wordGroupName: options.wordGroupName,
        wordGroupID: options.wordGroupID,
        wordListByDate: wordListByDate,
        totalWordNum: pageInfo.totalCount,
        hasNextPage: pageInfo.hasNextPage,
        currentPage: pageInfo.currentPage,
      })
    })
  },
  onWordCardEvent: async function (e) {
    let type = e.detail.type
    if (type == 'showDic') {
      let currentSwiperIndex = e.detail.currentSwiperIndex
      let wordList = e.detail.currentWordCard.wordList
      Toast.loading({
        forbidClick: true
      })
      let wordInfolist = await common.request({
        url: `/wordinfos/search?wordlist=${wordList.join(',')}`
      })
      Toast.clear()
      this._pronounce(wordList[currentSwiperIndex])
      this.setData({
        showDicCardSwiper: true
      })
      this._getDicCardList(wordInfolist, wordList, currentSwiperIndex)
    } else {
      // check
      let isChecked = e.detail.isChecked
      let wordCheckedList = this.data.wordCheckedList
      let wordList = e.detail.wordList
      if (isChecked) {
        wordCheckedList = wordCheckedList.concat(wordList)
      } else {
        // 删掉这些单词
        wordCheckedList = wordCheckedList.filter((item) => {
          return wordList.every((item2) => {
            return item != item2;
          });
        });
      }
      this.setData({
        wordCheckedList
      })
    }
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _getDicCardList: function (wordInfolist, wordList, currentSwiperIndex) {
    console.log("wordInfolist", wordInfolist)
    console.log("wordList", wordList)
    console.log("currentSwiperIndex", currentSwiperIndex)

    let dicCardList = []
    wordInfolist[currentSwiperIndex].isActive = true
    dicCardList.push(wordInfolist[currentSwiperIndex])
    wordInfolist.forEach(word => {
      if (word != wordInfolist[currentSwiperIndex]) {
        word.isActive = false
        dicCardList.push(word)
      }
    })

    console.log(dicCardList)
    // dicCardList = dicCardList.map((item, index) => {
    //   if (index == currentSwiperIndex) {
    //     wordInfolist[index].isActive = true
    //     wordInfolist[index].currentWordCard = this.data.currentWordCard
    //     currentSwiperIndex = index
    //     return wordInfolist[index]
    //   } else {
    //     wordInfolist[index].isActive = false
    //     return wordInfolist[index]
    //   }
    // })
    this.setData({
      showOverlay: true,
      showDicCardSwiper: true,
      dicCardList,
      currentSwiperIndex: 0
    })
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
    console.log(previousSwiperIndex)
    let dicCardList = this.data.dicCardList
    dicCardList.forEach(e => {
      e.isActive = false
    })

    dicCardList[currentSwiperIndex].isActive = true
    // dicCardList[previousSwiperIndex].isActive = false

    this._pronounce(dicCardList[currentSwiperIndex].word)
    this.setData({
      dicCardList,
      currentSwiperIndex
    })

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
      showDicCard: false,
      showOverlay: false,
      showDicCard: false,
      showShareCard: false,
      showDicCardSwiper: false
    })
  },

  onClickHideOverlayZIndex: function (e) {
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false,
      showPopup: false
    })
  },

  onSearchBarCancelSelfDef: function (e) {
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false
    })
  },

  /**
   * 监听完成修改自定义释义事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarConfirmSelfDef: async function (e) {

    let word = this.data.wordInfo.word
    let data = [{
      word: word,
      selfDef: e.detail.value
    }]
    this.setData({
      [`wordInfo.selfDef`]: e.detail.value
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
   * 监听单词卡片事件
   *
   * @event
   */
  onDicCardEvent: async function (e) {

    if (e.detail.type == 'selfDef') {

      this.setData({
        showSearchBarSelfDef: true,
        showOverlay: true,
        showOverlayZIndex: true
      })

    } else if (e.detail.type == 'pronounce') {

      this._pronounce(e.detail.word)

    }
  },

  /**
   * 监听添加词汇到单词本事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onCollectToWordGroup: async function (e) {

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
  },

  onCancelBottomSheet: function () {
    this.setData({
      showBottomSheet: false

    })
  },

  onSelectBottomSheet: function (e) {
    console.log(e.detail)
    if (e.detail.name == "全选" || e.detail.name == "取消全选") {
      this.onSelectAllWord()
    }
    if (e.detail.name == '以卡片形式展示' || e.detail.name == '以列表形式展示') {
      this.changeCardType()
    }
    // 全选、取消全选、以列表形式展示、以卡片形式展示
  },

  // 卡片、列表模式切换
  changeCardType: function () {
    this.setData({
      cardType: !this.data.cardType,
      showBottomSheet: false
    })
  },
  /**
   * 监听标题栏事件
   *
   * @event
   */
  onHeaderEvent: function (e) {
    if (e.detail.type == 'options') {
      this.setData({
        showBottomSheet: true,
        bottomSheetDesc: '列表选项',
        bottomSheetActions: [{
            name: `${this.data.isSelectedAll ? '取消全选' : '全选'}`,
            subname: ''
          },
          {
            name: `以${this.data.cardType? '列表':'卡片'}形式展示`
          },
        ]
      })
    }
    if (e.detail.type == 'changeShowMode') {
      console.log(e.detail.showMode)
      this.setData({
        showMode: e.detail.showMode
      })
    }
  },
  /**
   * 全选单词
   * @param {} e 
   */
  onSelectAllWord: function () {
    let wordListByDate = this.data.wordListByDate
    let wordCheckedList = this.data.wordCheckedList
    for (let i = 0; i < wordListByDate.length; i++) {
      for (let j = 0; j < wordListByDate[i].wordInfoList.length; j++) {
        wordListByDate[i].wordInfoList[j].isChecked = this.data.isSelectedAll ? false : true
        this.data.isSelectedAll ? wordCheckedList.splice(wordCheckedList.indexOf(wordListByDate[i].wordInfoList[j].word, 1)) : wordCheckedList.push(wordListByDate[i].wordInfoList[j].word)
      }
    }
    // todo: 将所有卡片设置为选中
    let wordCardIndexCheckedList = []

    if(!this.data.isSelectedAll){
      this.data.cardList.forEach((e,index)=>{
        wordCardIndexCheckedList.push(index)
      })
    
    }

    this.setData({
      wordCardIndexCheckedList,
      wordListByDate,
      wordCheckedList,
      isSelectedAll: !this.data.isSelectedAll,
      showBottomSheet: false,
    })

  },
  /**
   * 监听勾选单词事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onCheckWord: function (e) {
    let word = e.detail.word
    let isChecked = e.detail.isChecked
    let wordCheckedList = this.data.wordCheckedList
    if (isChecked) {
      wordCheckedList.push(word)
    } else wordCheckedList.splice(wordCheckedList.indexOf(word), 1)

    this.setData({
      wordCheckedList
    })
  },

  /**
   * 监听点击删除事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onDeleteWord: async function (e) {
    let word = e.detail.word
    let index = e.currentTarget.dataset.index
    let wordListByDate = this.data.wordListByDate
    let wordList = this.data.wordListByDate[index].wordList
    let wordInfoList = this.data.wordListByDate[index].wordInfoList

    if (wordList.length == 1) {
      wordListByDate.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        ['wordListByDate']: wordListByDate
      })
      this.setData({
        totalWordNum: this.data.totalWordNum - 1
      })
    } else {
      wordList.splice(wordList.indexOf(word), 1)
      wordInfoList.splice(wordInfoList.findIndex(item => item.word == word), 1)
      this.setData({
        [`wordListByDate[${index}].wordList`]: wordList,
        [`wordListByDate[${index}].wordInfoList`]: wordInfoList
      })
      this.setData({
        totalWordNum: this.data.totalWordNum - 1
      })
    }

    await common.request({
      url: `/wordinfos`,
      method: 'PUT',
      data: [{
        word: word,
        isCollected: false
      }]
    })
    Toast.success('删除成功')
  },

  /**
   * 监听点击开始练习按钮
   *
   * @event
   */
  onPractice: async function () {
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
  },

  /**
   * 监听取消actionSheet
   *
   * @event
   */
  onCancelActionSheet: function () {
    this.setData({
      showPopupVant: false,
      showActionSheet: false
    })
  },

  /**
   * 监听选中actionSheet
   *
   * @event
   */
  onSelectActionSheet: async function (e) {

    let wordCheckedList = this.data.wordCheckedList
    app.globalData.practiceInfo = {}

    Toast.loading()
    app.globalData.practiceInfo.wordInfoList = await common.request({
      url: `/wordinfos/search?wordlist=${wordCheckedList.join(',')}`
    })
    Toast.clear()

    app.globalData.practiceInfo.practiceMode = e.detail.name == '记忆模式' ? 'memorize' : e.detail.name == '复习模式' ? 'review' : 'spell'
    wx.navigateTo({
      url: '../practice/practice?entryPage=wordgroup'
    })
    setTimeout(() => {
      this.setData({
        showPopupVant: false,
        showActionSheet: false
      })
    }, 400)

  },

  /**
   * 监听展开更多事件
   *
   * @event
   */
  onExpand: async function (e) {
    let wordGroupID = this.data.wordGroupID
    let pageIndex = this.data.currentPage + 1
    let pageInfo = await common.request({
      url: `/wordgroup/wordlist?wordgroupid=${wordGroupID}&pageIndex=${pageIndex}`
    })

    let allWordList = []
    pageInfo.data.forEach(wordListByDate => {
      allWordList = allWordList.concat(wordListByDate.wordList)
    })

    // console.log(allWordList)
    // 获取释义
    let meaningMap = this.data.meaningMap
    common.request({
      url: `/wordinfos/search?wordlist=${allWordList}`
    }).then(e => {
      // console.log(e)

      wx.hideLoading()
      e.forEach(item => {
        meaningMap[item.word] = item
      })

      let wordListByDate = this._updateWordListByDate(pageInfo.data, meaningMap)
      this.setData({
        wordListByDate,
        hasNextPage: pageInfo.hasNextPage,
        currentPage: pageIndex,
        wordCheckedList: [],
        isSelectedAll: false
      })
    })

  },

  /**
   * 监听点击单词事件
   *
   * @event
   */
  onWord: async function (e) {
    Toast.loading()
    this.setData({
      showOverlay: false
    })
    let wordInfo = await common.request({
      url: `/wordinfo/search?word=${e.detail.word}`
    })
    this._pronounce(wordInfo.word)
    Toast.clear()

    this.setData({
      showOverlay: true,
      showDicCard: true,
      wordInfo
    })
  },

  /**
   * 监听点击单词事件
   *
   * @event
   */
  onUnload: async function () {
    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]
    prevPage.onLoad()
  },


  /**
   * 更新单词日期列表entryPage
   *
   * @inner
   */
  _updateWordListByDate: function (wordListByDate_next, meaningMap) {

    let wordListByDate = this.data.wordListByDate
    if (wordListByDate[wordListByDate.length - 1].date == wordListByDate_next[0].date) {

      wordListByDate[wordListByDate.length - 1].wordList = wordListByDate[wordListByDate.length - 1].wordList.concat(wordListByDate_next[0].wordList)
      wordListByDate_next.forEach((item, index) => {
        if (index == 0) return
        wordListByDate.push(item)
      })

      for (let i = 0; i < wordListByDate.length; i++) {
        wordListByDate[i].wordInfoList = wordListByDate[i].wordList.map(item => {
          return {
            word: item,
            isChecked: false,
            nameCN: meaningMap[item].selfDef == null ? meaningMap[item].wordCN : meaningMap[item].selfDef
          }
        })
      }
      return wordListByDate
    } else {
      wordListByDate_next.forEach((item, index) => {
        wordListByDate.push(item)
      })
      for (let i = 0; i < wordListByDate.length; i++) {
        wordListByDate[i].wordInfoList = wordListByDate[i].wordList.map(item => {
          return {
            word: item,
            isChecked: false,
            nameCN: meaningMap[item].selfDef == null ? meaningMap[item].wordCN : meaningMap[item].selfDef
          }
        })
      }

      return wordListByDate

    }
  },

  /**
   * 发音事件
   *
   * @inner
   */
  _pronounce: function (word) {
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=${app.globalData.settings.pronType == 'US' ? 1 : 2}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {

      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=${app.globalData.settings.pronType == 'US' ? 1 : 2}`

    })
  },
})