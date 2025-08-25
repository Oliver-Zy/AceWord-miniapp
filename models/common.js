/**
 * 通用方法
 * Common.js
 */

const { HTTP } = require('../utils/http')
const http = new HTTP()

class Common {

  /**
   * 封装Request
   *
   * @param { url, method, data } 
   * @return { Promise } 
   */
  async request({ url, method = 'GET', data = {} }) {
    return new Promise((resolve, reject) => {
      try {
        http.request({ url: url, method: method, data: data }).then(res => {
          // console.log(res)
    
          resolve(res)
          
        }).catch(res => {

          reject(res)

        })
      } catch (err) {
        console.error(err)
      }
    })
  }

  /**
   * 封装UploadFile
   *
   * @param { url, filePath, name } 
   * @return { Promise } 
   */
  async uploadFile({ url, filePath, name }) {
    return new Promise(resolve => {
      try {
        wx.uploadFile({
          url: url,
          filePath: filePath,
          name: name,
          success(res) {
            resolve(res)
          }
        })
      } catch (err) {
        console.error(err)
      }
    })
  }
}

module.exports = {
  Common
}