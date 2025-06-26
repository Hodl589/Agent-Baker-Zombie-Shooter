import { EnemyProjectile } from './enemyProjectile.js';
import { Particle } from './particle.js';
import { Zombie } from './zombie.js'; // For summoning
import { BOSS_TYPES } from './boss_types.js';
import { darkenColor } from './utils.js';

/* @tweakable The speed multiplier for bosses inside a time stop field. 0.5 is 50% speed. */
const TIME_STOP_BOSS_SPEED_MULTIPLIER = 0.5;
/* @tweakable The attack speed multiplier for bosses inside a time stop field. 0.5 is 50% attack speed. */
const TIME_STOP_BOSS_ATTACK_SPEED_MULTIPLIER = 0.5;

export class Boss {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.justAttacked = false;
        
        this.isBoss = true;
        this.isDashing = false;
        this.dashTarget = {x: 0, y: 0};
        this.spiralAngle = 0;
        this.isTeleporting = false;
        this.isChargingDash = false;
        this.dashChargeTimer = 0;

        const data = BOSS_TYPES[type];
        this.name = data.name;
        this.size = data.size;
        this.speed = data.speed;
        this.health = data.health;
        this.maxHealth = data.health;
        this.damage = data.damage;
        this.dashDamage = data.dashDamage || 0;
        this.scoreValue = data.score;
        this.color = data.color;
        this.xpValue = data.xpValue;
        
