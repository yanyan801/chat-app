const axios = require('axios');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// === 配置区（替换成你自己的）===
const COZE_BOT_ID = '7575455433750904867';
const COZE_SERVICE_TOKEN = 'sat_qXPTfmPXLSyjxlKPLRqTrtjOQNxGUvrWw2O3QfmT8hJiPYprcGgg13ye9UHjJVS2e'; // 必须是 sat_ 开头

exports.main = async (event, context) => {
  const { conversation_id, message, openid } = event;
  let reply = '';

  try {
    // 第 1 步：发起对话
    const startRes = await axios.post(
      'https://api.coze.cn/v3/chat',
      {
        bot_id: COZE_BOT_ID,
        user_id: openid || 'user_default',
        stream: false,
        additional_messages: [{ role: 'user', content: message, content_type: 'text' }]
      },
      {
        headers: {
          Authorization: `Bearer ${COZE_SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const cozeConvId = startRes.data?.data?.conversation_id;
    if (!cozeConvId) throw new Error('未获取 Coze conversation_id');

    // 第 2 步：轮询最多 6 次（6 秒）
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const msgRes = await axios.get(
        `https://api.coze.cn/v3/chat/message/list?conversation_id=${cozeConvId}`,
        {
          headers: { Authorization: `Bearer ${COZE_SERVICE_TOKEN}` },
          timeout: 3000
        }
      );

      const messages = msgRes.data?.data || [];
      const answer = messages.find(m => m.role === 'assistant' && m.type === 'answer');
      if (answer?.content && typeof answer.content === 'string' && !answer.content.startsWith('{')) {
        reply = answer.content.trim();
        break;
      }
    }

    // 更新数据库
    await db.collection('fortunes').where({ conversation_id }).update({
        data: { status: 'completed', reply: reply || '宗师算到一半，布丁掉线了…' }
    });

  } catch (err) {
    console.error('Coze 调用失败:', err.message);
    await db.collection('fortunes').where({ conversation_id }).update({
      data: { 
        status: 'failed', 
        reply: '瓢掐指一算：网络被布丁堵住了！' 
      }
    });
  }
};