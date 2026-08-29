import { describe, expect, test } from 'vitest'

import { Body } from '../src/simulation/Body'
import { Cube } from '../src/simulation/Cube'
import { SpatialGrid } from '../src/simulation/SpatialGrid'

describe('SpatialGrid', () => {
    test('produces nearby cube pairs', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

        first.addCube(new Cube())
        second.addCube(new Cube())

        first.position.set(0, 0, 0)
        second.position.set(1, 0, 0)

        grid.rebuild([first, second])

        const pairs: string[] = []

        for (let batch = 0; batch < 4; batch++) {
            grid.processBatch(batch, 4, (firstBody, _firstCube, secondBody) => {
                pairs.push(`${firstBody.id}:${secondBody.id}`)
            })
        }

        expect(pairs).toHaveLength(1)
    })

    test('does not produce pairs for distant cubes', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

        first.addCube(new Cube())
        second.addCube(new Cube())

        first.position.set(0, 0, 0)
        second.position.set(20, 0, 0)

        grid.rebuild([first, second])

        let pairCount = 0

        for (let batch = 0; batch < 4; batch++) {
            grid.processBatch(batch, 4, () => {
                pairCount++
            })
        }

        expect(pairCount).toBe(0)
    })

    test('does not produce the same cube pair twice', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

        first.addCube(new Cube())
        second.addCube(new Cube())

        first.position.set(0, 0, 0)
        second.position.set(1, 0, 0)

        grid.rebuild([first, second])

        let pairCount = 0

        for (let batch = 0; batch < 4; batch++) {
            grid.processBatch(batch, 4, () => {
                pairCount++
            })
        }

        expect(pairCount).toBe(1)
    })

    test('large molecules only produce nearby cube pairs', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

        first.addCube(new Cube())
        first.addCube(new Cube())
        second.addCube(new Cube())

        first.cubes[0].localPosition.set(0, 0, 0)
        first.cubes[1].localPosition.set(20, 0, 0)
        second.cubes[0].localPosition.set(21, 0, 0)

        first.recomputeMassProperties()
        second.recomputeMassProperties()

        grid.rebuild([first, second])

        let pairCount = 0

        for (let batch = 0; batch < 4; batch++) {
            grid.processBatch(batch, 4, () => {
                pairCount++
            })
        }

        expect(pairCount).toBe(1)
    })
})