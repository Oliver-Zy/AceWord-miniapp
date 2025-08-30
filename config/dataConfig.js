/**
 * 数据配置文件
 * 用于配置词书数据加载模式
 */

const DATA_CONFIG = {
  // 词书数据配置
  WORDBOOK_DATA: {
    // 数据源说明
    source: 'liteWordbookData.js',
    note: '开发预览使用精简版数据，生产环境从数据库获取完整数据'
  },

  // 开发模式配置
  DEV_MODE: {
    // 是否显示加载日志
    showModeLog: true,
    
    // 是否在控制台显示数据统计
    showDataStats: true,
    
    // 是否显示调试信息
    showDebugInfo: false
  },

  // 性能配置
  PERFORMANCE: {
    // 数据加载超时时间（毫秒）
    loadTimeout: 5000,
    
    // 是否启用数据缓存
    enableCache: true,
    
    // 缓存过期时间（毫秒）
    cacheExpiry: 30 * 60 * 1000 // 30分钟
  }
}

export default DATA_CONFIG
