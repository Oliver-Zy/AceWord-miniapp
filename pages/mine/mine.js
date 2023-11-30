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
    cellInfo_1: config.cellInfo_1,
    cellInfo_2: config.cellInfo_2,
    cellInfo_3: config.cellInfo_3,
    showTabBarShadow: true,
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
      showNotifPanel: false,
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

  /**
   * avatar-bar相关事件
   *
   * @inner
   */
  getUserProfile: function () {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        // console.log(res)

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
      data: openID
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

  /**
   * 监听定时提醒事件
   *
   * @event
   */
  onNotif: async function () {

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

  onShow: function () {
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