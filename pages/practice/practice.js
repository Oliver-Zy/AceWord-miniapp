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
    deleteWordInCardOption: false
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
      this.setData({
        naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
        entryPage: options.entryPage,
        wordInfoList: this._filter(this._shuffle(app.globalData.practiceInfo.wordInfoList)),
        practiceMode: app.globalData.practiceInfo.practiceMode,
        innerIndex: app.globalData.practiceInfo.practiceMode == 'memorize' ? 0 : 1,
        pronType: app.globalData.settings.pronType,
        showCountDown: app.globalData.settings.showCountDown,
        showProgress: true,
        isDarkMode: getApp().globalData.isDarkMode,
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
  onSkipWordDialogConfirm: function () {
    let word = this.data.wordInfoList.splice(this.data.wordIndex, 1)
    console.log(word)
    let wordCardIDCheckedList = app.globalData.practiceInfo.wordCardIDCheckedList
    if (this.data.deleteWordInCardOption) {
      // 发请求
      common.request({
        url: `/userCard/word/delete-batch`,
        method: 'DELETE',
        data: {
          cardIdArr: wordCardIDCheckedList,
          word: word[0].word
        } 
      })
    }
    this.setData({
      wordInfoList: this.data.wordInfoList,
      outerIndex: this.data.outerIndex == this.data.wordIndex && this.data.practiceMode == 'memorize' ? this.data.outerIndex : this.data.outerIndex - 1,
      innerIndex: 0,
    })
    this._pronounce(this.data.wordInfoList[this.data.wordIndex].word)
  },
  /**
   * 删除事件 showWOrdCN
   *
   * @event
   */
  onDelete: function () {
    this.setData({
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

    }

  },

  /**
   * 添加自定义事件
   *
   * @event
   */
  onSelfDef: function () {
    this.setData({
      showOverlay: true,
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
        showOverlay: false
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
    // 从已删除页面进入，也无需保存
    if (this.data.entryPage != 'wordgroup' && this.data.entryPage != 'deleted') {

      Toast.loading({
        forbidClick: true
      })
      let data = app.globalData.practiceInfo.wordCardIDCheckedList
      await common.request({
        url: `/wordcards/practice`,
        method: 'PUT',
        data: data
      })

      let wordCardIDCheckedList = app.globalData.practiceInfo.wordCardIDCheckedList
      let pages = getCurrentPages()
      let prevPage = pages[pages.length - 2]
      if (this.data.entryPage == 'index') {

        let wordCardList = await common.request({
          url: `/wordcards?word-card-id-list=${wordCardIDCheckedList.join(',')}`
        })
        // console.log(wordCardList)

        // UPDATE: todayCardList
        wordCardIDCheckedList.forEach((item, index) => {
          let currentWordCardIndex = prevPage.data.todayCardList.findIndex(_item => _item.wordCardID == item)
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

    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    innerAudioContext.play()
    innerAudioContext.onError((res) => {
      backgroundAudioManager.title = word
      backgroundAudioManager.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=${app.globalData.settings.pronType == 'US' ? 0 : 1}`
    })
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

  _filter: function (arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] == null) {
        arr.splice(i, 1)
      }
    }
    return arr
  },
})