import { Particle } from './particle.js';

export class ObjectManager {
    constructor(gameState, canvas, collisionManager, audioManager, renderer) {
        this.gameState = gameState;
        this.canvas = canvas;
        this.collisionManager = collisionManager;
        this.audioManager = audioManager;
        this.renderer = renderer;
    }

    updateAll(deltaTime, player) {
        this.updateBullets(deltaTime);
        this.updateZombies(deltaTime, player);
        this.updateXpOrbs(deltaTime, player);
        this.updateParticles(deltaTime);
        this.updateSpikes(deltaTime, player);
        this.updateGrenades(deltaTime);
        this.updateEnemyProjectiles(deltaTime);
        this.updateDangerZones(deltaTime, player);
        this.updateLightningBolts(deltaTime);
        this.updateSlowZones(deltaTime, player);
        this.updateLaserBeams(deltaTime, player);
        this.updateShockwaves(deltaTime, player);
        this.updateMagnets(deltaTime);
    }

    _getViewBounds() {
        const camera = this.renderer.sceneDrawer.camera;
        let zoom = this.renderer.userZoom;

        // Replicate bullet time zoom calculation from renderer
        if (this.gameState.bulletTimeVignette > 0) {
            const zoomIntensity = this.gameState.bulletTimeVignette;
            const bulletTimeZoomValue = 1 + (this.gameState.bulletTimeZoom - 1) * zoomIntensity;
            zoom *= bulletTimeZoomValue;
        }

        const viewWidth = this.canvas.width / zoom;
        const viewHeight = this.canvas.height / zoom;
        
        return {
            left: camera.x - viewWidth / 2,
            right: camera.x + viewWidth / 2,
            top: camera.y - viewHeight / 2,
            bottom: camera.y + viewHeight / 2,
        };
    }

