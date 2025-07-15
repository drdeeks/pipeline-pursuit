import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import GameCanvas from './GameCanvas'
import './Game.css'

const avatarImages = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
] // Add your images to public/avatars/

interface GameStats {
  distance: number
  tokens: number
  maxSpeed: number
  bestRun: number
}

const Game: React.FC = () => {
  const { isConnected } = useAccount()
  const [showCharacterModal, setShowCharacterModal] = useState(true)
  const [selectedCharacterImage, setSelectedCharacterImage] = useState<string | undefined>(undefined)
  const [gameStats, setGameStats] = useState<GameStats>({
    distance: 0,
    tokens: 0,
    maxSpeed: 1.0,
    bestRun: parseInt(localStorage.getItem('bestRun') || '0')
  })

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

  return (
    <div className="game-container">
      <h1 className="main-header">🐾 MONANIMAL TEMPLE DASH 🏛️</h1>
      
      <GameCanvas
        onScoreUpdate={handleScoreUpdate}
        onGameEnd={handleGameEnd}
        selectedCharacterImage={selectedCharacterImage}
      />
      
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
        <button 
          className="mega-button" 
          onClick={() => {}}
        >
          📊 LEADERBOARD
        </button>
        <button 
          className="mega-button" 
          onClick={() => setShowCharacterModal(true)}
        >
          🐾 CHOOSE AVATAR
        </button>
        {isConnected && (
          <button className="mega-button">
            🚀 SUBMIT TO LEADERBOARD
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
              {avatarImages.map((img, idx) => (
                <div
                  key={img}
                  className={`monanimal-option ${selectedCharacterImage === img ? 'selected' : ''}`}
                  onClick={() => setSelectedCharacterImage(img)}
                >
                  <img src={img} alt={`Avatar ${idx + 1}`} className="monanimal-avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fbbf24', background: '#fff' }} />
                  <div className="monanimal-name">Avatar {idx + 1}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                className="mega-button"
                onClick={() => setShowCharacterModal(false)}
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