/**
 * 网络请求接口
 * http.js
 */
import { config } from '../config.js'

class HTTP {
  /**
   * 发起网络请求
   *
   * @param { url, method, data } 
   * @return { Promise } 
   */
  async request({ url, method = 'GET', data = {} }) {
    let token = await getToken()
    let result = await _request({ url, method, data, token })

    return new Promise(resolve => {
      try {
        resolve(result)
      } catch (err) {
        console.error(err)
      }
    })
  }
}

/**
 * 内部封装网络请求方法
 *
 * @param { url, data, method } 
 * @return { Promise } 
 */
function _request({ url, method = 'GET', data = {}, token }) {
  // console.log(url)
  // console.log(method)
  // console.log(data)
  // console.log(token)

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
        // console.log(res)

        const code = res.statusCode.toString()
        if (code.startsWith('2')) {
          if (res.data.errcode == 0) {
            resolve(res.data.data)
          } else {

            // console.log(res.data.errcode)
            if (res.data.errcode == -1) {
              wx.removeStorageSync("token")

              // token失效也能重新加载
              wx.showLoading({ title: '登录中' })
              generateToken().then(res => {
                // console.log(res) 
                
                reject({ isReLoad: true })
                wx.hideLoading()
              }).catch(err => console.error(err))
            } else {
              reject(res.data)
            }

          }

        } else {
          reject(res.data)
        }

      },
      fail: err => {
        console.error(err)
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

export { HTTP }