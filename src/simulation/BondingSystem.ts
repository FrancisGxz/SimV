import * as THREE from 'three'

import type { Contact } from './Contact'
import type { Body } from './Body'

export class BondingSystem {
    private static readonly NORMAL_DOT_THRESHOLD = -0.8

    private readonly tempFirstNormal = new THREE.Vector3()
    private readonly tempSecondNormal = new THREE.Vector3()
    private readonly tempDesiredNormal = new THREE.Vector3()

    private readonly tempFirstFaceCenter = new THREE.Vector3()
    private readonly tempSecondFaceCenter = new THREE.Vector3()

    private readonly tempWorldPosition = new THREE.Vector3()
    private readonly tempWorldRotation = new THREE.Quaternion()
    private readonly tempInverseRotation = new THREE.Quaternion()
    private readonly tempSnapRotation = new THREE.Quaternion()
    private readonly tempRotation = new THREE.Quaternion()

    private readonly tempCenterOfMass = new THREE.Vector3()
    private readonly tempLinearMomentum = new THREE.Vector3()
    private readonly tempAngularMomentum = new THREE.Vector3()
    private readonly tempMomentum = new THREE.Vector3()
    private readonly tempOffset = new THREE.Vector3()
    private readonly tempCross = new THREE.Vector3()

    private readonly tempFirstWorldInertia = new THREE.Matrix3()
    private readonly tempSecondWorldInertia = new THREE.Matrix3()
    private readonly tempMergedWorldInertia = new THREE.Matrix3()

    canJoin(contact: Contact): boolean {
        const firstFace = contact.firstFace
        const secondFace = contact.secondFace

        if (!firstFace || !secondFace) return false
        if (firstFace.connected || secondFace.connected) return false
        if (firstFace.color !== secondFace.color) return false

        contact.firstCube.getWorldFaceNormal(
            contact.firstBody,
            firstFace,
            this.tempFirstNormal,
            this.tempRotation
        )

        contact.secondCube.getWorldFaceNormal(
            contact.secondBody,
            secondFace,
            this.tempSecondNormal,
            this.tempRotation
        )

        return this.tempFirstNormal.dot(this.tempSecondNormal) <= BondingSystem.NORMAL_DOT_THRESHOLD
    }

    join(contact: Contact): void {
        const first = contact.firstBody
        const second = contact.secondBody

        this.snapBodies(contact)

        contact.firstFace!.connected = true
        contact.secondFace!.connected = true

        const firstMass = first.mass
        const secondMass = second.mass
        const totalMass = firstMass + secondMass

        this.tempCenterOfMass
            .copy(first.position)
            .multiplyScalar(firstMass)
            .addScaledVector(second.position, secondMass)
            .divideScalar(totalMass)

        this.calculateLinearMomentum(first, second)
        this.calculateAngularMomentum(first, second, this.tempCenterOfMass)

        this.tempInverseRotation.copy(first.rotation).invert()

        this.reparentCubes(first, this.tempCenterOfMass, this.tempInverseRotation)
        this.reparentCubes(second, this.tempCenterOfMass, this.tempInverseRotation)

        first.position.copy(this.tempCenterOfMass)
        first.cubes.push(...second.cubes)

        first.recomputeMassProperties()

        first.linearVelocity.copy(this.tempLinearMomentum).divideScalar(first.mass)

        first.getWorldInertia(this.tempMergedWorldInertia)
        this.tempMergedWorldInertia.invert()

        first.angularVelocity
            .copy(this.tempAngularMomentum)
            .applyMatrix3(this.tempMergedWorldInertia)
    }

    private snapBodies(contact: Contact): void {
        const firstFace = contact.firstFace!
        const secondFace = contact.secondFace!
        const second = contact.secondBody

        contact.firstCube.getWorldFaceNormal(
            contact.firstBody,
            firstFace,
            this.tempFirstNormal,
            this.tempRotation
        )

        contact.secondCube.getWorldFaceNormal(
            second,
            secondFace,
            this.tempSecondNormal,
            this.tempRotation
        )

        this.tempDesiredNormal.copy(this.tempFirstNormal).negate()
        this.tempSnapRotation.setFromUnitVectors(this.tempSecondNormal, this.tempDesiredNormal)

        second.rotation.premultiply(this.tempSnapRotation).normalize()

        contact.firstCube.getWorldFaceCenter(
            contact.firstBody,
            firstFace,
            this.tempFirstFaceCenter
        )

        contact.secondCube.getWorldFaceCenter(
            second,
            secondFace,
            this.tempSecondFaceCenter
        )

        this.tempFirstFaceCenter.sub(this.tempSecondFaceCenter)
        second.position.add(this.tempFirstFaceCenter)
    }

    private calculateLinearMomentum(first: Body, second: Body): void {
        this.tempLinearMomentum
            .copy(first.linearVelocity)
            .multiplyScalar(first.mass)
            .addScaledVector(second.linearVelocity, second.mass)
    }

    private calculateAngularMomentum(
        first: Body,
        second: Body,
        centerOfMass: THREE.Vector3
    ): void {
        this.tempAngularMomentum.set(0, 0, 0)

        first.getWorldInertia(this.tempFirstWorldInertia)
        this.tempMomentum.copy(first.angularVelocity).applyMatrix3(this.tempFirstWorldInertia)
        this.tempAngularMomentum.add(this.tempMomentum)

        this.tempOffset.subVectors(first.position, centerOfMass)
        this.tempMomentum.copy(first.linearVelocity).multiplyScalar(first.mass)
        this.tempCross.crossVectors(this.tempOffset, this.tempMomentum)
        this.tempAngularMomentum.add(this.tempCross)

        second.getWorldInertia(this.tempSecondWorldInertia)
        this.tempMomentum.copy(second.angularVelocity).applyMatrix3(this.tempSecondWorldInertia)
        this.tempAngularMomentum.add(this.tempMomentum)

        this.tempOffset.subVectors(second.position, centerOfMass)
        this.tempMomentum.copy(second.linearVelocity).multiplyScalar(second.mass)
        this.tempCross.crossVectors(this.tempOffset, this.tempMomentum)
        this.tempAngularMomentum.add(this.tempCross)
    }

    private reparentCubes(
        source: Body,
        centerOfMass: THREE.Vector3,
        inverseRotation: THREE.Quaternion
    ): void {
        for (const cube of source.cubes) {
            cube.getWorldPosition(source, this.tempWorldPosition)
            cube.getWorldRotation(source, this.tempWorldRotation)

            cube.localPosition
                .copy(this.tempWorldPosition)
                .sub(centerOfMass)
                .applyQuaternion(inverseRotation)

            cube.localRotation
                .copy(inverseRotation)
                .multiply(this.tempWorldRotation)
                .normalize()
        }
    }
}