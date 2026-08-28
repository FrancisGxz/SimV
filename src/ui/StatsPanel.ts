import { Simulation } from '../simulation/Simulation'

export class StatsPanel {
    private readonly element: HTMLDivElement

    private frameCount = 0
    private lastFpsUpdate = performance.now()
    private fps = 0

    constructor(container: HTMLElement) {
        this.element = document.createElement('div')
        this.element.className = 'stats-panel'

        container.appendChild(this.element)
    }

    update(time: number, simulation: Simulation): void {
        this.frameCount++

        const elapsed = time - this.lastFpsUpdate

        if (elapsed >= 500) {
            this.fps = this.frameCount * 1000 / elapsed

            this.frameCount = 0
            this.lastFpsUpdate = time
        }

        this.element.innerHTML = `
            <div class="stats-title">Simulation</div>
            <div class="stats-row">
                <span>FPS</span>
                <span>${this.fps.toFixed(0)}</span>
            </div>
            <div class="stats-row">
                <span>Bodies</span>
                <span>${simulation.bodies.length}</span>
            </div>
            <div class="stats-row">
                <span>Cubes</span>
                <span>${simulation.getCubeCount()}</span>
            </div>
            <div class="stats-row">
                <span>Candidates</span>
                <span>${simulation.getLastCandidateCount()}</span>
            </div>
            <div class="stats-row">
                <span>Potential</span>
                <span>${simulation.getLastPotentialCollisionCount()}</span>
            </div>
            <div class="stats-row">
                <span>Tick</span>
                <span>${simulation.tick}</span>
            </div>
            <div class="stats-row">
                <span>Batch</span>
                <span>${simulation.getCollisionBatchIndex()}</span>
            </div>
        `
    }
}
