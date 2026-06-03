// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const paddleWidth = 10;
const paddleHeight = 100;
const ballRadius = 7;

// Player paddle (left side)
const player = {
    x: 15,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

// Computer paddle (right side)
const computer = {
    x: canvas.width - paddleWidth - 15,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 4.5
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 5,
    dy: 5,
    radius: ballRadius,
    speed: 5
};

// Game state
let isGameRunning = false;
let playerScore = 0;
let computerScore = 0;

// Input handling
const keys = {};
let mouseY = canvas.height / 2;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Space to start/pause
    if (e.key === ' ') {
        e.preventDefault();
        toggleGameState();
    }

    // R to reset
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse tracking for paddle control
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
});

// Touch support for mobile
canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.touches[0].clientY - rect.top;
});

function toggleGameState() {
    isGameRunning = !isGameRunning;
    updateGameStatus();
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    isGameRunning = false;
    resetBall();
    player.y = canvas.height / 2 - paddleHeight / 2;
    computer.y = canvas.height / 2 - paddleHeight / 2;
    updateScore();
    updateGameStatus();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Random direction
    const angle = (Math.random() - 0.5) * Math.PI / 4; // Between -22.5 and 22.5 degrees
    ball.dx = ball.speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ball.speed * Math.sin(angle);
}

function updateGameStatus() {
    const statusEl = document.getElementById('gameStatus');
    if (isGameRunning) {
        statusEl.textContent = '🎮 Game Running...';
    } else {
        statusEl.textContent = '⏸️ Game Paused - Press SPACE to Start';
    }
}

function updateScore() {
    document.getElementById('playerScore').textContent = playerScore;
    document.getElementById('computerScore').textContent = computerScore;
}

// Update player paddle position
function updatePlayer() {
    // Arrow keys or mouse
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        player.dy = -player.speed;
    } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        player.dy = player.speed;
    } else {
        // Use mouse Y as primary control
        const targetY = mouseY - paddleHeight / 2;
        player.y = targetY;
        player.dy = 0;
        return; // Skip the below updates when using mouse
    }

    // Apply keyboard movement
    player.y += player.dy;

    // Collision with top and bottom walls
    if (player.y < 0) {
        player.y = 0;
    } else if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

// Update computer paddle position (AI)
function updateComputer() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;
    const difficulty = 0.8; // 0-1, higher = easier to beat

    // AI tries to follow the ball with some imperfection
    if (computerCenter < ballCenter - 10) {
        computer.y += computer.speed * difficulty;
    } else if (computerCenter > ballCenter + 10) {
        computer.y -= computer.speed * difficulty;
    }

    // Collision with top and bottom walls
    if (computer.y < 0) {
        computer.y = 0;
    } else if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

// Update ball position and check collisions
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy = -ball.dy;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : canvas.height - ball.radius;
    }

    // Left wall (player side) - score for computer
    if (ball.x - ball.radius < 0) {
        computerScore++;
        updateScore();
        resetBall();
        return;
    }

    // Right wall (computer side) - score for player
    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        updateScore();
        resetBall();
        return;
    }

    // Player paddle collision
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = -ball.dx;
        ball.x = player.x + player.width + ball.radius;

        // Add spin based on where the ball hits the paddle
        const hitPos = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
        ball.dy = hitPos * ball.speed * 0.75;

        // Increase ball speed slightly
        ball.speed = Math.min(ball.speed + 0.5, 9);
        ball.dx = Math.sign(ball.dx) * ball.speed;
    }

    // Computer paddle collision
    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -ball.dx;
        ball.x = computer.x - ball.radius;

        // Add spin based on where the ball hits the paddle
        const hitPos = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
        ball.dy = hitPos * ball.speed * 0.75;

        // Increase ball speed slightly
        ball.speed = Math.min(ball.speed + 0.5, 9);
        ball.dx = Math.sign(ball.dx) * ball.speed;
    }
}

// Drawing functions
function drawPaddle(x, y, width, height, isPlayer) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#00cc00');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Add glow effect
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
}

function drawBall(x, y, radius) {
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add glow
    ctx.strokeStyle = '#00cc00';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCenterLine() {
    ctx.setLineDash([15, 15]);
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    drawCenterLine();

    // Draw paddles
    drawPaddle(player.x, player.y, player.width, player.height, true);
    drawPaddle(computer.x, computer.y, computer.width, computer.height, false);

    // Draw ball
    drawBall(ball.x, ball.y, ball.radius);
}

// Main game loop
function gameLoop() {
    if (isGameRunning) {
        updatePlayer();
        updateComputer();
        updateBall();
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize
updateScore();
updateGameStatus();
gameLoop();
