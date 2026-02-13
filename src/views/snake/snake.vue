<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import VirtualJoystick from '../../components/VirtualJoystick.vue'

const router = useRouter()

// Refs
const gameCanvas = ref(null)
const score = ref(0)
const isGameRunning = ref(false)
const showOverlay = ref(true)
const showConfig = ref(false)
const gameMessage = ref('准备好了吗？')
const startBtnText = ref('开始游戏')
const activeKeyBind = ref(null) // 'up', 'down', 'left', 'right'
const isMobile = ref(false)

// Game State (non-reactive for performance where possible)
let ctx = null
let tileCountX = 0
let tileCountY = 0
let snake = []
let food = { x: 0, y: 0 }
let dx = 0
let dy = 0
let gameLoopTimeout = null
const GRID_SIZE = 20
const GAME_SPEED = 100

// Key Configuration
const keyMap = reactive({
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight'
})

// Lifecycle
onMounted(() => {
  if (gameCanvas.value) {
    ctx = gameCanvas.value.getContext('2d')
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('keydown', handleKeydown)
    resizeCanvas()
    
    // Initial draw
    ctx.fillStyle = '#2c3e50'
    ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('keydown', handleKeydown)
  stopGameLoop()
})

// Canvas Management
function resizeCanvas() {
  if (!gameCanvas.value) return
  gameCanvas.value.width = window.innerWidth
  gameCanvas.value.height = window.innerHeight
  tileCountX = Math.floor(gameCanvas.value.width / GRID_SIZE)
  tileCountY = Math.floor(gameCanvas.value.height / GRID_SIZE)
  
  isMobile.value = window.innerWidth < 768

  if (!isGameRunning.value) {
    drawGame()
  }
}

// Game Logic
function initGame() {
  const startX = Math.floor(tileCountX / 2)
  const startY = Math.floor(tileCountY / 2)
  
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ]
  score.value = 0
  dx = 1
  dy = 0
  createFood()
}

function createFood() {
  food = {
    x: Math.floor(Math.random() * tileCountX),
    y: Math.floor(Math.random() * tileCountY)
  }
  // Avoid spawning on snake
  for (let part of snake) {
    if (part.x === food.x && part.y === food.y) {
      createFood()
      return
    }
  }
}

function drawGame() {
  if (!ctx || !gameCanvas.value) return
  
  // Clear
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(0, 0, gameCanvas.value.width, gameCanvas.value.height)

  if (!isGameRunning.value && snake.length === 0) return

  // Draw Food
  ctx.fillStyle = '#e74c3c'
  ctx.beginPath()
  ctx.arc(
    food.x * GRID_SIZE + GRID_SIZE / 2,
    food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 2,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Draw Snake
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? '#4CAF50' : '#2ecc71'
    ctx.fillRect(
      part.x * GRID_SIZE + 1,
      part.y * GRID_SIZE + 1,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    )
  })
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy }

  // Wall Collision
  if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
    gameOver()
    return
  }

  // Self Collision
  for (let i = 0; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver()
      return
    }
  }

  snake.unshift(head)

  // Eat Food
  if (head.x === food.x && head.y === food.y) {
    score.value += 10
    createFood()
  } else {
    snake.pop()
  }
}

function gameLoop() {
  if (!isGameRunning.value) return
  
  moveSnake()
  
  if (isGameRunning.value) {
    drawGame()
    gameLoopTimeout = setTimeout(gameLoop, GAME_SPEED)
  }
}

function stopGameLoop() {
  if (gameLoopTimeout) {
    clearTimeout(gameLoopTimeout)
    gameLoopTimeout = null
  }
}

function startGame() {
  if (isGameRunning.value) return
  
  resizeCanvas()
  initGame()
  isGameRunning.value = true
  showOverlay.value = false
  gameLoop()
}

async function gameOver() {
  isGameRunning.value = false
  stopGameLoop()
  
  gameMessage.value = `游戏结束! 得分: ${score.value}`
  startBtnText.value = '重新开始'
  showOverlay.value = true
  showConfig.value = false // Ensure we show main menu
}

