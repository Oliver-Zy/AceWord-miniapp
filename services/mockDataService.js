/**
 * Mock数据服务
 * 用于加载和处理词书mock数据
 */

import LITE_WORDBOOK_DATA from '../data/liteWordbookData.js'
import DATA_CONFIG from '../config/dataConfig.js'

class MockDataService {
  constructor() {
    this.mockData = null
    // 注意：现在只有精简版数据可用，完整版数据已移除
    // 生产环境将直接从数据库获取数据，不再依赖本地文件
  }

  /**
   * 加载mock数据
   */
  async loadMockData() {
    if (this.mockData) {
      return this.mockData
    }

    try {
      if (DATA_CONFIG.DEV_MODE.showModeLog) {
        console.log(`📚 词书数据加载模式: 精简模式 (开发预览用)`)
      }
      
      const mockData = await this._loadRealWordbookData()
      
      if (DATA_CONFIG.DEV_MODE.showDataStats) {
        console.log(`📊 词书数据统计: ${mockData.wordbooks.length} 本词书已加载`)
      }
      
      this.mockData = mockData
      return mockData
    } catch (error) {
      console.error('Failed to load mock data:', error)
      // 如果加载失败，回退到示例数据
      return this._getFallbackData()
    }
  }

  /**
   * 加载真实的词书数据
   */
  async _loadRealWordbookData() {
    // 在小程序中，我们需要将JSON数据转换为JS模块或通过网络请求加载
    // 这里我们先模拟从docs/wordbook-data.json加载数据的过程
    
    return new Promise((resolve, reject) => {
      // 模拟异步加载
      setTimeout(() => {
        try {
          // 这里应该是真实的数据加载逻辑
          // 由于小程序的限制，我们需要将JSON数据转换为JS格式
          const realData = {
            categories: {
              main_categories: [
                {
                  name: '基础教育阶段',
                  code: '01',
                  english_name: 'K-12 Education',
                  description: '小学、初中、高中阶段英语学习'
                },
                {
                  name: '大学英语考试',
                  code: '02',
                  english_name: 'College English Tests',
                  description: '大学英语四六级等考试'
                },
                {
                  name: '研究生考试',
                  code: '03',
                  english_name: 'Graduate Entrance Exams',
                  description: '硕士和博士研究生入学考试相关词汇'
                },
                {
                  name: '出国留学考试',
                  code: '04',
                  english_name: 'International Tests',
                  description: '托福、雅思、GRE等出国考试'
                },
                {
                  name: '成人继续教育',
                  code: '05',
                  english_name: 'Adult Education',
                  description: '专升本、自考、PETS等成人考试'
                },
                {
                  name: '专业英语',
                  code: '99',
                  english_name: 'Professional English',
                  description: '商务、旅游、生活等专业场景英语'
                }
              ],
              sub_categories: [
                // 基础教育阶段
                { name: '小学英语', code: '01', parent_code: '01', english_name: 'Elementary' },
                { name: '初中英语', code: '02', parent_code: '01', english_name: 'Middle School' },
                { name: '高中英语', code: '03', parent_code: '01', english_name: 'High School' },
                // 大学英语考试
                { name: '英语四级', code: '01', parent_code: '02', english_name: 'CET-4' },
                { name: '英语六级', code: '02', parent_code: '02', english_name: 'CET-6' },
                { name: '专业四级', code: '03', parent_code: '02', english_name: 'TEM-4' },
                { name: '专业八级', code: '04', parent_code: '02', english_name: 'TEM-8' },
                // 研究生考试
                { name: '考研英语', code: '01', parent_code: '03', english_name: 'Postgraduate Entrance Exam' },
                { name: '考博英语', code: '02', parent_code: '03', english_name: 'Doctoral English' },
                // 出国留学考试
                { name: '托福', code: '01', parent_code: '04', english_name: 'TOEFL' },
                { name: '雅思', code: '02', parent_code: '04', english_name: 'IELTS' },
                { name: 'GRE/GMAT/SAT', code: '03', parent_code: '04', english_name: 'GRE/GMAT/SAT' },
                // 成人继续教育
                { name: '专升本', code: '01', parent_code: '05', english_name: 'Adult Bachelor' },
                { name: '自考', code: '02', parent_code: '05', english_name: 'Self-study Exam' },
                { name: 'PETS考试', code: '03', parent_code: '05', english_name: 'PETS' },
                // 专业英语 (精简版额外分类)
                { name: '商务英语', code: '01', parent_code: '99', english_name: 'Business English' },
                { name: '旅游英语', code: '02', parent_code: '99', english_name: 'Travel English' },
                { name: '生活英语', code: '03', parent_code: '99', english_name: 'Daily English' }
              ]
            },
            // 这里需要加载真实的1134本词书数据
            wordbooks: []
          }
          
          // 根据模式加载对应的词书数据
          realData.wordbooks = this._loadRealWordbooks()
          
          resolve(realData)
        } catch (error) {
          reject(error)
        }
      }, 100)
    })
  }

