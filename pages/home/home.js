// pages/home/home.js
Page({
    data: {
      recommendations: [
        { id: 1, title: '今日运势：大吉', content: '宜：写代码，忌：部署周五', icon: '☀️' },
        { id: 2, title: '宗师语录：瓢而不语', content: '瓢之一字，在于随波逐流而不沉。', icon: '📜' },
        { id: 3, title: '趣味测试：你是哪种瓢？', content: '点击开始测试', icon: '❓' },
      ]
    },
  
    goToChat() {
      wx.switchTab({
        url: '/pages/chat/chat'
      })
    },
  
    goToGame() {
      wx.switchTab({
        url: '/pages/game/game'
      })
    }
  })