import { ZOMBIE_TYPES } from './zombie_types.js';
import { darkenColor } from './utils.js';

/* @tweakable speed multiplier for zombies in time stop field. 0.5 is 50% speed. */
const TIME_STOP_ZOMBIE_SPEED_MULTIPLIER = 0.5;

export class Zombie {
    constructor(x, y, type = 0) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.justAttacked = false;
        this.lastSpikeTime = 0;
        
        this.isBoss = false;

        this.setupType(type);
    }

    setupType(type) {
        const typeData = ZOMBIE_TYPES[type] || ZOMBIE_TYPES[0];
        
        this.size = typeData.size;
        this.speed = typeData.speed;
        this.health = typeData.health;
        this.maxHealth = this.health;
        this.damage = typeData.damage;
        this.scoreValue = typeData.score;
        this.color = typeData.color;
        this.xpValue = typeData.xpValue;
    }
    
    update(deltaTime, playerX, playerY, gameState, playSound) {
        let speedMultiplier = 1;

        // Check for slow zones
        if (gameState && gameState.slowZones.length > 0) {
            for (const zone of gameState.slowZones) {
                const distToZone = Math.hypot(this.x - zone.x, this.y - zone.y);
                if (distToZone < zone.radius) {
                    speedMultiplier = TIME_STOP_ZOMBIE_SPEED_MULTIPLIER;
                    break; // A zombie can only be in one zone's effect at a time
                }
            }
        }

        // Move towards player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * speedMultiplier * deltaTime;
            this.y += (dy / dist) * this.speed * speedMultiplier * deltaTime;
        }
    }

    takeDamage(damage) {
        this.health -= damage;
    }
    
    drawHealthBar(ctx) {
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#888';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth, barHeight);
            
            ctx.fillStyle = '#ff6666';
            ctx.fillRect(this.x - barWidth/2, this.y - this.size - 10, barWidth * healthPercent, barHeight);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Zombie body with gradient for depth
        const gradient = ctx.createRadialGradient(0, -this.size * 0.2, 0, 0, 0, this.size);
        /* @tweakable The highlight color on a zombie's body. */
        const lighterColor = '#ffffff'; // Using white for a generic highlight, can be customized
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.8, darkenColor(this.color, 0.4));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add type-specific details
        this.drawTypeDetails(ctx);
        
        // Eyes
        /* @tweakable The color of zombie eyes. */
        const eyeColor = '#ff1111';
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.1, this.size * 0.15, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, -this.size * 0.1, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        // Draw health bar last so it's on top
        this.drawHealthBar(ctx);
    }
    
    drawTypeDetails(ctx) {
        ctx.strokeStyle = darkenColor(this.color, 0.6);
        ctx.lineWidth = this.size / 8;
        
        // Example details, can be expanded for each type
        switch(this.type) {
            case 1: // Tank - armor plates
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.rect(-this.size * 0.7, -this.size * 0.7, this.size * 1.4, this.size * 1.4);
                ctx.stroke();
                ctx.fill();
                break;
            case 2: // Fast - motion lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-this.size * 0.8, 0);
                ctx.lineTo(-this.size * 1.5, 0);
                ctx.moveTo(-this.size * 0.7, this.size * 0.4);
                ctx.lineTo(-this.size * 1.3, this.size * 0.5);
                ctx.moveTo(-this.size * 0.7, -this.size * 0.4);
                ctx.lineTo(-this.size * 1.3, -this.size * 0.5);
                ctx.stroke();
                break;
            case 3: // Spitter - toxic spots
                ctx.fillStyle = '#44ff44';
                for(let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    const x = this.x + Math.cos(angle) * (this.size * 0.7);
                    const y = this.y + Math.sin(angle) * (this.size * 0.7);
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#22aa22';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                break;
            case 4: // Brute - metal spikes
                ctx.fillStyle = '#888';
                for(let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2;
                    const x = this.x + Math.cos(angle) * this.size;
                    const y = this.y + Math.sin(angle) * this.size;
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 5: // Runner - speed lines
                ctx.strokeStyle = '#ffaa66';
                ctx.lineWidth = 1;
                for(let i = 0; i < 5; i++) {
                    const x = this.x - 15 + i * 3;
                    ctx.beginPath();
                    ctx.moveTo(x, this.y - 3);
                    ctx.lineTo(x - 8, this.y - 3);
                    ctx.stroke();
                }
                break;
            case 6: // Soldier - helmet
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.arc(this.x, this.y - 2, this.size * 0.8, Math.PI, 0);
                ctx.fill();
                break;
            case 7: // Heavy - shoulder pads
                ctx.fillStyle = '#666';
                ctx.fillRect(this.x - this.size - 2, this.y - 6, 8, 12);
                ctx.fillRect(this.x + this.size - 6, this.y - 6, 8, 12);
                break;
            case 8: // Scout - goggles
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.arc(this.x - 3, this.y - 2, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 3, this.y - 2, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 9: // Stalker
                ctx.fillStyle = '#228B22';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size);
                ctx.lineTo(this.x - 4, this.y + this.size);
                ctx.lineTo(this.x + 4, this.y + this.size);
                ctx.closePath();
                ctx.fill();
                break;
            case 10: // Goliath
                ctx.fillStyle = '#4682B4';
                ctx.fillRect(this.x - this.size, this.y - 4, this.size*2, 8);
                break;
            case 11: // Frenzy
                 ctx.strokeStyle = '#DAA520';
                 ctx.lineWidth = 3;
                 ctx.beginPath();
                 ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
                 ctx.stroke();
                 break;
            default:
                // Generic texture for other zombies
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(0, this.size);
                ctx.moveTo(-this.size, 0);
                ctx.lineTo(this.size, 0);
                ctx.stroke();
                break;
        }
    }
}