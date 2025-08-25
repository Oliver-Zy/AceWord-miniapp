import {
  Common
} from '../../models/common.js'
const common = new Common()
import {
  HTTP
} from '../../utils/http.js'
const http = new HTTP()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js'
import {
  config
} from '../../config.js'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    showOfficialAccount: true,
    openNotification: true,
    currentTime: "",
    cellInfo_1: config.cellInfo_1,
    cellInfo_2: config.cellInfo_2,
    cellInfo_3: config.cellInfo_3,
    showTabBarShadow: true,
    showDateTimePicker: false
  },
  jump2hdd() {
    wx.navigateToMiniProgram({
      appId: "wxf84133e012d24963",
      path: "/pages/index/welcomePage?cid=ERSD20671&storeCd=0746745689",
      envVersion: "trial"
    })
  },
  onChange({
    detail
  }) {
    wx.showModal({
      title: '提示',
      content: '是否' + (detail ? '开启' : '关闭') + '提醒',
      success: (res) => {
        if (res.confirm) {
          http.request({
            url: '/settings',
            method: 'PUT',
            data: {
              triggerCondition: (detail ? 'always' : 'never')
            }
          }).then(res => {
            console.log(res)
            app.globalData.settings.triggerCondition = (detail ? 'always' : 'never')
            this.setData({
              openNotification: detail
            })
            wx.showToast({
              icon: "none",
              title: (detail ? '开启' : '关闭') + '成功',
            })
          }).catch(err => console.error(err))
        }
      }
    });
  },
  onDateTimePickerInput(e) {
    this.setData({
      tempTime: e.detail
    })
    console.log(this.data.tempTime)
  },
  onConfirmChangeNotification() {
    console.log(this.data.tempTime)

    let triggerTime = {
      hour: this.data.tempTime.split(":")[0],
      minute: this.data.tempTime.split(":")[1],
    }
    console.log("triggerTime", triggerTime)
    wx.showLoading({
      title: '修改中',
    })
    http.request({
      url: '/settings',
      method: 'PUT',
      data: {
        triggerCondition: app.globalData.settings.triggerCondition,
        triggerTime
      }
    }).then(res => {
      wx.hideLoading()
      console.log(res)
      this.setData({
        showDateTimePicker: false,
        currentTime: this.data.tempTime
      })
      app.globalData.settings.triggerTime = triggerTime

      wx.showToast({
        icon: "none",
        title: '修改成功',
      })
      this.getTabBar().setData({
        show: true
      })
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        icon: "error",
        title: '修改失败',
      })
      this.getTabBar().setData({
        show: true
      })
      console.error(err)
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    this._setInitInfo()

    // setData: userProfile
    let settings = app.globalData.settings
    this.setData({
      nickName: settings.nickName,
      avatarUrl: settings.avatarUrl,
      vipExpireDate: settings.vipExpireDate
    })

    // setData: learningInfo
    let learningInfo = await common.request({
      url: `/statistic/learning`
    })
    this.setData({
      learningInfo
    })
  },

  /**
   * 监听点击遮罩与取消事件
   *
   * @event
   */
  onClickHideOverlay: function (e) {
    this.setData({
      showNotifPanel: true,
      showOverlay: false,
      showTabBarShadow: true
    })
    this.getTabBar().setData({
      show: true
    })
  },

  onCancelActionSheet: function () {
    this.setData({
      showPopup: false,
      showActionSheet: false,
      showTabBarShadow: true
    })
    this.getTabBar().setData({
      show: true
    })
  },
  modifyNickname: function () {
    wx.showModal({
      editable: true,
      placeholderText: "长度不能超过15",
      title: '修改昵称',
      content: '',
      complete: (res) => {
        if (res.confirm) {
          console.log(res.content)
          if (res.content.length > 15) {
            wx.showToast({
              icon: 'none',
              title: '长度须小于15',
            })
            return
          }
          let nickName = res.content
          Toast.loading()
          common.request({
            url: '/settings',
            method: 'PUT',
            data: {
              "nickName": nickName
            }
          }).then(res => {
            this.setData({
              nickName
            })
            Toast.success("修改成功")
          }).catch(err => {
            Toast.fail("修改失败")
          })
        }
      }
    })
  },
  modifyAvatar: function () {
    console.log('modifyAvatar 被调用')
    let that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: "compressed",
      camera: 'back',
      success(res) {
        console.log('选择图片成功:', res)
        Toast.loading({
          message: '上传中...',
          forbidClick: true
        })
        wx.uploadFile({
          url: config.api_base_url + '/avatar',
          filePath: res.tempFiles[0].tempFilePath,
          name: 'avatar',
          formData: {
            'avatar': res.tempFiles[0].tempFilePath
          },
          header: {
            'content-type': 'multipart/form-data',
            'Authorization': wx.getStorageSync('token')
          },
          success(e) {
            console.log('上传成功:', e)
            Toast.success('修改成功')
            let url = JSON.parse(e.data)['data']
            console.log('新头像URL:', url)
            that.setData({
              avatarUrl: url
            })
          },
          fail(error) {
            console.error('上传失败:', error)
            Toast.fail('修改失败: ' + (error.errMsg || '未知错误'))
          }
        })
      },
      fail(error) {
        console.error('选择图片失败:', error)
        Toast.fail('选择图片失败')
      }
    })
  },
  /**
   * avatar-bar相关事件
   *
   * @inner
   */
  getUserProfile: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log(res)
        let nickName = res.userInfo.nickName
        let avatarUrl = res.userInfo.avatarUrl
        Toast.loading()
        common.request({
          url: '/settings',
          method: 'PUT',
          data: {
            "nickName": nickName,
            "avatarUrl": avatarUrl
          }
        }).then(res => {
          this.setData({
            nickName,
            avatarUrl
          })
          Toast.success('登录成功')
        }).catch(err => console.error(err))

      },
      fail: err => console.error(err)
    })
  },

  onCopyID: async function () {
    let openID = await common.request({
      url: `/openid`
    })
    wx.setClipboardData({
      data: openID,
      success(res) {
        wx.showToast({
          icon: "none",
          title: '复制成功',
        })
      }
    })
  },

  /**
   * 监听点击单元格事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onCell: function (e) {

    let type = e.currentTarget.dataset.type
    if (type == 'wordgroup') {

      wx.navigateTo({
        url: '/pages/wordgroup-folder/wordgroup-folder'
      })

    } else if (type == 'wordbook') {

      this.setData({
        showPopupVant: true,
        showActionSheet: true,
        actionSheetType: 'changeDic',
        showTabBarShadow: false,
        actionSheetDesc: '更换词书',
        actions: [{
          name: '词书广场'
        }, {
          name: '自定义词书'
        }]
      })
      this.getTabBar().setData({
        show: false
      })

    } else if (type == 'radio') {

      this.setData({
        showPopupVant: true,
        showActionSheet: true,
        actionSheetType: 'radio',
        actionSheetDesc: '选择卡片列表',
        actions: [{
          name: '推荐复习计划'
        }, {
          name: '今日新学计划'
        }]
      })
      this.getTabBar().setData({
        show: false
      })

    } else if (type == 'delete') {

      wx.navigateTo({
        url: '/pages/delete/delete'
      })

    } else if (type == 'notif') {

      this.onNotif()

    } else if (type == 'settings') {

      wx.navigateTo({
        url: '/pages/settings/settings'
      })

    } else if (type == 'guide') {

      wx.navigateTo({
        url: '../web-view/web-view?type=userGuideBook&title=用户手册'
      })

    } else if (type == 'feedback') {

      this.setData({
        showPopupVant: true,
        showActionSheet: true,
        actionSheetType: 'feedback',
        actionSheetDesc: '反馈与建议',
        actions: [{
          name: '加入官方QQ反馈6群'
        }, {
          name: '通过微信联系我们'
        }, {
          name: '通过邮件联系我们'
        }]
      })
      this.getTabBar().setData({
        show: false
      })

    } else if (type == 'sentence') {

      wx.navigateTo({
        url: '/pages/sentence/sentence'
      })

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

    } else if (actionSheetType == 'radio') {

      this._onSelectActionSheetRadio(e)

    } else if (actionSheetType == 'feedback') {

      this._onSelectActionSheetFeedback(e)

    }
  },

  _onSelectActionSheetRadio: async function (e) {
    wx.navigateTo({
      url: `${e.detail.name == '今日新学计划' ? '/pages/today/today?entryPage=mine' : '/pages/review/review?entryPage=mine'}`
    })
  },

  _onSelectActionSheetChangeDic: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)

    if (e.detail.name == '词书广场') {
      wx.navigateTo({
        url: `/pages/wordbook-category/wordbook-category`
      })
    } else if (e.detail.name == '自定义词书') {
      wx.navigateTo({
        url: `/pages/wordbook-new/wordbook-new?isCustom=${true}`
      })
    }

  },

  _onSelectActionSheetFeedback: function (e) {
    setTimeout(() => {
      this.onCancelActionSheet()
    }, 400)
    wx.setClipboardData({
      data: `${e.detail.name == '加入官方QQ反馈6群'
        ? '545536581' : e.detail.name == '微信反馈群'
          ? 'Ace-Oliver' : 'aceword.xyz@gmail.com'}`
    })
  },
  onDateTimePickerCancel: function () {
    this.getTabBar().setData({
      show: true
    })
    this.setData({
      showDateTimePicker: false
    })
  },

  navigateToGZH() {
    wx.navigateTo({
      url: '../web-view/web-view?type=subscribeMP'
    })
  },
  testNotify() {
    wx.showLoading({
      title: '发送中',
    })
    common.request({
      url: `/testNotify`,
      method: 'POST'
    }).then(e => {
      wx.showToast({
        icon: 'none',
        title: '发送成功，请检查是否收到',
      })
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        icon: 'none',
        title: '发送失败',
      })
    })

  },

  error(e) {
    console.log(e)
    this.setData({
      showOfficialAccount: false,
      scrollViewHeight: this.data.scrollViewHeight + 100
    })
  },
  /**
   * 监听定时提醒事件
   *
   * @event
   */
  onNotif: async function () {
    this.setData({
      showDateTimePicker: true
    })
    this.getTabBar().setData({
      show: false
    })

    return
    let triggerCondition = app.globalData.settings.triggerCondition
    if (triggerCondition == 'never') {
      Toast.loading()
      try {
        let res = await common.request({
          url: `/settings`,
          method: 'PUT',
          data: {
            triggerCondition: 'always'
          }
        })
        app.globalData.settings.triggerCondition = 'always'
        Toast.clear()

        wx.showModal({
          title: '订阅成功',
          content: '请确保已关注公众号',
          showCancel: true,
          confirmText: '跳转',
          cancelText: "关闭弹窗",
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '../web-view/web-view?type=subscribeMP'
              })
            } else {
              console.log(res)
            }
          }
        })

      } catch (err) {

        if (err.errcode == 411) {
          wx.showModal({
            title: '提示',
            content: '请先关注公众号「AceWord消息服务」，返回后再次点此按钮订阅。',
            showCancel: false,
            confirmText: '跳转',
            success: () => {
              wx.navigateTo({
                url: '../web-view/web-view?type=subscribeMP'
              })
            }
          })
        }

      }

    } else {

      wx.showModal({
        title: '提示',
        content: '当前已开启提醒，是否关闭？',
        confirmText: '关闭提醒',
        success: (res) => {
          if (res.confirm) {
            http.request({
              url: '/settings',
              method: 'PUT',
              data: {
                triggerCondition: 'never'
              }
            }).then(res => {
              console.log(res)
              app.globalData.settings.triggerCondition = 'never'
              wx.showToast({
                icon: "none",
                title: '关闭成功',
              })
            }).catch(err => console.error(err))

          }
        }
      })
    }
  },

  /**
   * 监听定时提醒事件
   *
   * @event
   */
  onOpenVip: function () {
    // 判断是不是ios 
    if (app.globalData.isIOS) {
      wx.showToast({
        icon: "none",
        title: '由于相关规范，iOS功能暂不可用',
      })
      return
    }
    wx.navigateTo({
      url: `/pages/vip/vip?event=${'vip'}`
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
  zeroPadding(number) {
    return number < 10 ? `0${number}` : `${number}`;
  },

  onShow: function () {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
    
    let triggerCondition = app.globalData.settings.triggerCondition
    let triggerTime = app.globalData.settings.triggerTime

    console.log("triggerCondition", triggerCondition)
    console.log("triggerTime", triggerTime)
    console.log(this.zeroPadding(triggerTime.minute))

    this.setData({
      triggerCondition,
      triggerTime,
      openNotification: triggerCondition != 'never',
      currentTime: triggerTime.hour + ":" + this.zeroPadding(triggerTime.minute),
      tempTime: triggerTime.hour + ":" + this.zeroPadding(triggerTime.minute),
    })


    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
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
      windowWidth: wx.getSystemInfoSync().windowWidth,

      isIOS: app.globalData.isIOS,
      isDarkMode: getApp().globalData.isDarkMode,
    })
  },
})