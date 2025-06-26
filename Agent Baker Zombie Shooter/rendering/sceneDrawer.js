import * as objectDrawers from './objectDrawers.js';

/** 
 * @tweakable Controls how the camera zoom behaves when bullet time starts.
 * `true`: The zoom snaps instantly to its full value for a jarring, impactful effect.
 * `false`: The zoom eases in smoothly along with the vignette effect.
 */
const instantZoomOnTrigger = false;

/** @tweakable Min and max values for the camera zoom slider. */
const ZOOM_RANGE = { min: 0.5, max: 2.0 };

export class SceneDrawer {
    constructor() {
        this.camera = { 
            x: 0, y: 0, initialized: false,
            panX: 0, panY: 0, zoom: 1.0
        };
        this.worldSize = { width: 3000, height: 2000 }; // Default values

        /* @tweakable chest image size */
        this.chestSize = 50;
        /* @tweakable chest image source path */
        this.chestImagePath = '/asset/chest.png';
        this.chestImage = new Image();
        this.chestLoaded = false;
        this.chestImage.onload = () => { this.chestLoaded = true; };
        this.chestImage.onerror = () => { console.error('Failed to load chest image:', this.chestImagePath); };
        this.chestImage.src = this.chestImagePath;
    }

    reset() {
        this.camera.initialized = false;
    }

    setWorldSize(size) {
        this.worldSize = size;
    }

    updateCamera(gameState, player, canvas, userZoom) {
        if (!this.camera.initialized) {
            this.camera.x = player.x;
            this.camera.y = player.y;
            this.camera.initialized = true;
        }

        let panX = player.x;
        let panY = player.y;
        let currentZoom = userZoom;
        
        /* @tweakable Camera follow speed. A lower value (e.g., 0.05) is smoother, while 1.0 provides an instant lock. */
        const cameraFollowSpeed = 0.05;
        this.camera.x += (player.x - this.camera.x) * cameraFollowSpeed;
        this.camera.y += (player.y - this.camera.y) * cameraFollowSpeed;
        panX = this.camera.x;
        panY = this.camera.y;
        
        const zoomIntensity = (instantZoomOnTrigger && gameState.isBulletTime)
            ? 1
            : gameState.bulletTimeVignette;
        if (zoomIntensity > 0) {
            /* @tweakable bullet time zoom intensity factor (0 = none, 1 = full) */
            const bulletTimeZoomValue = 1 + (gameState.bulletTimeZoom - 1) * zoomIntensity;
            currentZoom *= bulletTimeZoomValue;
            panX = player.x; // Lock pan to player during bullet time
            panY = player.y;
        }

        this.camera.panX = panX;
        this.camera.panY = panY;
        this.camera.zoom = currentZoom;
    }

    screenToWorld(screenPos, canvas) {
        const worldX = (screenPos.x - canvas.width / 2) / this.camera.zoom + this.camera.panX;
        const worldY = (screenPos.y - canvas.height / 2) / this.camera.zoom + this.camera.panY;
        return { x: worldX, y: worldY };
    }

    renderScene(ctx, gameState, player, canvas, showHitboxes, hitboxDrawer, userZoom = 1.0) {
        ctx.save();

        const { panX, panY, zoom } = this.camera;

        // The camera should pan if it's following the player, or if any zoom is active.
        const shouldPan = true;

        if (shouldPan) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(-panX, -panY);
        }

        // Draw grid
        if (shouldPan) {
            objectDrawers.drawGrid(ctx, this.worldSize.width, this.worldSize.height);
        } else {
            objectDrawers.drawGrid(ctx, canvas.width, canvas.height);
        }
        
        objectDrawers.drawSlowZones(gameState.slowZones, ctx);
        objectDrawers.drawDangerZones(gameState.dangerZones, ctx);

        // Draw game objects
        gameState.xpOrbs.forEach(orb => orb.draw(ctx));
        gameState.bullets.forEach(bullet => bullet.draw(ctx));
        gameState.enemyProjectiles.forEach(p => p.draw(ctx));
        gameState.zombies.forEach(zombie => zombie.draw(ctx));
        gameState.particles.forEach(particle => particle.draw(ctx));
        gameState.spikes.forEach(spike => objectDrawers.drawSpike(spike, ctx));
        gameState.grenades.forEach(grenade => grenade.draw(ctx));
        gameState.magnets.forEach(magnet => magnet.draw(ctx));
        // Draw boss reward chests
        gameState.chests.forEach(chest => {
            if (this.chestLoaded && this.chestImage.naturalWidth > 0) {
                ctx.drawImage(
                    this.chestImage,
                    chest.x - this.chestSize / 2,
                    chest.y - this.chestSize / 2,
                    this.chestSize,
                    this.chestSize
                );
            }
        });
        player.draw(ctx);
        objectDrawers.drawLightning(gameState.lightningBolts, ctx);
        objectDrawers.drawLaserBeams(gameState.laserBeams, ctx);
        objectDrawers.drawShockwaves(gameState.shockwaves, ctx);
        
        // Draw hitboxes inside the transformed context so they align with the scene
        if (showHitboxes && hitboxDrawer) {
            hitboxDrawer.drawAllHitboxes(ctx, gameState, player);
            // Redraw health bars on top of debug info so they are always visible
            gameState.zombies.forEach(zombie => {
                if(zombie.drawHealthBar) {
                    zombie.drawHealthBar(ctx);
                }
            });
        }
        
        ctx.restore();
    }
}