const player = document.querySelector('.player');
const gameContainer = document.querySelector('.game-container');
const platforms = document.querySelectorAll('.platform');
let containerH = gameContainer.offsetHeight;
let containerW = gameContainer.offsetWidth;

// --- Initial Player Position ---
// Use CSS 'left' if set, otherwise default.
let playerX = parseInt(player.style.left) || 50;
// Calculate initial Y near the bottom, respecting player height.
// Use CSS 'top' if set, otherwise calculate from bottom.
let playerY = parseInt(player.style.top) || (containerH - player.offsetHeight - 5); // Start 5px above bottom

// Ensure initial Y is not below 0 if container/player height is small
if (playerY < 0) playerY = 0;

let prevX = playerX; // Store initial X as previous X
let prevY = playerY; // Store initial Y as previous Y

let velocityY = 0;
const gravity = 0.5;
const speed = 4; // Slightly reduced speed for better control
const jumpStrength = -11; // Negative value for upward jump (increased slightly)
const keysPressed = {};

// Apply initial calculated position to the DOM element
player.style.left = playerX + 'px';
player.style.top = playerY + 'px';


// Function to get the bounding box of an element relative to its offset parent
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

// Axis-Aligned Bounding Box (AABB) collision detection function
function isColliding(a, b) {
    return !(
        a.left >= b.right ||  // 'a' is entirely to the right of 'b'
        a.right <= b.left ||  // 'a' is entirely to the left of 'b'
        a.top >= b.bottom ||  // 'a' is entirely below 'b'
        a.bottom <= b.top     // 'a' is entirely above 'b'
    );
}

// Event listeners to track key presses
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

// Log initial positions for debugging purposes
console.log(`Container Dimensions: W=${containerW}, H=${containerH}`);
platforms.forEach((platform, index) => {
    console.log(`Platform ${index + 1} Initial Bounds:`, getBounds(platform));
});
console.log('Player Initial Calculated Position (x, y):', playerX, playerY);
console.log('Player Initial Bounds:', getBounds(player));