// Input Handling
function handleKeydown(event) {
  // Config Mode
  if (showConfig.value && activeKeyBind.value) {
    event.preventDefault()
    const newKey = event.code
    
    // Check duplicates
    for (let action in keyMap) {
      if (keyMap[action] === newKey && action !== activeKeyBind.value) {
        alert(`该按键已被 ${action} 使用!`)
        return
      }
    }
    
    keyMap[activeKeyBind.value] = newKey
    activeKeyBind.value = null
    return
  }

  // Game Mode
  if (!isGameRunning.value) return

  const keyPressed = event.code
  const goingUp = dy === -1
  const goingDown = dy === 1
  const goingRight = dx === 1
  const goingLeft = dx === -1

  if (keyPressed === keyMap.left && !goingRight) {
    dx = -1; dy = 0
  }
  if (keyPressed === keyMap.up && !goingDown) {
    dx = 0; dy = -1
  }
  if (keyPressed === keyMap.right && !goingLeft) {
    dx = 1; dy = 0
  }
  if (keyPressed === keyMap.down && !goingUp) {
    dx = 0; dy = 1
  }
}

function handleJoystick(direction) {
  if (!isGameRunning.value) return
  
  const goingUp = dy === -1
  const goingDown = dy === 1
  const goingRight = dx === 1
  const goingLeft = dx === -1
  
  if (direction === 'LEFT' && !goingRight) {
    dx = -1; dy = 0
  }
  if (direction === 'UP' && !goingDown) {
    dx = 0; dy = -1
  }
  if (direction === 'RIGHT' && !goingLeft) {
    dx = 1; dy = 0
  }
  if (direction === 'DOWN' && !goingUp) {
    dx = 0; dy = 1
  }
}

// Config UI
function toggleConfig() {
  showConfig.value = !showConfig.value
  activeKeyBind.value = null
}

function startRebind(action) {
  activeKeyBind.value = action
}

function formatKey(key) {
  if (key === 'ArrowUp') return '↑'
  if (key === 'ArrowDown') return '↓'
  if (key === 'ArrowLeft') return '←'
  if (key === 'ArrowRight') return '→'
  if (key === 'Space') return 'Space'
  return key.replace('Key', '').toUpperCase()
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="game-container">
    <canvas ref="gameCanvas"></canvas>
    
    <!-- HUD -->
    <div class="hud">
      <div class="score-board">
        得分: {{ score }}
      </div>
      <button class="back-btn" @click="goBack">返回主页</button>
    </div>

    <!-- Overlay -->
    <div v-if="showOverlay" class="overlay">
      <div class="modal-content game-menu">
        
        <!-- Main Menu -->
        <div v-if="!showConfig" class="menu-main">
          <h2>贪吃蛇</h2>
          <p class="message">{{ gameMessage }}</p>
          
          <button @click="startGame" class="primary-btn big-btn">{{ startBtnText }}</button>
          
          <div class="controls-hint">
            <p v-if="!isMobile">控制键: 
              {{ formatKey(keyMap.up) }} 
              {{ formatKey(keyMap.down) }} 
              {{ formatKey(keyMap.left) }} 
              {{ formatKey(keyMap.right) }}
            </p>
            <p v-else>使用屏幕右下角的摇杆控制方向</p>
            <button v-if="!isMobile" @click="toggleConfig" class="text-btn">自定义按键</button>
          </div>
        </div>

        <!-- Config Panel -->
        <div v-else class="menu-config">
          <h2>按键设置</h2>
          <div class="key-bind-list">
            <div v-for="(key, action) in keyMap" :key="action" class="key-bind-item">
              <span>{{ action.toUpperCase() }}</span>
              <button 
                :class="['key-bind-btn', { active: activeKeyBind === action }]"
                @click.stop="startRebind(action)"
              >
                {{ activeKeyBind === action ? '按下按键...' : formatKey(key) }}
              </button>
            </div>
          </div>
          <button @click="toggleConfig" class="secondary-btn">完成</button>
        </div>

      </div>
    </div>
    <!-- Joystick for Mobile -->
    <VirtualJoystick v-if="isMobile" @changeDirection="handleJoystick" />
  </div>
</template>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #2c3e50;
}

canvas {
  display: block;
}

.hud {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  pointer-events: none; /* Let clicks pass through to canvas if needed, though here buttons need clicks */
  z-index: 100; /* Ensure HUD is on top of overlay */
}

.hud button {
  pointer-events: auto;
}

.score-board {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.game-menu {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  min-width: 300px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  color: #333; /* Ensure text is visible */
}

.menu-config h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.key-bind-item span {
  color: #333;
  font-weight: bold;
}

.big-btn {
  font-size: 1.5rem;
  padding: 1rem 3rem;
  margin: 1rem 0;
}

.controls-hint {
  margin-top: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.key-bind-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
}

.key-bind-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.key-bind-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #f9f9f9;
  border-radius: 4px;
  cursor: pointer;
  min-width: 80px;
}

.key-bind-btn.active {
  background: #3498db;
  color: white;
  border-color: #2980b9;
}

.back-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>