import { Player } from './player.js';
import { GameState } from './gameState.js';
import { UIManager } from './uiManager.js';
import { AudioManager } from './audioManager.js';
import { PowerupSystem } from './powerupSystem.js';
import { ShopSystem } from './shopSystem.js';

export class GameFlowManager {
    constructor(game) {
        this.game = game;
        this.gameState = game.gameState;
        this.player = game.player;
        this.shopSystem = game.shopSystem;
        this.powerupSystem = game.powerupSystem;
        this.uiManager = game.uiManager;
        this.audioManager = game.audioManager;
        this.canvas = game.canvas;

        /** @tweakable number of levels between shop menus */
        this.shopLevelsInterval = 3;
        this.lastShopLevel = 1;

        /** @tweakable number of reward picks allowed from a boss chest */
        this.bossRewardPicks = 2;
        /** @tweakable power-up popups appear every N levels */
        this.levelsPerShop = 1;

        this.currentBossRewardOptions = [];
    }

    update(deltaTime) {
        this.handleBulletTime(deltaTime);
        this.handleGameFlow();
        if (this.gameState.isPaused) return;

        this.handleLevelUps();
        this.checkGameOver();
    }

    handleGameFlow() {
        if (Math.floor(this.player.level / this.shopLevelsInterval) > Math.floor(this.lastShopLevel / this.shopLevelsInterval)) {
            this.showShop();
            this.lastShopLevel = this.player.level;
            return;
        }

        if (this.gameState.shouldTriggerBossFight()) {
            this.startBossFight();
        }

        if (this.gameState.inBossFight && !this.gameState.bossDefeated) {
            const isBossAlive = this.gameState.zombies.some(z => z.isBoss);
            if (!isBossAlive) {
                this.endBossFight();
            }
        }
    }

    startBossFight() {
        this.gameState.startBossFight(this.player.x, this.player.y);
        /* Lazy-Loading Improvement:
         * The boss music is now loaded on-demand when the boss fight starts.
         * The `loadSound` method ensures it's only fetched once.
         * After loading, it's played. This reduces initial game load time. */
        this.audioManager.loadSound('boss_music', '/boss_music.mp3').then(() => {
            this.audioManager.playMusic('boss_music');
        });
    }

    endBossFight() {
        this.gameState.endBossFight();
        this.audioManager.stopMusic();
        this.showBossReward();
    }

    handleLevelUps() {
        while (this.player.xp >= this.player.xpRequired) {
            if ((this.player.level + 1) % this.levelsPerShop === 0) {
                this.powerupSystem.levelUp(this.player);
                const options = this.powerupSystem.generateRandomPowerups(this.player);
                this.uiManager.showPowerupSelection(options, this.gameState.upgradeStacks, this.powerupSystem.maxUpgradeLevel);
                this.powerupSystem.currentPowerupOptions = options;
            } else {
                /** @tweakable The heal amount on a level up that isn't a power-up level. */
                const nonPowerupLevelHeal = 20;
                this.player.heal(nonPowerupLevelHeal);
                this.player.levelUp();
            }
            if (this.gameState.isPaused) break;
        }
    }

    checkGameOver() {
        if (this.player.health <= 0) {
            this.gameState.gameOver();
            this.audioManager.stopMusic();
            this.uiManager.showDeathScreen(this.gameState.score, this.player.level);
        }
    }

    showBossReward() {
        this.gameState.isPaused = true;
        const rewards = this.shopSystem.generateBossRewards(6);
        this.currentBossRewardOptions = rewards;
        this.uiManager.showBossRewardSelection(rewards, this.bossRewardPicks);
    }

    showShop() {
        this.gameState.isPaused = true;
        const items = this.shopSystem.generateShopItems();
        this.uiManager.showShop(items, this.gameState.score);
    }