  /**
   * 获取回退数据
   */
  _getFallbackData() {
    return {
      categories: {
        main_categories: [
          {
            name: '基础教育阶段',
            code: '01',
            english_name: 'K-12 Education',
            description: '小学、初中、高中阶段英语学习'
          },
          {
            name: '大学英语考试',
            code: '02',
            english_name: 'College English Tests',
            description: '大学英语四六级等考试'
          },
          {
            name: '研究生考试',
            code: '03',
            english_name: 'Graduate Entrance Exams',
            description: '硕士和博士研究生入学考试相关词汇'
          },
          {
            name: '出国留学考试',
            code: '04',
            english_name: 'International Tests',
            description: '托福、雅思、GRE等出国考试'
          },
          {
            name: '成人继续教育',
            code: '05',
            english_name: 'Adult Education',
            description: '专升本、自考、PETS等成人考试'
          }
        ],
        sub_categories: [
          // 基础教育阶段
          { name: '小学英语', code: '01', parent_code: '01', english_name: 'Elementary' },
          { name: '初中英语', code: '02', parent_code: '01', english_name: 'Middle School' },
          { name: '高中英语', code: '03', parent_code: '01', english_name: 'High School' },
          // 大学英语考试
          { name: '英语四级', code: '01', parent_code: '02', english_name: 'CET-4' },
          { name: '英语六级', code: '02', parent_code: '02', english_name: 'CET-6' },
          { name: '专业四级', code: '03', parent_code: '02', english_name: 'TEM-4' },
          { name: '专业八级', code: '04', parent_code: '02', english_name: 'TEM-8' },
          // 研究生考试
          { name: '考研英语', code: '01', parent_code: '03', english_name: 'Postgraduate Entrance Exam' },
          { name: '考博英语', code: '02', parent_code: '03', english_name: 'Doctoral English' },
          // 出国留学考试
          { name: '托福', code: '01', parent_code: '04', english_name: 'TOEFL' },
          { name: '雅思', code: '02', parent_code: '04', english_name: 'IELTS' },
          { name: 'GRE/GMAT/SAT', code: '03', parent_code: '04', english_name: 'GRE/GMAT/SAT' },
          // 成人继续教育
          { name: '专升本', code: '01', parent_code: '05', english_name: 'Adult Bachelor' },
          { name: '自考', code: '02', parent_code: '05', english_name: 'Self-study Exam' },
          { name: 'PETS考试', code: '03', parent_code: '05', english_name: 'PETS' }
        ]
      },
      wordbooks: this._generateSampleWordbooks()
    }
  }

  /**
   * 加载词书数据
   * 注意：原完整版数据已移除，现在统一使用精简版数据用于开发和预览
   * 生产环境将直接从数据库获取数据
   */
  _loadRealWordbooks() {
    try {
      // 现在只使用精简版数据，因为完整版数据已移除
      const sourceData = LITE_WORDBOOK_DATA
      
      if (DATA_CONFIG.DEV_MODE.showModeLog) {
        console.log(`📖 加载词书数据: ${sourceData.length} 本词书 (精简版，用于开发预览)`)
        console.log(`💡 生产环境将直接从数据库获取完整词书数据`)
      }
      
      return sourceData.map(book => ({
        code: book.code,
        name: book.name,
        description: book.description,
        total_word_num: book.total_word_num || 1000, // 默认词数
        category: book.category,
        subcategory: book.subcategory,
        userNum: Math.floor(Math.random() * 1000) + 50, // 随机生成学习人数
        createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        isHot: Math.random() > 0.8, // 20%概率为热门
        isNew: Math.random() > 0.9  // 10%概率为新书
      }))
    } catch (error) {
      console.error('Failed to load wordbook data:', error)
      // 如果加载失败，返回示例数据
      return this._generateSampleWordbooks()
    }
  }

