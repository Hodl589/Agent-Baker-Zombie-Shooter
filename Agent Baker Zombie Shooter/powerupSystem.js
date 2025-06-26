export class PowerupSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.currentPowerupOptions = [];
        /* @tweakable Maximum number of times a powerup can be upgraded */
        this.maxUpgradeLevel = 4;
        this.allPowerups = [
            { 
                id: 'fastShoot',
                name: 'Faster Shooting', 
                description: 'Reduce shooting cooldown by 15%', 
                icon: '⚡',
                iconColor: '#ffdd44',
                effect: (player, gameState) => player.shootCooldown *= 0.85 
            },
            { 
                id: 'moreDamage',
                name: 'More Damage', 
                description: 'Increase bullet & spike damage by 20%', 
                icon: '🔥',
                iconColor: '#ff6666',
                effect: (player, gameState) => { player.bulletDamage *= 1.2; player.spikeDamage *= 1.2; }
            },
            { 
                id: 'healthBoost',
                name: 'Health Boost', 
                description: 'Restore 50 health', 
                icon: '❤',
                iconColor: '#ff4444',
                effect: (player, gameState) => player.heal(50) 
            },
            { 
                id: 'speedBoost',
                name: 'Speed Boost', 
                description: 'Increase movement speed by 10%', 
                icon: '💨',
                iconColor: '#44ff44',
                effect: (player, gameState) => player.speed *= 1.1 
            },
            { 
                id: 'multiShot',
                name: 'Multi-Shot', 
                description: 'Shoot 1 additional bullet', 
                icon: '⚔',
                iconColor: '#6666ff',
                effect: (player, gameState) => player.bulletCount += 1 
            },
            { 
                id: 'spikes',
                name: 'Rotating Spikes', 
                description: 'Add spinning spike around you', 
                icon: '⭐',
                iconColor: '#ff9944',
                effect: (player, gameState) => this.addSpike(player, gameState) 
            },
            { 
                id: 'rangeBoost',
                name: 'Range Boost', 
                description: 'Increase shooting and grenade range by 25%', 
                icon: '🎯',
                iconColor: '#44aaff',
                effect: (player, gameState) => { player.shootRange *= 1.25; player.grenadeRange *= 1.25; } 
            },
            { 
                id: 'magnetBoost',
                name: 'XP Magnet', 
                description: 'Increase XP pickup range by 30%', 
                icon: '🧲',
                iconColor: '#aa44ff',
                effect: (player, gameState) => player.xpMagnetRange *= 1.3 
            },
            { 
                id: 'xpBoost',
                name: 'XP Boost',
                description: 'Increase all EXP gained by 20%',
                icon: '📈',
                iconColor: '#22ddaa',
                effect: (player, gameState) => player.xpGainMultiplier *= 1.2
            },
            { 
                id: 'xpRequirement',
                /* @tweakable new powerup: Efficient Learner */
                name: 'Efficient Learner', 
                description: 'Reduce XP required to level up by 20%', 
                icon: '🎓',
                iconColor: '#aaddff',
                effect: (player, gameState) => { player.xpRequired = Math.floor(player.xpRequired * 0.8); }
            },
            {
                id: 'grenadeDamage',
                name: 'Bigger Booms',
                description: 'Increase grenade damage by 30%',
                icon: '💣',
                iconColor: '#FFA500',
                effect: (player, gameState) => { player.grenadeDamage *= 1.3; }
            },
            {
                id: 'grenadeRadius',
                name: 'Wider Explosions',
                description: 'Increase grenade explosion radius by 20%',
                icon: '💥',
                iconColor: '#FF4500',
                effect: (player, gameState) => { player.grenadeRadius *= 1.2; }
            },
            {
                id: 'extraGrenade',
                name: 'Extra Grenade',
                description: 'Carry one more grenade',
                icon: '➕',
                iconColor: '#9ACD32',
                effect: (player, gameState) => { player.maxGrenades++; player.currentGrenades = Math.min(player.maxGrenades, player.currentGrenades + 1); }
            },
            {
                id: 'grenadeRestock',
                name: 'Grenade Restock',
                description: 'Regenerate grenades. Upgrades reduce cooldown.',
                icon: '♻️',
                iconColor: '#3CB371',
                effect: (player, gameState) => { 
                    if (player.grenadeRegenCooldown === 0) {
                        /* @tweakable Initial cooldown for grenade regeneration */
                        player.grenadeRegenCooldown = 30;
                    } else {
                        /* @tweakable Cooldown reduction multiplier for grenade regeneration upgrade */
                        player.grenadeRegenCooldown = Math.max(5, player.grenadeRegenCooldown * 0.8); // 20% faster, minimum 5s
                    }
                }
            },
            { 
                id: 'dashCooldown',
                name: 'Faster Dash',
                description: 'Reduce dash cooldown by 15%',
                icon: '👟',
                iconColor: '#cccccc',
                requiresDash: true,
                effect: (p) => { if(p.hasDash) p.dashCooldown *= 0.85; }
            },
            {
                id: 'dashDuration',
                name: 'Longer Dash',
                description: 'Increase dash duration by 20%',
                icon: '💨',
                iconColor: '#ffffff',
                requiresDash: true,
                effect: (p) => { if(p.hasDash) p.dashDuration *= 1.2; }
            },
            { 
                id: 'accuracyBoost',
                name: 'Accuracy Boost', 
                description: 'Makes multi-shot 50% more accurate.', 
                icon: '👌',
                iconColor: '#aaffaa',
                requiresMultiShot: true,
                effect: (player, gameState) => {
                    /* @tweakable The amount bullet spread is reduced by per accuracy upgrade. 0.5 is a 50% reduction. */
                    player.bulletSpread *= 0.5;
                }
            }
        ];
    }
    
    levelUp(player) {
        player.levelUp();
        this.gameState.isPaused = true;
        // removed this.showPowerupSelection();
    }
    
    generateRandomPowerups(player) {
        // Filter out maxed upgrades and upgrades whose requirements aren't met
        const available = this.allPowerups.filter(powerup => 
            (this.gameState.upgradeStacks[powerup.id] || 0) < this.maxUpgradeLevel &&
            (!powerup.requiresDash || player.hasDash) &&
            (!powerup.requiresMultiShot || (this.gameState.upgradeStacks['multiShot'] || 0) > 0)
        );
        
        const selected = [];
        for (let i = 0; i < 3 && available.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            selected.push(available.splice(randomIndex, 1)[0]);
        }
        
        // Fill remaining slots if needed
        while (selected.length < 3) {
            selected.push(this.allPowerups[Math.floor(Math.random() * this.allPowerups.length)]);
        }
        
        return selected;
    }
    
    addSpike(player, gameState) {
        const spikeRadius = 80;
        
        // Synchronize all spikes
        const spikeCount = gameState.spikes.length;
        const angleOffset = (spikeCount * Math.PI * 2) / Math.max(1, spikeCount + 1);
        
        gameState.spikes.push({
            x: player.x,
            y: player.y,
            angle: angleOffset,
            radius: spikeRadius
        });
        
        // Redistribute existing spikes evenly
        for (let i = 0; i < gameState.spikes.length; i++) {
            gameState.spikes[i].angle = (i * Math.PI * 2) / gameState.spikes.length;
            gameState.spikes[i].radius = spikeRadius;
        }
    }
    
    selectPowerup(index, player) {
        const powerup = this.currentPowerupOptions[index];
        this.gameState.upgradeStacks[powerup.id] = (this.gameState.upgradeStacks[powerup.id] || 0) + 1;
        powerup.effect(player, this.gameState);
        document.getElementById('powerupSelection').classList.add('hidden');
        this.gameState.isPaused = false;
    }
}