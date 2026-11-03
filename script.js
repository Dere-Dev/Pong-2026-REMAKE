// Pong Code
// consts
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const leftScoreEl = document.getElementById("leftScore");
const rightScoreEl = document.getElementById("rightScore");
const speedBarFillEl = document.getElementById("speedBarFill");
// lets
let fpsCounter = 0;
let fpsLast = Date.now();
let ballX = 400;
let ballY = 300;
let ballSpeedX = 4;
let ballSpeedY = 4;
let leftPaddleY = 250;
let rightPaddleY = 250;
let upPressed = false;
let downPressed = false;
let rightUpPressed = false;
let rightDownPressed = false;
let rightScore = 0;
let leftScore = 0;
let leftPaddleSpeed = 6;
let rightPaddleSpeed = 6;
let powerupX = 400;
let powerupY = 300;
let powerupSize = 30;
let powerupActive = false;
let powerupTimer = 0;
let powerupType = null;
let activeEffect = null;
let trail = [];
let trailCounter = 0;
let slugActive = false;
let freezeActive = false;
let leftPaddleTrail = [];
let rightPaddleTrail = [];
let paddleTrailCounter = 0;
let sluggedPaddle = null;
let frozenPaddle = null;
let ballSpeedCap = 10;
let paddleSpeedCap = 10;
let capTimer = 0;
let escalationLevel = 0;
let glowOpacity = 0;
let decoyX = 0;
let decoyY = 0;
let decoySpeedX = 0;
let decoySpeedY = 0;
let decoyActive = false;
let ghostX = 0;
let ghostY = 0;
let ghostSpeedX = 0;
let ghostSpeedY = 0;
let ghostActive = false;
let lastHitter = null;
let doubleTeamPaddle = null;
let multiBalls = [];
let pauseScreenActive = false;
let ballAtCap = false;
let resetTimer = 0;
let slugTimer = 0;
let savedPaddleSpeed = 0;
let leftAtCap = false;
let rightAtCap = false;
let powerupIsDecoy = false;
let lastPowerupType = null;
let nextBoxTimer = 0;
let trapTimer = null;
let fireActive = false;
let burningPaddle = null;
let smokeRising = false;
let smoke = [];
let dust = [];
let lastPowerupIsDecoy = false;
let pauseButtonHeld = false;
// Functions
// Spawning Particles
function spawnParticles(color, progress) {
    // Count math
    let baseCount = Math.max(3, Math.round(progress * 25));
    let variation = Math.round(Math.random() * 6 - 3);
    let count = Math.max(3, baseCount + variation);

    // Bar's position and center, read fresh every spawn
    let rect = speedBarFillEl.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    let centerY = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        let p = document.createElement("div");
        let size = Math.random() * 7 + 4;

        // Random spawn position along the bar
        let px = rect.left + Math.random() * rect.width;
        let py = rect.top + Math.random() * rect.height;

        p.style.position = "fixed";
        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.background = color;
        p.style.color = color;
        p.style.left = px + "px";
        p.style.top = py + "px";

        // Direction: from bar center outward to this particle's spawn spot
        let angle = Math.atan2(py - centerY, px - centerX);
        angle = angle + (Math.random() - 0.5) * 0.8;   // spread

        // Random distance
        let distance = 100 + Math.random() * 400;
        let flightX = Math.cos(angle) * distance;
        let flightY = Math.sin(angle) * distance;

        p.style.setProperty("--dx", flightX + "px");
        p.style.setProperty("--dy", flightY + "px");
        p.classList.add("particle");

        document.body.appendChild(p);
        setTimeout(function() {
            p.remove();
        }, 500);
    }
}

