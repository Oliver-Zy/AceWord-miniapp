import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast.js'
import { Common } from '../../models/common.js'
const common = new Common()
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    columns: ['5', '10', '15', '20', '25', '30', '40', '50', '60', '70', '80', '90', '100', '150', '200', '300', '400', '500'],
    fontBlockList: ['inter-medium', 'poppins-medium', 'zillaslab-medium', 'livvic-medium', 'gelasio-medium', 'ibmplexmono-medium', 'mali-medium', 'mplus1p-medium'],
    chosenIndex: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      blockWidth: parseInt((wx.getSystemInfoSync().windowWidth - 20 * 2 - 22 * 2 - 7 * 4) / 2),
      isDarkMode: app.globalData.isDarkMode,
    })

    this.setData({ settings: app.globalData.settings })
    // console.log(this.data.settings)
  },

  /**
    * 监听点击更多卡片事件
    *
    * @event
  */
  onCell: async function (e) {

    let type = e.currentTarget.dataset.type
    if (type == 'outfit') {
      wx.showModal({
        content: '请在微信设置【通用】->【深色模式】中修改，小程序与此保持同步',
        showCancel: false,
        confirmText: '好的',
      })
    } else if (type == 'dailyTargetNum') {

      this.setData({ showPopup: true, showPicker: true, showOverlay: true })

    } else if (type == 'isWordCardListTodayAutolyCreated') {

      this.setData({ ['settings.isWordCardListTodayAutolyCreated']: !this.data.settings.isWordCardListTodayAutolyCreated })
      app.globalData.settings.isWordCardListTodayAutolyCreated = this.data.settings.isWordCardListTodayAutolyCreated
      Toast.loading()
      await common.request({ url: `/settings`, method: 'PUT', data: { isWordCardListTodayAutolyCreated: this.data.settings.isWordCardListTodayAutolyCreated } })
      Toast(`${this.data.settings.isWordCardListTodayAutolyCreated ? '　　  开启成功　　\n当前最多可生成20张' : '取消成功'}`)

    } else if (type == 'showCountDown') {

      this.setData({ ['settings.showCountDown']: !this.data.settings.showCountDown })
      app.globalData.settings.showCountDown = this.data.settings.showCountDown
      Toast.loading()
      await common.request({ url: `/settings`, method: 'PUT', data: { showCountDown: this.data.settings.showCountDown } })
      Toast.success('设置成功')

    } else if (type == 'pronType') {

      this.setData({ showPopup: true, showActionSheet: true, actionSheetDesc: '发音类型', actions: [{ name: '美式发音' }, { name: '英式发音' }] })

    } else if (type == 'practice') {

      wx.navigateTo({ url: `../settings-more/settings-more?type=${type}` })

    } else if (type == 'reviewRhythm') {

      if (app.globalData.settings.isVipExpired) {

        wx.showModal({
          title: '该功能为会员功能',
          content: '会员用户可调整不同推荐复习节奏（卡片右上角倒计时）',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            // 注释掉VIP页面跳转，改为显示客服联系弹窗
            /*
            wx.navigateTo({ url: `/pages/vip/vip?event=${'vip_reviewrhythm'}` })
            */
            wx.showModal({
              title: '联系客服',
              content: '如需升级会员，请联系客服\n客服微信：MiddleRain_',
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
                    },
                    fail: () => {
                      wx.showToast({
                        title: '复制失败，请手动复制：MiddleRain_',
                        icon: 'none',
                        duration: 3000
                      })
                    }
                  })
                }
              }
            })
          }
        })

      } else {

        this.setData({ showPopup: true, showActionSheet: true, actionSheetDesc: '推荐复习节奏', actions: [{ name: '常规', subname: '5min、30min、12h、1d、2d、4d、7d、14d' }, { name: '紧凑', subname: '1min、5min、30min、3h、12h、1d、2d、4d' }, { name: '松弛', subname: '30min、1d、2d、4d、7d、14d、21d、28d' }] })

      }

    } else if (type == 'wordCardFontFamily') {

      this.setData({ showFontCard: true, showOverlay: true })

    }
  },

  /**
    * 监听选中actionSheet
    *
    * @event
  */
  onSelectActionSheet: async function (e) {
    this.onCancelActionSheet()

    switch (e.detail.name) {
      case '跟随系统':
        this.setData({ ['settings.outfit']: 'followSystem' })
        app.globalData.settings.outfit = 'followSystem'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { outfit: 'followSystem' } })
        Toast.success('设置成功')
        break
      case '浅色模式':
        this.setData({ ['settings.outfit']: 'light' })
        app.globalData.settings.outfit = 'light'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { outfit: 'light' } })
        Toast.success('设置成功')
        break
      case '深色模式':
        this.setData({ ['settings.outfit']: 'dark' })
        app.globalData.settings.outfit = 'dark'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { outfit: 'dark' } })
        Toast.success('设置成功')
        break
      case '美式发音':
        this.setData({ ['settings.pronType']: 'US' })
        app.globalData.settings.pronType = 'US'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { pronType: 'US' } })
        Toast.success('设置成功')
        break
      case '英式发音':
        this.setData({ ['settings.pronType']: 'UK' })
        app.globalData.settings.pronType = 'UK'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { pronType: 'UK' } })
        Toast.success('设置成功')
        break

      case '常规':
        this.setData({ ['settings.reviewRhythm']: 'normal' })
        app.globalData.settings.reviewRhythm = 'normal'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { reviewRhythm: 'normal' } })
        Toast('设置成功，下次练习开始生效')
        break
      case '紧凑':
        this.setData({ ['settings.reviewRhythm']: 'tense' })
        app.globalData.settings.reviewRhythm = 'tense'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { reviewRhythm: 'tense' } })
        Toast('设置成功，下次练习开始生效')
        break
      case '松弛':
        this.setData({ ['settings.reviewRhythm']: 'relax' })
        app.globalData.settings.reviewRhythm = 'relax'
        Toast.loading()
        await common.request({ url: `/settings`, method: 'PUT', data: { reviewRhythm: 'relax' } })
        Toast('设置成功，下次练习开始生效')
        break
    }
  },

  /**
   * 监听取消actionSheet
   *
   * @event
  */
  onCancelActionSheet: function () {
    this.setData({ showPopup: false, showActionSheet: false })
  },

  /**
   * 监听取消actionSheet
   *
   * @event
  */
  onConfirmPicker: async function (e) {
    this.setData({ showPopup: false, showActionSheet: false, showOverlay: false })
    this.setData({ ['settings.dailyTargetNum']: e.detail.value })
    app.globalData.settings.dailyTargetNum = e.detail.value
    Toast.loading()
    await common.request({ url: `/settings`, method: 'PUT', data: { dailyTargetNum: e.detail.value } })
    Toast.success('设置成功')
  },

  /**
   * 监听取消actionSheet
   *
   * @event
  */
  onCancelPicker: function () {
    this.setData({ showPopup: false, showActionSheet: false, showOverlay: false })
  },

  /**
   * 监听搜索事件
   *
   * @event
   * @param { Object } e 事件参数
  */
  onClickHideOverlay: function (e) {
    this.setData({ showOverlay: false, showPopup: false, showPicker: false, showFontCard: false })
  },


  /**
   * 监听点击字体块事件
   *
   * @event
   * @param { Object } e 事件参数
  */
  onBlockItem: async function (e) {

    let index = e.currentTarget.dataset.index
    if (this.data.settings.isVipExpired && index != 0) {

      wx.showModal({
        title: '该功能为会员功能',
        content: '开通会员解锁八种卡片字体',
        showCancel: false,
        confirmText: '立即开通',
        success: () => {
          // 注释掉VIP页面跳转，改为显示客服联系弹窗
          /*
          wx.navigateTo({ url: `/pages/vip/vip?event=${'vip_wordcardfontfamily'}` })
          */
          wx.showModal({
            title: '联系客服',
            content: '如需升级会员，请联系客服\n客服微信：MiddleRain_',
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
                  },
                  fail: () => {
                    wx.showToast({
                      title: '复制失败，请手动复制：MiddleRain_',
                      icon: 'none',
                      duration: 3000
                    })
                  }
                })
              }
            }
          })
        }
      })

    } else {

      this.setData({ chosenIndex:index })
      this.setData({ ['settings.wordCardFontFamily']: this.data.fontBlockList[index] })
      app.globalData.settings.wordCardFontFamily = this.data.fontBlockList[index]
      await common.request({ url: `/settings`, method: 'PUT', data: { wordCardFontFamily: this.data.fontBlockList[index] } })
      Toast('设置成功，刷新页面即可生效')

    }
  },

})