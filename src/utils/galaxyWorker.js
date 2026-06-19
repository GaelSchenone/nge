self.onmessage = function ({ data }) {
  const { _target, stars, radius, arms, spin, scatter, density, size, innerColor, outerColor } = data

  function hexToRgb(hex) {
    const v = parseInt(hex.slice(1), 16)
    return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 }
  }

  const inner = hexToRgb(innerColor)
  const outer = hexToRgb(outerColor)

  const positions = new Float32Array(stars * 3)
  const colors = new Float32Array(stars * 3)
  const sizes = new Float32Array(stars)

  for (let i = 0; i < stars; i++) {
    const armIndex = i % arms
    const armOffset = (armIndex / arms) * Math.PI * 2
    const t = Math.pow(Math.random(), density)
    const r = t * radius
    const angle = armOffset + spin * r + (Math.random() - 0.5) * scatter * (1 + r * 0.4)
    const noise = scatter * r * 0.12

    positions[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * noise
    const heightFactor = 0.08 + scatter * 0.18
    positions[i * 3 + 1] = (Math.random() - 0.5) * r * heightFactor
    positions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * noise

    const mr = inner.r + (outer.r - inner.r) * t
    const mg = inner.g + (outer.g - inner.g) * t
    const mb = inner.b + (outer.b - inner.b) * t

    colors[i * 3] = mr
    colors[i * 3 + 1] = mg
    colors[i * 3 + 2] = mb

    sizes[i] = size * (0.5 + (1 - t) * 1.5) * (0.8 + Math.random() * 0.4)
  }

  self.postMessage(
    { _target, positions, colors, sizes },
    [positions.buffer, colors.buffer, sizes.buffer],
  )
}
