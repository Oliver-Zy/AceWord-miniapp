/**
 * 通用方法
 * Common.js
 */

const { HTTP } = require('../utils/http')
const { addExamExamplesToWordInfo } = require('../data/examExamplesData')
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
          
          // 如果是获取单词信息的请求，自动添加真题例句
          if (url.includes('/wordinfo/search') && res && res.word) {
            res = addExamExamplesToWordInfo(res)
          }
          // 如果是获取多个单词信息的请求，为每个单词添加真题例句
          else if (url.includes('/wordinfos/search') && Array.isArray(res)) {
            res = res.map(wordInfo => {
              if (wordInfo && wordInfo.word) {
                return addExamExamplesToWordInfo(wordInfo)
              }
              return wordInfo
            })
          }
    
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
    const token = wx.getStorageSync('token')
    return new Promise((resolve, reject) => {
      try {
        wx.uploadFile({
          url: config.api_base_url + url,
          filePath: filePath,
          name: name,
          header: {
            'Authorization': token
          },
          success(res) {
            console.log('Upload response:', res)
            try {
              const data = JSON.parse(res.data)
              if (data.errcode === 0) {
                resolve(data.data)
              } else {
                reject(data)
              }
            } catch (parseError) {
              reject({ message: '响应解析失败', data: res.data })
            }
          },
          fail(error) {
            console.error('Upload failed:', error)
            reject(error)
          }
        })
      } catch (err) {
        console.error('Upload error:', err)
        reject(err)
      }
    })
  }
}

module.exports = {
  Common
}