  /**
   * 生成示例词书数据
   */
  _generateSampleWordbooks() {
    const wordbooks = []
    
    // 为每个子分类生成一些示例词书
    const subCategories = [
      { category: '基础教育阶段', subcategory: '小学英语', code: '0101' },
      { category: '基础教育阶段', subcategory: '初中英语', code: '0102' },
      { category: '基础教育阶段', subcategory: '高中英语', code: '0103' },
      { category: '大学英语考试', subcategory: '英语四级', code: '0201' },
      { category: '大学英语考试', subcategory: '英语六级', code: '0202' },
      { category: '大学英语考试', subcategory: '专业四级', code: '0203' },
      { category: '大学英语考试', subcategory: '专业八级', code: '0204' },
      { category: '研究生考试', subcategory: '考研英语', code: '0301' },
      { category: '研究生考试', subcategory: '考博英语', code: '0302' },
      { category: '出国留学考试', subcategory: '托福', code: '0401' },
      { category: '出国留学考试', subcategory: '雅思', code: '0402' },
      { category: '出国留学考试', subcategory: 'GRE/GMAT/SAT', code: '0403' },
      { category: '成人继续教育', subcategory: '专升本', code: '0501' },
      { category: '成人继续教育', subcategory: '自考', code: '0502' },
      { category: '成人继续教育', subcategory: 'PETS考试', code: '0503' }
    ]

    subCategories.forEach((subCat, index) => {
      // 为每个子分类生成3-5本词书
      const bookCount = 3 + Math.floor(Math.random() * 3)
      
      for (let i = 1; i <= bookCount; i++) {
        const bookCode = `${subCat.code}${i.toString().padStart(4, '0')}`
        
        wordbooks.push({
          code: bookCode,
          name: `${subCat.subcategory}词汇${i}`,
          description: `${subCat.subcategory}相关词汇，适合相应阶段学习使用`,
          total_word_num: 800 + Math.floor(Math.random() * 2000),
          category: subCat.category,
          subcategory: subCat.subcategory,
          userNum: 100 + Math.floor(Math.random() * 1000),
          createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          isHot: Math.random() > 0.7,
          isNew: Math.random() > 0.8
        })
      }
    })

    return wordbooks
  }

  /**
   * 根据分类获取词书
   */
  getWordBooksByCategory(categoryName, subCategoryName) {
    if (!this.mockData) {
      return []
    }

    return this.mockData.wordbooks.filter(book => 
      book.category === categoryName && book.subcategory === subCategoryName
    )
  }

  /**
   * 根据分类代码获取词书
   */
  getWordBooksByCategoryCode(categoryCode, subCategoryCode = null) {
    if (!this.mockData) {
      return []
    }

    const category = this.mockData.categories.main_categories.find(cat => cat.code === categoryCode)
    if (!category) {
      return []
    }

    let books = this.mockData.wordbooks.filter(book => book.category === category.name)

    if (subCategoryCode) {
      const subCategory = this.mockData.categories.sub_categories.find(
        subCat => subCat.code === subCategoryCode && subCat.parent_code === categoryCode
      )
      if (subCategory) {
        books = books.filter(book => book.subcategory === subCategory.name)
      }
    }

    return books
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    if (!this.mockData) {
      return { main_categories: [], sub_categories: [] }
    }
    return this.mockData.categories
  }

  /**
   * 清除数据缓存（用于调试）
   */
  clearCache() {
    this.mockData = null
    console.log(`🗑️ 词书数据缓存已清除`)
  }

  /**
   * 获取当前数据信息
   */
  getDataInfo() {
    return {
      dataCount: this.mockData ? this.mockData.wordbooks.length : 0,
      mode: '精简模式 (开发预览)',
      source: 'liteWordbookData.js',
      note: '生产环境将从数据库获取完整数据'
    }
  }
}

// 创建单例实例
const mockDataService = new MockDataService()

export default mockDataService
