/** @tweakable The list of tips displayed on the death screen. Add, remove, or edit tips here. */
const DEATH_SCREEN_TIPS = [
    'You can slow down projectiles using Time Stop!',
    'WASD to move, ESC to pause. The basics are important!',
    'XP orbs are drawn to you. Increase your magnet range to collect them from further away.',
    'The shop appears every few levels. Save your score for powerful upgrades!',
    'Grenades are great for clearing out large groups of zombies.',
    'Bosses have multiple attack patterns. Learn them to survive!',
    'The VHS filter in the pause menu offers a retro visual experience.',
    'Each level up restores a bit of health and one grenade.',
    'The \'Efficient Learner\' upgrade reduces the XP needed for future levels, a great long-term investment.',
    "Don't forget to use your abilities! 'R' for Time Stop if you have it.",
    'Some upgrades are only available in the shop or from boss chests.',
    'Piercing shots can hit multiple enemies. Very effective against lines of zombies.',
    'Spikes deal constant damage to any zombie that touches them.',
    'The Time Stop field can give you a much-needed breather.',
    'Prioritize dangerous enemies when you can.',
    'Are you sure your keyboard is plugged in?',
    'My grandmother plays better than you. And she\'s a zombie.',
    'Skill issue.',
    'Tried turning it off and on again? Your brain, I mean.',
    'The zombies felt bad for you and let you win... at dying.',
    'You have the survival instincts of a dodo.',
    'Hint: The goal is to *not* get hit.',
    'Maybe try a different game? Like, tic-tac-toe?',
    'You are the reason they put instructions on shampoo bottles.',
    'I\'ve seen potatoes with better aim.',
    'Pro tip: a lower score is not better.',
    'That was a tactical death, right? ...Right?',
    'The zombies are unionizing for better working conditions. You\'re making it too easy.',
    'You seem to have a strong magnetic attraction to projectiles.',
    'Did you try dodging? It\'s that thing where you move out of the way.',
    'Remember: looking at the screen is generally recommended.',
    'Your score was almost a positive number!',
    'The pause button is your friend. Unlike the zombies.',
    'I\'m not mad, I\'m just disappointed.',
    'Achievement unlocked: Gave a zombie a free meal.',
    'You have died of... well, everything.',
    'On the bright side, you make the zombies feel good about themselves.',
    'I think you misunderstood the term "bullet hell". You\'re not supposed to absorb them all.',
    'Were you trying to hug the boss?',
    'You fought with the courage of a slightly brave hamster.',
    'Final Stand is great, but standing still is not.',
    'Is your movement key broken?',
    'The zombies have filed a complaint. They say it\'s not challenging enough.',
    'You are a true pacifist. You refuse to harm the enemies by dodging their attacks.',
    'The floor is not lava, but everything else is.',
    'Next time, try using the pointy end of the bullets.',
    'Error 404: Survival skills not found.',
    'You are the zombie equivalent of a free sample.',
    'The game\'s difficulty is adapting to your skill level. It\'s now set to "toddler".',
    'Don\'t worry, we have a participation trophy for you.',
    'You\'ve mastered the art of "aggressive dying".',
    'I\'ve seen more impressive survival from a screen saver.',
    'Your strategy of running into things is... a strategy.',
    'It\'s okay, maybe this just isn\'t your genre. Or your decade.',
    'The good news is, you can only go up from here. Probably.',
    'The zombies are starting to recognize you.',
    'You are a valuable data point for "what not to do".',
    'Have you considered just standing in a corner? It works about as well.',
    'You\'re not bad, you\'re just "creatively challenged".',
    'The enemies are evolving. You are... not.',
    'The dash ability is for avoiding things, not for dashing into them.',
    '"I\'ll just stand here, they can\'t all hit me." - Famous last words.',
    'You are proof that anyone can play video games. Not well, but they can play.',
    'If at first you don\'t succeed, die, die again.',
    'You\'re like a superhero whose only power is dying.',
    'The enemies have added your picture to their "Employee of the Month" board.',
    'I bet you don\'t even use your turn signals in real life.',
    'The shop sells upgrades, not miracles.',
    'You\'re playing checkers while the zombies are playing 5D chess.',
    'It\'s a good thing this isn\'t a stealth game.',
    'You have the reaction time of a potted plant.',
    'I would say "good try," but... was it?',
    'Your health bar is more of a suggestion, isn\'t it?',
    'You are the reason zombies have hope.',
    'Tip: The red things hurt you. The blue things are your friend. Mostly.',
    'You\'ve set a new record! For fastest death.',
    'The game is called Zombie Survivors, not Zombie Food.',
    'Congratulations on your new career as a zombie chew toy.',
];