// Ball Reset
function resetBall() {
    ballX = 400;
    ballY = 300;
    let maxAngle = Math.atan2(300, 400);
    let angle = (Math.random() * 2 - 1) * maxAngle;
    let dirX = Math.random() < 0.5 ? -1 : 1;
    ballSpeedX = Math.cos(angle) * 4 * dirX;
    ballSpeedY = Math.sin(angle) * 4;
    
    leftPaddleSpeed = 6;
    rightPaddleSpeed = 6;
    trail = [];
    activeEffect = null;
    ballSpeedCap = 10;
    paddleSpeedCap = 10;
    capTimer = 0;
    escalationLevel = 0;
    glowOpacity = 0;
    lastHitter = null;
    savedPaddleSpeed = 6;
    sluggedPaddle = null;
    leftPaddleTrail = [];
    rightPaddleTrail = [];
    multiBalls = [];
    clearTimeout(trapTimer);
    frozenPaddle = null;
    powerupIsDecoy = false;
};
// Powerup Spawn (function)
function spawnNewBox() {
    powerupX = 200 + Math.random() * 400;
    powerupY = 100 + Math.random() * 400;
    
    // 1. Prevent the Decoy Trap from happening twice in a row
    if (lastHitter !== null) {
        powerupIsDecoy = Math.random() < 0.4;
        if (powerupIsDecoy && lastPowerupIsDecoy) {
            powerupIsDecoy = false; // Force it to be a real powerup if the last one was a trap
        }
    } else {
        powerupIsDecoy = false;
    }
    lastPowerupIsDecoy = powerupIsDecoy;

    // 2. Roll the powerup type
    let types;
    if (lastHitter === null) {
        types = ["slug", "freeze", "ghost", "multi", "decoy", "null"];
    } else {
        types = ["slug", "freeze", "ghost", "multi", "double team", "decoy", "null",];
    }
    
    powerupType = types[Math.floor(Math.random() * types.length)]; 
    
    // 3. Prevent the same powerup twice in a row (with a safety limit)
    let attempts = 0;
    while (powerupType === lastPowerupType && attempts < 50) {
       powerupType = types[Math.floor(Math.random() * types.length)]; 
       attempts++;
    }
    lastPowerupType = powerupType;
    
};
// Game Loop
function gameLoop() { 
    let prevBallX = ballX;
    let prevBallY = ballY;
    let prevRightPaddleY = rightPaddleY;
    let prevLeftPaddleY = leftPaddleY;
    let prevDecoyX = decoyX;
    let prevDecoyY = decoyY; 
    let prevGhostX = ghostX;
    let prevGhostY = ghostY; 
    let gamepads = navigator.getGamepads();
    // Game controllers
    // J1
        if (gamepads[0]) {
        let stickY = gamepads[0].axes[1]; // Left stick Y-axis

        if (stickY < -0.3) { 
            upPressed = true;
            downPressed = false;
        } else if (stickY > 0.3) { 
            downPressed = true;
            upPressed = false;
        } else {
            upPressed = false;
            downPressed = false;
        }

        // NEW: Pause button logic for Player 1
        if (gamepads[0].buttons[9] && gamepads[0].buttons[9].pressed) {
            if (!pauseButtonHeld) {
                pauseScreenActive = !pauseScreenActive;
                pauseButtonHeld = true; 
            }
        } else {
            pauseButtonHeld = false; 
        }
    }
// J2
// PLAYER 2 (Right Paddle)
    if (gamepads[1]) {
        let stickY = gamepads[1].axes[1]; // Left stick Y-axis

        if (stickY < -0.3) { 
            rightUpPressed = true;
            rightDownPressed = false;
        } else if (stickY > 0.3) { 
            rightDownPressed = true;
            rightUpPressed = false;
        } else {
            rightUpPressed = false;
            rightDownPressed = false;
        }

        // NEW: Pause button logic for Player 2
        if (gamepads[1].buttons[9] && gamepads[1].buttons[9].pressed) {
            if (!pauseButtonHeld) {
                pauseScreenActive = !pauseScreenActive;
                pauseButtonHeld = true; 
            }
        } else {
            pauseButtonHeld = false; 
        }
    }
    // Pause screen 
    if (!pauseScreenActive) {
    // Ball Bounce
    ballX = ballX + ballSpeedX
    ballY = ballY + ballSpeedY
    if (ballY < 0 && ballSpeedY < 0) {
        ballSpeedY = ballSpeedY * -1;
        ballY = 0;
    };
    if (ballY > 580 && ballSpeedY > 0) {
        ballSpeedY = ballSpeedY * -1;
        ballY = 580;
    };
    // Decoy movement
        if (decoyActive) {
    decoyX = decoyX + decoySpeedX;
    decoyY = decoyY + decoySpeedY;
    if (decoyY < 0 && decoySpeedY < 0) {
        decoySpeedY = decoySpeedY * -1;
        decoyY = 0;
    }
    if (decoyY > 580 && decoySpeedY > 0) {
        decoySpeedY = decoySpeedY * -1;
        decoyY = 580;
    }
}
// Ghost movement
if (ghostActive) {
    ghostX = ghostX + ghostSpeedX;
    ghostY = ghostY + ghostSpeedY;
    if (ghostY < 0 && ghostSpeedY < 0) {
        ghostSpeedY = ghostSpeedY * -1;
        ghostY = 0;
    }
    if (ghostY > 580 && ghostSpeedY > 0) {
        ghostSpeedY = ghostSpeedY * -1;
        ghostY = 580;
    }
}
for (let i = 0; i < multiBalls.length; i++) {
    let b = multiBalls[i];
    b.prevX = b.x;
    b.prevY = b.y;
    b.x = b.x + b.speedX;
    b.y = b.y + b.speedY;
    if (b.y < 0 && b.speedY < 0) {
        b.speedY = b.speedY * -1;
        b.y = 0;
    }
    if (b.y > 580 && b.speedY > 0) {
        b.speedY = b.speedY * -1;
        b.y = 580;
    }
}
    // Slug effect
    if (activeEffect === "slug") {
    trailCounter = trailCounter + 1;
    if (trailCounter >= 3) {
        trailCounter = 0;
        trail.push({ x: ballX, y: ballY });
        if (trail.length > 8) {
            trail.shift();
        }
    }
}
    // Powerup Spawn
    // Power-up spawn timer
// Power-up spawn/rotation timer
powerupTimer = powerupTimer + 1;
if (powerupTimer >= nextBoxTimer) {
    powerupTimer = 0;
    nextBoxTimer = 300 + Math.random() * 300;
    powerupActive = false;
    setTimeout(function() {
        powerupActive = true;
        spawnNewBox();
    }, 200 + Math.random() * 300);
        

}
// Powerup Collision
if (powerupActive && ballX + 20 > powerupX && ballX < powerupX + powerupSize && ballY + 20 > powerupY && ballY < powerupY + powerupSize) {

    // These run NO MATTER WHAT (decoy or real)
    powerupActive = false;
    doubleTeamPaddle = null;
    trail = [];
    powerupTimer = 0;
    nextBoxTimer = 300 + Math.random() * 300; 
        if (powerupIsDecoy) {
        frozenPaddle = lastHitter !== null ? lastHitter : (ballSpeedX > 0 ? "left" : "right");
        
        // We save the speed just in case
        let savedSpeedX = ballSpeedX;
        let savedSpeedY = ballSpeedY;
        ballSpeedX = ballSpeedX * 1.5;
        ballSpeedY = ballSpeedY * 1.5;
        
        // Store the timeout ID so we CAN clear it if a goal happens
        trapTimer = setTimeout(function() {
            frozenPaddle = null;
            // Only restore the old speed if the ball hasn't reset
            if (ballSpeedX !== 0 && ballSpeedY !== 0) {
                ballSpeedX = savedSpeedX;
                ballSpeedY = savedSpeedY;
            }
        }, 2500 + Math.random() * 2500);
    } else {
        // REAL POWERUP
        activeEffect = powerupType;

        if (powerupType === "decoy") {
            decoyX = powerupX;
            decoyY = powerupY;
            decoyActive = true;
            let maxAngle = Math.atan2(300, 400);
            let angle = (Math.random() * 2 - 1) * maxAngle;
            let dirX = Math.random() < 0.5 ? -1 : 1;
            let speed = Math.abs(ballSpeedX);
            decoySpeedX = Math.cos(angle) * speed * dirX;
            decoySpeedY = Math.sin(angle) * speed;
        }
        if (powerupType === "ghost") {
            ghostX = powerupX;
            ghostY = powerupY;
            ghostActive = true;
            let maxAngle = Math.atan2(300, 400);
            let angle = (Math.random() * 2 - 1) * maxAngle;
            let dirX = Math.random() < 0.5 ? -1 : 1;
            let speed = Math.abs(ballSpeedX);
            ghostSpeedX = Math.cos(angle) * speed * dirX;
            ghostSpeedY = Math.sin(angle) * speed;
        }
        if (powerupType === "double team") {
            doubleTeamPaddle = lastHitter;
        }
        if (powerupType === "multi") {
            let count = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                let maxAngle = Math.atan2(300, 400);
                let angle = (Math.random() * 2 - 1) * maxAngle;
                let dirX = Math.random() < 0.5 ? -1 : 1;
                let speed = Math.abs(ballSpeedX);
                multiBalls.push({
                    x: powerupX,
                    y: powerupY,
                    speedX: Math.cos(angle) * speed * dirX,
                    speedY: Math.sin(angle) * speed
                });
            }
        }
    }
}
// Powerup Collision end
// Cap escalation
ballAtCap = Math.abs(ballSpeedX) >= ballSpeedCap;
leftAtCap = leftPaddleSpeed >= paddleSpeedCap;
rightAtCap = rightPaddleSpeed >= paddleSpeedCap;
 if (ballAtCap && leftAtCap && rightAtCap) {
    capTimer = capTimer + 1;
    if (capTimer >= 300) {  // 5 seconds at 60fps
        capTimer = 0;
        ballSpeedCap = ballSpeedCap + 5;
        paddleSpeedCap = paddleSpeedCap + 3;
        escalationLevel = escalationLevel + 1;
        glowOpacity = Math.min(glowOpacity + 0.25, 1);
        spawnParticles("#FF6600", 1);
    }
} else {
    capTimer = 0;  // reset the countdown if not fully maxed
}
    // Score
    // Right Score
if (ballX + 20 < 0 && ballSpeedX !== 0) {
    // 1. Capture the current state
    let progress = capTimer / 300;
    let currentColor = "hsl(" + (120 - progress * 120) + ", 100%, 50%)";

    // 2. Spawn particles, if there was progress
    if (capTimer > 0) {
        spawnParticles(currentColor, progress);
    }

    // 3. Empty the bar
    capTimer = 0;

    // 4. Then the rest
    rightScore = rightScore + 1;
    ballSpeedX = 0;
    ballSpeedY = 0;
    setTimeout(resetBall, 800);
    rightScoreEl.textContent = rightScore;
}
    // Left Score
    if (ballX > 800 && ballSpeedX !== 0) {
    // 1. Capture the current state before wiping it
    let progress = capTimer / 300;
    let currentColor = "hsl(" + (120 - progress * 120) + ", 100%, 50%)";

    // 2. Spawn particles from the bar, if there was any progress
    if (capTimer > 0) {
        spawnParticles(currentColor, progress);
    }

    // 3. Empty the bar immediately
    capTimer = 0;

    // 4. Then the rest
    leftScore = leftScore + 1;
    ballSpeedX = 0;
    ballSpeedY = 0;
    setTimeout(resetBall, 800);
    leftScoreEl.textContent = leftScore;
}
// Right Score (decoy)
if (decoyActive && decoyX + 20 < 0) {
    rightScore = rightScore + 1;
    rightScoreEl.textContent = rightScore;
    decoyActive = false;
}

// Left Score (decoy)
if (decoyActive && decoyX > 800) {
    leftScore = leftScore + 1;
    leftScoreEl.textContent = leftScore;
    decoyActive = false;
}
// Right Score (ghost)
if (ghostActive && ghostX > 800) {
    frozenPaddle = "right";
    freezeActive = true;
    ghostActive = false;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500);
}
// Left Score (ghost)
if (ghostActive && ghostX + 20 < 0) {
    frozenPaddle = "left";
    freezeActive = true;
    ghostActive = false;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500);
}for (let i = multiBalls.length - 1; i >= 0; i--) {
    let b = multiBalls[i];
    if (b.x + 20 < 0) {
        rightScore = rightScore + 1;
        rightScoreEl.textContent = rightScore;
        multiBalls.splice(i, 1);
    } else if (b.x > 800) {
        leftScore = leftScore + 1;
        leftScoreEl.textContent = leftScore;
        multiBalls.splice(i, 1);
    }
}
    

    
// Paddle Boundaries
if (leftPaddleY < 0) leftPaddleY = 0;
if (leftPaddleY > 500) leftPaddleY = 500;
if (rightPaddleY < 0) rightPaddleY = 0;
if (rightPaddleY > 500) rightPaddleY = 500;
// Paddle Movement
// Right
if (frozenPaddle !== "right") {
    if (rightUpPressed) rightPaddleY -= rightPaddleSpeed;
    if (rightDownPressed) rightPaddleY += rightPaddleSpeed;
}
// Left
if (frozenPaddle !== "left") {
if (upPressed) leftPaddleY -= leftPaddleSpeed;
if (downPressed) leftPaddleY += leftPaddleSpeed;
}
// Paddle trails
paddleTrailCounter = paddleTrailCounter + 1;
if (paddleTrailCounter >= 3) {
    paddleTrailCounter = 0;
    if (sluggedPaddle === "right") {
        rightPaddleTrail.push(rightPaddleY);
        if (rightPaddleTrail.length > 8) rightPaddleTrail.shift();
    }
    if (sluggedPaddle === "left") {
        leftPaddleTrail.push(leftPaddleY);
        if (leftPaddleTrail.length > 8) leftPaddleTrail.shift();
    }
}
// Paddle Collisions
// Right Paddle Ball Collision
if (prevBallX + 20 <= 760 && ballX + 20 >= 760 && ballX < 780 && ballY + 20 > rightPaddleY && ballY < rightPaddleY + 100 && ballSpeedX > 0) {
    ballX = 740; 
    let hitOffset = (ballY + 10) - (rightPaddleY + 50);
    ballSpeedY = hitOffset / 10;
    ballSpeedX = ballSpeedX * -1;
    lastHitter = "right";
    // Ball Speed Up
    if (ballSpeedX > 0) {
    ballSpeedX = ballSpeedX + 0.5;
} else {
    ballSpeedX = ballSpeedX - 0.5;
}
// Ball Speed Cap
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
// Paddle Speed Up
rightPaddleSpeed = rightPaddleSpeed + 0.35;
// Paddle Speed Cap
if (rightPaddleSpeed > paddleSpeedCap) {
    rightPaddleSpeed = paddleSpeedCap;
}
// Slug effect
if (activeEffect === "slug") {
    savedPaddleSpeed = rightPaddleSpeed;
    rightPaddleSpeed = rightPaddleSpeed * 0.3;
    slugActive = true;
    sluggedPaddle = "right";
    activeEffect = null;
    trail = [];
    rightPaddleTrail = [];
    setTimeout(function() {
    rightPaddleSpeed = savedPaddleSpeed;
        slugActive = false;
        sluggedPaddle = null;
        rightPaddleTrail = [];
    }, 5000);
}
// Freeze Effect
if (activeEffect === "freeze") {
    frozenPaddle = "right";
    freezeActive = true;
    activeEffect = null;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500)
}
};
// Top bounce
let minX = Math.min(prevBallX, ballX);
let maxX = Math.max(prevBallX, ballX) + 20;
if (prevBallY + 20 <= prevRightPaddleY && ballY + 20 >= rightPaddleY && ballSpeedY > 0 && maxX > 760 && minX < 780) {
ballSpeedY = ballSpeedY * -1;
ballY = rightPaddleY - 20;
// Ball Speed Cap
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
// Paddle Speed Up
rightPaddleSpeed = rightPaddleSpeed + 0.35;
// Paddle Speed Cap
if (rightPaddleSpeed > paddleSpeedCap) {
    rightPaddleSpeed = paddleSpeedCap;
}
// Slug effect
if (activeEffect === "slug") {
    let rightSavedSpeed = rightPaddleSpeed;
    rightPaddleSpeed = rightPaddleSpeed * 0.3;
    slugActive = true;
    sluggedPaddle = "right";
    activeEffect = null;
    trail = [];
    rightPaddleTrail = [];
    setTimeout(function() {
        rightPaddleSpeed = rightSavedSpeed;
        slugActive = false;
        sluggedPaddle = null;
        rightPaddleTrail = [];
    }, 5000);
}
// Freeze Effect
if (activeEffect === "freeze") {
    frozenPaddle = "right";
    freezeActive = true;
    activeEffect = null;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500)
}
};
// Bottom Bounce
if (prevBallY >= prevRightPaddleY + 100 && ballY <= rightPaddleY + 100 && ballSpeedY < 0 && maxX > 760 && minX < 780) {
ballSpeedY = ballSpeedY * -1;
ballY = rightPaddleY + 100;
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
rightPaddleSpeed = rightPaddleSpeed + 0.35;
if (rightPaddleSpeed > paddleSpeedCap) {
    rightPaddleSpeed = paddleSpeedCap;
}
if (activeEffect === "slug") {
    let rightSavedSpeed = rightPaddleSpeed;
    rightPaddleSpeed = rightPaddleSpeed * 0.3;
    slugActive = true;
    sluggedPaddle = "right";
    activeEffect = null;
    trail = [];
    rightPaddleTrail = [];
    setTimeout(function() {
        rightPaddleSpeed = rightSavedSpeed;
        slugActive = false;
        sluggedPaddle = null;
        rightPaddleTrail = [];
    }, 5000);
}
if (activeEffect === "freeze") {
    frozenPaddle = "right";
    freezeActive = true;
    activeEffect = null;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500)
} 
};
// Right Paddle Ball Collision end
// Left Paddle Ball Collision
if (prevBallX >= 40 && ballX < 40 && ballX + 20 > 20 && ballY + 20 > leftPaddleY && ballY < leftPaddleY + 100 && ballSpeedX < 0) {
    ballX = 40;
    let hitOffset = (ballY + 10) - (leftPaddleY + 50);
    ballSpeedY = hitOffset / 10;
    ballSpeedX = ballSpeedX * -1;
    lastHitter = "left";
// Ball Speed Up
    if (ballSpeedX > 0) {
    ballSpeedX = ballSpeedX + 0.5;
} else {
    ballSpeedX = ballSpeedX - 0.5;
}
// Speed Cap
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
// Paddle Speed Up
leftPaddleSpeed = leftPaddleSpeed + 0.35;
// Paddle Speed Cap
if (leftPaddleSpeed > paddleSpeedCap) {
    leftPaddleSpeed = paddleSpeedCap;
}
// Slug effect
if (activeEffect === "slug") {
    let leftSavedSpeed = leftPaddleSpeed;
    leftPaddleSpeed = leftPaddleSpeed * 0.3;
    slugActive = true;
    sluggedPaddle = "left";
    activeEffect = null;
    trail = [];
    leftPaddleTrail = [];
    setTimeout(function() {
        leftPaddleSpeed = leftSavedSpeed;
        slugActive = false;
        sluggedPaddle = null;
        leftPaddleTrail = [];
    }, 5000);
}
// Freeze Effect
if (activeEffect === "freeze") {
    frozenPaddle = "left";
    freezeActive = true;
    activeEffect = null;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500)
}
};
// Left top
if (prevBallY + 20 <= prevLeftPaddleY && ballY + 20 >= leftPaddleY && ballSpeedY > 0 && maxX > 20 && minX < 40) {
ballSpeedY = ballSpeedY * -1;
ballY = leftPaddleY - 20;
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
leftPaddleSpeed = leftPaddleSpeed + 0.35;
if (leftPaddleSpeed > paddleSpeedCap) {
    leftPaddleSpeed = paddleSpeedCap;
}
if (activeEffect === "slug") {
    let leftSavedSpeed = leftPaddleSpeed;
    leftPaddleSpeed = leftPaddleSpeed * 0.3;
    slugActive = true;
    sluggedPaddle = "left";
    activeEffect = null;
    trail = [];
    leftPaddleTrail = [];
    setTimeout(function() {
        leftPaddleSpeed = leftSavedSpeed;
        slugActive = false;
        sluggedPaddle = null;
        leftPaddleTrail = [];
    }, 5000);
}
if (activeEffect === "freeze") {
    frozenPaddle = "left";
    freezeActive = true;
    activeEffect = null;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500)
}
};
// Left bottom
if (prevBallY >= prevLeftPaddleY + 100 && ballY <= leftPaddleY + 100 && ballSpeedY < 0 && maxX > 20 && minX < 40) {
ballSpeedY = ballSpeedY * -1;
ballY = leftPaddleY + 100;
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
leftPaddleSpeed = leftPaddleSpeed + 0.35;
if (leftPaddleSpeed > paddleSpeedCap) {
    leftPaddleSpeed = paddleSpeedCap;
}
if (activeEffect === "slug") {
    let leftSavedSpeed = leftPaddleSpeed;
    leftPaddleSpeed = leftPaddleSpeed * 0.3;
    slugActive = true;
    sluggedPaddle = "left";
    activeEffect = null;
    trail = [];
    leftPaddleTrail = [];
    setTimeout(function() {
        leftPaddleSpeed = leftSavedSpeed;
        slugActive = false;
        sluggedPaddle = null;
        leftPaddleTrail = [];
    }, 5000);
}
if (activeEffect === "freeze") {
    frozenPaddle = "left";
    freezeActive = true;
    activeEffect = null;
    setTimeout(function() {
        freezeActive = false;
        frozenPaddle = null;
    }, 2500 + Math.random() * 2500)
}
};
// Left Paddle Ball Collision end
// Mini paddle bounces
if (doubleTeamPaddle === "right" && prevBallX + 20 <= 767 && ballX + 20 >= 767 && ballY + 20 > rightPaddleY - 125 && ballY < rightPaddleY - 55 && ballSpeedX > 0) {
    ballX = 747;
    ballSpeedX = ballSpeedX * -1;
    if (ballSpeedX > 0) {
    ballSpeedX = ballSpeedX + 0.5;
} else {
    ballSpeedX = ballSpeedX - 0.5;
}
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
}
if (doubleTeamPaddle === "right" && prevBallX + 20 <= 767 && ballX + 20 >= 767 && ballY + 20 > rightPaddleY + 155 && ballY < rightPaddleY + 225 && ballSpeedX > 0) {
    ballX = 747;
    ballSpeedX = ballSpeedX * -1;
    if (ballSpeedX > 0) {
    ballSpeedX = ballSpeedX + 0.5;
} else {
    ballSpeedX = ballSpeedX - 0.5;
}
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
}
if (doubleTeamPaddle === "left" && prevBallX >= 32 && ballX < 32 && ballY + 20 > leftPaddleY - 125 && ballY < leftPaddleY - 55 && ballSpeedX < 0) {
    ballX = 32;
    ballSpeedX = ballSpeedX * -1;
    if (ballSpeedX > 0) {
    ballSpeedX = ballSpeedX + 0.5;
} else {
    ballSpeedX = ballSpeedX - 0.5;
}
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
}
if (doubleTeamPaddle === "left" && prevBallX >= 32 && ballX < 32 && ballY + 20 > leftPaddleY + 155 && ballY < leftPaddleY + 225 && ballSpeedX < 0) {
    ballX = 32;
    ballSpeedX = ballSpeedX * -1;
    if (ballSpeedX > 0) {
    ballSpeedX = ballSpeedX + 0.5;
} else {
    ballSpeedX = ballSpeedX - 0.5;
}
if (ballSpeedX > ballSpeedCap) {
    ballSpeedX = ballSpeedCap;
} else if (ballSpeedX < -ballSpeedCap) {
    ballSpeedX = -ballSpeedCap;
}
}
// Overlap Checks
// Right paddle overlap check
if (prevBallX + 20 > 760 && prevBallX < 780 &&
prevBallY + 20 > prevRightPaddleY && prevBallY < prevRightPaddleY + 100 && ballX + 20 > 760 && ballX < 780 && ballY + 20 > rightPaddleY && ballY < rightPaddleY + 100) {
    let distTop = ballY + 20 - rightPaddleY;
    let distBottom = rightPaddleY + 100 - ballY;
    if (distTop < distBottom) {
ballY = rightPaddleY - 20
ballSpeedY = 2 * (rightPaddleY - prevRightPaddleY) - ballSpeedY;
if (ballSpeedY > 0) {
    ballSpeedY = ballSpeedY * -1;
}
    } else {
ballY = rightPaddleY + 100;
ballSpeedY = 2 * (rightPaddleY - prevRightPaddleY) - ballSpeedY;
if (ballSpeedY < 0) {
    ballSpeedY = ballSpeedY * -1;
}
    }
}
// Left Paddle Overlap Check
if (prevBallX < 40 && prevBallX + 20 > 20 && prevBallY + 20 > prevLeftPaddleY && prevBallY < prevLeftPaddleY + 100 && ballX < 40 && ballX + 20 > 20 && ballY + 20 > leftPaddleY && ballY < leftPaddleY + 100) {
    let distTopLeft = ballY + 20 - leftPaddleY;
    let distBottomLeft = leftPaddleY + 100 - ballY;
    if (distTopLeft < distBottomLeft) {
ballY = leftPaddleY - 20
ballSpeedY = 2 * (leftPaddleY - prevLeftPaddleY) - ballSpeedY;
if (ballSpeedY > 0) {
    ballSpeedY = ballSpeedY * -1;
}
    } else {
ballY = leftPaddleY + 100;
ballSpeedY = 2 * (leftPaddleY - prevLeftPaddleY) - ballSpeedY;
if (ballSpeedY < 0) {
    ballSpeedY = ballSpeedY * -1;
}
    }
}
// Decoy face collision - right
if (decoyActive && prevDecoyX + 20 <= 760 && decoyX + 20 >= 760 && decoyY + 20 > rightPaddleY && decoyY < rightPaddleY + 100 && decoySpeedX > 0) {
    decoyX = 740;
    decoySpeedX = decoySpeedX * -1;
}

