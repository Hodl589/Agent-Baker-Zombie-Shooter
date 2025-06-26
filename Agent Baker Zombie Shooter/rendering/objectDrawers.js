export function drawSpike(spike, ctx) {
    ctx.fillStyle = '#ff9944';
    ctx.strokeStyle = '#ffaa55';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(spike.x, spike.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Draw spikes around the circle
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = spike.x + Math.cos(angle) * 10;
        const y1 = spike.y + Math.sin(angle) * 10;
        const x2 = spike.x + Math.cos(angle) * 16;
        const y2 = spike.y + Math.sin(angle) * 16;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}
    
export function drawLightning(bolts, ctx) {
    if (bolts.length === 0) return;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur = 10;

    bolts.forEach(bolt => {
        ctx.beginPath();
        ctx.moveTo(bolt.fromX, bolt.fromY);
        // Jagged line for lightning effect
        const midX = (bolt.fromX + bolt.toX) / 2 + (Math.random() - 0.5) * 20;
        const midY = (bolt.fromY + bolt.toY) / 2 + (Math.random() - 0.5) * 20;
        ctx.lineTo(midX, midY);
        ctx.lineTo(bolt.toX, bolt.toY);
        ctx.stroke();
    });

    ctx.restore();
}

export function drawLaserBeams(laserBeams, ctx) {
    if (!laserBeams || laserBeams.length === 0) return;

    laserBeams.forEach(laser => {
        ctx.save();
        ctx.lineCap = 'round';
        const lifePercent = laser.life / laser.maxLife;

        if (laser.state === 'charging') {
            const alpha = 0.8 * (1 - lifePercent);
            ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();
        } else if (laser.state === 'firing') {
            const coreWidth = laser.width * lifePercent;
            // Outer glow
            ctx.strokeStyle = 'rgba(255, 150, 150, 0.4)';
            ctx.lineWidth = coreWidth + 12;
            ctx.shadowColor = '#ff8888';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();
            
            // Inner beam
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = coreWidth;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();
        }
        ctx.restore();
    });
}

export function drawGrid(ctx, width, height) {
    /* @tweakable grid size */
    const gridSize = 50;
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

export function drawDangerZones(dangerZones, ctx) {
    dangerZones.forEach(zone => {
        const progress = 1 - (zone.timer / zone.maxTimer);
        const radius = zone.radius * progress;
        /* @tweakable outer ring color for danger zones */
        ctx.strokeStyle = 'rgba(255, 68, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.stroke();
        /* @tweakable inner fill color for danger zones */
        ctx.fillStyle = `rgba(255, 68, 255, ${0.1 + progress * 0.4})`;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

export function drawSlowZones(slowZones, ctx) {
    if (!slowZones || slowZones.length === 0) return;

    slowZones.forEach(zone => {
        const alpha = Math.sin((zone.timeLeft / zone.duration) * Math.PI) * 0.5;
        
        ctx.save();
        ctx.globalAlpha = alpha;

        // Wavy effect
        /* @tweakable number of waves in the time stop field */
        const waveCount = 5;
        /* @tweakable amplitude of the waves in the time stop field */
        const waveAmplitude = 10;
        /* @tweakable speed of the wave animation */
        const waveSpeed = 2;
        
        ctx.strokeStyle = '#8888ff';
        ctx.lineWidth = 4;
        ctx.beginPath();

        for (let i = 0; i < 360; i++) {
            const angle = i * Math.PI / 180;
            const waveOffset = Math.sin(angle * waveCount + zone.animTime * waveSpeed) * waveAmplitude;
            const r = zone.radius + waveOffset;
            const x = zone.x + Math.cos(angle) * r;
            const y = zone.y + Math.sin(angle) * r;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        // Inner fill
        ctx.fillStyle = 'rgba(100, 100, 255, 0.1)';
        ctx.fill();

        ctx.restore();
    });
}

/**
 * Draws a dashed rectangular fence around the boss arena.
 * @param {number} pad - Padding from the canvas edges.
 */
export function drawFence(pad, ctx, canvas) {
    ctx.save();
    /* @tweakable fence dash pattern */
    ctx.setLineDash([20, 10]);
    /* @tweakable fence line width */
    ctx.lineWidth = 4;
    /* @tweakable fence color */
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);
    ctx.restore();
}

export function drawShockwaves(shockwaves, ctx) {
    if (!shockwaves || shockwaves.length === 0) return;
    
    shockwaves.forEach(wave => {
        let alpha;
        let widthMultiplier;

        if (wave.isFading) {
            // Fade out based on remaining time
            alpha = (wave.fadeTimer / wave.fadeDuration) * 0.8;
            widthMultiplier = (wave.fadeTimer / wave.fadeDuration);
        } else {
            // Fade out as it expands
            const lifePercent = wave.radius / wave.maxRadius;
            alpha = (1 - lifePercent) * 0.8;
            widthMultiplier = (1 - lifePercent);
        }
        
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, alpha)})`;
        ctx.lineWidth = 15 * Math.max(0, widthMultiplier);
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    });
}