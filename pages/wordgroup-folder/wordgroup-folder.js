import {
  Common
} from '../../models/common.js'
const common = new Common()
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fieldValue: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this._setInitPosiInfo()

    Toast.loading()
    let wordGroupList = await common.request({
      url: '/wordgroup'
    })

    // In Order To: 我的收藏排在第一位
    let defaultWordGroupIndex = wordGroupList.findIndex(item => item.id == 0)
    let defaultWordGroup = wordGroupList.splice(defaultWordGroupIndex, 1)[0]
    wordGroupList.unshift(defaultWordGroup)
    Toast.clear()
    let todayCardList = wx.getStorageSync('todayCardList') || []
    wordGroupList.unshift({
      groupName: "今日卡片单词列表",
      id: -1,
      count: todayCardList.length * 5
    })
    // console.log(wordGroupList)
    this.setData({
      wordGroupList,
      todayCardList
    })
  },

  /**
   * 监听点击新建单词本事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onAddWordGroup: function (e) {
    this.setData({
      showFieldDialog: true
    })
  },

  /**
   * 创建单词本
   *
   * @event
   * @param { Object } e 事件参数
   */
  onFieldDialogConfirm: async function (e) {

    try {

      let wordGroup = await common.request({
        url: '/wordgroup',
        method: 'POST',
        data: {
          wordGroupName: this.data.wordGroupName
        }
      })
      Toast.success('创建成功')
      this.data.wordGroupList.unshift(wordGroup)
      this.setData({
        fieldValue: '',
        wordGroupList: this.data.wordGroupList
      })

    } catch (err) {

      // console.log(err)
      if (err.errcode == 410) {
        wx.showModal({
          title: '用量已达上限',
          content: '开通会员解锁更多单词本用量',
          showCancel: false,
          confirmText: '立即开通',
          success: () => {
            wx.navigateTo({
              // 注释掉VIP页面跳转
              // url: `/pages/vip/vip?event=${'vip_wordgroup'}`
            })
          }
        })
      }

    }
  },

  /**
   * 监听取消事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onFieldDialogCancel: async function (e) {
    this.setData({
      fieldValue: ''
    })
  },

  /**
   * 监听输入框输入事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onFieldChange(e) {
    this.setData({
      wordGroupName: e.detail
    })
  },

  /**
   * 监听点击文件夹事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onCellFolder: async function (e) {
    let wordGroup = this.data.wordGroupList[e.currentTarget.dataset.index]
    if (wordGroup.count == 0) {
      wx.showToast({
        icon: 'none',
        title: '该单词本无单词',
      })
      return
    }

    let wordGroupID = wordGroup.id
    // -1为今日卡片
    let wordGroupName = wordGroup.groupName == '默认单词本' ? '我的收藏' : wordGroup.groupName
    let pageInfo;
    if (wordGroupID != -1) {
      pageInfo = await common.request({
        url: `/wordgroup/wordlist?wordgroupid=${wordGroupID}`
      })
    } else {
      // 将cardList 转为 wordList
      let wordList = []
      this.data.todayCardList.forEach(card => {
        card.wordList.forEach(word => {
          wordList.push(word)
        })
      })

      // 如果是今日单词本
      pageInfo = {
        currentPage: 1,
        hasNextPage: false,
        totalCount: wordList.length,
        "data": [{
          "date": app.globalData.todayDate,
          wordList
        }]
      }
    }

    wx.navigateTo({
      url: `../wordgroup/wordgroup?pageInfo=${JSON.stringify(pageInfo)}&wordGroupName=${wordGroupName}&wordGroupID=${wordGroupID}`
    })
  },

  /**
   * 监听点击删除事件
   *
   * @event
   * @param { Object } e 事件参数
   */
  onDeleteWordGroup: async function (e) {
    // console.log(this.data.wordGroupList)

    let wordGroupID = this.data.wordGroupList[e.currentTarget.dataset.index].id
    switch (wordGroupID) {
      case 0:
        this.setData({
          showNotifDialog: true
        })
        break
      default:
        let index = this.data.wordGroupList.findIndex(item => item.id == wordGroupID)
        this.data.wordGroupList.splice(index, 1)
        this.setData({
          wordGroupList: this.data.wordGroupList
        })
        await common.request({
          url: `/wordgroup`,
          method: 'DELETE',
          data: {
            wordGroupID: wordGroupID
          }
        })
        Toast.success('删除成功')
        break
    }
  },

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setInitPosiInfo: function () {
    this.setData({
      naviBarHeight: wx.getMenuButtonBoundingClientRect().bottom + 6,
      scrollViewHeight: wx.getSystemInfoSync().windowHeight - (wx.getMenuButtonBoundingClientRect().bottom + 6) - 48 - 30,
    })
  },
})