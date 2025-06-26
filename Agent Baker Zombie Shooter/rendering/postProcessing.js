export class PostProcessor {
    constructor(canvas, ctx, offscreenCanvas, offscreenCtx, backgroundColor) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.offscreenCanvas = offscreenCanvas;
        this.offscreenCtx = offscreenCtx;
        this.backgroundColor = backgroundColor || '#2a2a2a';
    }

    applyPostProcessing(bloomEnabled) {
        // Draw the (potentially pixelated) offscreen scene to the main canvas.
        // The main canvas is assumed to be cleared by the Renderer before this call.
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        if (bloomEnabled) {
            this.applyBloom();
        }

        this.applyScanlinesAndVignette();
    }

    applyBloom(standalone = false) {
        this.ctx.save();
        if (standalone) {
            /* @tweakable intensity of standalone bloom effect */
            this.ctx.globalAlpha = 0.3;
            /* @tweakable blur amount of standalone bloom effect */
            this.ctx.filter = 'blur(8px) brightness(1.1)';
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            /* @tweakable bloom effect intensity for VHS filter */
            this.ctx.globalAlpha = 0.35;
            /* @tweakable bloom effect blur amount for VHS filter (e.g. 'blur(10px) brightness(1.3)') */
            this.ctx.filter = 'blur(10px) brightness(1.3)';
            this.ctx.globalCompositeOperation = 'lighter';
            this.ctx.drawImage(this.offscreenCanvas, 0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.restore();
    }

    applyScanlinesAndVignette() {
        this.ctx.save();
        // Scanlines
        /* @tweakable Scanline color and opacity for VHS filter */
        this.ctx.fillStyle = 'rgba(10, 10, 25, 0.1)';
        for (let i = 0; i < this.canvas.height; i += 4) {
            this.ctx.fillRect(0, i, this.canvas.width, 2);
        }

        // Vignette
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.height * 0.4,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.6
        );
        /* @tweakable Inner vignette color for VHS filter */
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        /* @tweakable Outer vignette color and intensity for VHS filter */
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.restore();
    }
}