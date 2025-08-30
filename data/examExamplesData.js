/**
 * 真题例句数据示例
 * 用于dic-card组件显示真题例句
 */

// 示例：如何在wordInfo中添加examExamples数据
const SAMPLE_WORD_INFO_WITH_EXAM_EXAMPLES = {
  word: "artificial",
  wordCN: "adj. 人工的，人造的",
  shortDef: "人工制造的，非天然的",
  defList: [
    {
      prs: "adj",
      english: "Made or produced by human beings rather than occurring naturally",
      chinese: "人工制造的，非天然的"
    }
  ],
  exampleList: [
    {
      english: "The flowers are artificial, not real.",
      chinese: "这些花是人造的，不是真的。"
    }
  ],
  // 新增：真题例句数据
  examExamples: [
    {
      year: 2024,
      english: "Artificial intelligence has revolutionized the way we approach complex problem-solving in various fields.",
      chinese: "人工智能已经彻底改变了我们在各个领域解决复杂问题的方式。"
    },
    {
      year: 2023,
      english: "The artificial nature of these materials makes them more durable than their natural counterparts.",
      chinese: "这些材料的人工特性使它们比天然材料更加耐用。"
    },
    {
      year: 2022,
      english: "Scientists are developing artificial organs that could save thousands of lives.",
      chinese: "科学家们正在开发可以拯救数千生命的人工器官。"
    },
    {
      year: 2021,
      english: "The artificial lighting in the laboratory was carefully calibrated for optimal conditions.",
      chinese: "实验室中的人工照明经过精心校准以达到最佳条件。"
    }
  ]
}

// 更多单词的真题例句数据 - 扩展版本（考研真题例句）
const EXAM_EXAMPLES_DATABASE = {
  "artificial": [
    {
      year: 2024,
      english: "The <strong>artificial</strong> sweeteners in diet sodas have been linked to various health concerns.",
      chinese: "无糖汽水中的人工甜味剂与各种健康问题有关。"
    },
    {
      year: 2023,
      english: "Scientists are developing <strong>artificial</strong> organs that could save thousands of lives.",
      chinese: "科学家们正在开发可以拯救数千生命的人工器官。"
    },
    {
      year: 2022,
      english: "The museum's <strong>artificial</strong> lighting was carefully designed to protect ancient artifacts.",
      chinese: "博物馆的人工照明经过精心设计，以保护古代文物。"
    }
  ],
  "intelligence": [
    {
      year: 2024,
      english: "Machine <strong>intelligence</strong> continues to advance at an unprecedented pace in modern technology.",
      chinese: "机器智能在现代技术中继续以前所未有的速度发展。"
    },
    {
      year: 2023,
      english: "Human <strong>intelligence</strong> remains irreplaceable despite technological advances.",
      chinese: "尽管技术进步，人类智能仍然是不可替代的。"
    },
    {
      year: 2021,
      english: "Emotional <strong>intelligence</strong> plays a crucial role in effective leadership and team management.",
      chinese: "情商在有效领导和团队管理中起着至关重要的作用。"
    }
  ],
  "sustainable": [
    {
      year: 2024,
      english: "<strong>Sustainable</strong> development requires balancing economic growth with environmental protection.",
      chinese: "可持续发展需要在经济增长和环境保护之间取得平衡。"
    },
    {
      year: 2023,
      english: "Companies are increasingly adopting <strong>sustainable</strong> practices to reduce their carbon footprint.",
      chinese: "公司越来越多地采用可持续做法来减少碳足迹。"
    },
    {
      year: 2022,
      english: "The transition to <strong>sustainable</strong> energy sources is essential for combating climate change.",
      chinese: "向可持续能源的转型对于应对气候变化至关重要。"
    }
  ],
  "innovation": [
    {
      year: 2024,
      english: "<strong>Innovation</strong> in renewable energy technology is crucial for addressing climate change.",
      chinese: "可再生能源技术的创新对于应对气候变化至关重要。"
    },
    {
      year: 2023,
      english: "The company's commitment to <strong>innovation</strong> has led to breakthrough discoveries.",
      chinese: "公司对创新的承诺导致了突破性发现。"
    },
    {
      year: 2021,
      english: "Digital <strong>innovation</strong> has transformed the way businesses operate in the modern economy.",
      chinese: "数字创新已经改变了企业在现代经济中的运营方式。"
    }
  ],
  "technology": [
    {
      year: 2024,
      english: "Emerging <strong>technology</strong> trends are reshaping industries across the global economy.",
      chinese: "新兴技术趋势正在重塑全球经济中的各个行业。"
    },
    {
      year: 2023,
      english: "The integration of <strong>technology</strong> in education has enhanced learning experiences for students.",
      chinese: "技术在教育中的整合增强了学生的学习体验。"
    },
    {
      year: 2022,
      english: "Advanced <strong>technology</strong> solutions are helping companies optimize their operational efficiency.",
      chinese: "先进的技术解决方案正在帮助公司优化运营效率。"
    }
  ],
  "environment": [
    {
      year: 2024,
      english: "Protecting the <strong>environment</strong> requires collective action from governments and individuals alike.",
      chinese: "保护环境需要政府和个人的共同行动。"
    },
    {
      year: 2023,
      english: "The business <strong>environment</strong> has become increasingly competitive in recent years.",
      chinese: "近年来商业环境变得越来越具有竞争性。"
    }
  ],
  "economy": [
    {
      year: 2024,
      english: "The global <strong>economy</strong> faces unprecedented challenges in the post-pandemic era.",
      chinese: "全球经济在后疫情时代面临前所未有的挑战。"
    },
    {
      year: 2023,
      english: "Digital transformation is driving significant changes in the modern <strong>economy</strong>.",
      chinese: "数字化转型正在推动现代经济的重大变革。"
    }
  ],
  "society": [
    {
      year: 2024,
      english: "Modern <strong>society</strong> increasingly relies on digital platforms for communication and commerce.",
      chinese: "现代社会越来越依赖数字平台进行交流和商务。"
    },
    {
      year: 2022,
      english: "The role of education in shaping <strong>society</strong> cannot be underestimated.",
      chinese: "教育在塑造社会中的作用不容低估。"
    }
  ]
}

