export class Bullet {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        /* @tweakable bullet speed */
        this.speed = 450;
        /* @tweakable bullet size */
        this.size = 3;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        /* @tweakable whether bullet pierces through enemies */
        this.pierce = false;
        this.color = '#ffff44';
        this.isPlasma = false;
        
        // For piercing/special bullets
        /* @tweakable damage reduction for each enemy pierced by a plasma bolt */
        this.damageFalloff = 0.5;
        this.hits = 0;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    draw(ctx) {
        if (this.isPlasma) {
            ctx.save();
            /* @tweakable bloom effect for plasma bullets (size multiplier) */
            const plasmaBloomSize = 4.0;
            /* @tweakable bloom effect for plasma bullets (gradient inner color) */
            const plasmaGlowInner = 'rgba(255, 255, 255, 0.8)';
            /* @tweakable bloom effect for plasma bullets (gradient outer color) */
            const plasmaGlowOuter = 'rgba(200, 225, 255, 0)';
            const glowGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * plasmaBloomSize);
            glowGradient.addColorStop(0, plasmaGlowInner);
            glowGradient.addColorStop(1, plasmaGlowOuter);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * plasmaBloomSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}