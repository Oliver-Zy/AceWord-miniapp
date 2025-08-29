/**
 * 基于新教育分类体系的Mock词书数据
 * 更专业、更系统的词书分类结构
 */

const mockWordBookData = {
  // 词书分类数据
  categories: [
    {
      categoryCode: 'k12_education',
      categoryName: '基础教育阶段 (K-12)',
      description: '小学到高中完整学习体系',
      icon: '🎓',
      priority: 1
    },
    {
      categoryCode: 'college_tests',
      categoryName: '大学英语考试',
      description: '四六级及专业英语考试',
      icon: '🏛️',
      priority: 2
    },
    {
      categoryCode: 'graduate_exams',
      categoryName: '研究生入学考试',
      description: '考研英语词汇专项',
      icon: '🎯',
      priority: 3
    },
    {
      categoryCode: 'international_tests',
      categoryName: '出国留学考试',
      description: '托福雅思GRE等国际考试',
      icon: '🌍',
      priority: 4
    },
    {
      categoryCode: 'doctoral_level',
      categoryName: '博士研究生',
      description: '考博英语高阶词汇',
      icon: '👨‍🎓',
      priority: 6
    },
    {
      categoryCode: 'adult_education',
      categoryName: '成人继续教育',
      description: '专升本自考PETS等',
      icon: '📖',
      priority: 7
    }
  ],

  // 详细词书数据
  wordBooks: {
    // 基础教育阶段
    k12_education: [
      // 小学英语
      {
        subCategory: 'elementary',
        subCategoryName: '小学英语',
        books: [
          {
            wordBookCode: 'elementary_2011',
            wordBookName: '2011小学英语大纲词汇',
            totalWordNum: 800,
            userProgressNum: 0,
            userNum: 15420,
            difficulty: 'beginner',
            isOfficial: true,
            tags: ['官方大纲', '基础必备'],
            description: '教育部2011年发布的小学英语教学大纲核心词汇',
            estimatedDays: 20,
            createTime: '2021-03-15'
          }
        ]
      },
      // 初中英语
      {
        subCategory: 'middle_school',
        subCategoryName: '初中英语',
        books: [
          {
            wordBookCode: 'middle_2011',
            wordBookName: '2011初中英语大纲词汇',
            totalWordNum: 1600,
            userProgressNum: 0,
            userNum: 28350,
            difficulty: 'elementary',
            isOfficial: true,
            tags: ['官方大纲', '中考必备'],
            description: '初中阶段必掌握的核心词汇，中考高频词汇全覆盖',
            estimatedDays: 40,
            createTime: '2021-04-10'
          },
          {
            wordBookCode: 'renjiao_789',
            wordBookName: '2019人教版初中英语系列（七、八、九年级）',
            totalWordNum: 2200,
            userProgressNum: 0,
            userNum: 45680,
            difficulty: 'elementary',
            isOfficial: true,
            tags: ['人教版', '教材同步', '热门'],
            description: '与人教版教材完全同步，按年级循序渐进',
            estimatedDays: 55,
            createTime: '2021-09-01'
          },
          {
            wordBookCode: 'middle_random_2019',
            wordBookName: '2019初中英语词汇乱序便携版',
            totalWordNum: 1800,
            userProgressNum: 0,
            userNum: 19240,
            difficulty: 'elementary',
            tags: ['乱序记忆', '便携'],
            description: '打破传统字母顺序，科学乱序排列提高记忆效率',
            estimatedDays: 45,
            createTime: '2021-06-20'
          },
          {
            wordBookCode: 'zhongkao_flash_2021',
            wordBookName: '2021中考词汇闪过',
            totalWordNum: 1500,
            userProgressNum: 0,
            userNum: 32150,
            difficulty: 'elementary',
            tags: ['中考冲刺', '高频词汇', '热门'],
            description: '中考高频词汇精选，短期冲刺必备',
            estimatedDays: 30,
            createTime: '2021-01-15'
          },
          {
            wordBookCode: 'zhongkao_flash_2023',
            wordBookName: '2023中考英语词汇闪过',
            totalWordNum: 1650,
            userProgressNum: 0,
            userNum: 28900,
            difficulty: 'elementary',
            tags: ['最新版本', '中考冲刺', '新书'],
            description: '2023年最新版本，紧跟中考命题趋势',
            estimatedDays: 35,
            createTime: '2023-02-01'
          }
        ]
      },
      // 高中英语
      {
        subCategory: 'high_school',
        subCategoryName: '高中英语',
        books: [
          {
            wordBookCode: 'gaokao_100_sentences',
            wordBookName: '100个句子记完3500个高考单词',
            totalWordNum: 3500,
            userProgressNum: 0,
            userNum: 89420,
            difficulty: 'intermediate',
            tags: ['句子记忆', '高考必备', '热门'],
            description: '通过100个精选句子，高效记忆高考核心词汇',
            estimatedDays: 70,
            createTime: '2020-08-15'
          },
          {
            wordBookCode: 'xinghuo_gaokao_2022',
            wordBookName: '2022星火英语高考词汇随身记',
            totalWordNum: 3800,
            userProgressNum: 0,
            userNum: 67350,
            difficulty: 'intermediate',
            tags: ['星火英语', '便携版'],
            description: '星火英语权威出品，便携设计随时随地背单词',
            estimatedDays: 76,
            createTime: '2022-03-01'
          },
          {
            wordBookCode: 'xinghuo_gaokao_qiaoji_2022',
            wordBookName: '2022星火高考英语词汇巧记速记',
            totalWordNum: 3600,
            userProgressNum: 0,
            userNum: 54280,
            difficulty: 'intermediate',
            tags: ['巧记方法', '速记技巧'],
            description: '独特记忆方法，让背单词变得简单有趣',
            estimatedDays: 72,
            createTime: '2022-04-10'
          },
          {
            wordBookCode: 'gaokao_flash_2022',
            wordBookName: '2022高考词汇闪过',
            totalWordNum: 3400,
            userProgressNum: 0,
            userNum: 76890,
            difficulty: 'intermediate',
            tags: ['高考冲刺', '高频词汇', '热门'],
            description: '高考高频词汇精选，冲刺阶段必备神器',
            estimatedDays: 68,
            createTime: '2022-01-20'
          },
          {
            wordBookCode: 'xinghuo_gaokao_luanxu_2023',
            wordBookName: '2023星火高考英语词汇必背乱序版',
            totalWordNum: 3700,
            userProgressNum: 0,
            userNum: 45620,
            difficulty: 'intermediate',
            tags: ['最新版本', '乱序记忆', '新书'],
            description: '2023年最新版本，科学乱序排列提高记忆效率',
            estimatedDays: 74,
            createTime: '2023-03-15'
          },
          {
            wordBookCode: 'yilin_xuanxiu',
            wordBookName: '译林版高中英语选修系列',
            totalWordNum: 2800,
            userProgressNum: 0,
            userNum: 23450,
            difficulty: 'intermediate',
            tags: ['译林版', '教材同步'],
            description: '与译林版高中英语选修教材完全同步',
            estimatedDays: 56,
            createTime: '2021-09-10'
          }
        ]
      }
    ],

    // 大学英语考试
    college_tests: [
      // 英语四级
      {
        subCategory: 'cet4',
        subCategoryName: '英语四级',
        books: [
          {
            wordBookCode: 'xinghuo_cet4_2017',
            wordBookName: '2017星火四级词汇必背乱序版',
            totalWordNum: 4500,
            userProgressNum: 0,
            userNum: 156780,
            difficulty: 'intermediate',
            tags: ['星火英语', '乱序记忆', '热门'],
            description: '星火英语经典四级词汇书，乱序排列科学记忆',
            estimatedDays: 90,
            createTime: '2017-06-01'
          },
          {
            wordBookCode: 'pass_cet4_2021',
            wordBookName: '2021PASS四级词汇乱序版',
            totalWordNum: 4200,
            userProgressNum: 0,
            userNum: 89340,
            difficulty: 'intermediate',
            tags: ['PASS系列', '乱序记忆'],
            description: 'PASS系列经典之作，四级词汇全覆盖',
            estimatedDays: 84,
            createTime: '2021-02-15'
          },
          {
            wordBookCode: 'cet4_flash_2021',
            wordBookName: '2021四级词汇闪过',
            totalWordNum: 4000,
            userProgressNum: 0,
            userNum: 134560,
            difficulty: 'intermediate',
            tags: ['闪过系列', '高频词汇', '热门'],
            description: '四级高频词汇精选，短期突破必备',
            estimatedDays: 80,
            createTime: '2021-01-10'
          },
          {
            wordBookCode: 'gaobai_cet4_2022',
            wordBookName: '2022告白单词四级词汇',
            totalWordNum: 4300,
            userProgressNum: 0,
            userNum: 67890,
            difficulty: 'intermediate',
            tags: ['告白单词', '趣味记忆'],
            description: '用有趣的方式记单词，让学习变得轻松愉快',
            estimatedDays: 86,
            createTime: '2022-05-01'
          },
          {
            wordBookCode: 'huangpishu_cet4',
            wordBookName: '黄皮书四级大纲词汇背诵词典',
            totalWordNum: 4600,
            userProgressNum: 0,
            userNum: 98760,
            difficulty: 'intermediate',
            tags: ['黄皮书', '官方大纲', '权威'],
            description: '严格按照四级考试大纲编写，权威可靠',
            estimatedDays: 92,
            createTime: '2020-09-01'
          }
        ]
      },
      // 英语六级
      {
        subCategory: 'cet6',
        subCategoryName: '英语六级',
        books: [
          {
            wordBookCode: 'xinghuo_cet6_2018',
            wordBookName: '2018星火六级巧记速记',
            totalWordNum: 5500,
            userProgressNum: 0,
            userNum: 78940,
            difficulty: 'upper_intermediate',
            tags: ['星火英语', '巧记方法'],
            description: '独特记忆技巧，让六级词汇记忆更高效',
            estimatedDays: 110,
            createTime: '2018-08-15'
          },
          {
            wordBookCode: 'cet6_flash_2019',
            wordBookName: '2019六级词汇闪过乱序版',
            totalWordNum: 5200,
            userProgressNum: 0,
            userNum: 89650,
            difficulty: 'upper_intermediate',
            tags: ['闪过系列', '乱序记忆', '热门'],
            description: '六级高频词汇乱序排列，科学高效',
            estimatedDays: 104,
            createTime: '2019-03-20'
          },
          {
            wordBookCode: 'gaobai_cet6_2022',
            wordBookName: '2022告白单词六级词汇',
            totalWordNum: 5400,
            userProgressNum: 0,
            userNum: 56780,
            difficulty: 'upper_intermediate',
            tags: ['告白单词', '趣味记忆'],
            description: '趣味记忆法，让六级词汇不再枯燥',
            estimatedDays: 108,
            createTime: '2022-06-01'
          },
          {
            wordBookCode: 'huangpishu_cet6',
            wordBookName: '黄皮书六级大纲词汇背诵宝典',
            totalWordNum: 5800,
            userProgressNum: 0,
            userNum: 67340,
            difficulty: 'upper_intermediate',
            tags: ['黄皮书', '官方大纲', '权威'],
            description: '六级考试官方大纲词汇，权威全面',
            estimatedDays: 116,
            createTime: '2020-10-15'
          }
        ]
      },
      // 专业英语
      {
        subCategory: 'specialized',
        subCategoryName: '专业英语',
        books: [
          {
            wordBookCode: 'xinghuo_tem4_2014',
            wordBookName: '2014星火专四词汇必背乱序版',
            totalWordNum: 6000,
            userProgressNum: 0,
            userNum: 34560,
            difficulty: 'upper_intermediate',
            tags: ['专四考试', '乱序记忆'],
            description: '专业四级考试词汇全覆盖，乱序科学记忆',
            estimatedDays: 120,
            createTime: '2014-09-01'
          },
          {
            wordBookCode: 'xinghuo_tem8_2014',
            wordBookName: '2014星火全新专8词汇必背',
            totalWordNum: 8000,
            userProgressNum: 0,
            userNum: 23450,
            difficulty: 'advanced',
            tags: ['专八考试', '高阶词汇'],
            description: '专业八级考试高阶词汇，英语专业必备',
            estimatedDays: 160,
            createTime: '2014-10-15'
          }
        ]
      }
    ],

    // 研究生入学考试
    graduate_exams: [
      {
        subCategory: 'kaoyan',
        subCategoryName: '考研英语',
        books: [
          {
            wordBookCode: 'kaoyan_100_sentences',
            wordBookName: '100个句子记完5500个考研单词系列',
            totalWordNum: 5500,
            userProgressNum: 0,
            userNum: 198760,
            difficulty: 'upper_intermediate',
            tags: ['句子记忆', '考研必备', '热门'],
            description: '通过100个精选句子，高效掌握考研核心词汇',
            estimatedDays: 110,
            createTime: '2019-07-01'
          },
          {
            wordBookCode: 'kaoyan_dagang_2018',
            wordBookName: '2018考研英语大纲词汇5500',
            totalWordNum: 5500,
            userProgressNum: 0,
            userNum: 145680,
            difficulty: 'upper_intermediate',
            tags: ['官方大纲', '权威'],
            description: '严格按照考研英语大纲编写，权威可靠',
            estimatedDays: 110,
            createTime: '2018-05-15'
          },
          {
            wordBookCode: 'lianlian_youci_2023',
            wordBookName: '2023恋练有词考研英语词汇',
            totalWordNum: 5800,
            userProgressNum: 0,
            userNum: 234590,
            difficulty: 'upper_intermediate',
            tags: ['恋练有词', '朱伟老师', '热门'],
            description: '朱伟老师经典之作，考研词汇学习首选',
            estimatedDays: 116,
            createTime: '2023-01-20'
          },
          {
            wordBookCode: 'shitian_kaoyan_2023',
            wordBookName: '2023十天搞定考研词汇系列',
            totalWordNum: 5200,
            userProgressNum: 0,
            userNum: 89340,
            difficulty: 'upper_intermediate',
            tags: ['速成系列', '短期突破'],
            description: '十天高效突破考研词汇，短期冲刺必备',
            estimatedDays: 10,
            createTime: '2023-04-01'
          },
          {
            wordBookCode: 'momo_kaoyan_2023',
            wordBookName: '2023墨墨考研深度记忆宝典',
            totalWordNum: 5600,
            userProgressNum: 0,
            userNum: 67890,
            difficulty: 'upper_intermediate',
            tags: ['墨墨背单词', '深度记忆'],
            description: '墨墨背单词官方考研词汇，科学记忆算法',
            estimatedDays: 112,
            createTime: '2023-02-15'
          }
        ]
      }
    ],

    // 出国留学考试
    international_tests: [
      // 托福
      {
        subCategory: 'toefl',
        subCategoryName: '托福',
        books: [
          {
            wordBookCode: 'toefl_100_sentences',
            wordBookName: '100个句子记完7000个托福单词',
            totalWordNum: 7000,
            userProgressNum: 0,
            userNum: 89760,
            difficulty: 'advanced',
            tags: ['句子记忆', '托福必备', '热门'],
            description: '通过100个句子高效记忆托福核心词汇',
            estimatedDays: 140,
            createTime: '2020-03-01'
          },
          {
            wordBookCode: 'toefl_570_words',
            wordBookName: '570个单词轻松征服托福',
            totalWordNum: 570,
            userProgressNum: 0,
            userNum: 34560,
            difficulty: 'advanced',
            tags: ['精选词汇', '高效学习'],
            description: '精选570个托福高频核心词汇',
            estimatedDays: 12,
            createTime: '2021-05-10'
          },
          {
            wordBookCode: 'toefl_7days',
            wordBookName: '7天搞定托福高频核心词',
            totalWordNum: 2800,
            userProgressNum: 0,
            userNum: 56780,
            difficulty: 'advanced',
            tags: ['速成系列', '高频词汇'],
            description: '7天快速掌握托福考试高频词汇',
            estimatedDays: 7,
            createTime: '2022-01-15'
          },
          {
            wordBookCode: 'bmc_toefl',
            wordBookName: 'BMC-托福必备词汇',
            totalWordNum: 6500,
            userProgressNum: 0,
            userNum: 45680,
            difficulty: 'advanced',
            tags: ['BMC系列', '权威教材'],
            description: 'BMC权威出品，托福考试必备词汇全覆盖',
            estimatedDays: 130,
            createTime: '2021-08-20'
          }
        ]
      },
      // 雅思
      {
        subCategory: 'ielts',
        subCategoryName: '雅思',
        books: [
          {
            wordBookCode: 'ielts_100_sentences',
            wordBookName: '100个句子记完7000个雅思单词',
            totalWordNum: 7000,
            userProgressNum: 0,
            userNum: 123450,
            difficulty: 'advanced',
            tags: ['句子记忆', '雅思必备', '热门'],
            description: '通过100个句子高效记忆雅思核心词汇',
            estimatedDays: 140,
            createTime: '2020-04-15'
          },
          {
            wordBookCode: 'ielts_2012_enhanced',
            wordBookName: '2012雅思词汇加强版',
            totalWordNum: 6800,
            userProgressNum: 0,
            userNum: 78940,
            difficulty: 'advanced',
            tags: ['经典版本', '全面覆盖'],
            description: '雅思词汇经典教材，全面覆盖考试词汇',
            estimatedDays: 136,
            createTime: '2012-09-01'
          },
          {
            wordBookCode: 'ielts_2018_random',
            wordBookName: '2018雅思词汇乱序版',
            totalWordNum: 6500,
            userProgressNum: 0,
            userNum: 89650,
            difficulty: 'advanced',
            tags: ['乱序记忆', '科学排列'],
            description: '科学乱序排列，提高雅思词汇记忆效率',
            estimatedDays: 130,
            createTime: '2018-06-20'
          },
          {
            wordBookCode: 'yaquan_ielts_2',
            wordBookName: '鸭圈雅思核心词2.0',
            totalWordNum: 5800,
            userProgressNum: 0,
            userNum: 67340,
            difficulty: 'advanced',
            tags: ['鸭圈出品', '核心词汇', '新书'],
            description: '鸭圈2.0版本，雅思核心词汇精选',
            estimatedDays: 116,
            createTime: '2023-03-01'
          }
        ]
      },
      // GRE/GMAT/SAT
      {
        subCategory: 'gre_gmat_sat',
        subCategoryName: 'GRE/GMAT/SAT',
        books: [
          {
            wordBookCode: 'gre_17days',
            wordBookName: '17天搞定GRE单词',
            totalWordNum: 8000,
            userProgressNum: 0,
            userNum: 45680,
            difficulty: 'advanced',
            tags: ['GRE考试', '速成系列'],
            description: '17天高效突破GRE词汇难关',
            estimatedDays: 17,
            createTime: '2021-11-01'
          },
          {
            wordBookCode: 'bmc_sat_core',
            wordBookName: 'BMC-SAT核心单词系列',
            totalWordNum: 3500,
            userProgressNum: 0,
            userNum: 23450,
            difficulty: 'advanced',
            tags: ['SAT考试', 'BMC系列'],
            description: 'BMC权威出品，SAT考试核心词汇',
            estimatedDays: 70,
            createTime: '2022-02-15'
          }
        ]
      },
      // 剑桥英语
      {
        subCategory: 'cambridge',
        subCategoryName: '剑桥英语',
        books: [
          {
            wordBookCode: 'ket_14days',
            wordBookName: '14天攻克KET核心词汇',
            totalWordNum: 1500,
            userProgressNum: 0,
            userNum: 34560,
            difficulty: 'elementary',
            tags: ['KET考试', '速成系列'],
            description: '14天快速掌握KET考试核心词汇',
            estimatedDays: 14,
            createTime: '2022-05-01'
          },
          {
            wordBookCode: 'pet_21days',
            wordBookName: '21天攻克PET核心词汇',
            totalWordNum: 2500,
            userProgressNum: 0,
            userNum: 28940,
            difficulty: 'intermediate',
            tags: ['PET考试', '速成系列'],
            description: '21天系统掌握PET考试核心词汇',
            estimatedDays: 21,
            createTime: '2022-06-15'
          },
          {
            wordBookCode: 'fce_core',
            wordBookName: 'FCE核心词 巧记速练',
            totalWordNum: 4000,
            userProgressNum: 0,
            userNum: 19870,
            difficulty: 'upper_intermediate',
            tags: ['FCE考试', '巧记方法'],
            description: 'FCE考试核心词汇，巧记方法快速掌握',
            estimatedDays: 80,
            createTime: '2022-08-01'
          }
        ]
      }
    ],

    // 博士研究生
    doctoral_level: [
      {
        subCategory: 'doctoral_exam',
        subCategoryName: '考博英语',
        books: [
          {
            wordBookCode: 'kaobo_33days_2020',
            wordBookName: '2020考博核心词汇33天速记手册',
            totalWordNum: 8500,
            userProgressNum: 0,
            userNum: 12340,
            difficulty: 'advanced',
            tags: ['考博考试', '高阶词汇'],
            description: '33天系统掌握考博英语核心词汇',
            estimatedDays: 33,
            createTime: '2020-01-15'
          },
          {
            wordBookCode: 'kaobo_10000_2021',
            wordBookName: '2021考博词汇10000例精解',
            totalWordNum: 10000,
            userProgressNum: 0,
            userNum: 8760,
            difficulty: 'advanced',
            tags: ['考博考试', '词汇精解'],
            description: '10000个考博词汇详细解析，深度学习',
            estimatedDays: 200,
            createTime: '2021-03-01'
          },
          {
            wordBookCode: 'huahui_kaobo_10000',
            wordBookName: '华慧考博英语10000词汇速记手册',
            totalWordNum: 10000,
            userProgressNum: 0,
            userNum: 9870,
            difficulty: 'advanced',
            tags: ['华慧教育', '速记手册'],
            description: '华慧教育权威出品，考博词汇速记手册',
            estimatedDays: 200,
            createTime: '2021-07-20'
          }
        ]
      }
    ],

    // 成人继续教育
    adult_education: [
      // 专升本
      {
        subCategory: 'zhuanshengben',
        subCategoryName: '专升本',
        books: [
          {
            wordBookCode: 'zsb_core_2022',
            wordBookName: '2022年专升本英语核心词汇',
            totalWordNum: 3200,
            userProgressNum: 0,
            userNum: 45680,
            difficulty: 'intermediate',
            tags: ['专升本', '核心词汇'],
            description: '专升本英语考试核心词汇全覆盖',
            estimatedDays: 64,
            createTime: '2022-01-10'
          },
          {
            wordBookCode: 'zsb_40days',
            wordBookName: '专升本英语词汇40天一本通',
            totalWordNum: 3000,
            userProgressNum: 0,
            userNum: 34560,
            difficulty: 'intermediate',
            tags: ['专升本', '系统学习'],
            description: '40天系统掌握专升本英语词汇',
            estimatedDays: 40,
            createTime: '2021-09-15'
          },
          {
            wordBookCode: 'zsb_classified',
            wordBookName: '专升本高频词汇分类速记',
            totalWordNum: 2800,
            userProgressNum: 0,
            userNum: 28940,
            difficulty: 'intermediate',
            tags: ['专升本', '分类记忆'],
            description: '按主题分类，高频词汇快速记忆',
            estimatedDays: 56,
            createTime: '2022-03-20'
          }
        ]
      },
      // 自考
      {
        subCategory: 'zikao',
        subCategoryName: '自考',
        books: [
          {
            wordBookCode: 'zikao_english2',
            wordBookName: '一本书搞定自考英语（二）单词分册',
            totalWordNum: 4200,
            userProgressNum: 0,
            userNum: 23450,
            difficulty: 'intermediate',
            tags: ['自考', '英语二'],
            description: '自考英语（二）单词全覆盖，一本搞定',
            estimatedDays: 84,
            createTime: '2021-05-01'
          }
        ]
      },
      // PETS考试
      {
        subCategory: 'pets',
        subCategoryName: 'PETS考试',
        books: [
          {
            wordBookCode: 'pets_345_2022',
            wordBookName: '2022 PETS第三、四、五级教材',
            totalWordNum: 5500,
            userProgressNum: 0,
            userNum: 19870,
            difficulty: 'intermediate',
            tags: ['PETS考试', '官方教材'],
            description: 'PETS三四五级官方教材词汇',
            estimatedDays: 110,
            createTime: '2022-04-01'
          },
          {
            wordBookCode: 'pets_1b_standard',
            wordBookName: 'PETS一级B标准教程',
            totalWordNum: 2000,
            userProgressNum: 0,
            userNum: 15680,
            difficulty: 'elementary',
            tags: ['PETS考试', '标准教程'],
            description: 'PETS一级B标准教程配套词汇',
            estimatedDays: 40,
            createTime: '2021-11-15'
          }
        ]
      }
    ]
  }
}

module.exports = mockWordBookData
