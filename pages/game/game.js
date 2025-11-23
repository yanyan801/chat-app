// pages/game/game.js
Page({
    data: {
      isShaking: false,
      result: '',
      score: 0
    },
  
    handleShake() {
      if (this.data.isShaking) return
  
      this.setData({
        isShaking: true,
        result: ''
      })
  
      setTimeout(() => {
        const outcomes = ['大吉', '中吉', '小吉', '瓢了', '再来一次']
        const randomResult = outcomes[Math.floor(Math.random() * outcomes.length)]
        
        let newScore = this.data.score
        if (randomResult !== '瓢了') {
          newScore += 10
        }
  
        this.setData({
          isShaking: false,
          result: randomResult,
          score: newScore
        })
  
        // Optional: Save score to cloud
        // wx.cloud.callFunction({ name: 'submitScore', data: { score: newScore } })
      }, 1500)
    }
  })