import { Common } from '../../models/common.js'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'
import { getExamWordbooks, getExamWordbookByCode } from '../../data/examWordbookData.js'

const common = new Common()
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    examType: '', // 考试类型 (kaoyan1, kaoyan2)
    examName: '', // 考试名称
    yearGroups: [], // 按年份分组的词汇数据
    activeNames: [], // 展开的年份
    isLoaded: false,
    isRefresherTriggered: false,
    naviBarHeight: 44,
    scrollViewHeight: 600,
    showNaviBarDivider: false,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this._setInitInfo()
    
    // 获取传递的参数
    const examType = options.examType || 'kaoyan1'
    const examName = decodeURIComponent(options.examName || '考研英语一真题')
    
    this.setData({
      examType: examType,
      examName: examName,
      // 重置页面状态
      activeNames: [],
      yearGroups: [],
      isLoaded: false,
      isRefresherTriggered: false
    })
    
    await this._loadExamWordData()
  },

  /**
   * 设置初始信息
   */
  _setInitInfo: function () {
    const systemInfo = wx.getSystemInfoSync()
    const capsuleInfo = wx.getMenuButtonBoundingClientRect()
    
    this.setData({
      naviBarHeight: capsuleInfo.bottom + 6,
      scrollViewHeight: systemInfo.windowHeight - (capsuleInfo.bottom + 6)
    })
  },

  /**
   * 加载真题词汇数据
   */
  _loadExamWordData: async function () {
    try {
      // 检查页面是否还存在，避免异步竞争
      if (!this.data) return
      
      // 先清除可能存在的Toast，然后显示新的加载状态
      Toast.clear()
      Toast.loading({ message: '加载中...', forbidClick: true })
      
      // 模拟异步加载延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟获取真题词汇数据，按年份分组
      const yearGroups = this._generateMockWordData()
      
      // 检查页面是否还存在
      if (!this.data) return
      
      this.setData({
        yearGroups: yearGroups,
        isLoaded: true
      })
      
      Toast.clear()
    } catch (error) {
      console.error('加载真题词汇数据失败:', error)
      Toast.fail('加载失败，请重试')
      this.setData({ isLoaded: true })
    }
  },

  /**
   * 生成模拟词汇数据
   */
  _generateMockWordData: function () {
    const years = ['2024', '2023', '2022', '2021', '2020']
    
    // 更丰富的词汇数据
    const wordsByYear = {
      '2024': [
        { word: 'artificial', meaning: 'adj. 人工的，人造的', frequency: 25 },
        { word: 'intelligence', meaning: 'n. 智能，智力', frequency: 23 },
        { word: 'sustainable', meaning: 'adj. 可持续的', frequency: 18 },
        { word: 'innovation', meaning: 'n. 创新，革新', frequency: 20 },
        { word: 'digital', meaning: 'adj. 数字的，数码的', frequency: 22 },
        { word: 'transformation', meaning: 'n. 转变，改革', frequency: 16 },
        { word: 'environment', meaning: 'n. 环境', frequency: 19 },
        { word: 'technology', meaning: 'n. 技术，科技', frequency: 24 },
        { word: 'economy', meaning: 'n. 经济', frequency: 21 },
        { word: 'society', meaning: 'n. 社会', frequency: 17 }
      ],
      '2023': [
        { word: 'pandemic', meaning: 'n. 大流行病', frequency: 28 },
        { word: 'resilience', meaning: 'n. 恢复力，适应力', frequency: 15 },
        { word: 'adaptation', meaning: 'n. 适应，改编', frequency: 13 },
        { word: 'globalization', meaning: 'n. 全球化', frequency: 19 },
        { word: 'diversity', meaning: 'n. 多样性', frequency: 16 },
        { word: 'collaboration', meaning: 'n. 合作，协作', frequency: 14 },
        { word: 'communication', meaning: 'n. 交流，通信', frequency: 18 },
        { word: 'education', meaning: 'n. 教育', frequency: 20 },
        { word: 'research', meaning: 'n./v. 研究', frequency: 22 },
        { word: 'development', meaning: 'n. 发展，开发', frequency: 17 }
      ],
      '2022': [
        { word: 'climate', meaning: 'n. 气候', frequency: 26 },
        { word: 'carbon', meaning: 'n. 碳', frequency: 24 },
        { word: 'emission', meaning: 'n. 排放', frequency: 21 },
        { word: 'renewable', meaning: 'adj. 可再生的', frequency: 18 },
        { word: 'energy', meaning: 'n. 能源，能量', frequency: 25 },
        { word: 'conservation', meaning: 'n. 保护，保存', frequency: 15 },
        { word: 'biodiversity', meaning: 'n. 生物多样性', frequency: 12 },
        { word: 'ecosystem', meaning: 'n. 生态系统', frequency: 14 },
        { word: 'pollution', meaning: 'n. 污染', frequency: 19 },
        { word: 'resource', meaning: 'n. 资源', frequency: 16 }
      ],
      '2021': [
        { word: 'remote', meaning: 'adj. 远程的，偏远的', frequency: 23 },
        { word: 'virtual', meaning: 'adj. 虚拟的', frequency: 20 },
        { word: 'online', meaning: 'adj./adv. 在线的', frequency: 27 },
        { word: 'platform', meaning: 'n. 平台', frequency: 18 },
        { word: 'network', meaning: 'n. 网络', frequency: 21 },
        { word: 'connection', meaning: 'n. 连接，关系', frequency: 16 },
        { word: 'interaction', meaning: 'n. 互动，相互作用', frequency: 14 },
        { word: 'engagement', meaning: 'n. 参与，约定', frequency: 13 },
        { word: 'participation', meaning: 'n. 参与', frequency: 15 },
        { word: 'community', meaning: 'n. 社区，共同体', frequency: 17 }
      ],
      '2020': [
        { word: 'challenge', meaning: 'n./v. 挑战', frequency: 29 },
        { word: 'opportunity', meaning: 'n. 机会', frequency: 24 },
        { word: 'crisis', meaning: 'n. 危机', frequency: 26 },
        { word: 'solution', meaning: 'n. 解决方案', frequency: 22 },
        { word: 'strategy', meaning: 'n. 策略，战略', frequency: 20 },
        { word: 'implementation', meaning: 'n. 实施，执行', frequency: 16 },
        { word: 'effectiveness', meaning: 'n. 有效性', frequency: 14 },
        { word: 'efficiency', meaning: 'n. 效率', frequency: 18 },
        { word: 'performance', meaning: 'n. 表现，性能', frequency: 19 },
        { word: 'achievement', meaning: 'n. 成就，成绩', frequency: 15 }
      ]
    }

    return years.map((year, index) => {
      // 模拟单次考试的真题词汇数量（更符合实际）
      const mockWordCounts = {
        '2024': 186,
        '2023': 192, 
        '2022': 178,
        '2021': 165,
        '2020': 159
      }
      
      return {
        year: year,
        yearName: `${year}年真题词汇`,
        wordCount: mockWordCounts[year],
        words: wordsByYear[year].map((item, wordIndex) => ({
          id: `${year}_${wordIndex}`,
          word: item.word,
          meaning: item.meaning,
          frequency: item.frequency,
          year: year
        }))
      }
    })
  },

  /**
   * 折叠面板变化
   */
  onCollapseChange: function (event) {
    this.setData({
      activeNames: event.detail
    })
  },

  /**
   * 添加到词书
   */
  onAddToWordbook: function () {
    // 这里可以添加VIP检查逻辑
    Toast.success('功能开发中，敬请期待')
    
    // 示例：跳转到VIP页面或添加逻辑
    // wx.navigateTo({
    //   url: '/pages/vip/vip?source=exam-wordbook'
    // })
  },



  /**
   * 下拉刷新
   */
  onScrollViewRefresh: function () {
    this.setData({ isRefresherTriggered: true })
    this._loadExamWordData().finally(() => {
      this.setData({ isRefresherTriggered: false })
    })
  },

  /**
   * 滚动事件
   */
  onScroll: function (event) {
    const scrollTop = event.detail.scrollTop
    this.setData({
      showNaviBarDivider: scrollTop > 50
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 设置状态栏颜色
    const isDarkMode = wx.getSystemInfoSync().theme === 'dark'
    app.setStatusBarColor && app.setStatusBarColor(isDarkMode)
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 清除可能存在的Toast
    Toast.clear()
  }
})
