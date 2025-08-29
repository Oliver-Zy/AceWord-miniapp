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
    chosenIndex: 0,
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
   * 监听支付事件
   *
   * @event
   */
  onPay: function (e) {

    // // iOS不支持虚拟支付
    // if (this.data.isIOS) {
    //   // if (false) {
 
    //   wx.showModal({
    //     title: '提示',
    //     content: '因微信限制，iOS版本AceWord暂时无法快速解锁',
    //     showCancel: false,
    //     confirmText: '好的',
    //   })
    // } else {
      let chosenIndex = this.data.chosenIndex
      let priceList = [128, 88, 35] // 永久会员128元，年度会员88元，月度会员35元
      let price = priceList[chosenIndex]

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