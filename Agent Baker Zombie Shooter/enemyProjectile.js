/* @tweakable The speed multiplier for enemy projectiles inside a time stop field. 0.5 is 50% speed. */
const TIME_STOP_PROJECTILE_SPEED_MULTIPLIER = 0.5;

export class EnemyProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        /* @tweakable damage of boss projectiles */
        this.damage = damage;
        /* @tweakable speed of boss projectiles */
        this.speed = 250;
        /* @tweakable size of boss projectiles */
        this.size = 5;

        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.color = '#ff44ff';
    }

    update(deltaTime, gameState) {
        let finalSpeedMultiplier = 1;

        if (gameState && gameState.slowZones.length > 0) {
            for (const zone of gameState.slowZones) {
                const distToZone = Math.hypot(this.x - zone.x, this.y - zone.y);
                if (distToZone < zone.radius) {
                    finalSpeedMultiplier = TIME_STOP_PROJECTILE_SPEED_MULTIPLIER;
                    break;
                }
            }
        }

        this.x += this.vx * deltaTime * finalSpeedMultiplier;
        this.y += this.vy * deltaTime * finalSpeedMultiplier;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}