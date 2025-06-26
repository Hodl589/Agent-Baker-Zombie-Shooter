import { Particle } from './particle.js';
import * as combat from './player/playerCombat.js';
import * as abilities from './player/playerAbilities.js';
import * as upgrades from './player/playerUpgrades.js';

/* @tweakable Player speed multiplier during bullet time. 1 means player is slowed down with the world. >1 means player is faster than the slowed-down world. (e.g. a value of 5 means player moves at normal speed while world is slowed to 20%). */
const PLAYER_BULLET_TIME_SPEED_MULTIPLIER = 3;

/* @tweakable The ratio of shooting range to grenade range. shootRange is derived from this and grenadeRange. */
const SHOOT_RANGE_GRENADE_RANGE_RATIO = 0.5;

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        /* @tweakable player size */
        this.size = 15;
        /* @tweakable player movement speed */
        this.speed = 200;
        
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.xp = 0;
        /* @tweakable The base amount of XP required to reach level 2. */
        this.xpRequired = 100;
        
        /* @tweakable Player base shooting cooldown in seconds. */
        this.shootCooldown = 0.5;
        this.lastShotTimestamp = 0; // Use a timestamp for cooldowns to be immune to pausing.

        /* @tweakable bullet damage */
        this.bulletDamage = 30;
        /* @tweakable base damage for spikes */
        this.spikeDamage = 40;
        /* @tweakable number of bullets per shot */
        this.bulletCount = 1;
        /* @tweakable bullet spread of bullets in radians for multi-shot. Higher is less accurate. A smaller value makes shots more focused by default. */
        this.bulletSpread = 0.4;
        /* @tweakable XP magnet range */
        this.xpMagnetRange = 50;
        /** 
         * @tweakable auto-aim shooting range. This is the radius around the player in which enemies will be automatically targeted.
         * A larger value means the player will start shooting at enemies further away.
         * This value is derived from grenadeRange and SHOOT_RANGE_GRENADE_RANGE_RATIO.
         */
        /* @tweakable The player's grenade throw range. The shooting range is calculated from this value. */
        this.grenadeRange = 250;
        this.shootRange = this.grenadeRange * SHOOT_RANGE_GRENADE_RANGE_RATIO;
        /* @tweakable base damage for grenades */
        this.grenadeDamage = 100;
        /* @tweakable base radius for grenades */
        this.grenadeRadius = 80;
        
        /* @tweakable XP gain multiplier */
        this.xpGainMultiplier = 1;
        
        this.moveDirection = { x: 0, y: 0 };
        /* @tweakable max grenades */
        this.maxGrenades = 3;
        this.currentGrenades = 3;
        /* @tweakable Time in seconds to regenerate one grenade. 0 means no regen. Set by upgrades. */
        this.grenadeRegenCooldown = 0;
        this.grenadeRegenTimer = 0;
        
        // Upgrade-controlled properties
        /* @tweakable healing per second from regeneration upgrade */
        this.regenRate = 0;
        this.hasLightning = false;
        /* @tweakable number of times lightning can chain */
        this.lightningBounces = 3;
        /* @tweakable range lightning can chain to another enemy */
        this.lightningRange = 250;
        /* @tweakable damage multiplier for chained lightning hits */
        this.lightningDamageMultiplier = 0.7;

        // Boss-reward flags
        this.plasmaCannon = false;
        this.explosiveRounds = false;
        
        /* @tweakable max number of shields player can have */
        this.maxShields = 0;
        this.currentShields = 0;
        /* @tweakable time in seconds to regenerate one shield */
        this.shieldRegenCooldown = 30;
        this.shieldRegenTimer = 0;
        this.shieldAngle = 0;
        
        // More boss upgrades
        /* @tweakable percentage of damage dealt returned as health */
        this.lifesteal = 0;
        /* @tweakable flat damage reflected to attackers */
        this.thornsDamage = 0;
        /* @tweakable whether the player can survive one lethal hit */
        this.hasFinalStand = false;
        this.finalStandReady = true;
        this.finalStandCooldown = 30.0;
        this.finalStandCooldownTimer = 0;
        this.finalStandActive = false;
        /* @tweakable duration of final stand buff in seconds */
        this.finalStandBuffDuration = 5.0;
        this.finalStandBuffTimer = 0;

        this.isInvincible = false;

        // Time Stop Ability
        /* @tweakable does player have the time stop ability */
        this.hasTimeStop = false;
        /* @tweakable cooldown for time stop ability in seconds */
        this.timeStopCooldown = 60; 
        this.timeStopTimer = 0;

        // Dash ability
        /* @tweakable does player have the dash ability */
        this.hasDash = true;
        /* @tweakable cooldown for dash ability in seconds */
        this.dashCooldown = 6.5;
        this.dashCooldownTimer = 0;
        /* @tweakable duration of the dash in seconds */
        this.dashDuration = 0.15;
        /* @tweakable speed multiplier during dash */
        this.dashSpeedMultiplier = 5;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = { x: 0, y: 0 };
        this.dashHitEnemies = new Set();
        this.hasSlashDash = false;
        /* @tweakable damage dealt by dashing through enemies with Slash Dash upgrade */
        this.slashDashDamage = 100;
        this.magnetTimer = 0;
    }
    
    update(deltaTime, gameState, canvasWidth, canvasHeight, worldSize, isMobile) {
        upgrades.updatePassiveSystems(this, deltaTime);
        abilities.updateDashState(this, deltaTime, gameState);

        // Keep player in world
        this.x = Math.max(this.size, Math.min(worldSize.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(worldSize.height - this.size, this.y));

        combat.handleAutoShooting(this, gameState);
    }
    
    move(dx, dy, deltaTime, isBulletTime = false) {
        if (this.isDashing) return;

        let finalSpeed = this.speed;
        if (isBulletTime) {
            finalSpeed *= PLAYER_BULLET_TIME_SPEED_MULTIPLIER;
        }

        if (this.finalStandActive) {
            /* @tweakable speed boost during Final Stand buff (1.3 = 30%) */
            finalSpeed *= 1.3;
        }

        if (this.hasAdrenaline && this.health / this.maxHealth < 0.25) {
            /* @tweakable speed boost from Adrenaline upgrade at low health (1.5 = 50%) */
            finalSpeed *= 1.5;
        }

        this.x += dx * finalSpeed * deltaTime;
        this.y += dy * finalSpeed * deltaTime;
    }
    
    takeDamage(damage, gameState) {
        if (this.isInvincible || this.isDashing) return;

        // End bullet time if it's active and triggered the hit
        if (gameState.isBulletTime) {
            gameState.isBulletTime = false;
            gameState.bulletTimeTriggeredBy = null;
        }

        if (this.currentShields > 0) {
            this.currentShields--;
            if (gameState && gameState.shieldBreakEvents) {
                gameState.shieldBreakEvents.push({ x: this.x, y: this.y });
            }
            return;
        }

        if (this.health - damage <= 0 && this.hasFinalStand && this.finalStandReady) {
            this.finalStandReady = false;
            this.finalStandCooldownTimer = this.finalStandCooldown;
            this.health = 1;
    
            // Activate buff
            this.finalStandActive = true;
            this.finalStandBuffTimer = this.finalStandBuffDuration;
            this.isInvincible = true;
            /* @tweakable duration of invincibility after Final Stand triggers */
            setTimeout(() => { 
                // Only turn off invincibility if the buff is over.
                if (!this.finalStandActive) this.isInvincible = false; 
            }, this.finalStandBuffDuration * 1000);
            return;
        }

        this.health = Math.max(0, this.health - damage);
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    addXp(amount) {
        this.xp += amount * this.xpGainMultiplier;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpRequired;
        /** @tweakable How much the XP requirement increases each level (e.g., 1.5 = 50% increase). */
        const xpScalingFactor = 1.5;
        this.xpRequired = Math.floor(this.xpRequired * xpScalingFactor);
        
        // Regenerate 1 grenade on level up
        /* @tweakable grenades regenerated per level up */
        this.currentGrenades = Math.min(this.maxGrenades, this.currentGrenades + 1);
    }

    draw(ctx) {
        // Player body
        /* @tweakable The base color of the player's armor. */
        const playerColor = '#4a9eff';
        /* @tweakable The color of the player's visor. */
        const visorColor = '#222222';
        
        ctx.save();
        ctx.translate(this.x, this.y);

        // Main body with gradient for depth
        const bodyGradient = ctx.createRadialGradient(0, -this.size * 0.2, 0, 0, 0, this.size);
        bodyGradient.addColorStop(0, '#88cfff');
        bodyGradient.addColorStop(0.5, playerColor);
        bodyGradient.addColorStop(1, '#2a7edc');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Visor
        ctx.fillStyle = visorColor;
        ctx.beginPath();
        ctx.ellipse(0, -this.size * 0.1, this.size * 0.6, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Visor highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.2, -this.size * 0.2, this.size * 0.2, this.size * 0.1, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw player outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Draw shields (these orbit, so they are drawn outside the saved/restored context)
        if (this.currentShields > 0) {
            /* @tweakable distance of shields from player */
            const shieldOrbitRadius = this.size + 20;
            /* @tweakable size of each shield orb */
            const shieldOrbSize = 8;
            /* @tweakable The core color of the shield orbs. */
            const shieldCoreColor = 'rgba(170, 221, 255, 0.8)';
            /* @tweakable The glow color of the shield orbs. */
            const shieldGlowColor = 'rgba(100, 150, 255, 0.5)';

            for (let i = 0; i < this.currentShields; i++) {
                const angle = this.shieldAngle + (i * (Math.PI * 2 / this.maxShields));
                const x = this.x + Math.cos(angle) * shieldOrbitRadius;
                const y = this.y + Math.sin(angle) * shieldOrbitRadius;
                
                // Glow
                const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, shieldOrbSize * 2);
                glowGradient.addColorStop(0, shieldGlowColor);
                glowGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(x, y, shieldOrbSize * 2, 0, Math.PI * 2);
                ctx.fill();

                // Core orb
                ctx.fillStyle = shieldCoreColor;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(x, y, shieldOrbSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }
}