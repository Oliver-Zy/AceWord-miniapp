/**
 * 分享卡片方法
 * handler.js
 */

class ShareCardHandler {

  /**
   * 显示分享卡片
   *
   * @param { url, method, data } 
   * @return { Promise } 
   */
  showShareCard(canvasWidth, senCard, todayDate, bgImageSrc) {

    wx.createSelectorQuery()
      .select('#shareCard')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {

        // 初始化数据
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const width = res[0].width
        const height = res[0].height

        // 初始化画布大小
        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
        ctx.clearRect(0, 0, width, height)

        // 绘制背景
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'
        ctx.fillRect(0, 0, canvasWidth, parseInt((canvasWidth * 311) / 311) + 78)

        // 绘制图片
        const image = canvas.createImage()
        image.src = bgImageSrc
        image.onload = () => {

          ctx.drawImage(image, 0, 0, canvasWidth, parseInt((canvasWidth * 311) / 311))

          // 绘制图片蒙层
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
          ctx.fillRect(0, 0, canvasWidth, parseInt((canvasWidth * 311) / 311))

          wx.loadFontFace({
            family: 'poppins-italic',
            source: 'url("https://cdn.uuorb.com/a4/font/v2/poppins-italic.ttf")',
            scopes: ['webview', 'native'],
            success: (res) => {
              // console.log(res)

              let wordArr = senCard.english.split(' ')
              let tempWordArr_1 = [],
                tempWordArr_2 = [],
                tempWordArr_3 = [],
                tempWordArr_4 = []
              for (var i = 0; i < wordArr.length; i++) {
                tempWordArr_1.push(wordArr[i])
                if (ctx.measureText(tempWordArr_1.join(' ')).width > 200) {
                  tempWordArr_1.pop(wordArr[i])
                  tempWordArr_2.push(wordArr[i])

                  if (ctx.measureText(tempWordArr_2.join(' ')).width > 200) {
                    tempWordArr_2.pop(wordArr[i])
                    tempWordArr_3.push(wordArr[i])

                    if (ctx.measureText(tempWordArr_3.join(' ')).width > 200) {
                      tempWordArr_3.pop(wordArr[i])
                      tempWordArr_4.push(wordArr[i])
                    }
                  }
                }
              }

              const text_1 = tempWordArr_1.join(' ')
              const text_2 = tempWordArr_2.join(' ')
              const text_3 = tempWordArr_3.join(' ')
              const text_4 = tempWordArr_4.join(' ')
              ctx.fillStyle = 'rgba(255, 255, 255, 1)'
              ctx.font = '14px poppins-italic'
              ctx.fillText(text_1, 15, 30)
              ctx.fillText(text_2, 15, 30 + 22)
              ctx.fillText(text_3, 15, 30 + 22 + 22)
              ctx.fillText(text_4, 15, 30 + 22 + 22 + 22)

              let chinese = senCard.chinese.slice(-1) == '。' ? senCard.chinese : senCard.chinese + '。'
              let tempWordArr_5 = [],
                tempWordArr_6 = []
              for (var i = 0; i < chinese.length; i++) {
                if (ctx.measureText(tempWordArr_5.join('')).width < (canvasWidth - 30)) {
                  tempWordArr_5.push(chinese[i])
                } else {
                  tempWordArr_6.push(chinese[i])
                }
              }

              const text_5 = tempWordArr_5.join('')
              const text_6 = tempWordArr_6.join('')
              const text_7 = '——' + senCard.title
              ctx.fillStyle = 'rgba(255, 255, 255, 1)'
              ctx.font = '12px simHei'
              ctx.fillText(text_5, 15, (tempWordArr_4.length != 0 ? 90 : tempWordArr_3.length != 0 ? 60 : 30) + 22 * 2 + 24)
              ctx.fillText(text_6, 15, (tempWordArr_4.length != 0 ? 90 : tempWordArr_3.length != 0 ? 60 : 30) + 22 * 2 + 24 + 16)
              ctx.fillText(text_7, 15, (tempWordArr_4.length != 0 ? 90 : tempWordArr_3.length != 0 ? 60 : 30) + 22 * parseInt(`${text_5.length == 0 ? 1 : 2}`) + 24 + 16 + 16 + 12)

              const text = `生成于 ${todayDate.slice(0, 4)}.${todayDate.slice(4, 6)}.${todayDate.slice(6)}`
              ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
              ctx.font = '12px simHei'
              ctx.fillText(text, 15, parseInt((canvasWidth * 311) / 311) - 32 + 10 + 5)
            },
          })

          const image_logo = canvas.createImage()
          image_logo.src = '../../images/logos/logo.png'
          image_logo.onload = () => {
            ctx.drawImage(image_logo, 15, parseInt((canvasWidth * 311) / 311) + 15, 48, 48)
            const text_1 = 'AceWord'
            ctx.fillStyle = 'rgba(29, 33, 41, 1)'
            ctx.font = "800 14px simHei"
            ctx.fillText(text_1, 75, parseInt((canvasWidth * 311) / 311) + 20 + 10 + 5)
            const text_2 = '长按扫码开启单词之旅'
            ctx.fillStyle = 'rgba(117, 122, 131, 1)'
            ctx.font = '11px simHei'
            ctx.fillText(text_2, 75, parseInt((canvasWidth * 311) / 311) + 44 + 10)

            const image_qrcode = canvas.createImage()
            image_qrcode.src = '../../images/logos/qrcode.jpg'
            image_qrcode.onload = () => {
              ctx.drawImage(image_qrcode, canvasWidth - 15 - 48, parseInt((canvasWidth * 311) / 311) + 15, 48, 48)
            }
          }
        }
      })
  }

  /**
   * 下载Canvas
   *
   * @param { url, filePath, name } 
   * @return { Promise } 
   */
  async downloadCanvas() {
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery()
        .select('#shareCard')
        .fields({
          node: true,
          size: true
        })
        .exec((res) => {
          const dpr = wx.getWindowInfo().pixelRatio

          wx.canvasToTempFilePath({
            canvas: res[0].node,
            x: 0,
            y: 0,
            width: res[0].width + 100,
            height: res[0].height + 64,
            destWidth: (res[0].width) * dpr * 2,
            destHeight: (res[0].height) * dpr * 2,
            fileType: 'png',
            success: function (res) {
              // console.log(res)

              resolve(res.tempFilePath)
            },
            fail: err => console.error(err)
          })
        })
    })
  }
}

