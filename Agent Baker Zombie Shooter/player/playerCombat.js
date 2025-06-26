import { Bullet } from '../bullet.js';
import { Grenade } from '../grenade.js';

/**
 * Gets the player's effective shooting cooldown, considering all upgrades.
 * @param {import('../player.js').Player} player The player object.
 * @returns {number} The effective cooldown in milliseconds.
 */
export function getEffectiveShootCooldown(player) {
    let effectiveCooldown = player.shootCooldown;
    if (player.plasmaCannon) {
        /* @tweakable Fire rate multiplier for plasma cannon (e.g., 1.5 makes it shoot 50% slower). */
        const plasmaFireRateSlowdown = 1.5;
        effectiveCooldown *= plasmaFireRateSlowdown;
    }
    if (player.finalStandActive) {
        /* @tweakable Cooldown multiplier during Final Stand buff (e.g. 0.4 means 60% faster shooting). */
        const finalStandAttackSpeedMultiplier = 0.4;
        effectiveCooldown *= finalStandAttackSpeedMultiplier;
    }
    return effectiveCooldown * 1000; // Convert to milliseconds
}

/**
 * Checks if the player can shoot.
 * @param {import('../player.js').Player} player The player object.
 * @returns {boolean}
 */
export function canShoot(player) {
    return performance.now() - player.lastShotTimestamp >= getEffectiveShootCooldown(player);
}

/**
 * Creates and fires bullets from the player.
 * @param {import('../player.js').Player} player The player object.
 * @param {number} targetX The x-coordinate of the target.
 * @param {number} targetY The y-coordinate of the target.
 * @param {Bullet[]} bullets The array to add new bullets to.
 */
export function shoot(player, targetX, targetY, bullets) {
    player.lastShotTimestamp = performance.now();
    const angle = Math.atan2(targetY - player.y, targetX - player.x);

    for (let i = 0; i < player.bulletCount; i++) {
        const spread = (i - (player.bulletCount - 1) / 2) * player.bulletSpread;
        const bulletAngle = angle + spread;
        const b = new Bullet(player.x, player.y, bulletAngle, player.bulletDamage);
        
        if (player.finalStandActive) {
            /* @tweakable damage boost during Final Stand buff (1.1 = 10%) */
            b.damage *= 1.1;
        }

        if (player.plasmaCannon) {
            b.pierce = true;
            /* @tweakable damage multiplier for plasma cannon */
            b.damage *= 0.75; 
            /* @tweakable color for plasma cannon bullets */
            b.color = '#ffffff';
            /* @tweakable is plasma bullet flag for special rendering */
            b.isPlasma = true;
        }
        bullets.push(b);
    }
}

/**
 * Throws a grenade towards the nearest enemy.
 * @param {import('../player.js').Player} player The player object.
 * @param {import('../gameState.js').GameState} gameState The game state.
 */
export function throwGrenade(player, gameState) {
    if (player.currentGrenades < 1) return;

    let closestZombie = null;
    let closestDistance = Infinity;
    
    for (const zombie of gameState.zombies) {
        const dist = Math.hypot(zombie.x - player.x, zombie.y - player.y);
        if (dist < closestDistance) {
            closestZombie = zombie;
            closestDistance = dist;
        }
    }
    
    let targetX = closestZombie ? closestZombie.x : player.x + 100;
    let targetY = closestZombie ? closestZombie.y : player.y;
    
    gameState.grenades.push(new Grenade(
        player.x, player.y, 
        targetX, targetY,
        player.grenadeDamage,
        player.grenadeRadius,
        player.grenadeRange
    ));
    player.currentGrenades--;
}

/**
 * Finds a target and shoots if possible.
 * @param {import('../player.js').Player} player The player object.
 * @param {import('../gameState.js').GameState} gameState The game state.
 */
export function handleAutoShooting(player, gameState) {
    if (!canShoot(player)) return;
    
    let closestZombie = null;
    let closestDistance = player.shootRange;
    
    for (const zombie of gameState.zombies) {
        const dist = Math.hypot(zombie.x - player.x, zombie.y - player.y);
        if (dist < closestDistance) {
            closestZombie = zombie;
            closestDistance = dist;
        }
    }
    
    gameState.autoAimTarget = closestZombie;

    if (closestZombie) {
        shoot(player, closestZombie.x, closestZombie.y, gameState.bullets);
    }
}