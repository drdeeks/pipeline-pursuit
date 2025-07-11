import React, { useRef, useEffect, useCallback, useState } from 'react'

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void
  onGameEnd: (score: number) => void
  selectedCharacter?: string
}

interface Monanimal {
  emoji: string
  speed: number
  jump: number
  slide: number
  name: string
}

const monanimals: Record<string, Monanimal> = {
  smantha: { emoji: '🐨', speed: 1.2, jump: 1.0, slide: 1.1, name: 'Smantha' },
  fake0ne: { emoji: '🎭', speed: 1.0, jump: 1.4, slide: 0.8, name: 'Fake0ne' },
  frycook: { emoji: '🍳', speed: 1.4, jump: 0.9, slide: 1.0, name: 'Frycook' },
  'nad-og': { emoji: '👑', speed: 0.9, jump: 1.2, slide: 1.3, name: 'Nad-OG' },
  mo: { emoji: '🎯', speed: 1.1, jump: 1.1, slide: 1.2, name: 'Mo' },
  shitposter: { emoji: '💩', speed: 1.3, jump: 1.3, slide: 0.7, name: 'Shitposter' }
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onScoreUpdate, onGameEnd, selectedCharacter = 'smantha' }) => {
  const gameRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>()
  const [gameState, setGameState] = useState({
    distance: 0,
    tokens: 0,
    speed: 1.0,
    power: 0,
    isRunning: false
  })

  const character = monanimals[selectedCharacter]

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
        powerIncrease = character.jump * 5
        break
      case 'slide':
        runnerChar.classList.add('sliding')
        powerIncrease = character.slide * 5
        break
      case 'left':
      case 'right':
        // Add dodge animation
        runnerChar.style.transform = action === 'left' ? 'translateX(-20px)' : 'translateX(20px)'
        setTimeout(() => {
          if (runnerChar) {
            runnerChar.style.transform = 'translateX(0)'
          }
        }, 300)
        powerIncrease = character.speed * 3
        break
    }
    
    setGameState(prev => ({
      ...prev,
      power: Math.min(100, prev.power + powerIncrease),
      tokens: prev.tokens + (Math.random() < 0.3 ? 2 : 0)
    }))
  }, [gameState.isRunning, character])

  const gameLoop = useCallback(() => {
    if (!gameState.isRunning) return
    
    setGameState(prev => {
      const newDistance = prev.distance + Math.floor(prev.speed * character.speed)
      const newSpeed = Math.min(3.0, 1.0 + (newDistance / 1000))
      const newTokens = prev.tokens + (Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0)
      const newPower = Math.min(100, prev.power + (Math.random() < 0.1 ? 10 : 0))
      
      // Update score (distance is the score)
      onScoreUpdate(newDistance)
      
      return {
        ...prev,
        distance: newDistance,
        speed: newSpeed,
        tokens: newTokens,
        power: newPower
      }
    })
    
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isRunning, character, onScoreUpdate])

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

  return (
    <div className="game-canvas-container">
      <div className="game-screen" ref={gameRef}>
        {/* Cosmic stars background */}
        <div className="cosmic-stars"></div>
        
        {/* Temple background */}
        <div className="temple-background"></div>
        
        {/* Floating obstacles */}
        <div className="floating-obstacles">
          <div className="obstacle" style={{ left: '20%', top: '30%', animationDelay: '0s' }}>🔮</div>
          <div className="obstacle" style={{ left: '60%', top: '50%', animationDelay: '1.5s' }}>⚡</div>
          <div className="obstacle" style={{ left: '40%', top: '70%', animationDelay: '3s' }}>🏛️</div>
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
        <div className="monanimal-runner">
          <div className="runner-character">{character.emoji}</div>
        </div>
        
        {/* Game controls */}
        <div className="game-controls">
          <button className="control-btn" onClick={() => performAction('jump')}>↑</button>
          <button className="control-btn" onClick={() => performAction('slide')}>↓</button>
          <button className="control-btn" onClick={() => performAction('left')}>←</button>
          <button className="control-btn" onClick={() => performAction('right')}>→</button>
        </div>
      </div>
      
      <div className="game-instructions">
        <p>Use arrow keys or WASD to control your Monanimal!</p>
        <p>Spacebar to jump • Collect ⚡ tokens • Build MONAD POWER!</p>
      </div>
    </div>
  )
}

export default GameCanvas 