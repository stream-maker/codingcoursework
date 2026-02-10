const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const gameMessage = document.getElementById('gameMessage');

// Config Elements
const configBtn = document.getElementById('configBtn');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const mainMenu = document.getElementById('mainMenu');
const configPanel = document.getElementById('configPanel');
const currentKeysSpan = document.getElementById('currentKeys');
const keyBindBtns = document.querySelectorAll('.key-bind-btn');
const playerDisplay = document.getElementById('playerDisplay');
const playerName = document.getElementById('playerName');

// Game settings
const GRID_SIZE = 20;
let tileCountX = 0;
let tileCountY = 0;
const GAME_SPEED = 100; // ms per frame

// Key Mappings (Default)
let keyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight'
};

let activeKeyBind = null; // The action currently being rebound

// Game state
let score = 0;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let gameLoopId = null;
let isGameRunning = false;

// Initialize canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    tileCountX = Math.floor(canvas.width / GRID_SIZE);
    tileCountY = Math.floor(canvas.height / GRID_SIZE);
    
    // Redraw if game is not running (to keep background correct)
    if (!isGameRunning) {
        drawGame();
    }
}

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Initialize game
function initGame() {
    // Start in the middle
    const startX = Math.floor(tileCountX / 2);
    const startY = Math.floor(tileCountY / 2);
    
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    score = 0;
    dx = 1;
    dy = 0;
    scoreElement.textContent = score;
    createFood();
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    // Check if food spawns on snake body
    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            createFood();
            return;
        }
    }
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isGameRunning && snake.length === 0) return; // Don't draw game objects if not initialized

    // Draw Food
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw Snake
    ctx.fillStyle = '#2ecc71';
    snake.forEach((part, index) => {
        // Head is a bit different color
        if (index === 0) {
            ctx.fillStyle = '#4CAF50';
        } else {
            ctx.fillStyle = '#2ecc71';
        }
        ctx.fillRect(
            part.x * GRID_SIZE + 1,
            part.y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Check collision with walls
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver();
        return;
    }

    // Check collision with self
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Check if ate food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        createFood();
    } else {
        snake.pop();
    }
}

function gameLoop() {
    if (!isGameRunning) return;
    
    moveSnake();
    if (isGameRunning) { // Check again in case game over happened
        drawGame();
        setTimeout(gameLoop, GAME_SPEED);
    }
}

function startGame() {
    if (isGameRunning) return;
    
    resizeCanvas(); // Ensure size is correct before starting
    initGame();
    isGameRunning = true;
    overlay.classList.add('hidden');
    gameLoop();
}

async function gameOver() {
    isGameRunning = false;
    gameMessage.textContent = `游戏结束! 得分: ${score}`;
    startBtn.textContent = '重新开始';
    overlay.classList.remove('hidden');
    mainMenu.classList.remove('hidden');
    configPanel.classList.add('hidden');
    
    // Save score if user is logged in
    if (Utils.getCurrentUser()) {
        await Utils.saveScore('snake', score);
    }
}

// --- Configuration Logic ---

function updateKeyDisplay() {
    // Helper to format key names (e.g. "ArrowUp" -> "↑")
    const formatKey = (key) => {
        if (key === 'ArrowUp') return '↑';
        if (key === 'ArrowDown') return '↓';
        if (key === 'ArrowLeft') return '←';
        if (key === 'ArrowRight') return '→';
        if (key === ' ') return 'Space';
        return key.replace('Key', '').toUpperCase();
    };

    const keys = [keyMap.up, keyMap.down, keyMap.left, keyMap.right].map(formatKey).join(' ');
    currentKeysSpan.textContent = keys;

    // Update buttons in config panel
    keyBindBtns.forEach(btn => {
        const action = btn.dataset.action;
        btn.textContent = keyMap[action];
    });
}

function toggleConfig() {
    mainMenu.classList.toggle('hidden');
    configPanel.classList.toggle('hidden');
    activeKeyBind = null;
    keyBindBtns.forEach(btn => btn.classList.remove('active'));
}

// Event Listeners for Configuration
configBtn.addEventListener('click', toggleConfig);
closeConfigBtn.addEventListener('click', toggleConfig);

keyBindBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering other things
        
        // Deactivate others
        keyBindBtns.forEach(b => b.classList.remove('active'));
        
        activeKeyBind = btn.dataset.action;
        btn.classList.add('active');
        btn.textContent = "按下按键...";
    });
});

// Input handling
document.addEventListener('keydown', (event) => {
    // Handle Key Binding Configuration
    if (!configPanel.classList.contains('hidden') && activeKeyBind) {
        event.preventDefault();
        const newKey = event.code;
        
        // Check for duplicates
        for (let action in keyMap) {
            if (keyMap[action] === newKey && action !== activeKeyBind) {
                alert(`该按键已被 ${action} 使用!`);
                return;
            }
        }

        keyMap[activeKeyBind] = newKey;
        updateKeyDisplay();
        
        // Reset state
        activeKeyBind = null;
        keyBindBtns.forEach(b => b.classList.remove('active'));
        return;
    }

    // Handle Game Input
    if (!isGameRunning) return;

    const keyPressed = event.code;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === keyMap.left && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === keyMap.up && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === keyMap.right && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === keyMap.down && !goingUp) {
        dx = 0;
        dy = 1;
    }
});

startBtn.addEventListener('click', startGame);

// Initial setup
resizeCanvas();
// Initial draw background
ctx.fillStyle = '#2c3e50';
ctx.fillRect(0, 0, canvas.width, canvas.height);
updateKeyDisplay();

// Check for logged in user
const currentUser = Utils.getCurrentUser();
if (currentUser) {
    playerDisplay.classList.remove('hidden');
    playerName.innerHTML = Utils.getUserDisplay(currentUser).replace(' ', '&nbsp;');
}