// Decoy face collision - left
if (decoyActive && prevDecoyX >= 40 && decoyX < 40 && decoyY + 20 > leftPaddleY && decoyY < leftPaddleY + 100 && decoySpeedX < 0) {
    decoyX = 40;
    decoySpeedX = decoySpeedX * -1;
}

// Decoy min/max X for top/bottom checks
let dMinX = Math.min(prevDecoyX, decoyX);
let dMaxX = Math.max(prevDecoyX, decoyX) + 20;

// Decoy top - right
if (decoyActive && prevDecoyY + 20 <= prevRightPaddleY && decoyY + 20 >= rightPaddleY && decoySpeedY > 0 && dMaxX > 760 && dMinX < 780) {
    decoyY = rightPaddleY - 20;
    decoySpeedY = decoySpeedY * -1;
}

// Decoy bottom - right
if (decoyActive && prevDecoyY >= prevRightPaddleY + 100 && decoyY <= rightPaddleY + 100 && decoySpeedY < 0 && dMaxX > 760 && dMinX < 780) {
    decoyY = rightPaddleY + 100;
    decoySpeedY = decoySpeedY * -1;
}

// Decoy top - left
if (decoyActive && prevDecoyY + 20 <= prevLeftPaddleY && decoyY + 20 >= leftPaddleY && decoySpeedY > 0 && dMaxX > 20 && dMinX < 40) {
    decoyY = leftPaddleY - 20;
    decoySpeedY = decoySpeedY * -1;
}

