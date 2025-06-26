/* @tweakable Font for hitbox info text. e.g. '12px "Courier New", monospace' */
const HITBOX_LABEL_FONT = '12px "VHSGothic", sans-serif';
/* @tweakable Color for hitbox info text. */
const HITBOX_LABEL_COLOR = 'rgba(255, 255, 255, 0.9)';
/* @tweakable Vertical offset in pixels for hitbox labels above their object. */
const HITBOX_LABEL_OFFSET = 5;

export class HitboxDrawer {
    constructor() {
        /* @tweakable Zombie melee attack range for hitbox visualization. This should match the value in objectManager. */
        this.ZOMBIE_ATTACK_RANGE = 25;
        /* @tweakable Player XP orb direct collection range for hitbox visualization. This should match the value in objectManager. */
        this.XP_ORB_COLLECT_RANGE = 25;
    }

    drawLabel(ctx, text, x, y, yOffset = 0) {
        ctx.font = HITBOX_LABEL_FONT;
        ctx.fillStyle = HITBOX_LABEL_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const vhsMode = document.body.classList.contains('vhs-mode');
        if (vhsMode) {
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(text, x, y - yOffset - HITBOX_LABEL_OFFSET);
        }

        ctx.fillText(text, x, y - yOffset - HITBOX_LABEL_OFFSET);
    }

    drawAllHitboxes(ctx, gameState, player) {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;

        // --- Player and Player-centric Ranges ---
        // Player hitbox
        ctx.strokeStyle = 'cyan';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        ctx.stroke();
        this.drawLabel(ctx, 'Player', player.x, player.y, player.size);
        
        // Player XP Orb Collection Range
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // green
        ctx.beginPath();
        ctx.arc(player.x, player.y, this.XP_ORB_COLLECT_RANGE, 0, Math.PI * 2);
        ctx.stroke();
        this.drawLabel(ctx, 'XP Collect', player.x, player.y, this.XP_ORB_COLLECT_RANGE);
        
        // Player XP Magnet Range
        ctx.strokeStyle = 'rgba(68, 136, 255, 0.7)'; // blueish
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.xpMagnetRange, 0, Math.PI * 2);
        ctx.stroke();
        this.drawLabel(ctx, 'XP Magnet', player.x, player.y, player.xpMagnetRange);
        
