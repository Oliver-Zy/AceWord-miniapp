// pages/review-rules/review-rules.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    scrollViewHeight: 0,
    
    // 时间轴数据
    timelineData: [
      { day: 1, desc: '第一次复习', isToday: true },
      { day: 2, desc: '第二次复习', isToday: false },
      { day: 4, desc: '第三次复习', isToday: false },
      { day: 7, desc: '第四次复习', isToday: false },
      { day: 14, desc: '第五次复习', isToday: false }
    ],
    
    // 学习计划数据（示例前7天）
    planData: [
      { date: '第1天', newCards: '1组', reviewCards: '-' },
      { date: '第2天', newCards: '1组', reviewCards: '1组' },
      { date: '第3天', newCards: '1组', reviewCards: '1组' },
      { date: '第4天', newCards: '1组', reviewCards: '2组' },
      { date: '第5天', newCards: '1组', reviewCards: '2组' },
      { date: '第6天', newCards: '1组', reviewCards: '2组' },
      { date: '第7天', newCards: '1组', reviewCards: '3组' }
    ],
    
    // FAQ数据
    faqData: [
      {
        id: 1,
        question: '假如我在推荐复习的那天没有复习，复习规则会怎么处理？',
        answer: '我们会"冻结"那张卡片的复习进度，直到你下次开始复习。也就是说，推荐的下次复习时间会以你实际的复习时间为准。'
      },
      {
        id: 2,
        question: '假如我提前复习，复习规则会怎么处理？',
        answer: '如果你提前复习，也就是在尚未到「推荐现在复习」的状态复习，那么该次复习不会影响推荐的下次复习时间，但是仍然会算一次练习次数。'
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 计算滚动区域高度
    const systemInfo = wx.getSystemInfoSync()
    const capsuleInfo = wx.getMenuButtonBoundingClientRect()
    const naviBarHeight = capsuleInfo.bottom + 6
    
    this.setData({
      naviBarHeight: naviBarHeight,
      scrollViewHeight: systemInfo.windowHeight - naviBarHeight
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 设置状态栏颜色，适配当前主题
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor(isDarkMode)
  }
})
