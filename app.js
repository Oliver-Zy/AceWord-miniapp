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

    // 设置音频播放选项
    this.setAudioOptions()

    this.autoUpdate()
    
    // 异步预加载核心字体，不阻塞启动
    this.preloadFonts()
  },

  /**
   * 设置音频播放选项
   */
  setAudioOptions() {
    // 检查基础库版本是否支持
    if (wx.canIUse('setInnerAudioOption')) {
      try {
        wx.setInnerAudioOption({
          mixWithOther: false, // 不与其他音频混播，确保单词发音清晰
          obeyMuteSwitch: false, // iOS下不遵循静音开关，确保学习时能听到发音
          speakerOn: true, // 使用扬声器播放，音量更大更清晰
          success: () => {
            console.log('🔊 音频播放选项设置成功')
          },
          fail: (err) => {
            console.warn('🔊 音频播放选项设置失败:', err)
          }
        })
      } catch (error) {
        console.warn('🔊 设置音频选项时发生错误:', error)
      }
    } else {
      console.warn('🔊 当前基础库版本不支持 setInnerAudioOption')
    }
  },

  /**
   * 预加载字体文件
   */
  async preloadFonts() {
    try {
      // 检查是否为开发环境，如果是则跳过字体加载避免错误提示
      const accountInfo = wx.getAccountInfoSync()
      const isDev = accountInfo.miniProgram.envVersion === 'develop'
      
      // 开发环境字体加载策略
      const DEV_FONT_STRATEGY = 'skip' // 可选: 'skip', 'silent', 'normal'
      // 'skip' - 完全跳过字体加载
      // 'silent' - 静默加载字体，不显示错误
      // 'normal' - 正常加载字体，显示所有信息
      
      if (isDev && DEV_FONT_STRATEGY === 'skip') {
        // console.log('🎨 开发环境跳过字体加载，避免网络错误提示')
        return
      }
      
      const silentMode = isDev && DEV_FONT_STRATEGY === 'silent'
      if (silentMode) {
        console.log('🎨 开发环境静默加载字体，错误将被忽略')
      }
      
      const { fontLoader } = require('./utils/fontLoader.js')
      // 根据策略决定是否静默加载
      const shouldSilent = silentMode || !isDev
      
      // 预加载核心字体
      await fontLoader.preloadCorefonts(shouldSilent)
      
      // 延迟加载特殊字体
      setTimeout(() => {
        fontLoader.loadSpecialFonts(shouldSilent)
      }, 2000)
      
      // 在用户可能需要时加载卡片字体
      setTimeout(() => {
        fontLoader.loadCardFonts(shouldSilent)
      }, 5000)
    } catch (error) {
      console.warn('字体加载失败:', error)
    }
  },

  /**
   * 设置状态栏颜色
   * @param {boolean} isDark 是否为深色模式
   */
  setStatusBarColor: function(isDark = false) {
    if (isDark) {
      // 深色模式：白色文本，深色背景
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1E1B4B'
      })
    } else {
      // 浅色模式：深色文本，浅色背景
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#EDE9FE'
      })
    }
  },

  globalData: {

  }
})