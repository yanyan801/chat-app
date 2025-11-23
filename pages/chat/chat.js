// pages/chat/chat.js
Page({
    data: {
      messages: [],
      inputValue: '',
      isLoading: false,
      toView: ''
    },
  
    onInput(e) {
      this.setData({
        inputValue: e.detail.value
      })
    },
  
    async sendMessage() {
      const content = this.data.inputValue.trim()
      if (!content || this.data.isLoading) return
  
      // Add user message
      const newMessages = [...this.data.messages, { role: 'user', content }]
      this.setData({
        messages: newMessages,
        inputValue: '',
        isLoading: true,
        toView: `msg-${newMessages.length - 1}`
      })
  
      try {
        // Call Cloud Function
        // Note: Ensure you have deployed the 'chatBot' cloud function
        const res = await wx.cloud.callFunction({
          name: 'chatBot',
          data: {
            message: content,
            history: this.data.messages
          }
        })
  
        const reply = res.result.reply || '宗师正在闭关，请稍后再试。'
  
        // Add bot message
        const updatedMessages = [...newMessages, { role: 'assistant', content: reply }]
        this.setData({
          messages: updatedMessages,
          isLoading: false,
          toView: `msg-${updatedMessages.length - 1}`
        })
      } catch (err) {
        console.error(err)
        const updatedMessages = [...newMessages, { role: 'assistant', content: '网络开小差了，瓢了一下。' }]
        this.setData({
          messages: updatedMessages,
          isLoading: false,
          toView: `msg-${updatedMessages.length - 1}`
        })
      }
    }
  })