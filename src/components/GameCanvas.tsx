import React, { useRef, useEffect, useCallback, useState } from 'react'

interface GameCanvasProps {
  onScoreUpdate: (score: number, tokens: number) => void
  onGameEnd: (score: number) => void
  selectedCharacterImage?: string
}

interface Obstacle {
  x: number
  y: number
  type: string
  id: string
  height: string
}

interface PowerUp {
  x: number
  y: number
  id: string
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onScoreUpdate, onGameEnd, selectedCharacterImage }) => {
  const gameRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const [gameState, setGameState] = useState({
    distance: 0,
    tokens: 0,
    speed: 1.0,
    power: 0,
    isRunning: false
  })
  const [collisions, setCollisions] = useState(0)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const maxCollisions = 2
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 80 })
  const [isJumping, setIsJumping] = useState(false)
  const [isSliding, setIsSliding] = useState(false)
  const groundY = 80
  const jumpY = 50
  const slideY = 95
  const [isInvincible, setIsInvincible] = useState(false)
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [avatarError, setAvatarError] = useState(false)
  const [actionWarning, setActionWarning] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)

  // Remove monanimals object and character logic

  const createStars = useCallback(() => {
    if (!gameRef.current) return
    
    const starsContainer = gameRef.current.querySelector('.cosmic-stars')
    if (!starsContainer) return
    
    const numStars = 100
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      star.style.left = Math.random() * 100 + '%'
      star.style.top = Math.random() * 100 + '%'
      star.style.animationDelay = Math.random() * 2 + 's'
      star.style.animationDuration = (Math.random() * 2 + 1) + 's'
      starsContainer.appendChild(star)
    }
  }, [])

  const performAction = useCallback((action: string) => {
    if (!gameState.isRunning) return
    
    const runnerChar = gameRef.current?.querySelector('.runner-character')
    if (!runnerChar) return
    
    // Remove existing animation classes
    runnerChar.classList.remove('jumping', 'sliding')
    
    let powerIncrease = 0
    
    switch(action) {
      case 'jump':
        runnerChar.classList.add('jumping')
        powerIncrease = 1.0 * 5 // Assuming a default jump power
        break
      case 'slide':
        runnerChar.classList.add('sliding')
        powerIncrease = 1.0 * 5 // Assuming a default slide power
        break
      case 'left':
      case 'right':
        // Add dodge animation
        if (runnerChar instanceof HTMLElement) {
          runnerChar.style.transform = action === 'left' ? 'translateX(-20px)' : 'translateX(20px)'
          setTimeout(() => {
            if (runnerChar instanceof HTMLElement) {
              runnerChar.style.transform = 'translateX(0)'
            }
          }, 300)
        }
        powerIncrease = 1.0 * 3 // Assuming a default speed power
        break
    }
    
    setGameState(prev => ({
      ...prev,
      power: Math.min(100, prev.power + powerIncrease),
      tokens: prev.tokens + (Math.random() < 0.3 ? 2 : 0)
    }))
  }, [gameState.isRunning])

  const gameLoop = useCallback(() => {
    if (!gameState.isRunning) return
    
    setGameState(prev => {
      const newDistance = prev.distance + Math.floor(prev.speed * 1.0) // Assuming a default speed multiplier
      const newSpeed = Math.min(3.0, 1.0 + (newDistance / 1000))
      const newTokens = prev.tokens + (Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0)
      const newPower = Math.min(100, prev.power + (Math.random() < 0.1 ? 10 : 0))
      
      // Update score (distance is the score) and tokens
      onScoreUpdate(newDistance, newTokens)
      
      return {
        ...prev,
        distance: newDistance,
        speed: newSpeed,
        tokens: newTokens,
        power: newPower
      }
    })
    
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isRunning, onScoreUpdate])

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isRunning: true,
      distance: 0,
      tokens: 0,
      speed: 1.0,
      power: 0
    }))
  }, [])

  const stopGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: false }))
    onGameEnd(gameState.distance)
  }, [gameState.distance, onGameEnd])

  // Remove unused stopGame warning by using it
  useEffect(() => {
    if (!gameState.isRunning && gameState.distance > 0) {
      stopGame()
    }
  }, [gameState.isRunning, gameState.distance, stopGame])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!gameState.isRunning) return
    
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        event.preventDefault()
        performAction('jump')
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault()
        performAction('slide')
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault()
        performAction('left')
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault()
        performAction('right')
        break
    }
  }, [gameState.isRunning, performAction])

  // Enhanced jump/slide with feedback
  const handleJump = useCallback(() => {
    if (!gameState.isRunning) return
    if (isJumping || isSliding) {
      setActionWarning('Cannot jump right now!')
      setTimeout(() => setActionWarning(null), 1000)
      return
    }
    setIsJumping(true)
    setPlayerPos(pos => ({ ...pos, y: jumpY }))
    setTimeout(() => {
      setPlayerPos(pos => ({ ...pos, y: groundY }))
      setIsJumping(false)
    }, 600)
  }, [gameState.isRunning, isJumping, isSliding])

  const handleSlide = useCallback(() => {
    if (!gameState.isRunning) return
    if (isSliding || isJumping) {
      setActionWarning('Cannot slide right now!')
      setTimeout(() => setActionWarning(null), 1000)
      return
    }
    setIsSliding(true)
    setPlayerPos(pos => ({ ...pos, y: slideY }))
    setTimeout(() => {
      setPlayerPos(pos => ({ ...pos, y: groundY }))
      setIsSliding(false)
    }, 600)
  }, [gameState.isRunning, isSliding, isJumping])

  useEffect(() => {
    createStars()
  }, [createStars])

  useEffect(() => {
    if (gameState.isRunning) {
      gameLoop()
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameState.isRunning, gameLoop])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [handleKeyDown])

  // Auto-start game when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      startGame()
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [startGame])

  // Power decrease effect
  useEffect(() => {
    if (!gameState.isRunning) return
    
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        power: Math.max(0, prev.power - 0.5)
      }))
    }, 200)
    
    return () => clearInterval(interval)
  }, [gameState.isRunning])

  // Generate obstacles at intervals
  useEffect(() => {
    if (!gameState.isRunning) return
    let lastWasLow = false
    let timeout: NodeJS.Timeout
    const spawnObstacle = () => {
      const isLow = !lastWasLow
      lastWasLow = isLow
      setObstacles(prev => [
        ...prev,
        {
          x: 100 + Math.random() * 20, // randomize start x
          y: isLow ? 95 : 50,
          type: isLow ? '🔮' : '🏛️',
          id: Math.random().toString(36).slice(2),
          height: isLow ? 'low' : 'high'
        }
      ])
      // Randomize next spawn between 1.2s and 2.2s
      timeout = setTimeout(spawnObstacle, 1200 + Math.random() * 1000)
    }
    spawnObstacle()
    return () => clearTimeout(timeout)
  }, [gameState.isRunning])

  // Move obstacles toward player
  useEffect(() => {
    if (!gameState.isRunning) return
    const interval = setInterval(() => {
      setObstacles(prev => prev
        .map(ob => ({ ...ob, x: ob.x - 2 }))
        .filter(ob => ob.x > -10)
      )
    }, 50)
    return () => clearInterval(interval)
  }, [gameState.isRunning])

  // Move player forward
  useEffect(() => {
    if (!gameState.isRunning) return
    const interval = setInterval(() => {
      setPlayerPos(pos => ({ ...pos, x: pos.x + 1 }))
    }, 50)
    return () => clearInterval(interval)
  }, [gameState.isRunning])

  // Reset player position on new game
  useEffect(() => {
    if (gameState.isRunning) {
      setPlayerPos({ x: 10, y: 80 })
    }
  }, [gameState.isRunning])

  // Power-up spawn logic
  useEffect(() => {
    if (!gameState.isRunning) return
    let timeout: NodeJS.Timeout
    const spawnPowerUp = () => {
      setPowerUps(prev => [
        ...prev,
        {
          x: 100 + Math.random() * 20,
          y: [50, 80, 95][Math.floor(Math.random() * 3)],
          id: Math.random().toString(36).slice(2),
        }
      ])
      timeout = setTimeout(spawnPowerUp, 5000 + Math.random() * 5000)
    }
    spawnPowerUp()
    return () => clearTimeout(timeout)
  }, [gameState.isRunning])

  // Move power-ups
  useEffect(() => {
    if (!gameState.isRunning) return
    const interval = setInterval(() => {
      setPowerUps(prev => prev.map(pu => ({ ...pu, x: pu.x - 2 })).filter(pu => pu.x > -10))
    }, 50)
    return () => clearInterval(interval)
  }, [gameState.isRunning])

  // Power-up collection
  useEffect(() => {
    if (!gameState.isRunning) return
    powerUps.forEach(pu => {
      if (Math.abs(pu.x - playerPos.x) < 8 && Math.abs(pu.y - playerPos.y) < 15) {
        setIsInvincible(true)
        setTimeout(() => setIsInvincible(false), 3000)
        setPowerUps(prev => prev.filter(p => p.id !== pu.id))
      }
    })
  }, [powerUps, playerPos, gameState.isRunning])

  // Refined collision detection (bounding box)
  useEffect(() => {
    if (!gameState.isRunning || isInvincible) return
    obstacles.forEach(ob => {
      const playerBox = { x: playerPos.x, y: playerPos.y, w: 20, h: 20 }
      const obBox = { x: ob.x, y: ob.y, w: 16, h: 16 }
      if (
        playerBox.x < obBox.x + obBox.w &&
        playerBox.x + playerBox.w > obBox.x &&
        playerBox.y < obBox.y + obBox.h &&
        playerBox.y + playerBox.h > obBox.y
      ) {
        setCollisions(c => {
          if (c < maxCollisions) {
            if (c + 1 === maxCollisions) {
              setGameState(prev => ({ ...prev, isRunning: false }))
              onGameEnd(gameState.distance)
            }
            return c + 1
          }
          return c
        })
      }
    })
  }, [obstacles, gameState.isRunning, playerPos, isInvincible])

  // Improved jump/slide responsiveness (queue next action)
  const [queuedAction, setQueuedAction] = useState<null | 'jump' | 'slide'>(null)
  useEffect(() => {
    if (!isJumping && !isSliding && queuedAction) {
      if (queuedAction === 'jump') handleJump()
      if (queuedAction === 'slide') handleSlide()
      setQueuedAction(null)
    }
  }, [isJumping, isSliding, queuedAction, handleJump, handleSlide])

  // Reset collisions and obstacles on new game
  useEffect(() => {
    if (gameState.isRunning) {
      setCollisions(0)
      setObstacles([])
    }
  }, [gameState.isRunning])

  // Error boundary for game state errors
  class GameErrorBoundary extends React.Component<any, { hasError: boolean }> {
    constructor(props: any) {
      super(props)
      this.state = { hasError: false }
    }
    static getDerivedStateFromError() { return { hasError: true } }
    componentDidCatch(error: any, info: any) { console.error('Game error:', error, info) }
    render() {
      if (this.state.hasError) return <div style={{ color: 'red', padding: 40 }}>Something went wrong. Please refresh the page.</div>
      return this.props.children
    }
  }

  // Pause/resume logic
  const handlePause = () => setIsPaused(true)
  const handleResume = () => setIsPaused(false)
  const handleRestart = () => {
    setShowGameOver(false)
    setCollisions(0)
    setObstacles([])
    setPowerUps([])
    setPlayerPos({ x: 10, y: 80 })
    setIsJumping(false)
    setIsSliding(false)
    setIsInvincible(false)
    setAvatarError(false)
    setActionWarning(null)
    setGameState(prev => ({ ...prev, isRunning: true, distance: 0, tokens: 0, speed: 1.0, power: 0 }))
  }

  // Show game over when max collisions reached
  useEffect(() => {
    if (collisions >= maxCollisions) {
      setShowGameOver(true)
      setGameState(prev => ({ ...prev, isRunning: false }))
      onGameEnd(gameState.distance)
    }
  }, [collisions, maxCollisions, onGameEnd, gameState.distance])

  // Pause all intervals and effects if paused
  useEffect(() => {
    if (isPaused) return
    gameLoop()
    // Obstacle spawning
    let lastWasLow = false
    let obstacleTimeout: NodeJS.Timeout
    const spawnObstacle = () => {
      const isLow = !lastWasLow
      lastWasLow = isLow
      setObstacles(prev => [
        ...prev,
        {
          x: 100 + Math.random() * 20, // randomize start x
          y: isLow ? 95 : 50,
          type: isLow ? '🔮' : '🏛️',
          id: Math.random().toString(36).slice(2),
          height: isLow ? 'low' : 'high'
        }
      ])
      obstacleTimeout = setTimeout(spawnObstacle, 1200 + Math.random() * 1000)
    }
    spawnObstacle()

    // Power-up spawning
    let powerUpTimeout: NodeJS.Timeout
    const spawnPowerUp = () => {
      setPowerUps(prev => [
        ...prev,
        {
          x: 100 + Math.random() * 20,
          y: [50, 80, 95][Math.floor(Math.random() * 3)],
          id: Math.random().toString(36).slice(2),
        }
      ])
      powerUpTimeout = setTimeout(spawnPowerUp, 5000 + Math.random() * 5000)
    }
    spawnPowerUp()

    // Player movement
    const movePlayer = () => {
      setPlayerPos(pos => ({ ...pos, x: pos.x + 1 }))
      requestAnimationFrame(movePlayer)
    }
    movePlayer()

    return () => {
      if (obstacleTimeout) clearTimeout(obstacleTimeout)
      if (powerUpTimeout) clearTimeout(powerUpTimeout)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused, gameLoop])

  return (
    <GameErrorBoundary>
      <div className="game-canvas-container" tabIndex={0} aria-label="Game Canvas" style={{ outline: 'none' }}>
        {/* Pause/Resume Button */}
        <button
          className="mega-button"
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}
          onClick={isPaused ? handleResume : handlePause}
          aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
        {/* Restart Button */}
        <button
          className="mega-button"
          style={{ position: 'absolute', top: 70, right: 20, zIndex: 100 }}
          onClick={handleRestart}
          aria-label="Restart Game"
        >
          🔄 Restart
        </button>
        {/* Pause Overlay */}
        {isPaused && !showGameOver && (
          <div className="screen-overlay active" style={{ zIndex: 200 }}>
            <div className="modal-content" style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#fbbf24', fontSize: 32 }}>Game Paused</h2>
              <button className="mega-button" onClick={handleResume} aria-label="Resume Game">▶️ Resume</button>
            </div>
          </div>
        )}
        {/* Game Over Overlay */}
        {showGameOver && (
          <div className="screen-overlay active" style={{ zIndex: 200 }}>
            <div className="modal-content" style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#f56565', fontSize: 36 }}>Game Over</h2>
              <div style={{ fontSize: 24, margin: '20px 0' }}>Score: {gameState.distance}m</div>
              <button className="mega-button" onClick={handleRestart} aria-label="Restart Game">🔄 Restart</button>
            </div>
          </div>
        )}
        <div className="game-screen" ref={gameRef}>
          {/* Cosmic stars background */}
          <div className="cosmic-stars"></div>
          
          {/* Temple background */}
          <div className="temple-background"></div>
          
          {/* Floating obstacles */}
          <div className="floating-obstacles">
            {obstacles.map(ob => (
              <div
                key={ob.id}
                className="obstacle"
                style={{ left: `${ob.x}%`, top: `${ob.y}%` }}
              >{ob.type}</div>
            ))}
            {powerUps.map(pu => (
              <div
                key={pu.id}
                className="obstacle"
                style={{ left: `${pu.x}%`, top: `${pu.y}%`, fontSize: 32, color: '#fbbf24', filter: 'drop-shadow(0 0 12px #fff)' }}
              >⭐</div>
            ))}
          </div>
          
          {/* Mon particles */}
          <div className="mon-particles">
            <div className="mon-particle" style={{ left: '15%', top: '40%', animationDelay: '0s' }}></div>
            <div className="mon-particle" style={{ left: '45%', top: '60%', animationDelay: '1s' }}></div>
            <div className="mon-particle" style={{ left: '75%', top: '30%', animationDelay: '2s' }}></div>
            <div className="mon-particle" style={{ left: '85%', top: '80%', animationDelay: '2.5s' }}></div>
          </div>
          
          {/* Power meter */}
          <div className="power-meter">
            <div className="power-label">MONAD POWER</div>
            <div 
              className="power-fill" 
              style={{ 
                width: `${gameState.power}%`,
                background: gameState.power > 80 
                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                  : gameState.power > 50 
                  ? 'linear-gradient(90deg, #c084fc, #e879f9)'
                  : 'linear-gradient(90deg, #7c3aed, #c084fc)'
              }}
            ></div>
          </div>
          
          {/* Game HUD */}
          <div className="game-hud">
            <div className="hud-item">
              <span className="hud-icon">🏃‍♂️</span>
              <span>{gameState.distance}m</span>
            </div>
            <div className="hud-item">
              <span className="hud-icon">⚡</span>
              <span>{gameState.tokens}</span>
            </div>
            <div className="hud-item">
              <span className="hud-icon">🚀</span>
              <span>{gameState.speed.toFixed(1)}x</span>
            </div>
          </div>
          
          {/* Monanimal runner */}
          <div
            className="monanimal-runner"
            style={{
              left: `${playerPos.x}%`,
              top: `${playerPos.y}%`,
              filter: isInvincible ? 'drop-shadow(0 0 32px #fff) drop-shadow(0 0 24px #fbbf24)' : 'drop-shadow(0 0 32px #fbbf24) drop-shadow(0 0 12px #7c3aed)',
              border: '5px solid #fff',
              borderRadius: '50%',
              width: 100,
              height: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 60% 40%, #fbbf24 0%, #7c3aed 100%)',
              boxShadow: '0 8px 32px 0 rgba(124,58,237,0.25), 0 1.5px 8px 0 #fbbf24',
              animation: 'runnerBounce 0.8s ease-in-out infinite',
              position: 'absolute',
              zIndex: 30
            }}
          >
            {selectedCharacterImage && !avatarError ? (
              <img
                src={selectedCharacterImage}
                alt="character"
                onError={() => setAvatarError(true)}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  border: '3px solid #c084fc',
                  boxShadow: '0 0 24px #e879f9, 0 0 8px #fff',
                  objectFit: 'cover',
                  background: '#fff',
                  animation: 'runnerBounce 0.8s ease-in-out infinite'
                }}
              />
            ) : (
              <div
                className="runner-character"
                style={{
                  fontSize: 60,
                  width: 90,
                  height: 90,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '3px solid #c084fc',
                  boxShadow: '0 0 24px #e879f9, 0 0 8px #fff',
                  animation: 'runnerBounce 0.8s ease-in-out infinite'
                }}
              >👤</div>
            )}
          </div>
          {/* Avatar error warning */}
          {avatarError && <div style={{ color: 'red', position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>Avatar image failed to load. Using emoji instead.</div>}
          {/* Action warning */}
          {actionWarning && <div style={{ color: 'orange', position: 'absolute', top: 160, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>{actionWarning}</div>}
          {/* Game controls */}
          <div className="game-controls">
            <button className="control-btn" onClick={() => performAction('left')}>←</button>
            <button
              className="control-btn"
              onMouseDown={() => (isJumping || isSliding ? setQueuedAction('slide') : handleSlide())}
              onMouseUp={() => (isJumping || isSliding ? setQueuedAction('jump') : handleJump())}
              onTouchStart={() => (isJumping || isSliding ? setQueuedAction('slide') : handleSlide())}
              onTouchEnd={() => (isJumping || isSliding ? setQueuedAction('jump') : handleJump())}
            >⭮</button>
            <button className="control-btn" onClick={() => performAction('right')}>→</button>
          </div>
          {/* Show remaining lives/collisions */}
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
            {'❤️'.repeat(maxCollisions - collisions) + '💔'.repeat(collisions)}
          </div>
        </div>
        
        <div className="game-instructions">
          <p>Use arrow keys or WASD to control your Monanimal!</p>
          <p>Spacebar to jump • Collect ⚡ tokens • Build MONAD POWER!</p>
        </div>
      </div>
    </GameErrorBoundary>
  )
}

export default GameCanvas 