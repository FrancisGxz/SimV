import * as THREE from 'three'

import { Simulation } from '../simulation/Simulation'
import type { Body } from '../simulation/Body'
import type { Cube } from '../simulation/Cube'

const MAX_CUBES = 5000
const NORMALS_PER_CUBE = 6
const MAX_NORMALS = MAX_CUBES * NORMALS_PER_CUBE

const NORMAL_LENGTH = 0.4
const NORMAL_RADIUS = 0.015

export class SimulationRenderer {
    private readonly scene = new THREE.Scene()

    private readonly camera: THREE.PerspectiveCamera
    private readonly renderer: THREE.WebGLRenderer

    private readonly cubes: THREE.InstancedMesh
    private readonly normals: THREE.InstancedMesh

    private readonly matrix = new THREE.Matrix4()
    private readonly position = new THREE.Vector3()
    private readonly rotation = new THREE.Quaternion()

    private readonly normal = new THREE.Vector3()
    private readonly faceCenter = new THREE.Vector3()
    private readonly normalPosition = new THREE.Vector3()
    private readonly normalRotation = new THREE.Quaternion()
    private readonly tempRotation = new THREE.Quaternion()

    private readonly normalScale = new THREE.Vector3(1, NORMAL_LENGTH, 1)
    private readonly cubeScale = new THREE.Vector3(1, 1, 1)
    private readonly cylinderUp = new THREE.Vector3(0, 1, 0)

    private readonly color = new THREE.Color()
    private readonly cubeInstanceBodies: Body[] = []
    private readonly cubeInstanceCubes: Cube[] = []

    constructor(container: HTMLElement) {
        this.scene.background = new THREE.Color(0x181818)

        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )

        this.camera.position.set(0, 0, 100)

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        })

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        container.appendChild(this.renderer.domElement)

        this.cubes = this.createCubeInstances()
        this.normals = this.createNormalInstances()

        this.scene.add(this.cubes)
        this.scene.add(this.normals)

        window.addEventListener('resize', this.onResize)
    }

    sync(simulation: Simulation): void {
        this.cubeInstanceBodies.length = 0
        this.cubeInstanceCubes.length = 0
        let cubeIndex = 0
        let normalIndex = 0

        outer:
        for (const body of simulation.bodies) {
            for (const cube of body.cubes) {
                if (cubeIndex >= MAX_CUBES) {
                    break outer
                }

                cube.getWorldPosition(body, this.position)
                cube.getWorldRotation(body, this.rotation)

                this.matrix.compose(this.position, this.rotation, this.cubeScale)
                this.cubes.setMatrixAt(cubeIndex, this.matrix)
                this.cubeInstanceBodies[cubeIndex] = body
                this.cubeInstanceCubes[cubeIndex] = cube

                for (const face of cube.faces) {
                    if (face.connected) continue

                    cube.getWorldFaceNormal(
                        body,
                        face,
                        this.normal,
                        this.tempRotation
                    )

                    cube.getWorldFaceCenter(body, face, this.faceCenter)

                    this.normalPosition
                        .copy(this.faceCenter)
                        .addScaledVector(this.normal, NORMAL_LENGTH * 0.5)

                    this.normalRotation.setFromUnitVectors(
                        this.cylinderUp,
                        this.normal
                    )

                    this.matrix.compose(
                        this.normalPosition,
                        this.normalRotation,
                        this.normalScale
                    )

                    this.normals.setMatrixAt(normalIndex, this.matrix)

                    this.color.setHex(face.color)
                    this.normals.setColorAt(normalIndex, this.color)

                    normalIndex++
                }

                cubeIndex++
            }
        }

        this.cubes.count = cubeIndex
        this.normals.count = normalIndex

        this.cubes.instanceMatrix.needsUpdate = true
        this.normals.instanceMatrix.needsUpdate = true

        if (this.normals.instanceColor) {
            this.normals.instanceColor.needsUpdate = true
        }
    }

    public render(): void { this.renderer.render(this.scene, this.camera) }
    public getCamera(): THREE.PerspectiveCamera { return this.camera }
    public getCanvas(): HTMLCanvasElement { return this.renderer.domElement }
    public getCubeMesh(): THREE.InstancedMesh { return this.cubes }
    public getCubeBody(instanceId: number): Body | null { return this.cubeInstanceBodies[instanceId] ?? null }
    public getCube(instanceId: number): Cube | null { return this.cubeInstanceCubes[instanceId] ?? null }

    private createCubeInstances(): THREE.InstancedMesh {
        const geometry = new THREE.BoxGeometry(1, 1, 1)

        const materials = [
            new THREE.MeshBasicMaterial({
                color: 0xff4444
            }),
            new THREE.MeshBasicMaterial({
                color: 0x44ff44
            }),
            new THREE.MeshBasicMaterial({
                color: 0x4488ff
            }),
            new THREE.MeshBasicMaterial({
                color: 0xffff44
            }),
            new THREE.MeshBasicMaterial({
                color: 0xff44ff
            }),
            new THREE.MeshBasicMaterial({
                color: 0x44ffff
            })
        ]

        const mesh = new THREE.InstancedMesh(
            geometry,
            materials,
            MAX_CUBES
        )

        mesh.count = 0
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

        return mesh
    }

    private createNormalInstances(): THREE.InstancedMesh {
        const geometry = new THREE.CylinderGeometry(
            NORMAL_RADIUS,
            NORMAL_RADIUS,
            1,
            6
        )

        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff
        })

        const mesh = new THREE.InstancedMesh(
            geometry,
            material,
            MAX_NORMALS
        )

        mesh.count = 0
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

        return mesh
    }

    private onResize = (): void => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
}
