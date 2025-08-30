/**
 * 真题词书数据
 * 考研英语真题高频词汇数据
 */

const EXAM_WORDBOOK_DATA = {
  // 考研英语一真题词书
  kaoyan1: [
    {
      code: "EXAM_KY1_2024",
      name: "2024年考研英语一真题词汇",
      description: "2024年考研英语一真题中的高频词汇和重点词汇",
      total_word_num: 1200,
      year: 2024,
      examType: "考研英语一",
      difficulty: "高",
      tags: ["真题", "高频", "2024"]
    },
    {
      code: "EXAM_KY1_2023",
      name: "2023年考研英语一真题词汇",
      description: "2023年考研英语一真题中的高频词汇和重点词汇",
      total_word_num: 1150,
      year: 2023,
      examType: "考研英语一",
      difficulty: "高",
      tags: ["真题", "高频", "2023"]
    },
    {
      code: "EXAM_KY1_2022",
      name: "2022年考研英语一真题词汇",
      description: "2022年考研英语一真题中的高频词汇和重点词汇",
      total_word_num: 1180,
      year: 2022,
      examType: "考研英语一",
      difficulty: "高",
      tags: ["真题", "高频", "2022"]
    },
    {
      code: "EXAM_KY1_2021",
      name: "2021年考研英语一真题词汇",
      description: "2021年考研英语一真题中的高频词汇和重点词汇",
      total_word_num: 1100,
      year: 2021,
      examType: "考研英语一",
      difficulty: "高",
      tags: ["真题", "高频", "2021"]
    },
    {
      code: "EXAM_KY1_2020",
      name: "2020年考研英语一真题词汇",
      description: "2020年考研英语一真题中的高频词汇和重点词汇",
      total_word_num: 1050,
      year: 2020,
      examType: "考研英语一",
      difficulty: "高",
      tags: ["真题", "高频", "2020"]
    },
    {
      code: "EXAM_KY1_COMPREHENSIVE",
      name: "考研英语一真题综合词汇",
      description: "2010-2024年考研英语一真题综合高频词汇",
      total_word_num: 3500,
      year: "2010-2024",
      examType: "考研英语一",
      difficulty: "高",
      tags: ["真题", "综合", "高频"],
      isRecommended: true
    }
  ],

  // 考研英语二真题词书
  kaoyan2: [
    {
      code: "EXAM_KY2_2024",
      name: "2024年考研英语二真题词汇",
      description: "2024年考研英语二真题中的高频词汇和重点词汇",
      total_word_num: 1000,
      year: 2024,
      examType: "考研英语二",
      difficulty: "中高",
      tags: ["真题", "高频", "2024"]
    },
    {
      code: "EXAM_KY2_2023",
      name: "2023年考研英语二真题词汇",
      description: "2023年考研英语二真题中的高频词汇和重点词汇",
      total_word_num: 950,
      year: 2023,
      examType: "考研英语二",
      difficulty: "中高",
      tags: ["真题", "高频", "2023"]
    },
    {
      code: "EXAM_KY2_2022",
      name: "2022年考研英语二真题词汇",
      description: "2022年考研英语二真题中的高频词汇和重点词汇",
      total_word_num: 980,
      year: 2022,
      examType: "考研英语二",
      difficulty: "中高",
      tags: ["真题", "高频", "2022"]
    },
    {
      code: "EXAM_KY2_2021",
      name: "2021年考研英语二真题词汇",
      description: "2021年考研英语二真题中的高频词汇和重点词汇",
      total_word_num: 920,
      year: 2021,
      examType: "考研英语二",
      difficulty: "中高",
      tags: ["真题", "高频", "2021"]
    },
    {
      code: "EXAM_KY2_2020",
      name: "2020年考研英语二真题词汇",
      description: "2020年考研英语二真题中的高频词汇和重点词汇",
      total_word_num: 900,
      year: 2020,
      examType: "考研英语二",
      difficulty: "中高",
      tags: ["真题", "高频", "2020"]
    },
    {
      code: "EXAM_KY2_COMPREHENSIVE",
      name: "考研英语二真题综合词汇",
      description: "2010-2024年考研英语二真题综合高频词汇",
      total_word_num: 3000,
      year: "2010-2024",
      examType: "考研英语二",
      difficulty: "中高",
      tags: ["真题", "综合", "高频"],
      isRecommended: true
    }
  ]
}

/**
 * 获取指定类型的真题词书
 * @param {string} examType 考试类型 (kaoyan1, kaoyan2)
 * @returns {Array} 词书列表
 */
function getExamWordbooks(examType) {
  return EXAM_WORDBOOK_DATA[examType] || []
}

/**
 * 根据词书代码获取词书信息
 * @param {string} code 词书代码
 * @returns {Object|null} 词书信息
 */
function getExamWordbookByCode(code) {
  for (const examType in EXAM_WORDBOOK_DATA) {
    const wordbook = EXAM_WORDBOOK_DATA[examType].find(book => book.code === code)
    if (wordbook) {
      return wordbook
    }
  }
  return null
}

/**
 * 获取推荐的真题词书
 * @param {string} examType 考试类型
 * @returns {Array} 推荐词书列表
 */
function getRecommendedExamWordbooks(examType) {
  const wordbooks = getExamWordbooks(examType)
  return wordbooks.filter(book => book.isRecommended)
}

export default EXAM_WORDBOOK_DATA
export { getExamWordbooks, getExamWordbookByCode, getRecommendedExamWordbooks }
