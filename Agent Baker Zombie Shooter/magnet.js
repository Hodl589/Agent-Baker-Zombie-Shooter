export class Magnet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        /* @tweakable magnet pickup size */
        this.size = 12;
        /* @tweakable time a magnet stays on the ground before disappearing, in seconds. */
        this.lifetime = 15;
        this.image = new Image();
        this.imageLoaded = false;
        this.image.src = '/magnet.png';
        this.image.onload = () => { this.imageLoaded = true; };
        
        this.bobOffset = Math.random() * Math.PI * 2;
        this.time = 0;
    }

    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.time += deltaTime;
        
        // Bob up and down to be more visible
        this.y += Math.sin(this.time * 3 + this.bobOffset) * 20 * deltaTime;
    }

    draw(ctx) {
        if (this.imageLoaded) {
            const drawSize = this.size * 2.5;
            const bobHeight = Math.sin(this.time * 3 + this.bobOffset) * 4;
            ctx.drawImage(this.image, this.x - drawSize / 2, this.y - drawSize / 2 - bobHeight, drawSize, drawSize);
        } else { // Fallback drawing
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}