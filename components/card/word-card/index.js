import {
  config
} from '../../../config'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    wordCard: Object,
    isChecked: Boolean,
    noHeader: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isDeleted: false,
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached: function () {
      this.setData({
        isDarkMode: getApp().globalData.isDarkMode,
      })
    },
  },

  /**
   * 数据监听器
   */
  observers: {
    'wordCard': function (wordCard) {
      // console.log(wordCard)

      // 存在两个内部属性，用来描述卡片数据被设置时的场景
      // _type: 'loading' 加载中, 'blank' 空状态;
      // _relatedAction: 'replaceWord' 替换单词, 'deleteWord' 删除单词, 'addCard' 添加卡片, 'refresh' 添加卡片

      if (wordCard._type == 'loading' || wordCard._type == 'blank') return
      if (wordCard._relatedAction == 'replaceWord') {

        // UPDATE: 更新原卡片单词为替换的单词
        // console.log(wordCard)
        // console.log(this.data.wordInfoList)
        let index = this.data.wordInfoList.findIndex((item, index) => item.wordName != wordCard.wordList[index])
        this.setData({
          [`wordInfoList[${index}].wordName`]: wordCard.wordList[index]
        })

      } else if (wordCard._relatedAction == 'deleteWordCard') {

        // console.log(wordCard)
        this.setData({
          isDeleted: wordCard.isDeleted
        })

      } else if (wordCard._relatedAction == 'addWordCard') {

      } else if (wordCard._relatedAction == 'expandOrCollapse') {

        let nextPracticeTime = this.calNextPracticeTime(Number(wordCard.nextPracticeTimeStamp))
        this.setData({
          nextPracticeTime
        })

      } else if (wordCard._relatedAction == 'AddStyle') {

        // console.log(wordCard)
        let wordInfoList = this.data.wordInfoList.map((item, index) => {
          item.opacity = wordCard.wordInfoList[index].opacity
          item.bgColor = wordCard.wordInfoList[index].bgColor
          return item
        }) 
        this.setData({
          wordInfoList
        })

      } else if (wordCard._relatedAction == 'practice') {

        // console.log(wordCard)
        let nextPracticeTime = this.calNextPracticeTime(Number(wordCard.nextPracticeTimeStamp))
        this.setData({
          nextPracticeTime
        })

      } else if (wordCard._relatedAction == undefined) {

        // console.log(wordCard)
        let nextPracticeTime = this.calNextPracticeTime(Number(wordCard.nextPracticeTimeStamp))
        let wordCardFontFamily = getApp().globalData.settings.wordCardFontFamily
        this.setData({
          isDeleted: wordCard.isDeleted,
          effectivePracticeNum: wordCard.effectivePracticeNum,
          nextPracticeTime,
          wordInfoList: this.calWordPosi(wordCard.wordList),
          wordCardFontFamily
        })

      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 监听点击单词事件
     *
     * @event
     */
    onWord: function (e) {
      let currentWordCard = {
        wordCardID: this.data.wordCard.wordCardID,
        wordBookCode: this.data.wordCard.wordBookCode,
        wordList: this.data.wordCard.wordList
      }
      this.triggerEvent('wordCardEvent', {
        type: 'showDic',
        currentSwiperIndex: e.currentTarget.dataset.index,
        currentWordCard: currentWordCard
      })
    },

    /**
     * 监听刷新事件
     *
     * @event
     */
    onRefreshTouchstart: function () {
      this.setData({
        ifOpacity: true
      })
    },

    /**
     * 监听刷新事件
     *
     * @event
     */
    onRefreshTouchend: function () {
      this.setData({
        ifOpacity: false
      })
      this.data.wordInfoList = this.calWordPosi(this.data.wordCard.wordList, 'refresh')
      setTimeout(() => this.setData({
        wordInfoList: this.data.wordInfoList
      }), 100)
    },

    /**
     * 监听选中事件
     *
     * @event
     */
    onCheck: function () {
      let currentWordCard = {
        wordCardID: this.data.wordCard.wordCardID,
        isChecked: !this.data.isChecked
      }
      this.setData({
        isChecked: !this.data.isChecked
      })
      this.triggerEvent('wordCardEvent', {
        type: 'check',
        currentWordCard: currentWordCard,
        wordList:this.data.wordCard.wordList,
        isChecked:this.data.isChecked
      })
    },

    /**
     * 生成单词定位
     * @function calWordPosi
     * @param {Array} - e.g ['appease', 'exiguous', 'terse', 'temerity', 'loath']
     * @return {Array} - e.g [{name: 'appease', left: 100px, top: 10px,}]
     */
    calWordPosi: function (wordList, type) {
      // console.log(wordList)

      let blockIDArr = this._shuffle([1, 2, 3, 4, 5, 6])
      return wordList.map((item, index) => {
        let blockID = blockIDArr[index]
        let top = blockID == 1 || blockID == 2 ? 16 : blockID == 3 || blockID == 4 ? 60 : blockID == 5 || blockID == 6 ? 104 : -1
        let left = blockID % 2 == 0 ? Math.round((wx.getSystemInfoSync().windowWidth - 60) / 2) + this._calWordLeft(item) : this._calWordLeft(item)

        // console.log(top)
        // console.log(left)

        // type == 'refresh' 执行刷新动画
        if (type == 'refresh') {
          let prevBlockID = (this.data.wordInfoList.map((_item, _index) => _item.wordName == item ? true : false).indexOf(true)) + 1
          // console.log(prevBlockID)
          // console.log(JSON.stringify(this.data.wordInfoList))

          this.animate(`#block-${prevBlockID}`, [{
              top: this.data.wordInfoList[prevBlockID - 1].top,
              left: this.data.wordInfoList[prevBlockID - 1].left,
              ease: 'ease'
            },
            {
              top: top,
              left: left,
              ease: 'ease'
            },
          ], 400)
        }

        return {
          wordName: item,
          top: top,
          left: left,
          opacity: this.data.wordCard.wordInfoList[index].opacity,
          bgColor: this.data.wordCard.wordInfoList[index].bgColor
        }
      })
    },

    /**
     * 生成乱序数组
     *
     * @param { TimeStamp } nextPracticeTimeStamp 下次复习时间戳
     * @return { String } 下次复习时间
     */
    calNextPracticeTime: function (nextPracticeTimeStamp) {
      let nowTimeStamp = Number(Date.parse(new Date()).toString().substr(0, 10))
      let timeDiff = nextPracticeTimeStamp - nowTimeStamp
      // console.log(nextPracticeTimeStamp)
      // console.log(nowTimeStamp)
      // console.log(timeDiff)

      if (timeDiff < 2) {

        return '现在'

      } else {

        let days = Math.floor(timeDiff / (24 * 3600))
        let hours = Math.floor((timeDiff % (24 * 3600)) / (3600))
        let minutes = Math.floor((timeDiff % (3600)) / (60))

        // 确保分钟数至少为1，避免显示0分钟后
        if (days == 0 && hours == 0 && minutes == 0) {
          minutes = 1
        }

        return days != 0 ? days + '天后' : hours != 0 ? hours + '小时后' : minutes + '分钟后'
      }
    },

    /**
     * 生成乱序数组
     *
     * @param { TimeStamp } nextPracticeTimeStamp 下次复习时间戳
     * @return { String } 下次复习时间
     */
    onDelete: function () {
      let currentWordCard = {
        wordCardID: this.data.wordCard.wordCardID
      }
      this.triggerEvent('wordCardEvent', {
        type: 'delete',
        currentWordCard: currentWordCard
      })
    },

    /**
     * 生成乱序数组
     *
     * @param { Array } arr 顺序数组
     * @return { Array } 乱序数组
     */
    _shuffle: function (arr) {
      return arr.sort(() => {
        return 0.5 - Math.random()
      })
    },

    /**
     * 计算左边距离
     *
     * @param { String } wordName 单词名
     * @return { Number } 距离
     */
    _calWordLeft: function (wordName) {
      return Math.round(Math.random() * (100 - wordName.length * 5) + 5)
    },
  },
})