import * as THREE from 'three'
import { describe, expect, test } from 'vitest'

import { Body } from '../src/simulation/Body'
import { Cube } from '../src/simulation/Cube'
import { FaceId } from '../src/simulation/Face'

describe('Cube', () => {
    test('calculates world position from body transform', () => {
        const body = new Body()
        const cube = new Cube()

        body.position.set(10, 0, 0)
        cube.localPosition.set(2, 0, 0)

        const position = cube.getWorldPosition(body, new THREE.Vector3())

        expect(position.x).toBeCloseTo(12)
        expect(position.y).toBeCloseTo(0)
        expect(position.z).toBeCloseTo(0)
    })

    test('calculates world face normal', () => {
        const body = new Body()
        const cube = new Cube()

        body.rotation.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            Math.PI / 2
        )

        const face = cube.faces.find(face => face.id === FaceId.PositiveX)!

        const normal = cube.getWorldFaceNormal(
            body,
            face,
            new THREE.Vector3(),
            new THREE.Quaternion()
        )

        expect(normal.x).toBeCloseTo(0)
        expect(normal.y).toBeCloseTo(0)
        expect(normal.z).toBeCloseTo(-1)
    })

    test('defines six faces', () => {
        const cube = new Cube()

        expect(cube.faces).toHaveLength(6)
    })
})