        this.attacks = data.attacks;
        /* @tweakable Global cooldown between any two boss attacks in seconds */
        this.globalAttackCooldown = 3.0;
        this.globalAttackTimer = 2.0; // Start with a shorter delay for the first attack
        this.attackTimers = {};
        this.attacks.forEach(attack => {
            // Set initial timer to 0 so they are ready to be picked
            this.attackTimers[attack.id] = 0;
        });
    }

    update(deltaTime, playerX, playerY, gameState, playSound) {
        if (this.isChargingDash) {
            this.dashChargeTimer -= deltaTime;
            if (this.dashChargeTimer <= 0) {
                this.isChargingDash = false;
                this.isDashing = true;
            }
            // Particle effect to show charging
            if(Math.random() < 0.5) {
                 gameState.particles.push(new Particle(this.x, this.y, this.color, 0.3));
            }
            return;
        }
        
        if (this.isDashing) {
            this.updateDash(deltaTime, gameState);
            return; // Don't do other logic while dashing
        }
        
        let speedMultiplier = 1;
        let attackSpeedMultiplier = 1;

        if (gameState && gameState.slowZones.length > 0) {
            for (const zone of gameState.slowZones) {
                const distToZone = Math.hypot(this.x - zone.x, this.y - zone.y);
                if (distToZone < zone.radius) {
                    speedMultiplier = TIME_STOP_BOSS_SPEED_MULTIPLIER;
                    attackSpeedMultiplier = TIME_STOP_BOSS_ATTACK_SPEED_MULTIPLIER;
                    break;
                }
            }
        }

        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * speedMultiplier * deltaTime;
            this.y += (dy / dist) * this.speed * speedMultiplier * deltaTime;
        }

        this.updateBossLogic(deltaTime, playerX, playerY, gameState, playSound, attackSpeedMultiplier);
    }

    updateBossLogic(deltaTime, playerX, playerY, gameState, playSound, attackSpeedMultiplier) {
        if (this.isTeleporting) return;

        // Tick down all timers
        this.globalAttackTimer -= deltaTime * attackSpeedMultiplier;
        this.attacks.forEach(attack => {
            if (this.attackTimers[attack.id] > 0) {
                this.attackTimers[attack.id] -= deltaTime * attackSpeedMultiplier;
            }
        });

        if (this.globalAttackTimer > 0) return;

        // Find attacks that are off cooldown and meet conditions
        const availableAttacks = this.attacks.filter(attack => {
            if (this.attackTimers[attack.id] > 0) return false;

            if (attack.id === 'shockwave') {
                const distToPlayer = Math.hypot(this.x - playerX, this.y - playerY);
                /* @tweakable Minimum distance from player for boss to use shockwave attack. */
                const minShockwaveDist = 200;
                if (distToPlayer < minShockwaveDist) {
                    return false; // Too close to use shockwave
                }
            }

            return true;
        });
        
        if (availableAttacks.length > 0) {
            // Pick a random available attack
            const attackToPerform = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
            
            this.performAttack(attackToPerform.id, attackToPerform.params, playerX, playerY, gameState, playSound);
            
            // Reset this attack's individual cooldown and the global cooldown
            this.attackTimers[attackToPerform.id] = attackToPerform.cooldown;
            this.globalAttackTimer = this.globalAttackCooldown;
        }
    }

    performAttack(id, params, playerX, playerY, gameState, playSound) {
        switch (id) {
            case 'shotgun':
                this.shootProjectiles(playerX, playerY, gameState, playSound);
                break;
            case 'missiles':
                this.launchMissiles(playerX, playerY, gameState);
                break;
            case 'summon':
                this.summonMinions(gameState, params.type, params.count);
                break;
            case 'laser':
                this.fireLaser(playerX, playerY, gameState, params);
                break;
            case 'dash':
                this.startDash(playerX, playerY, gameState);
                break;
            case 'spiralShot':
                this.fireSpiralShot(gameState, params);
                break;
            case 'teleport':
                this.teleport(playerX, playerY, gameState, params);
                break;
            case 'shockwave':
                this.createShockwave(gameState, params);
                break;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
    
    drawHealthBar(ctx) {
        if (this.health < this.maxHealth) {
            const barWidth = 80;
            const barHeight = 8;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#888';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth, barHeight);

            ctx.fillStyle = '#ff6666';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth * healthPercent, barHeight);
        }
    }
    
    draw(ctx) {
        this.drawHealthBar(ctx);
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color);
        const darkerColor = darkenColor(this.color, 0.4);
        gradient.addColorStop(1, darkerColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawBossDetails(ctx);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    drawBossDetails(ctx) {
        const auraTime = performance.now() / 1000;
        const auraColor = this.color;
        const pulseSpeed = 2;
        const alpha = 0.4 + (Math.sin(auraTime * pulseSpeed) * 0.2);
        const r = parseInt(auraColor.slice(1, 3), 16);
        const g = parseInt(auraColor.slice(3, 5), 16);
        const b = parseInt(auraColor.slice(5, 7), 16);

        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 4 + Math.sin(auraTime * pulseSpeed) * 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 10 + Math.sin(auraTime * pulseSpeed) * 3, 0, Math.PI * 2);
        ctx.stroke();

        if (this.isChargingDash) {
            // Draw a targeting line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            const angle = Math.atan2(this.dashTarget.y - this.y, this.dashTarget.x - this.x);
            ctx.lineTo(this.x + Math.cos(angle) * 2000, this.y + Math.sin(angle) * 2000);
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(performance.now()/100)*0.2})`;
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 2, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    shootProjectiles(playerX, playerY, gameState, playSound) {
        if (playSound) playSound('boss_shoot');
        const projectileCount = 8;
        const spreadAngle = Math.PI / 4;
        const angleToPlayer = Math.atan2(playerY - this.y, playerX - this.x);

        for (let i = 0; i < projectileCount; i++) {
            const angle = angleToPlayer - spreadAngle / 2 + (spreadAngle / (projectileCount - 1)) * i;
            const projectile = new EnemyProjectile(this.x, this.y, angle, this.damage / 4);
            gameState.enemyProjectiles.push(projectile);
        }
    }

    launchMissiles(playerX, playerY, gameState) {
        const missileCount = 3;
        for (let i = 0; i < missileCount; i++) {
            const offsetX = (Math.random() - 0.5) * 300;
            const offsetY = (Math.random() - 0.5) * 300;
            gameState.dangerZones.push({
                x: playerX + offsetX,
                y: playerY + offsetY,
                radius: 60,
                timer: 2,
                maxTimer: 2,
                damage: this.damage / 2,
            });
        }
    }

    summonMinions(gameState, minionType = 2, minionCount = 3) {
        for (let i = 0; i < minionCount; i++) {
            const angle = (i / minionCount) * Math.PI * 2 + Math.random() * 0.5;
            const spawnDist = 80;
            const x = this.x + Math.cos(angle) * spawnDist;
            const y = this.y + Math.sin(angle) * spawnDist;
            const newZombie = new Zombie(x, y, minionType);
            gameState.zombies.push(newZombie);
        }
    }
    
    fireLaser(playerX, playerY, gameState, params) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        const laserLength = 2000;
        gameState.laserBeams.push({
            startX: this.x,
            startY: this.y,
            endX: this.x + Math.cos(angle) * laserLength,
            endY: this.y + Math.sin(angle) * laserLength,
            width: params.width,
            damage: params.damage,
            state: 'charging',
            life: params.chargeTime,
            maxLife: params.chargeTime,
            fireDuration: params.fireTime,
        });
    }

    startDash(playerX, playerY, gameState) {
        this.isChargingDash = true;
        /* @tweakable Time in seconds the boss charges its dash attack. */
        this.dashChargeTimer = 0.7;
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        const dashDistance = 400;
        this.dashTarget.x = this.x + Math.cos(angle) * dashDistance;
        this.dashTarget.y = this.y + Math.sin(angle) * dashDistance;
    }

    updateDash(deltaTime, gameState) {
        const dx = this.dashTarget.x - this.x;
        const dy = this.dashTarget.y - this.y;
        const dist = Math.hypot(dx, dy);
        /* @tweakable Speed of the boss's dash attack after charging. */
        const dashSpeed = 800;

        if (dist < 20) {
            this.isDashing = false;
            return;
        }

        this.x += (dx / dist) * dashSpeed * deltaTime;
        this.y += (dy / dist) * dashSpeed * deltaTime;

        gameState.particles.push(new Particle(this.x, this.y, this.color, 0.5));
    }

    fireSpiralShot(gameState, params) {
        const angleIncrement = (Math.PI * 2) / params.count;
        for (let i = 0; i < params.count; i++) {
            const angle = this.spiralAngle + i * angleIncrement;
            const projectile = new EnemyProjectile(this.x, this.y, angle, this.damage / 4);
            gameState.enemyProjectiles.push(projectile);
        }
        this.spiralAngle += params.rotationSpeed * (Math.PI / 180);
    }

    teleport(playerX, playerY, gameState, params) {
        /* @tweakable particle count for boss teleport effect */
        const teleportParticleCount = 40;
        for (let i = 0; i < teleportParticleCount; i++) {
            gameState.particles.push(new Particle(this.x, this.y, this.color, 1.0));
        }

        /* @tweakable The minimum and maximum distance from the player a boss can teleport. */
        const teleportRange = { min: 300, max: 500 };
        const angle = Math.random() * Math.PI * 2;
        const distance = teleportRange.min + Math.random() * (teleportRange.max - teleportRange.min);

        this.x = playerX + Math.cos(angle) * distance;
        this.y = playerY + Math.sin(angle) * distance;

        for (let i = 0; i < teleportParticleCount; i++) {
            gameState.particles.push(new Particle(this.x, this.y, this.color, 1.0));
        }
        
        this.isTeleporting = true;
        setTimeout(() => this.isTeleporting = false, params.cooldown * 1000);
    }

    createShockwave(gameState, params) {
        /* @tweakable Duration of the shockwave fade-out effect in seconds. */
        const fadeDuration = 0.5;
        gameState.shockwaves.push({
            x: this.x,
            y: this.y,
            radius: 0,
            damage: params.damage,
            speed: params.speed,
            maxRadius: params.maxRadius,
            color: this.color,
            isFading: false,
            fadeDuration: fadeDuration,
            fadeTimer: fadeDuration
        });
    }
}