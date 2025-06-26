import nipplejs from 'nipplejs';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        this.joystick = null;
        this.moveDirection = { x: 0, y: 0 };
        this.throwGrenade = false;
        this.useTimeStop = false;
        this.useDash = false;
        
        this.setupEventListeners();
        this.setupMobileControls();
    }
    
    setupMobileControls() {
        if ('ontouchstart' in window) {
            document.body.classList.add('is-mobile');

            /* @tweakable Position of the mobile movement joystick from the bottom-left corner. */
            const joystickPosition = { left: '100px', bottom: '100px' };
            /* @tweakable Size of the mobile movement joystick. */
            const joystickSize = 120;
            /* @tweakable Color of the mobile movement joystick. */
            const joystickColor = 'rgba(255, 255, 255, 0.5)';

            this.joystick = nipplejs.create({
                zone: document.body,
                mode: 'static',
                position: joystickPosition,
                color: joystickColor,
                size: joystickSize
            });
            
            this.joystick.on('move', (evt, data) => {
                if (data && data.vector) {
                    this.moveDirection = {
                        x: data.vector.x,
                        y: -data.vector.y
                    };
                }
            });
            
            this.joystick.on('end', () => {
                this.moveDirection = { x: 0, y: 0 };
            });

            // Touch listeners for abilities
            document.getElementById('timeStopIcon').addEventListener('touchstart', (e) => { e.preventDefault(); this.useTimeStop = true; });
            document.getElementById('dashIcon').addEventListener('touchstart', (e) => { e.preventDefault(); this.useDash = true; });
            
            const grenadeContainer = document.getElementById('grenadeContainer');
            grenadeContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (e.target.closest('.grenade-icon.available')) {
                   this.throwGrenade = true;
                }
            });

        }
    }
    
    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Grenade throwing
            if (e.code === 'KeyG') {
                this.throwGrenade = true;
            }

            if (e.code === 'KeyR') {
                this.useTimeStop = true;
            }
            
            if (e.code === 'Space') {
                this.useDash = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'KeyG') {
                this.throwGrenade = false;
            }
        });
        
        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.pressed = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.pressed = false;
        });
    }
    
    getMovement() {
        const moveSpeed = 1;
        let moveX = 0, moveY = 0;
        
        // Mobile controls take precedence
        if (this.joystick && (this.moveDirection.x !== 0 || this.moveDirection.y !== 0)) {
            moveX = this.moveDirection.x * moveSpeed;
            moveY = this.moveDirection.y * moveSpeed;
        } else {
            // Desktop controls
            if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= moveSpeed;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += moveSpeed;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= moveSpeed;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += moveSpeed;
            
            // Normalize diagonal movement for keyboard
            if (moveX !== 0 && moveY !== 0) {
                const normalizer = Math.sqrt(2) / 2;
                moveX *= normalizer;
                moveY *= normalizer;
            }
        }
        
        return { x: moveX, y: moveY };
    }
    
    isEscapePressed() {
        return this.keys['Escape'];
    }
    
    isGrenadePressed() {
        const pressed = this.throwGrenade;
        this.throwGrenade = false; // Reset after checking
        return pressed;
    }

    isTimeStopPressed() {
        const pressed = this.useTimeStop;
        this.useTimeStop = false; // Reset after checking
        return pressed;
    }

    isDashPressed() {
        const pressed = this.useDash;
        this.useDash = false; // Reset after checking
        return pressed;
    }
}