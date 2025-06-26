/* @tweakable percentage to darken a color, 0 to 1 */
const DARKEN_PERCENT = 0.4;

/**
 * Darkens a hex color by a percentage.
 * @param {string} hex - The hex color string (e.g., '#ff6666').
 * @param {number} percent - The percentage to darken (0-1).
 * @returns {string} The new, darkened hex color string.
 */
export function darkenColor(hex, percent = DARKEN_PERCENT) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    r = Math.floor(r * (1 - percent));
    g = Math.floor(g * (1 - percent));
    b = Math.floor(b * (1 - percent));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
}