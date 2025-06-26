/** @tweakable definitions for different boss types.
 * Each object contains base stats and an array of attack patterns with cooldowns and parameters.
 * Attack IDs: shotgun, missiles, summon, laser, dash, spiralShot, teleport, shockwave
 */
export const BOSS_TYPES = {
    9: { // The Behemoth
        name: 'The Behemoth',
        size: 20, speed: 20, health: 800, damage: 50, score: 100, color: '#662222', xpValue: 250,
        attacks: [
            { id: 'shotgun', cooldown: 6 },
            { id: 'missiles', cooldown: 8 },
            { id: 'summon', cooldown: 12, params: { type: 2, count: 3 } },
            { id: 'shockwave', cooldown: 10, params: { damage: 30, speed: 300, /* @tweakable maximum radius of boss shockwave */ maxRadius: 600 } }
        ]
    },
    10: { // The Stalker
        name: 'The Stalker',
        size: 16, speed: 45, health: 600, damage: 0, /* @tweakable dash damage for Stalker boss */ dashDamage: 60, score: 100, color: '#226666', xpValue: 250,
        attacks: [
            { id: 'laser', cooldown: 10, params: { /* @tweakable laser charge time */ chargeTime: 1.5, /* @tweakable laser fire duration */ fireTime: 2, /* @tweakable laser damage per frame */ damage: 0.8, /* @tweakable laser width */ width: 20 } },
            { id: 'dash', cooldown: 6 },
            { id: 'teleport', cooldown: 7, params: { cooldown: 0.2 } },
            { id: 'shotgun', cooldown: 6 },
        ]
    },
    11: { // The Swarmer
        name: 'The Swarmer',
        size: 18, speed: 30, health: 700, damage: 20, score: 100, color: '#666622', xpValue: 250,
        attacks: [
            { id: 'spiralShot', cooldown: 5, params: { /* @tweakable number of shots in a spiral volley */ count: 24, /* @tweakable rotation speed of spiral shot */ rotationSpeed: 4 } },
            { id: 'summon', cooldown: 9, params: { type: 0, count: 5 } },
            { id: 'missiles', cooldown: 7 }
        ]
    },
    12: { // The Wraith
        name: 'The Wraith',
        size: 17, speed: 60, health: 650, damage: 40, score: 100, color: '#602080', xpValue: 250,
        attacks: [
            { id: 'teleport', cooldown: 5, params: { /* @tweakable cooldown after teleport before next action */ cooldown: 0.2 } },
            { id: 'shotgun', cooldown: 6 },
            { id: 'shockwave', cooldown: 9, params: { /* @tweakable base damage for boss shockwave */ damage: 30, /* @tweakable expansion speed of boss shockwave */ speed: 400, /* @tweakable maximum radius of boss shockwave */ maxRadius: 600 } },
            { id: 'spiralShot', cooldown: 7, params: { count: 18, rotationSpeed: 5 } }
        ]
    },
    13: { // The Artillery
        name: 'The Artillery',
        size: 22, speed: 10, health: 1000, damage: 0, score: 100, color: '#222266', xpValue: 250,
        attacks: [
            { id: 'missiles', cooldown: 6 },
            { id: 'laser', cooldown: 12, params: { chargeTime: 1.5, fireTime: 3, damage: 0.8, width: 25 } },
            { id: 'spiralShot', cooldown: 5, params: { count: 32, rotationSpeed: 2 } }
        ]
    }
};