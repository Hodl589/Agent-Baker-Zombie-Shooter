import { Zombie } from './zombie.js';

export class EnemySpawner {
    constructor(gameState, canvas) {
        this.gameState = gameState;
        this.canvas = canvas;
    }

    update(deltaTime, player, userZoom = 1.0) {
        if (Math.random() < this.gameState.zombieSpawnRate * deltaTime && this.gameState.zombies.length < this.gameState.maxZombies) {
            this.spawnZombie(player, userZoom);
        }
    }

    spawnZombie(player, userZoom = 1.0) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        /* @tweakable Distance outside the camera view to spawn enemies. */
        const spawnMargin = 50;

        const viewWidth = this.canvas.width / userZoom;
        const viewHeight = this.canvas.height / userZoom;

        const spawnRangeX = viewWidth / 2 + spawnMargin;
        const spawnRangeY = viewHeight / 2 + spawnMargin;

        const randomXInView = (Math.random() - 0.5) * viewWidth;
        const randomYInView = (Math.random() - 0.5) * viewHeight;

        switch(side) {
            case 0: // Top
                x = player.x + randomXInView;
                y = player.y - spawnRangeY;
                break;
            case 1: // Right
                x = player.x + spawnRangeX;
                y = player.y + randomYInView;
                break;
            case 2: // Bottom
                x = player.x + randomXInView;
                y = player.y + spawnRangeY;
                break;
            case 3: // Left
                x = player.x - spawnRangeX;
                y = player.y + randomYInView;
                break;
        }

        const zombieType = this.getZombieTypeForTime();
        this.gameState.zombies.push(new Zombie(x, y, zombieType));
    }

    getZombieTypeForTime() {
        /* @tweakable enemy type progression timing - new enemies unlock at these game time marks (in seconds) */
        const timeThresholds = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
        
        for (let i = timeThresholds.length - 1; i >= 0; i--) {
            if (this.gameState.gameTime >= timeThresholds[i]) {
                // Spawn zombies up to the unlocked tier
                const spawnableMaxType = Math.min(i, 11);
                return Math.floor(Math.random() * (spawnableMaxType + 1));
            }
        }
        return 0;
    }
}