import * as THREE from 'three'

import { Body } from './Body'
import { Cube } from './Cube'
import { SpatialGrid } from './SpatialGrid'
import { CollisionSystem } from './CollisionSystem'
import { BondingSystem } from './BondingSystem'
import type { Contact } from './Contact'

export class Simulation {

    private static readonly INITIAL_CUBE_COUNT = 1000

    public readonly worldHalfSize = 25

    private static readonly MIN_INITIAL_SPEED = 0.3
    private static readonly MAX_INITIAL_SPEED = 2

    private static readonly MIN_ANGULAR_SPEED = -2
    private static readonly MAX_ANGULAR_SPEED = 2

    private static readonly SPATIAL_GRID_CELL_SIZE = 2
    private static readonly COLLISION_BATCH_COUNT = 4

    private static readonly COLLISION_RESTITUTION = 1.0
    private static readonly COLLISION_POSITION_CORRECTION = 0.8
    private static readonly COLLISION_TOLERANCE = 0.001

    private static readonly tempRelativeVelocity = new THREE.Vector3()
    private static readonly tempImpulse = new THREE.Vector3()
    private static readonly tempCorrection = new THREE.Vector3()


    public readonly bodies: Body[] = []
    public tick = 0

    private readonly spatialGrid = new SpatialGrid(Simulation.SPATIAL_GRID_CELL_SIZE)
    private readonly collisionSystem = new CollisionSystem()
    private readonly bondingSystem = new BondingSystem()

    private static readonly tempAxis = new THREE.Vector3()
    private static readonly tempDirection = new THREE.Vector3()

    private collisionBatchIndex = 0

    constructor() {
        this.spawnCubes(Simulation.INITIAL_CUBE_COUNT)
        this.spatialGrid.rebuild(this.bodies)
    }

    update(dt: number): void {
        this.tick++
        this.integrateBodies(dt)

        if (this.collisionBatchIndex === 0) {
            this.spatialGrid.rebuild(this.bodies)
        }

        this.collisionSystem.processBatch( this.spatialGrid, this.collisionBatchIndex, Simulation.COLLISION_BATCH_COUNT)
        const bodiesChanged = this.resolveContacts()

        if (bodiesChanged) {
            this.spatialGrid.rebuild(this.bodies)
            this.collisionBatchIndex = 0
        } else {
            this.collisionBatchIndex =
                (this.collisionBatchIndex + 1) % Simulation.COLLISION_BATCH_COUNT
        }
    }

    spawnCubes(count: number): void {
        for (let i = 0; i < count; i++) {
            this.spawnCube()
        }
    }

    spawnCube(position?: THREE.Vector3): Body {
        const body = new Body()
        body.addCube(new Cube())

        if (position) {
            body.position.copy(position)
        } else {
            body.position.set(
                this.randomRange(-this.worldHalfSize + 1, this.worldHalfSize - 1),
                this.randomRange(-this.worldHalfSize + 1, this.worldHalfSize - 1),
                this.randomRange(-this.worldHalfSize + 1, this.worldHalfSize - 1)
            )
        }

        this.randomUnitVector(Simulation.tempDirection)

        const speed = this.randomRange(
            Simulation.MIN_INITIAL_SPEED,
            Simulation.MAX_INITIAL_SPEED
        )

        body.linearVelocity.copy(Simulation.tempDirection).multiplyScalar(speed)

        body.angularVelocity.set(
            this.randomRange(Simulation.MIN_ANGULAR_SPEED, Simulation.MAX_ANGULAR_SPEED),
            this.randomRange(Simulation.MIN_ANGULAR_SPEED, Simulation.MAX_ANGULAR_SPEED),
            this.randomRange(Simulation.MIN_ANGULAR_SPEED, Simulation.MAX_ANGULAR_SPEED)
        )

        this.randomUnitVector(Simulation.tempAxis)

        body.rotation.setFromAxisAngle(
            Simulation.tempAxis,
            Math.random() * Math.PI * 2
        )

        this.bodies.push(body)
        return body
    }

    reset(cubeCount = Simulation.INITIAL_CUBE_COUNT): void {
        this.bodies.length = 0
        this.tick = 0
        this.collisionBatchIndex = 0

        this.spawnCubes(cubeCount)
        this.spatialGrid.rebuild(this.bodies)
    }

    getCubeCount(): number {
        let count = 0

        for (const body of this.bodies) {
            count += body.cubes.length
        }

        return count
    }

    getCollisionBatchIndex(): number {
        return this.collisionBatchIndex
    }

