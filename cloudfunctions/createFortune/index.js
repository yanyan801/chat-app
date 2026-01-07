const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { message } = event;
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('缺少问题');
  }

  const openid = context.OPENID;
  const conversation_id = 'f_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);

  // 存入数据库（状态：pending）
  await db.collection('fortunes').add({
    data: {
      conversation_id,
      status: 'pending',
      query: message.trim(),
      user_openid: openid,
      createdAt: Date.now()
    }
  });

  // 触发后台计算（不等结果！fire-and-forget）
  wx.cloud.callFunction({
    name: 'runCozeAsync',
    data: { conversation_id, message: message.trim(), openid }
  }).catch(err => console.error('后台任务触发失败:', err));

  return { conversation_id };
};