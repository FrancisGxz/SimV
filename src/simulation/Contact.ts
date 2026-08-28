import type { Body } from './Body'
import type { Cube } from './Cube'
import type { Face } from './Face'
import * as THREE from 'three'

export interface Contact {
    firstBody: Body
    secondBody: Body

    firstCube: Cube
    secondCube: Cube

    firstFace: Face | null
    secondFace: Face | null

    normal: THREE.Vector3
    penetration: number
}