export class PopupManager {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.selectedBossRewards = [];
        this.bossRewardPicks = 2;
        this.deathScreenTips = DEATH_SCREEN_TIPS;

        this.elements = {
            powerupSelection: document.getElementById('powerupSelection'),
            bossRewardSelection: document.getElementById('bossRewardSelection'),
            shopSelection: document.getElementById('shopSelection'),
            pauseMenu: document.getElementById('pauseMenu'),
            deathScreen: document.getElementById('deathScreen'),
            finalScore: document.getElementById('finalScore'),
            finalLevel: document.getElementById('finalLevel'),
            deathTip: document.getElementById('deathTip'),
            bossRewardSubtitle: document.getElementById('bossRewardSubtitle'),
            debugOverlay: document.getElementById('debugOverlay'),
            fpsCounter: document.getElementById('fpsCounter'),
            memCounter: document.getElementById('memCounter'),
        };

        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('resumeBtn').addEventListener('click', this.callbacks.onResume);
        document.getElementById('restartBtn').addEventListener('click', this.callbacks.onRestart);
        document.getElementById('playAgainBtn').addEventListener('click', this.callbacks.onRestart);
        
        document.getElementById('skipPowerupBtn').addEventListener('click', this.callbacks.onSkipPowerup);

        document.getElementById('skipBossRewardBtn').addEventListener('click', () => {
            this.hideBossRewardSelection();
            this.callbacks.onSkipBossReward();
        });

