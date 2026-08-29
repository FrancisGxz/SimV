import { describe, expect, test } from 'vitest'

import { Simulation } from '../src/simulation/Simulation'

describe('Simulation', () => {
    test('spawns a cube', () => {
        const simulation = new Simulation()
        simulation.reset(0)

        simulation.spawnCube()

        expect(simulation.bodies).toHaveLength(1)
        expect(simulation.getCubeCount()).toBe(1)
    })

    test('resets to requested cube count', () => {
        const simulation = new Simulation()

        simulation.reset(10)

        expect(simulation.bodies).toHaveLength(10)
        expect(simulation.getCubeCount()).toBe(10)
        expect(simulation.tick).toBe(0)
    })

    test('keeps bodies inside world bounds', () => {
        const simulation = new Simulation()
        simulation.reset(0)

        const body = simulation.spawnCube()

        body.position.set(simulation.worldExtent - 0.1, 0, 0)
        body.linearVelocity.set(10, 0, 0)

        simulation.update(1)

        expect(body.position.x).toBeLessThanOrEqual(
            simulation.worldExtent - body.boundingRadius
        )

        expect(body.linearVelocity.x).toBeLessThan(0)
    })
})