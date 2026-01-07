Page({
    data: {
      messages: [],           // 聊天记录 [{ role: 'user'|'assistant', content: string }]
      inputValue: '',         // 输入框内容
      isLoading: false,       // 是否正在请求
      toView: ''              // 聊天区域滚动锚点
    },
  
    // 输入框内容变化
    onInput(e) {
      this.setData({
        inputValue: e.detail.value
      });
    },
  
    // 发送消息
    async sendMessage() {
      const content = this.data.inputValue.trim();
      if (!content || this.data.isLoading) return;
  
      // 防重发：设置 loading 状态
      this.setData({ isLoading: true });
  
      // 添加用户消息
      const newUserMessage = { role: 'user', content };
      const newMessages = [...this.data.messages, newUserMessage];
      this.scrollToBottom(newMessages.length - 1);
  
      // 限制历史消息数量（例如只传最近 20 条，避免超长上下文）
      const MAX_HISTORY = 6;
      const historyToSend = newMessages.slice(-MAX_HISTORY);
  
      try {
        // 调用云函数（假设云函数名为 'chatBot'）
        const res = await wx.cloud.callFunction({
          name: 'chatBot',
          data: {
            message: content,
            history: historyToSend // 仅传必要上下文
          },
          "timeout":15000
        });
  
        // 提取 Bot 回复
        let reply = res.result?.reply || '';
  
        // 算个瓢·宗师玄学兜底】
        if (!reply || reply.includes('error') || reply.includes('fail')) {
          const sassReplies = [
            '这卦象···你再不敲瓢运气要漏光了！',
            '天机显示：今日宜摸鱼，忌不敲个瓢。',
            '啧，问这问题？先给宗师上柱香再说！',
            '算了一卦——网络被瓢堵住了，重试！'
          ];
          reply = sassReplies[Math.floor(Math.random() * sassReplies.length)];
        }
  
        // 添加 Bot 消息
        const botMessage = { role: 'assistant', content: reply };
        const updatedMessages = [...newMessages, botMessage];
        this.setData({
          messages: updatedMessages,
          inputValue: '' // 清空输入框（已在发送前清？这里双重保险）
        });
        this.scrollToBottom(updatedMessages.length - 1);
  
      } catch (err) {
        console.error('[Chat Error]', err);
  
        // 🍮【网络异常玄学回复】
        const errorReplies = [
          '宗师卡在八卦阵里了，稍等…',
          '网络开小差，给你掐指一算——重试！',
          '数据流被堵住啦，再问一次？'
        ];
        const fallbackReply = errorReplies[Math.floor(Math.random() * errorReplies.length)];
  
        const updatedMessages = [...newMessages, { role: 'assistant', content: fallbackReply }];
        this.setData({ messages: updatedMessages });
        this.scrollToBottom(updatedMessages.length - 1);
  
      } finally {
        this.setData({ isLoading: false });
      }
    },
  
    // 封装滚动到底部逻辑（避免重复写 toView）
    scrollToBottom(index) {
      this.setData({
        toView: `msg-${index}`
      });
      // 可选：加个小延迟确保 DOM 渲染完成（某些机型需要）
      // setTimeout(() => this.setData({ toView: `msg-${index}` }), 50);
    }
  });