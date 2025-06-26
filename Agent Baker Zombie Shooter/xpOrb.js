/* @tweakable XP orb color thresholds and values */
const COLOR_TIERS = [
    { value: 200, core: '#ffffff', glow: 'rgba(255, 255, 255, 0.9)' }, // White/Diamond
    { value: 100, core: '#ffaa44', glow: 'rgba(255, 170, 68, 0.8)' }, // Orange
    { value: 50,  core: '#ff44ff', glow: 'rgba(255, 68, 255, 0.8)' }, // Purple
    { value: 30,  core: '#ffff44', glow: 'rgba(255, 255, 68, 0.8)' }, // Yellow
    { value: 15,  core: '#44ff44', glow: 'rgba(68, 255, 68, 0.8)' },  // Green
    { value: 0,   core: '#4488ff', glow: 'rgba(68, 136, 255, 0.8)' }   // Blue
];

export class XPOrb {
    constructor(x, y, value = 15) {
        this.x = x;
        this.y = y;
        this.value = value;
        /* @tweakable XP orb size */
        this.size = 6;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.time = 0;
    }
    
    update(deltaTime, playerX, playerY, magnetRange = 80) {
        this.time += deltaTime;
        
        // Bob up and down
        this.y += Math.sin(this.time * 3 + this.bobOffset) * 20 * deltaTime;
        
        // Move towards player if close enough
        const dist = Math.hypot(playerX - this.x, playerY - this.y);
        if (dist < magnetRange) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            /* @tweakable XP orb attraction speed multiplier based on distance */
            const speedMultiplier = Math.max(1, (magnetRange - dist) / magnetRange * 3);
            const baseSpeed = 150 * speedMultiplier;
            this.x += (dx / dist) * baseSpeed * deltaTime;
            this.y += (dy / dist) * baseSpeed * deltaTime;
        }
    }
    
    getOrbColor() {
        for (const tier of COLOR_TIERS) {
            if (this.value >= tier.value) {
                return { core: tier.core, glow: tier.glow };
            }
        }
        return COLOR_TIERS[COLOR_TIERS.length - 1]; // Default
    }
    
    draw(ctx) {
        const colors = this.getOrbColor();

        // Glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, colors.glow);
        gradient.addColorStop(1, 'rgba(68, 136, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = colors.core;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}