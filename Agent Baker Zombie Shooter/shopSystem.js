export class ShopSystem {
    constructor(gameState, player, playSound, powerupSystem) {
        this.gameState = gameState;
        this.player = player;
        this.playSound = playSound;
        this.powerupSystem = powerupSystem;
        /* @tweakable number of items to show in the shop. NOTE: HTML is static for 6 items. Changing this requires HTML changes. */
        this.shopItemCount = 6;
        /* @tweakable shop regular upgrade base cost */
        this.regularCost = 500;
        /* @tweakable shop boss upgrade base cost */
        this.bossCost = 2000;
        /* @tweakable boss upgrade appearance chance in shop (0-1) */
        this.bossUpgradeChance = 0.1;
        /* @tweakable cost multipliers for specific regular upgrades */
        this.regularCostMultipliers = {
            fastShoot: 1,
            moreDamage: 1.2,
            healthBoost: 1,
            speedBoost: 1,
            multiShot: 1.5,
            spikes: 1.5,
            rangeBoost: 1,
            magnetBoost: 1,
            xpBoost: 1.3,
            grenadeDamage: 1.2,
            grenadeRadius: 1.1,
            extraGrenade: 1.8,
            grenadeRestock: 1.5,
            /* @tweakable cost multiplier for Efficient Learner upgrade in shop */
            xpRequirement: 1.4,
            /* @tweakable cost multiplier for dash cooldown upgrade */
            dashCooldown: 1.2,
            /* @tweakable cost multiplier for dash duration upgrade */
            dashDuration: 1.1,
            /* @tweakable cost multiplier for the accuracy upgrade in the shop. */
            accuracyBoost: 1.1
        };
        /* @tweakable color for unaffordable shop item cost */
        this.unaffordableCostColor = '#888888';
        this.currentShopItems = [];
        // Regular upgrades pool
        this.regularUpgrades = [
            { id: 'fastShoot',      name: 'Faster Shooting',  description: 'Reduce shooting cooldown by 15%', icon: '⚡', iconColor: '#ffdd44', effect: (p, gs) => p.shootCooldown *= 0.85 },
            { id: 'moreDamage',     name: 'More Damage',      description: 'Increase bullet & spike damage by 20%',  icon: '🔥', iconColor: '#ff6666', effect: (p, gs) => { p.bulletDamage *= 1.2; p.spikeDamage *= 1.2; } },
            { id: 'healthBoost',    name: 'Health Boost',     description: 'Restore 50 health',             icon: '❤', iconColor: '#ff4444', effect: (p, gs) => p.heal(50) },
            { id: 'speedBoost',     name: 'Speed Boost',      description: 'Increase movement speed by 10%', icon: '💨', iconColor: '#44ff44', effect: (p, gs) => p.speed *= 1.1 },
            { id: 'multiShot',      name: 'Multi-Shot',       description: 'Shoot 1 additional bullet',      icon: '⚔', iconColor: '#6666ff', effect: (p, gs) => p.bulletCount += 1 },
            { id: 'spikes',         name: 'Rotating Spikes',  description: 'Add spinning spike around you',   icon: '⭐', iconColor: '#ff9944', effect: (p, gs) => this.powerupSystem.addSpike(p, gs) },
            { id: 'rangeBoost',     name: 'Range Boost',      description: 'Increase shooting and grenade range by 25%', icon: '🎯', iconColor: '#44aaff', effect: (p, gs) => { p.shootRange *= 1.25; p.grenadeRange *= 1.25; } },
            { id: 'magnetBoost',    name: 'XP Magnet',        description: 'Increase XP pickup range by 30%',icon: '🧲', iconColor: '#aa44ff', effect: (p, gs) => p.xpMagnetRange *= 1.3 },
            { id: 'xpBoost',        name: 'XP Boost',         description: 'Increase all EXP gained by 20%', icon: '📈', iconColor: '#22ddaa', effect: (p, gs) => p.xpGainMultiplier *= 1.2 },
            { 
                id: 'xpRequirement',
                name: 'Efficient Learner', 
                description: 'Reduce XP required to level up by 20%', 
                icon: '🎓', 
                iconColor: '#aaddff', 
                effect: (p, gs) => { p.xpRequired = Math.floor(p.xpRequired * 0.8); }
            },
            { id: 'grenadeDamage',  name: 'Bigger Booms',     description: 'Increase grenade damage by 30%', icon: '💣', iconColor: '#FFA500', effect: (p, gs) => { p.grenadeDamage *= 1.3; } },
            { id: 'grenadeRadius',  name: 'Wider Explosions', description: 'Increase grenade explosion radius by 20%', icon: '💥', iconColor: '#FF4500', effect: (p, gs) => { p.grenadeRadius *= 1.2; } },
            { id: 'extraGrenade',   name: 'Extra Grenade',    description: 'Carry one more grenade', icon: '➕', iconColor: '#9ACD32', effect: (p, gs) => { p.maxGrenades++; p.currentGrenades = Math.min(p.maxGrenades, p.currentGrenades + 1); } },
            {
                id: 'grenadeRestock',
                name: 'Grenade Restock',
                description: 'Regenerate grenades. Upgrades reduce cooldown.',
                icon: '♻️',
                iconColor: '#3CB371',
                effect: (p, gs) => {
                    if (p.grenadeRegenCooldown === 0) {
                        p.grenadeRegenCooldown = 30;
                    } else {
                        p.grenadeRegenCooldown = Math.max(5, p.grenadeRegenCooldown * 0.8);
                    }
                }
            },
            { id: 'dashCooldown', name: 'Faster Dash', description: 'Reduce dash cooldown by 15%', icon: '👟', iconColor: '#cccccc', requiresDash: true, effect: (p) => { if(p.hasDash) p.dashCooldown *= 0.85; } },
            { id: 'dashDuration', name: 'Longer Dash', description: 'Increase dash duration by 20%', icon: '💨', iconColor: '#ffffff', requiresDash: true, effect: (p) => { if(p.hasDash) p.dashDuration *= 1.2; } },
            { 
                id: 'accuracyBoost',
                name: 'Accuracy Boost', 
                description: 'Makes multi-shot 50% more accurate.', 
                icon: '👌',
                iconColor: '#aaffaa',
                requiresMultiShot: true,
                effect: (player, gameState) => {
                    player.bulletSpread *= 0.5;
                }
            }
        ];
        // Boss upgrades pool
        this.bossUpgrades = [
            { id: 'plasmaCannon',     name: 'Plasma Cannon',     description: 'Piercing bolts, less damage.',     icon: '🔫', iconColor: '#88ff88', effect: (p, gs) => { p.plasmaCannon = true; }, unique: true },
            { id: 'shieldGenerator',  name: 'Shield Generator',  description: 'Gain 3 regenerating shields.',   icon: '🛡️', iconColor: '#8888ff', effect: (p, gs) => { p.maxShields = 3; p.currentShields = 3; }, unique: true },
            { id: 'hasTimeStop',      name: 'Time Stop Field',   description: 'Press R to create a slowing field.',    icon: '⏰', iconColor: '#ffff88', effect: (p, gs) => { p.hasTimeStop = true; }, unique: true },
            { id: 'hasLightning',   name: 'Lightning Storm',   description: 'Bullets trigger chain lightning', icon: '⚡', iconColor: '#ffff44', effect: (p, gs) => { p.hasLightning = true; }, unique: true },
            { id: 'regeneration',     name: 'Regeneration',      description: 'Heal 2 HP per second.',       icon: '💚', iconColor: '#44ff44', effect: (p, gs) => { p.regenRate = 2; }, unique: true },
            { id: 'lifesteal',        name: 'Vampirism',         description: 'Heal for 5% of damage dealt.',     icon: '🩸', iconColor: '#ff2222', effect: (p) => { p.lifesteal = 0.05; }, unique: true },
            { id: 'thornsDamage',           name: 'Thorns Armor',      description: 'Deals 25 damage back to attackers.', icon: '🌵', iconColor: '#22aa22', effect: (p) => { p.thornsDamage = 25; }, unique: true },
            { id: 'hasFinalStand',       name: 'Final Stand',       description: 'Survive a lethal hit once.',       icon: '👼', iconColor: '#eeeeaa', effect: (p) => { p.hasFinalStand = true; }, unique: true },
            { id: 'explosiveRounds', name: 'Explosive Rounds', description: 'Bullets create small explosions.', icon: '💥', iconColor: '#ff8844', effect: (p) => { p.explosiveRounds = true; }, unique: true },
            { id: 'hasSlashDash', name: 'Slash Dash', description: 'Deal 100 damage to enemies you dash through.', icon: '🗡️', iconColor: '#cccccc', effect: (p) => { p.hasSlashDash = true; }, unique: true }
        ];

        /* @tweakable chance for an XP pack to appear in the shop */
        this.xpPackChance = 0.25;
        /* @tweakable available XP packs in the shop */
        this.xpPacks = [
            { name: 'Small XP Cache', description: 'Gain 250 XP', icon: '📦', iconColor: '#a67b5b', cost: 300, effect: (p) => p.addXp(250) },
            { name: 'Medium XP Cache', description: 'Gain 750 XP', icon: '📦', iconColor: '#a67b5b', cost: 800, effect: (p) => p.addXp(750) },
            { name: 'Large XP Cache', description: 'Gain 2000 XP', icon: '📦', iconColor: '#a67b5b', cost: 2000, effect: (p) => p.addXp(2000) }
        ];
    }

    generateShopItems() {
        const result = [];
        const availableBossUpgrades = this.bossUpgrades.filter(upg => {
            // Can't buy unique upgrades more than once.
            return !(upg.unique && this.player[upg.id]);
        });
        const availableRegularUpgrades = [...this.regularUpgrades].filter(upg => 
            (!upg.requiresDash || this.player.hasDash) &&
            (!upg.requiresMultiShot || (this.gameState.upgradeStacks['multiShot'] || 0) > 0)
        );
        
        for (let i = 0; i < this.shopItemCount; i++) {
            let item;
            if (Math.random() < this.xpPackChance) {
                // Get an XP pack
                item = { ...this.xpPacks[Math.floor(Math.random() * this.xpPacks.length)], id: `xpPack${i}` };
            } else if (availableBossUpgrades.length > 0 && Math.random() < this.bossUpgradeChance) {
                // pick a random available boss upgrade
                const idx = Math.floor(Math.random() * availableBossUpgrades.length);
                item = availableBossUpgrades.splice(idx, 1)[0];
                item.cost = this.bossCost;
            } else {
                // pick a random regular upgrade
                if (availableRegularUpgrades.length === 0) { // Fallback if we run out
                    item = this.regularUpgrades[Math.floor(Math.random() * this.regularUpgrades.length)];
                } else {
                    const idx = Math.floor(Math.random() * availableRegularUpgrades.length);
                    item = availableRegularUpgrades.splice(idx, 1)[0];
                }
                /* apply multiplier per upgrade type */
                const multiplier = this.regularCostMultipliers[item.id] || 1;
                item.cost = Math.floor(this.regularCost * multiplier);
            }
            result.push(item);
        }
        this.currentShopItems = result;
        return result;
    }

    generateBossRewards(count) {
        const available = this.bossUpgrades.filter(upg => {
            return !(upg.unique && this.player[upg.id]);
        });

        // Shuffle available upgrades
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }

        return available.slice(0, count);
    }

    selectShopItem(index) {
        const item = this.currentShopItems[index];
        if (!item || this.gameState.score < item.cost || item.bought) return false;
        this.gameState.score -= item.cost;
        item.effect(this.player, this.gameState);
        item.bought = true;

        // If it's a stackable upgrade, increment the stack
        if (!item.unique && !item.id.startsWith('xpPack')) {
             this.gameState.upgradeStacks[item.id] = (this.gameState.upgradeStacks[item.id] || 0) + 1;
        }

        if (this.playSound) this.playSound('purchase_upgrade');
        
        return true;
    }
}