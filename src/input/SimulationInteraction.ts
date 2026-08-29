import * as THREE from 'three'

import type { Body } from '../simulation/Body'
import type { Simulation } from '../simulation/Simulation'
import type { SimulationRenderer } from '../rendering/SimulationRenderer'

export class SimulationInteraction {
    private static readonly MAX_PICK_DISTANCE = 100

    private readonly raycaster = new THREE.Raycaster()
    private readonly pointer = new THREE.Vector2()
    private readonly dragPlane = new THREE.Plane()

    private grabbedBody: Body | null = null

    private readonly grabLocalPoint = new THREE.Vector3()

    private readonly tempInverseRotation = new THREE.Quaternion()
    private readonly tempOffset = new THREE.Vector3()
    private readonly tempWorldPoint = new THREE.Vector3()
    private readonly tempPlaneNormal = new THREE.Vector3()
    private readonly grabbedPosition = new THREE.Vector3()
    private readonly grabbedRotation = new THREE.Quaternion()

    constructor(
        private readonly simulation: Simulation,
        private readonly renderer: SimulationRenderer
    ) {
        const canvas = renderer.getCanvas()

        canvas.addEventListener('mousedown', this.onMouseDown)
        window.addEventListener('mousemove', this.onMouseMove)
        window.addEventListener('mouseup', this.onMouseUp)
    }

    update(): void {
        if (!this.grabbedBody) return

        this.grabbedBody.rotation.copy(this.grabbedRotation)
    }
    
    private onMouseDown = (event: MouseEvent): void => {
        if (event.button !== 0) return

        this.updatePointer(event)

        const hit = this.pickCube()

        if (!hit || hit.instanceId === undefined) {
            this.simulation.spawnCube()
            return
        }

        const body = this.renderer.getCubeBody(hit.instanceId)
        if (!body) return

        this.grabbedBody = body

        this.grabbedPosition.copy(body.position)
        this.grabbedRotation.copy(body.rotation)

        this.tempInverseRotation.copy(body.rotation).invert()

        this.grabLocalPoint
            .copy(hit.point)
            .sub(body.position)
            .applyQuaternion(this.tempInverseRotation)

        this.renderer.getCamera().getWorldDirection(this.tempPlaneNormal)
        this.dragPlane.setFromNormalAndCoplanarPoint(this.tempPlaneNormal, hit.point)

        this.simulation.setBodyGrabbed(body, true)
    }

    private onMouseMove = (event: MouseEvent): void => {
        if (!this.grabbedBody) return

        this.updatePointer(event)
        this.updateGrabbedBody()
    }

    private onMouseUp = (event: MouseEvent): void => {
        if (event.button !== 0 || !this.grabbedBody) return

        this.simulation.setBodyGrabbed(this.grabbedBody, false)
        this.grabbedBody = null
    }

    private updateGrabbedBody(): void {
        const body = this.grabbedBody
        if (!body) return

        this.raycaster.setFromCamera(this.pointer, this.renderer.getCamera())

        const intersection = this.raycaster.ray.intersectPlane(this.dragPlane, this.tempWorldPoint)
        if (!intersection) return

        this.tempOffset.copy(this.grabLocalPoint).applyQuaternion(body.rotation)

        body.position
            .copy(this.tempWorldPoint)
            .sub(this.tempOffset)

        this.clampBodyToWorld(body)
    }

    private clampBodyToWorld(body: Body): void {
        const limit = Math.max(0, this.simulation.worldExtent - body.boundingRadius)

        body.position.x = THREE.MathUtils.clamp(body.position.x, -limit, limit)
        body.position.y = THREE.MathUtils.clamp(body.position.y, -limit, limit)
        body.position.z = THREE.MathUtils.clamp(body.position.z, -limit, limit)
    }

    private pickCube(): THREE.Intersection | null {
        this.raycaster.setFromCamera(this.pointer, this.renderer.getCamera())

        this.raycaster.near = 0
        this.raycaster.far = Math.min(
            SimulationInteraction.MAX_PICK_DISTANCE,
            this.simulation.worldExtent * 2
        )

        const hits = this.raycaster.intersectObject(this.renderer.getCubeMesh(), false)

        return hits.length > 0 ? hits[0] : null
    }

    private updatePointer(event: MouseEvent): void {
        const rect = this.renderer.getCanvas().getBoundingClientRect()

        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }
}