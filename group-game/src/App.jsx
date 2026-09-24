import { useEffect, useRef } from 'react'
import kaplay from 'kaplay'
import './App.css'

function App() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const k = kaplay({
      canvas,
      width: 960,
      height: 540,
      background: [135, 206, 235],
      crisp: true,
      letterbox: true,
    })

    const FLOOR_Y = 470
    const MOVE_SPEED = 240
    const JUMP_FORCE = 540
    let gameOver = false

    for (let x = 0; x < k.width(); x += 64) {
      k.add([
        k.pos(x, FLOOR_Y),
        k.rect(64, 70),
        k.color(76, 175, 80),
        k.area(),
        k.static(),
        'floor',
      ])
    }

    const player = k.add([
      k.pos(120, FLOOR_Y - 40),
      k.rect(28, 40),
      k.color(255, 196, 87),
      k.area(),
      k.body(),
      'player',
    ])

    const gameOverText = k.add([
      k.text('Game Over', { size: 44 }),
      k.pos(k.width() / 2, k.height() / 2 - 30),
      k.anchor('center'),
      k.color(255, 255, 255),
      k.opacity(0),
    ])

    k.onUpdate(() => {
      if (gameOver) return

      if (k.isKeyDown('left')) {
        player.move(-MOVE_SPEED * k.dt(), 0)
      }

      if (k.isKeyDown('right')) {
        player.move(MOVE_SPEED * k.dt(), 0)
      }

      if (k.isKeyPressed('space') && player.isGrounded()) {
        player.jump(JUMP_FORCE)
      }

      if (player.pos.x < 0) player.pos.x = 0
      if (player.pos.x > k.width() - player.width) {
        player.pos.x = k.width() - player.width
      }
    })

    k.loop(1.2, () => {
      if (gameOver) return

      const obstacle = k.add([
        k.pos(k.rand(0, k.width() - 24), -20),
        k.rect(20, 20),
        k.color(214, 73, 73),
        k.area(),
        'obstacle',
      ])

      obstacle.onUpdate(() => {
        obstacle.move(0, 260 * k.dt())
      })
    })

    player.onCollide('obstacle', () => {
      if (gameOver) return

      gameOver = true
      gameOverText.opacity = 1
      player.destroy()

      k.add([
        k.text('Press R to restart', { size: 22 }),
        k.pos(k.width() / 2, k.height() / 2 + 46),
        k.anchor('center'),
        k.color(255, 255, 255),
      ])
    })

    k.onKeyPress('r', () => {
      if (gameOver) {
        window.location.reload()
      }
    })

    return () => {
      if (typeof k.quit === 'function') {
        k.quit()
      }
    }
  }, [])

  return (
    <div className="game-shell">
      <canvas ref={canvasRef} width={960} height={540} />
    </div>
  )
}

export default App
