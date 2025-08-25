/**
 * 网络请求接口
 * http.js
 */
const { config } = require('../config.js')
const { logger } = require('./logger.js')

class HTTP {
  constructor() {
    this.maxRetries = 3
    this.retryDelay = 1000
  }

  /**
   * 发起网络请求
   *
   * @param { url, method, data, retries } 
   * @return { Promise } 
   */
  async request({ url, method = 'GET', data = {}, retries = 0 }) {
    try {
      let token = await getToken()
      let result = await _request({ url, method, data, token })
      return result
    } catch (err) {
      logger.error('HTTP request failed:', { url, method, data, error: err })
      
      // 如果是网络错误且还有重试次数，则重试
      if (this.shouldRetry(err) && retries < this.maxRetries) {
        logger.warn(`Retrying request (${retries + 1}/${this.maxRetries}):`, url)
        await this.delay(this.retryDelay * (retries + 1))
        return this.request({ url, method, data, retries: retries + 1 })
      }
      
      throw err
    }
  }

  /**
   * 判断是否应该重试
   */
  shouldRetry(error) {
    // 网络错误或服务器错误时重试
    if (error.errMsg && error.errMsg.includes('fail')) {
      return true
    }
    if (error.errcode && [500, 502, 503, 504].includes(error.errcode)) {
      return true
    }
    return false
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 内部封装网络请求方法
 *
 * @param { url, data, method } 
 * @return { Promise } 
 */
function _request({ url, method = 'GET', data = {}, token }) {
  logger.debug('Making request:', { url, method, data })

  return new Promise((resolve, reject) => {
    wx.request({
      url: config.api_base_url + url,
      data: data,
      method: method,
      header: {
        'content-type': 'application/json',
        'Authorization': token
      },
      success: res => {
        logger.debug('Request success:', res)

        const code = res.statusCode.toString()
        if (code.startsWith('2')) {
          if (res.data.errcode == 0) {
            resolve(res.data.data)
          } else {
            logger.warn('API error:', res.data.errcode)
            
            if (res.data.errcode == -1) {
              wx.removeStorageSync("token")

              // token失效也能重新加载
              wx.showLoading({ title: '登录中' })
              generateToken().then(res => {
                logger.info('Token regenerated')
                reject({ isReLoad: true })
                wx.hideLoading()
              }).catch(err => {
                logger.error('Token regeneration failed:', err)
                wx.hideLoading()
                reject(err)
              })
            } else {
              reject(res.data)
            }
          }
        } else {
          logger.error('HTTP error:', code, res.data)
          reject(res.data)
        }
      },
      fail: err => {
        logger.error('Request failed:', err)
        reject(err)
      },
    })
  })
}

/**
 * 生成令牌事件 
 * 
 * @param {}  无需参数
 * @return { token }  并将令牌存到储存里
 */
function generateToken() {
  return new Promise((resolve) => {
    wx.login({
      success: res => {
        if (res.code) {
          try {
            _request({
              url: `/token?code=${res.code}`,
              // url: '/token?code=mock',
              method: 'GET',
            }).then(res => {
              // console.log(res)

              resolve(res.token)
              wx.setStorageSync('token', res.token)
            })
          } catch (err) {
            console.error(err)
          }
        } else {
          reject(res.errMsg)
        }
      }, fail: err => console.error(err)

    })
  })
}

/**
 * 获取令牌事件 
 * 
 * @param {}  无需参数
 * @return { token }  并将令牌存到储存里
 */
function getToken() {
  return new Promise(resolve => {
    try {
      let token = wx.getStorageSync('token')
      // console.log(token)

      if (token) {
        resolve(token)
      } else {
        wx.showLoading({ title: '初始化中' })
        generateToken().then(res => {
          // console.log(res)

          resolve(res)
          wx.hideLoading()
        }).catch(err => console.error(err))
      }
    } catch (err) {
      console.error(err)
    }
  })
}

module.exports = {
  HTTP
}