        document.querySelectorAll('#powerupSelection .powerup-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.callbacks.onSelectPowerup(parseInt(btn.dataset.powerup));
            });
        });

        document.querySelectorAll('#bossRewardSelection .powerup-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleBossRewardClick(parseInt(btn.dataset.reward));
            });
        });

        document.querySelectorAll('#shopSelection .shop-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.callbacks.onSelectShopItem(parseInt(btn.dataset.shop));
            });
        });
        document.getElementById('shopCloseBtn').addEventListener('click', this.callbacks.onCloseShop);

        document.getElementById('vhsFilterCheckbox')?.addEventListener('change', (e) => {
            this.callbacks.onToggleVhsFilter(e.target.checked);
        });
        document.getElementById('bloomCheckbox')?.addEventListener('change', (e) => {
            this.callbacks.onToggleBloom(e.target.checked);
        });
        document.getElementById('showHitboxesCheckbox')?.addEventListener('change', (e) => {
            this.callbacks.onToggleHitboxes(e.target.checked);
        });
        document.getElementById('bulletTimeCheckbox')?.addEventListener('change', (e) => {
            this.callbacks.onToggleBulletTime(e.target.checked);
        });
        document.getElementById('debugInfoCheckbox')?.addEventListener('change', (e) => {
            this.callbacks.onToggleDebugInfo(e.target.checked);
        });
    }

    showPowerupSelection(options, upgradeStacks, maxUpgradeLevel) {
        for (let i = 0; i < 3; i++) {
            const powerup = options[i];
            document.getElementById(`powerup${i}Title`).textContent = powerup.name;
            document.getElementById(`powerup${i}Desc`).textContent = powerup.description;
            
            const iconElement = document.getElementById(`powerup${i}Icon`);
            iconElement.textContent = powerup.icon;
            iconElement.style.background = powerup.iconColor;
            
            const dotsContainer = document.getElementById(`powerup${i}Dots`);
            const currentLevel = upgradeStacks[powerup.id] || 0;
            dotsContainer.innerHTML = '';
            for (let j = 0; j < maxUpgradeLevel; j++) {
                const dot = document.createElement('div');
                dot.className = `upgrade-dot ${j < currentLevel ? 'filled' : ''}`;
                dotsContainer.appendChild(dot);
            }
        }
        this.elements.powerupSelection.classList.remove('hidden');
    }

    hidePowerupSelection() {
        this.elements.powerupSelection.classList.add('hidden');
    }

    showBossRewardSelection(rewards, picks) {
        this.bossRewardPicks = picks;
        this.selectedBossRewards = [];
        this.elements.bossRewardSubtitle.textContent = `Pick ${picks} reward${picks > 1 ? 's' : ''}`;

        for (let i = 0; i < 6; i++) {
            const btn = document.querySelector(`#bossRewardSelection .powerup-btn[data-reward="${i}"]`);
            if (!btn) continue;
            
            if (i < rewards.length) {
                const r = rewards[i];
                btn.style.display = 'flex';
                document.getElementById(`bossReward${i}Title`).textContent = r.name;
                document.getElementById(`bossReward${i}Desc`).textContent = r.description;
                const iconEl = document.getElementById(`bossReward${i}Icon`);
                iconEl.textContent = r.icon;
                iconEl.style.background = r.iconColor;
                btn.disabled = false;
                btn.classList.remove('selected');
            } else {
                btn.style.display = 'none';
            }
        }
        this.elements.bossRewardSelection.classList.remove('hidden');
    }

    hideBossRewardSelection() {
        this.elements.bossRewardSelection.classList.add('hidden');
    }

    handleBossRewardClick(index) {
        if (this.selectedBossRewards.includes(index) || this.selectedBossRewards.length >= this.bossRewardPicks) {
            return;
        }

        const btn = document.querySelector(`#bossRewardSelection button[data-reward="${index}"]`);
        btn.disabled = true;
        btn.classList.add('selected');
        this.selectedBossRewards.push(index);
        
        this.callbacks.onSelectBossReward(index);

        if (this.selectedBossRewards.length >= this.bossRewardPicks) {
            setTimeout(() => {
                this.hideBossRewardSelection();
                this.callbacks.onFinishBossRewardSelection();
            }, 500);
        }
    }

    showShop(items, score) {
        items.forEach((item, i) => {
            document.getElementById(`shop${i}Title`).textContent = item.name;
            document.getElementById(`shop${i}Desc`).textContent = item.description;
            const iconEl = document.getElementById(`shop${i}Icon`);
            iconEl.textContent = item.icon;
            iconEl.style.background = item.iconColor;
            const costEl = document.getElementById(`shop${i}Cost`);
            costEl.textContent = `${item.cost}`;
            costEl.style.color = score < item.cost ? '#888888' : '';

            const btn = document.querySelector(`#shopSelection .shop-btn[data-shop="${i}"]`);
            if (item.bought) {
                btn.classList.add('bought');
            } else {
                btn.classList.remove('bought');
            }
        });
        this.elements.shopSelection.classList.remove('hidden');
    }

    hideShop() {
        this.elements.shopSelection.classList.add('hidden');
    }
    
    updateAfterPurchase(score, allItems) {
        allItems.forEach((item, index) => {
            const btn = document.querySelector(`#shopSelection .shop-btn[data-shop="${index}"]`);
            if (item.bought) {
                btn.classList.add('bought');
            }
            const costEl = document.getElementById(`shop${index}Cost`);
            if (costEl && (item.bought || parseInt(costEl.textContent) > score)) {
                costEl.style.color = '#888888';
            }
        });
    }

    togglePauseMenu(isPaused) {
        this.elements.pauseMenu.classList.toggle('hidden', !isPaused);
    }

    showDeathScreen(score, level) {
        this.elements.finalScore.textContent = score;
        this.elements.finalLevel.textContent = level;

        if (this.deathScreenTips.length > 0) {
            const randomTip = this.deathScreenTips[Math.floor(Math.random() * this.deathScreenTips.length)];
            this.elements.deathTip.textContent = `Tip: ${randomTip}`;
        }
        
        this.elements.deathScreen.classList.remove('hidden');
    }

    hideDeathScreen() {
        this.elements.deathScreen.classList.add('hidden');
    }

    toggleDebugOverlay(visible) {
        this.elements.debugOverlay.classList.toggle('hidden', !visible);
    }

    updateDebugInfo(fps, mem) {
        if (!this.elements.debugOverlay.classList.contains('hidden')) {
            this.elements.fpsCounter.textContent = fps;
            /* Performance Debugging: Display memory usage. Note that performance.memory is
             * a non-standard API available in Chromium-based browsers. It may not work everywhere. */
            this.elements.memCounter.textContent = mem.toFixed(2);
        }
    }
}