/**
 * 复习页面方法
 * handler.js
 */

class ReviewPageHandler {

  /**
   * 更新单词卡片列表方法
   *
   * @inner
   */
  _updateReviewCardDateList(reviewCardDateList, wordBookCodeToName) {
    return reviewCardDateList.map((item, index) => {

      for (let i = 0; i < item.wordCardList.length; i++) {
        item.wordCardList[i].wordBookName = wordBookCodeToName[item.wordCardList[i].wordBookCode]
        item.wordCardList[i].wordList = item.wordCardList[i].wordInfoList.map(item => item.wordName)
        item.isExpanded = false
      }

      return item
    })
  }

  /**
   * 更新单词卡片列表方法
   *
   * @inner
   */
  _updateWordCardList(wordCardList, wordBookCodeToName) {
    return wordCardList.map(item => {
      item.wordBookName = wordBookCodeToName[item.wordBookCode]
      item.wordList = item.wordInfoList.map(item => item.wordName)

      return item
    })
  }

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
   */
  _getDicCardList(wordInfo, wordList, currentSwiperIndex) {

    let dicCardList = Array()
    for (let i = 0; i < wordList.length; i++) {
      if (i == currentSwiperIndex) {
        wordInfo.isActive = true
        dicCardList[i] = wordInfo
      } else dicCardList[i] = {
        isActive: false
      }
    }

    return dicCardList
  }

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
   */
  _getWordListFromWordCardIDCheckedList(reviewCardDateList, wordCardIDCheckedList) {

    let wordList = Array()
    for (let i = 0; i < reviewCardDateList.length; i++) {
      for (let j = 0; j < reviewCardDateList[i].wordCardList.length; j++) {
        if (wordCardIDCheckedList.indexOf(reviewCardDateList[i].wordCardList[j].wordCardID) != -1) {
          wordList = wordList.concat(reviewCardDateList[i].wordCardList[j].wordList)
        }
      }
    }

    return wordList
  }
}

/**
 * 复习页面方法
 * handler.js
 */

class CalendarPageHandler {

