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
    try {
      this._setInitInfo()

      // setData: userProfile
      let settings = app.globalData.settings
    
    // 调试服务器返回的settings数据
    console.log("=== 服务器返回的完整settings数据 ===")
    console.log(JSON.stringify(settings, null, 2))
    console.log("settings.avatarUrl:", settings.avatarUrl)
    console.log("settings.nickName:", settings.nickName)
    console.log("=====================================")
    
    this.setData({
      nickName: settings.nickName,
      avatarUrl: settings.avatarUrl,
      vipExpireDate: settings.vipExpireDate
    })

      // setData: learningInfo
      Toast.loading({ message: '加载中...' })
      let learningInfo = await common.request({
        url: `/statistic/learning`
      })
      
      this.setData({
        learningInfo
      })
      Toast.clear()
    } catch (error) {
      console.error('Mine page load failed:', error)
      Toast.fail('页面加载失败')
      // 设置默认数据避免页面崩溃
      this.setData({
        learningInfo: { totalLearnedNum: 0, totalReviewedNum: 0 }
      })
    }
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
            // 更新全局数据
            app.globalData.settings.nickName = nickName
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
        // 尝试使用微信云存储上传头像
        wx.cloud.uploadFile({
          cloudPath: `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
          filePath: res.tempFiles[0].tempFilePath,
          success: cloudRes => {
            console.log('云存储上传成功:', cloudRes)
            let avatarUrl = cloudRes.fileID
            
            // 通过settings API更新头像URL
            common.request({
              url: '/settings',
              method: 'PUT',
              data: {
                avatarUrl: avatarUrl
              }
            }).then(settingsRes => {
              console.log('头像URL更新成功:', settingsRes)
              Toast.success('修改成功')
              // 更新页面数据
              that.setData({
                avatarUrl: avatarUrl
              })
              // 更新全局数据
              app.globalData.settings.avatarUrl = avatarUrl
            }).catch(err => {
              console.error('头像URL更新失败:', err)
              Toast.fail('保存失败')
            })
          },
          fail: error => {
            console.error('云存储上传失败:', error)
            Toast.fail('上传失败: ' + (error.errMsg || '未知错误'))
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
          // 更新全局数据
          app.globalData.settings.nickName = nickName
          app.globalData.settings.avatarUrl = avatarUrl
          Toast.success('登录成功')
        }).catch(err => console.error(err))

      },
      fail: err => console.error(err)
    })
  },

  onCopyID: async function () {
    try {
      Toast.loading({ message: '获取中...' })
      let openID = await common.request({
        url: `/openid`
      })
      Toast.clear()
      
      wx.setClipboardData({
        data: openID,
        success(res) {
          Toast.success('复制成功')
        },
        fail(err) {
          console.error('Copy failed:', err)
          Toast.fail('复制失败')
        }
      })
    } catch (error) {
      Toast.fail('获取失败，请重试')
      console.error('Copy ID failed:', error)
    }
  },

  // 头像加载成功事件
  onAvatarLoad: function(e) {
    console.log("头像加载成功:", e.detail)
    console.log("当前头像URL:", this.data.avatarUrl)
  },

  // 头像加载失败事件
  onAvatarError: function(e) {
    console.error("头像加载失败:", e.detail)
    console.log("失败的头像URL:", this.data.avatarUrl)
    wx.showToast({
      icon: 'none',
      title: '头像加载失败',
      duration: 2000
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

    } else if (actionSheetType == 'categorySelection') {

      this._onSelectActionSheetCategorySelection(e)

    }
  },

  _onSelectActionSheetRadio: async function (e) {
    wx.navigateTo({
      url: `${e.detail.name == '今日新学计划' ? '/pages/today/today?entryPage=mine' : '/pages/review/review?entryPage=mine'}`
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
      // 跳转到对应分类的词书详情页
      wx.navigateTo({
        url: `/pages/wordbook-new/wordbook-detail?categoryCode=${selectedAction.categoryCode}&categoryName=${encodeURIComponent(selectedAction.name)}`
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
    
    // 检查全局数据是否存在，避免运行时错误
    if (!app.globalData.settings) {
      console.warn('Settings not initialized, redirecting to index')
      wx.reLaunch({ url: '/pages/index/index' })
      return
    }
    
    let triggerCondition = app.globalData.settings.triggerCondition
    let triggerTime = app.globalData.settings.triggerTime
    
    // 进一步检查关键数据是否存在
    if (!triggerCondition || !triggerTime) {
      console.warn('Settings data incomplete, using defaults')
      triggerCondition = 'never'
      triggerTime = { hour: '20', minute: '00' }
    }

    console.log("triggerCondition", triggerCondition)
    console.log("triggerTime", triggerTime)
    console.log(this.zeroPadding(triggerTime.minute))

    // 调试头像信息
    console.log("=== 头像调试信息 ===")
    console.log("全局头像URL:", app.globalData.settings.avatarUrl)
    console.log("页面头像URL:", this.data.avatarUrl)
    console.log("昵称:", app.globalData.settings.nickName)
    console.log("==================")

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
        selected: 3
      })
    }
  },

  /**
   * 通用错误处理方法
   *
   * @inner
   */
  _handlePageError: function(error, context = '') {
    console.error('Mine page error:', { error, context, page: this.route })
    
    // 显示用户友好的错误信息
    wx.showModal({
      title: '页面异常',
      content: '页面遇到问题，是否重新加载？',
      success: (res) => {
        if (res.confirm) {
          wx.reLaunch({ url: '/pages/mine/mine' })
        }
      }
    })
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitInfo: function () {
    try {
      this.setData({
        naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
        scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 48 - (app.globalData.isIOS ? 30 : 0),
        windowWidth: wx.getSystemInfoSync().windowWidth,

        isIOS: app.globalData.isIOS,
        isDarkMode: getApp().globalData.isDarkMode,
      })
    } catch (error) {
      this._handlePageError(error, '_setInitInfo')
    }
  },
})