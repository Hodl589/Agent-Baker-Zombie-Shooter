export class HudManager {
    constructor() {
        this.elements = {
            healthFill: document.querySelector('.health-fill'),
            healthText: document.querySelector('.health-text'),
            xpFill: document.querySelector('.xp-fill'),
            xpText: document.querySelector('.xp-text'),
            score: document.getElementById('score'),
            wave: document.getElementById('wave'),
            grenadeContainer: document.getElementById('grenadeContainer'),
            timeStopContainer: document.getElementById('timeStopContainer'),
            timeStopIcon: document.getElementById('timeStopIcon'),
            timeStopCooldownFill: document.getElementById('timeStopCooldownFill'),
            dashContainer: document.getElementById('dashContainer'),
            dashIcon: document.getElementById('dashIcon'),
            dashCooldownFill: document.getElementById('dashCooldownFill'),
            bulletTimeContainer: document.getElementById('bulletTimeContainer'),
            bulletTimeIcon: document.getElementById('bulletTimeIcon'),
            bulletTimeCooldownFill: document.getElementById('bulletTimeCooldownFill'),
            shieldContainer: document.getElementById('shieldContainer'),
            shieldIcon: document.getElementById('shieldIcon'),
            shieldCooldownFill: document.getElementById('shieldCooldownFill'),
            shieldCount: document.getElementById('shieldCount'),
            finalStandContainer: document.getElementById('finalStandContainer'),
            finalStandIcon: document.getElementById('finalStandIcon'),
            finalStandCooldownFill: document.getElementById('finalStandCooldownFill'),
            charName: document.getElementById("charName"),
            primaryName: document.getElementById("primaryName"),
            secondaryName: document.getElementById("secondaryName"),
        };
    }

    updateHealth(current, max) {
        const percent = (current / max) * 100;
        this.elements.healthFill.style.width = `${percent}%`;
        this.elements.healthText.textContent = `${Math.ceil(current)}/${max}`;
    }

    updateXP(xp, xpRequired, level) {
        const percent = (xp / xpRequired) * 100;
        this.elements.xpFill.style.width = `${percent}%`;
        this.elements.xpText.textContent = `Level ${level}`;
    }
    
    updateStats(score, wave) {
        this.elements.score.textContent = score;
        this.elements.wave.textContent = wave;
    }
    setCharacterInfo(name, primary, secondary) {
        this.elements.charName.textContent = name;
        this.elements.primaryName.textContent = primary;
        this.elements.secondaryName.textContent = secondary;
    }


    updateGrenadeUI(current, max) {
        const container = this.elements.grenadeContainer;
        if (!container) return;

        while (container.children.length < max) {
            const icon = document.createElement('div');
            icon.className = 'grenade-icon';
            container.appendChild(icon);
        }
        while (container.children.length > max) {
            container.removeChild(container.lastChild);
        }

        for (let i = 0; i < max; i++) {
            const icon = container.children[i];
            if (!icon) continue;
            icon.className = `grenade-icon ${i < Math.floor(current) ? 'available' : 'used'}`;
        }
    }

    updateTimeStopUI(hasAbility, cooldown, timer) {
        if (!this.elements.timeStopContainer) return;

        if (hasAbility) {
            this.elements.timeStopContainer.classList.remove('hidden');
            if (timer > 0) {
                this.elements.timeStopIcon.classList.add('on-cooldown');
                const fillPercent = (cooldown - timer) / cooldown * 100;
                this.elements.timeStopCooldownFill.style.height = `${fillPercent}%`;
            } else {
                this.elements.timeStopIcon.classList.remove('on-cooldown');
                this.elements.timeStopCooldownFill.style.height = '100%';
            }
        } else {
            this.elements.timeStopContainer.classList.add('hidden');
        }
    }

    updateDashUI(hasAbility, cooldown, timer) {
        if (!this.elements.dashContainer) return;

        if (hasAbility) {
            this.elements.dashContainer.classList.remove('hidden');
            if (timer > 0) {
                this.elements.dashIcon.classList.add('on-cooldown');
                const fillPercent = (cooldown - timer) / cooldown * 100;
                this.elements.dashCooldownFill.style.height = `${fillPercent}%`;
            } else {
                this.elements.dashIcon.classList.remove('on-cooldown');
                this.elements.dashCooldownFill.style.height = '100%';
            }
        } else {
            this.elements.dashContainer.classList.add('hidden');
        }
    }

    updateBulletTimeUI(isEnabled, cooldown, timer) {
        if (!this.elements.bulletTimeContainer) return;

        if (isEnabled) {
            this.elements.bulletTimeContainer.classList.remove('hidden');
            if (timer > 0) {
                this.elements.bulletTimeIcon.classList.add('on-cooldown');
                const fillPercent = (cooldown - timer) / cooldown * 100;
                this.elements.bulletTimeCooldownFill.style.height = `${fillPercent}%`;
            } else {
                this.elements.bulletTimeIcon.classList.remove('on-cooldown');
                this.elements.bulletTimeCooldownFill.style.height = '100%';
            }
        } else {
            this.elements.bulletTimeContainer.classList.add('hidden');
        }
    }

    updateShieldUI(hasAbility, current, max, cooldown, timer) {
        if (!this.elements.shieldContainer) return;

        if (hasAbility) {
            this.elements.shieldContainer.classList.remove('hidden');
            this.elements.shieldCount.textContent = current;
            
            if (current < max) {
                const fillPercent = timer / cooldown * 100;
                this.elements.shieldCooldownFill.style.height = `${fillPercent}%`;
            } else {
                this.elements.shieldCooldownFill.style.height = '100%';
            }
        } else {
            this.elements.shieldContainer.classList.add('hidden');
        }
    }

    updateFinalStandUI(hasAbility, isReady, cooldown, timer, isActive) {
        if (!this.elements.finalStandContainer) return;

        if (hasAbility) {
            this.elements.finalStandContainer.classList.remove('hidden');

            if (isActive) {
                this.elements.finalStandIcon.classList.add('on-cooldown');
                this.elements.finalStandIcon.style.borderColor = finalStandActiveColor; // Active color
                this.elements.finalStandCooldownFill.style.height = '100%';
            } else if (!isReady) {
                this.elements.finalStandIcon.classList.add('on-cooldown');
                this.elements.finalStandIcon.style.borderColor = '#ffd700'; // Back to normal CD color
                const fillPercent = (cooldown - timer) / cooldown * 100;
                this.elements.finalStandCooldownFill.style.height = `${fillPercent}%`;
            } else {
                this.elements.finalStandIcon.classList.remove('on-cooldown');
                this.elements.finalStandIcon.style.borderColor = '#ffd700';
                this.elements.finalStandCooldownFill.style.height = '100%';
            }
        } else {
            this.elements.finalStandContainer.classList.add('hidden');
        }
    }
}