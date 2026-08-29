import * as THREE from 'three'

import type { Body } from './Body'
import type { Cube } from './Cube'

interface GridEntry {
    body: Body
    cube: Cube
    gridId: number
}

interface GridCell {
    x: number
    y: number
    z: number
    entries: GridEntry[]
    forwardNeighbors: GridCell[]
}

export type CandidatePairCallback = (
    firstBody: Body,
    firstCube: Cube,
    secondBody: Body,
    secondCube: Cube
) => void

export class SpatialGrid {
    private static readonly BATCH_COUNT = 4
    private static readonly MAX_GRID_ENTRIES = 65536
    private static readonly CUBE_RADIUS = Math.sqrt(3) * 0.5

    private static readonly KEY_OFFSET = 1024
    private static readonly KEY_SIZE = 2048

    private readonly cells = new Map<number, GridCell>()
    private readonly batchCells: GridCell[][] = Array.from(
        { length: SpatialGrid.BATCH_COUNT },
        () => []
    )
    private readonly processedPairs = new Set<number>()

    private static readonly tempPosition = new THREE.Vector3()

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

        for (const batch of this.batchCells) {
            batch.length = 0
        }

        let gridId = 0

        for (const body of bodies) {
            if (body.grabbed) continue

            for (const cube of body.cubes) {
                cube.getWorldPosition(body, SpatialGrid.tempPosition)

                const radius = SpatialGrid.CUBE_RADIUS

                const minX = Math.floor((SpatialGrid.tempPosition.x - radius) / this.cellSize)
                const maxX = Math.floor((SpatialGrid.tempPosition.x + radius) / this.cellSize)
                const minY = Math.floor((SpatialGrid.tempPosition.y - radius) / this.cellSize)
                const maxY = Math.floor((SpatialGrid.tempPosition.y + radius) / this.cellSize)
                const minZ = Math.floor((SpatialGrid.tempPosition.z - radius) / this.cellSize)
                const maxZ = Math.floor((SpatialGrid.tempPosition.z + radius) / this.cellSize)

                const entry: GridEntry = {
                    body,
                    cube,
                    gridId: gridId++
                }

                for (let x = minX; x <= maxX; x++) {
                    for (let y = minY; y <= maxY; y++) {
                        for (let z = minZ; z <= maxZ; z++) {
                            const key = this.makeKey(x, y, z)
                            let cell = this.cells.get(key)

                            if (!cell) {
                                cell = {
                                    x,
                                    y,
                                    z,
                                    entries: [],
                                    forwardNeighbors: []
                                }

                                this.cells.set(key, cell)
                            }

                            cell.entries.push(entry)
                        }
                    }
                }
            }
        }

        this.buildBatchCells()
        this.buildNeighbors()
    }

    processBatch(batchIndex: number, batchCount: number, callback: CandidatePairCallback): void {
        if (batchCount !== SpatialGrid.BATCH_COUNT) {
            throw new Error(`SpatialGrid expects ${SpatialGrid.BATCH_COUNT} batches`)
        }

        for (const cell of this.batchCells[batchIndex]) {
            this.processInternalPairs(cell, callback)
            this.processNeighborPairs(cell, callback)
        }
    }

    private buildBatchCells(): void {
        for (const cell of this.cells.values()) {
            const batchIndex = this.getBatchIndex(
                cell.x,
                cell.y,
                cell.z,
                SpatialGrid.BATCH_COUNT
            )

            this.batchCells[batchIndex].push(cell)
        }
    }

    private buildNeighbors(): void {
        for (const cell of this.cells.values()) {
            cell.forwardNeighbors.length = 0

            for (const offset of SpatialGrid.forwardNeighbors) {
                const neighbor = this.cells.get(
                    this.makeKey(
                        cell.x + offset[0],
                        cell.y + offset[1],
                        cell.z + offset[2]
                    )
                )

                if (neighbor) {
                    cell.forwardNeighbors.push(neighbor)
                }
            }
        }
    }

    private processInternalPairs(cell: GridCell, callback: CandidatePairCallback): void {
        const entries = cell.entries

        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                this.processPair(entries[i], entries[j], callback)
            }
        }
    }

    private processNeighborPairs(cell: GridCell, callback: CandidatePairCallback): void {
        for (const neighbor of cell.forwardNeighbors) {
            for (const first of cell.entries) {
                for (const second of neighbor.entries) {
                    this.processPair(first, second, callback)
                }
            }
        }
    }

    private processPair(
        first: GridEntry,
        second: GridEntry,
        callback: CandidatePairCallback
    ): void {
        if (first.body === second.body) return

        const minId = first.gridId < second.gridId ? first.gridId : second.gridId
        const maxId = first.gridId < second.gridId ? second.gridId : first.gridId
        const key = minId * SpatialGrid.MAX_GRID_ENTRIES + maxId

        if (this.processedPairs.has(key)) return

        this.processedPairs.add(key)
        callback(first.body, first.cube, second.body, second.cube)
    }

    private getBatchIndex(x: number, y: number, z: number, batchCount: number): number {
        const hash = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)
        return ((hash % batchCount) + batchCount) % batchCount
    }

    private makeKey(x: number, y: number, z: number): number {
        const offset = SpatialGrid.KEY_OFFSET
        const size = SpatialGrid.KEY_SIZE

        return (x + offset) * size * size +
            (y + offset) * size +
            (z + offset)
    }
}