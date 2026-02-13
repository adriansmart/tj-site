<template>
  <canvas ref="canvasRef" />
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const NUM_BOIDS = 100
const MAX_SPEED = 3
const MAX_FORCE = 0.05
const NEIGHBOR_RADIUS = 50
const SEPARATION_RADIUS = 25
const BOID_SIZE = 6

interface Boid {
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

function randomColor(): string {
  const h = Math.random() * 360
  const s = 60 + Math.random() * 30
  const l = 55 + Math.random() * 20
  return `hsl(${h}, ${s}%, ${l}%)`
}

function createBoid(w: number, h: number): Boid {
  const angle = Math.random() * Math.PI * 2
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * (MAX_SPEED * 0.5 + Math.random() * MAX_SPEED * 0.5),
    vy: Math.sin(angle) * (MAX_SPEED * 0.5 + Math.random() * MAX_SPEED * 0.5),
    color: randomColor(),
  }
}

function limitVec(vx: number, vy: number, max: number) {
  const mag = Math.sqrt(vx * vx + vy * vy)
  if (mag > max) {
    return { x: (vx / mag) * max, y: (vy / mag) * max }
  }
  return { x: vx, y: vy }
}

function updateBoids(boids: Boid[], w: number, h: number) {
  for (let i = 0; i < boids.length; i++) {
    const b = boids[i]

    let sepX = 0, sepY = 0, sepCount = 0
    let aliVx = 0, aliVy = 0, aliCount = 0
    let cohX = 0, cohY = 0, cohCount = 0

    for (let j = 0; j < boids.length; j++) {
      if (i === j) continue
      const o = boids[j]

      let dx = o.x - b.x
      let dy = o.y - b.y

      // Handle wrapping distance
      if (dx > w / 2) dx -= w
      else if (dx < -w / 2) dx += w
      if (dy > h / 2) dy -= h
      else if (dy < -h / 2) dy += h

      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < SEPARATION_RADIUS && dist > 0) {
        sepX -= dx / dist
        sepY -= dy / dist
        sepCount++
      }

      if (dist < NEIGHBOR_RADIUS) {
        aliVx += o.vx
        aliVy += o.vy
        aliCount++

        cohX += b.x + dx
        cohY += b.y + dy
        cohCount++
      }
    }

    let steerX = 0, steerY = 0

    // Separation
    if (sepCount > 0) {
      sepX /= sepCount
      sepY /= sepCount
      const sMag = Math.sqrt(sepX * sepX + sepY * sepY)
      if (sMag > 0) {
        sepX = (sepX / sMag) * MAX_SPEED - b.vx
        sepY = (sepY / sMag) * MAX_SPEED - b.vy
        const sep = limitVec(sepX, sepY, MAX_FORCE)
        steerX += sep.x * 1.5
        steerY += sep.y * 1.5
      }
    }

    // Alignment
    if (aliCount > 0) {
      aliVx /= aliCount
      aliVy /= aliCount
      const aMag = Math.sqrt(aliVx * aliVx + aliVy * aliVy)
      if (aMag > 0) {
        aliVx = (aliVx / aMag) * MAX_SPEED - b.vx
        aliVy = (aliVy / aMag) * MAX_SPEED - b.vy
        const ali = limitVec(aliVx, aliVy, MAX_FORCE)
        steerX += ali.x
        steerY += ali.y
      }
    }

    // Cohesion
    if (cohCount > 0) {
      cohX = cohX / cohCount - b.x
      cohY = cohY / cohCount - b.y
      const cMag = Math.sqrt(cohX * cohX + cohY * cohY)
      if (cMag > 0) {
        cohX = (cohX / cMag) * MAX_SPEED - b.vx
        cohY = (cohY / cMag) * MAX_SPEED - b.vy
        const coh = limitVec(cohX, cohY, MAX_FORCE)
        steerX += coh.x
        steerY += coh.y
      }
    }

    b.vx += steerX
    b.vy += steerY
    const v = limitVec(b.vx, b.vy, MAX_SPEED)
    b.vx = v.x
    b.vy = v.y

    b.x += b.vx
    b.y += b.vy

    // Wrap edges
    if (b.x < 0) b.x += w
    else if (b.x > w) b.x -= w
    if (b.y < 0) b.y += h
    else if (b.y > h) b.y -= h
  }
}

function drawBoids(ctx: CanvasRenderingContext2D, boids: Boid[]) {
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  for (const b of boids) {
    ctx.fillStyle = b.color
    const angle = Math.atan2(b.vy, b.vx)
    ctx.save()
    ctx.translate(b.x, b.y)
    ctx.rotate(angle)
    ctx.beginPath()
    ctx.moveTo(BOID_SIZE, 0)
    ctx.lineTo(-BOID_SIZE * 0.6, BOID_SIZE * 0.4)
    ctx.lineTo(-BOID_SIZE * 0.6, -BOID_SIZE * 0.4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

let animId = 0
const boids: Boid[] = []

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  for (let i = 0; i < NUM_BOIDS; i++) {
    boids.push(createBoid(canvas.width, canvas.height))
  }

  function loop() {
    updateBoids(boids, canvas.width, canvas.height)
    drawBoids(ctx, boids)
    animId = requestAnimationFrame(loop)
  }
  animId = requestAnimationFrame(loop)

  onUnmounted(() => {
    cancelAnimationFrame(animId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style scoped>
canvas {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
</style>
