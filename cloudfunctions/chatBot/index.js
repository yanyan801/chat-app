// ====== 云函数主逻辑 ======
const axios = require('axios');

// ====== 配置区 ======
// const COZE_BOT_ID = process.env.COZE_BOT_ID || '7575455433750904867';
// const COZE_SERVICE_TOKEN = process.env.COZE_SERVICE_TOKEN || 'sat_qXPTfmPXLSyjxlKPLRqTrtjOQNxGUvrWw2O3QfmT8hJiPYprcGgg13ye9UHjJVS2';

const COZE_BOT_ID = process.env.COZE_BOT_ID
const COZE_SERVICE_TOKEN = process.env.COZE_SERVICE_TOKEN

const cozeHost = 'https://api.coze.cn/v3/';

// === 工具函数：安全提取主回复 ===
function extractMainAnswer(messages) {
    // 检查是否存在 verbose 消息
    const hasVerbose = messages.some(
        m => m.role === 'assistant' && m.type === 'verbose'
    );

    // 筛出所有 answer 消息
    const answers = messages.filter(
        m => m.role === 'assistant' && m.type === 'answer' && m.content
    );

    if (answers.length === 0) return '';

    if (hasVerbose) {
        // 有 verbose → 取 updated_at 最大的 answer
        return answers.reduce((prev, curr) =>
            curr.updated_at > prev.updated_at ? curr : prev
        ).content.trim();
    } else {
        return null;
    }
}

// === 云函数主逻辑 ===
exports.main = async (event, context) => {
    const { message } = event;
    if (!message || typeof message !== 'string' || !message.trim()) {
        return { reply: '宗师说：问题呢？布丁都等饿了！' };
    }

    const userQuery = message.trim();
    const chatArg = {
        bot_id: COZE_BOT_ID,
        user_id: context.OPENID || 'user_default',
        stream: false,
        additional_messages: [{
            role: 'user',
            content: userQuery,
            content_type: 'text'
        }]
    }
    const chatHeader = {
        Authorization: `Bearer ${COZE_SERVICE_TOKEN}`,
        'Content-Type': 'application/json'
    }
    try {
        // === 第一步：发起对话 ===
        const chatRes = await axios.post(
            cozeHost + 'chat',
            chatArg,
            {
                headers: chatHeader,
                timeout: 6000 // 缩短到 6 秒
            }
        );
        // console.log('===chatArg===', JSON.stringify(chatArg, null, 2));
        // console.log('===chatHeader===', JSON.stringify(chatHeader, null, 2));
        console.log('===chatStatus===', chatRes.status);
        console.log('===chat code===', chatRes.code);
        console.log('===chat msg===', chatRes.msg);
        console.log('===chat data===', chatRes.data);

        console.log("===env===" + JSON.stringify(process.env, null, 2));

        const conversationId = chatRes.data?.data?.conversation_id;
        const chatId = chatRes.data?.data?.id;

        if (!conversationId || !chatId) {
            throw new Error('未返回 conversation_id、chatId');
        }

        // === 第二步：轮询消息列表 ===
        let reply = '';
        let attempts = 0;
        const maxAttempts = 10; // 最多 6 次 × 800ms = ~4.8 秒

        let emptyRetryTimes = 0; //返回结果为空时，重试次数
        const emptyRetryMaxTimes = 3; // 最多 3 次 

        while (attempts < maxAttempts && emptyRetryTimes < emptyRetryMaxTimes) {
            await new Promise(r => setTimeout(r, 1000)); // 缩短间隔
            attempts++;
            const messageListRes = await axios.get(
                cozeHost + `chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`,
                {
                    headers: {
                        Authorization: `Bearer ${COZE_SERVICE_TOKEN}`
                    },
                    timeout: 8000
                }
            );
            const messageListData = messageListRes.data?.data || [];
            console.log('===list rest===', JSON.stringify(messageListData, null, 2));

            // === 智能提取主回复 ===
            reply = extractMainAnswer(messageListData);

            // 不符合解析内容时，重新请求
            if (reply === null) {
                emptyRetryTimes++;
            } else {
                return {
                    reply: reply || '布丁被玄学封印了，稍后再问！'
                };
            }
        }
    } catch (error) {
        // === 安全错误日志（绝不 stringify error）===
        let errorMsg = 'Unknown';
        try { errorMsg = error.message || String(error); } catch (e) { errorMsg = '[Error inaccessible]'; }

        console.error('【Coze API 异常】', {
            message: errorMsg,
            code: error.code,
            url: error.config?.url,
            status: error.response?.status
        });

        // === 玄学兜底 ===
        const fallbacks = [
            '瓢掐指：网络被无形的力量堵住了！',
            '宗师正在吃打坐，稍等再问～',
            '八卦阵信号弱，重试一下！'
        ];
        return { reply: fallbacks[Math.floor(Math.random() * fallbacks.length)] };
    }
};