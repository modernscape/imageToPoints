import * as THREE from "three"
import {OrbitControls} from "three/addons/controls/OrbitControls.js"
// import { uniform } from 'three/webgpu';
// import { ThreeMFLoader } from 'three/examples/jsm/Addons.js';
// import { nextId } from 'three/examples/jsm/libs/tween.module.js';

function ImagePixel(path, w, h, ratio) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  const width = w
  const height = h
  canvas.width = width
  canvas.height = height

  ctx.drawImage(path, 0, 0)
  const data = ctx.getImageData(0, 0, width, height).data
  const position = []
  const color = []
  const alpha = []

  for (let y = 0; y < height; y += ratio) {
    for (let x = 0; x < width; x += ratio) {
      const index = (y * width + x) * 4
      const r = data[index] / 255
      const g = data[index + 1] / 255
      const b = data[index + 2] / 255
      const a = data[index + 3] / 255

      const pX = x - width / 2
      const pY = -(y - height / 2)
      const pZ = 0

      position.push(pX, pY, pZ)
      color.push(r, g, b)
      alpha.push(a)
    }
  }

  return {position, color, alpha}
}

/////////////////////////////////////////////////////////////////
// Stage（環境）
/////////////////////////////////////////////////////////////////

class Stage {
  constructor() {
    this.rendererParam = {
      clearColor: 0x000000,
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.cameraParam = {
      fov: 45,
      near: 0.1,
      far: 20000,
      lookAt: new THREE.Vector3(0, 0, 0),
      x: 1000,
      y: 300,
      z: 2000,
    }

    this.scene = null // thisはStageインスタンス？
    this.camera = null
    this.renderer = null
    this.isInitialized = false
    this.orbitControls = null
    this.isDev = false
  }

  init() {
    this._setScene()
    this._setRender()
    this._setCamera()
    this._setDev()
  }

  _setScene() {
    this.scene = new THREE.Scene()
  }

  _setRender() {
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(new THREE.Color(this.rendererParam.clearColor))
    this.renderer.setSize(this.rendererParam.width, this.rendererParam.height) // ① 初期値
    const wrapper = document.getElementById("webgl")
    wrapper.appendChild(this.renderer.domElement)
  }

  _setCamera() {
    // 1回のみ
    if (!this.isInitialized) {
      this.camera = new THREE.PerspectiveCamera(0, 0, this.cameraParam.near, this.cameraParam.far)
      this.camera.position.set(this.cameraParam.x, this.cameraParam.y, this.cameraParam.z)
      this.camera.lookAt(this.cameraParam.lookAt)
      this.isInitialized = true
    }

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    this.camera.aspect = windowWidth / windowHeight
    this.camera.fov = this.cameraParam.fov

    this.camera.updateProjectionMatrix() // ⭐️⭐️⭐️⭐️⭐️
    this.renderer.setSize(windowWidth, windowHeight) // ① Resize用？
  }

  _setDev() {
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)

    this.orbitControls.enableDamping = true
    this.isDev = true
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
    if (this.isDev) this.orbitControls.update()
  }

  // ウィンドウリサイズ
  onResize() {
    this._setCamera()
  }

  // RequestAnimationFrame
  onRaf() {
    this._render() // ()がないだけでエラーになる！
  }
} // Stage

/////////////////////////////////////////////////////////////////
// Particle（描く中身）
/////////////////////////////////////////////////////////////////

class Particle {
  constructor(stage) {
    this.stage = stage
    this.promiseList = []
    // this.pathList = ["./src/img/card_analog.png"]
    // this.pathList = ["./src/img/Red-flankedBluetail.png"]
    this.pathList = [
      "Red-flankedBluetail.png", //
      "card_analog.png", //
      "kawasem.png", //
    ]
    this.imageList = [] // [{ position, color, alpha }]
  }

  init() {
    this.pathList.forEach((image) => {
      this.promiseList.push(
        // promise
        new Promise((resolve) => {
          const img = new Image() // ② start
          img.src = "./src/img/" + image // ...
          img.crossOrigin = "anonymous" // ② end

          img.addEventListener("load", () => {
            this.imageList.push(ImagePixel(img, img.width, img.height, 5.0))
            resolve() // loadされたら　②を実行？
          })
        }),
      )
    })

    // 全てのPromiseが完了したら
    Promise.all(this.promiseList).then(() => {
      this._setMesh()
      this._setAutoPlay() // 動かす（拡散）
    })
  }

  _setMesh() {
    const geometry = new THREE.BufferGeometry()
    const position = new THREE.BufferAttribute(new Float32Array(this.imageList[0].position), 3)
    const color = new THREE.BufferAttribute(new Float32Array(this.imageList[0].color), 3)
    const alpha = new THREE.BufferAttribute(new Float32Array(this.imageList[0].alpha), 1)

    const rand = []
    for (let i = 0; i < position.length / 3; i++) {
      rand.push(Math.random() - 1.0)
    }

    const rands = new THREE.BufferAttribute(new Float32Array(rand), 1)
    geometry.setAttribute("position", position)
    geometry.setAttribute("color", color)
    geometry.setAttribute("alpha", alpha)
    geometry.setAttribute("rand", rands)

    const material = new THREE.RawShaderMaterial({
      vertexShader: document.getElementById("vertexShader").textContent,
      fragmentShader: document.getElementById("fragmentShader").textContent,
      transparent: true,
      uniforms: {
        u_ratio: {type: "f", value: 0.0},
        u_time: {type: "f", value: 0.0},
      },
    })

    this.mesh = new THREE.Points(geometry, material)
    this.stage.scene.add(this.mesh)
  }

  _setDifussion() {
    gsap.to(this.mesh.material.uniforms.u_ratio, {
      value: 1.0,
      duration: 1.8,
      ease: "power1.inOut",
      repeat: 1,
      yoyo: true,
    })
  }

  _setAutoPlay() {
    this._setDifussion()

    // _setDifussionを繰り返す用
    gsap.to(
      {},
      {
        duration: 4.2,
        ease: "none",
        repeat: -1.0,
        // onRepeat: this._setDifussion(),
        onRepeat: () => {
          this._setDifussion()
        },
      },
    )
  }

  _render() {
    //
  }

  onResize() {
    //
  }

  onRaf() {
    if (this.mesh) this.mesh.material.uniforms.u_time.value += 0.001
  }
} // Particle

/////////////////////////////////////////////////////////////////
//  WebGL（全体）
/////////////////////////////////////////////////////////////////

class Webgl {
  constructor() {
    const stage = new Stage()
    stage.init()

    const particle = new Particle(stage)
    particle.init()

    window.addEventListener("resize", () => {
      stage.onResize()
      particle.onResize()
    })

    const _raf = () => {
      window.requestAnimationFrame(() => {
        _raf()

        stage.onRaf()
        particle.onRaf()
      })
    }
    _raf()
  }
}

const gl = new Webgl()

// Webgl
// 　└ stage
// 　└ particle