// Decoy bottom - left
if (decoyActive && prevDecoyY >= prevLeftPaddleY + 100 && decoyY <= leftPaddleY + 100 && decoySpeedY < 0 && dMaxX > 20 && dMinX < 40) {
    decoyY = leftPaddleY + 100;
    decoySpeedY = decoySpeedY * -1;
}
// Ghost collisions
// Ghost face collision - right
if (ghostActive && prevGhostX + 20 <= 760 && ghostX + 20 >= 760 && ghostY + 20 > rightPaddleY && ghostY < rightPaddleY + 100 && ghostSpeedX > 0) {
    ghostX = 740;
    ghostSpeedX = ghostSpeedX * -1;
}

// Ghost face collision - left
if (ghostActive && prevGhostX >= 40 && ghostX < 40 && ghostY + 20 > leftPaddleY && ghostY < leftPaddleY + 100 && ghostSpeedX < 0) {
    ghostX = 40;
    ghostSpeedX = ghostSpeedX * -1;
}

// Ghost min/max X for top/bottom checks
let gMinX = Math.min(prevGhostX, ghostX);
let gMaxX = Math.max(prevGhostX, ghostX) + 20;

// Ghost top - right
if (ghostActive && prevGhostY + 20 <= prevRightPaddleY && ghostY + 20 >= rightPaddleY && ghostSpeedY > 0 && gMaxX > 760 && gMinX < 780) {
    ghostY = rightPaddleY - 20;
    ghostSpeedY = ghostSpeedY * -1;
}

