import { Player } from './player.js';
import { GameState } from './gameState.js';
import { InputManager } from './inputManager.js';
import { PowerupSystem } from './powerupSystem.js';
import { CollisionManager } from './collisionManager.js';
import { Renderer } from './renderer.js';
import { Grenade } from './grenade.js';
import { ShopSystem } from './shopSystem.js';
import { UIManager } from './uiManager.js';
import { AudioManager } from './audioManager.js';
import { EnemySpawner } from './enemySpawner.js';
import { ObjectManager } from './objectManager.js';
import { GameFlowManager } from './gameFlowManager.js';
import * as playerAbilities from './player/playerAbilities.js';
import * as playerCombat from './player/playerCombat.js';

/* @tweakable If true, resuming from the pause menu resets the player's shooting cooldown. */
const RESET_SHOOT_COOLDOWN_ON_RESUME = true;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.preloadAssets();
        
        // Core Systems
        this.gameState = new GameState();
        this.inputManager = new InputManager(this.canvas);
        
        // Managers
        this.initAudioManager();
        this.initUIManager();

        // Game Logic Systems
        this.renderer = new Renderer(this.canvas, this.ctx);
        /* @tweakable Dimensions of the game world. */
        this.worldSize = { width: 3000, height: 2000 };
        this.renderer.sceneDrawer.setWorldSize(this.worldSize);
        this.powerupSystem = new PowerupSystem(this.gameState);
        this.collisionManager = new CollisionManager(this.gameState, this.audioManager);
        this.spawner = new EnemySpawner(this.gameState, this.canvas);
        this.objectManager = new ObjectManager(this.gameState, this.canvas, this.collisionManager, this.audioManager, this.renderer);
        
        // Debugging / Performance Metrics
        /* @tweakable Toggles the visibility of the performance debug overlay. */
        this.showDebugInfo = false;
        /* @tweakable Number of frames over which to average the FPS for a stable reading. */
        this.fpsSmoothingFrames = 30;
        this.frameTimes = [];
        this.lastDebugUpdateTime = 0;

        // Sync UI with initial renderer settings. This logic was incorrectly in resizeCanvas.
        const vhsCheckbox = document.getElementById('vhsFilterCheckbox');
        if (vhsCheckbox) {
            vhsCheckbox.checked = this.renderer.vhsFilterEnabled;
        }
        const bloomCheckbox = document.getElementById('bloomCheckbox');
        if (bloomCheckbox) {
            bloomCheckbox.checked = this.renderer.bloomEnabled;
        }
        document.body.classList.toggle('vhs-mode', this.renderer.vhsFilterEnabled);

        this.resizeCanvas();
        
        // Game and Player Data
        this.initGameData();
        this.gameFlowManager = new GameFlowManager(this);
        
        // Event Listeners
        this.setupGlobalEventListeners();
        
        this.start();
    }

    preloadAssets() {
        const imagePaths = [
            '/grenade_ui.png',
            '/time_stop_icon.png',
            '/asset/dash_icon.png',
            '/asset/shield_icon.png',
            '/asset/chest.png',
            '/bullet_time_icon.png',
            '/magnet.png'
        ];
        /* Optimization: Preload all critical UI icons from the single texture atlas file.
         * This ensures the main UI is ready at launch while still benefiting from a single download. */
        imagePaths.push('/ui_atlas.png');

        const preloadContainer = document.createElement('div');
        preloadContainer.style.position = 'absolute';
        preloadContainer.style.opacity = '0';
        preloadContainer.style.pointerEvents = 'none';
        preloadContainer.style.width = '1px';
        preloadContainer.style.height = '1px';
        preloadContainer.style.overflow = 'hidden';
        document.body.appendChild(preloadContainer);

        imagePaths.forEach(path => {
            const img = new Image();
            img.src = path;
            preloadContainer.appendChild(img);
        });

        // The container with images is added to the DOM, forcing a load.
        // We can remove it after a short delay.
        setTimeout(() => {
            if (document.body.contains(preloadContainer)) {
                document.body.removeChild(preloadContainer);
            }
        }, 500);
    }

    initAudioManager() {
        /* @tweakable volume for each sound effect (0 to 1) */
        const soundVolumes = {
            'missile_explosion': 0.5,
            'boss_shoot': 0.4,
            'purchase_upgrade': 0.6,
            'boss_music': 0.3,
            'magnet_pickup': 0.7
        };
        this.audioManager = new AudioManager(soundVolumes);
        /* Lazy-Loading Improvement:
         * Only critical, frequently used sounds are pre-loaded here.
         * Larger, situational sounds like 'boss_music' are now loaded on-demand
         * when the boss fight actually starts. See GameFlowManager. */
        this.audioManager.load({
            'missile_explosion': '/missile_explosion.mp3',
            'boss_shoot': '/boss_shoot.mp3',
            'purchase_upgrade': '/purchase_upgrade.mp3',
            // 'boss_music': '/boss_music.mp3', // This is now lazy-loaded
            'magnet_pickup': '/magnet_pickup.mp3'
        });
    }

    initUIManager() {
        const uiCallbacks = {
            onResume: this.resumeGame.bind(this),
            onRestart: this.restart.bind(this),
            onSelectPowerup: this.selectPowerup.bind(this),
            onSkipPowerup: this.skipPowerup.bind(this),
            onSelectBossReward: this.selectBossReward.bind(this),
            onSkipBossReward: this.skipBossReward.bind(this),
            onFinishBossRewardSelection: this.finishBossRewardSelection.bind(this),
            onSelectShopItem: this.selectShopItem.bind(this),
            onCloseShop: this.closeShop.bind(this),
            onToggleVhsFilter: this.toggleVhsFilter.bind(this),
            onToggleBloom: this.toggleBloom.bind(this),
            onToggleHitboxes: this.toggleHitboxes.bind(this),
            onToggleBulletTime: this.toggleBulletTime.bind(this),
            onToggleDebugInfo: this.toggleDebugInfo.bind(this),
        };
        this.uiManager = new UIManager(uiCallbacks);

        if ('ontouchstart' in window) {
            document.body.classList.add('is-mobile');
        }
    }
    
    initGameData() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.shopSystem = new ShopSystem(this.gameState, this.player, (name) => this.audioManager.play(name), this.powerupSystem);
        this.renderer.userZoom = 1.0;
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if(this.spawner) this.spawner.canvas = this.canvas;
        if(this.renderer) this.renderer.canvas = this.canvas;
        if(this.objectManager) this.objectManager.canvas = this.canvas;
    }

    setupGlobalEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('mobilePauseBtn')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', (e) => {
                const zoom = parseFloat(e.target.value);
                this.renderer.userZoom = zoom;
                zoomValue.textContent = `${zoom.toFixed(1)}x`;
            });
        }
    }
    
    restart() {
        this.audioManager.stopMusic();
        this.gameState.reset();
        this.uiManager.hideDeathScreen();
        this.uiManager.togglePauseMenu(false);
        this.uiManager.hidePowerupSelection();
        this.initGameData();
        this.renderer.sceneDrawer.reset();

        // Reset zoom slider UI
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        if (zoomSlider && zoomValue) {
            zoomSlider.value = 1.0;
            zoomValue.textContent = '1.0x';
        }

        this.gameFlowManager = new GameFlowManager(this);
        this.gameState.isPaused = false; // Ensure game is not paused on restart
    }
    
    start() {
        this.gameState.gameRunning = true;
        this.gameState.lastTime = performance.now();
        
        // Start paused
        this.gameState.isPaused = true;
        this.uiManager.updateUpgradeSummary(this.player, this.gameState, this.powerupSystem.allPowerups, this.shopSystem.regularUpgrades, this.shopSystem.bossUpgrades);
        this.uiManager.togglePauseMenu(true);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /* Game Loop Optimization:
     * The game uses requestAnimationFrame for its main loop. This is the browser-native
     * way to run game loops, ensuring that rendering is synchronized with the display's
     * refresh rate. This leads to smoother animations and better performance by allowing
     * the browser to optimize when the code runs, and it automatically pauses when the
     * tab is not visible, saving system resources. */
    gameLoop(currentTime = 0) {
        if (!this.gameState.gameRunning) return;
        
        const deltaTime = (currentTime - this.gameState.lastTime) / 1000;
        this.gameState.lastTime = currentTime;
        
        if (!this.gameState.isPaused) {
            if (this.gameState.bulletTimeTimer > 0) {
                this.gameState.bulletTimeTimer -= deltaTime;
            }
            this.update(deltaTime);
        } else {
            // To prevent large deltaTime jump after unpausing
            this.gameState.lastTime = performance.now();
        }
        
        this.renderer.render(this.gameState, this.player);
        this.updateDebugDisplay(currentTime);
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (this.gameState.isGameOver) return;
        
        this.gameFlowManager.update(deltaTime);
        if (this.gameState.isPaused) return; // a game flow action might pause the game
        
        // Update camera position before any other updates that might depend on it.
        this.renderer.sceneDrawer.updateCamera(this.gameState, this.player, this.canvas, this.renderer.userZoom);
        
        const effectiveDeltaTime = this.gameState.isBulletTime 
            ? deltaTime * this.gameState.bulletTimeSlowdown 
            : deltaTime;

        this.gameState.updateGameTime(effectiveDeltaTime);
        
        this.handleInput(effectiveDeltaTime);
        const isMobile = document.body.classList.contains('is-mobile');
        this.player.update(effectiveDeltaTime, this.gameState, this.canvas.width, this.canvas.height, this.worldSize, isMobile);
        
        this.spawner.update(effectiveDeltaTime, this.player, this.renderer.userZoom);
        
        this.objectManager.updateAll(effectiveDeltaTime, this.player);
        
        this.collisionManager.checkAllCollisions(this.player);
        this.objectManager.handleEvents();
        
        this.updateUI();
    }

    /**
     * Calculates and displays performance metrics if the debug overlay is active.
     * @param {number} currentTime - The current timestamp from performance.now().
     */
    updateDebugDisplay(currentTime) {
        if (!this.showDebugInfo) return;

        const now = performance.now();
        while (this.frameTimes.length > 0 && this.frameTimes[0] <= now - 1000) {
            this.frameTimes.shift();
        }
        this.frameTimes.push(now);
        const fps = this.frameTimes.length;

        // Update display periodically to avoid jitter
        if (currentTime - this.lastDebugUpdateTime > 500) { // Update every 500ms
            const memory = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0;
            this.uiManager.popupManager.updateDebugInfo(fps, memory);
            this.lastDebugUpdateTime = currentTime;
        }
    }

    handleInput(deltaTime) {
        const movement = this.inputManager.getMovement();
        
        if (this.inputManager.isDashPressed()) {
            playerAbilities.useDash(this.player, movement, this.gameState);
        }

        this.player.move(movement.x, movement.y, deltaTime, this.gameState.isBulletTime);
        
        if (this.inputManager.isGrenadePressed()) {
            playerCombat.throwGrenade(this.player, this.gameState);
        }
        if (this.inputManager.isTimeStopPressed()) {
            playerAbilities.useTimeStop(this.player, this.gameState);
        }
    }

    updateUI() {
        this.uiManager.updateHealth(this.player.health, this.player.maxHealth);
        this.uiManager.updateXP(this.player.xp, this.player.xpRequired, this.player.level);
        this.uiManager.updateStats(this.gameState.score, this.gameState.wave);
        this.uiManager.updateGrenadeUI(this.player.currentGrenades, this.player.maxGrenades);
        this.uiManager.updateTimeStopUI(this.player.hasTimeStop, this.player.timeStopCooldown, this.player.timeStopTimer);
        this.uiManager.updateDashUI(this.player.hasDash, this.player.dashCooldown, this.player.dashCooldownTimer);
        this.uiManager.updateBulletTimeUI(this.gameState.isBulletTimeEnabled, this.gameState.bulletTimeCooldown, this.gameState.bulletTimeTimer);
        this.uiManager.updateShieldUI(this.player.maxShields > 0, this.player.currentShields, this.player.maxShields, this.player.shieldRegenCooldown, this.player.shieldRegenTimer);
        this.uiManager.updateFinalStandUI(this.player.hasFinalStand, this.player.finalStandReady, this.player.finalStandCooldown, this.player.finalStandCooldownTimer, this.player.finalStandActive);
    }
    
    togglePause() {
        if (this.gameState.isGameOver) return;

        // The logic for resetting shooting cooldown on unpause has been removed.
        // A new timestamp-based cooldown system is now used which is not affected by pausing.
        this.gameState.togglePause();
        if (this.gameState.isPaused) {
            this.uiManager.updateUpgradeSummary(this.player, this.gameState, this.powerupSystem.allPowerups, this.shopSystem.regularUpgrades, this.shopSystem.bossUpgrades);
        }
        this.uiManager.togglePauseMenu(this.gameState.isPaused);
    }

    resumeGame() {
        // Try to enter fullscreen on mobile when the game is first resumed.
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
        if ('ontouchstart' in window && !isFullscreen) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(e => console.error("Could not enter fullscreen:", e));
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen().catch(e => console.error("Could not enter fullscreen (webkit):", e));
            }
        }

        // The resume button is just another way to toggle the pause state.
        // The old cooldown reset logic was handled centrally in togglePause and has now been replaced by a timestamp system.
        if (this.gameState.isPaused) {
            this.togglePause();
        }
    }

    toggleVhsFilter(enabled) {
        this.renderer.vhsFilterEnabled = enabled;
        document.body.classList.toggle('vhs-mode', enabled);
    }

    toggleBloom(enabled) {
        this.renderer.bloomEnabled = enabled;
    }

    toggleHitboxes(enabled) {
        this.renderer.showHitboxes = enabled;
    }

    toggleBulletTime(enabled) {
        this.gameState.isBulletTimeEnabled = enabled;
        if (!enabled && this.gameState.isBulletTime) {
            this.gameFlowManager.endBulletTime();
        }
    }

    toggleDebugInfo(enabled) {
        this.showDebugInfo = enabled;
        this.uiManager.popupManager.toggleDebugOverlay(enabled);
        if (!enabled) {
            this.frameTimes = []; // Reset metrics when hiding
        }
    }

    selectPowerup(index) {
        this.powerupSystem.selectPowerup(index, this.player);
        this.uiManager.hidePowerupSelection();
        this.gameState.isPaused = false;
    }

    skipPowerup() {
        this.uiManager.hidePowerupSelection();
        this.gameState.isPaused = false;
    }

    selectBossReward(index) {
        const reward = this.gameFlowManager.currentBossRewardOptions[index];
        if (reward && reward.effect) {
            reward.effect(this.player, this.gameState);
            if (reward.unique) {
                this.player[reward.id] = true;
            }
        }
    }

    skipBossReward() {
        this.gameState.isPaused = false;
        // Player skipped reward, clear the chest that triggered it
        this.gameState.chests = [];
    }

    finishBossRewardSelection() {
        this.gameState.isPaused = false;
        this.gameState.chests = [];
    }
    
    showShop() {
        this.gameState.isPaused = true;
        const items = this.shopSystem.generateShopItems();
        this.uiManager.showShop(items, this.gameState.score);
    }

    selectShopItem(index) {
        const success = this.shopSystem.selectShopItem(index);
        if (success) {
            this.uiManager.updateAfterPurchase(this.gameState.score, this.shopSystem.currentShopItems);
            this.updateUI(); // Update score display
        }
    }

    closeShop() {
        this.uiManager.hideShop();
        this.gameState.isPaused = false;
    }
}

// Start the game
new Game();