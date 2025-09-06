import {
  Common
} from '../../models/common.js'
const common = new Common()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const innerAudioContext = wx.createInnerAudioContext()
const backgroundAudioManager = wx.getBackgroundAudioManager()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isCollected: false,
    wordIndex: 0,
    outerIndex: 0,
    wordInfoVagueList: [],
    canClickFinishBtn: true,
    hasUnfinishedtask: true,
    showSkipWordDialog: false,
    showSkipWordPopup: false,
    skipWordActions: [{
      name: '本次跳过',
      subname: '跳过这个单词，继续下一个'
    }, {
      name: '移出卡片',
      subname: '从卡片中移除，不再出现',
      color: '#f56565'
    }],
    deleteWordInCardOption: false,
    // 单词顺序设置：true为乱序，false为顺序
    isWordOrderRandom: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 如果是resume
    if (options.resumeMode != null) {
      let unSaveData = wx.getStorageSync('data')
      this.setData({
        canClickFinishBtn: unSaveData.canClickFinishBtn,
        entryPage: unSaveData.entryPage,
        hasUnfinishedtask: unSaveData.hasUnfinishedtask,
        innerIndex: unSaveData.innerIndex,
        isCollected: unSaveData.isCollected,
        isDarkMode: unSaveData.isDarkMode,
        naviBarHeight: unSaveData.naviBarHeight,
        outerIndex: unSaveData.outerIndex,
        practiceMode: unSaveData.practiceMode,
        pronType: unSaveData.pronType,
        showCountDown: unSaveData.showCountDown,
        showProgress: unSaveData.showProgress,
        wordIndex: unSaveData.wordIndex,
        wordInfoList: unSaveData.wordInfoList,
        wordInfoVagueList: unSaveData.wordInfoVagueList
      })
    } else {
      console.log(app.globalData.practiceInfo)
      // 获取单词顺序设置，默认为乱序
      const isWordOrderRandom = app.globalData.settings?.isWordOrderRandom !== undefined 
        ? app.globalData.settings.isWordOrderRandom 
        : true;
      
      // 根据设置决定是否打乱单词顺序
      const wordInfoList = this._filter(
        isWordOrderRandom 
          ? this._shuffle(app.globalData.practiceInfo.wordInfoList)
          : app.globalData.practiceInfo.wordInfoList
      );
      
      this.setData({
        naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
        entryPage: options.entryPage,
        wordInfoList: wordInfoList,
        practiceMode: app.globalData.practiceInfo.practiceMode,
        innerIndex: app.globalData.practiceInfo.practiceMode == 'memorize' ? 0 : 1,
        pronType: app.globalData.settings.pronType,
        showCountDown: app.globalData.settings.showCountDown,
        showProgress: true,
        isDarkMode: getApp().globalData.isDarkMode,
        isWordOrderRandom: isWordOrderRandom,
      })
      if (this.data.practiceMode == 'spell') this.onSpell()
      if (this.data.practiceMode == 'memorize') this._showGuideOfTapToCancelCountDown()
      if (this.data.practiceMode == 'review') this._showGuideOfTapToCancelBlur()
      // 有问题，直接返回
      if (this.data.wordInfoList[0] == null) {
        Toast(' 系统错误\n请联系客服')
        setTimeout(() => {
          wx.navigateBack()
        }, 1500);
        return
      }
      this._pronounce(this.data.wordInfoList[0].word)

    }
    let wordDict = {}
    this.data.wordInfoList.forEach(wordInfo => {
      wordDict[wordInfo['word']] = {
        vague: 0,
        remember: 0
      }
    })
    this.setData({
      wordPracticeRecordDict: wordDict
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置状态栏颜色，适配浅色背景
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
  },

  /**
   * 在卡片中删除单词的弹窗中的选项
   * @param {*} e 
   */
  onChangeDeleteWordInCardOption: function (e) {
    this.setData({
      deleteWordInCardOption: e.detail
    })
  },
  /**
   * 监听点击遮罩事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onClickHideOverlay: function (e) {
    this.setData({
      showSearchBarSelfDef: false,
      showSearchBar: false,
      showDicCard: false,
      showPopup: false,
      showOverlay: false,
      showSpellBar: false
    })
  },

  onClickHideOverlayZIndex: function (e) {
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false,
      keyboardHeight: 0
    })
  },

  onCancelActionSheet: function () {
    this.setData({
      showPopupVant: false,
      showActionSheet: false
    })
  },

  /**
   * 监听点击收藏事件
   *
   * @event
   */
  onCollect: async function () {
    if (this.data.isFinished) {
      Toast('无效操作');
      return
    }

    let wordIndex = this.data.wordIndex
    let wordInfoList = this.data.wordInfoList
    this.setData({
      [`wordInfoList[${wordIndex}].isCollected`]: !wordInfoList[wordIndex].isCollected
    })

    let data = [{
      word: wordInfoList[wordIndex].word,
      isCollected: wordInfoList[wordIndex].isCollected
    }]
    await common.request({
      url: `/wordinfos`,
      data: data,
      method: 'PUT'
    })
    wordInfoList[wordIndex].isCollected ? Toast('　　　收藏成功　　　\n长按可选择单词本分组') : Toast('已取消收藏')
  },

  /**
   * 监听长按收藏事件
   *
   * @event
   */
  onWordGroup: async function () {
    if (this.data.isFinished) {
      Toast('无效操作');
      return
    }

    if (this.data.wordInfoList[this.data.wordIndex].isCollected) {
      Toast('请先取消收藏')
    } else {
      Toast.loading()
      let wordGroupList = await common.request({
        url: '/wordgroup'
      })

      // In Order To: 我的收藏排在第一位
      let defaultWordGroupIndex = wordGroupList.findIndex(item => item.id == 0)
      let defaultWordGroup = wordGroupList.splice(defaultWordGroupIndex, 1)[0]
      wordGroupList.unshift(defaultWordGroup)
      Toast.clear()

      this.setData({
        showOverlay: true,
        showPopup: true
      })
      for (let i = 0; i < wordGroupList.length; i++) wordGroupList[i].isChecked = false
      this.setData({
        wordGroupList
      })
    }
  },

  /**
   * 监听添加单词到单词本
   *
   * @event
   * @param { Object } e 事件参数
   */
  onCollectToWordGroup: async function (e) {
    let wordInfoList = this.data.wordInfoList
    let wordIndex = this.data.wordIndex
    let word = wordInfoList[wordIndex].word
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
      [`wordInfoList[${wordIndex}].isCollected`]: true
    })
    this.setData({
      [`wordInfo.isCollected`]: true
    })
    if (this.data.showDicCard) {
      this.setData({
        showOverlayZIndex: false,
        showPopup: false
      })
    } else this.setData({
      showOverlay: false,
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
   * 拼写模式相关
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSpell: function () {
    if (this.data.isFinished) {
      Toast('无效操作');
      return
    }
    this.setData({
      showSpellBar: true,
      showOverlay: true,
      isWordBlur: true
    })
  },

  onSpellBarFocus: function (e) {
    this.setData({
      keyboardHeight: e.detail.height
    })
  },

  onSpellBarBlur: function (e) {
    // this.setData({ showSpellBar: false, showOverlay: false, isWordBlur: false })
  },
  // 忽略大小写，忽略前后空格
  checkSpellRight: function (rightWord, userSpellWord) {
    if (userSpellWord == undefined) return false
    return rightWord.trim().search(new RegExp(userSpellWord.trim(), 'i')) !== -1
  },
  onSpellBarEvent: function (e) {
    switch (e.detail.type) {
      case 'confirm':
        if (this.checkSpellRight(e.detail.word, this.data.wordInfoList[this.data.wordIndex].word)) {
          Toast.success('拼写正确')
          this.setData({
            showSpellBar: false,
            showOverlay: false,
            isWordBlur: false
          })
        } else Toast('拼写错误')
        break
      case 'hint':
        this.setData({
          isWordBlur: !this.data.isWordBlur
        })
        break
    }
  },

  /**
   * 监听显示中文事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onWordCN: function (e) {
    this.setData({
      showWordCN: true
    })
  },

  /**
   * 单词发音事件
   *
   * @inner
   */
  onSound: function () {
    let word = this.data.isFinished ? 'congratulation' : this.data.wordInfoList[this.data.wordIndex].word
    this._pronounce(word)
  },
  // 处理跳过单词选项
  onSelectSkipWordAction: function (e) {
    this.setData({
      showSkipWordDialog: false,
      showSkipWordPopup: false
    })
    
    if (e.detail.name === '本次跳过') {
      this.onSkipCurrentWord()
    } else if (e.detail.name === '移出卡片') {
      this.showDeleteConfirmation()
    }
  },

  // 显示删除确认弹窗
  showDeleteConfirmation: function () {
    wx.showModal({
      title: '移出卡片',
      content: '移除后将不会再出现在当前卡片中',
      showCancel: true,
      cancelText: '取消',
      confirmText: '移出',
      confirmColor: '#f56565',
      success: (res) => {
        if (res.confirm) {
          this.onDeleteWordFromCard()
        }
      }
    })
  },

  // 本次跳过单词
  onSkipCurrentWord: function () {
    let word = this.data.wordInfoList.splice(this.data.wordIndex, 1)
    console.log('Skip current word:', word)
    
    this.setData({
      wordInfoList: this.data.wordInfoList,
      outerIndex: this.data.outerIndex == this.data.wordIndex && this.data.practiceMode == 'memorize' ? this.data.outerIndex : this.data.outerIndex - 1,
      innerIndex: 0,
    })
    
    if (this.data.wordInfoList.length > 0) {
      this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)
    }
  },

  // 永久删除单词
  onDeleteWordFromCard: async function () {
    let word = this.data.wordInfoList.splice(this.data.wordIndex, 1)
    console.log('Delete word from card:', word)
    
    // 一键复习模式使用cardIDList，其他模式使用wordCardIDCheckedList
    let wordCardIDCheckedList = this.data.entryPage === 'quickReview'
      ? app.globalData.practiceInfo.cardIDList
      : app.globalData.practiceInfo.wordCardIDCheckedList
    
    try {
      // 发请求删除单词
      await common.request({
        url: `/userCard/word/delete-batch`,
        method: 'DELETE',
        data: {
          cardIdArr: wordCardIDCheckedList,
          word: word[0].word
        }
      })
      
      // 删除单词时，将其熟练度设置为0，表示已掌握（opacity=0表示完全掌握）
      try {
        await common.request({
          url: `/word/familiar/batch`,
          method: 'PUT',
          data: [{
            word: word[0].word,
            familiar: 0, // 设置为0表示已掌握（opacity=0）
            cardID: wordCardIDCheckedList[0].toString() // 使用第一个卡片ID
          }]
        })
        console.log(`已将删除的单词 ${word[0].word} 熟练度设置为0（已掌握）`)
      } catch (familiarError) {
        console.warn(`设置删除单词熟练度失败:`, familiarError)
        // 熟练度设置失败不影响删除操作
      }
      
      this.setData({
        wordInfoList: this.data.wordInfoList,
        outerIndex: this.data.outerIndex == this.data.wordIndex && this.data.practiceMode == 'memorize' ? this.data.outerIndex : this.data.outerIndex - 1,
        innerIndex: 0,
      })
      
      if (this.data.wordInfoList.length > 0) {
        this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)
      }
      
      Toast.success('移出成功')
    } catch (error) {
      console.error('删除单词失败:', error)
      // 如果删除失败，需要将单词重新加回数组
      this.data.wordInfoList.splice(this.data.wordIndex, 0, word[0])
      this.setData({
        wordInfoList: this.data.wordInfoList
      })
      Toast.fail('移出失败，请重试')
    }
  },

  // 取消跳过单词弹窗
  onSkipWordDialogCancel: function () {
    this.setData({
      showSkipWordDialog: false,
      showSkipWordPopup: false
    })
  },

  // 保留原有的确认函数以防兼容性问题
  onSkipWordDialogConfirm: function () {
    this.onSkipCurrentWord()
  },
  /**
   * 删除事件 showWOrdCN
   *
   * @event
   */
  onDelete: function () {
    this.setData({
      showSkipWordPopup: true,
      showSkipWordDialog: true
    })

    // if (this.data.isFinished) {
    //   Toast('无效操作');
    //   return
    // }
    // if ((this.data.outerIndex + 1) == this.data.wordInfoList.length) {
    //   wx.showModal({
    //     title: '提示',
    //     content: '最后一轮练习无法跳过单词',
    //     confirmText: '好的',
    //     showCancel: true
    //   })
    // } else {
    //   wx.showModal({
    //     title: '提示',
    //     content: '本次练习将跳过该词',
    //     confirmText: '好的',
    //     success: res => {
    //       if (res.confirm) {
    //       
    //     }
    //   })

    // }
  },

  /**
   * 点击更多事件
   *
   * @event
   */
  onMore: function (e) {
    if (this.data.isFinished) {
      Toast('无效操作');
      return
    }
    this.setData({
      showPopupVant: true,
      showActionSheet: true,
      actionSheetDesc: '练习模式偏好设置',
      actions: [{
        name: `${app.globalData.settings.showCountDown ? '关闭' : '开启'}提示倒计时`
      }, {
        name: `${app.globalData.settings.isResultShownWhenTapRemember ? '点击记得不显示释义' : '点击记得显示释义'}`
      }, {
        name: `${this.data.isWordOrderRandom ? '切换为顺序练习' : '切换为乱序练习'}`
      }]
    })
  },

  /**
   * 监听选择弹出框事件
   *
   * @event
   */
  onSelectActionSheet: function (e) {

    if (e.detail.name.indexOf('提示倒计时') != -1) {

      this.onCancelActionSheet()
      this.setData({
        showCountDown: e.detail.name == '关闭提示倒计时' ? false : true
      })
      app.globalData.settings.showCountDown = this.data.showCountDown
      common.request({
        url: `/settings`,
        method: 'PUT',
        data: {
          showCountDown: this.data.showCountDown
        }
      })
      Toast.success('设置成功')

    } else if (e.detail.name.indexOf('显示释义') != -1) {

      this.onCancelActionSheet()
      app.globalData.settings.isResultShownWhenTapRemember = e.detail.name == '点击记得显示释义' ? true : false
      common.request({
        url: `/settings`,
        method: 'PUT',
        data: {
          isResultShownWhenTapRemember: app.globalData.settings.isResultShownWhenTapRemember
        }
      })
      Toast.success('设置成功')

    } else if (e.detail.name.indexOf('练习') != -1) {

      this.onCancelActionSheet()
      const newOrderRandom = e.detail.name == '切换为乱序练习' ? true : false
      
      // 更新本地状态
      this.setData({
        isWordOrderRandom: newOrderRandom
      })
      
      // 更新全局设置
      if (!app.globalData.settings) {
        app.globalData.settings = {}
      }
      app.globalData.settings.isWordOrderRandom = newOrderRandom
      
      // 保存到服务器
      common.request({
        url: `/settings`,
        method: 'PUT',
        data: {
          isWordOrderRandom: newOrderRandom
        }
      })
      
      // 重新排序当前单词列表
      this._reorderWordList(newOrderRandom)
      
      Toast.success(newOrderRandom ? '切换为乱序' : '切换为顺序')

    }

  },

  /**
   * 添加自定义事件
   *
   * @event
   */
  onSelfDef: function () {
    this.setData({
      showOverlayZIndex: true,
      showSearchBarSelfDef: true
    })
  },

  /**
   * 监听显示详细释义
   *
   * @event
   */
  onShowDic: async function () {
    Toast.loading({
      message: '加载中...',
      forbidClick: true
    })
    let word = this.data.wordInfoList[this.data.wordIndex].word
    let wordInfo = await common.request({
      url: `/wordinfo/search?word=${word}`
    })
    Toast.clear()

    this.setData({
      wordInfo,
      showDicCard: true,
      showOverlay: true
    })
    this._pronounce(word)
  },

  /**
   * 监听完成修改自定义释义事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarSelfDefConfirm: async function (e) {

    if (this.data.showDicCard) {

      let wordIndex = this.data.wordIndex
      let word = this.data.wordInfoList[wordIndex].word
      let data = [{
        word: word,
        selfDef: e.detail.value
      }]
      this.setData({
        [`wordInfoList[${wordIndex}].selfDef`]: e.detail.value
      })
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

    } else {

      let wordIndex = this.data.wordIndex
      let word = this.data.wordInfoList[wordIndex].word
      let data = [{
        word: word,
        selfDef: e.detail.value
      }]
      this.setData({
        [`wordInfoList[${wordIndex}].selfDef`]: e.detail.value
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
   * 监听自定义释义输入框获得焦点事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onSearchBarSelfDefFocus: function (e) {
    this.setData({
      keyboardHeight: e.detail.height
    })
  },

  /**
   * 监听取消修改自定义释义事件
   *
   * @event
   */
  onSearchBarSelfDefCancel: function () {
    this.setData({
      showSearchBarSelfDef: false,
      showOverlayZIndex: false,
      keyboardHeight: 0
    })
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

    } else if (e.detail.type == 'collect') {

      this.setData({
        [`wordInfo.isCollected`]: e.detail.isCollected
      })
      this.onCollect()

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
      console.log(e)
      this._pronounce(e.detail.word)

    }
  },

  /**
   * 监听下一步事件
   *
   * @event
   */
  onNext: async function (e) {
    let innerIndex = this.data.innerIndex
    let outerIndex = this.data.outerIndex
    let wordIndex = this.data.wordIndex
    let wordInfoList = this.data.wordInfoList
    let practiceMode = this.data.practiceMode

    // 0代表右侧是详细释义那个界面
    if (this.data.innerIndex != 0) {
      let isVague = e.currentTarget.dataset.side == 'right'
      let currentWord = wordInfoList[wordIndex].word
      let wordPracticeRecordDict = this.data.wordPracticeRecordDict
      
      // 只有在非巩固练习阶段才记录到熟练度统计中
      if (!this.data.isVagueMode || this.data.practiceMode !== 'review') {
        if (isVague) {
          wordPracticeRecordDict[currentWord].vague = wordPracticeRecordDict[currentWord].vague + 1
        }
        if (!isVague) {
          wordPracticeRecordDict[currentWord].remember = wordPracticeRecordDict[currentWord].remember + 1
        }
        this.setData({
          wordPracticeRecordDict
        })
        console.log(`记录练习数据 - 单词: ${currentWord}, 模糊: ${isVague}, 当前统计:`, wordPracticeRecordDict[currentWord])
      } else {
        console.log(`巩固练习阶段，不记录熟练度统计 - 单词: ${currentWord}, 模糊: ${isVague}`)
      }
    }

    // todo
    this.setData({
      showWordCN: false
    })

    // onPress: 'vague'
    if (e.currentTarget.dataset.side == 'right') {
      let vagueWord = wordInfoList[wordIndex].word
      if (this.data.wordInfoVagueList.find(item => item.word == vagueWord) == undefined) {
        this.data.wordInfoVagueList.push(wordInfoList.find(item => item.word == vagueWord))
        this.setData({
          wordInfoVagueList: this.data.wordInfoVagueList
        })
      }
    }

    if (practiceMode == 'memorize') {
      // ---- Finished ----
      if (innerIndex == wordInfoList.length && outerIndex == (wordInfoList.length - 1) && wordIndex == (wordInfoList.length - 1)) {
        if (this.data.wordInfoVagueList.length == 0) {
          this.setData({
            isFinished: true
          })
          return
        } else {
          this.setData({
            isVagueMode: true,
            wordInfoList: this.data.wordInfoVagueList,
            practiceMode: 'review',
            innerIndex: 1,
            wordIndex: 0,
            outerIndex: 0
          })
          this.setData({
            wordInfoVagueList: []
          })
          this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)
        }
        // ---- Non Finished ----
      } else if (innerIndex > outerIndex) {
        if (e.currentTarget.dataset.side == 'right' || (app.globalData.settings.isResultShownWhenTapRemember ? e.currentTarget.dataset.side == 'left' : false)) {
          // onPress: 'vague'
          innerIndex = 0
          this.setData({
            isLastWordVague: true
          })
        } else {
          innerIndex = 0, outerIndex++, wordIndex = outerIndex
        }

        this.setData({
          innerIndex,
          outerIndex,
          wordIndex
        })
        this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)

      } else {

        if (outerIndex == wordIndex) {
          if (innerIndex == 0) {
            if (this.data.isLastWordVague) {
              outerIndex++, wordIndex++
              this.setData({
                isLastWordVague: false
              })
            } else {
              // Random WordList
              let wordInfoList = this._shuffle(this.data.wordInfoList.slice(0, outerIndex + 1))
              let wordInfoList_new = this.data.wordInfoList.slice(outerIndex + 1)
              for (let i = 0; i < wordInfoList_new.length; i++) {
                wordInfoList.push(wordInfoList_new[i])
              }
              this.setData({
                wordInfoList
              })

              wordIndex = innerIndex, innerIndex++
            }

          } else {
            wordIndex = innerIndex, innerIndex++
          }

        } else {
          // 。。
          if (e.currentTarget.dataset.side == 'right' || (app.globalData.settings.isResultShownWhenTapRemember ? e.currentTarget.dataset.side == 'left' : false) && innerIndex != 0) {

            // onPress: 'vague'
            innerIndex = 0

          } else {

            // onPress: 'vague' -> '记住了'
            if (innerIndex == 0) {
              wordIndex++
              innerIndex = wordIndex + 1
            } else {
              wordIndex++, innerIndex++
            }
          }
        }

        this.setData({
          innerIndex,
          outerIndex,
          wordIndex
        })
        this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)
      }

    } else if (practiceMode == 'review' || practiceMode == 'spell') {
      // ---- Finished ----
      if (innerIndex == 0 && wordIndex == (wordInfoList.length - 1)) {

        if (this.data.wordInfoVagueList.length == 0) {

          this.setData({
            isFinished: true,
            isWordBlur: true
          })
          return

        } else {

          if (practiceMode == 'spell') this.onSpell()
          this.setData({
            isVagueMode: true,
            wordInfoList: this.data.wordInfoVagueList,
            practiceMode: 'review',
            innerIndex: 1,
            wordIndex: 0,
            outerIndex: 0
          })
          this.setData({
            wordInfoVagueList: []
          })
          this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)

        }

        // ---- Non Finished ----
      } else if (innerIndex == 0) {

        if (practiceMode == 'spell') this.onSpell()
        wordIndex++, outerIndex++, innerIndex = outerIndex
        this.setData({
          innerIndex,
          outerIndex,
          wordIndex
        })
        this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)

      } else {

        innerIndex = 0
        this.setData({
          innerIndex,
          outerIndex,
          wordIndex
        })
        this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)
      }
    }
  },

  /**
   * 监听完成事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onFinished: async function (e) {

    if (!this.data.canClickFinishBtn) return
    this.setData({
      canClickFinishBtn: false
    })
    let wordPracticeRecordDict = this.data.wordPracticeRecordDict
    let practiceWordReportArrayList = [];
    for (let word in wordPracticeRecordDict) {
      if (wordPracticeRecordDict.hasOwnProperty(word)) {
        let report = {
          word: word,
          rememberCount: wordPracticeRecordDict[word].remember,
          vagueCount: wordPracticeRecordDict[word].vague
        };
        practiceWordReportArrayList.push(report);
      }
    }
    // 保存学习记录
    await common.request({
      url: `/practice-report`,
      method: 'POST',
      data: practiceWordReportArrayList
    })

    // 智能更新单词熟练度
    await this._updateWordFamiliarity(wordPracticeRecordDict)


    // 从已删除页面进入，也无需保存
    if (this.data.entryPage != 'wordgroup' && this.data.entryPage != 'deleted') {

      Toast.loading({
        forbidClick: true
      })
      
      // 一键复习模式使用cardIDList，其他模式使用wordCardIDCheckedList
      let data = this.data.entryPage === 'quickReview' 
        ? app.globalData.practiceInfo.cardIDList
        : app.globalData.practiceInfo.wordCardIDCheckedList
        
      await common.request({
        url: `/wordcards/practice`,
        method: 'PUT',
        data: data
      })


      let wordCardIDCheckedList = this.data.entryPage === 'quickReview'
        ? app.globalData.practiceInfo.cardIDList
        : app.globalData.practiceInfo.wordCardIDCheckedList
      let pages = getCurrentPages()
      let prevPage = pages[pages.length - 2]
      
      if (this.data.entryPage == 'quickReview') {
        // 一键复习完成处理
        Toast.success('复习完成！')
        this.setData({
          canClickFinishBtn: false,
          hasUnfinishedtask: false
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 800)
        
      } else if (this.data.entryPage == 'index') {

        let wordCardList = await common.request({
          url: `/wordcards?word-card-id-list=${wordCardIDCheckedList.join(',')}`
        })
        // UPDATE: todayCardList
        wordCardIDCheckedList.forEach((item, index) => {
          let currentWordCardIndex = prevPage.data.todayCardList.findIndex(_item => _item.wordCardID == item)
          console.log("currentWordCardIndex",currentWordCardIndex)
          if(currentWordCardIndex == -1){
            return
          }
          prevPage.setData({
            [`todayCardList[${currentWordCardIndex}]._relatedAction`]: 'practice',
            [`todayCardList[${currentWordCardIndex}].realPracticeNum`]: wordCardList[index].realPracticeNum,
            [`todayCardList[${currentWordCardIndex}].nextPracticeTimeStamp`]: wordCardList[index].nextPracticeTimeStamp,
            wordCardIDCheckedList: [],
          })
        })

        Toast.success('保存成功')
        this.setData({
          canClickFinishBtn: false,
          hasUnfinishedtask: false
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 800)

      } else if (this.data.entryPage == 'review') {

        let wordCardList = await common.request({
          url: `/wordcards?word-card-id-list=${wordCardIDCheckedList.join(',')}`
        })
        // console.log(wordCardList)

        // UPDATE: reviewCardDateList
        wordCardIDCheckedList.forEach((item, index) => {

          for (let i = 0; i < prevPage.data.reviewCardDateList.length; i++) {
            for (let j = 0; j < prevPage.data.reviewCardDateList[i].wordCardList.length; j++) {
              if (item == prevPage.data.reviewCardDateList[i].wordCardList[j].wordCardID) {
                prevPage.setData({
                  [`reviewCardDateList[${i}].wordCardList[${j}]._relatedAction`]: 'practice',
                  [`reviewCardDateList[${i}].wordCardList[${j}].realPracticeNum`]: wordCardList[index].realPracticeNum,
                  [`reviewCardDateList[${i}].wordCardList[${j}].nextPracticeTimeStamp`]: wordCardList[index].nextPracticeTimeStamp,
                  wordCardIDCheckedList: [],
                })
              }
            }
          }
        })

        Toast.success('保存成功')
        this.setData({
          canClickFinishBtn: false,
          hasUnfinishedtask: false
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 800)

      } else if (this.data.entryPage == 'calendar') {

        let wordCardList = await common.request({
          url: `/wordcards?word-card-id-list=${wordCardIDCheckedList.join(',')}`
        })
        // console.log(wordCardList)

        // UPDATE: wordCardList
        wordCardIDCheckedList.forEach((item, index) => {
          let currentWordCardIndex = prevPage.data.wordCardList.findIndex(_item => _item.wordCardID == item)
          prevPage.setData({
            [`wordCardList[${currentWordCardIndex}]._relatedAction`]: 'practice',
            [`wordCardList[${currentWordCardIndex}].realPracticeNum`]: wordCardList[index].realPracticeNum,
            [`wordCardList[${currentWordCardIndex}].nextPracticeTimeStamp`]: wordCardList[index].nextPracticeTimeStamp,
            wordCardIDCheckedList: [],
          })
        })

        Toast.success('保存成功')
        this.setData({
          canClickFinishBtn: false,
          hasUnfinishedtask: false
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 800)

      }
    } else wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function (e) {
    if (this.data.hasUnfinishedtask) {
      wx.setStorageSync('hasUnfinishedTask', true)
      wx.setStorageSync('data', this.data)
    }
  },

  /**
   * 发音事件
   *
   * @inner
   */
  _pronounce: function (word) {
    if (typeof (word) != 'string') {
      word = this.data.wordInfoList[this.data.wordIndex].word
    }

    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {
      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    })
  },

  /**
   * 智能更新单词熟练度
   * 
   * @inner
   * @param {Object} wordPracticeRecordDict 练习记录字典
   */
  _updateWordFamiliarity: async function (wordPracticeRecordDict) {
    try {
      console.log('开始更新单词熟练度，练习记录:', wordPracticeRecordDict)
      console.log('当前状态 - isVagueMode:', this.data.isVagueMode, 'practiceMode:', this.data.practiceMode)
      // 构建熟练度更新数据
      const familiarityUpdateList = []
      
      // 获取卡片ID列表
      const wordCardIDCheckedList = this.data.entryPage === 'quickReview'
        ? app.globalData.practiceInfo.cardIDList
        : app.globalData.practiceInfo.wordCardIDCheckedList

      // 为每个练习过的单词计算熟练度
      for (let word in wordPracticeRecordDict) {
        if (wordPracticeRecordDict.hasOwnProperty(word)) {
          const record = wordPracticeRecordDict[word]
          const familiar = this._calculateFamiliarity(record.remember, record.vague)
          
          // 找到对应的单词信息
          const wordInfo = this.data.wordInfoList.find(item => item.word === word)
          let cardID = null
          
          // 尝试多种方式获取cardID
          if (wordInfo) {
            // 方式1: 直接从wordInfo获取
            cardID = wordInfo.cardID || wordInfo.wordCardID
            
            // 方式2: 如果没有cardID，尝试从wordCardIDCheckedList获取
            if (!cardID) {
              const wordIndex = this.data.wordInfoList.findIndex(item => item.word === word)
              if (wordIndex >= 0 && wordIndex < wordCardIDCheckedList.length) {
                cardID = wordCardIDCheckedList[wordIndex]
              }
            }
          }
          
          // 方式3: 如果还是没有cardID，使用第一个可用的cardID（适用于单卡片多单词的情况）
          if (!cardID && wordCardIDCheckedList.length > 0) {
            cardID = wordCardIDCheckedList[0]
          }
          
          if (cardID) {
            familiarityUpdateList.push({
              word: word,
              familiar: 100 - familiar, // 转换为opacity值：100表示未学过，0表示掌握
              cardID: cardID.toString() // 确保cardID是字符串
            })
          } else {
            console.warn(`无法获取单词 ${word} 的cardID，跳过熟练度更新`)
          }
        }
      }

      // 如果有需要更新的数据，调用批量更新接口
      if (familiarityUpdateList.length > 0) {
        console.log('准备更新单词熟练度:', familiarityUpdateList)
        
        try {
          const response = await common.request({
            url: `/word/familiar/batch`,
            method: 'PUT',
            data: familiarityUpdateList
          })
          
          if (response && response.errcode === 0) {
            console.log(`单词熟练度更新成功，共更新${familiarityUpdateList.length}个单词`)
          } else {
            console.warn('单词熟练度更新响应异常:', response)
          }
        } catch (apiError) {
          console.error('调用熟练度更新接口失败:', apiError)
          throw apiError // 重新抛出错误，让外层catch处理
        }
      } else {
        console.log('没有需要更新熟练度的单词')
      }
    } catch (error) {
      console.error('更新单词熟练度失败:', error)
      // 熟练度更新失败不影响主流程，只记录错误
    }
  },

  /**
   * 计算单词熟练度
   * 
   * @inner
   * @param {number} rememberCount 记住次数
   * @param {number} vagueCount 模糊次数
   * @returns {number} 熟练度分数 (0-100)
   */
  _calculateFamiliarity: function (rememberCount, vagueCount) {
    // 智能熟练度计算算法
    const totalCount = rememberCount + vagueCount
    
    if (totalCount === 0) {
      // 练习过但没有记录的情况，给予最低练习分数，避免标记为未学过
      return 10 // 最低练习分数，表示已经练习过
    }
    
    // 基础分数：记住率 * 100
    const rememberRate = rememberCount / totalCount
    let baseScore = Math.round(rememberRate * 100)
    
    // 根据练习次数调整分数
    if (totalCount === 1) {
      // 只练习了一次
      if (rememberCount === 1) {
        baseScore = Math.min(baseScore, 75) // 最高75分
      } else {
        baseScore = Math.max(baseScore, 15) // 最低15分，确保练习过的单词不为0
      }
    } else if (totalCount === 2) {
      // 练习了两次
      if (rememberCount === 2) {
        baseScore = Math.min(baseScore, 85) // 最高85分
      } else if (rememberCount === 1) {
        baseScore = Math.min(baseScore, 60) // 最高60分
      } else {
        baseScore = Math.max(baseScore, 20) // 全部模糊也给20分，表示练习过
      }
    } else if (totalCount >= 3) {
      // 练习了三次或以上，可以达到满分
      if (rememberCount === totalCount) {
        baseScore = 100 // 全部记住，满分
      } else if (rememberRate >= 0.8) {
        baseScore = Math.min(baseScore, 90) // 80%以上记住率，最高90分
      } else if (rememberRate >= 0.6) {
        baseScore = Math.min(baseScore, 75) // 60%以上记住率，最高75分
      } else {
        baseScore = Math.max(baseScore, 25) // 即使记住率低，也给25分表示练习过
      }
    }
    
    // 确保分数在10-100范围内，练习过的单词最低10分
    return Math.max(10, Math.min(100, baseScore))
  },



  /**
   * 提示事件
   *
   * @inner
   */
  _showGuideOfTapToCancelBlur: function () {

    if (app.globalData.settings.showGuideOfTapToCancelBlur) {
      wx.showModal({
        title: '提示',
        content: '点击空白区域可显示中文',
        showCancel: true,
        cancelText: '不再提醒',
        confirmText: '好的',
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

  _showGuideOfTapToCancelCountDown: function () {

    if (app.globalData.settings.showGuideOfCountDown) {
      wx.showModal({
        title: '提示',
        content: '点击倒计时可关闭引导提示',
        showCancel: true,
        cancelText: '不再提醒',
        confirmText: '好的',
        success: res => {
          if (res.cancel) {
            app.globalData.settings.showGuideOfCountDown = false
            common.request({
              url: `/settings`,
              method: 'PUT',
              data: {
                showGuideOfCountDown: false
              }
            })
          }
        }
      })
    }
  },

  _shuffle: function (arr) {
    for (let i = arr.length; i; i--) {
      let j = Math.floor(Math.random() * i);
      [arr[i - 1], arr[j]] = [arr[j], arr[i - 1]];
    }

    return arr
  },

  /**
   * 重新排序单词列表
   * @param {boolean} isRandom 是否随机排序
   */
  _reorderWordList: function(isRandom) {
    // 获取原始单词列表（从全局数据中）
    const originalWordList = [...app.globalData.practiceInfo.wordInfoList];
    
    // 根据设置重新排序
    const newWordList = this._filter(
      isRandom ? this._shuffle([...originalWordList]) : originalWordList
    );
    
    // 重置练习状态
    this.setData({
      wordInfoList: newWordList,
      wordIndex: 0,
      outerIndex: 0,
      innerIndex: this.data.practiceMode == 'memorize' ? 0 : 1
    });
    
    // 发音第一个单词
    if (newWordList.length > 0) {
      this._pronounce(newWordList[0].word);
    }
  },

  _filter: function (arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == null) {
        arr.splice(i, 1)
      }
    }
    return arr
  },
})