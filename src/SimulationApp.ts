import { Simulation } from './simulation/Simulation'
import { SimulationRenderer } from './rendering/SimulationRenderer'
import { SimulationRunner } from './SimulationRunner'
import { CameraController } from './input/CameraController'
import { StatsPanel } from './ui/StatsPanel'

export class SimulationApp {
    private readonly simulation: Simulation
    private readonly renderer: SimulationRenderer
    private readonly runner: SimulationRunner
    private readonly cameraController: CameraController
    private readonly statsPanel: StatsPanel

    private lastFrameTime = performance.now()
    private animationFrameId: number | null = null

    constructor(private readonly container: HTMLElement) {
        this.simulation = new Simulation()
        this.renderer = new SimulationRenderer(this.container)

        this.runner = new SimulationRunner(
            this.simulation,
            60
        )

        this.cameraController = new CameraController(
            this.renderer.getCamera(),
            this.renderer.getCanvas()
        )

        this.statsPanel = new StatsPanel(this.container)
    }

    start(): void {
        if (this.animationFrameId !== null) {
            return
        }

        this.lastFrameTime = performance.now()
        this.animationFrameId = requestAnimationFrame(this.frame)
    }

    stop(): void {
        if (this.animationFrameId === null) {
            return
        }

        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
    }

    private frame = (time: number): void => {
        const frameDt = Math.min( (time - this.lastFrameTime) / 1000, 0.1)

        this.lastFrameTime = time

        this.runner.update(time)
        this.cameraController.update(frameDt)

        this.renderer.sync(this.simulation)
        this.renderer.render()

        this.statsPanel.update(time, this.simulation)
        this.animationFrameId = requestAnimationFrame(this.frame)
    }
}
