/** @tweakable definitions for different regular zombie types.
 * Each object contains properties for: size, speed, health, damage, score, color, and xpValue.
 */
export const ZOMBIE_TYPES = [
    { size: 12, speed: 50, health: 60, damage: 15, score: 10, color: '#ff6666', xpValue: 10 }, // Basic
    { size: 15, speed: 30, health: 120, damage: 25, score: 20, color: '#ff4444', xpValue: 25 }, // Tank
    { size: 10, speed: 80, health: 30, damage: 10, score: 15, color: '#ff8866', xpValue: 15 }, // Fast
    { size: 14, speed: 45, health: 80, damage: 20, score: 18, color: '#ff66aa', xpValue: 20 }, // Spitter
    { size: 18, speed: 25, health: 200, damage: 40, score: 50, color: '#aa4444', xpValue: 50 }, // Brute
    { size: 8, speed: 120, health: 20, damage: 8, score: 12, color: '#ffaa66', xpValue: 12 }, // Runner
    { size: 13, speed: 40, health: 90, damage: 18, score: 25, color: '#ff6644', xpValue: 22 }, // Soldier
    { size: 16, speed: 35, health: 150, damage: 30, score: 35, color: '#994444', xpValue: 40 }, // Heavy
    { size: 11, speed: 60, health: 45, damage: 12, score: 14, color: '#ff9966', xpValue: 18 }, // Scout
    { size: 10, speed: 55, health: 100, damage: 22, score: 28, color: '#c3e88d', xpValue: 25 }, // Stalker
    { size: 20, speed: 20, health: 300, damage: 45, score: 60, color: '#82aaff', xpValue: 60 }, // Goliath
    { size: 7, speed: 130, health: 25, damage: 10, score: 18, color: '#ffcb6b', xpValue: 15 } // Frenzy
];