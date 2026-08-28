import * as THREE from 'three'

export enum FaceId {
    PositiveX,
    NegativeX,
    PositiveY,
    NegativeY,
    PositiveZ,
    NegativeZ
}

export interface Face {
    id: FaceId

    localNormal: THREE.Vector3
    localCenter: THREE.Vector3

    color: number
    connected: boolean
}

export const FACE_COLORS = {
    positiveX: 0xff4444,
    negativeX: 0x44ff44,

    positiveY: 0x4488ff,
    negativeY: 0xffff44,

    positiveZ: 0xff44ff,
    negativeZ: 0x44ffff
}