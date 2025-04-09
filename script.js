const player = document.querySelector('.player');
const gameContainer = document.querySelector('.game-container');
const platforms = document.querySelectorAll('.platform');
const scoreDisplay = document.querySelector('.score');

// Game state
let gameRunning = true;
let paused = false;
let score = 0;
let lives = 3;
let startTime = Date.now();
let frameCount = 0;
let lastTime = 0;
let deltaTime = 0;
let fps = 0;

// Game dimensions
let containerH = gameContainer.offsetHeight;
let containerW = gameContainer.offsetWidth;

// Player physics
let playerX = 50;
let playerY = containerH - 32 - 5; // 32px player height for collision
let prevX = playerX;
let prevY = playerY;
let velocityY = 0;
const gravity = 0.5;
const speed = 4;
const jumpStrength = -11;
let doubleJump = 0
let jumpPressed = false
let canJump = true;
let isPlayerGrounded = false

// Player state
const keysPressed = {};
let currentPlayerState = 'idle1';
let previousPlayerState = 'idle1';
let facingRight = true;
let onGround = false;

// Position player initially
player.style.transform = `translate(${playerX}px, ${playerY}px) scaleX(${facingRight ? 1 : -1})`;
player.classList.add(currentPlayerState);

// Create the pause menu
const pauseMenu = document.createElement('div');
pauseMenu.className = 'pause-menu';
pauseMenu.innerHTML = `
    <div class="menu-content">
        <h2>GAME PAUSED</h2>
        <button id="continueBtn">Continue</button>
        <button id="restartBtn">Restart</button>
    </div>
`;
pauseMenu.style.display = 'none';
gameContainer.appendChild(pauseMenu);

// Helper functions
function getBounds(element) {
    return {
        top: element.offsetTop,
        bottom: element.offsetTop + element.offsetHeight,
        left: element.offsetLeft,
        right: element.offsetLeft + element.offsetWidth,
        height: element.offsetHeight,
        width: element.offsetWidth
    };
}

function getPlayerBounds() {
    return {
        top: playerY,
        bottom: playerY + 32, // Fixed 32px height for collision
        left: playerX,
        right: playerX + 32, // Fixed 32px width for collision
        height: 32,
        width: 32
    };
}

function isColliding(a, b) {
    return !(
        a.left >= b.right ||
        a.right <= b.left ||
        a.top >= b.bottom ||
        a.bottom <= b.top
    );
}

function togglePause() {
    paused = !paused;
    if (paused) {
        pauseMenu.style.display = 'flex';
    } else {
        pauseMenu.style.display = 'none';
        lastTime = performance.now(); // Reset timing when resuming
    }
}

function restartGame() {
    // Reset player position and state
    playerX = 50;
    playerY = containerH - 32 - 5;
    velocityY = 0;
    score = 0;
    lives = 3;
    startTime = Date.now();
    currentPlayerState = 'idle1';
    facingRight = true;

    // Apply reset to player element
    player.style.transform = `translate(${playerX}px, ${playerY}px) scaleX(1)`;
    player.className = 'player idle1';

    // Unpause game
    paused = false;
    pauseMenu.style.display = 'none';

    // Reset timing
    lastTime = performance.now();
}