// 通用真题例句生成器 - 为没有特定数据的单词生成通用例句
const GENERIC_EXAM_EXAMPLES = [
  {
    year: 2024,
    english: "The concept of WORD_PLACEHOLDER is fundamental to understanding modern academic discourse.",
    chinese: "这一概念是理解现代学术话语的基础。"
  },
  {
    year: 2023,
    english: "Recent studies have shown that WORD_PLACEHOLDER plays a crucial role in various contexts.",
    chinese: "近期研究表明，该词汇在各种语境中起着至关重要的作用。"
  },
  {
    year: 2022,
    english: "The significance of WORD_PLACEHOLDER cannot be underestimated in contemporary analysis.",
    chinese: "在当代分析中，其重要性不容低估。"
  }
]

/**
 * 获取单词的真题例句
 * @param {string} word 单词
 * @returns {Array} 真题例句数组
 */
function getExamExamples(word) {
  if (!word) return []
  
  const wordLower = word.toLowerCase()
  
  // 如果有特定的真题例句，返回特定例句
  if (EXAM_EXAMPLES_DATABASE[wordLower]) {
    return EXAM_EXAMPLES_DATABASE[wordLower]
  }
  
  // 否则返回通用例句，只在英文中替换并加粗单词，中文保持原样
  return GENERIC_EXAM_EXAMPLES.map(example => ({
    ...example,
    english: example.english.replace('WORD_PLACEHOLDER', `<strong>${word}</strong>`),
    chinese: example.chinese
  }))
}

/**
 * 为wordInfo添加真题例句数据
 * @param {Object} wordInfo 原始单词信息
 * @returns {Object} 包含真题例句的单词信息
 */
function addExamExamplesToWordInfo(wordInfo) {
  if (!wordInfo || !wordInfo.word) {
    return wordInfo
  }
  
  const examExamples = getExamExamples(wordInfo.word)
  
  return {
    ...wordInfo,
    examExamples: examExamples
  }
}

module.exports = {
  SAMPLE_WORD_INFO_WITH_EXAM_EXAMPLES,
  EXAM_EXAMPLES_DATABASE,
  getExamExamples,
  addExamExamplesToWordInfo
}
