/**
 * 字体加载管理器
 * fontLoader.js
 */

class FontLoader {
  constructor() {
    this.loadedFonts = new Set()
    this.loadingPromises = new Map()
  }

  /**
   * 加载单个字体
   * @param {string} fontFamily 字体名称
   * @param {string} source 字体源地址
   * @param {Array} scopes 作用域
   * @param {boolean} silent 是否静默加载（不显示错误）
   * @returns {Promise}
   */
  loadFont(fontFamily, source, scopes = ["webview", "native"], silent = false) {
    // 如果已经加载过，直接返回成功
    if (this.loadedFonts.has(fontFamily)) {
      return Promise.resolve()
    }

    // 如果正在加载中，返回现有的Promise
    if (this.loadingPromises.has(fontFamily)) {
      return this.loadingPromises.get(fontFamily)
    }

    // 创建加载Promise
    const loadPromise = new Promise((resolve) => {
      // 设置超时，避免长时间等待
      const timeout = setTimeout(() => {
        this.loadingPromises.delete(fontFamily)
        if (!silent) {
          console.warn(`字体加载超时: ${fontFamily}`)
        }
        resolve()
      }, 5000)

      wx.loadFontFace({
        global: true,
        family: fontFamily,
        source: source,
        scopes: scopes,
        success: () => {
          clearTimeout(timeout)
          this.loadedFonts.add(fontFamily)
          this.loadingPromises.delete(fontFamily)
          if (!silent) {
            console.log(`✅ 字体加载成功: ${fontFamily}`)
          }
          resolve()
        },
        fail: (error) => {
          clearTimeout(timeout)
          this.loadingPromises.delete(fontFamily)
          
          // 根据错误类型决定是否显示警告
          const isNetworkError = error && (
            error.errMsg?.includes('net::') || 
            error.errMsg?.includes('ERR_CACHE_MISS') ||
            error.errMsg?.includes('ERR_NETWORK')
          )
          
          if (!silent && !isNetworkError) {
            console.warn(`字体加载失败: ${fontFamily}`, error)
          } else if (!silent && isNetworkError) {
            console.log(`🌐 网络字体暂时无法加载: ${fontFamily}，将使用系统默认字体`)
          }
          
          // 字体加载失败不应该阻塞应用，所以resolve而不是reject
          resolve()
        }
      })
    })

    this.loadingPromises.set(fontFamily, loadPromise)
    return loadPromise
  }

  /**
   * 批量加载字体
   * @param {Array} fonts 字体配置数组
   * @param {boolean} silent 是否静默加载
   * @returns {Promise}
   */
  loadFonts(fonts, silent = false) {
    const promises = fonts.map(font => 
      this.loadFont(font.family, font.source, font.scopes, silent)
    )
    return Promise.all(promises)
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopmentEnvironment() {
    try {
      const accountInfo = wx.getAccountInfoSync()
      return accountInfo.miniProgram.envVersion === 'develop'
    } catch (error) {
      return false
    }
  }

  /**
   * 预加载核心字体
   * @param {boolean} silent 是否静默加载
   */
  async preloadCorefonts(silent = true) {
    // 开发环境下更加宽松的处理
    const isDev = this.isDevelopmentEnvironment()
    if (isDev) {
      silent = true // 开发环境强制静默模式
    }
    const coreFonts = [
      {
        family: 'inter-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/inter-medium.ttf")'
      },
      {
        family: 'poppins',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins.ttf")'
      },
      {
        family: 'poppins-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-medium.ttf")'
      }
    ]

    return this.loadFonts(coreFonts, silent)
  }

  /**
   * 按需加载卡片字体
   * @param {boolean} silent 是否静默加载
   */
  async loadCardFonts(silent = true) {
    // 开发环境下更加宽松的处理
    const isDev = this.isDevelopmentEnvironment()
    if (isDev) {
      silent = true // 开发环境强制静默模式
    }
    const cardFonts = [
      {
        family: 'barlow-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/barlow-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'cormorantgaramond-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/cormorantgaramond-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'dmsans-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/dmsans-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'koho-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/koho-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'livvic-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/livvic-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'prompt-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/prompt-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'zillaslab-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/zillaslab-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'gelasio-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/gelasio-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'ibmplexmono-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/ibmplexmono-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'mali-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/mali-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'roboto-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/roboto-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'mplus1p-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/mplus1p-medium.ttf")',
        scopes: ["webview", "native"]
      },
      {
        family: 'spectral-medium',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/spectral-medium.ttf")',
        scopes: ["webview", "native"]
      }
    ]

    return this.loadFonts(cardFonts, silent)
  }

  /**
   * 加载特殊字体
   * @param {boolean} silent 是否静默加载
   */
  async loadSpecialFonts(silent = true) {
    // 开发环境下更加宽松的处理
    const isDev = this.isDevelopmentEnvironment()
    if (isDev) {
      silent = true // 开发环境强制静默模式
    }
    const specialFonts = [
      {
        family: 'sfpro-bold',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/sfpro-bold.ttf")'
      },
      {
        family: 'sfpro-heavy-italic',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/sfpro-heavy-italic.ttf")'
      },
      {
        family: 'poppins-bold',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-bold.ttf")'
      },
      {
        family: 'poppins-italic',
        source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-italic.ttf")',
        scopes: ["webview", "native"]
      }
    ]

    return this.loadFonts(specialFonts, silent)
  }
}

// 创建全局实例
const fontLoader = new FontLoader()

module.exports = {
  fontLoader,
  FontLoader
}
