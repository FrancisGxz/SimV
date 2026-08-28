import { Body } from './Body'
import { SpatialGrid } from './SpatialGrid'

export class CollisionSystem {
    public lastCandidateCount = 0
    public lastPotentialCollisionCount = 0

    processBatch(grid: SpatialGrid, batchIndex: number, batchCount: number): void {
        this.lastCandidateCount = 0
        this.lastPotentialCollisionCount = 0

        grid.processBatch(batchIndex, batchCount, this.processCandidate)
    }

    private processCandidate = (a: Body, b: Body): void => {
        this.lastCandidateCount++

        if (!this.boundingSpheresOverlap(a, b)) {
            return
        }

        this.lastPotentialCollisionCount++
    }

    private boundingSpheresOverlap(a: Body, b: Body): boolean {
        const dx = a.position.x - b.position.x
        const dy = a.position.y - b.position.y
        const dz = a.position.z - b.position.z

        const radius = a.boundingRadius + b.boundingRadius

        return ( dx * dx + dy * dy + dz * dz) <= radius * radius
    }
}
