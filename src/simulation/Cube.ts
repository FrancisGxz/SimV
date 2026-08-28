import * as THREE from 'three'

import type { Face } from './Face'
import { FaceId, FACE_COLORS } from './Face'

import type { Body } from './Body'

export class Cube {
    public readonly localPosition = new THREE.Vector3()
    public readonly localRotation = new THREE.Quaternion()
    public readonly scale = new THREE.Vector3(1, 1, 1)

    public readonly faces: Face[]

    constructor( localPosition?: THREE.Vector3, localRotation?: THREE.Quaternion) {
        if (localPosition) {
            this.localPosition.copy(localPosition)
        }

        if (localRotation) {
            this.localRotation.copy(localRotation)
        }

        this.faces = [
            {
                id: FaceId.PositiveX,
                localNormal: new THREE.Vector3(1, 0, 0),
                localCenter: new THREE.Vector3(0.5, 0, 0),
                color: FACE_COLORS.positiveX,
                connected: false
            },
            {
                id: FaceId.NegativeX,
                localNormal: new THREE.Vector3(-1, 0, 0),
                localCenter: new THREE.Vector3(-0.5, 0, 0),
                color: FACE_COLORS.negativeX,
                connected: false
            },
            {
                id: FaceId.PositiveY,
                localNormal: new THREE.Vector3(0, 1, 0),
                localCenter: new THREE.Vector3(0, 0.5, 0),
                color: FACE_COLORS.positiveY,
                connected: false
            },
            {
                id: FaceId.NegativeY,
                localNormal: new THREE.Vector3(0, -1, 0),
                localCenter: new THREE.Vector3(0, -0.5, 0),
                color: FACE_COLORS.negativeY,
                connected: false
            },
            {
                id: FaceId.PositiveZ,
                localNormal: new THREE.Vector3(0, 0, 1),
                localCenter: new THREE.Vector3(0, 0, 0.5),
                color: FACE_COLORS.positiveZ,
                connected: false
            },
            {
                id: FaceId.NegativeZ,
                localNormal: new THREE.Vector3(0, 0, -1),
                localCenter: new THREE.Vector3(0, 0, -0.5),
                color: FACE_COLORS.negativeZ,
                connected: false
            }
        ]
    }

    getWorldPosition(body: Body, target: THREE.Vector3): THREE.Vector3 {
        return target.copy(this.localPosition).applyQuaternion(body.rotation).add(body.position)
    }

    getWorldRotation(body: Body, target: THREE.Quaternion): THREE.Quaternion {
        return target.copy(body.rotation).multiply(this.localRotation)
    }

    getWorldFaceNormal( body: Body, face: Face, target: THREE.Vector3, tempRotation: THREE.Quaternion): THREE.Vector3 {
        this.getWorldRotation(body, tempRotation)

        return target
            .copy(face.localNormal)
            .applyQuaternion(tempRotation)
            .normalize()
    }

    getWorldFaceCenter( body: Body, face: Face, target: THREE.Vector3): THREE.Vector3 {
        return target
            .copy(face.localCenter)
            .applyQuaternion(this.localRotation)
            .add(this.localPosition)
            .applyQuaternion(body.rotation)
            .add(body.position)
    }
}