// --- Main Game Loop ---
function animate() {
    // --- Horizontal Movement Input ---
    if (keysPressed['ArrowLeft']) {
        playerX -= speed;
    }
    if (keysPressed['ArrowRight']) {
        playerX += speed;
    }

    // --- Apply Gravity ---
    // Gravity constantly increases downward velocity unless on ground
    // Note: We reset velocityY to 0 upon collision, so gravity re-applies next frame
    velocityY += gravity;


    // --- Calculate Potential Next Position ---
    // Important: Calculate where the player *would* be after applying velocity
    let projectedY = playerY + velocityY;
    // Horizontal position is already updated from input

    // --- Collision Detection & Resolution ---
    let onGround = false;
    let hitCeiling = false; // Flag if player bonked their head

    // Get current player bounds (needed for prevY comparison)
    const currentPlayerBounds = getBounds(player); // Based on position *before* applying velocity for this frame

    // Check collision against each platform
    platforms.forEach((platform, index) => {
        const platformBounds = getBounds(platform);

        // Create a bounding box for the player's *projected* position this frame
        let projectedPlayerBounds = {
            top: projectedY,
            bottom: projectedY + currentPlayerBounds.height,
            left: playerX, // Use the already updated playerX
            right: playerX + currentPlayerBounds.width,
            height: currentPlayerBounds.height,
            width: currentPlayerBounds.width
        };

        // Only proceed if a collision is detected with the projected position
        if (isColliding(projectedPlayerBounds, platformBounds)) {

            // 1. Check for Bottom Collision (Hitting Head)
            // Condition: Moving upwards AND projected top edge penetrates platform bottom
            if (velocityY < 0 && projectedPlayerBounds.top < platformBounds.bottom && currentPlayerBounds.top >= platformBounds.bottom) {
                playerY = platformBounds.bottom; // Snap player's top to platform's bottom
                velocityY = 0; // Stop upward movement
                hitCeiling = true;
                console.log(`Hit bottom of Platform ${index + 1}`);
            }
            // 2. Check for Top Collision (Landing)
            // Condition: Moving downwards (or stationary and overlapping) AND projected bottom edge penetrates platform top
            else if (velocityY >= 0 && projectedPlayerBounds.bottom > platformBounds.top && currentPlayerBounds.bottom <= platformBounds.top) {
                playerY = platformBounds.top - currentPlayerBounds.height; // Snap player's bottom to platform's top
                velocityY = 0; // Stop downward movement
                onGround = true;
                console.log(`Landed on Platform ${index + 1}`);
            }
             // 3. Check for Side Collisions (Resolve horizontal overlap)
             // This should run if vertical collision didn't already resolve position
             // Check for significant vertical overlap in the *projected* state
             else if (projectedPlayerBounds.bottom > platformBounds.top && projectedPlayerBounds.top < platformBounds.bottom) {
                  // Check if moving right into the platform's left side
                  // Additional check: Player's *current* right edge was left of platform's left edge
                 if (playerX > prevX && projectedPlayerBounds.right > platformBounds.left && currentPlayerBounds.right <= platformBounds.left) {
                     playerX = platformBounds.left - currentPlayerBounds.width; // Correct horizontal position
                     console.log(`Hit left side of Platform ${index + 1}, stopped at x: ${playerX}`);
                 }
                 // Check if moving left into the platform's right side
                 // Additional check: Player's *current* left edge was right of platform's right edge
                 else if (playerX < prevX && projectedPlayerBounds.left < platformBounds.right && currentPlayerBounds.left >= platformBounds.right) {
                     playerX = platformBounds.right; // Correct horizontal position
                     console.log(`Hit right side of Platform ${index + 1}, stopped at x: ${playerX}`);
                 }
             }
        }
    });

    // --- Update Vertical Position ---
    // Apply the (potentially modified by collision) velocity ONLY IF no vertical collision occured
    // If a vertical collision (landing/hitting head) happened, playerY was already set precisely.
    if (!onGround && !hitCeiling) {
         playerY += velocityY;
    }


    // --- Container Boundary Checks ---
    // Floor Collision
    if (playerY >= containerH - currentPlayerBounds.height) {
        playerY = containerH - currentPlayerBounds.height; // Snap to floor
        if (velocityY > 0) { // Only stop velocity if moving down into floor
           velocityY = 0;
        }
        onGround = true; // Consider floor as ground
        // console.log("Landed on ground floor");
    }

    // Ceiling Collision (Container Top)
    if (playerY < 0) {
        playerY = 0; // Stop at the top boundary
        if (velocityY < 0) { // Only stop velocity if moving up into ceiling
            velocityY = 0;
        }
        hitCeiling = true; // Hitting container top is like hitting a ceiling
        // console.log("Hit container ceiling");
    }

    // Horizontal Boundaries (Container Sides)
    if (playerX < 0) {
        playerX = 0;
    }
    if (playerX > containerW - currentPlayerBounds.width) {
        playerX = containerW - currentPlayerBounds.width;
    }


    // --- Jump Input ---
    // Allow jumping only if currently considered 'onGround' (platform or floor)
    if (keysPressed['ArrowUp'] && onGround) {
        velocityY = jumpStrength;
        onGround = false; // No longer on the ground once jump starts
    }


    // --- Update DOM Element ---
    // Apply the final calculated position to the player element styles
    player.style.left = playerX + 'px';
    player.style.top = playerY + 'px';


    // --- Update Previous State for Next Frame ---
    // Store current positions AFTER all calculations and DOM updates for this frame
    prevX = playerX;
    prevY = playerY;


    // --- Request Next Frame ---
    // Schedule the next call to animate for smooth animation
    window.requestAnimationFrame(animate);
}

// Start the game loop!
animate();