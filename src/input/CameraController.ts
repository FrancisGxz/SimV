import * as THREE from 'three'

export class CameraController {
    private readonly keys = new Set<string>()

    private yaw = 0
    private pitch = 0
    private rotating = false

    private readonly forward = new THREE.Vector3()
    private readonly right = new THREE.Vector3()
    private readonly worldUp = new THREE.Vector3(0, 1, 0)
    private readonly rotation = new THREE.Euler(0, 0, 0, 'YXZ')

    private readonly moveSpeed = 8
    private readonly fastMultiplier = 4
    private readonly mouseSensitivity = 0.002

    constructor(
        private readonly camera: THREE.PerspectiveCamera,
        private readonly canvas: HTMLCanvasElement
    ) {
        this.rotation.setFromQuaternion(this.camera.quaternion, 'YXZ')
        this.pitch = this.rotation.x
        this.yaw = this.rotation.y

        window.addEventListener('keydown', this.onKeyDown)
        window.addEventListener('keyup', this.onKeyUp)
        this.canvas.addEventListener('mousedown', this.onMouseDown)

        window.addEventListener('mouseup', this.onMouseUp)
        window.addEventListener('mousemove', this.onMouseMove)
        this.canvas.addEventListener('contextmenu', this.onContextMenu)
    }

    update(dt: number): void {
        const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')
            ? this.moveSpeed * this.fastMultiplier
            : this.moveSpeed

        this.camera.getWorldDirection(this.forward)
        this.right.crossVectors(this.forward, this.worldUp).normalize()

        if (this.keys.has('KeyW')) {
            this.camera.position.addScaledVector(this.forward, speed * dt)
        }

        if (this.keys.has('KeyS')) {
            this.camera.position.addScaledVector(this.forward, -speed * dt)
        }

        if (this.keys.has('KeyD')) {
            this.camera.position.addScaledVector(this.right, speed * dt)
        }

        if (this.keys.has('KeyA')) {
            this.camera.position.addScaledVector(this.right, -speed * dt)
        }

        if (this.keys.has('KeyE')) {
            this.camera.position.y += speed * dt
        }

        if (this.keys.has('KeyQ')) {
            this.camera.position.y -= speed * dt
        }
    }

    private onKeyDown = (event: KeyboardEvent): void => {
        this.keys.add(event.code)
    }

    private onKeyUp = (event: KeyboardEvent): void => {
        this.keys.delete(event.code)
    }

    private onMouseDown = (event: MouseEvent): void => {
        if (event.button === 2) {
            this.rotating = true
        }
    }

    private onMouseUp = (event: MouseEvent): void => {
        if (event.button === 2) {
            this.rotating = false
        }
    }

    private onMouseMove = (event: MouseEvent): void => {
        if (!this.rotating) {
            return
        }

        this.yaw -= event.movementX * this.mouseSensitivity
        this.pitch -= event.movementY * this.mouseSensitivity

        const pitchLimit = Math.PI / 2 - 0.01
        this.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, this.pitch))

        this.rotation.set(this.pitch, this.yaw, 0)
        this.camera.quaternion.setFromEuler(this.rotation)
    }

    private onContextMenu = (event: MouseEvent): void => {
        event.preventDefault()
    }
}