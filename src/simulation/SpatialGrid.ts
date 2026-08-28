import { Body } from './Body'

interface GridCell {
    x: number
    y: number
    z: number
    bodies: Body[]
}

export type CandidatePairCallback = (first: Body, second: Body) => void

export class SpatialGrid {
    private readonly cells = new Map<string, GridCell>()
    private readonly processedPairs = new Set<string>()

    private static readonly forwardNeighbors = [
        [0, 0, 1],

        [0, 1, -1],
        [0, 1, 0],
        [0, 1, 1],

        [1, -1, -1],
        [1, -1, 0],
        [1, -1, 1],

        [1, 0, -1],
        [1, 0, 0],
        [1, 0, 1],

        [1, 1, -1],
        [1, 1, 0],
        [1, 1, 1]
    ] as const

    constructor(public readonly cellSize: number) {}

    rebuild(bodies: readonly Body[]): void {
        this.cells.clear()
        this.processedPairs.clear()

        for (const body of bodies) {
            const radius = body.boundingRadius

            const minX = Math.floor((body.position.x - radius) / this.cellSize)
            const maxX = Math.floor((body.position.x + radius) / this.cellSize)
            const minY = Math.floor((body.position.y - radius) / this.cellSize)
            const maxY = Math.floor((body.position.y + radius) / this.cellSize)
            const minZ = Math.floor((body.position.z - radius) / this.cellSize)
            const maxZ = Math.floor((body.position.z + radius) / this.cellSize)

            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const key = this.makeKey(x, y, z)

                        let cell = this.cells.get(key)

                        if (!cell) {
                            cell = { x, y, z, bodies: [] }
                            this.cells.set(key, cell)
                        }

                        cell.bodies.push(body)
                    }
                }
            }
        }
    }

    processBatch(batchIndex: number, batchCount: number, callback: CandidatePairCallback): void {
        for (const cell of this.cells.values()) {
            if (this.getBatchIndex(cell.x, cell.y, cell.z, batchCount) !== batchIndex) continue

            this.processInternalPairs(cell, callback)
            this.processNeighborPairs(cell, callback)
        }
    }

    private processInternalPairs(cell: GridCell, callback: CandidatePairCallback): void {
        const bodies = cell.bodies

        for (let i = 0; i < bodies.length; ++i) {
            for (let j = i + 1; j < bodies.length; ++j) {
                this.processPair(bodies[i], bodies[j], callback)
            }
        }
    }

    private processNeighborPairs(cell: GridCell, callback: CandidatePairCallback): void {
        for (const offset of SpatialGrid.forwardNeighbors) {
            const neighbor = this.cells.get(
                this.makeKey(cell.x + offset[0], cell.y + offset[1], cell.z + offset[2])
            )

            if (!neighbor) continue

            for (const first of cell.bodies) {
                for (const second of neighbor.bodies) {
                    this.processPair(first, second, callback)
                }
            }
        }
    }

    private processPair(first: Body, second: Body, callback: CandidatePairCallback): void {
        if (first === second) return

        const firstId = Math.min(first.id, second.id)
        const secondId = Math.max(first.id, second.id)
        const key = `${firstId}:${secondId}`

        if (this.processedPairs.has(key)) return

        this.processedPairs.add(key)
        callback(first, second)
    }

    private getBatchIndex(x: number, y: number, z: number, batchCount: number): number {
        const hash = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)
        return ((hash % batchCount) + batchCount) % batchCount
    }

    private makeKey(x: number, y: number, z: number): string {
        return `${x},${y},${z}`
    }
}