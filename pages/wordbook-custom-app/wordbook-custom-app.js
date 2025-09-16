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
    // 支持从外部传入token（如H5页面），也支持内部使用
    const externalToken = options.token
    if (externalToken) {
      this.setData({
        token: externalToken
      })
    }

    this._setInitPosiInfo()
    
    // 加载用户设置和自定义词书数据
    await this._loadUserData()
  },

  /**
   * 加载用户数据
   */
  _loadUserData: async function() {
    try {
      // 获取用户设置
      const settings = await common.request({
        url: '/settings',
        method: 'GET'
      })
      
      app.globalData.settings = settings
      this.setData({
        currentWordBookCode: settings.currentWordBookCode
      })

      // 获取自定义词书列表
      const wordBookListCustom = await common.request({
        url: '/wordbooks-custom',
        method: 'GET'
      })

      this.setData({
        isCustom: true,
        wordBookListCustom: wordBookListCustom || [],
        showGuideOfCustomWordBook: true, // 始终显示基础引导
        showGuideOfCustomWordBookVip: true // 始终显示VIP功能说明
      })

    } catch (err) {
      console.error('加载用户数据失败:', err)
      
      // 如果是token问题，显示空状态但不报错
      if (err.errcode === -1) {
        this.setData({
          isCustom: true,
          wordBookListCustom: [],
          showGuideOfCustomWordBook: true,
          showGuideOfCustomWordBookVip: true // 登录失败时也显示功能说明
        })
      } else {
        // 其他错误显示提示
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
        this.setData({
          isCustom: true,
          wordBookListCustom: [],
          showGuideOfCustomWordBook: true,
          showGuideOfCustomWordBookVip: true // 其他错误时也显示功能说明
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
            // 获取当前token
            const token = this.data.token || wx.getStorageSync('token')
            if (!token) {
              Toast.fail('请先登录')
              return
            }

            app.globalData.settings.currentWordBookCode = wordBook.wordBookCode
            this.setData({
              [`wordBookListCustom[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true,
              currentWordBookCode: wordBook.wordBookCode
            })
            Toast.loading('设置中...')

            wx.request({
              url: config.api_base_url + '/settings',
              method: 'PUT',
              data: {
                "currentWordBookCode": wordBook.wordBookCode
              },
              header: {
                'content-type': 'application/json',
                'Authorization': token
              },
              success: res => {
                Toast.clear()
                console.log('设置当前学习响应:', res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {
                    // 设置标记，通知首页需要刷新数据
                    wx.setStorageSync('needRefreshHomeData', true)
                    Toast.success('切换成功')
                  } else {
                    Toast.fail(res.data.errmsg || '设置失败')
                  }
                } else {
                  Toast.fail('设置失败')
                }
              },
              fail: err => {
                Toast.clear()
                console.error('设置当前学习失败:', err)
                Toast.fail('设置失败，请重试')
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
            // 获取当前token
            const token = this.data.token || wx.getStorageSync('token')
            if (!token) {
              Toast.fail('请先登录')
              return
            }

            wordBook.userProgressNum = 0
            this.setData({
              [`wordBookListCustom[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true
            })
            Toast.loading('重置中...')
            wx.request({
              url: config.api_base_url + '/wordbook/reset',
              method: 'PUT',
              data: {
                wordBookCode: wordBook.wordBookCode
              },
              header: {
                'content-type': 'application/json',
                'Authorization': token
              },
              success: res => {
                Toast.clear()
                console.log('重置进度响应:', res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {
                    Toast.success('重置成功')
                  } else {
                    Toast.fail(res.data.errmsg || '重置失败')
                  }
                } else {
                  Toast.fail('重置失败')
                }
              },
              fail: err => {
                Toast.clear()
                console.error('重置进度失败:', err)
                Toast.fail('重置失败，请重试')
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
            // 获取当前token
            const token = this.data.token || wx.getStorageSync('token')
            if (!token) {
              Toast.fail('请先登录')
              return
            }

            this.data.wordBookListCustom.splice(wordBookListIndex, 1)
            this.setData({
              wordBookListCustom: this.data.wordBookListCustom,
              isBackReLoad: true
            })
            
            Toast.loading('删除中...')
            wx.request({
              url: config.api_base_url + '/wordbook',
              method: 'DELETE',
              data: {
                wordBookCode: wordBook.wordBookCode
              },
              header: {
                'content-type': 'application/json',
                'Authorization': token
              },
              success: res => {
                Toast.clear()
                console.log('删除词书响应:', res)

                const code = res.statusCode.toString()
                if (code.startsWith('2')) {
                  if (res.data.errcode == 0) {
                    Toast.success('删除成功')
                  } else {
                    Toast.fail(res.data.errmsg || '删除失败')
                  }
                } else {
                  Toast.fail('删除失败')
                }
              },
              fail: err => {
                Toast.clear()
                console.error('删除词书失败:', err)
                Toast.fail('删除失败，请重试')
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
  uploadWordBookCustom: async function () {
    try {
      // 获取当前token
      const token = this.data.token || wx.getStorageSync('token')
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        })
        return
      }

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
              'wordBookName': tempFilePaths[0].name,
              'token': token
            },
            header: {
              'content-type': 'multipart/form-data',
              'Authorization': token
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

              try {
                const responseData = JSON.parse(res.data)
                console.log('上传响应数据:', responseData)
                
                if (responseData.errcode === 0) {
                  // 检查返回的数据结构
                  if (responseData.data && typeof responseData.data === 'object') {
                    // 构造词书对象，API返回的字段名可能不同
                    let wordBook = {
                      wordBookCode: responseData.data.code || responseData.data.wordBookCode,
                      wordBookName: responseData.data.bookName || responseData.data.wordBookName,
                      totalWordNum: responseData.data.totalWordNum || 0,
                      realWordNum: responseData.data.realWordNum || 0,
                      userProgressNum: 0 // 新上传的词书进度为0
                    }
                    
                    // 验证必要字段
                    if (!wordBook.wordBookCode) {
                      console.error('词书代码缺失:', responseData.data)
                      Toast.fail('上传失败：词书数据异常')
                      return
                    }
                    
                    let wordBookListCustom = this.data.wordBookListCustom
                    wordBookListCustom.unshift(wordBook)
                    this.setData({
                      wordBookListCustom,
                      isBackReLoad: true,
                      currentWordBookCode: wordBook.wordBookCode
                    })

                    Toast.loading({
                      message: '设置为当前学习...',
                      duration: 0
                    })
                    
                    wx.request({
                      url: config.api_base_url + '/settings',
                      method: 'PUT',
                      data: {
                        "currentWordBookCode": wordBook.wordBookCode
                      },
                      header: {
                        'content-type': 'application/json',
                        'Authorization': token
                      },
                      success: res => {
                        Toast.clear()
                        const code = res.statusCode.toString()
                        if (code.startsWith('2') && res.data.errcode == 0) {
                          Toast.success({
                            message: `上传成功！\n词书：${wordBook.wordBookName}\n单词数：${wordBook.totalWordNum}`,
                            duration: 2000
                          })
                        } else {
                          Toast.fail('设置当前学习失败')
                        }
                      },
                      fail: err => {
                        Toast.clear()
                        console.error('设置当前学习失败:', err)
                        Toast.fail('设置失败，但词书已上传')
                      },
                    })
                  } else {
                    console.error('词书数据格式异常:', responseData)
                    Toast.fail('上传失败：数据格式异常')
                  }
                } else {
                  // 服务器返回业务错误
                  const errorMsg = responseData.errmsg || responseData.message || '上传失败'
                  console.error('上传业务错误:', responseData)
                  Toast.fail(errorMsg)
                }
              } catch (error) {
                console.error('解析上传响应失败:', error, '原始数据:', res.data)
                Toast.fail('上传失败：响应解析错误')
              }

            }

          },
          fail: (err) => {
            console.log(err)
            Toast.fail('上传失败')
          }
        })
      },
      fail: (err) => {
        console.log(err)
        Toast.fail('文件选择失败')
      }
    })
    } catch (err) {
      console.error('上传词书失败:', err)
      Toast.fail('上传失败')
    }
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