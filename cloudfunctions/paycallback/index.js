// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {

  try {
    console.log(event)

    const db = cloud.database()
    await db.collection('payInfo').add({
      data: {
        openId: event.userInfo.openId,
        totalFee: event.totalFee,
      }
    })

    // Todo: 向服务器发一条数据
    // ... 

    return { 
      errcode: 0, 
      errmsg: '支付成功', 
    }
  } catch(e) {
    console.error(e)
  }
}