    updateBullets(deltaTime) {
        const bounds = this._getViewBounds();
        /* @tweakable Distance outside camera view to destroy bullets. */
        const margin = 50;

        for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = this.gameState.bullets[i];
            bullet.update(deltaTime);
            
            // Remove bullets that are off-screen (relative to camera view)
            if (bullet.x < bounds.left - margin || bullet.x > bounds.right + margin ||
                bullet.y < bounds.top - margin || bullet.y > bounds.bottom + margin) {
                this.gameState.bullets.splice(i, 1);
            }
        }
    }
    
    updateZombies(deltaTime, player) {
        for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
            const zombie = this.gameState.zombies[i];
            zombie.update(deltaTime, player.x, player.y, this.gameState, (name) => this.audioManager.play(name));
            
            // Check if zombie reached player (damage but don't remove zombie)
            const dist = Math.hypot(zombie.x - player.x, zombie.y - player.y);
            if (dist < 25 && !zombie.justAttacked) {
                const healthBefore = player.health;
                const shieldsBefore = player.currentShields;
                
                player.takeDamage(zombie.damage, this.gameState);

                const tookDamage = player.health < healthBefore || player.currentShields < shieldsBefore;

                if (tookDamage && player.thornsDamage > 0) {
                    /* @tweakable Thorns damage value. This is set by an upgrade. */
                    const thornsDamage = player.thornsDamage;
                    zombie.takeDamage(thornsDamage);
                    if (zombie.health <= 0) {
                        this.collisionManager.handleZombieDeath(zombie, i);
                        continue; // Zombie died from thorns, skip attack logic
                    }
                }
                
                zombie.justAttacked = true;
                setTimeout(() => zombie.justAttacked = false, 1000);
            }
        }
    }
    
    updateXpOrbs(deltaTime, player) {
        /* @tweakable The range of the magnet powerup. A large number effectively makes it map-wide. */
        const MAGNET_POWERUP_RANGE = 9999;
        const effectiveMagnetRange = player.magnetTimer > 0 ? MAGNET_POWERUP_RANGE : player.xpMagnetRange;

        for (let i = this.gameState.xpOrbs.length - 1; i >= 0; i--) {
            const orb = this.gameState.xpOrbs[i];
            orb.update(deltaTime, player.x, player.y, effectiveMagnetRange);
            
            // Check if player collected orb
            const dist = Math.hypot(orb.x - player.x, orb.y - player.y);
            if (dist < 25) {
                player.addXp(orb.value);
                this.gameState.xpOrbs.splice(i, 1);
                // Level up logic is now handled in game.js
            }
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.gameState.particles.length - 1; i >= 0; i--) {
            const particle = this.gameState.particles[i];
            particle.update(deltaTime);
            
            if (particle.life <= 0) {
                this.gameState.particles.splice(i, 1);
            }
        }
    }
    
    createShieldShatterParticles(x, y) {
        /* @tweakable number of particles for shield shatter effect */
        const shatterParticleCount = 25;
        for (let i = 0; i < shatterParticleCount; i++) {
            const particle = new Particle(x, y, '#abcdef', 1.2);
            particle.size = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            this.gameState.particles.push(particle);
        }
    }

    updateMagnets(deltaTime) {
        for (let i = this.gameState.magnets.length - 1; i >= 0; i--) {
            const magnet = this.gameState.magnets[i];
            magnet.update(deltaTime);
            if (magnet.lifetime <= 0) {
                this.gameState.magnets.splice(i, 1);
            }
        }
    }

    updateSpikes(deltaTime, player) {
        if (this.gameState.spikes.length > 0) {
            const spikeSpeed = 2;
            for (const spike of this.gameState.spikes) {
                spike.angle += spikeSpeed * deltaTime;
                spike.x = player.x + Math.cos(spike.angle) * spike.radius;
                spike.y = player.y + Math.sin(spike.angle) * spike.radius;
            }
        }
    }
    
    updateGrenades(deltaTime) {
        for (let i = this.gameState.grenades.length - 1; i >= 0; i--) {
            const grenade = this.gameState.grenades[i];
            grenade.update(deltaTime);
            
            if (grenade.exploded) {
                // Create explosion visual effect
                /* @tweakable explosion particle count */
                const explosionParticles = 25;
                for (let j = 0; j < explosionParticles; j++) {
                    const angle = (j / explosionParticles) * Math.PI * 2;
                    const speed = 100 + Math.random() * 150;
                    const particle = new Particle(grenade.x, grenade.y, '#ffaa00', 1.5);
                    particle.vx = Math.cos(angle) * speed;
                    particle.vy = Math.sin(angle) * speed;
                    particle.size = 3 + Math.random() * 4;
                    this.gameState.particles.push(particle);
                }
                
                // Add bright explosion flash particles
                for (let j = 0; j < 10; j++) {
                    this.gameState.particles.push(new Particle(grenade.x, grenade.y, '#ffffff', 0.3));
                }
                
                // Damage zombies in explosion radius
                for (let k = this.gameState.zombies.length - 1; k >= 0; k--) {
                    const zombie = this.gameState.zombies[k];
                    const dist = Math.hypot(grenade.x - zombie.x, grenade.y - zombie.y);
                    if (dist < grenade.explosionRadius) {
                        zombie.takeDamage(grenade.damage);
                        this.collisionManager.createHitParticles(zombie.x, zombie.y);
                        
                        if (zombie.health <= 0) {
                            this.collisionManager.handleZombieDeath(zombie, k);
                        }
                    }
                }
                
                this.gameState.grenades.splice(i, 1);
            }
        }
    }
    
    updateEnemyProjectiles(deltaTime) {
        const bounds = this._getViewBounds();
        /* @tweakable Distance outside camera view to destroy enemy projectiles. */
        const margin = 50;

        for (let i = this.gameState.enemyProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.gameState.enemyProjectiles[i];
            
            // Pass gameState to the projectile's update method for it to handle its own logic, like slowing in zones.
            projectile.update(deltaTime, this.gameState);

            // Remove projectiles that are off-screen (relative to camera view)
            if (projectile.x < bounds.left - margin || projectile.x > bounds.right + margin ||
                projectile.y < bounds.top - margin || projectile.y > bounds.bottom + margin) {
                this.gameState.enemyProjectiles.splice(i, 1);
            }
        }
    }

    updateDangerZones(deltaTime, player) {
        for (let i = this.gameState.dangerZones.length - 1; i >= 0; i--) {
            const zone = this.gameState.dangerZones[i];
            zone.timer -= deltaTime;

            if (zone.timer <= 0) {
                // Explode
                this.audioManager.play('missile_explosion');
                /* @tweakable missile explosion particle count */
                const explosionParticles = 20;
                for (let j = 0; j < explosionParticles; j++) {
                    this.gameState.particles.push(new Particle(zone.x, zone.y, '#ff44ff', 1));
                }

                // Damage player if inside
                const dist = Math.hypot(player.x - zone.x, player.y - zone.y);
                if (dist < zone.radius) {
                    player.takeDamage(zone.damage, this.gameState);
                }

                this.gameState.dangerZones.splice(i, 1);
            }
        }
    }

    updateLightningBolts(deltaTime) {
        for (let i = this.gameState.lightningBolts.length - 1; i >= 0; i--) {
            const bolt = this.gameState.lightningBolts[i];
            bolt.life -= deltaTime;
            if (bolt.life <= 0) {
                this.gameState.lightningBolts.splice(i, 1);
            }
        }
    }

    updateSlowZones(deltaTime, player) {
        for (let i = this.gameState.slowZones.length - 1; i >= 0; i--) {
            const zone = this.gameState.slowZones[i];

            if (zone.followsPlayer) {
                zone.x = player.x;
                zone.y = player.y;
            }
            
            zone.timeLeft -= deltaTime;
            zone.animTime += deltaTime;
            if (zone.timeLeft <= 0) {
                this.gameState.slowZones.splice(i, 1);
            }
        }
    }

    updateLaserBeams(deltaTime, player) {
        for (let i = this.gameState.laserBeams.length - 1; i >= 0; i--) {
            const laser = this.gameState.laserBeams[i];
            laser.life -= deltaTime;
            if (laser.life <= 0) {
                if (laser.state === 'charging') {
                    laser.state = 'firing';
                    laser.life = laser.fireDuration;
                    laser.maxLife = laser.fireDuration;
                } else {
                    this.gameState.laserBeams.splice(i, 1);
                }
            }
        }
    }

    updateShockwaves(deltaTime, player) {
        for (let i = this.gameState.shockwaves.length - 1; i >= 0; i--) {
            const wave = this.gameState.shockwaves[i];
            
            if (wave.isFading) {
                wave.fadeTimer -= deltaTime;
                if (wave.fadeTimer <= 0) {
                    this.gameState.shockwaves.splice(i, 1);
                }
                continue;
            }

            wave.radius += wave.speed * deltaTime;

            // Check collision
            const dist = Math.hypot(player.x - wave.x, player.y - wave.y);
            // Check if player is within the wave's expanding ring
            const waveThickness = 15;
            if (Math.abs(dist - wave.radius) < (player.size + waveThickness / 2)) {
                player.takeDamage(wave.damage, this.gameState);
                // To avoid continuous damage, we could add a cooldown or remove the wave
                // For simplicity, we'll let it pass through. A real implementation might track hits.
            }

            if (wave.radius >= wave.maxRadius) {
                wave.isFading = true;
                wave.radius = wave.maxRadius; // Pin radius
            }
        }
    }

    handleEvents() {
        this.gameState.shieldBreakEvents.forEach(event => {
            this.createShieldShatterParticles(event.x, event.y);
        });
        this.gameState.shieldBreakEvents = [];
    }
}