    getLastCandidateCount(): number {
        return this.collisionSystem.lastCandidateCount
    }

    getLastPotentialCollisionCount(): number {
        return this.collisionSystem.lastPotentialCollisionCount
    }

    getContacts(): readonly Contact[] { return this.collisionSystem.getContacts() }

    private integrateBodies(dt: number): void {
        for (const body of this.bodies) {
            body.integrate(dt)
            this.resolveWorldBounds(body)
        }
    }

    private resolveWorldBounds(body: Body): void {
        const radius = body.boundingRadius
        const min = -this.worldHalfSize + radius
        const max = this.worldHalfSize - radius

        if (body.position.x < min) {
            body.position.x = min
            body.linearVelocity.x = Math.abs(body.linearVelocity.x)
        } else if (body.position.x > max) {
            body.position.x = max
            body.linearVelocity.x = -Math.abs(body.linearVelocity.x)
        }

        if (body.position.y < min) {
            body.position.y = min
            body.linearVelocity.y = Math.abs(body.linearVelocity.y)
        } else if (body.position.y > max) {
            body.position.y = max
            body.linearVelocity.y = -Math.abs(body.linearVelocity.y)
        }

        if (body.position.z < min) {
            body.position.z = min
            body.linearVelocity.z = Math.abs(body.linearVelocity.z)
        } else if (body.position.z > max) {
            body.position.z = max
            body.linearVelocity.z = -Math.abs(body.linearVelocity.z)
        }
    }

    private randomUnitVector(target: THREE.Vector3): THREE.Vector3 {
        do {
            target.set(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            )
        } while (target.lengthSq() < 0.001)

        return target.normalize()
    }

    private randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min)
    }

    private resolveContacts(): boolean {
        const joins: Contact[] = []
        const reservedBodies = new Set<number>()

        for (const contact of this.collisionSystem.getContacts()) {
            if (!this.bondingSystem.canJoin(contact)) continue
            if (reservedBodies.has(contact.firstBody.id) || reservedBodies.has(contact.secondBody.id)) continue

            joins.push(contact)
            reservedBodies.add(contact.firstBody.id)
            reservedBodies.add(contact.secondBody.id)
        }

        for (const contact of this.collisionSystem.getContacts()) {
            if (reservedBodies.has(contact.firstBody.id) || reservedBodies.has(contact.secondBody.id)) continue
            this.resolveContact(contact)
        }

        for (const contact of joins) {
            this.bondingSystem.join(contact)
            this.removeBody(contact.secondBody)
        }

        return joins.length > 0
    }
    
    private removeBody(body: Body): void {
        const index = this.bodies.indexOf(body)
        if (index !== -1) this.bodies.splice(index, 1)
    }

    private resolveContact(contact: Contact): void {
        const first = contact.firstBody
        const second = contact.secondBody

        Simulation.tempRelativeVelocity.subVectors(second.linearVelocity, first.linearVelocity)

        const velocityAlongNormal = Simulation.tempRelativeVelocity.dot(contact.normal)

        if (velocityAlongNormal < 0) {
            const firstInverseMass = 1 / first.mass
            const secondInverseMass = 1 / second.mass

            const impulseMagnitude =
                -(1 + Simulation.COLLISION_RESTITUTION) * velocityAlongNormal /
                (firstInverseMass + secondInverseMass)

            Simulation.tempImpulse.copy(contact.normal).multiplyScalar(impulseMagnitude)

            first.linearVelocity.addScaledVector(Simulation.tempImpulse, -firstInverseMass)
            second.linearVelocity.addScaledVector(Simulation.tempImpulse, secondInverseMass)
        }

        this.correctContactPosition(contact)
    }

    private correctContactPosition(contact: Contact): void {
        if (contact.penetration <= Simulation.COLLISION_TOLERANCE) return

        const first = contact.firstBody
        const second = contact.secondBody

        const firstInverseMass = 1 / first.mass
        const secondInverseMass = 1 / second.mass
        const inverseMassSum = firstInverseMass + secondInverseMass

        const correctionMagnitude =
            (contact.penetration - Simulation.COLLISION_TOLERANCE) *
            Simulation.COLLISION_POSITION_CORRECTION /
            inverseMassSum

        Simulation.tempCorrection.copy(contact.normal).multiplyScalar(correctionMagnitude)

        first.position.addScaledVector(Simulation.tempCorrection, -firstInverseMass)
        second.position.addScaledVector(Simulation.tempCorrection, secondInverseMass)
    }
}
