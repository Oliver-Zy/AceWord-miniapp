// config.js
const config = {
  // 域名前缀 
  // api_base_url: 'http://10.64.101.163:6222/3.1',
  api_base_url: 'https://api.aceword.xyz/3.1',  
  cdn_base_url: 'https://cdn.uuorb.com/a4',
 
  // 我的页面选项     
  cellInfo_1: [{
      imgName: "wordgroup",
      imgNameDark: "wordgroup-dark",
      text: "我的单词本",
    },
    {
      imgName: "radio",
      imgNameDark: "radio-dark",
      text: "单词随声听",
    },
    {
      imgName: "delete",
      imgNameDark: "delete-dark",
      text: "已删除卡片",
    },
    {
      imgName: "sentence",
      imgNameDark: "sentence-dark",
      text: "历史句子",
    },
  ],
  cellInfo_2: [{
      imgName: "wordbook",
      imgNameDark: "wordbook-dark",
      text: "词书设置",
    },
    {
      imgName: "settings",
      imgNameDark: "settings-dark",
      text: "偏好设置",
    },
    {
      imgName: "notif",
      imgNameDark: "notif-dark",
      text: "订阅复习提醒",
    },
  ],
  cellInfo_3: [{
      imgName: "guide",
      imgNameDark: "guide-dark",
      text: "用户手册",
    },
    {
      imgName: "feedback",
      imgNameDark: "feedback-dark",
      text: "反馈与建议",
    },
    {
      imgName: "share",
      imgNameDark: "share-dark",
      text: "分享给好友",
    },
  ],
}

export {
  config
}