// Ghost bottom - right
if (ghostActive && prevGhostY >= prevRightPaddleY + 100 && ghostY <= rightPaddleY + 100 && ghostSpeedY < 0 && gMaxX > 760 && gMinX < 780) {
    ghostY = rightPaddleY + 100;
    ghostSpeedY = ghostSpeedY * -1;
}

// Ghost top - left
if (ghostActive && prevGhostY + 20 <= prevLeftPaddleY && ghostY + 20 >= leftPaddleY && ghostSpeedY > 0 && gMaxX > 20 && gMinX < 40) {
    ghostY = leftPaddleY - 20;
    ghostSpeedY = ghostSpeedY * -1;
}

// Ghost bottom - left
if (ghostActive && prevGhostY >= prevLeftPaddleY + 100 && ghostY <= leftPaddleY + 100 && ghostSpeedY < 0 && gMaxX > 20 && gMinX < 40) {
    ghostY = leftPaddleY + 100;
    ghostSpeedY = ghostSpeedY * -1;
}
for (let i = 0; i < multiBalls.length; i++) {
    let b = multiBalls[i];
    let mMinX = Math.min(b.prevX, b.x);
    let mMaxX = Math.max(b.prevX, b.x) + 20;

    if (b.prevX + 20 <= 760 && b.x + 20 >= 760 && b.y + 20 > rightPaddleY && b.y < rightPaddleY + 100 && b.speedX > 0) {
        b.x = 740;
        b.speedX = b.speedX * -1;
    }
    if (b.prevX >= 40 && b.x < 40 && b.y + 20 > leftPaddleY && b.y < leftPaddleY + 100 && b.speedX < 0) {
        b.x = 40;
        b.speedX = b.speedX * -1;
    }
    if (b.prevY + 20 <= prevRightPaddleY && b.y + 20 >= rightPaddleY && b.speedY > 0 && mMaxX > 760 && mMinX < 780) {
        b.y = rightPaddleY - 20;
        b.speedY = b.speedY * -1;
    }
    if (b.prevY >= prevRightPaddleY + 100 && b.y <= rightPaddleY + 100 && b.speedY < 0 && mMaxX > 760 && mMinX < 780) {
        b.y = rightPaddleY + 100;
        b.speedY = b.speedY * -1;
    }
    if (b.prevY + 20 <= prevLeftPaddleY && b.y + 20 >= leftPaddleY && b.speedY > 0 && mMaxX > 20 && mMinX < 40) {
        b.y = leftPaddleY - 20;
        b.speedY = b.speedY * -1;
    }
    if (b.prevY >= prevLeftPaddleY + 100 && b.y <= leftPaddleY + 100 && b.speedY < 0 && mMaxX > 20 && mMinX < 40) {
        b.y = leftPaddleY + 100;
        b.speedY = b.speedY * -1;
    }
}
    }
