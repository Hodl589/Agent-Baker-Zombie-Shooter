import { Zombie } from './zombie.js';
import { Boss } from './boss.js';

export class GameState {
    constructor() {
        /* @tweakable zombie spawn rate per second */
        this.zombieSpawnRate = 2;
        /* @tweakable maximum zombies on screen */
        this.maxZombies = 50;
        /* @tweakable score interval for boss fights */
        this.bossScoreInterval = 1000;
        /* @tweakable number of boss fights occurred (incremented internally) */
        this.bossSpawnCount = 0;
        /* @tweakable boss health multiplier per spawn (exponential scaling) */
        this.bossHealthMultiplier = 1.5;
        
        /* @tweakable boss arena padding for boundaries during boss fights */
        this.bossArenaPadding = 100;
        
        this.selectedCharacter = null;
        this.primaryWeapon = null;
        this.secondaryWeapon = null;
        this.gameRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.score = 0;
        this.wave = 1;
        this.lastTime = 0;
        /* @tweakable time when higher level enemies start spawning - much longer delays */
        this.gameTime = 0;
        this.lastBossScore = 0;
        this.inBossFight = false;
        this.bossDefeated = false;
        
        // Bullet Time state
        /* @tweakable Whether the auto-dodge bullet time effect is enabled by default. */
        this.isBulletTimeEnabled = true;
        this.isBulletTime = false;
        /* @tweakable Cooldown for the bullet time effect in seconds. */
        this.bulletTimeCooldown = 60;
        this.bulletTimeTimer = 0;
        /* @tweakable How much the game slows down during bullet time (0.1 = 10% speed). */
        this.bulletTimeSlowdown = 0.2;
        /* @tweakable How much the camera zooms in during bullet time. */
        this.bulletTimeZoom = 1.5;
        this.bulletTimeVignette = 0; // 0 to 1 for intensity
        this.bulletTimeTriggeredBy = null; // a reference to the projectile that triggered it

        // Game objects
        this.zombies = [];
        this.bullets = [];
        this.xpOrbs = [];
        this.particles = [];
        this.spikes = [];
        this.grenades = [];
        this.enemyProjectiles = [];
        this.dangerZones = [];
        this.lightningBolts = [];
        this.slowZones = [];
        this.laserBeams = [];
        this.shockwaves = [];
        // Chest drops after boss defeat
        this.chests = [];
        this.shieldBreakEvents = [];
        this.magnets = [];
        
        // Upgrade tracking
        this.upgradeStacks = {};
        this.killsSinceLastMagnet = 0;
        
        // Debugging
        this.autoAimTarget = null;
    }
    
    reset() {
        this.isGameOver = false;
        this.isPaused = false;
        this.score = 0;
        this.wave = 1;
        this.gameTime = 0;
        this.lastBossScore = 0;
        this.inBossFight = false;
        this.bossDefeated = false;
        this.zombies = [];
        this.bullets = [];
        this.xpOrbs = [];
        this.particles = [];
        this.spikes = [];
        this.grenades = [];
        this.enemyProjectiles = [];
        this.dangerZones = [];
        this.lightningBolts = [];
        this.slowZones = [];
        this.laserBeams = [];
        this.upgradeStacks = {};
        this.chests = [];
        this.shieldBreakEvents = [];
        this.shockwaves = [];
        this.magnets = [];
        this.autoAimTarget = null;
    }
    
    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
    }
    
    gameOver() {
        this.isGameOver = true;
    }
    
    updateGameTime(deltaTime) {
        this.gameTime += deltaTime;
    }
    
    shouldTriggerBossFight() {
        return this.score >= this.lastBossScore + this.bossScoreInterval && !this.inBossFight;
    }
    
    startBossFight(playerX, playerY) {
        this.inBossFight = true;
        this.bossDefeated = false;
        this.lastBossScore = this.score;
        
        // Increment boss spawn count
        this.bossSpawnCount++;
        
        // Spawn boss near the player
        /* @tweakable list of boss types that can spawn */
        const availableBosses = [9, 10, 11, 12, 13];
        const bossType = availableBosses[Math.floor(Math.random() * availableBosses.length)];

        /* @tweakable Vertical distance from the player where the boss will spawn. A negative value spawns it above the player. */
        const bossSpawnOffsetY = -400;
        const boss = new Boss(playerX, playerY + bossSpawnOffsetY, bossType);
        
        // Scale boss health exponentially based on spawn count
        boss.health = boss.maxHealth * Math.pow(this.bossHealthMultiplier, this.bossSpawnCount - 1);
        boss.maxHealth = boss.health;
        this.zombies.push(boss);
    }
    
    endBossFight() {
        this.inBossFight = false;
        this.bossDefeated = true;
    }
}