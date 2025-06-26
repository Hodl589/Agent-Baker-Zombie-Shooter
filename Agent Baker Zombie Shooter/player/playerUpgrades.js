/**
 * Updates all passive player systems, timers, and cooldowns.
 * @param {import('../player.js').Player} player The player object.
 * @param {number} deltaTime Time since last frame.
 */
export function updatePassiveSystems(player, deltaTime) {
    // Cooldowns and Timers
    if (player.dashCooldownTimer > 0) player.dashCooldownTimer -= deltaTime;
    if (player.timeStopTimer > 0) player.timeStopTimer -= deltaTime;
    if (player.magnetTimer > 0) player.magnetTimer -= deltaTime;

    // Final Stand
    if (player.finalStandCooldownTimer > 0) {
        player.finalStandCooldownTimer -= deltaTime;
        if (player.finalStandCooldownTimer <= 0) {
            player.finalStandReady = true;
        }
    }
    if (player.finalStandActive) {
        player.finalStandBuffTimer -= deltaTime;
        if (player.finalStandBuffTimer <= 0) {
            player.finalStandActive = false;
            player.isInvincible = false;
        }
    }

    // Regenerations
    if (player.regenRate > 0) {
        player.heal(player.regenRate * deltaTime);
    }
    if (player.maxShields > 0 && player.currentShields < player.maxShields) {
        player.shieldRegenTimer += deltaTime;
        if (player.shieldRegenTimer >= player.shieldRegenCooldown) {
            player.currentShields++;
            player.shieldRegenTimer = 0;
        }
    }
    if (player.grenadeRegenCooldown > 0 && player.currentGrenades < player.maxGrenades) {
        player.grenadeRegenTimer += deltaTime;
        if (player.grenadeRegenTimer >= player.grenadeRegenCooldown) {
            const grenadesToAdd = Math.floor(player.grenadeRegenTimer / player.grenadeRegenCooldown);
            player.currentGrenades = Math.min(player.maxGrenades, player.currentGrenades + grenadesToAdd);
            player.grenadeRegenTimer %= player.grenadeRegenCooldown;
        }
    }

    // Shield orbit animation
    /* @tweakable shield orbital rotation speed */
    const shieldRotationSpeed = 1;
    player.shieldAngle += shieldRotationSpeed * deltaTime;
}