  /**
   * 更新单词卡片列表方法
   *
   * @inner
   */
  _updateWordCardList(wordCardList, wordBookCodeToName) {
    return wordCardList.map(item => {
      item.wordBookName = wordBookCodeToName[item.wordBookCode]
      item.wordList = item.wordInfoList.map(item => item.wordName)

      return item
    })
  }

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
   */
  _getDicCardList(wordInfo, wordList, currentSwiperIndex) {

    let dicCardList = Array()
    for (let i = 0; i < wordList.length; i++) {
      if (i == currentSwiperIndex) {
        wordInfo.isActive = true
        dicCardList[i] = wordInfo
      } else dicCardList[i] = {
        isActive: false
      }
    }

    return dicCardList
  }

  /**
   * 获取词典卡片的内部方法
   *
   * @inner
   */
  _getWordListFromWordCardIDCheckedList(wordCardList, wordCardIDCheckedList) {

    let wordList = []
    for (let i = 0; i < wordCardList.length; i++) {
      if (wordCardIDCheckedList.indexOf(wordCardList[i].wordCardID) != -1) {
        wordList = wordList.concat(wordCardList[i].wordList)
      }
    }

    return wordList
  }

  /**
   * 设置初始位置信息
   *
   * @inner
   */
  _setDateInfo({
    event,
    dateInfo_new,
    dateInfo_old,
    isThisMonth,
    currentMonthIndex
  }) {

    if (event == 'init') {
      let date = new Date()
      let dateInfo = {}
      dateInfo.year = date.getFullYear().toString()
      dateInfo.monthIndex = date.getMonth()
      dateInfo.month = dateInfo.monthIndex < 9 ? '0' + (dateInfo.monthIndex + 1).toString() : (dateInfo.monthIndex + 1).toString()
      dateInfo.emptyDayLen = new Date(dateInfo.year + '/' + dateInfo.month + '/' + '01').getDay()

      dateInfo.dayIndex = date.getDate() + dateInfo.emptyDayLen - 1
      dateInfo.day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate().toString()
      dateInfo.currentDate = dateInfo.year + dateInfo.month + dateInfo.day

      return dateInfo

    } else if (event == 'changeDay') {

      let dateInfo = {}
      dateInfo.year = dateInfo_old.year
      dateInfo.monthIndex = dateInfo_old.monthIndex
      dateInfo.month = dateInfo_old.month
      dateInfo.emptyDayLen = dateInfo_old.emptyDayLen

      dateInfo.dayIndex = dateInfo_new.dayIndex
      dateInfo.day = (dateInfo_new.dayIndex - dateInfo.emptyDayLen + 1) < 10 ? '0' + (dateInfo_new.dayIndex - dateInfo.emptyDayLen + 1) : (dateInfo_new.dayIndex - dateInfo.emptyDayLen + 1).toString()
      dateInfo.currentDate = dateInfo.year + dateInfo.month + dateInfo.day

      return dateInfo

    } else if (event == 'prevMonth' || event == 'nextMonth') {
      let dateInfo = {}
      let monthLenArr = ['31', '28', '31', '30', '31', '30', '31', '31', '30', '31', '30', '31']
      if (dateInfo_new.monthIndex == -1) {
        dateInfo_new.monthIndex = 11
        dateInfo_old.year = dateInfo_old.year - 1
      }
      if (dateInfo_new.monthIndex == 12) {
        dateInfo_new.monthIndex = 0
        dateInfo_old.year = dateInfo_old.year + 1
      }
      dateInfo.year = dateInfo_old.year
      dateInfo.monthIndex = dateInfo_new.monthIndex
      dateInfo.month = (dateInfo.monthIndex + 1) < 10 ? '0' + (dateInfo.monthIndex + 1) : (dateInfo.monthIndex + 1).toString()
      dateInfo.emptyDayLen = new Date(dateInfo.year + '/' + dateInfo.month + '/' + '01').getDay()

      if (currentMonthIndex!=dateInfo.monthIndex) {
        dateInfo.dayIndex = parseInt(monthLenArr[dateInfo.monthIndex]) + dateInfo.emptyDayLen - 1
        dateInfo.day = monthLenArr[dateInfo.monthIndex]
      } else {
        dateInfo.dayIndex = parseInt(getApp().globalData.todayDate.slice(6)) + dateInfo.emptyDayLen - 1
        dateInfo.day = getApp().globalData.todayDate.slice(6)
      }

      dateInfo.currentDate = dateInfo.year + dateInfo.month + dateInfo.day
      return dateInfo
    }
  }

}

export {
  ShareCardHandler,
  ReviewPageHandler,
  CalendarPageHandler
}