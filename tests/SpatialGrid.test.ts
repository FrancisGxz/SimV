import { describe, expect, test } from 'vitest'

import { Body } from '../src/simulation/Body'
import { SpatialGrid } from '../src/simulation/SpatialGrid'

describe('SpatialGrid', () => {
    test('produces nearby body pairs', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

        first.position.set(0, 0, 0)
        second.position.set(1, 0, 0)

        grid.rebuild([first, second])

        const pairs: string[] = []

        for (let batch = 0; batch < 4; batch++) {
            grid.processBatch(batch, 4, (firstBody, secondBody) => {
                pairs.push(`${firstBody.id}:${secondBody.id}`)
            })
        }

        expect(pairs).toHaveLength(1)
    })

    test('does not produce pairs for distant bodies', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

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

    test('does not produce the same pair twice', () => {
        const grid = new SpatialGrid(2)

        const first = new Body()
        const second = new Body()

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
})