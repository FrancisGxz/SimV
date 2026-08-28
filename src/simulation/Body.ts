import * as THREE from 'three'

import { Cube } from './Cube'

export class Body {
    private static nextId = 1

    public readonly id: number

    public readonly position = new THREE.Vector3()
    public readonly rotation = new THREE.Quaternion()

    public readonly linearVelocity = new THREE.Vector3()
    public readonly angularVelocity = new THREE.Vector3()

    public readonly cubes: Cube[] = []

    public mass = 1

    public boundingRadius = Math.sqrt(3) * 0.5

    private static readonly tempAxis = new THREE.Vector3()
    private static readonly tempQuaternion = new THREE.Quaternion()

    constructor() {
        this.id = Body.nextId++
    }

    addCube(cube: Cube): void {
        this.cubes.push(cube)
    }

    integrate(dt: number): void {

        this.position.addScaledVector(this.linearVelocity, dt)
        const angularSpeed = this.angularVelocity.length()

        if (angularSpeed <= 0) {
            return
        }

        Body.tempAxis.copy(this.angularVelocity) .divideScalar(angularSpeed)
        Body.tempQuaternion.setFromAxisAngle(Body.tempAxis, angularSpeed * dt)
        this.rotation.premultiply(Body.tempQuaternion) .normalize()
    }
}