        // Player shoot range
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.shootRange, 0, Math.PI * 2);
        ctx.stroke();
        this.drawLabel(ctx, 'Shoot Range', player.x, player.y, player.shootRange);

        // Player Grenade Throw Range
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.7)'; // orange
        ctx.setLineDash([20, 5]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.grenadeRange, 0, Math.PI * 2);
        ctx.stroke();
        this.drawLabel(ctx, 'Grenade Range', player.x, player.y, player.grenadeRange);

        // Bullet Time Trigger Range
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)'; // light gray
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, gameState.bulletTimeTriggerDistance, 0, Math.PI * 2);
        ctx.stroke();
        this.drawLabel(ctx, 'Bullet Time Trigger', player.x, player.y, gameState.bulletTimeTriggerDistance);

        ctx.setLineDash([]); // Reset line dash
        
        // Auto-aim line
        if (gameState.autoAimTarget) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(gameState.autoAimTarget.x, gameState.autoAimTarget.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // --- Game Objects ---

        // Zombies and their attack range
        gameState.zombies.forEach(zombie => {
            ctx.strokeStyle = 'red';
            ctx.beginPath();
            ctx.arc(zombie.x, zombie.y, zombie.size, 0, Math.PI * 2);
            ctx.stroke();
            
            let label;
            if (zombie.isBoss) {
                label = 'Boss';
                if (zombie.isDashing) {
                    label = 'Boss (Dashing)';
                } else if (zombie.isChargingDash) {
                    label = 'Boss (Charging Dash)';
                }
            } else {
                label = 'Zombie';
                // Zombie attack range
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(zombie.x, zombie.y, this.ZOMBIE_ATTACK_RANGE, 0, Math.PI * 2);
                ctx.stroke();
                this.drawLabel(ctx, 'Melee Range', zombie.x, zombie.y, this.ZOMBIE_ATTACK_RANGE);
            }
            this.drawLabel(ctx, label, zombie.x, zombie.y, zombie.size);
        });

        // Bullets
        ctx.strokeStyle = 'yellow';
        gameState.bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Enemy Projectiles
        ctx.strokeStyle = 'magenta';
        gameState.enemyProjectiles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Grenade explosion radius
        ctx.strokeStyle = 'orange';
        gameState.grenades.forEach(grenade => {
            ctx.beginPath();
            ctx.arc(grenade.x, grenade.y, grenade.explosionRadius, 0, Math.PI * 2);
            ctx.stroke();
            this.drawLabel(ctx, 'Explosion Radius', grenade.x, grenade.y, grenade.explosionRadius);
        });

        // Spikes
        ctx.strokeStyle = '#ff9944';
        gameState.spikes.forEach(spike => {
            const spikeHitboxRadius = 15;
            ctx.beginPath();
            ctx.arc(spike.x, spike.y, spikeHitboxRadius, 0, Math.PI*2); // Collision check in collisionManager uses a hardcoded 15
            ctx.stroke();
            this.drawLabel(ctx, 'Spike', spike.x, spike.y, spikeHitboxRadius);
        });

        // Laser Beams
        ctx.strokeStyle = 'pink';
        gameState.laserBeams.forEach(laser => {
             if (laser.state !== 'firing') return;
             const originalLineWidth = ctx.lineWidth;
             ctx.lineWidth = laser.width;
             ctx.beginPath();
             ctx.moveTo(laser.startX, laser.startY);
             ctx.lineTo(laser.endX, laser.endY);
             ctx.stroke();
             ctx.lineWidth = originalLineWidth;
             const midX = (laser.startX + laser.endX) / 2;
             const midY = (laser.startY + laser.endY) / 2;
             this.drawLabel(ctx, 'Laser', midX, midY, laser.width / 2);
        });

        // Shockwaves
        ctx.strokeStyle = 'white';
        gameState.shockwaves.forEach(wave => {
            const waveThickness = 15;
            const originalLineWidth = ctx.lineWidth;
            ctx.lineWidth = waveThickness;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = originalLineWidth;
            this.drawLabel(ctx, 'Shockwave', wave.x, wave.y, wave.radius + waveThickness / 2);
        });
        
        // Danger Zones (missile impacts)
        ctx.strokeStyle = '#ff44ff';
        gameState.dangerZones.forEach(zone => {
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            ctx.stroke();
            this.drawLabel(ctx, 'Missile Impact', zone.x, zone.y, zone.radius);
        });
        
        // XP Orbs
        ctx.strokeStyle = 'lime';
        gameState.xpOrbs.forEach(orb => {
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Magnets
        ctx.strokeStyle = 'blue';
        gameState.magnets.forEach(magnet => {
            ctx.beginPath();
            ctx.arc(magnet.x, magnet.y, magnet.size, 0, Math.PI * 2);
            ctx.stroke();
            this.drawLabel(ctx, 'Magnet Pickup', magnet.x, magnet.y, magnet.size);
        });

        // Draw projectile prediction boxes for bullet time
        /* @tweakable How far ahead to predict projectile paths for bullet time, in pixels (for hitbox viz). */
        const PREDICTION_DISTANCE = 150;
        /* @tweakable The width of the projectile danger zone for bullet time (for hitbox viz). */
        const PREDICTION_WIDTH = 50;

        ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)'; // light gray
        ctx.setLineDash([4, 4]);
        gameState.enemyProjectiles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.strokeRect(0, -PREDICTION_WIDTH / 2, PREDICTION_DISTANCE, PREDICTION_WIDTH);
            ctx.restore();
        });
        ctx.setLineDash([]);

        ctx.restore();
    }
}