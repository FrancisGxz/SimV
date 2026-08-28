import type { Simulation } from '../simulation/Simulation'
import type { SimulationRunner } from '../SimulationRunner'

export class SimulationControls {
    private readonly root: HTMLDivElement
    private readonly pauseButton: HTMLButtonElement

    constructor(
        container: HTMLElement,
        private readonly simulation: Simulation,
        private readonly runner: SimulationRunner
    ) {
        this.root = document.createElement('div')
        this.root.className = 'simulation-controls'

        this.root.innerHTML = `
            <label>
                World extent
                <input data-control="extent" type="number" min="5" step="5"
                    value="${simulation.worldExtent}">
            </label>

            <label>
                Initial count
                <input data-control="count" type="number" min="1" max="5000" step="1"
                    value="${simulation.initialCubeCount}">
            </label>

            <label>
                Min speed
                <input data-control="min-speed" type="number" min="0" step="0.1"
                    value="${simulation.minInitialSpeed}">
            </label>

            <label>
                Max speed
                <input data-control="max-speed" type="number" min="0" step="0.1"
                    value="${simulation.maxInitialSpeed}">
            </label>

            <label>
                Min spin
                <input data-control="min-spin" type="number" step="0.1"
                    value="${simulation.minInitialSpin}">
            </label>

            <label>
                Max spin
                <input data-control="max-spin" type="number" step="0.1"
                    value="${simulation.maxInitialSpin}">
            </label>

            <div class="simulation-controls-buttons">
                <button data-action="reset">Reset</button>
                <button data-action="pause">Pause</button>
                <button data-action="step">Next Frame</button>
            </div>
        `

        container.appendChild(this.root)

        this.pauseButton = this.getButton('pause')

        this.getButton('reset').addEventListener('click', this.reset)
        this.pauseButton.addEventListener('click', this.togglePause)
        this.getButton('step').addEventListener('click', this.step)
    }

    private reset = (): void => {
        const worldExtent = this.getNumber('extent')
        const initialCubeCount = Math.floor(this.getNumber('count'))
        const minInitialSpeed = this.getNumber('min-speed')
        const maxInitialSpeed = this.getNumber('max-speed')
        const minInitialSpin = this.getNumber('min-spin')
        const maxInitialSpin = this.getNumber('max-spin')

        this.simulation.worldExtent = Math.max(5, worldExtent)
        this.simulation.initialCubeCount = Math.max(1, Math.min(5000, initialCubeCount))

        this.simulation.minInitialSpeed = Math.min(minInitialSpeed, maxInitialSpeed)
        this.simulation.maxInitialSpeed = Math.max(minInitialSpeed, maxInitialSpeed)

        this.simulation.minInitialSpin = Math.min(minInitialSpin, maxInitialSpin)
        this.simulation.maxInitialSpin = Math.max(minInitialSpin, maxInitialSpin)

        this.simulation.reset()
        this.runner.resetTiming()
    }

    private togglePause = (): void => {
        this.runner.togglePause()
        this.updatePauseButton()
    }

    private step = (): void => {
        if (!this.runner.isPaused()) {
            this.runner.pause()
            this.updatePauseButton()
        }

        this.runner.step()
    }

    private updatePauseButton(): void {
        this.pauseButton.textContent = this.runner.isPaused() ? 'Resume' : 'Pause'
    }

    private getNumber(name: string): number {
        const input = this.root.querySelector<HTMLInputElement>(`[data-control="${name}"]`)
        return Number(input?.value ?? 0)
    }

    private getButton(action: string): HTMLButtonElement {
        return this.root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!
    }
}