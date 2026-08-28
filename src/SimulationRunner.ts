import { Simulation } from './simulation/Simulation'

export class SimulationRunner {
    private readonly fixedDt: number

    private accumulator = 0
    private lastTime = performance.now()

    private paused = false
    private stepRequested = false

    constructor( private readonly simulation: Simulation, ticksPerSecond = 60) {
        this.fixedDt = 1 / ticksPerSecond
    }

    update(time: number): void {
        const frameDt = Math.min( (time - this.lastTime) / 1000, 0.1)

        this.lastTime = time

        if (!this.paused) {
            this.accumulator += frameDt

            while (this.accumulator >= this.fixedDt) {
                this.simulation.update(this.fixedDt)
                this.accumulator -= this.fixedDt
            }

            return
        }

        if (this.stepRequested) {
            this.simulation.update(this.fixedDt)
            this.stepRequested = false
        }
    }

    pause(): void { this.paused = true }

    resume(): void {
        this.paused = false
        this.lastTime = performance.now()
    }

    togglePause(): void {
        if (this.paused) {
            this.resume()
        } else {
            this.pause()
        }
    }

    step(): void {
        if (this.paused) {
            this.stepRequested = true
        }
    }

    resetTiming(): void {
        this.accumulator = 0
        this.lastTime = performance.now()
        this.stepRequested = false
    }

    isPaused(): boolean {
        return this.paused
    }
}
