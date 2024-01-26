import './style.css'

import * as THREE from 'three'
import CANNON from 'cannon'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'


 const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Constants
 */
const CAMERA_Y_DISTANCE = -10
const CAMERA_Z_DISTANCE = 13

/**
 * Textures
 */

 const textureLoader = new THREE.TextureLoader()
 const woodTexture = textureLoader.load('/textures/wood.jpg')
 woodTexture.repeat.set(2, 1)
 woodTexture.wrapS = THREE.RepeatWrapping;
 woodTexture.wrapT = THREE.RepeatWrapping;

 const blueMistTexture = textureLoader.load('/textures/blueMist.jpg')

/**
 * Renderer
 */
const canvas = document.querySelector('canvas.webgpl') as HTMLElement
const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 25
directionalLight.shadow.camera.left = -25
directionalLight.shadow.camera.top = 25
directionalLight.shadow.camera.right = 25
directionalLight.shadow.camera.bottom = -25
directionalLight.position.set(0, 0, 20)
scene.add(directionalLight)

/**
 * Meshes
 */

// Dice
const diceGeometry = new THREE.IcosahedronGeometry(1)
const diceMaterial = new THREE.MeshStandardMaterial({
  map: blueMistTexture,
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide,
  metalness: 0.2,
  roughness: 0.5,
})
const dice = new THREE.Mesh(diceGeometry, diceMaterial)
dice.castShadow = true
dice.position.set(0, 0, 10)
dice.up.set(0, 0, 1)
scene.add(dice)

// Dice Faces
const dicePositions = dice.geometry.attributes.position.array
const dicePoints = []
const uvs = new Float32Array([
  1.0, 0.0,
  0.5, 1.0,
  0.0, 0.0,
]);

const facesGroup = new THREE.Group()

for (let i = 0; i < dicePositions.length; i += 3) {
  dicePoints.push(
    new THREE.Vector3(dicePositions[i], dicePositions[i + 1], dicePositions[i + 2])
  )
}
for (let i = 0; i < dicePositions.length / 3; i += 3) {
  const faceNumber = i / 3 + 1
  const faceName = faceNumber.toString()
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")!
  canvas.width = canvas.height = 60
  context.font = '20pt arial'
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#000000";
  context.fillText(faceName, canvas.width / 2, canvas.height * 3 / 4)
  const numberedFaceTexture = new THREE.CanvasTexture(canvas)

  const material = new THREE.MeshBasicMaterial({ map: numberedFaceTexture })
  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints([dicePoints[i], dicePoints[i + 1], dicePoints[i + 2]])
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const faceMesh = new THREE.Mesh(geometry, material)
  faceMesh.name = faceName
  facesGroup.add(faceMesh)
}
dice.add(facesGroup)

// Table
const tableGeometry = new THREE.PlaneGeometry(50, 50)
const tableMaterial = new THREE.MeshStandardMaterial({
  map: woodTexture,
  metalness: 0.2,
  roughness: 0.5,
})
const table = new THREE.Mesh(tableGeometry, tableMaterial)
table.receiveShadow = true
scene.add(table)

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, CAMERA_Y_DISTANCE, CAMERA_Z_DISTANCE)
camera.up.set(0, 0, 1)
scene.add(camera)

/** 
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true


/**
 * Physics (CANNON)
 */

// CANNON World
const world = new CANNON.World()
world.gravity.set(0, 0, -9.81)

// CANNON Materials
const defaultCannonMaterial = new CANNON.Material('default')
const defaultCannonContactMaterial = new CANNON.ContactMaterial(
    defaultCannonMaterial,
    defaultCannonMaterial,
    {
        friction: 0.2,
        restitution: 0.6
    }
)
world.addContactMaterial(defaultCannonContactMaterial)
world.defaultContactMaterial = defaultCannonContactMaterial

// CANNON Icosahedron
const icosahedronPoints = []
for (let i = 0; i < dicePositions.length; i += 3) {
  icosahedronPoints.push(
    new CANNON.Vec3(dicePositions[i], dicePositions[i + 1], dicePositions[i + 2])
  )
}
const icosahedronFaces = []
for (let i = 0; i < dicePositions.length / 3; i += 3) {
    icosahedronFaces.push([i, i + 1, i + 2])
}
const icosahedronShape = new CANNON.ConvexPolyhedron(
  icosahedronPoints,
  icosahedronFaces
)
const icosahedronBody = new CANNON.Body({ mass: 1 })
icosahedronBody.addShape(icosahedronShape)
icosahedronBody.position.x = dice.position.x
icosahedronBody.position.y = dice.position.y
icosahedronBody.position.z = dice.position.z
icosahedronBody.applyLocalForce(
  new CANNON.Vec3(Math.random() * 20, Math.random() * 20, 0),
  icosahedronBody.position
)
world.addBody(icosahedronBody)


// Table
const tableShape = new CANNON.Plane()
const tableBody = new CANNON.Body({ shape: tableShape })
world.addBody(tableBody)


window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0
let previousRotation = new CANNON.Quaternion
let previousPositionCount = 0

const areRotationsAlmostEqual = (vector1: CANNON.Quaternion, vector2: CANNON.Quaternion, precision = 0.001): boolean => {
  const isXInsidePrecision = vector1.x - vector2.x < precision
  const isYInsidePrecision = vector1.y - vector2.y < precision
  const isZInsidePrecision = vector1.z - vector2.z < precision
  const isWInsidePrecision = vector1.w - vector2.w < precision
  return isXInsidePrecision && isYInsidePrecision && isZInsidePrecision && isWInsidePrecision
}

const update = () => {
      // Update controls
      controls.update()
      
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - oldElapsedTime
      oldElapsedTime = elapsedTime
  
      // Update physics world
      world.step(1 / 60, deltaTime, 3)
      dice.position.copy(
        new THREE.Vector3(
          icosahedronBody.position.x, 
          icosahedronBody.position.y, 
          icosahedronBody.position.z
        )
      )
      dice.quaternion.copy(
        new THREE.Quaternion(
          icosahedronBody.quaternion.x,
          icosahedronBody.quaternion.y,
          icosahedronBody.quaternion.z,
          icosahedronBody.quaternion.w,
        )
      )

      // Update camera to follow the dice
      camera.position.set(
        icosahedronBody.position.x,
        icosahedronBody.position.y - CAMERA_Y_DISTANCE,
        CAMERA_Z_DISTANCE
      )
      camera.lookAt(dice.position)

      // Check if dice stopped
      if (areRotationsAlmostEqual(previousRotation, icosahedronBody.quaternion)) {
        previousPositionCount++
      } else {
        previousRotation.copy(icosahedronBody.quaternion)
        previousPositionCount = 0
      }

      const hasDiceStopped = previousPositionCount > 100

      if (hasDiceStopped) {
        const rayCasterOrigin = new THREE.Vector3(dice.position.x, dice.position.y, 15)
        const rayCasterDirection = new THREE.Vector3(0, 0, -1)
        const raycaster = new THREE.Raycaster(rayCasterOrigin, rayCasterDirection)

        const intersects = raycaster.intersectObjects(facesGroup.children)
        const resultTextHtml = document.getElementById('result-text') as HTMLElement
        resultTextHtml.innerText = `Result: ${intersects[0].object.name}`

      }

      // Render
      renderer.render(scene, camera)
  
      // Call tick again on the next frame
      window.requestAnimationFrame(update)
}

update()