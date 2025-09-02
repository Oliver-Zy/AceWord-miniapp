/**
 * 通用方法
 * Common.js
 */

const { HTTP } = require('../utils/http')
const { addExamExamplesToWordInfo } = require('../data/examExamplesData')
const { config } = require('../config')
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
   * @param { url, filePath, name, method } 
   * @return { Promise } 
   */
  async uploadFile({ url, filePath, name, method = 'POST' }) {
    const token = wx.getStorageSync('token')
    return new Promise((resolve, reject) => {
      try {
        // 如果是PUT方法，需要使用特殊处理
        if (method === 'PUT') {
          // 读取文件并构造multipart/form-data
          wx.getFileSystemManager().readFile({
            filePath: filePath,
            success: (fileRes) => {
              // 构造multipart/form-data格式
              const boundary = '----formdata-' + Date.now()
              const fileName = 'avatar.jpg'
              
              // 构造form-data数据
              let formDataHeader = `--${boundary}\r\n`
              formDataHeader += `Content-Disposition: form-data; name="${name}"; filename="${fileName}"\r\n`
              formDataHeader += `Content-Type: image/jpeg\r\n\r\n`
              
              const formDataEnd = `\r\n--${boundary}--\r\n`
              
              // 将字符串转换为ArrayBuffer（微信小程序兼容方式）
              function stringToArrayBuffer(str) {
                const buf = new ArrayBuffer(str.length)
                const view = new Uint8Array(buf)
                for (let i = 0; i < str.length; i++) {
                  view[i] = str.charCodeAt(i)
                }
                return buf
              }
              
              const formDataHeaderBuffer = stringToArrayBuffer(formDataHeader)
              const formDataEndBuffer = stringToArrayBuffer(formDataEnd)
              
              // 合并所有数据
              const totalLength = formDataHeaderBuffer.byteLength + fileRes.data.byteLength + formDataEndBuffer.byteLength
              const combinedBuffer = new ArrayBuffer(totalLength)
              const combinedView = new Uint8Array(combinedBuffer)
              
              combinedView.set(new Uint8Array(formDataHeaderBuffer), 0)
              combinedView.set(new Uint8Array(fileRes.data), formDataHeaderBuffer.byteLength)
              combinedView.set(new Uint8Array(formDataEndBuffer), formDataHeaderBuffer.byteLength + fileRes.data.byteLength)
              
              wx.request({
                url: config.api_base_url + url,
                method: 'PUT',
                data: combinedBuffer,
                header: {
                  'Authorization': token,
                  'Content-Type': `multipart/form-data; boundary=${boundary}`
                },
                success(res) {
                  console.log('Upload response:', res)
                  try {
                    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
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
            },
            fail: (error) => {
              console.error('读取文件失败:', error)
              reject(error)
            }
          })
        } else {
          // 使用默认的POST方法
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
        }
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