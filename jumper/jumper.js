/*
 * 控制游戏相关逻辑
 */

;(function() {
  var jumperTimer = null
  var jumperInterval = 5 // 定时器间隔
  var standBlockObj = {
    position: game.block.positionArr[0].x1,
    isFirstFall: false,
    before: game.block.positionArr[0].x1,
    current: game.block.positionArr[0].x1
  }

  var score = window.score
  var canvas = window.canvas
  var ctx = window.ctx
  var leadSize = game.lead.leadInfo.size
  var leadPosition = game.lead.leadInfo.position

  var isFirstFall = true
  var isFirstPush = true
  var canGetScore = true
  var isToLeft = false
  var isRecordAureole = false
  var textColor = '#222' // 文本颜色
  var fontSize = 16 // 字体大小
  var HighScore = 0 // 历史最高分记录值
  var startTime = 0 // 蓄力开始时间存储值
  var aureoleShrinkSpeed = 0 // 光圈收缩速度存储值
  var horizontalDirection = 1 // 水平移动方向
  var maxYAddSpeed = 1500 // 向下加速度
  var leftLine = canvas.width / 10 // 向左对齐水平位置
  var leftSpeed = -600 // 向左对齐速度
  var touchDB = 360 // 触摸灵敏度，越小反应越大

  var currentChooseOption = '' // 记录当前悬浮的操作选项
  var helpContent =
    '<p>游戏说明</p><br /><br /><p>操作: 电脑按下空格蓄力，圆圈闪烁越快松开起跳的距离越远；手机按下开始蓄力，左右滑动的越远手指松开时跳的越远；</p><br /><p>得分: 每次踩中一个方块得一分，越过方块不得分；</p><br /><p>注意: 掉下缝隙或飞过屏幕右侧则判负。</p><br /><p>（点击任意处关闭说明）</p>'
  var textInfoArr = [
    {
      // 存储菜单的文本信息
      text: '最高分:' + HighScore,
      x1: 0,
      x2: 0,
      y: 0
    },
    {
      text: '开始游戏',
      x1: 0,
      x2: 0,
      y: 0
    }
  ]

  game.help.changeHelpContent(helpContent)
  game.mode.changeModeContent('待开发')
  // 检查菜单层渲染完毕
  img.imgMethod.checkImageIsAllReady(function() {
    endGameHandle()
  })
  // 运行游戏
  function runGame() {
    setAureoleAutoAdd()
    clearRect('#fff')
    while (!game.block.checkBlockIsEnough()) {
      game.block.createBlock()
    }
    game.block.draw()
    var leadPositionObj = game.lead.computeLeadPosition(jumperInterval)
    var blockPositionArr = game.block.positionArr
    if (!isToLeft) {
      blockPositionArr.forEach(function(blockPosition) {
        var beforePosition = {
          x1: leadPositionObj.x.before,
          x2: leadPositionObj.x.before + leadSize.x,
          y: leadPositionObj.y.before
        }
        var afterPosition = {
          x1: leadPositionObj.x.after,
          x2: leadPositionObj.x.after + leadSize.x,
          y: leadPositionObj.y.after
        }
        if (
          (beforePosition.y < blockPosition.y - leadSize.y && afterPosition.y > blockPosition.y - leadSize.y) ||
          leadPositionObj.y.after === blockPosition.y - leadSize.y
        ) {
          var rate =
            (blockPosition.y - leadSize.y - afterPosition.y) / (afterPosition.y - beforePosition.y - leadSize.y)
          var deviationX = beforePosition.x1 + (afterPosition.x1 - beforePosition.x1) * rate
          if (deviationX > blockPosition.x1 - leadSize.x && deviationX < blockPosition.x2) {
            leadPositionObj.y.speed = 0
            leadPositionObj.x.after = deviationX
            leadPositionObj.y.after = blockPosition.y - leadSize.y
            game.lead.changeAddSpeed('x', 0)
            game.lead.changeAddSpeed('y', 0)
            isFirstFall = false
            standBlockObj.current = blockPosition.x1
            if (standBlockObj.current !== standBlockObj.before) {
              standBlockObj.isFirstFall = true
              canGetScore = true
              if (standBlockObj.isFirstFall) {
                standBlockObj.before = blockPosition.x1
                standBlockObj.isFirstFall = false
                getScoreHandle()
              }
            }
          }
        }
        if (afterPosition.y + leadSize.y > blockPosition.y) {
          if (
            (beforePosition.x2 < blockPosition.x1 && afterPosition.x2 > blockPosition.x1) ||
            afterPosition.x2 === blockPosition.x1
          ) {
            var rate = (blockPosition.x1 - beforePosition.x2) / (afterPosition.x2 - beforePosition.x2)
            var deviationY = beforePosition.y + (afterPosition.y - beforePosition.y) * rate
            leadPositionObj.y.after = deviationY
            leadPositionObj.x.after = blockPosition.x1 - leadSize.x
            horizontalDirection = -1
          } else if (
            (beforePosition.x1 > blockPosition.x2 && afterPosition.x1 < blockPosition.x2) ||
            afterPosition.x1 === blockPosition.x2
          ) {
            var rate = (blockPosition.x2 - beforePosition.x1) / (afterPosition.x1 - beforePosition.x1)
            var deviationY = beforePosition.y + (afterPosition.y - beforePosition.y) * rate
            leadPositionObj.y.after = deviationY
            leadPositionObj.x.after = blockPosition.x2
            horizontalDirection = 1
          }
        }
      })
      if (leadPositionObj.y.speed === 0 || isFirstFall) {
        leadPositionObj.x.speed = 0
      } else {
        leadPositionObj.x.speed = game.lead.sportInfo.maxSpeed.x * horizontalDirection
      }
    } else {
      var preDistance = (leftSpeed * jumperInterval) / 1000
      leadPositionObj.x.speed = leftSpeed
      blockPositionArr.forEach(function(blockPosition) {
        blockPosition.x1 = blockPosition.x1 + preDistance
        blockPosition.x2 = blockPosition.x2 + preDistance
      })
      standBlockObj.before = standBlockObj.before + preDistance //方块归位时需要更新之前踩过方块的记录值
      if (leadPositionObj.x.after <= leftLine) {
        blockPositionArr.forEach(function(blockPosition) {
          if (blockPosition.x2 < 0) {
            blockPositionArr.shift()
          }
        })
        isToLeft = false
      }
    }
    game.lead.updateLeadPositionAndSpeed(leadPositionObj)
    score.draw()
    game.lead.draw()
    if (checkLeadIsDie()) {
      endGameHandle()
    }
  }
  // 计算得分
  function getScoreHandle() {
    if (canGetScore && !isFirstFall) {
      score.computeScore(1)
    }
    canGetScore = false
    if (leadPosition.x > leftLine) {
      isToLeft = true
    }
  }
  // 开始游戏
  function startGameHandle() {
    currentChooseOption = ''

    game.controller.coverFullScreen(false, function() {
      clearInterval(jumperTimer)
      jumperTimer = null

      leadPosition = game.lead.leadInfo.position = {
        x: canvas.width / 10,
        y: (canvas.height / 10) * 9 - 48
      }

      standBlockObj = {
        position: game.block.positionArr[0].x1,
        isFirstFall: false,
        before: game.block.positionArr[0].x1,
        current: game.block.positionArr[0].x1
      }
      score.resetScore()

      game.block.resetBlockInfo()
      jumperTimer = setInterval(runGame, jumperInterval)
      clearChooseGameEvent()
      setGameControl()
    })
  }
  // 结束游戏
  function endGameHandle() {
    var currentScore = score.computeScore()
    clearInterval(jumperTimer)
    jumperTimer = null
    HighScore = HighScore > currentScore ? HighScore : currentScore
    textInfoArr[0].text = '最高分:' + HighScore

    game.controller.coverFullScreen(true, endGameCallback)
    var canvasWidth = canvas.width
    var canvasHeight = canvas.height
    //var img = document.getElementById('homeImg')
    //ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
    function endGameCallback() {
      ctx.beginPath()
      ctx.fillStyle = textColor
      ctx.font = 'bold ' + 2*fontSize + 'px Arial'
      ctx.textBaseline = 'top'
      textInfoArr.forEach(function(textInfo, index) {
        var textSizeInfo = getTextSizeInfo(textInfo.text)
        var y = index === 0 ? 0 : 200
        textInfo.x1 = textSizeInfo.centerPoint
        textInfo.x2 = textInfo.x1 + textSizeInfo.textWidth
        textInfo.y = (canvas.height / textInfoArr.length - 80) * index + canvas.height / textInfoArr.length / 2 + y
        ctx.fillText(textInfo.text, textInfo.x1, textInfo.y)
      })

      clearGameControl()
      setChooseGameEvent()
    }

    function getTextSizeInfo(text) {
      var textWidth = ctx.measureText(text).width
      return {
        textWidth: textWidth,
        centerPoint: Math.round(canvas.width / 2 - textWidth / 2)
      }
    }
  }
  // 检测跳动的方块是否跳出了页面
  function checkLeadIsDie() {
    if (leadPosition.y > canvas.height || leadPosition.x > canvas.width) {
      return true
    }
    return false
  }
  // 开始跳跃
  function startJump(deviationTime) {
    if (deviationTime) {
      game.lead.accunulateJump(deviationTime)
      game.lead.changeAddSpeed('y', maxYAddSpeed)
    }
  }
  // 监听选择菜单事件
  function setChooseGameEvent() {
    window.onmousemove = function(event) {
      var flag = false
      canvas.style.cursor = 'default'
      currentChooseOption = ''
      textInfoArr.forEach(function(textInfo, index) {
        if (index !== 0) {
          if (
            event.clientX >= textInfo.x1 &&
            event.clientX <= textInfo.x2 &&
            event.clientY >= textInfo.y &&
            event.clientY <= textInfo.y + fontSize
          ) {
            flag = true
            switch (index) {
              case 1:
                currentChooseOption = 'start'
                break
              case 2:
                currentChooseOption = 'mode'
                break
              case 3:
                currentChooseOption = 'help'
                break
            }
          }
        }
      })
      if (flag) {
        canvas.style.cursor = 'pointer'
      }
    }

    window.onclick = function() {
      if (currentChooseOption) {
        currentChooseOption === 'start' ? startGameHandle() : ''
        currentChooseOption === 'mode' ? changeModeShowState(true) : ''
        currentChooseOption === 'help' ? changeHelpShowState(true) : ''
      }
    }
  }
  // 清除监听选择菜单事件
  function clearChooseGameEvent() {
    canvas.style.cursor = 'default'
    window.onmousemove = null
    window.onclick = null
  }
  // 添加蓄力的光圈
  function setAureoleAutoAdd() {
    if (isRecordAureole) {
      aureoleShrinkSpeed = aureoleShrinkSpeed + 0.6
      game.lead.changeAureoleShrinkSpeed(aureoleShrinkSpeed, jumperInterval)
    }
  }
  // 监听触发跳跃的事件
  function setGameControl() {
    window.onkeydown = function(event) {
      if (event.keyCode === 32 && isFirstPush && game.lead.sportInfo.speed.y === 0) {
        aureoleShrinkSpeed = 0
        isRecordAureole = true
        game.lead.changeAureoleIsShow(true)
        isFirstPush = false
        startTime = new Date().getTime()
      }
    }
    // 松开空格键
    window.onkeyup = function(event) {
      var endTime = 0
      if (event.keyCode === 32 && game.lead.sportInfo.speed.y === 0 && !isToLeft) {
        isRecordAureole = false
        game.lead.changeAureoleIsShow(false)
        isFirstPush = true
        endTime = new Date().getTime()
        var deviationTime = (endTime - startTime) / 1000
        horizontalDirection = 1
        // 播放跳跃音乐，500ms后播放停止
        var audio = document.getElementById('jumperAudio')
        audio.play()
        setTimeout(function() {
          audio.pause()
        }, 500)
        startJump(deviationTime)
      }
    }

    window.ontouchstart = function(event) {
      if (game.lead.sportInfo.speed.y === 0 && !isToLeft) {
        game.lead.changeAureoleIsShow(true)
        var startX = event.changedTouches[0].pageX
        isFirstPush = false
      }

      window.ontouchmove = function(event) {
        var moveY = event.changedTouches[0].pageX
        var speed = Math.abs(moveY - startX) / 5
        game.lead.changeAureoleShrinkSpeed(speed, jumperInterval)
      }

      window.ontouchend = function(event) {
        if (game.lead.sportInfo.speed.y === 0 && !isToLeft) {
          game.lead.changeAureoleIsShow(false)
          var endX = event.changedTouches[0].pageX
          var distance = Math.abs(endX - startX)
          var deviationTime = distance / touchDB
          horizontalDirection = 1
          startJump(deviationTime)
        }
      }
    }
  }
  // 清除监听触发跳跃的事件
  function clearGameControl() {
    window.ontouchstart = null
    window.onkeydown = null
    window.onkeyup = null
  }
  // 清除方块
  function clearRect(color) {
    var color = color || '#ddd'
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  // 控制显示游戏说明层
  function changeHelpShowState(state) {
    clearChooseGameEvent()
    clearRect()
    game.help.changeHelpShowState(state)
    setCloseHelpEvent()
  }
  // 监听关闭游戏说明的事件
  function setCloseHelpEvent() {
    if (game.help.showState) {
      window.onclick = function() {
        game.help.changeHelpShowState(false)
        endGameHandle()
      }
    }
  }
  // 控制显示选择模式层
  function changeModeShowState(state) {
    clearChooseGameEvent()
    clearRect()
    game.mode.changeModeShowState(state)
    setCloseModeEvent()
  }
  // 监听关闭选择模式事件
  function setCloseModeEvent() {
    if (game.mode.showModeState) {
      window.onclick = function() {
        game.mode.changeModeShowState(false)
        endGameHandle()
      }
    }
  }
})()
