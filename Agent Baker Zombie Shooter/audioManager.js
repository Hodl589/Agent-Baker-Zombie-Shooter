/* @tweakable default sound volumes */
const defaultSoundVolumes = {
    'missile_explosion': 0.5,
    'boss_shoot': 0.4,
    'purchase_upgrade': 0.6,
    'boss_music': 0.3,
    'magnet_pickup': 0.7
};

export class AudioManager {
    constructor(soundVolumes = defaultSoundVolumes) {
        this.soundVolumes = soundVolumes;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.soundBuffers = {};
        this.musicSource = null;
        /* Lazy-Loading Improvement:
         * A cache to track which sounds are currently being loaded.
         * This prevents starting the same download multiple times if a sound is requested
         * while it's already in the process of being loaded. */
        this.loadingSounds = new Set();

        // Resume audio context on the first user interaction
        const resumeAudio = () => {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
    }

    /**
     * Eagerly loads a map of sounds.
     * @param {Object.<string, string>} sounds - A map of sound names to their URLs.
     */
    load(sounds) {
        for (const key in sounds) {
            this._loadSound(key, sounds[key]);
        }
    }

    /**
     * Loads a single sound if it's not already loaded or being loaded.
     * This is used for lazy-loading assets like boss music.
     * @param {string} name - The name of the sound.
     * @param {string} url - The URL of the sound file.
     * @returns {Promise<void>} A promise that resolves when the sound is loaded.
     */
    loadSound(name, url) {
        if (this.soundBuffers[name] || this.loadingSounds.has(name)) {
            return Promise.resolve();
        }
        return this._loadSound(name, url);
    }

    _loadSound(name, url) {
        this.loadingSounds.add(name);
        return fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.soundBuffers[name] = audioBuffer;
                this.loadingSounds.delete(name);
            })
            .catch(e => {
                console.error(`Error with loading sound ${name}: ${e}`);
                this.loadingSounds.delete(name);
            });
    }

    play(name) {
        if (!this.soundBuffers[name] || this.audioContext.state !== 'running') {
            return;
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.soundBuffers[name];

        const gainNode = this.audioContext.createGain();
        const volume = this.soundVolumes[name] !== undefined ? this.soundVolumes[name] : 1;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }

    playMusic(name) {
        if (this.musicSource || !this.soundBuffers[name] || this.audioContext.state !== 'running') {
            return;
        }
    
        const source = this.audioContext.createBufferSource();
        source.buffer = this.soundBuffers[name];
        source.loop = true;
    
        const gainNode = this.audioContext.createGain();
        const volume = this.soundVolumes[name] !== undefined ? this.soundVolumes[name] : 0.3;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
        this.musicSource = source;
    }

    stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource = null;
        }
    }
}