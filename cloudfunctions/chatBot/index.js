// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { message } = event

  // 这里可以对接 Coze API 或其他 AI 服务
  // 由于演示环境限制，这里返回模拟回复
  
  const replies = [
    "瓢而不语，施主自己悟吧。",
    "万物皆瓢，你这个问题也是个瓢。",
    "这个问题很有深度，建议你先摇个瓢。",
    "宗师正在打坐，请稍后再来。",
    "你说的对，但瓢是圆的。"
  ]
  
  const randomReply = replies[Math.floor(Math.random() * replies.length)]

  return {
    reply: randomReply,
    openid: wxContext.OPENID,
  }
}