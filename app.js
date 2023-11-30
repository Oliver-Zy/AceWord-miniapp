App({

  autoUpdate: function () {
    var self = this
    // 获取小程序更新机制兼容
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        // 请求完新版本信息的回调
        // console.log(res.hasUpdate)
      })
      updateManager.onUpdateReady(function () {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function (res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate()
            }
          }
        })
      })
    }
  },

  /**
   * 下载小程序新版本并重启应用
   */
  downLoadAndUpdate: function (updateManager) {
    var self = this
    wx.showLoading();
    //静默下载更新小程序新版本
    updateManager.onUpdateReady(function () {
      wx.hideLoading()
      //新的版本已经下载好，调用 applyUpdate 应用新版本并重启
      updateManager.applyUpdate()
    })
    updateManager.onUpdateFailed(function () {
      // 新的版本下载失败
      wx.showModal({
        title: '已经有新版本了哟~',
        content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~',
      })
    })
  },
  onLaunch() {
    // 云开发初始化
    wx.cloud.init({
      env: 'release-o6wz5',
      traceUser: true,
    })

    // 获取今日日期
    let date = new Date()
    this.globalData.todayDate = date.getFullYear().toString() + (date.getMonth() < 9 ? '0' + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString()) + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate().toString())

    // 获取系统信息
    this.globalData.isDarkMode = wx.getSystemInfoSync().theme == 'dark' ? true : false
    this.globalData.isIOS = wx.getSystemInfoSync().system.slice(0, 3) == 'iOS' ? true : false

    this.autoUpdate()
    // 加载字体文件
    wx.loadFontFace({
      global: true,
      family: 'inter-medium',
      source: 'url("https://cdn.uuorb.com/a4/font/v2/inter-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'sfpro-bold',
      source: 'url("https://cdn.uuorb.com/a4/font/v2/sfpro-bold.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'sfpro-heavy-italic',
      source: 'url("https://cdn.uuorb.com/a4/font/v2/sfpro-heavy-italic.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'poppins',
      source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'poppins-medium',
      source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-medium.ttf")',
      // success: console.log,
    })

    wx.loadFontFace({
      global: true,
      family: 'poppins-bold',
      source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-bold.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'poppins-italic',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-italic.ttf")',
      // success: console.log
    })

    // -- 卡片字体 --
    wx.loadFontFace({
      global: true,
      family: 'barlow-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/barlow-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'cormorantgaramond-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/cormorantgaramond-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'dmsans-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/dmsans-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'koho-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/koho-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'livvic-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/livvic-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'prompt-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/prompt-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'zillaslab-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/zillaslab-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'gelasio-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/gelasio-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'ibmplexmono-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/ibmplexmono-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'mali-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/mali-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'roboto-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/roboto-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'mplus1p-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/mplus1p-medium.ttf")',
      // success: console.log
    })

    wx.loadFontFace({
      global: true,
      family: 'spectral-medium',
      scopes: ["webview", "native"],
      source: 'url("https://cdn.uuorb.com/a4/font/v2/spectral-medium.ttf")',
      // success: console.log
    })
  },

  globalData: {

  }
})