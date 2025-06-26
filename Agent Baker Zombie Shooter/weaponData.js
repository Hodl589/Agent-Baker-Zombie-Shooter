export const primaryWeapons = [
  {
    id: 'pistol',
    name: 'Pistol',
    stats: {
      damage: 25,
      fireRate: 0.3,
      bulletCount: 1,
      spread: 0.2,
      range: 250,
      reload: 1.0,
      ammo: 'light'
    }
  },
  {
    id: 'magnum',
    name: 'Magnum',
    stats: {
      damage: 60,
      fireRate: 0.8,
      bulletCount: 1,
      spread: 0.1,
      range: 300,
      reload: 1.5,
      ammo: 'heavy'
    }
  },
  {
    id: 'smg',
    name: 'SMG',
    stats: {
      damage: 15,
      fireRate: 0.15,
      bulletCount: 1,
      spread: 0.3,
      range: 220,
      reload: 1.0,
      ammo: 'light'
    }
  },
  {
    id: 'shotgun',
    name: 'Shotgun',
    stats: {
      damage: 12,
      fireRate: 0.9,
      bulletCount: 5,
      spread: 0.6,
      range: 180,
      reload: 1.5,
      ammo: 'shell'
    }
  },
  {
    id: 'ar',
    name: 'Assault Rifle',
    stats: {
      damage: 20,
      fireRate: 0.25,
      bulletCount: 1,
      spread: 0.25,
      range: 270,
      reload: 1.2,
      ammo: 'light'
    }
  }
];

export const secondaryWeapons = [
  {
    id: 'knife',
    name: 'Combat Knife',
    stats: { damage: 35, fireRate: 0.5, range: 60, reload: 0.3, ammo: 'melee' }
  },
  {
    id: 'flare',
    name: 'Flare Gun',
    stats: { damage: 10, fireRate: 1.2, range: 180, reload: 1.5, ammo: 'flare' }
  },
  {
    id: 'throwing_knives',
    name: 'Throwable Knives',
    stats: { damage: 20, fireRate: 0.6, range: 200, reload: 0.8, ammo: 'knife' }
  },
  {
    id: 'grenade',
    name: 'Grenade',
    stats: { damage: 80, fireRate: 1.5, range: 150, reload: 2.0, ammo: 'explosive' }
  },
  {
    id: 'taser',
    name: 'Taser',
    stats: { damage: 5, fireRate: 1.0, range: 100, reload: 1.0, ammo: 'shock' }
  }
];
