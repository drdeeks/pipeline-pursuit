import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import GameCanvas from './GameCanvas'
import { useLeaderboard } from '../hooks/useLeaderboard'
import './Game.css'

const avatars = [
  { image: '/avatars/smantha.png', name: 'Smantha' },
  { image: '/avatars/fake0ne.png', name: 'Fake0ne' },
  { image: '/avatars/frycook.png', name: 'Frycook' },
  { image: '/avatars/nad-og.png', name: 'Nad-OG' },
  { image: '/avatars/mo.png', name: 'Mo' },
  { image: '/avatars/shitposter.png', name: 'Shitposter' },
]

interface GameStats {
  distance: number
  tokens: number
  maxSpeed: number
  bestRun: number
}

const Game: React.FC = () => {
  const { isConnected } = useAccount()
  const [showCharacterModal, setShowCharacterModal] = useState(true)
  const [selectedAvatarIdx, setSelectedAvatarIdx] = useState<number | undefined>(undefined)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({
    distance: 0,
    tokens: 0,
    maxSpeed: 1.0,
    bestRun: parseInt(localStorage.getItem('bestRun') || '0')
  })
  const { submitScore, isSubmittingScore } = useLeaderboard()

  const handleScoreUpdate = (score: number, tokens: number) => {
    setGameStats(prev => ({
      ...prev,
      distance: score,
      tokens: tokens,
      maxSpeed: Math.max(prev.maxSpeed, 1.0 + (score / 1000))
    }))
  }

  const handleGameEnd = (finalScore: number) => {
    if (finalScore > gameStats.bestRun) {
      const newBestRun = finalScore
      setGameStats(prev => ({ ...prev, bestRun: newBestRun }))
      localStorage.setItem('bestRun', newBestRun.toString())
    }
  }

  const handleStartGame = () => {
    setGameStarted(true)
  }

  const handleRestart = () => {
    setGameStarted(false)
  }

  const handleSubmitScore = () => {
    if (selectedAvatarIdx === undefined) return
    submitScore({
      score: gameStats.distance,
      playerName: avatars[selectedAvatarIdx].name,
      fid: 0 // Replace with real FID if available
    })
  }

  return (
    <div className="game-container">
      <h1 className="main-header">🐾 MONANIMAL TEMPLE DASH 🏛️</h1>
      {!gameStarted ? (
        <div className="game-start">
          <h2>Welcome to Pipeline Pursuit!</h2>
          <p>Choose your avatar and get ready to dash through the temple.</p>
          <button className="mega-button" onClick={() => setShowCharacterModal(true)}>
            🐾 Choose Avatar
          </button>
          <button
            className="start-game-btn"
            onClick={handleStartGame}
            disabled={selectedAvatarIdx === undefined}
            style={{ marginTop: 24 }}
          >
            🚀 Start Game
          </button>
        </div>
      ) : (
        <GameCanvas
          onScoreUpdate={handleScoreUpdate}
          onGameEnd={handleGameEnd}
          selectedCharacterImage={selectedAvatarIdx !== undefined ? avatars[selectedAvatarIdx].image : undefined}
        />
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🏃‍♂️</span>
          <div className="stat-label">DISTANCE</div>
          <div className="stat-value">{gameStats.distance}m</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div className="stat-label">MON TOKENS</div>
          <div className="stat-value">{gameStats.tokens}</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚀</span>
          <div className="stat-label">MAX SPEED</div>
          <div className="stat-value">{gameStats.maxSpeed.toFixed(1)}x</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <div className="stat-label">BEST RUN</div>
          <div className="stat-value">{gameStats.bestRun > 0 ? gameStats.bestRun + 'm' : '-'}</div>
        </div>
      </div>
      <div className="action-buttons">
        <button className="mega-button" onClick={() => {}}>
          📊 LEADERBOARD
        </button>
        <button className="mega-button" onClick={() => setShowCharacterModal(true)}>
          🐾 CHOOSE AVATAR
        </button>
        {isConnected && (
          <button
            className="mega-button submit-leaderboard-btn"
            onClick={handleSubmitScore}
            disabled={isSubmittingScore || !gameStats.distance}
          >
            🚀 SUBMIT TO LEADERBOARD
          </button>
        )}
        {gameStarted && (
          <button className="mega-button" onClick={handleRestart}>
            🔄 RESTART
          </button>
        )}
      </div>
      {/* Character Selection Modal */}
      {showCharacterModal && (
        <div className="screen-overlay active">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setShowCharacterModal(false)}
            >
              ×
            </button>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#fbbf24', fontSize: '28px' }}>
              🐾 Choose Your Avatar
            </h2>
            <div className="monanimal-selector">
              {/* Avatar image options */}
              {avatars.map((avatar, idx) => (
                <div
                  key={avatar.image}
                  className={`monanimal-option ${selectedAvatarIdx === idx ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatarIdx(idx)}
                >
                  <img src={avatar.image} alt={avatar.name} className="monanimal-avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fbbf24', background: '#fff' }} />
                  <div className="monanimal-name">{avatar.name}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                className="mega-button"
                onClick={() => setShowCharacterModal(false)}
                disabled={selectedAvatarIdx === undefined}
              >
                ✨ CONFIRM SELECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game 