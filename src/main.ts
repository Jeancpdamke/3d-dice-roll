import './style.css'

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

 const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

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
camera.position.z = 15
scene.add(camera)

/** 
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true


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


const update = () => {
      // Update controls
      controls.update()

      // Render
      renderer.render(scene, camera)
  
      // Call tick again on the next frame
      window.requestAnimationFrame(update)
}

update()