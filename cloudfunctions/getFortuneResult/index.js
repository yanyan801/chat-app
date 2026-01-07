const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { conversation_id } = event;
  if (!conversation_id) {
    return { status: 'error', reply: '无效会话' };
  }

  const res = await db.collection('fortunes')
    .where({ conversation_id })
    .limit(1)
    .get();

  if (res.data.length === 0) {
    return { status: 'not_found', reply: '会话不存在' };
  }

  return res.data[0];
};