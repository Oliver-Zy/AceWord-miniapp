const {
  Common
} = require('../../models/common.js')
const {
  HTTP
} = require('../../utils/http.js')
const {
  ShareCardHandler
} = require('../../models/handler.js')
const { logger } = require('../../utils/logger.js')
const { dailyLimits } = require('../../utils/dailyLimits.js')

const common = new Common()
const http = new HTTP()
const shareCardHandler = new ShareCardHandler()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    rateColor: "#ee0a24",
    showForgetDialog: false,
    tempWord: "abandon",
    showUpdateOverlay: true,
    currentSwiperIndex: 0,
    showTabBarShadow: true,
    todayCardList: [{
      _type: 'loading'
    }],
    wordCardIDCheckedList: [],
    isInit: false,
    addCardButtonText: '添加卡片',
    showVipButton: false,
    vipButtonText: '剩余0张',
    isLowRemaining: false,
  },
  onChangeRate(e) {
    let colorList = [
      "#bab4e6",
      "#a095ef",
      "#8778ee",
      "#6c58f4",
      "#4c34f0",
    ]
    logger.debug('Rate color changed:', colorList[e.detail])
    this.setData({
      rateColor: colorList[e.detail - 1]
    })
  },
  error(e) {
    logger.error('Index page error:', e)
  },
  showTempMeaning() {
    this.onSearchBarConfirm({
      detail: {
        value: "abandon"
      }
    })
    this.setData({
      showForgetDialog: false
    })
    // this.setData({
    //   tempWord: "抛弃；放弃"
    // })
  },
  onClickHideUpdateOverlay() {
    this.setData({
      showUpdateOverlay: false
    })
    this.getTabBar().setData({
      show: true
    })
  },
  fetchUnSavePracticeData() {
    if (wx.getStorageSync('hasUnfinishedTask')) {
      wx.showModal({
        title: '提示',
        content: '是否从上次进度开始练习？',
        showCancel: true,
        cancelText: '舍弃',
        confirmText: '进入',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '../practice/practice?resumeMode=true'
            })
            wx.setStorageSync('hasUnfinishedTask', false)
            this.setData({
              hasUnfinishedTask: false
            })
            return
          }
          // cancel 
          else {
            this.setData({
              hasUnfinishedTask: false
            })
            wx.setStorageSync('hasUnfinishedTask', false)
            wx.removeStorage({
              key: 'data',
            })
          }
        }
      })
    }

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    // !!! Test Only !!!
    // let token = await common.request({ url: `/tokenFromOpenid?openid=o4nOp5Kn8M67yz1Oc7m9BBe5Cn4A` })
    // console.log(token)
    
    // 获取当前用户的openid并在控制台输出
    try {
      let openID = await common.request({
        url: `/openid`
      })
      console.log('当前用户的openid:', openID)
    } catch (error) {
      console.error('获取openid失败:', error)
    }
    
    this._setInitInfo()
    // 获取首页数据
    common.request({
      url: `/homedata`
    }).then(homeData => {
      logger.info('Home data loaded:', homeData)
      Toast.clear()
      // set globalData: settings
      let settings = homeData.settings

      app.globalData.settings = settings
      
      // 在设置完 globalData.settings 后更新按钮文案
      this._updateAddCardButtonText(homeData.todayCardList)

      // setData: senCard
      let senCard = homeData.sentence

      // setData: wordBookMyInfo, wordBookList
      let wordBookCodeToName = homeData.bookMap
      let currentWordBook = settings.currentWordBook
      let wordBookMyInfo = {
        currentWordBookName: currentWordBook.wordBookName,
        dailyTargetNum: settings.dailyTargetNum,
        totalWordNum: currentWordBook.totalWordNum,
        userProgressNum: currentWordBook.userProgressNum
      }
      let reviewCard = homeData.reviewData
      let pageInfo = homeData.todayCardList

      this.setData({
        isVipExpired: settings.isVipExpired,
        showGuideOfAddToMyMiniApp: settings.showGuideOfAddToMyMiniApp,
        senCard,
        wordBookMyInfo,
        wordBookCodeToName,
        reviewCard: reviewCard,
        isRefresherTriggered: false,
      })
      let todayCardList = this._updateWordCardList(pageInfo.data)
      console.log(todayCardList)
      this.setData({
        todayCardList: todayCardList.length == 0 ? [{
          _type: 'blank'
        }] : todayCardList,
      })

      wx.setStorageSync('todayCardList', todayCardList)
    }).catch(e => {
      logger.error('Failed to load home data:', e)
      Toast.fail('加载失败，请稍后重试')
      
      // 显示错误状态而不是递归调用，避免无限循环
      this.setData({
        todayCardList: [{ 
          _type: 'error',
          message: '网络连接失败，请下拉刷新重试'
        }]
      })
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

    // this.setData({
    //   showForgetDialog: true
    // })
    // return

    let isSelectAll = e.detail.isSelectAll
    let wordCardIDCheckedList = this.data.wordCardIDCheckedList

    if (e.detail.type == 'selectAll' && isSelectAll) {

      wordCardIDCheckedList = this.data.todayCardList.map(item => item.wordCardID)
      this.setData({
        showPracticeBtn: true,
        wordCardIDCheckedList
      })

    } else if (e.detail.type == 'selectAll' && !isSelectAll) {

      this.setData({
        showPracticeBtn: false,
        wordCardIDCheckedList: []
      })

    } else if (e.detail.type == 'learnRules') {

      wx.navigateTo({
        url: '../review-rules/review-rules'
      })

    }
  },

  /**
   * 监听点击开始练习事件
   *
   * @event
   */
  onReview: function (e) {
    if (e.detail && e.detail.showActionSheet) {
      // 显示一键复习选择弹窗
      this.setData({
        showPopupVant: true,
        actionSheetType: 'quickReview',
        showActionSheet: true,
        actionSheetDesc: '选择复习方式',
        actions: [{
          name: '一键复习',
          subname: '开始复习所有待复习卡片'
        }, {
          name: '进入复习页',
          subname: '按日期分组查看待复习卡片'
        }]
      })
      this.getTabBar().setData({
        show: false
      })
    } else {
      // 兼容旧的直接跳转逻辑
      wx.navigateTo({
        url: `/pages/review/review`
      })
    }
  },

  /**
   * 监听完成搜索事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarConfirm: async function (e) {
    console.log(e.detail.value)
    Toast.loading()
    this.setData({
      showSearchBar: false,
      showOverlay: false
    })
    this.getTabBar().setData({
      show: false
    })
    let wordInfo = await common.request({
      url: `/wordinfo/search?word=${e.detail.value}`
    }).catch(() => {
      // 单词未找到
      Toast.fail("未找到该单词")
      this.getTabBar().setData({
        show: true
      })
    })

    // 判断wordInfo
    if (wordInfo != undefined) {
      this._pronounce(wordInfo.word)
      Toast.clear()

      this.setData({
        wordInfo,
        showDicCard: true,
        showOverlay: true
      })
    }
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

    } else {

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

    }
  },

  /**
   * 词书相关事件
   *
   * @event
   */
  onChangeDic: function () {
    // 先弹出词书类型选择
    this._showWordbookTypeSelection()
  },

  /**
   * 显示词书类型选择
   */
  _showWordbookTypeSelection: function() {
    const actions = [
      { 
        name: '我的词书', 
        subname: '正在学习和已学完的词书',
        type: 'my'
      },
      { 
        name: '分类词书', 
        subname: '按学习阶段和考试类型分类',
        type: 'category'
      }
      // { 
      //   name: '真题词书', 
      //   subname: '【会员专享】考研英语真题词汇，带真题例句',
      //   type: 'exam'
      // }
    ]

    this.setData({
      showPopupVant: true,
      actionSheetType: 'wordbookType',
      showActionSheet: true,
      actionSheetDesc: '选择词书类型',
      actions: actions
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 显示分类选择
   */
  _showCategorySelection: function() {
    // 使用新的后端分类代码
    const categories = [
      { name: '基础教育阶段', code: '21', description: '小学至高中英语教材词汇，夯实基础' },
      { name: '大学英语考试', code: '22', description: '四六级、专四专八，大学必备' },
      { name: '研究生考试', code: '23', description: '考研考博词汇，学术深造必选' },
      { name: '出国留学考试', code: '24', description: '托福雅思GRE，留学申请利器' },
      { name: '成人继续教育', code: '25', description: '专升本自考PETS，提升学历必备' }
    ]

    const actions = categories.map(cat => ({
      name: cat.name,
      subname: cat.description,
      categoryCode: cat.code,
      description: cat.description
    }))

    this.setData({
      showPopupVant: true,
      actionSheetType: 'categorySelection',
      showActionSheet: true,
      actionSheetDesc: '选择词书分类',
      actions: actions
    })
    this.getTabBar().setData({
      show: false
    })
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
        subname: '循环迭代记忆法，激发你的记忆潜力'
      }, {
        name: '复习模式',
        subname: '单词一遍过，快速检测掌握情况'
      }, {
        name: '拼写模式',
        subname: '默认开启拼写栏，深度巩固已学单词'
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

    let wordCardList = this.data.todayCardList
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
      let wordInfolist = await common.request({
        url: `/wordinfos/search?wordlist=${wordList.join(',')}`
      })
      Toast.clear()
      this._pronounce(wordList[currentSwiperIndex])
      this._getDicCardList(wordInfolist, wordList, currentSwiperIndex)

    } else if (e.detail.type == 'delete') {

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
              [`todayCardList[${currentWordCardIndex}]._relatedAction`]: 'deleteWordCard',
              [`todayCardList[${currentWordCardIndex}].isDeleted`]: !isDeleted
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

    let dicCardList = this.data.dicCardList
    dicCardList[currentSwiperIndex].isActive = true
    dicCardList[previousSwiperIndex].isActive = false

    this._pronounce(dicCardList[currentSwiperIndex].word)
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
      // 恢复换词每日限制
      if (!dailyLimits.recordWordReplace()) {
        return
      }

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
        [`todayCardList[${currentWordCardIndex}].wordInfoList[${currentSwiperIndex}]`]: {
          wordName: word,
          opacity: 100
        },
        [`todayCardList[${currentWordCardIndex}].wordList[${currentSwiperIndex}]`]: word,
        [`todayCardList[${currentWordCardIndex}]._relatedAction`]: 'replaceWord',
      })
      
      // 更新换词按钮文案
      this._updateReplaceButtonText()

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
        [`todayCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].opacity`]: e.detail.opacity,
        [`todayCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.todayCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.todayCardList[this.data.currentWordCardIndex].wordInfoList
        }
      })

    } else if (e.detail.type == 'bgColor') {

      this.setData({
        [`todayCardList[${this.data.currentWordCardIndex}].wordInfoList[${this.data.currentSwiperIndex}].bgColor`]: e.detail.bgColor,
        [`todayCardList[${this.data.currentWordCardIndex}]._relatedAction`]: 'AddStyle'
      })

      await common.request({
        method: 'PUT',
        url: `/wordcard/wordinfolist`,
        data: {
          wordCardID: this.data.todayCardList[this.data.currentWordCardIndex].wordCardID,
          wordInfoList: this.data.todayCardList[this.data.currentWordCardIndex].wordInfoList
        }
      })

    }
  },

  /**
   * 监听样式卡片事件
   *
   * @event
   */
  onSenCardEvent: async function (e) {

    if (e.detail.type == 'search') {

      try {

        this._pronounce(e.detail.word)
        let wordInfo = await common.request({
          url: `/wordinfo/search?word=${e.detail.word}`
        })
        this.getTabBar().setData({
          show: false
        })
        this.setData({
          showOverlay: true,
          showDicCard: true,
          wordInfo
        })

      } catch (err) {

        if (err.errcode == 404) {

          Toast('单词未找到')

        }

      }

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

      let wordList = this.data.todayCardList[this.data.currentWordCardIndex].wordList
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

    try {

      let todayCardList = this.data.todayCardList

      // 如果只有空白卡片，则添加一张loading卡片，然后回调本函数
      if (todayCardList[0]._type == 'blank') {
        this.setData({
          todayCardList: [{
            _type: 'loading'
          }]
        })
        this.onAddWordCard()
        return
      }

      // 如果最新的卡片是loading卡片，则向服务端请求新添一张
      if (todayCardList[todayCardList.length - 1]._type == 'loading') {
        let wordCard = await common.request({
          url: '/wordcard',
          method: 'POST'
        })
        todayCardList.pop()
        todayCardList.push(wordCard)
        this.setData({
          todayCardList: this._updateWordCardList(todayCardList)
        })
        this.setData({
          [`wordBookMyInfo.userProgressNum`]: this.data.wordBookMyInfo.userProgressNum + 5
        })
        this.setData({
          toView: 'scrollBottom'
        })
        
        // 重新获取数据来更新按钮文案
        this._refreshAddCardButtonText()
        return
      }

      // 正常情况：添加一张loading卡片，然后回调本函数，实际新增的逻辑放在loading中
      // 额度预检查
      const check = dailyLimits.canCreateCard()
      if (!check.allowed) {
        dailyLimits.showLimitReached('cards')
        return
      }
      todayCardList.forEach((item, index) => todayCardList[index]._relatedAction = 'addWordCard')
      todayCardList.push({
        _type: 'loading'
      })
      this.setData({
        todayCardList
      })
      this.onAddWordCard()

    } catch (err) {

      // console.log(err)
      this.data.todayCardList.pop()
      this.setData({
        todayCardList: this.data.todayCardList
      })
      if (err.errcode == 410) {

        wx.showModal({
          title: '今日用量已达上限',
          content: '开通会员解锁更多卡片用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            wx.navigateTo({
              url: `/pages/vip/vip?event=${'vip_wordcard'}`
            })
          }
        })

      } else if (err.errcode == 412) {

        // 超出了词书长度，直接抛出
        wx.showModal({
          title: '提示',
          content: '词书已背完',
          showCancel: false,
          confirmText: '好的'
        })
        return
      }
    }
  },

  /**
   * 监听选择弹出框事件
   *
   * @event
   */
  onSelectActionSheet: function (e) {
    let actionSheetType = this.data.actionSheetType
    if (actionSheetType == 'changeDic') {

      this._onSelectActionSheetChangeDic(e)

    } else if (actionSheetType == 'practice') {

      this._onSelectActionSheetPractice(e)

    } else if (actionSheetType == 'categorySelection') {

      this._onSelectActionSheetCategorySelection(e)

    } else if (actionSheetType == 'wordbookType') {

      this._onSelectActionSheetWordbookType(e)

    } else if (actionSheetType == 'examWordbook') {

      this._onSelectActionSheetExamWordbook(e)

    } else if (actionSheetType == 'quickReview') {

      this._onSelectActionSheetQuickReview(e)

    }
  },

  _onSelectActionSheetPractice: async function (e) {

    Toast.loading({
      forbidClick: true,
      duration: 0,
      message: '资源加载中',
    })
    // 20个单词，4秒

    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    // let wordList = this._getWordListFromWordCardIDCheckedList(this.data.wordCardIDCheckedList)
    app.globalData.practiceInfo = {}
    app.globalData.practiceInfo.wordInfoList = await common.request({
      url: `/wordinfos/search?word-card-id-list=${this.data.wordCardIDCheckedList.join(',')}`
    })
    app.globalData.practiceInfo.wordCardIDCheckedList = this.data.wordCardIDCheckedList
    Toast.clear()
    app.globalData.practiceInfo.practiceMode = e.detail.name == '记忆模式' ? 'memorize' : e.detail.name == '复习模式' ? 'review' : 'spell'
    wx.navigateTo({
      url: '../practice/practice?entryPage=index'
    })

  },

  _onSelectActionSheetChangeDic: function (e) {
    if (e.detail.name == '词书广场') {
      setTimeout(() => {
        this.onCancelActionSheet()
      }, 400)
      wx.navigateTo({
        url: `/pages/wordbook-category/wordbook-category`
      })
    } else if (e.detail.name == '自定义词书') {
      setTimeout(() => {
        this.onCancelActionSheet()
      }, 400)
      wx.navigateTo({
        url: `/pages/wordbook-custom-app/wordbook-custom-app`
      })
    }
  },

  _onSelectActionSheetCategorySelection: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    const selectedAction = this.data.actions.find(action => action.name === e.detail.name)
    
    if (selectedAction && selectedAction.categoryCode) {
      // 跳转到词书广场页面，传递分类信息
      wx.navigateTo({
        url: `/pages/wordbook-all/wordbook-all?categoryCode=${selectedAction.categoryCode}&categoryName=${encodeURIComponent(selectedAction.name)}`
      })
    }
  },

  /**
   * 处理词书类型选择
   */
  _onSelectActionSheetWordbookType: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    const selectedAction = this.data.actions.find(action => action.name === e.detail.name)
    
    if (selectedAction) {
      if (selectedAction.type === 'my') {
        // 选择了我的词书，跳转到我的词书页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/wordbook-all/wordbook-all?categoryCode=99&categoryName=${encodeURIComponent('我的词书')}`
          })
        }, 500)
      } else if (selectedAction.type === 'category') {
        // 选择了分类词书，显示原来的分类选择
        setTimeout(() => {
          this._showCategorySelection()
        }, 500)
      }
      // else if (selectedAction.type === 'exam') {
      //   // 选择了真题词书，显示真题词书选择
      //   setTimeout(() => {
      //     this._showExamWordbookSelection()
      //   }, 500)
      // }
    }
  },

  /**
   * 显示真题词书选择
   */
  _showExamWordbookSelection: function() {
    const examActions = [
      { 
        name: '考研英语一真题', 
        subname: '2010-2024年考研英语一真题词汇',
        examType: 'kaoyan1'
      },
      { 
        name: '考研英语二真题', 
        subname: '2010-2024年考研英语二真题词汇',
        examType: 'kaoyan2'
      }
    ]

    this.setData({
      showPopupVant: true,
      actionSheetType: 'examWordbook',
      showActionSheet: true,
      actionSheetDesc: '选择真题词书',
      actions: examActions
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 处理真题词书选择
   */
  _onSelectActionSheetExamWordbook: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    const selectedAction = this.data.actions.find(action => action.name === e.detail.name)
    
    if (selectedAction && selectedAction.examType) {
      // 跳转到真题词书页面
      wx.navigateTo({
        url: `/pages/exam-wordbook/exam-wordbook?examType=${selectedAction.examType}&examName=${encodeURIComponent(selectedAction.name)}`
      })
    }
  },

  /**
   * 处理一键复习选择
   */
  _onSelectActionSheetQuickReview: async function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    if (e.detail.name === '一键复习') {
      // 一键复习逻辑
      try {
        Toast.loading({
          forbidClick: true,
          message: '加载中'
        })

        // 调用新的一键复习API
        const reviewData = await common.request({
          url: `/list/need-review/all`,
          method: 'GET'
        })

        // 兼容多种可能的数据格式
        let wordList = null
        let cardIDList = null
        
        if (reviewData && reviewData.data && reviewData.data.wordList) {
          // 包装在data字段中的格式: {data: {wordList: [...], cardIDList: [...]}}
          wordList = reviewData.data.wordList
          cardIDList = reviewData.data.cardIDList
        } else if (reviewData && reviewData.wordList) {
          // 直接返回的格式: {wordList: [...], cardIDList: [...]}
          wordList = reviewData.wordList
          cardIDList = reviewData.cardIDList
        }

        if (wordList && wordList.length > 0) {
          // 设置全局练习数据
          app.globalData.practiceInfo = {
            wordInfoList: wordList,
            cardIDList: cardIDList || [],
            practiceMode: 'review',
            isQuickReview: true
          }

          Toast.clear()
          
          // 直接跳转到练习页面
          wx.navigateTo({
            url: '../practice/practice?entryPage=quickReview'
          })
        } else {
          Toast.clear()
          wx.showToast({
            title: '暂无待复习卡片',
            icon: 'none'
          })
        }
      } catch (error) {
        Toast.clear()
        console.error('一键复习失败:', error)
        wx.showToast({
          title: '获取复习数据失败',
          icon: 'none'
        })
      }
    } else if (e.detail.name === '进入复习页') {
      // 原有逻辑，跳转到复习页面
      wx.navigateTo({
        url: `/pages/review/review`
      })
    }
  },

  catchDoubleBtnEvent: function (e) {
    let eventName = e.detail.name
    if (eventName == 'startLearning') {
      this.onPractice()
    } else {
      this.fetchUnSavePracticeData()
    }
  },

  /**
   * 处理VIP按钮点击事件
   * 内测阶段：注释VIP按钮功能
   */
  onShowVip: function() {
    // 内测阶段暂时注释VIP按钮功能
    console.log('VIP button clicked - disabled during beta testing')
    
    /* 原VIP按钮逻辑，内测期间暂时注释
    wx.navigateTo({
      url: '/pages/vip/vip?event=vip_wordcard'
    })
    */
  },

  /**
   * 生命周期事件
   *
   * @event
   */
  onShow: function () {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
    
    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
        show: true
      })
    }

    let hasUnfinishedTask = wx.getStorageSync('hasUnfinishedTask')
    this.setData({
      hasUnfinishedTask,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 48 - (app.globalData.isIOS ? 30 : 0),
    })
  },

  onScroll: function (e) {
    e.detail.scrollTop > 50 ? this.setData({
      showNaviBarDivider: true
    }) : this.setData({
      showNaviBarDivider: false
    })
  },

  onScrollViewRefresh: function () {
    Toast.loading()
    this.onLoad()
  },

  onShareAppMessage() {
    return {
      title: '快来AceWord背单词吧！',
      path: 'pages/index/index',
    }
  },

  /**
   * 分享相关事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onShareCardEvent: async function (e) {

    Toast.loading()
    let type = e.currentTarget.dataset.type
    if (type == 'download') {
      let tempFilePath = await this.getCanvasTempFilePath()
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => Toast.success('保存成功')
      })
    } else if (type == 'wechat') {
      let tempFilePath = await this.getCanvasTempFilePath()
      wx.showShareImageMenu({
        path: tempFilePath,
        success: () => Toast.clear()
      })
    }

    await common.request({
      method: 'POST',
      url: `/sen/share`,
      data: {
        date: app.globalData.todayDate
      }
    })
  },

  showShareCard: async function () {
    Toast.loading()
    let bgImageSrc = await common.request({
      url: `/resources/sharecard/background?date=${app.globalData.todayDate}`
    })
    Toast.clear()
    this.setData({
      showOverlay: true,
      showShareCard: true
    })
    this.getTabBar().setData({
      show: false
    })

    shareCardHandler.showShareCard(this.data.canvasWidth, this.data.senCard, app.globalData.todayDate, bgImageSrc)
  },

  getCanvasTempFilePath: async function () {
    return await shareCardHandler.downloadCanvas()
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,

      canvasWidth: wx.getSystemInfoSync().windowWidth - 64,
      canvasHeight: parseInt(((wx.getSystemInfoSync().windowWidth - 64) * 311) / 311) + 78,

      capsuleInfo: wx.getMenuButtonBoundingClientRect(),
      windowWidth: wx.getSystemInfoSync().windowWidth,

      isIOS: app.globalData.isIOS,
    })
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _getDicCardList: function (wordInfolist, wordList, currentSwiperIndex) {
    let dicCardList = []

    for (let i = 0; i < wordList.length; i++) dicCardList[i] = {}
    dicCardList = dicCardList.map((item, index) => {
      if (index == currentSwiperIndex) {

        wordInfolist[index].isActive = true
        wordInfolist[index].currentWordCard = this.data.currentWordCard
        currentSwiperIndex = index
        return wordInfolist[index]

      } else {

        wordInfolist[index].isActive = false
        return wordInfolist[index]

      }
    })

    this.setData({
      showOverlay: true,
      showDicCardSwiper: true,
      dicCardList,
      currentSwiperIndex
    })
    this.getTabBar().setData({
      show: false
    })
  },

  /**
   * 发音事件
   *
   * @inner
   */
  _pronounce: function (word) {
    console.log(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`)
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {
      console.log("error",res)
      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    })
  },

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
   */
  _getWordListFromWordCardIDCheckedList: function (wordCardIDCheckedList) {

    let todayCardList = this.data.todayCardList
    let wordList = Array()

    for (let i = 0; i < todayCardList.length; i++) {
      if (wordCardIDCheckedList.indexOf(todayCardList[i].wordCardID) != -1) {
        wordList = wordList.concat(todayCardList[i].wordList)
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
      item.wordBookName = this.data.wordBookMyInfo.currentWordBookName
      item.wordList = item.wordInfoList.map(item => item.wordName)

      return item
    })

  },

  /**
   * 提示事件
   *
   * @inner
   */
  _showGuideOfAutolyCreated: function () {

    if (app.globalData.settings.showGuideOfAutolyCreated) {
      wx.showModal({
        content: '点击被遮挡部分可显示中文',
        showCancel: true,
        cancelText: '不再提醒',
        confirmText: '我知道啦',
        success: res => {
          if (res.cancel) {
            app.globalData.settings.showGuideOfTapToCancelBlur = false
            common.request({
              url: `/settings`,
              method: 'PUT',
              data: {
                showGuideOfTapToCancelBlur: false
              }
            })
          }
        }
      })
    }
  },

  /**
   * 提示事件
   *
   * @inner
   */
  _showGuideOfAddToMyMiniApp: function () {

    this.setData({
      showGuideOfAddToMyMiniApp: false
    })
    common.request({
      url: `/settings`,
      method: 'PUT',
      data: {
        showGuideOfAddToMyMiniApp: false
      }
    })

  },

  /**
   * 更新添加卡片按钮文案和VIP按钮显示
   * 内测阶段：注释VIP限制，隐藏VIP按钮
   */
  _updateAddCardButtonText: function(todayCardListData) {
    // 内测阶段暂时注释VIP限制，隐藏VIP按钮
    this.setData({ 
      addCardButtonText: '添加卡片',
      showVipButton: false,
      isLowRemaining: false
    })
    
    /* 原VIP限制逻辑，内测期间暂时注释
    try {
      const isVip = app && app.globalData && app.globalData.settings && !app.globalData.settings.isVipExpired
      if (isVip) {
        this.setData({ 
          addCardButtonText: '添加卡片',
          showVipButton: false,
          isLowRemaining: false
        })
        return
      }

      const check = dailyLimits.canCreateCard()
      const remaining = check.remaining
      this.setData({
        addCardButtonText: '添加卡片',
        showVipButton: true,
        vipButtonText: `今日余${remaining}张 · 升级无限制`,
        isLowRemaining: remaining <= 3
      })
    } catch (error) {
      console.error('Error updating add card button text:', error)
      this.setData({
        addCardButtonText: '添加卡片',
        showVipButton: false
      })
    }
    */
  },

  /**
   * 刷新添加卡片按钮文案（重新获取服务端数据）
   */
  _refreshAddCardButtonText: async function() {
    try {
      const homeData = await common.request({ url: `/homedata` })
      this._updateAddCardButtonText(homeData.todayCardList)
    } catch (error) {
      console.error('Failed to refresh add card button text:', error)
    }
  },

  /**
   * 更新换词按钮文案
   */
  _updateReplaceButtonText: function() {
    // 通过全局事件通知所有dic-card组件更新按钮文案
    wx.eventBus = wx.eventBus || {}
    wx.eventBus.updateReplaceButtonText = true
    
    // 延迟执行，确保组件能接收到事件
    setTimeout(() => {
      wx.eventBus.updateReplaceButtonText = false
    }, 100)
  },
})