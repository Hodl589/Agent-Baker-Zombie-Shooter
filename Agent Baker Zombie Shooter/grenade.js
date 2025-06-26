export class Grenade {
    constructor(x, y, targetX, targetY, damage, radius, range) {
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = x;
        this.y = y;
        
        /* @tweakable maximum grenade range. */
        this.maxRange = range;
        /* @tweakable grenade flight time in seconds. */
        this.flightTime = 1.0; 
        /* @tweakable grenade explosion radius */
        this.explosionRadius = radius;
        /* @tweakable grenade damage */
        this.damage = damage;
        
        this.time = 0;
        this.rotation = Math.random() * Math.PI * 2;
        this.exploded = false;
        this.height = 0;
        this.scale = 1.0;
        this.image = new Image();
        this.image.src = '/grenade_ui.png';
        this.imageLoaded = false;
        this.image.onload = () => { this.imageLoaded = true; };
    }
    
    update(deltaTime) {
        if (this.exploded) return;
        
        this.time += deltaTime;
        /* @tweakable grenade rotation speed during flight */
        this.rotation += deltaTime * 5;
        
        const progress = Math.min(this.time / this.flightTime, 1);
        
        // Move grenade along its trajectory
        this.x = this.startX + (this.targetX - this.startX) * progress;
        this.y = this.startY + (this.targetY - this.startY) * progress;
        
        const travelDist = Math.hypot(this.x - this.startX, this.y - this.startY);
        
        // More realistic arc trajectory
        /* @tweakable The height of the grenade's arc. */
        const arcHeight = 60;
        this.height = Math.sin(progress * Math.PI) * arcHeight;
        
        /* @tweakable How much the grenade scales in size during its arc to simulate 3D perspective. */
        const scaleVariation = 0.5;
        this.scale = 1 + Math.sin(progress * Math.PI) * scaleVariation;
        
        // Explode upon impact or if it reaches max range
        if (progress >= 1 || travelDist >= this.maxRange) {
            this.explode();
        }
    }
    
    explode() {
        this.exploded = true;
    }
    
    draw(ctx) {
        if (this.exploded) return;
        
        const drawSize = 20 * this.scale;
        
        ctx.save();
        // Translate to the grenade's base position on the ground
        ctx.translate(this.x, this.y);

        // Draw shadow first
        /* @tweakable Opacity of the grenade's shadow. */
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        const shadowWidth = drawSize * 0.8;
        const shadowHeight = shadowWidth / 2;
        ctx.ellipse(0, 0, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // Translate up for the height of the arc
        ctx.translate(0, -this.height);
        
        // Rotate for the spinning effect
        ctx.rotate(this.rotation);

        if (this.imageLoaded) {
            ctx.drawImage(this.image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        } else {
             // Fallback drawing if image fails to load
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(0, 0, drawSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}