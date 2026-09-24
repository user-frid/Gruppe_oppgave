import { useCallback, useEffect, useRef, useState } from 'react'
import kaplay from 'kaplay'
import './App.css'
import { supabase } from './supabaseClient'

function App() {
  const canvasRef = useRef(null)
  const usernameRef = useRef('')
  const kaplayRef = useRef(null)
  const resetGameRef = useRef(null)

  const [username, setUsername] = useState('')
  const [score, setScore] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    usernameRef.current = username
  }, [username])

  const fetchLeaderboard = useCallback(async () => {
    if (!supabase) {
      setLeaderboard([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('scores')
        .select('id, username, score')
        .order('score', { ascending: false })
        .limit(10)

      if (error) {
        throw error
      }

      setLeaderboard(data ?? [])
    } catch (error) {
      console.error('Leaderboard fetch error:', error)
      setLeaderboard([])
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const createGame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (kaplayRef.current) {
      kaplayRef.current.quit()
      kaplayRef.current = null
    }

    const k = kaplay({
      canvas,
      width: 960,
      height: 540,
      background: [135, 206, 235],
      crisp: true,
      letterbox: true,
    })

    kaplayRef.current = k

    const FLOOR_Y = 470
    const MOVE_SPEED = 240
    const JUMP_FORCE = 540
    let gameOver = false
    let elapsedScore = 0

    for (let x = 0; x < k.width(); x += 64) {
      k.add([
        k.pos(x, FLOOR_Y),
        k.rect(64, 70),
        k.color(76, 175, 80),
        k.area(),
        k.body({ isStatic: true }),
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

    const scoreLabel = k.add([
      k.text('Score: 0', { size: 22 }),
      k.pos(18, 18),
      k.color(255, 255, 255),
    ])

    const gameOverText = k.add([
      k.text('Game Over', { size: 44 }),
      k.pos(k.width() / 2, k.height() / 2 - 30),
      k.anchor('center'),
      k.color(255, 255, 255),
      k.opacity(0),
    ])

    const updateScoreText = (value) => {
      const nextScore = Math.max(0, Math.floor(value))
      setScore(nextScore)
      scoreLabel.text = `Score: ${nextScore}`
    }

    const saveScore = async (finalScore) => {
      if (!supabase) {
        setStatusMessage('Supabase is not configured yet. Add your env vars to save scores.')
        return
      }

      try {
        setStatusMessage('Saving score...')

        const { error } = await supabase.from('scores').insert([
          {
            username: usernameRef.current.trim() || 'Anonymous',
            score: finalScore,
          },
        ])

        if (error) {
          throw error
        }

        setStatusMessage(`Saved ${usernameRef.current.trim() || 'Anonymous'}'s score: ${finalScore}`)
        await fetchLeaderboard()
      } catch (error) {
        console.error('Error saving score:', error)
        setStatusMessage('The score could not be uploaded right now.')
      }
    }

    const finishRound = async () => {
      if (gameOver) return

      gameOver = true
      gameOverText.opacity = 1
      player.destroy()

      const finalScore = Math.max(0, Math.floor(elapsedScore))
      updateScoreText(finalScore)

      k.add([
        k.text('Press R to restart', { size: 22 }),
        k.pos(k.width() / 2, k.height() / 2 + 46),
        k.anchor('center'),
        k.color(255, 255, 255),
      ])

      await saveScore(finalScore)
    }

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

      elapsedScore += k.dt() * 12
      updateScoreText(elapsedScore)
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
      finishRound()
    })

    k.onKeyPress('r', () => {
      if (gameOver && resetGameRef.current) {
        resetGameRef.current()
      }
    })

    const resetCurrentGame = () => {
      if (kaplayRef.current) {
        kaplayRef.current.quit()
      }

      kaplayRef.current = null
      createGame()
    }

    resetGameRef.current = resetCurrentGame
  }, [fetchLeaderboard])

  useEffect(() => {
    const alreadyCreated = kaplayRef.current
    if (alreadyCreated) return

    createGame()

    return () => {
      if (kaplayRef.current) {
        kaplayRef.current.quit()
        kaplayRef.current = null
      }
    }
  }, [createGame])

  const handlePlayAgain = () => {
    setScore(0)
    setStatusMessage('')
    if (resetGameRef.current) {
      resetGameRef.current()
    }
  }

  return (
    <div className="game-page">
      <div className="top-bar">
        <label className="player-name-field">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={20}
            placeholder="Enter your username"
          />
        </label>
      </div>

      <div className="game-shell">
        <canvas ref={canvasRef} width={960} height={540} />
      </div>

      <div className="game-controls">
        <div className="score-pill">Score: {score}</div>
        <button type="button" className="play-again-button" onClick={handlePlayAgain}>
          Play Again
        </button>
      </div>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      <div className="leaderboard-card">
        <h2>Top Scores</h2>

        {leaderboard.length === 0 ? (
          <p className="leaderboard-empty">No scores yet. Be the first to set the record.</p>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.id ?? `${entry.username}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{entry.username}</td>
                  <td>{entry.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App
