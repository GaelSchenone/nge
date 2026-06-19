import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import styles from './GalaxyCanvas.module.css'

const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (5000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, alpha);
  }
`

function createShaderMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader,
    fragmentShader,
  })
}

function buildGeometryFromBuffers(positions, colors, sizes) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geo
}

function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

const GalaxyCanvas = forwardRef(function GalaxyCanvas({ params, isPlaying }, ref) {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const galaxyGroupRef = useRef(null)
  const distantGroupRef = useRef(null)
  const galaxyMeshRef = useRef(null)
  const distantMeshRef = useRef(null)
  const starfieldRef = useRef(null)
  const nebulaSpritesRef = useRef([])
  const nebulaTextureRef = useRef(null)
  const starfallsRef = useRef([])
  const workerRef = useRef(null)
  const frameRef = useRef(null)
  const lastSpawnRef = useRef(0)
  const pendingMainRef = useRef(null)
  const pendingDistantRef = useRef(null)

  const cameraTargetRef = useRef(null)
  const cameraLerpRef = useRef(false)

  const apiRef = useRef({ canvas: null, resetCamera: () => {} })
  useImperativeHandle(ref, () => apiRef.current, [])

  // Setup
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      logarithmicDepthBuffer: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x0a0a0f, 1)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000)
    camera.position.set(0, 6, 14)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 80
    controlsRef.current = controls

    const galaxyGroup = new THREE.Group()
    scene.add(galaxyGroup)
    galaxyGroupRef.current = galaxyGroup

    const distantGroup = new THREE.Group()
    distantGroup.position.z = -200
    scene.add(distantGroup)
    distantGroupRef.current = distantGroup

    const worker = new Worker(new URL('../../utils/galaxyWorker.js', import.meta.url))
    worker.onmessage = ({ data }) => {
      const { positions, colors, sizes } = data
      const geo = buildGeometryFromBuffers(positions, colors, sizes)
      const mat = createShaderMaterial()
      const mesh = new THREE.Points(geo, mat)
      mesh.frustumCulled = true

      if (data._target === 'distant') {
        if (distantMeshRef.current) {
          distantGroup.remove(distantMeshRef.current)
          distantMeshRef.current.geometry.dispose()
          distantMeshRef.current.material.dispose()
        }
        distantMeshRef.current = mesh
        distantGroup.add(mesh)
        pendingDistantRef.current = null
      } else {
        if (galaxyMeshRef.current) {
          galaxyGroup.remove(galaxyMeshRef.current)
          galaxyMeshRef.current.geometry.dispose()
          galaxyMeshRef.current.material.dispose()
        }
        galaxyMeshRef.current = mesh
        galaxyGroup.add(mesh)
        pendingMainRef.current = null
      }
    }
    workerRef.current = worker

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    const grd = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.15, 'rgba(255,255,255,0.7)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, 512, 512)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    nebulaTextureRef.current = tex

    apiRef.current.canvas = renderer.domElement
    apiRef.current.resetCamera = () => {
      cameraTargetRef.current = new THREE.Vector3(0, 6, 14)
      cameraLerpRef.current = true
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      worker.terminate()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  // Resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      const renderer = rendererRef.current
      const camera = cameraRef.current
      if (renderer && camera) {
        renderer.setSize(width, height)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Generate main galaxy
  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    pendingMainRef.current = debounce(() => {
      worker.postMessage({
        _target: 'main',
        stars: params.stars,
        radius: params.radius,
        arms: params.arms,
        spin: params.spin,
        scatter: params.scatter,
        density: params.density,
        size: params.size,
        innerColor: params.innerColor,
        outerColor: params.outerColor,
      })
    }, 200)

    pendingMainRef.current()
  }, [
    params.stars, params.radius, params.arms,
    params.spin, params.scatter, params.density,
    params.size, params.innerColor, params.outerColor,
  ])

  // Generate distant galaxy
  useEffect(() => {
    const worker = workerRef.current
    if (!worker) return

    pendingDistantRef.current = debounce(() => {
      worker.postMessage({
        _target: 'distant',
        stars: params.distant.stars,
        radius: params.distant.radius,
        arms: params.distant.arms,
        spin: params.distant.spin,
        scatter: params.distant.scatter,
        density: 2.8,
        size: params.distant.size,
        innerColor: params.distant.innerColor,
        outerColor: params.distant.outerColor,
      })
    }, 200)

    pendingDistantRef.current()
  }, [
    params.distant.stars, params.distant.radius, params.distant.arms,
    params.distant.spin, params.distant.scatter,
    params.distant.size, params.distant.innerColor, params.distant.outerColor,
  ])

  // Nebula
  useEffect(() => {
    const scene = sceneRef.current
    const galaxyGroup = galaxyGroupRef.current
    if (!scene || !galaxyGroup) return

    nebulaSpritesRef.current.forEach((s) => {
      galaxyGroup.remove(s)
      s.material.dispose()
    })
    nebulaSpritesRef.current = []

    if (!params.nebula.enabled) return

    const tex = nebulaTextureRef.current
    const count = 6 + Math.floor(Math.random() * 5)
    const arms = params.arms

    for (let i = 0; i < count; i++) {
      const armIdx = Math.floor(Math.random() * arms)
      const armOffset = (armIdx / arms) * Math.PI * 2
      const t = 0.3 + Math.random() * 0.6
      const r = t * params.radius

      const angle = armOffset + params.spin * r + (Math.random() - 0.5) * params.scatter * (1 + r * 0.4)
      const noise = params.scatter * r * 0.12

      const x = Math.cos(angle) * r + (Math.random() - 0.5) * noise
      const z = Math.sin(angle) * r + (Math.random() - 0.5) * noise
      const y = (Math.random() - 0.5) * r * 0.06

      const color = Math.random() > 0.5 ? params.nebula.color1 : params.nebula.color2
      const mat = new THREE.SpriteMaterial({
        map: tex,
        color,
        transparent: true,
        opacity: params.nebula.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const sprite = new THREE.Sprite(mat)
      sprite.position.set(x, y, z)
      const scale = params.nebula.density * params.radius * 0.8
      sprite.scale.set(scale, scale, 1)
      galaxyGroup.add(sprite)
      nebulaSpritesRef.current.push(sprite)
    }
  }, [
    params.nebula.enabled, params.nebula.density, params.nebula.opacity,
    params.nebula.color1, params.nebula.color2,
    params.radius, params.arms, params.spin, params.scatter,
  ])

  // Starfield
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    if (starfieldRef.current) {
      scene.remove(starfieldRef.current)
      starfieldRef.current.geometry.dispose()
      starfieldRef.current.material.dispose()
      starfieldRef.current = null
    }

    if (!params.starfield.enabled) return

    const count = params.starfield.count
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      // Shell distribution: minimum 60u away so no star becomes a giant blob
      const r = 60 + Math.cbrt(Math.random()) * 440
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }

    const color = new THREE.Color(params.starfield.color)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color,
      // PointsMaterial has no built-in distance-compensation factor (unlike the
      // galaxy's custom shader, which multiplies by 5000). Without a multiplier
      // the raw slider value (0.01) produces sub-pixel dots past ~50u.
      size: params.starfield.size * 150,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const mesh = new THREE.Points(geo, mat)
    mesh.frustumCulled = false
    scene.add(mesh)
    starfieldRef.current = mesh
  }, [
    params.starfield.enabled, params.starfield.count,
    params.starfield.size, params.starfield.color,
  ])

  // Distant visibility + spin
  useEffect(() => {
    if (distantGroupRef.current) {
      distantGroupRef.current.visible = params.distant.enabled
    }
  }, [params.distant.enabled])

  // Animation loop
  useEffect(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current
    const controls = controlsRef.current
    const galaxyGroup = galaxyGroupRef.current
    const distantGroup = distantGroupRef.current
    if (!renderer || !scene || !camera || !controls || !galaxyGroup || !distantGroup) return

    let lastTime = 0

    function animate(time) {
      frameRef.current = requestAnimationFrame(animate)

      const dt = lastTime === 0 ? 16 : time - lastTime
      lastTime = time

      // Normalize all movement to 60fps baseline for frame-rate independence
      const speedFactor = Math.min(dt, 50) / 16

      controls.update()

      if (isPlaying) {
        // Distant galaxy always spins
        distantGroup.rotation.y += params.distant.speed * 0.0001 * speedFactor

        // Main galaxy animation mode
        if (params.animation.mode === 'Spin') {
          galaxyGroup.rotation.y += 0.0002 * params.animation.speed * speedFactor
        } else if (params.animation.mode === 'Orbit') {
          controls.autoRotate = true
          controls.autoRotateSpeed = params.animation.speed
        } else {
          controls.autoRotate = false
        }
      } else {
        controls.autoRotate = false
      }

      // Starfalls
      if (params.starfalls.enabled && isPlaying) {
        const now = performance.now()
        if (lastSpawnRef.current === 0) lastSpawnRef.current = now
        if (now - lastSpawnRef.current > 800 && starfallsRef.current.length < 12) {
          lastSpawnRef.current = now
          spawnStarfall(scene)
        }
      }
      updateStarfalls()

      // Camera reset lerp
      if (cameraLerpRef.current && cameraTargetRef.current) {
        camera.position.lerp(cameraTargetRef.current, 0.05)
        if (camera.position.distanceTo(cameraTargetRef.current) < 0.01) {
          camera.position.copy(cameraTargetRef.current)
          camera.lookAt(0, 0, 0)
          cameraLerpRef.current = false
        }
        controls.target.set(0, 0, 0)
      }

      renderer.render(scene, camera)
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [isPlaying, params.animation.mode, params.animation.speed, params.distant.speed, params.starfalls.enabled])

  function spawnStarfall(scene) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 10 + Math.random() * 4
    const sx = r * Math.sin(phi) * Math.cos(theta)
    const sy = r * Math.sin(phi) * Math.sin(theta)
    const sz = r * Math.cos(phi)

    const segCount = 5
    const positions = new Float32Array(segCount * 3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    })

    const line = new THREE.Line(geo, mat)
    scene.add(line)

    const startPos = new THREE.Vector3(sx, sy, sz)
    const endPos = new THREE.Vector3(0, 0, 0)
    const dir = new THREE.Vector3().subVectors(endPos, startPos)

    const history = []
    for (let i = 0; i < segCount; i++) {
      history.push(startPos.clone())
    }

    const entry = {
      line,
      startPos,
      endPos,
      dir: dir.clone(),
      startTime: performance.now(),
      duration: 1200,
      history,
      segCount,
    }

    starfallsRef.current.push(entry)
    return entry
  }

  function updateStarfalls() {
    const now = performance.now()
    const toRemove = []

    for (let s = starfallsRef.current.length - 1; s >= 0; s--) {
      const sf = starfallsRef.current[s]
      const elapsed = now - sf.startTime
      const progress = Math.min(elapsed / sf.duration, 1)

      const headPos = new THREE.Vector3().copy(sf.startPos).lerp(sf.endPos, progress)
      sf.history.push(headPos.clone())
      if (sf.history.length > sf.segCount) sf.history.shift()

      const pos = sf.line.geometry.attributes.position.array
      for (let i = 0; i < sf.segCount; i++) {
        const idx = Math.max(0, sf.history.length - sf.segCount + i)
        const p = sf.history[idx] || sf.startPos
        pos[i * 3] = p.x
        pos[i * 3 + 1] = p.y
        pos[i * 3 + 2] = p.z
      }
      sf.line.geometry.attributes.position.needsUpdate = true

      sf.line.material.opacity = Math.max(0, 1 - progress * 1.2)

      if (progress >= 1) {
        toRemove.push(starfallsRef.current[s])
      }
    }

    for (const sf of toRemove) {
      const idx = starfallsRef.current.indexOf(sf)
      if (idx !== -1) {
        starfallsRef.current.splice(idx, 1)
        sf.line.parent?.remove(sf.line)
        sf.line.geometry.dispose()
        sf.line.material.dispose()
      }
    }
  }

  return <div ref={containerRef} className={styles.wrapper} />
})

export default GalaxyCanvas