    handleBulletTime(deltaTime) {
        /** @tweakable Speed at which the bullet time vignette and zoom appear/fade. */
        const effectFadeSpeed = 2.0;

        if (this.gameState.isBulletTime) {
            let shouldEnd = false;
            const trigger = this.gameState.bulletTimeTriggeredBy;

            if (!trigger) {
                shouldEnd = true;
            } else if (trigger.vx !== undefined) { // Is an EnemyProjectile
                if (this.gameState.enemyProjectiles.indexOf(trigger) === -1 || Math.hypot(this.player.x - trigger.x, this.player.y - trigger.y) > 250) { // End if projectile is gone or far away
                    shouldEnd = true;
                }
            } else if (trigger.maxTimer !== undefined) { // Is a DangerZone
                if (this.gameState.dangerZones.indexOf(trigger) === -1) {
                    shouldEnd = true;
                }
            } else if (trigger.state !== undefined) { // Is a Laser
                if (trigger.state === 'firing' || this.gameState.laserBeams.indexOf(trigger) === -1) {
                    shouldEnd = true;
                }
            } else if (trigger.maxRadius !== undefined) { // Is a Shockwave
                const dist = Math.hypot(this.player.x - trigger.x, this.player.y - trigger.y);
                // End if wave has passed the player or no longer exists
                if (trigger.radius > dist + this.player.size || this.gameState.shockwaves.indexOf(trigger) === -1) {
                    shouldEnd = true;
                }
            } else if (trigger.isBoss) { // Is a Boss
                if (!trigger.isChargingDash || this.gameState.zombies.indexOf(trigger) === -1) {
                    shouldEnd = true;
                }
            } else {
                // Unknown trigger, end it.
                shouldEnd = true;
            }

            if (shouldEnd) {
                this.endBulletTime();
            } else {
                this.gameState.bulletTimeVignette = Math.min(1, this.gameState.bulletTimeVignette + effectFadeSpeed * deltaTime);
            }

        } else {
            if (this.gameState.bulletTimeVignette > 0) {
                this.gameState.bulletTimeVignette = Math.max(0, this.gameState.bulletTimeVignette - effectFadeSpeed * deltaTime);
            }

            if (this.gameState.isBulletTimeEnabled && this.gameState.bulletTimeTimer <= 0 && !this.gameState.isPaused) {
                let triggered = false;

                // 1. Check for enemy projectiles (with predictive path)
                /* @tweakable How far ahead to predict projectile paths for bullet time, in pixels. */
                const PREDICTION_DISTANCE = 150;
                /* @tweakable The width of the projectile danger zone for bullet time. Should be larger than player size. */
                const PREDICTION_WIDTH = 50;

                for (const projectile of this.gameState.enemyProjectiles) {
                    const dx = projectile.vx;
                    const dy = projectile.vy;
                    const projSpeed = Math.sqrt(dx*dx + dy*dy);
                    if (projSpeed === 0) continue;

                    const dirX = dx / projSpeed;
                    const dirY = dy / projSpeed;

                    const playerVecX = this.player.x - projectile.x;
                    const playerVecY = this.player.y - projectile.y;

                    const dotProduct = playerVecX * dirX + playerVecY * dirY;

                    if (dotProduct > 0 && dotProduct < PREDICTION_DISTANCE) {
                        const perpDist = Math.abs(playerVecX * -dirY + playerVecY * dirX);

                        if (perpDist < PREDICTION_WIDTH / 2 + this.player.size) {
                            this.startBulletTime(projectile);
                            triggered = true;
                            break;
                        }
                    }
                }
                if (triggered) return;

                // 2. Check for boss missiles (danger zones)
                /* @tweakable Time before missile impact to trigger bullet time. */
                const MISSILE_BULLET_TIME_THRESHOLD = 0.5;
                for (const zone of this.gameState.dangerZones) {
                    if (zone.timer <= MISSILE_BULLET_TIME_THRESHOLD) {
                        const dist = Math.hypot(this.player.x - zone.x, this.player.y - zone.y);
                        if (dist < zone.radius) {
                            this.startBulletTime(zone);
                            triggered = true;
                            break;
                        }
                    }
                }
                if (triggered) return;

                // 3. Check for boss lasers
                /* @tweakable Time before laser fires to trigger bullet time. */
                const LASER_BULLET_TIME_THRESHOLD = 0.5;
                for (const laser of this.gameState.laserBeams) {
                    if (laser.state === 'charging' && laser.life <= LASER_BULLET_TIME_THRESHOLD) {
                        const px = this.player.x, py = this.player.y;
                        const x1 = laser.startX, y1 = laser.startY;
                        const x2 = laser.endX, y2 = laser.endY;
                        const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
                        if (lenSq === 0) continue;
                        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lenSq;
                        t = Math.max(0, Math.min(1, t));
                        const closestX = x1 + t * (x2 - x1);
                        const closestY = y1 + t * (y2 - y1);
                        const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
                        const hitRadius = this.player.size + laser.width / 2;
                        if (distSq < hitRadius ** 2) {
                            this.startBulletTime(laser);
                            triggered = true;
                            break;
                        }
                    }
                }
                if (triggered) return;
                
                // 4. Check for boss dashes
                for (const zombie of this.gameState.zombies) {
                    if (zombie.isBoss && zombie.isChargingDash) {
                        this.startBulletTime(zombie);
                        triggered = true;
                        break;
                    }
                }
                
                // 5. Check for shockwaves
                /* @tweakable Time before shockwave impact to trigger bullet time. */
                const SHOCKWAVE_BULLET_TIME_THRESHOLD_SECONDS = 0.25;
                for (const wave of this.gameState.shockwaves) {
                    const distToPlayer = Math.hypot(this.player.x - wave.x, this.player.y - wave.y);
                    if (wave.speed <= 0) continue;
                    const timeToImpact = (distToPlayer - wave.radius) / wave.speed;
                    
                    if (timeToImpact > 0 && timeToImpact < SHOCKWAVE_BULLET_TIME_THRESHOLD_SECONDS) {
                        this.startBulletTime(wave);
                        triggered = true;
                        break;
                    }
                }
                if (triggered) return;
            }
        }
    }

    startBulletTime(trigger) {
        this.gameState.isBulletTime = true;
        this.gameState.bulletTimeTriggeredBy = trigger;
        this.gameState.bulletTimeTimer = this.gameState.bulletTimeCooldown;
    }

    endBulletTime() {
        this.gameState.isBulletTime = false;
        this.gameState.bulletTimeTriggeredBy = null;
    }
}