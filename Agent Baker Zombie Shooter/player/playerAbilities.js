import { Particle } from '../particle.js';

/* @tweakable Multiplier for time stop field radius based on grenade range. */
const TIME_STOP_RADIUS_MULTIPLIER = 0.5;
/* @tweakable Duration of the time stop field in seconds */
const TIME_STOP_DURATION = 20;
/* @tweakable Whether the time stop field follows the player */
const TIME_STOP_FOLLOWS_PLAYER = true;

/**
 * Checks if the player can use the Time Stop ability.
 * @param {import('../player.js').Player} player The player object.
 * @returns {boolean}
 */
export function canUseTimeStop(player) {
    return player.hasTimeStop && player.timeStopTimer <= 0;
}

/**
 * Activates the Time Stop ability.
 * @param {import('../player.js').Player} player The player object.
 * @param {import('../gameState.js').GameState} gameState The game state.
 * @returns {boolean} True if the ability was used successfully.
 */
export function useTimeStop(player, gameState) {
    if (!canUseTimeStop(player)) return false;
    player.timeStopTimer = player.timeStopCooldown;
    
    const radius = player.grenadeRange * TIME_STOP_RADIUS_MULTIPLIER;
    gameState.slowZones.push({
        x: player.x,
        y: player.y,
        radius: radius,
        duration: TIME_STOP_DURATION,
        timeLeft: TIME_STOP_DURATION,
        animTime: 0,
        followsPlayer: TIME_STOP_FOLLOWS_PLAYER
    });

    return true;
}

/**
 * Activates the Dash ability.
 * @param {import('../player.js').Player} player The player object.
 * @param {{x: number, y: number}} direction The direction of the dash.
 * @param {import('../gameState.js').GameState} gameState The game state.
 * @returns {boolean} True if the ability was used successfully.
 */
export function useDash(player, direction, gameState) {
    if (!player.hasDash || player.dashCooldownTimer > 0 || player.isDashing) return false;
    if (direction.x === 0 && direction.y === 0) return false;

    player.isDashing = true;
    player.dashTimer = player.dashDuration;
    player.dashCooldownTimer = player.dashCooldown;
    player.dashHitEnemies.clear();
    
    const magnitude = Math.hypot(direction.x, direction.y);
    if (magnitude > 0) {
        player.dashDirection.x = direction.x / magnitude;
        player.dashDirection.y = direction.y / magnitude;
    } else {
         player.dashDirection = { x: 1, y: 0 }; // Default dash direction
    }
    
    // Dash particle burst
    if (gameState && gameState.particles) {
        for (let i = 0; i < 15; i++) {
            const p = new Particle(player.x, player.y, '#ffffff', 0.6);
            const angle = Math.atan2(player.dashDirection.y, player.dashDirection.x) + (Math.random() - 0.5) * Math.PI;
            p.vx = Math.cos(angle) * (100 + Math.random() * 50);
            p.vy = Math.sin(angle) * (100 + Math.random() * 50);
            gameState.particles.push(p);
        }
    }

    return true;
}

/**
 * Updates the player's state while dashing.
 * @param {import('../player.js').Player} player The player object.
 * @param {number} deltaTime Time since last frame.
 * @param {import('../gameState.js').GameState} gameState The game state.
 */
export function updateDashState(player, deltaTime, gameState) {
    if (player.isDashing) {
        player.dashTimer -= deltaTime;
        const actualSpeed = player.speed * player.dashSpeedMultiplier;
        player.x += player.dashDirection.x * actualSpeed * deltaTime;
        player.y += player.dashDirection.y * actualSpeed * deltaTime;

        if (gameState && gameState.particles) {
            gameState.particles.push(new Particle(player.x, player.y, '#ffffff', 0.4));
        }

        if (player.dashTimer <= 0) {
            player.isDashing = false;
        }
    }
}
