import { HudManager } from './hudManager.js';
import { PopupManager } from './popupManager.js';
import { PanelManager } from './panelManager.js';

/**
 * Main UI coordinator.
 * This class has been refactored from a single large file into a delegator.
 * It coordinates among specialized managers for the HUD, popups, and panels.
 */
export class UIManager {
    constructor(callbacks) {
        this.hudManager = new HudManager();
        this.popupManager = new PopupManager(callbacks);
        this.panelManager = new PanelManager();
    }

    // --- HUD METHODS (Delegated to HudManager) ---
    
    updateHealth(current, max) {
        this.hudManager.updateHealth(current, max);
    }

    updateXP(xp, xpRequired, level) {
        this.hudManager.updateXP(xp, xpRequired, level);
    }
    
    updateStats(score, wave) {
        this.hudManager.updateStats(score, wave);
    }

    updateGrenadeUI(current, max) {
        this.hudManager.updateGrenadeUI(current, max);
    }

    updateTimeStopUI(hasAbility, cooldown, timer) {
        this.hudManager.updateTimeStopUI(hasAbility, cooldown, timer);
    }

    updateDashUI(hasAbility, cooldown, timer) {
        this.hudManager.updateDashUI(hasAbility, cooldown, timer);
    }

    updateBulletTimeUI(isEnabled, cooldown, timer) {
        this.hudManager.updateBulletTimeUI(isEnabled, cooldown, timer);
    }

    updateShieldUI(hasAbility, current, max, cooldown, timer) {
        this.hudManager.updateShieldUI(hasAbility, current, max, cooldown, timer);
    }

    updateFinalStandUI(hasAbility, isReady, cooldown, timer, isActive) {
        this.hudManager.updateFinalStandUI(hasAbility, isReady, cooldown, timer, isActive);
    }

    // --- POPUP METHODS (Delegated to PopupManager) ---

    showPowerupSelection(options, upgradeStacks, maxUpgradeLevel) {
        this.popupManager.showPowerupSelection(options, upgradeStacks, maxUpgradeLevel);
    }

    hidePowerupSelection() {
        this.popupManager.hidePowerupSelection();
    }

    showBossRewardSelection(rewards, picks) {
        this.popupManager.showBossRewardSelection(rewards, picks);
    }

    hideBossRewardSelection() {
        this.popupManager.hideBossRewardSelection();
    }

    showShop(items, score) {
        this.popupManager.showShop(items, score);
    }

    hideShop() {
        this.popupManager.hideShop();
    }
    
    updateAfterPurchase(score, allItems) {
        this.popupManager.updateAfterPurchase(score, allItems);
    }

    togglePauseMenu(isPaused) {
        this.popupManager.togglePauseMenu(isPaused);
        this.panelManager.toggleVisibility(isPaused);
    }

    showDeathScreen(score, level) {
        this.popupManager.showDeathScreen(score, level);
    }

    hideDeathScreen() {
        this.popupManager.hideDeathScreen();
    }

    // --- PANEL METHODS (Delegated to PanelManager) ---

    updateUpgradeSummary(player, gameState, allPowerups, shopUpgrades, bossUpgrades) {
        this.panelManager.updateUpgradeSummary(player, gameState, allPowerups, shopUpgrades, bossUpgrades);
    }
}