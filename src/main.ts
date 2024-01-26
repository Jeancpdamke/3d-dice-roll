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
const CAMERA_Z_DISTANCE = 15

/**
 * Textures
 */

 const textureLoader = new THREE.TextureLoader()
 const woodTexture = textureLoader.load('/textures/wood.jpg')
 const blueMistTexture = textureLoader.load('/textures/blueMist.jpg')

/**
 * Renderer
 */
const canvas = document.querySelector('canvas.webgpl') as HTMLElement
const scene = new THREE.Scene()

const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Meshes
 */

// Dice
const diceGeometry = new THREE.IcosahedronGeometry(1)
const diceMaterial = new THREE.MeshBasicMaterial({ map: blueMistTexture })
const dice = new THREE.Mesh(diceGeometry, diceMaterial)
dice.position.set(0, 0, 10)
dice.up.set(0, 0, 1)
diceGeometry.rotateY((Math.random() - Math.PI) * Math.PI)
scene.add(dice)

// Table
const tableGeometry = new THREE.PlaneGeometry(30, 30)
const tableMaterial = new THREE.MeshBasicMaterial({ map: woodTexture })
const table = new THREE.Mesh(tableGeometry, tableMaterial)
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
        restitution: 0.7
    }
)
world.addContactMaterial(defaultCannonContactMaterial)
world.defaultContactMaterial = defaultCannonContactMaterial

// CANNON Icosahedron
const positions = dice.geometry.attributes.position.array
const icosahedronPoints = []
for (let i = 0; i < positions.length; i += 3) {
  icosahedronPoints.push(
    new CANNON.Vec3(positions[i], positions[i + 1], positions[i + 2])
  )
}
const icosahedronFaces = []
for (let i = 0; i < positions.length / 3; i += 3) {
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

      // Render
      renderer.render(scene, camera)
  
      // Call tick again on the next frame
      window.requestAnimationFrame(update)
}

update()