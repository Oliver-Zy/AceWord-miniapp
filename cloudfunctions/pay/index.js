const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const res = await cloud.cloudPay.unifiedOrder({
    "functionName": "paycallback",
    "envId": "release-o6wz5" ,
    "subMchId" : "1632461066",
    "nonceStr": event.nonceStr,
    "outTradeNo" : event.outTradeNo,
    "body" : "AceWord 会员",
    "spbillCreateIp" : "127.0.0.1",
    "totalFee" : event.totalFee,
    "tradeType": "JSAPI",
  })
  return res
}