// Paint the whole canvas black first
ctx.fillStyle = "black";
ctx.fillRect(0, 0, 800, 600);
// Power-up
if (powerupActive) {
    let bob = Math.sin(Date.now() / 300) * 3;
    
    // Pick the color based on whether it's a decoy
    let boxColor = powerupIsDecoy ? "#29bd0f" : "#39FF14";
    
    ctx.shadowColor = boxColor;
    ctx.shadowBlur = 20;
    ctx.fillStyle = boxColor;
    ctx.fillRect(powerupX, powerupY + bob, powerupSize, powerupSize);
    // Dark blue inner square
    ctx.shadowBlur = 0; // turn off glow so the inner square doesn't glow
    ctx.fillStyle = "#1e4a6e";
    ctx.fillRect(powerupX + 4, powerupY + 4 + bob, 22, 22);
    
    // Cyan pixel "?"
    ctx.fillStyle = "#7FE8FF";
    let pixels = [
        [1, 0], [2, 0], [3, 0],
        [0, 1], [4, 1],
        [4, 2],
        [3, 3],
        [2, 4],
        [2, 6],
    ];
    for (let p of pixels) {
        ctx.fillRect(powerupX + 7 + p[0] * 3, powerupY + 5 + p[1] * 3 + bob, 3, 3);
    }
}
// 2. Now paint the objects
// Slowed paddle trails
if (sluggedPaddle === "left") {
    for (let i = 0; i < leftPaddleTrail.length; i++) {
        let alpha = (i + 1) / (leftPaddleTrail.length + 1);
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = "#00C3E3";
        ctx.fillRect(20, leftPaddleTrail[i], 20, 100);
    }
    ctx.globalAlpha = 1;
}
if (sluggedPaddle === "right") {
    for (let i = 0; i < rightPaddleTrail.length; i++) {
        let alpha = (i + 1) / (rightPaddleTrail.length + 1);
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = "#FF3C28";
        ctx.fillRect(760, rightPaddleTrail[i], 20, 100);
    }
    ctx.globalAlpha = 1;
}
// Left paddle
ctx.shadowColor = "#FF6900";
ctx.shadowBlur = glowOpacity * 50;
ctx.fillStyle = "#00C3E3";
ctx.fillRect(20, leftPaddleY, 20, 100);
ctx.strokeStyle = "#333333";
ctx.lineWidth = 3;
ctx.strokeRect(20, leftPaddleY, 20, 100);
// Right paddle
ctx.fillStyle = "#FF3C28";
ctx.fillRect(760, rightPaddleY, 20, 100);
ctx.strokeStyle = "#333333";
ctx.strokeRect(760, rightPaddleY, 20, 100);
ctx.shadowBlur = 0;
// Extra paddles
if (doubleTeamPaddle === "right") {
    ctx.fillStyle = "#FF3C28";
    ctx.fillRect(767, rightPaddleY - 125, 5, 70);
    ctx.fillRect(767, rightPaddleY + 155, 5, 70);
}
if (doubleTeamPaddle === "left") {
    ctx.fillStyle = "#00C3E3";
    ctx.fillRect(27, leftPaddleY - 125, 5, 70);
    ctx.fillRect(27, leftPaddleY + 155, 5, 70);
}
// Freeze color
// Right freeze color
if (frozenPaddle === "right") {
    ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(760, rightPaddleY, 20, 100)
    ctx.globalAlpha = 1;
}
// Left freeze color
if (frozenPaddle === "left") {
    ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(20, leftPaddleY, 20, 100)
    ctx.globalAlpha = 1;
}
// Slug ball trail
if (activeEffect === "slug") {
    for (let i = 0; i < trail.length; i++) {
        let alpha = (i + 1) / (trail.length + 1);
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = "#39FF14";
        ctx.fillRect(trail[i].x, trail[i].y, 20, 20);
    }
    ctx.globalAlpha = 1;
}
// Ball
if (activeEffect === "freeze") {
    // Icy blue ball — the freeze is armed
    ctx.shadowColor = "#87CEEB";
    ctx.shadowBlur = 25;
    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(ballX, ballY, 20, 20);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    // Cyan outline
    ctx.strokeStyle = "#00E5FF";
    ctx.lineWidth = 2;
    ctx.strokeRect(ballX, ballY, 20, 20);
} else {
    // Normal yellow ball
    ctx.shadowColor = "#FF6900";
    ctx.shadowBlur = glowOpacity * 50;
    ctx.fillStyle = "#FFE600";
    ctx.fillRect(ballX, ballY, 20, 20);
    ctx.strokeStyle = "#ec0c96";
    ctx.lineWidth = 2;
    ctx.strokeRect(ballX, ballY, 20, 20);
    ctx.shadowBlur = 0;
}
// Ball End
// Decoy
if (decoyActive) {
    ctx.globalAlpha = 0.7 + Math.random() * 0.3;
    ctx.shadowColor = "#FF6600";
    ctx.shadowBlur = glowOpacity * 50;
    ctx.fillStyle = "#FFE600";
    ctx.fillRect(decoyX, decoyY, 20, 20);
    ctx.strokeStyle = "#ec0c96";
    ctx.lineWidth = 2;
    ctx.strokeRect(decoyX, decoyY, 20, 20);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}
