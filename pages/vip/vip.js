import {
  Common
} from '../../models/common.js'
import {
  HTTP
} from '../../utils/http.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
const common = new Common()
const http = new HTTP()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    chosenIndex: 0, // 默认选择永久会员（索引0）
    selectedPayment: 'wechat', // 默认选择微信支付
    vipPlans: [
      {
        id: 'lifetime',
        title: '永久会员',
        price: 98,
        originalPrice: 198,
        badgeText: '最多人选',
        period: 'lifetime',
        duration: -1,
        isRecommended: true
      },
      {
        id: 'yearly', 
        title: '年度会员',
        price: 68,
        originalPrice: 128,
        badgeText: '每天2毛',
        period: 'year',
        duration: 1
      },
      {
        id: 'monthly',
        title: '月度会员',
        price: 25,
        originalPrice: null,
        badgeText: '无优惠',
        period: 'month',
        duration: 1
      }
    ]
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
    console.log("event", options.event)
    // 数据埋点：进入会员页
    await common.request({
      url: `/tracking`,
      method: `POST`,
      data: {
        event: options.event,
        routeList: getCurrentPages().map(item => item.route),
        systemInfo: JSON.stringify({
          mode: wx.getSystemInfoSync().model,
          platform: wx.getSystemInfoSync().platform,
        })
      }
    })
  },

  /**
   * 监听点击遮罩与取消事件
   *
   * @event
   */
  onPriceBlock: function (e) {
    let index = e.currentTarget.dataset.index
    this.setData({
      chosenIndex: index
    })
  },

  /**
   * 选择支付方式
   */
  selectPayment: function(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      selectedPayment: type
    })
  },

  /**
   * 监听支付事件
   *
   * @event
   */
    onPay: function (e) {
    // iOS支付限制检查 - 暂时注释掉
    /*
    if (this.data.isIOS) {
      wx.showModal({
        title: '温馨提示',
        content: '由于苹果应用商店政策限制，iOS用户暂时无法在小程序内购买会员。您可以通过以下方式开通：\n\n1. 使用安卓设备打开小程序购买\n2. 联系客服获取其他开通方式',
        showCancel: true,
        confirmText: '联系客服',
        cancelText: '我知道了',
        success: (res) => {
          if (res.confirm) {
            // 复制客服微信号
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
      return
    }
    */

    // 获取选中的会员档位价格
    const selectedPlan = this.data.vipPlans[this.data.chosenIndex]
    let price = selectedPlan.price

      let that = this
      Toast.loading()
      http.request({
        url: `/pay/miniapp?price=${price}`
      }).then(res => {
        console.log(res)
        wx.requestPayment({
          ...res,
          nonceStr: res.noncestr,
          paySign: res.sign,
          signType: "RSA",
          package: "prepay_id=" + res.prepayid,
          timeStamp: res.timestamp,
          success: async function () {
            Toast.success('支付成功')
            
            // 修复轮询逻辑，避免无限循环
            let retryCount = 0
            const maxRetries = 10 // 最多重试10次
            let payStatus = 0
            
            while (payStatus == 0 && retryCount < maxRetries) {
              try {
                payStatus = await that.checkPayStatus()
                if (payStatus !== 0) break
                
                // 正确的延迟实现
                await new Promise(resolve => setTimeout(resolve, 1000))
                retryCount++
              } catch (error) {
                console.error('Check pay status failed:', error)
                break
              }
            }
            
            if (retryCount >= maxRetries) {
              Toast.fail('支付状态检查超时，请稍后在"我的"页面查看会员状态')
              return
            }

            http.request({
              url: '/settings'
            }).then(res => {
              app.globalData.settings = res
              that.setData({
                settings: app.globalData.settings
              })
              that.setData({
                vipExpireDate: that.data.settings.vipExpireDate
              })
              Toast.success('会员开通成功')
            }).catch(err => {
              console.error('Update settings failed:', err)
              Toast.fail('状态更新失败，请重启应用')
            })

          },
          fail: (err) => {
            console.log(err)
            Toast('支付失败')
          }
        })
      })
      return


      wx.cloud.callFunction({
        name: 'pay',
        data: {
          totalFee: chosenIndex == 0 ? 2800 : chosenIndex == 1 ? 8800 : 1800
        },
        success: (res) => {
          const payment = res.result.payment
          wx.requestPayment({
            ...payment,
            success: async function () {
              Toast.success('支付成功')
              let payStatus = 0
              while (payStatus == 0) {
                payStatus = await that.checkPayStatus()
                setTimeout(() => {}, 1000)
              }

              http.request({
                url: '/settings'
              }).then(res => {
                app.globalData.settings = res
                that.setData({
                  settings: app.globalData.settings
                })
                that.setData({
                  vipExpireDate: that.data.settings.vipExpireDate
                })
              }).catch(err => console.error(err))

            },
            fail: () => {
              Toast('支付失败')
            }
          })
        },
        fail: console.error,
      })

    // }
  },

  checkPayStatus: async function () {

    return new Promise((resolve, reject) => {
      http.request({
        url: '/paystatus'
      }).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })

  },

  /**
   * 跳转至会员协议
   *
   * @event
   */
  onVipProtocol: function () {
    wx.navigateTo({
      url: '../web-view/web-view?type=vipProtocol&title=AceWord会员协议'
    })
  },

  /**
   * 监听退出页面事件
   *
   * @inner
   */
  onUnload: function () {
    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]
    if (prevPage.route == 'pages/mine/mine') {
      prevPage.onLoad()
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
      bgContainerWidth: wx.getSystemInfoSync().windowWidth - 32,
      bgContainerHeight: (wx.getSystemInfoSync().windowWidth - 32) * 162 / 343,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 16 - 120,

      isIOS: app.globalData.isIOS,
    })
  },
})