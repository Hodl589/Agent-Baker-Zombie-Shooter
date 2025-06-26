import { XPOrb } from './xpOrb.js';
import { Particle } from './particle.js';
import { Magnet } from './magnet.js';

export class CollisionManager {
    constructor(gameState, audioManager) {
        this.gameState = gameState;
        this.audioManager = audioManager;
        /* @tweakable spike damage cooldown in seconds */
        this.spikeDamageCooldown = 0.5;
        /* @tweakable Chance for an enemy to drop a magnet on death (0 to 1). This is checked only after the kill requirement is met. */
        this.magnetDropChance = 0.005;
        /* @tweakable Number of kills required before a magnet has a chance to drop. */
        this.magnetKillRequirement = 50;
        // Map to track last hit times per spike per zombie
        this.spikeZombieHitTimes = new WeakMap();
    }
    
    checkAllCollisions(player) {
        this.checkBulletZombieCollisions(player);
        this.checkSpikeZombieCollisions(player);
        this.checkEnemyProjectilePlayerCollisions(player);
        this.checkPlayerLaserCollision(player);
        this.checkDashingBossCollision(player);
        this.checkPlayerDashZombieCollisions(player);
        this.checkPlayerMagnetCollisions(player);
    }
    
    checkBulletZombieCollisions(player) {
        for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = this.gameState.bullets[i];

            for (let j = this.gameState.zombies.length - 1; j >= 0; j--) {
                const zombie = this.gameState.zombies[j];
                const dist = Math.hypot(bullet.x - zombie.x, bullet.y - zombie.y);

                if (dist < zombie.size + bullet.size) { // More accurate collision
                    const damageToDeal = bullet.damage * Math.pow(bullet.damageFalloff, bullet.hits);
                    zombie.takeDamage(damageToDeal);

                    if (player.lifesteal > 0) {
                        player.heal(damageToDeal * player.lifesteal);
                    }

                    this.createHitParticles(zombie.x, zombie.y);
                    
                    // Trigger lightning if player has the upgrade
                    if (player.hasLightning) {
                        this.chainLightning(zombie, bullet.damage, player.lightningBounces, player.lightningRange, player.lightningDamageMultiplier, [zombie]);
                    }

                    if (zombie.health <= 0) {
                        this.handleZombieDeath(zombie, j);
                    }
                    
                    if (bullet.pierce) {
                        bullet.hits++;
                    } else {
                        // Handle non-piercing bullet destruction and potential explosion
                        if (player.explosiveRounds) {
                            this.handleExplosion(bullet.x, bullet.y, player, zombie);
                        }
                        this.gameState.bullets.splice(i, 1);
                        break; // Break from the inner zombie loop since the bullet is destroyed.
                    }
                }
            }
        }
    }
    
    checkEnemyProjectilePlayerCollisions(player) {
        for (let i = this.gameState.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.gameState.enemyProjectiles[i];
            const dist = Math.hypot(projectile.x - player.x, projectile.y - player.y);
            
            if (dist < player.size + projectile.size) {
                player.takeDamage(projectile.damage, this.gameState);
                this.gameState.enemyProjectiles.splice(i, 1);
                this.createHitParticles(player.x, player.y);
            }
        }
    }
    
    checkSpikeZombieCollisions(player) {
        const now = performance.now();
        for (const spike of this.gameState.spikes) {
            let hitMap = this.spikeZombieHitTimes.get(spike);
            if (!hitMap) {
                hitMap = new WeakMap();
                this.spikeZombieHitTimes.set(spike, hitMap);
            }
            for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
                const zombie = this.gameState.zombies[i];
                const dist = Math.hypot(spike.x - zombie.x, spike.y - zombie.y);
                if (dist < 15) {
                    /**
                     * @tweakable spike damage cooldown per spike per zombie in seconds
                     */
                    const lastHit = hitMap.get(zombie) || 0;
                    if (now - lastHit >= this.spikeDamageCooldown * 1000) {
                        zombie.takeDamage(player.spikeDamage);
                        hitMap.set(zombie, now);
                        this.createHitParticles(zombie.x, zombie.y);
                        if (zombie.health <= 0) {
                            this.handleZombieDeath(zombie, i);
                        }
                    }
                    // Prevent further hits by this spike on the same update
                    break;
                }
            }
        }
    }
    
    checkPlayerLaserCollision(player) {
        if (player.isInvincible) return;

        this.gameState.laserBeams.forEach(laser => {
            if (laser.state !== 'firing') return;

            // Simple point-to-line segment distance check
            const px = player.x;
            const py = player.y;
            const x1 = laser.startX;
            const y1 = laser.startY;
            const x2 = laser.endX;
            const y2 = laser.endY;

            const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
            if (lenSq === 0) return; // laser has no length

            let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lenSq;
            t = Math.max(0, Math.min(1, t));

            const closestX = x1 + t * (x2 - x1);
            const closestY = y1 + t * (y2 - y1);
            
            const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
            const hitRadius = player.size + laser.width / 2;

            if (distSq < hitRadius ** 2) {
                player.takeDamage(laser.damage, this.gameState); // damage per frame
            }
        });
    }
    
    checkDashingBossCollision(player) {
        if (player.isInvincible) return;

        this.gameState.zombies.forEach(zombie => {
            if (zombie.isDashing) {
                const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);
                if (dist < player.size + zombie.size) {
                    player.takeDamage(zombie.dashDamage, this.gameState);
                    // Add knockback to player
                    const angle = Math.atan2(player.y - zombie.y, player.x - zombie.x);
                    player.x += Math.cos(angle) * 15;
                    player.y += Math.sin(angle) * 15;

                    // End dash on hit
                    zombie.isDashing = false; 
                }
            }
        });
    }

    checkPlayerDashZombieCollisions(player) {
        if (!player.isDashing || !player.hasSlashDash) return;

        for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
            const zombie = this.gameState.zombies[i];
            
            if (player.dashHitEnemies.has(zombie)) continue;

            const dist = Math.hypot(player.x - zombie.x, player.y - zombie.y);

            if (dist < player.size + zombie.size) {
                zombie.takeDamage(player.slashDashDamage);
                if (player.lifesteal > 0) {
                    player.heal(player.slashDashDamage * player.lifesteal);
                }
                player.dashHitEnemies.add(zombie);

                this.createHitParticles(zombie.x, zombie.y);
                
                if (zombie.health <= 0) {
                    this.handleZombieDeath(zombie, i);
                }
            }
        }
    }

    checkPlayerMagnetCollisions(player) {
        for (let i = this.gameState.magnets.length - 1; i >= 0; i--) {
            const magnet = this.gameState.magnets[i];
            const dist = Math.hypot(player.x - magnet.x, player.y - magnet.y);
            if (dist < player.size + magnet.size) {
                /* @tweakable Duration of the magnet effect in seconds */
                const MAGNET_DURATION = 10;
                player.magnetTimer = MAGNET_DURATION;
                if (this.audioManager) this.audioManager.play('magnet_pickup');
                this.gameState.magnets.splice(i, 1);
            }
        }
    }

    handleExplosion(x, y, player, ignoredZombie) {
        /* @tweakable radius of explosive rounds explosions */
        const explosionRadius = 40;
        /* @tweakable damage of explosive rounds as a multiplier of the bullet's base damage */
        const explosionDamage = player.bulletDamage * 0.5;

        // Visual effect
        for (let j = 0; j < 5; j++) {
            this.gameState.particles.push(new Particle(x, y, '#ffaa00', 0.6));
        }

        // Damage zombies in radius
        for (let k = this.gameState.zombies.length - 1; k >= 0; k--) {
            const otherZombie = this.gameState.zombies[k];
            if (otherZombie === ignoredZombie) continue; // Don't hit the original target

            const dist = Math.hypot(x - otherZombie.x, y - otherZombie.y);
            if (dist < explosionRadius + otherZombie.size) {
                otherZombie.takeDamage(explosionDamage);
                if (player.lifesteal > 0) {
                    player.heal(explosionDamage * player.lifesteal);
                }
                this.createHitParticles(otherZombie.x, otherZombie.y);
                if (otherZombie.health <= 0) {
                    this.handleZombieDeath(otherZombie, k);
                }
            }
        }
    }

    handleZombieDeath(zombie, index) {
        // Spawn chest on boss defeat
        if (zombie.isBoss) {
            this.gameState.chests.push({ x: zombie.x, y: zombie.y });
        }
        this.gameState.score += zombie.scoreValue;
        
        /* @tweakable XP orbs dropped by bosses */
        const xpOrbCount = zombie.isBoss ? 5 : 1; // Bosses drop more XP
        for (let k = 0; k < xpOrbCount; k++) {
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 40;
            const orbValue = zombie.isBoss ? zombie.xpValue / xpOrbCount : zombie.xpValue;
            this.gameState.xpOrbs.push(new XPOrb(zombie.x + offsetX, zombie.y + offsetY, orbValue));
        }
        this.gameState.zombies.splice(index, 1);
        this.createDeathParticles(zombie.x, zombie.y);

        if (!zombie.isBoss) {
            this.gameState.killsSinceLastMagnet++;
            if (this.gameState.killsSinceLastMagnet >= this.magnetKillRequirement && Math.random() < this.magnetDropChance) {
                this.gameState.magnets.push(new Magnet(zombie.x, zombie.y));
                this.gameState.killsSinceLastMagnet = 0; // Reset the counter
            }
        }
    }

    chainLightning(fromZombie, initialDamage, bouncesLeft, range, damageMultiplier, hitZombies) {
        if (bouncesLeft <= 0) return;

        let closestTarget = null;
        let minDistance = range;

        for (const potentialTarget of this.gameState.zombies) {
            if (hitZombies.includes(potentialTarget)) continue; // Don't hit the same zombie twice in one chain

            const dist = Math.hypot(fromZombie.x - potentialTarget.x, fromZombie.y - potentialTarget.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestTarget = potentialTarget;
            }
        }

        if (closestTarget) {
            const damage = initialDamage * damageMultiplier;
            closestTarget.takeDamage(damage);
            this.createHitParticles(closestTarget.x, closestTarget.y);
            
            // Add to lightning bolts for rendering
            this.gameState.lightningBolts.push({
                fromX: fromZombie.x, fromY: fromZombie.y,
                toX: closestTarget.x, toY: closestTarget.y,
                life: 0.2
            });
            
            hitZombies.push(closestTarget);

            if (closestTarget.health <= 0) {
                const index = this.gameState.zombies.indexOf(closestTarget);
                if (index > -1) {
                    this.handleZombieDeath(closestTarget, index);
                }
            }
            
            // Recurse from the new target
            this.chainLightning(closestTarget, initialDamage, bouncesLeft - 1, range, damageMultiplier, hitZombies);
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 3; i++) {
            this.gameState.particles.push(new Particle(x, y, '#ff6666', 0.5));
        }
    }
    
    createDeathParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.gameState.particles.push(new Particle(x, y, '#ff0000', 1));
        }
    }
}