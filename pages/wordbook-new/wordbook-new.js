import {
  Common
} from '../../models/common.js'
import {
  HTTP
} from '../../utils/http.js'
const common = new Common()
const http = new HTTP()

import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
import {
  config
} from '../../config.js'
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {

    this.setData({
      currentWordBookCode: app.globalData.settings.currentWordBookCode,
      wordBookCategoryCode: options.wordBookCategoryCode
    })
    this.setData({
      isCustom: options.isCustom == 'true' ? true : false
    })
    if (options.isCustom == 'false') {

      // setdata: wordBookList
      let wordBookCategoryCode = this.data.wordBookCategoryCode
      let wordBookListInfo = await common.request({
        url: `/wordbooks-official?wordbook-category-code=${wordBookCategoryCode}`
      })
      let wordBookList = wordBookListInfo.wordBookList
      if (wordBookCategoryCode == '99' || wordBookCategoryCode == '10') {
        this.setData({
          wordBookList
        })
        this.setData({
          showFilterContainer: false
        })

      } else {

        let wordNumLevelList = wordBookListInfo.wordNumLevelList
        wordNumLevelList.unshift({
          code: 0,
          desc: "不限",
          max: 0,
          min: 0
        })
        let wordBookSubCategoryInfoList = wordBookListInfo.wordBookSubCategoryInfoList
        wordBookSubCategoryInfoList.unshift({
          wordBookSubCategoryCode: `${options.wordBookCategoryCode}${'00'}}`,
          wordBookSubCategoryName: "不限"
        })

        this.setData({
          wordBookList,
          wordNumLevelList,
          wordBookSubCategoryInfoList,
          chosenIndexArr: [0, 0, 0]
        })
        this.setData({
          showFilterContainer: true
        })

      }

    } else {

      let wordBookListCustom = await common.request({
        url: `/wordbooks-custom`
      })
      this.setData({
        wordBookListCustom,
        showGuideOfCustomWordBook: app.globalData.settings.showGuideOfCustomWordBook,
        showGuideOfCustomWordBookVip: app.globalData.settings.showGuideOfCustomWordBookVip
      })
      this.setData({
        showFilterContainer: false
      })

    }

    this._setInitPosiInfo()
  },

  /**
   * 监听点击取消事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onClickHideOverlay: function (e) {
    this.setData({
      showOverlay: false,
      showBlockContainer: false
    })
  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  onFilterItem: function (e) {
    // 再次点击关闭
    if (this.data.showBlockContainer) {
      this.setData({
        showBlockContainer: false,
        showOverlay: false,
      })
      return
    }
    let type = e.currentTarget.dataset.type
    if (type == 'wordNum') {

      this.setData({
        blockList: this.data.wordNumLevelList
      })

    } else if (type == 'subCategory') {

      this.setData({
        blockList: this.data.wordBookSubCategoryInfoList.map(item => {
          return {
            code: item.wordBookSubCategoryCode,
            desc: item.wordBookSubCategoryName
          }
        })
      })

    } else if (type == 'sort') {

      this.setData({
        blockList: [{
          code: '0',
          desc: '使用人数倒序'
        }]
      })

    }

    this.setData({
      showBlockContainer: true,
      showOverlay: true,
      filterType: e.currentTarget.dataset.type
    })
  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  onBlockItem: async function (e) {

    let filterType = this.data.filterType
    let blockIndex = e.currentTarget.dataset.index
    if (filterType == 'wordNum') {

      let chosenIndexArr = this.data.chosenIndexArr
      chosenIndexArr[0] = blockIndex
      this.setData({
        chosenIndexArr
      })

      let wordNumLevelList = this.data.wordNumLevelList
      let wordBookListInfo = await common.request({
        url: `/wordbooks-official?wordbook-category-code=${this.data.wordBookCategoryCode}&word-num-filter=${wordNumLevelList[blockIndex].code}`
      })
      this.setData({
        wordBookList: wordBookListInfo.wordBookList
      })
      this.onClickHideOverlay()

    } else if (filterType == 'subCategory') {

      let chosenIndexArr = this.data.chosenIndexArr
      chosenIndexArr[1] = blockIndex
      this.setData({
        chosenIndexArr
      })

      let wordBookSubCategoryInfoList = this.data.wordBookSubCategoryInfoList
      let wordBookListInfo = await common.request({
        url: `/wordbooks-official?wordbook-category-code=${this.data.wordBookCategoryCode}&sub-category-filter=${wordBookSubCategoryInfoList[blockIndex].wordBookSubCategoryCode}`
      })
      this.setData({
        wordBookList: wordBookListInfo.wordBookList
      })
      this.onClickHideOverlay()

    }

  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  onWordBook: function (e) {

    let wordBookListIndex = e.currentTarget.dataset.index
    let wordBook = this.data.wordBookList[wordBookListIndex]
    wordBook.isInLearningPlan ? this._onWordBookInLearningPlan(wordBook, wordBookListIndex) : this._onWordBookNotInLearningPlan(wordBook, wordBookListIndex)

  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  _onWordBookNotInLearningPlan: function (wordBook, wordBookListIndex) {
    wx.showModal({
      title: '提示',
      content: `是否将【${wordBook.wordBookName}】添加到计划并作为当前学习？`,
      confirmText: '好的'
    }).then(res => {

      if (res.confirm) {
        Toast.loading()
        http.request({
          url: '/settings',
          method: 'PUT',
          data: {
            "currentWordBookCode": wordBook.wordBookCode
          }
        }).then(res => {

          http.request({
            url: '/wordbook',
            method: 'PUT',
            data: {
              wordBookCode: wordBook.wordBookCode,
              isInLearningPlan: true
            }
          }).then(res => {


            wordBook.isInLearningPlan = true, wordBook.userProgressNum = 0, wordBook.userNum = wordBook.userNum + 1
            app.globalData.settings.currentWordBookCode = wordBook.wordBookCode
            this.setData({
              [`wordBookList[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true,
              currentWordBookCode: wordBook.wordBookCode
            })
            Toast.success('添加成功')

          }).catch(err => console.error(err))
        }).catch(err => console.error(err))
      }
    })

  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  _onWordBookInLearningPlan: function (wordBook, wordBookListIndex) {

    let currentWordBookCode = app.globalData.settings.currentWordBookCode
    if (currentWordBookCode == wordBook.wordBookCode) {

      wx.showModal({
        title: '提示',
        content: `当前学习词书只支持重置进度`,
        confirmText: '好的'
      }).then(res => {
        if (res.confirm) {

          let actions = [{
            name: '重置进度'
          }, {
            name: '查看词书单词'
          }]
          this.setData({
            wordBook,
            wordBookListIndex,
            showPopup: true,
            showActionSheet: true,
            actions: actions,
            actionSheetDesc: '词书选项'
          })

        }
      }).catch(err => console.error(err))

    } else {

      let actions = [{
        name: '设置为当前学习'
      }, {
        name: '重置进度'
      }, {
        name: '查看词书单词'
      }, {
        name: '从计划中移除'
      }]
      this.setData({
        wordBook,
        wordBookListIndex,
        showPopup: true,
        showActionSheet: true,
        actions: actions,
        actionSheetDesc: '词书选项'
      })

    }
  },

  /**
   * 点击词书分类事件
   *
   * @event
   */
  onWordBookCustom: function (e) {

    let wordBookListIndex = e.currentTarget.dataset.index
    let wordBook = this.data.wordBookListCustom[wordBookListIndex]

    let currentWordBookCode = app.globalData.settings.currentWordBookCode
    if (currentWordBookCode == wordBook.wordBookCode) {

      wx.showModal({
        title: '提示',
        content: `当前学习词书只支持重置进度`,
        confirmText: '好的'
      }).then(res => {
        if (res.confirm) {

          let actions = [{
            name: '重置进度'
          }]
          this.setData({
            wordBook,
            wordBookListIndex,
            showPopupCustom: true,
            showActionSheetCustom: true,
            actions: actions,
            actionSheetDesc: '词书选项'
          })

        }
      }).catch(err => console.error(err))

    } else {

      let actions = [{
          name: '设置为当前学习'
        }, {
          name: '重置进度'
        }, {
          name: '查看词书单词'
        },
        {
          name: '重命名'
        }, {
          name: '删除词书'
        }
      ]
      this.setData({
        wordBook,
        wordBookListIndex,
        showPopupCustom: true,
        showActionSheetCustom: true,
        actions: actions,
        actionSheetDesc: '词书选项'
      })

    }

  },

  /**
   * 监听取消actionSheet
   *
   * @event
   */
  onCancelActionSheet: function () {
    this.setData({
      showPopup: false,
      showActionSheet: false,
      showPopupCustom: false,
      showActionSheetCustom: false
    })
  },

  /**
   * 监听选中actionSheet
   *
   * @event
   */
  onSelectActionSheet: function (e) {
    this.onCancelActionSheet()
    let wordBook = this.data.wordBook
    let wordBookListIndex = this.data.wordBookListIndex

    switch (e.detail.name) {

      case '设置为当前学习': {
        wx.showModal({
          title: '提示',
          content: `是否将【${wordBook.wordBookName}】设为当前学习？`,
          confirmText: '好的'
        }).then(res => {
          if (res.confirm) {

            wordBook.isInLearningPlan = true, wordBook.userNum = wordBook.userNum + 1
            app.globalData.settings.currentWordBookCode = wordBook.wordBookCode
            this.setData({
              [`wordBookList[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true,
              currentWordBookCode: wordBook.wordBookCode
            })
            Toast.loading()
            http.request({
              url: '/settings',
              method: 'PUT',
              data: {
                "currentWordBookCode": wordBook.wordBookCode
              }
            }).then(res => {
              Toast.success('设置成功')
            }).catch(err => console.error(err))

          }
        }).catch(err => console.error(err))
        break
      }

      case '重置进度': {
        wx.showModal({
          title: '提示',
          content: `词书进度将会被重置，且不可恢复，是否确认？`,
          confirmText: '确认'
        }).then(res => {
          if (res.confirm) {

            wordBook.userProgressNum = 0
            this.setData({
              [`wordBookList[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true
            })
            Toast.loading()
            http.request({
              url: '/wordbook/reset',
              method: 'PUT',
              data: {
                wordBookCode: wordBook.wordBookCode
              }
            }).then(res => {
              Toast.success('设置成功')
            }).catch(err => console.error(err))

          }
        })
        break
      }

      case '从计划中移除': {
        wx.showModal({
          title: '提示',
          content: `该词书将从计划标签下移除（可重新添加），是否确认移除？`,
          confirmText: '确认'
        }).then(res => {
          if (res.confirm) {

            wordBook.isInLearningPlan = false
            this.data.wordBookList.splice(wordBookListIndex, 1)
            this.setData({
              wordBookList: this.data.wordBookList,
              isBackReLoad: true
            })
            http.request({
              url: '/wordbook',
              method: 'PUT',
              data: {
                wordBookCode: wordBook.wordBookCode,
                isInLearningPlan: false
              }
            }).then(res => {
              Toast.success('设置成功')
            }).catch(err => console.error(err))

          }
        })
        break
      }
      case '查看词书单词': {
        let book = JSON.stringify(this.data.wordBookList[this.data.wordBookListIndex])
        wx.navigateTo({
          url: `/pages/wordbook-word-list/wordbook-word-list?book=${book}`,
        })
        break
      }
    }
  },

  /**
   * 监听选中actionSheet
   *
   * @event
   */
   onSelectActionSheetCustom:  function (e) {
    this.onCancelActionSheet()
    let wordBook = this.data.wordBook
    let wordBookListIndex = this.data.wordBookListIndex

    switch (e.detail.name) {

      case '设置为当前学习': {
        wx.showModal({
          title: '提示',
          content: `是否将【${wordBook.wordBookName}】设为当前学习？`,
          confirmText: '好的'
        }).then(res => {
          if (res.confirm) {

            app.globalData.settings.currentWordBookCode = wordBook.wordBookCode
            this.setData({
              [`wordBookListCustom[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true,
              currentWordBookCode: wordBook.wordBookCode
            })
            Toast.loading()

            http.request({
              url: '/settings',
              method: 'PUT',
              data: {
                "currentWordBookCode": wordBook.wordBookCode
              }
            }).then(res => {
              Toast.success('设置成功')
            }).catch(err => console.error(err))

          }
        }).catch(err => console.error(err))
        break
      }
      case '重命名': {
        wx.showModal({
          title: '请输入新词书名',
          editable: true,
          confirmText: '确认'
        }).then(res => { 
          if (res.confirm) {
            console.log(res.content)
            http.request({
              url: '/custombook/rename',
              method: 'POST',
              data: {
                "bookCode": wordBook.wordBookCode,
                "bookName": res.content
              }
            }).then(res  => {
              Toast.success('设置成功')
              common.request({
                url: `/wordbooks-custom`
              }).then(e=>{
                this.setData({
                  wordBookListCustom:e
                })
              })
            }).catch(err => console.error(err))
          }
        })
        break;
      }

      case '重置进度': {
        wx.showModal({
          title: '提示',
          content: `词书进度将会被重置，且不可恢复，是否确认？`,
          confirmText: '确认'
        }).then(res => {
          if (res.confirm) {

            wordBook.userProgressNum = 0
            this.setData({
              [`wordBookListCustom[${wordBookListIndex}]`]: wordBook,
              isBackReLoad: true
            })
            Toast.loading()
            http.request({
              url: '/wordbook/reset',
              method: 'PUT',
              data: {
                wordBookCode: wordBook.wordBookCode
              }
            }).then(res => {
              Toast.success('设置成功')
            }).catch(err => console.error(err))

          }
        })
        break
      }

      case '删除词书': {
        wx.showModal({
          title: '提示',
          content: `该词书将会被删除，且不可恢复，是否确认？`,
          confirmText: '确认'
        }).then(res => {
          if (res.confirm) {

            this.data.wordBookListCustom.splice(wordBookListIndex, 1)
            this.setData({
              wordBookListCustom: this.data.wordBookListCustom,
              isBackReLoad: true
            })
            http.request({
              url: '/wordbook',
              method: 'DELETE',
              data: {
                wordBookCode: wordBook.wordBookCode
              }
            }).then(res => {
              Toast.success('删除成功')
            }).catch(err => console.error(err))

          }
        })
        break
      }
      case '查看词书单词': {
        let book = JSON.stringify(wordBook)
        wx.navigateTo({
          url: `/pages/wordbook-word-list/wordbook-word-list?book=${book}`,
        })
        break
      }
    }
  },

  /**
   * 监听上传词书事件
   *
   * @event
   */
  uploadWordBookCustom: function () {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: res => {
        const tempFilePaths = res.tempFiles
        // console.log(tempFilePaths)

        Toast.loading({
          message: '上传中...',
          duration: 0
        })
        wx.uploadFile({
          url: config.api_base_url + '/wordbook',
          filePath: tempFilePaths[0].path,
          name: 'file',
          formData: {
            'wordBookName': tempFilePaths[0].name
          },
          header: {
            'content-type': 'multipart/form-data',
            'Authorization': wx.getStorageSync('token')
          },
          success: (res) => {
            Toast.clear()
            // console.log(res)
            if (JSON.parse(res.data).errcode == 410) {
              wx.showModal({
                title: '用量已达上限',
                content: '开通会员解锁更多用量',
                showCancel: false,
                confirmText: '立即开通',
                success: () => {
                  wx.navigateTo({
                    url: `/pages/vip/vip?event=${'vip_wordbookcustom'}`
                  })
                }
              })
            } else {
              let wordBook = JSON.parse(res.data).data
              let wordBookListCustom = this.data.wordBookListCustom
              wordBookListCustom.unshift(wordBook)
              this.setData({
                wordBookListCustom,
                isBackReLoad: true,
                currentWordBookCode: wordBook.wordBookCode
              })
              Toast.loading()
              http.request({
                url: '/settings',
                method: 'PUT',
                data: {
                  "currentWordBookCode": wordBook.wordBookCode
                }
              }).then(res => {
                Toast.success('上传成功')
              }).catch(err => console.error(err))
            }
          },
          fail: (err) => {
            Toast.fail("上传失败，请联系客服")
            Toast.clear()
          }
        })
      },
      fail: (err) => console.log(err)
    })
  },

  /**
   * 取消引导提示事件
   *
   * @event
   */
  onCancelGuide: async function () {
    this.setData({
      showGuideOfCustomWordBook: false
    })
    common.request({
      url: `/settings`,
      method: 'PUT',
      data: {
        showGuideOfCustomWordBook: false
      }
    })
    Toast.success('修改成功')
  },

  /**
   * 取消引导提示事件
   *
   * @event
   */
  onCancelGuideVip: async function () {
    this.setData({
      showGuideOfCustomWordBookVip: false
    })
    common.request({
      url: `/settings`,
      method: 'PUT',
      data: {
        showGuideOfCustomWordBookVip: false
      }
    })
    Toast.success('修改成功')
  },

  /**
   * 监听退出页面事件
   *
   * @inner
   */
  onUnload: function () {
    if (!this.data.isBackReLoad) return
    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]
    prevPage.setData({
      isBackReLoad: true
    })
    prevPage.onLoad()
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitPosiInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - (this.data.showFilterContainer ? 44 : 0),
      blockWidth: parseInt((wx.getSystemInfoSync().windowWidth - 18 * 2 - 22 * 2) / 3),

      isIOS: getApp().globalData.isIOS,
    })
  },
})