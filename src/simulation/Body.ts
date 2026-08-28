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

    public readonly inertia = new THREE.Matrix3()
    public readonly inverseInertia = new THREE.Matrix3()

    public mass = 1
    public boundingRadius = Math.sqrt(3) * 0.5

    constructor() {
        this.id = Body.nextId++
        this.recomputeMassProperties()
    }

    addCube(cube: Cube): void {
        this.cubes.push(cube)
        this.recomputeMassProperties()
    }

    recomputeMassProperties(): void {
        this.mass = this.cubes.length

        if (this.cubes.length === 0) {
            this.boundingRadius = 0
            this.inertia.identity()
            this.inverseInertia.identity()
            return
        }

        let ixx = 0
        let iyy = 0
        let izz = 0
        let ixy = 0
        let ixz = 0
        let iyz = 0
        let maxRadius = 0

        for (const cube of this.cubes) {
            const x = cube.localPosition.x
            const y = cube.localPosition.y
            const z = cube.localPosition.z

            // Unit cube, mass 1: inertia around its own center is 1/6 on each axis.
            const cubeInertia = 1 / 6

            // Parallel-axis theorem.
            ixx += cubeInertia + y * y + z * z
            iyy += cubeInertia + x * x + z * z
            izz += cubeInertia + x * x + y * y

            ixy -= x * y
            ixz -= x * z
            iyz -= y * z

            const cubeRadius = cube.localPosition.length() + cube.scale.length() * 0.5
            maxRadius = Math.max(maxRadius, cubeRadius)
        }

        this.inertia.set(
            ixx, ixy, ixz,
            ixy, iyy, iyz,
            ixz, iyz, izz
        )

        this.inverseInertia.copy(this.inertia).invert()
        this.boundingRadius = maxRadius
    }

    getWorldInertia(target: THREE.Matrix3): THREE.Matrix3 {
        Body.tempRotationMatrix.makeRotationFromQuaternion(this.rotation)
        Body.tempRotation3.setFromMatrix4(Body.tempRotationMatrix)
        Body.tempRotationTranspose.copy(Body.tempRotation3).transpose()

        target.multiplyMatrices(Body.tempRotation3, this.inertia)
        target.multiply(Body.tempRotationTranspose)

        return target
    }

    integrate(dt: number): void {
        this.position.addScaledVector(this.linearVelocity, dt)

        const angularSpeed = this.angularVelocity.length()
        if (angularSpeed <= 0) return

        Body.tempAxis.copy(this.angularVelocity).divideScalar(angularSpeed)
        Body.tempQuaternion.setFromAxisAngle(Body.tempAxis, angularSpeed * dt)

        this.rotation.premultiply(Body.tempQuaternion).normalize()
    }

    private static readonly tempAxis = new THREE.Vector3()
    private static readonly tempQuaternion = new THREE.Quaternion()

    private static readonly tempRotationMatrix = new THREE.Matrix4()
    private static readonly tempRotation3 = new THREE.Matrix3()
    private static readonly tempRotationTranspose = new THREE.Matrix3()
}