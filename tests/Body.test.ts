import * as THREE from 'three'
import { describe, expect, test } from 'vitest'

import { Body } from  '../src/simulation/Body'

describe('Body', () => {
    test('integrates linear velocity', () => {
        const body = new Body()

        body.position.set(1, 2, 3)
        body.linearVelocity.set(2, -1, 4)

        body.integrate(0.5)

        expect(body.position.x).toBeCloseTo(2)
        expect(body.position.y).toBeCloseTo(1.5)
        expect(body.position.z).toBeCloseTo(5)
    })

    test('integrates angular velocity', () => {
        const body = new Body()

        body.angularVelocity.set(0, Math.PI, 0)
        body.integrate(0.5)

        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(body.rotation)

        expect(forward.x).toBeCloseTo(1)
        expect(forward.y).toBeCloseTo(0)
        expect(forward.z).toBeCloseTo(0)
    })
})
