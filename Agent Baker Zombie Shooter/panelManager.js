export class PanelManager {
    constructor() {
        this.elements = {
            upgradeSummaryPanel: document.getElementById('upgradeSummaryPanel'),
            upgradeSummaryList: document.getElementById('upgradeSummaryList'),
        };
    }

    toggleVisibility(visible) {
        this.elements.upgradeSummaryPanel.classList.toggle('hidden', !visible);
    }
    
    updateUpgradeSummary(player, gameState, allPowerups, shopUpgrades, bossUpgrades) {
        this.elements.upgradeSummaryList.innerHTML = '';
        
        const allDefs = new Map();
        [...allPowerups, ...shopUpgrades, ...bossUpgrades].forEach(upg => {
            if (!allDefs.has(upg.id)) {
                allDefs.set(upg.id, upg);
            }
        });

        const upgradesToShow = [];

        // Process stacked powerups
        for (const id in gameState.upgradeStacks) {
            const count = gameState.upgradeStacks[id];
            if (count > 0 && allDefs.has(id)) {
                const def = allDefs.get(id);
                upgradesToShow.push({
                    name: `${def.name} (x${count})`,
                    details: this.getEffectDescription(id, count, player)
                });
            }
        }

        // Process unique boss/shop upgrades
        const uniqueUpgrades = [...shopUpgrades, ...bossUpgrades].filter(u => u.unique);
        uniqueUpgrades.forEach(upg => {
            if (player[upg.id] && !gameState.upgradeStacks[upg.id]) { // Check player flag
                upgradesToShow.push({
                    name: upg.name,
                    details: upg.description
                });
            }
        });
        
        if (upgradesToShow.length === 0) {
            this.elements.upgradeSummaryList.innerHTML = '<li><div class="upgrade-name">No upgrades yet!</div><div class="upgrade-details">Level up or visit a shop to get started.</div></li>';
            return;
        }

        upgradesToShow.forEach(upg => {
            const li = document.createElement('li');
            li.innerHTML = `<div class="upgrade-name">${upg.name}</div><div class="upgrade-details">${upg.details}</div>`;
            this.elements.upgradeSummaryList.appendChild(li);
        });
    }

    getEffectDescription(id, level, player) {
        switch (id) {
            case 'fastShoot': return `Shoot Speed: +${((1 - (0.85 ** level)) * 100).toFixed(0)}%`;
            case 'moreDamage': return `Damage: +${(((1.2 ** level) - 1) * 100).toFixed(0)}%`;
            case 'healthBoost': return `Instant one-time healing effect.`;
            case 'speedBoost': return `Move Speed: +${(((1.1 ** level) - 1) * 100).toFixed(0)}%`;
            case 'multiShot': return `Fires +${level} projectile(s).`;
            case 'spikes': return `You have ${level} spinning spike(s).`;
            case 'rangeBoost': return `All Ranges: +${(((1.25 ** level) - 1) * 100).toFixed(0)}%`;
            case 'magnetBoost': return `Magnet Range: +${(((1.3 ** level) - 1) * 100).toFixed(0)}%`;
            case 'xpBoost': return `XP Gain: +${(((1.2 ** level) - 1) * 100).toFixed(0)}%`;
            case 'xpRequirement': return `XP Need: -${((1 - (0.8 ** level)) * 100).toFixed(0)}%`;
            case 'grenadeDamage': return `Grenade Dmg: +${(((1.3 ** level) - 1) * 100).toFixed(0)}%`;
            case 'grenadeRadius': return `Grenade Radius: +${(((1.2 ** level) - 1) * 100).toFixed(0)}%`;
            case 'extraGrenade': return `+${level} max grenade(s).`;
            case 'grenadeRestock': return player.grenadeRegenCooldown > 0 ? `Regen Cooldown: ${player.grenadeRegenCooldown.toFixed(1)}s` : 'Enables grenade regeneration.';
            case 'dashCooldown': return `Dash Cooldown: -${((1 - (0.85 ** level)) * 100).toFixed(0)}%`;
            case 'dashDuration': return `Dash Duration: +${(((1.2 ** level) - 1) * 100).toFixed(0)}%`;
            case 'accuracyBoost': return `Spread: -${((1 - (0.8 ** level)) * 100).toFixed(0)}%`;
            default: return 'Provides a powerful bonus.';
        }
    }
}