function updateScoreboard() {
    // Calculate time elapsed in seconds
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    // Format time as MM:SS
    const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update scoreboard
    scoreDisplay.innerHTML = `Time: ${timeDisplay} | Score: ${score} | Lives: ${lives}`;
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time for consistent animation
    if (!lastTime) lastTime = timestamp;
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // FPS calculation
    frameCount++;
    if (timestamp > lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (timestamp - lastTime));
        frameCount = 0;
        lastTime = timestamp;
    }

    if (!paused && gameRunning) {
        // Process game logic
        updateGame(deltaTime);
    }

    // Update UI
    updateScoreboard();

    // Request next frame
    requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    // --- Horizontal Movement Input & Direction ---
    let isMovingHorizontally = false;
    if (keysPressed['ArrowLeft']) {
        playerX -= speed;
        facingRight = false;
        isMovingHorizontally = true;
    }
    if (keysPressed['ArrowRight']) {
        playerX += speed;
        facingRight = true;
        isMovingHorizontally = true;
    }

    // --- Apply Gravity ---
    velocityY += gravity;

    // --- Calculate Potential Next Position ---
    let projectedY = playerY + velocityY;

    // --- Collision Detection & Resolution ---
    onGround = false;
    let hitCeiling = false;

    const currentPlayerBounds = getPlayerBounds();

    let projectedPlayerBoundsY = {
        top: projectedY,
        bottom: projectedY + 32,
        left: playerX,
        right: playerX + 32,
        height: 32,
        width: 32
    };

    // Check vertical collisions
    platforms.forEach((platform) => {
        const platformBounds = getBounds(platform);
        if (isColliding(projectedPlayerBoundsY, platformBounds)) {
            if (velocityY < 0 && currentPlayerBounds.top >= platformBounds.bottom) {
                projectedY = platformBounds.bottom;
                velocityY = 0;
                hitCeiling = true;
            } else if (velocityY >= 0 && currentPlayerBounds.bottom <= platformBounds.top) {
                projectedY = platformBounds.top - 32;
                velocityY = 0;
                onGround = true;
                doubleJump = 0; 
            }
        }
    });

    playerY = projectedY; // Update vertical position

    // Check horizontal collisions
    let projectedPlayerBoundsX = {
        top: playerY,
        bottom: playerY + 32,
        left: playerX,
        right: playerX + 32,
        height: 32,
        width: 32
    };

    platforms.forEach((platform) => {
        const platformBounds = getBounds(platform);
        if (isColliding(projectedPlayerBoundsX, platformBounds)) {
            if (projectedPlayerBoundsX.bottom > platformBounds.top && projectedPlayerBoundsX.top < platformBounds.bottom) {
                if (playerX > prevX && projectedPlayerBoundsX.right > platformBounds.left && currentPlayerBounds.right <= platformBounds.left) {
                    playerX = platformBounds.left - 32;
                } else if (playerX < prevX && projectedPlayerBoundsX.left < platformBounds.right && currentPlayerBounds.left >= platformBounds.right) {
                    playerX = platformBounds.right;
                }
            }
        }
    });

    // --- Container Boundary Checks ---
    if (playerY >= containerH - 32) {
        playerY = containerH - 32;
        if (velocityY > 0) { velocityY = 0; }
        onGround = true;
    }
    if (playerY < 0) {
        playerY = 0;
        if (velocityY < 0) { velocityY = 0; }
        hitCeiling = true;
    }
    if (playerX < 0) {
        playerX = 0;
    }
    if (playerX > containerW - 32) {
        playerX = containerW - 32;
    }

    // --- Jump Input ---
    if (jumpPressed && (onGround || doubleJump < 2)) {
        velocityY = jumpStrength;

        if (onGround) {
            doubleJump = 1;
        } else if (doubleJump === 1) {
            doubleJump = 2;
        }

        jumpPressed = false;
    }


    // --- Determine Animation State ---
    previousPlayerState = currentPlayerState;

    if (onGround) {
        if (isMovingHorizontally) {
            currentPlayerState = 'run';
        } else {
            currentPlayerState = 'idle1';
        }
    } else {
        if (velocityY < 0) {
            currentPlayerState = 'jump';
        } else {
            currentPlayerState = 'fall';
        }
    }

    // --- Update DOM Element ---
    // 1. Update Classes for Animation
    if (previousPlayerState !== currentPlayerState) {
        player.classList.remove(previousPlayerState);
        player.classList.add(currentPlayerState);
    }

    // 2. Update Transform for Position and Flipping
    const scaleX = facingRight ? 1 : -1;

    // Calculate the position offset for sprite centering
    // The actual sprite is 230x154, but collision box is 32x32
    // Center the sprite horizontally on the collision box
    const spriteOffsetX = -((230 - 32) / 2);

    // Position the sprite so its feet align with bottom of collision box
    const spriteOffsetY = -(154 - 32);

    player.style.transform = `translate(${playerX + spriteOffsetX}px, ${playerY + spriteOffsetY}px) scaleX(${scaleX})`;

    // --- Update Previous State for Next Frame ---
    prevX = playerX;
    prevY = playerY;
}

// Event Listeners
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && canJump) {
        jumpPressed = true;
        canJump = false
    }

    // Pause/Unpause with Escape key
    if (event.key === 'Escape') {
        togglePause();
    }
    keysPressed[event.key] = true
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowUp') {
        canJump = true;
    }
    keysPressed[event.key] = false});

// Add event listeners for pause menu buttons
document.addEventListener('DOMContentLoaded', () => {
    const continueBtn = document.getElementById('continueBtn');
    const restartBtn = document.getElementById('restartBtn');

    if (continueBtn) {
        continueBtn.addEventListener('click', togglePause);
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }
});

// Start the game loop
requestAnimationFrame(gameLoop);