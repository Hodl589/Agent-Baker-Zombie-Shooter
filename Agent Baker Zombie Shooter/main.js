import { characters } from './characterData.js';
import { primaryWeapons, secondaryWeapons } from './weaponData.js';
import { Game } from './game.js';

let selectedCharacter = null;
let selectedPrimary = null;
let selectedSecondary = null;
let currentGame = null;

function createOptionButton(item, container, onSelect) {
  const btn = document.createElement('button');
  btn.className = 'powerup-btn';
  btn.innerHTML = `<h3>${item.name}</h3><p>${item.description || ''}</p>`;
  btn.title = item.stats ?
    `Damage: ${item.stats.damage}\nRate: ${item.stats.fireRate}s\nRange: ${item.stats.range}` : '';
  btn.addEventListener('click', () => onSelect(item, btn));
  container.appendChild(btn);
  return btn;
}

function showCharacterSelection() {
  const container = document.getElementById('characterOptions');
  container.innerHTML = '';
  characters.forEach(ch => {
    createOptionButton(ch, container, (item, btn) => {
      selectedCharacter = item;
      [...container.children].forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      showLoadoutSelection();
    });
  });
  document.getElementById('characterSelection').classList.remove('hidden');
}

function showLoadoutSelection() {
  const pCont = document.getElementById('primaryOptions');
  const sCont = document.getElementById('secondaryOptions');
  pCont.innerHTML = '';
  sCont.innerHTML = '';

  primaryWeapons.forEach(w => {
    createOptionButton(w, pCont, (item, btn) => {
      selectedPrimary = item;
      [...pCont.children].forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  secondaryWeapons.forEach(w => {
    createOptionButton(w, sCont, (item, btn) => {
      selectedSecondary = item;
      [...sCont.children].forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  document.getElementById('characterSelection').classList.add('hidden');
  document.getElementById('loadoutSelection').classList.remove('hidden');
}

function startGame() {
  if (!selectedCharacter || !selectedPrimary || !selectedSecondary) return;
  document.getElementById('loadoutSelection').classList.add('hidden');
  currentGame = new Game({
    character: selectedCharacter,
    primaryWeapon: selectedPrimary,
    secondaryWeapon: selectedSecondary
  });
  currentGame.start();
  currentGame.uiManager.setCharacterInfo(selectedCharacter.name, selectedPrimary.name, selectedSecondary.name);
window.addEventListener('DOMContentLoaded', () => {
  showCharacterSelection();
  document.getElementById('startGameBtn').addEventListener('click', startGame);
});

export { startGame };
