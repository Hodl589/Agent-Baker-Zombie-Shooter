import { SceneDrawer } from './rendering/sceneDrawer.js';
import { PostProcessor } from './rendering/postProcessing.js';
import { HitboxDrawer } from './rendering/hitboxDrawer.js';

export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        /* @tweakable The background color of the game world. */
        this.backgroundColor = '#2a2a2a';
        /* @tweakable The current user-defined camera zoom level. */
        this.userZoom = 1.0;

        // For VHS filter
        /* @tweakable Default state of the VHS filter on game start */
        this.vhsFilterEnabled = false;
        /* @tweakable Default state of the Bloom effect on game start */
        this.bloomEnabled = true;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        /* @tweakable Toggles rendering of all game hitboxes */
        this.showHitboxes = false;

        this.sceneDrawer = new SceneDrawer();
        this.postProcessor = new PostProcessor(this.canvas, this.ctx, this.offscreenCanvas, this.offscreenCtx, this.backgroundColor);
        this.hitboxDrawer = new HitboxDrawer();
    }
    
    render(gameState, player) {
        const isMobile = document.body.classList.contains('is-mobile');
        // Always clear the main canvas at the beginning of each frame to prevent visual artifacts.
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.vhsFilterEnabled) {
            this.renderToOffscreen(gameState, player, true);
            this.postProcessor.applyPostProcessing(this.bloomEnabled);
        } else if (this.bloomEnabled) {
            // Bloom only mode: Render to offscreen canvas to prevent read/write conflicts on main canvas
            this.renderToOffscreen(gameState, player, false);
            
            this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width, this.canvas.height);
            // Now apply bloom using the offscreen buffer as a source, drawing on top of the main canvas
            this.postProcessor.applyBloom(false);
        } else {
            // Regular rendering, no effects
            this.sceneDrawer.renderScene(this.ctx, gameState, player, this.canvas, this.showHitboxes, this.hitboxDrawer, this.userZoom);
        }
        
        this.drawOverlays(gameState);
    }

    renderToOffscreen(gameState, player, pixelate = true, isMobile = false) {
        /* @tweakable VHS pixelation factor. Higher is more pixelated. A value of 2-4 is a good starting point. */
        const pixelationFactor = pixelate ? 2 : 1;
        const targetWidth = this.canvas.width / pixelationFactor;
        const targetHeight = this.canvas.height / pixelationFactor;

        if (this.offscreenCanvas.width !== targetWidth || this.offscreenCanvas.height !== targetHeight) {
            this.offscreenCanvas.width = targetWidth;
            this.offscreenCanvas.height = targetHeight;
        }

        // Fix: Clear the offscreen canvas before drawing to prevent trails and visual artifacts.
        this.offscreenCtx.fillStyle = this.backgroundColor;
        this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        this.offscreenCtx.save();
        this.offscreenCtx.scale(1 / pixelationFactor, 1 / pixelationFactor);
        this.sceneDrawer.renderScene(this.offscreenCtx, gameState, player, this.canvas, this.showHitboxes, this.hitboxDrawer, this.userZoom);
        this.offscreenCtx.restore();
    }

    drawOverlays(gameState) {
        // Bullet Time Vignette
        if (gameState.bulletTimeVignette > 0) {
            this.ctx.save();
            /* @tweakable Color of the bullet time vignette effect. */
            const vignetteColor = 'rgba(0, 0, 0, 0.8)';
            const outerRadius = this.canvas.width * 0.7;
            const innerRadius = outerRadius * (1 - gameState.bulletTimeVignette);
    
            const bulletTimeGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, innerRadius,
                this.canvas.width / 2, this.canvas.height / 2, outerRadius
            );
            bulletTimeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            bulletTimeGradient.addColorStop(1, vignetteColor);
            this.ctx.fillStyle = bulletTimeGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }
}