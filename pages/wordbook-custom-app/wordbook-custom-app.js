import {
  Common
} from '../../models/common.js'
import {
  HTTP
} from '../../utils/http.js'
const common = new Common()
const http = new HTTP()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
import {
  config
} from '../../config.js'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  launchAppError(e) {
    console.log(e)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.setData({
      token: options.token
    })
    wx.request({
      url: config.api_base_url + '/settings',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'Authorization': this.data.token
      },
      success: res => {
        console.log(res)

        const code = res.statusCode.toString()
        if (code.startsWith('2')) {
          if (res.data.errcode == 0) {

            app.globalData.settings = res.data.data
            // console.log(app.globalData.settings)
            this.setData({
              currentWordBookCode: app.globalData.settings.currentWordBookCode
            })

            wx.request({
              url: config.api_base_url + `/wordbooks-custom?token=${this.data.token}`,
              method: 'GET',
              header: {
                'content-type': 'application/json',
                'Authorization': this.data.token
              },
              success: res => {
                console.log(res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {

                    let wordBookListCustom = res.data.data
                    this.setData({
                      isCustom: true,
                      wordBookListCustom,
                      showGuideOfCustomWordBook: true,
                      showGuideOfCustomWordBookVip: true
                    })

                  }
                }

              },
              fail: err => {
                console.error(err)
              },
            })

          }
        }

      },
      fail: err => {
        console.error(err)
      },
    })

    this._setInitPosiInfo()

  },

  /**
   * 监听点击取消事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onClickHideOverlay: function (e) {
    this.setData({
      showOverlay: false,
      showBlockContainer: false
    })
  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  onWordBook: function (e) {

    let wordBookListIndex = e.currentTarget.dataset.index
    let wordBook = this.data.wordBookList[wordBookListIndex]
    wordBook.isInLearningPlan ? this._onWordBookInLearningPlan(wordBook, wordBookListIndex) : this._onWordBookNotInLearningPlan(wordBook, wordBookListIndex)

  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  // _onWordBookNotInLearningPlan: function (wordBook, wordBookListIndex) {
  //   wx.showModal({ title: '提示', content: `是否将【${wordBook.wordBookName}】添加到计划并作为当前学习？`, confirmText: '好的' }).then(res => {

  //     if (res.confirm) {
  //       Toast.loading()
  //       http.request({ url: '/settings', method: 'PUT', data: { "currentWordBookCode": wordBook.wordBookCode } }).then(res => {

  //         http.request({ url: '/wordbook', method: 'PUT', data: { wordBookCode: wordBook.wordBookCode, isInLearningPlan: true } }).then(res => {


  //           wordBook.isInLearningPlan = true, wordBook.userProgressNum = 0, wordBook.userNum = wordBook.userNum + 1
  //           app.globalData.settings.currentWordBookCode = wordBook.wordBookCode
  //           this.setData({ [`wordBookList[${wordBookListIndex}]`]: wordBook, isBackReLoad: true, currentWordBookCode: wordBook.wordBookCode })
  //           Toast.success('添加成功')

  //         }).catch(err => console.error(err))
  //       }).catch(err => console.error(err))
  //     }
  //   })

  // },
  onShow: function () {
    let options = wx.getLaunchOptionsSync()
    console.log(options)
  },
  /**
   * 点击词书分类事件
   *
   * @event
   */
  _onWordBookInLearningPlan: function (wordBook, wordBookListIndex) {

    let currentWordBookCode = app.globalData.settings.currentWordBookCode
    if (currentWordBookCode == wordBook.wordBookCode) {

      wx.showModal({
        title: '提示',
        content: `当前学习词书只支持重置进度`,
        confirmText: '好的'
      }).then(res => {
        if (res.confirm) {

          let actions = [{
            name: '重置进度'
          }]
          this.setData({
            wordBook,
            wordBookListIndex,
            showPopup: true,
            showActionSheet: true,
            actions: actions,
            actionSheetDesc: '词书选项'
          })

        }
      }).catch(err => console.error(err))

    } else {

      let actions = [{
        name: '设置为当前学习'
      }, {
        name: '重置进度'
      }, {
        name: '从计划中移除'
      }]
      this.setData({
        wordBook,
        wordBookListIndex,
        showPopup: true,
        showActionSheet: true,
        actions: actions,
        actionSheetDesc: '词书选项'
      })

    }
  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  onWordBookCustom: function (e) {

    let wordBookListIndex = e.currentTarget.dataset.index
    let wordBook = this.data.wordBookListCustom[wordBookListIndex]

    let currentWordBookCode = app.globalData.settings.currentWordBookCode
    if (currentWordBookCode == wordBook.wordBookCode) {

      wx.showModal({
        title: '提示',
        content: `当前学习词书只支持重置进度`,
        confirmText: '好的'
      }).then(res => {
        if (res.confirm) {

          let actions = [{
            name: '重置进度'
          }]
          this.setData({
            wordBook,
            wordBookListIndex,
            showPopupCustom: true,
            showActionSheetCustom: true,
            actions: actions,
            actionSheetDesc: '词书选项'
          })

        }
      }).catch(err => console.error(err))

    } else {

      let actions = [{
        name: '设置为当前学习'
      }, {
        name: '重置进度'
      }, {
        name: '删除词书'
      }]
      this.setData({
        wordBook,
        wordBookListIndex,
        showPopupCustom: true,
        showActionSheetCustom: true,
        actions: actions,
        actionSheetDesc: '词书选项'
      })

    }

  },

  /**
   * 监听取消actionSheet
   *
   * @event
   */
  onCancelActionSheet: function () {
    this.setData({
      showPopup: false,
      showActionSheet: false,
      showPopupCustom: false,
      showActionSheetCustom: false
    })
  },

  /**
   * 监听选中actionSheet
   *
   * @event
   */
  onSelectActionSheetCustom: function (e) {
    this.onCancelActionSheet()
    let wordBook = this.data.wordBook
    let wordBookListIndex = this.data.wordBookListIndex

    switch (e.detail.name) {

      case '设置为当前学习': {
        wx.showModal({
          title: '提示',
          content: `是否将【${wordBook.wordBookName}】设为当前学习？`,
          confirmText: '好的'
        }).then(res => {
          if (res.confirm) {

            app.globalData.settings.currentWordBookCode = wordBook.wordBookCode
            this.setData({
              [`wordBookListCustom[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true,
              currentWordBookCode: wordBook.wordBookCode
            })
            Toast.loading()

            // console.log({ "wordBookCode": wordBook.wordBookCode })
            wx.request({
              url: config.api_base_url + '/settings',
              method: 'PUT',
              data: {
                "currentWordBookCode": wordBook.wordBookCode
              },
              header: {
                'content-type': 'application/json',
                'Authorization': this.data.token
              },
              success: res => {
                console.log(res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {
                    // 设置标记，通知首页需要刷新数据
                    wx.setStorageSync('needRefreshHomeData', true)
                    Toast.success('切换成功')
                  }
                }

              },
              fail: err => {
                console.error(err)
              },
            })

          }
        }).catch(err => console.error(err))
        break
      }

      case '重置进度': {
        wx.showModal({
          title: '提示',
          content: `词书进度将会被重置，且不可恢复，是否确认？`,
          confirmText: '确认'
        }).then(res => {
          if (res.confirm) {

            wordBook.userProgressNum = 0
            this.setData({
              [`wordBookListCustom[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true
            })
            Toast.loading()
            wx.request({
              url: config.api_base_url + '/wordbook/reset',
              method: 'PUT',
              data: {
                wordBookCode: wordBook.wordBookCode
              },
              header: {
                'content-type': 'application/json',
                'Authorization': this.data.token
              },
              success: res => {
                console.log(res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {
                    Toast.success('重进App生效')
                  }
                }

              },
              fail: err => {
                console.error(err)
              },
            })

          }
        })
        break
      }

      case '删除词书': {
        wx.showModal({
          title: '提示',
          content: `该词书将会被删除，且不可恢复，是否确认？`,
          confirmText: '确认'
        }).then(res => {
          if (res.confirm) {

            this.data.wordBookListCustom.splice(wordBookListIndex, 1)
            this.setData({
              wordBookListCustom: this.data.wordBookListCustom,
              isBackReLoad: true
            })
            wx.request({
              url: config.api_base_url + '/wordbook',
              method: 'DELETE',
              data: {
                wordBookCode: wordBook.wordBookCode
              },
              header: {
                'content-type': 'application/json',
                'Authorization': this.data.token
              },
              success: res => {
                // console.log(res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {
                    Toast.success('删除成功')
                  }
                }

              },
              fail: err => {
                console.error(err)
                Toast.fail(err)
              },
            })

          }
        })
        break
      }
    }
  },

  /**
   * 监听上传词书事件
   *
   * @event
   */
  uploadWordBookCustom: function () {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ["txt", "text", "xls", "xlsx"],
      success: res => {
        const tempFilePaths = res.tempFiles

        Toast.loading('上传中...')
        wx.uploadFile({
          url: config.api_base_url + '/wordbook',
          filePath: tempFilePaths[0].path,
          name: 'file',
          formData: {
            'wordBookName': tempFilePaths[0].name
          },
          header: {
            'content-type': 'multipart/form-data',
            'Authorization': this.options.token
          },
          success: (res) => {
            // console.log(res)

            if (JSON.parse(res.data).errcode == 410) {

              wx.showModal({
                title: '用量已达上限',
                content: '开通会员解锁更多用量',
                showCancel: false,
                confirmText: '立即开通',
                success: () => {
                  // 检查设备类型
                  const app = getApp()
                  if (app.globalData.isIOS) {
                    // iOS显示客服联系信息
                    wx.showModal({
                      title: '联系客服',
                      content: '由于苹果应用商店政策限制，iOS用户暂时无法在小程序内购买会员。请联系客服获取其他开通方式\n\n客服微信：MiddleRain_',
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
                            }
                          })
                        }
                      }
                    })
                  } else {
                    // 安卓跳转到VIP页面
                    wx.navigateTo({
                      url: `/pages/vip/vip?event=${'vip_wordbookcustom'}`
                    })
                  }
                }
              })

            } else {

              let wordBook = JSON.parse(res.data).data
              let wordBookListCustom = this.data.wordBookListCustom
              wordBookListCustom.unshift(wordBook)
              this.setData({
                wordBookListCustom,
                isBackReLoad: true,
                currentWordBookCode: wordBook.wordBookCode
              })

              Toast.loading()
              wx.request({
                url: config.api_base_url + '/settings',
                method: 'PUT',
                data: {
                  "currentWordBookCode": wordBook.wordBookCode
                },
                header: {
                  'content-type': 'application/json',
                  'Authorization': this.data.token
                },
                success: res => {
                  // console.log(res)

                  const code = res.statusCode.toString()
                  if (code.startsWith('2')) {
                    if (res.data.errcode == 0) {
                      Toast.success('重进App生效')
                    }
                  }

                },
                fail: err => {
                  console.error(err)
                },
              })

            }

          },
          fail: (err) => console.log(err)
        })
      },
      fail: (err) => console.log(err)
    })
  },

  /**
   * 取消引导提示事件
   *
   * @event
   */
  onCancelGuide: async function () {
    this.setData({ showGuideOfCustomWordBook: false })
    // common.request({ url: `/settings`, method: 'PUT', data: { showGuideOfCustomWordBook: false } })
    // Toast.fail('暂不支持')
  },

  /**
   * 取消引导提示事件
   *
   * @event
   */
  onCancelGuideVip: async function () {
    this.setData({ showGuideOfCustomWordBookVip: false })
    // common.request({ url: `/settings`, method: 'PUT', data: { showGuideOfCustomWordBookVip: false } })
    // Toast.fail('暂不支持')
  },

  /**
   * 监听退出页面事件
   *
   * @inner
   */
  onBack: function () {
    // 跳转回app
    Toast.fail('暂不支持')
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitPosiInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - (this.data.showFilterContainer ? 44 : 0),
      blockWidth: parseInt((wx.getSystemInfoSync().windowWidth - 18 * 2 - 22 * 2) / 3),

      isIOS: getApp().globalData.isIOS,
    })
  },
})