// Ghost
if (ghostActive) {
    // Faint yellow base (barely there, just to give it some body)
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#FFE600";
    ctx.fillRect(ghostX, ghostY, 20, 20);

    // Blue, flickering, dominant
    ctx.globalAlpha = 0.4 + Math.random() * 0.2;
    ctx.fillStyle = "#5CB8FF";       // cooler blue
    ctx.fillRect(ghostX, ghostY, 20, 20);

    // Outline — pale blue, cold
    ctx.globalAlpha = 0.85 + Math.random() * 0.1;
    ctx.strokeStyle = "#00FFAA";
    ctx.lineWidth = 2;
    ctx.strokeRect(ghostX, ghostY, 20, 20);
    ctx.globalAlpha = 1;
}
for (let i = 0; i < multiBalls.length; i++) {
    let b = multiBalls[i];
    ctx.fillStyle = "#FFE600";
    ctx.fillRect(b.x, b.y, 20, 20);
    ctx.strokeStyle = "#ec0c96";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, 20, 20);
}
if (pauseScreenActive) {
    // Pulsing blue dim
    let pulse = 0.4 + Math.sin(Date.now() / 300) * 0.1;
    ctx.fillStyle = "rgba(0, 0, 0, " + pulse + ")";
    ctx.fillRect(0, 0, 800, 600);

    // Scanlines
    for (let y = 0; y < 600; y += 4) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, y, 800, 2);
    }

    ctx.textAlign = "center";

    // PAUSED with white glow + flicker
    let flicker = Math.random() < 0.05 ? 0.3 : 1;
    ctx.globalAlpha = flicker;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 60px Arial";
    ctx.fillText("PAUSED", 400, 200);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Pong: with blue glow
    ctx.shadowColor = "#00C3E3";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#00C3E3";
    ctx.font = "bold 60px Arial";
    ctx.fillText("Pong:", 400, 320);
    ctx.shadowBlur = 0;

    // 2026 Remake with red glow
    ctx.shadowColor = "#FF3C28";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#FF3C28";
    ctx.font = "bold 60px Impact, sans-serif";
    ctx.fillText("2026 Remake", 400, 400);
    ctx.shadowBlur = 0;

    ctx.textAlign = "left";
}
// Fill progress
if (ballAtCap && leftAtCap && rightAtCap) {
    let progress = capTimer / 300;
    speedBarFillEl.style.width = (progress * 100) + "%";
speedBarFillEl.style.background = "hsl(" + (120 - progress * 120) + ", 100%, 50%)";
} else {
    speedBarFillEl.style.width = "0%";
};
fpsCounter++;
if (Date.now() - fpsLast >= 1000) {
    fpsCounter = 0;
    fpsLast = Date.now();
}
requestAnimationFrame(gameLoop);
};
document.addEventListener("keydown", function(event) {
if (event.key === "q") {
    upPressed = true 
}
if (event.key === "a") {
    downPressed = true
}
if (event.key === "ArrowUp") {
    rightUpPressed = true;
}
if (event.key === "ArrowDown") {
    rightDownPressed = true;
}
if (event.key === " ") {
pauseScreenActive = !pauseScreenActive;
if (pauseScreenActive === true) { 
    console.log("Paused");
} else {
    console.log("Unpaused");
}
}
});
document.addEventListener("keyup", function(event) {
if (event.key === "w") upPressed = false;
if (event.key === "s") downPressed = false;
if (event.key === "ArrowUp") rightUpPressed = false;
if (event.key === "ArrowDown") rightDownPressed = false;
});
window.addEventListener("gamepadconnected", (event) => {
    console.log("CONTROLLER CONNECTED! Index:", event.gamepad.index);
    // A visual alert so you don't have to open the console
    alert("Controller " + event.gamepad.index + " connected!"); 
});
resetBall();
gameLoop();