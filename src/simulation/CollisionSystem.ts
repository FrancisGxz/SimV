import * as THREE from 'three'

import { Body } from './Body'
import { Cube } from './Cube'
import type { Face } from './Face'
import type { Contact } from './Contact'
import { SpatialGrid } from './SpatialGrid'

export class CollisionSystem {
    public lastCandidateCount = 0
    public lastPotentialCollisionCount = 0

    private readonly contacts: Contact[] = []

    private static readonly AXIS_EPSILON = 0.000001

    private static readonly firstCenter = new THREE.Vector3()
    private static readonly secondCenter = new THREE.Vector3()
    private static readonly centerDelta = new THREE.Vector3()

    private static readonly firstRotation = new THREE.Quaternion()
    private static readonly secondRotation = new THREE.Quaternion()
    private static readonly tempRotation = new THREE.Quaternion()

    private static readonly firstAxes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
    private static readonly secondAxes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]

    private static readonly firstHalfExtents = new THREE.Vector3()
    private static readonly secondHalfExtents = new THREE.Vector3()

    private static readonly tempAxis = new THREE.Vector3()
    private static readonly tempNormal = new THREE.Vector3()
    private static readonly tempFaceNormal = new THREE.Vector3()

    processBatch(grid: SpatialGrid, batchIndex: number, batchCount: number): void {
        this.lastCandidateCount = 0
        this.lastPotentialCollisionCount = 0
        this.contacts.length = 0

        grid.processBatch(batchIndex, batchCount, this.processCandidate)
    }

    getContacts(): readonly Contact[] {
        return this.contacts
    }

    private processCandidate = (first: Body, second: Body): void => {
        this.lastCandidateCount++

        if (!this.boundingSpheresOverlap(first, second)) return

        this.lastPotentialCollisionCount++

        for (const firstCube of first.cubes) {
            for (const secondCube of second.cubes) {
                const contact = this.testCubeCollision(first, firstCube, second, secondCube)
                if (contact) this.contacts.push(contact)
            }
        }
    }

    private testCubeCollision(firstBody: Body, firstCube: Cube, secondBody: Body, secondCube: Cube): Contact | null {
        firstCube.getWorldPosition(firstBody, CollisionSystem.firstCenter)
        secondCube.getWorldPosition(secondBody, CollisionSystem.secondCenter)

        firstCube.getWorldRotation(firstBody, CollisionSystem.firstRotation)
        secondCube.getWorldRotation(secondBody, CollisionSystem.secondRotation)

        this.buildAxes(CollisionSystem.firstRotation, CollisionSystem.firstAxes)
        this.buildAxes(CollisionSystem.secondRotation, CollisionSystem.secondAxes)

        CollisionSystem.firstHalfExtents.copy(firstCube.scale).multiplyScalar(0.5)
        CollisionSystem.secondHalfExtents.copy(secondCube.scale).multiplyScalar(0.5)

        CollisionSystem.centerDelta.subVectors(CollisionSystem.secondCenter, CollisionSystem.firstCenter)

        let minimumPenetration = Number.POSITIVE_INFINITY
        let minimumAxisType = 0
        let minimumAxisIndex = -1

        for (let i = 0; i < 3; i++) {
            const penetration = this.testAxis(CollisionSystem.firstAxes[i])

            if (penetration < 0) return null

            if (penetration < minimumPenetration) {
                minimumPenetration = penetration
                minimumAxisType = 1
                minimumAxisIndex = i
            }
        }

        for (let i = 0; i < 3; i++) {
            const penetration = this.testAxis(CollisionSystem.secondAxes[i])

            if (penetration < 0) return null

            if (penetration < minimumPenetration) {
                minimumPenetration = penetration
                minimumAxisType = 2
                minimumAxisIndex = i
            }
        }

        for (let firstAxis = 0; firstAxis < 3; firstAxis++) {
            for (let secondAxis = 0; secondAxis < 3; secondAxis++) {
                CollisionSystem.tempAxis.crossVectors(
                    CollisionSystem.firstAxes[firstAxis],
                    CollisionSystem.secondAxes[secondAxis]
                )

                if (CollisionSystem.tempAxis.lengthSq() < CollisionSystem.AXIS_EPSILON) continue

                CollisionSystem.tempAxis.normalize()

                const penetration = this.testAxis(CollisionSystem.tempAxis)

                if (penetration < 0) return null

                if (penetration < minimumPenetration) {
                    minimumPenetration = penetration
                    minimumAxisType = 3
                    minimumAxisIndex = -1
                    CollisionSystem.tempNormal.copy(CollisionSystem.tempAxis)
                }
            }
        }

        if (minimumAxisType === 1) {
            CollisionSystem.tempNormal.copy(CollisionSystem.firstAxes[minimumAxisIndex])
        } else if (minimumAxisType === 2) {
            CollisionSystem.tempNormal.copy(CollisionSystem.secondAxes[minimumAxisIndex])
        }

        if (CollisionSystem.tempNormal.dot(CollisionSystem.centerDelta) < 0) CollisionSystem.tempNormal.negate()

        let firstFace: Face | null = null
        let secondFace: Face | null = null

        if (minimumAxisType !== 3) {
            firstFace = this.findFace(firstBody, firstCube, CollisionSystem.tempNormal)

            CollisionSystem.tempAxis.copy(CollisionSystem.tempNormal).negate()
            secondFace = this.findFace(secondBody, secondCube, CollisionSystem.tempAxis)
        }

        return {
            firstBody,
            secondBody,
            firstCube,
            secondCube,
            firstFace,
            secondFace,
            normal: CollisionSystem.tempNormal.clone(),
            penetration: minimumPenetration
        }
    }

    private testAxis(axis: THREE.Vector3): number {
        const firstRadius = this.projectRadius(axis, CollisionSystem.firstAxes, CollisionSystem.firstHalfExtents)
        const secondRadius = this.projectRadius(axis, CollisionSystem.secondAxes, CollisionSystem.secondHalfExtents)
        const distance = Math.abs(CollisionSystem.centerDelta.dot(axis))

        return firstRadius + secondRadius - distance
    }

    private projectRadius(axis: THREE.Vector3, cubeAxes: THREE.Vector3[], halfExtents: THREE.Vector3): number {
        return Math.abs(axis.dot(cubeAxes[0])) * halfExtents.x +
            Math.abs(axis.dot(cubeAxes[1])) * halfExtents.y +
            Math.abs(axis.dot(cubeAxes[2])) * halfExtents.z
    }

    private buildAxes(rotation: THREE.Quaternion, axes: THREE.Vector3[]): void {
        axes[0].set(1, 0, 0).applyQuaternion(rotation)
        axes[1].set(0, 1, 0).applyQuaternion(rotation)
        axes[2].set(0, 0, 1).applyQuaternion(rotation)
    }

    private findFace(body: Body, cube: Cube, direction: THREE.Vector3): Face {
        let bestFace = cube.faces[0]
        let bestDot = -Number.MAX_VALUE

        for (const face of cube.faces) {
            cube.getWorldFaceNormal(body, face, CollisionSystem.tempFaceNormal, CollisionSystem.tempRotation)

            const dot = CollisionSystem.tempFaceNormal.dot(direction)

            if (dot > bestDot) {
                bestDot = dot
                bestFace = face
            }
        }

        return bestFace
    }

    private boundingSpheresOverlap(first: Body, second: Body): boolean {
        const dx = first.position.x - second.position.x
        const dy = first.position.y - second.position.y
        const dz = first.position.z - second.position.z
        const radius = first.boundingRadius + second.boundingRadius

        return dx * dx + dy * dy + dz * dz <= radius * radius
    }
}
