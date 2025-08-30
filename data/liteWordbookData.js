/**
 * 精简版词书数据 (开发预览使用)
 * 用于开发和预览，减少数据量提升性能
 * 
 * 包含每个分类的代表性词书，总计约30本
 * 生产环境将直接从数据库获取完整词书数据
 */

const LITE_WORDBOOK_DATA = [
  // 基础教育阶段 - 小学英语
  {
    "code": "01010001",
    "name": "小学英语核心词汇",
    "description": "小学阶段必备英语词汇",
    "total_word_num": 800,
    "category": "基础教育阶段",
    "subcategory": "小学英语"
  },
  {
    "code": "01010002",
    "name": "小学英语常用词汇",
    "description": "小学英语日常学习词汇",
    "total_word_num": 600,
    "category": "基础教育阶段",
    "subcategory": "小学英语"
  },

  // 基础教育阶段 - 初中英语
  {
    "code": "01020001",
    "name": "初中英语必备词汇",
    "description": "初中阶段核心英语词汇",
    "total_word_num": 1500,
    "category": "基础教育阶段",
    "subcategory": "初中英语"
  },
  {
    "code": "01020002",
    "name": "中考英语词汇",
    "description": "中考英语考试重点词汇",
    "total_word_num": 1800,
    "category": "基础教育阶段",
    "subcategory": "初中英语"
  },

  // 基础教育阶段 - 高中英语
  {
    "code": "01030001",
    "name": "高中英语核心词汇",
    "description": "高中阶段重要英语词汇",
    "total_word_num": 3000,
    "category": "基础教育阶段",
    "subcategory": "高中英语"
  },
  {
    "code": "01030002",
    "name": "高考英语词汇",
    "description": "高考英语考试必备词汇",
    "total_word_num": 3500,
    "category": "基础教育阶段",
    "subcategory": "高中英语"
  },

  // 大学英语考试 - 英语四级
  {
    "code": "02010001",
    "name": "大学英语四级词汇",
    "description": "CET-4考试核心词汇",
    "total_word_num": 4000,
    "category": "大学英语考试",
    "subcategory": "英语四级"
  },
  {
    "code": "02010002",
    "name": "四级高频词汇",
    "description": "四级考试高频出现词汇",
    "total_word_num": 2000,
    "category": "大学英语考试",
    "subcategory": "英语四级"
  },

  // 大学英语考试 - 英语六级
  {
    "code": "02020001",
    "name": "大学英语六级词汇",
    "description": "CET-6考试核心词汇",
    "total_word_num": 5500,
    "category": "大学英语考试",
    "subcategory": "英语六级"
  },
  {
    "code": "02020002",
    "name": "六级核心词汇",
    "description": "六级考试重点词汇精选",
    "total_word_num": 3000,
    "category": "大学英语考试",
    "subcategory": "英语六级"
  },

  // 大学英语考试 - 专业四级
  {
    "code": "02030001",
    "name": "英语专业四级词汇",
    "description": "TEM-4考试专用词汇",
    "total_word_num": 6000,
    "category": "大学英语考试",
    "subcategory": "专业四级"
  },

  // 大学英语考试 - 专业八级
  {
    "code": "02040001",
    "name": "英语专业八级词汇",
    "description": "TEM-8考试高级词汇",
    "total_word_num": 8000,
    "category": "大学英语考试",
    "subcategory": "专业八级"
  },

  // 研究生考试 - 考研英语
  {
    "code": "03010001",
    "name": "考研英语词汇",
    "description": "研究生入学考试英语词汇",
    "total_word_num": 5500,
    "category": "研究生考试",
    "subcategory": "考研英语"
  },
  {
    "code": "03010002",
    "name": "考研英语核心词汇",
    "description": "考研英语高频核心词汇",
    "total_word_num": 3000,
    "category": "研究生考试",
    "subcategory": "考研英语"
  },

  // 研究生考试 - 考博英语
  {
    "code": "03020001",
    "name": "考博英语词汇",
    "description": "博士入学考试英语词汇",
    "total_word_num": 8000,
    "category": "研究生考试",
    "subcategory": "考博英语"
  },

  // 出国留学考试 - 托福
  {
    "code": "04010001",
    "name": "托福核心词汇",
    "description": "TOEFL考试必备词汇",
    "total_word_num": 8000,
    "category": "出国留学考试",
    "subcategory": "托福"
  },
  {
    "code": "04010002",
    "name": "托福高频词汇",
    "description": "托福考试高频词汇精选",
    "total_word_num": 4000,
    "category": "出国留学考试",
    "subcategory": "托福"
  },

  // 出国留学考试 - 雅思
  {
    "code": "04020001",
    "name": "雅思核心词汇",
    "description": "IELTS考试核心词汇",
    "total_word_num": 7000,
    "category": "出国留学考试",
    "subcategory": "雅思"
  },
  {
    "code": "04020002",
    "name": "雅思分类词汇",
    "description": "雅思考试分类主题词汇",
    "total_word_num": 5000,
    "category": "出国留学考试",
    "subcategory": "雅思"
  },

  // 出国留学考试 - GRE/GMAT/SAT
  {
    "code": "04030001",
    "name": "GRE核心词汇",
    "description": "GRE考试核心词汇",
    "total_word_num": 10000,
    "category": "出国留学考试",
    "subcategory": "GRE/GMAT/SAT"
  },
  {
    "code": "04030002",
    "name": "GMAT词汇精选",
    "description": "GMAT考试重点词汇",
    "total_word_num": 6000,
    "category": "出国留学考试",
    "subcategory": "GRE/GMAT/SAT"
  },
  {
    "code": "04030003",
    "name": "SAT词汇必备",
    "description": "SAT考试必备词汇",
    "total_word_num": 5000,
    "category": "出国留学考试",
    "subcategory": "GRE/GMAT/SAT"
  },

  // 成人继续教育 - 专升本
  {
    "code": "05010001",
    "name": "专升本英语词汇",
    "description": "专升本考试英语词汇",
    "total_word_num": 3500,
    "category": "成人继续教育",
    "subcategory": "专升本"
  },

  // 成人继续教育 - 自考
  {
    "code": "05020001",
    "name": "自考英语词汇",
    "description": "自学考试英语词汇",
    "total_word_num": 4000,
    "category": "成人继续教育",
    "subcategory": "自考"
  },

  // 成人继续教育 - PETS考试
  {
    "code": "05030001",
    "name": "PETS三级词汇",
    "description": "全国英语等级考试三级词汇",
    "total_word_num": 3000,
    "category": "成人继续教育",
    "subcategory": "PETS考试"
  },
  {
    "code": "05030002",
    "name": "PETS四级词汇",
    "description": "全国英语等级考试四级词汇",
    "total_word_num": 4500,
    "category": "成人继续教育",
    "subcategory": "PETS考试"
  },
  {
    "code": "05030003",
    "name": "PETS五级词汇",
    "description": "全国英语等级考试五级词汇",
    "total_word_num": 6000,
    "category": "成人继续教育",
    "subcategory": "PETS考试"
  },

  // 额外添加一些热门词书
  {
    "code": "99990001",
    "name": "商务英语词汇",
    "description": "商务场景常用英语词汇",
    "total_word_num": 2500,
    "category": "专业英语",
    "subcategory": "商务英语"
  },
  {
    "code": "99990002",
    "name": "旅游英语词汇",
    "description": "旅游出行必备英语词汇",
    "total_word_num": 1500,
    "category": "专业英语",
    "subcategory": "旅游英语"
  },
  {
    "code": "99990003",
    "name": "日常生活英语",
    "description": "日常生活场景英语词汇",
    "total_word_num": 2000,
    "category": "专业英语",
    "subcategory": "生活英语"
  }
]

export default LITE_WORDBOOK_DATA
