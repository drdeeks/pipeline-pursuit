import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import GameCanvas from './GameCanvas'
import Leaderboard from './Leaderboard'
import './Game.css'

interface GameStats {
  distance: number
  tokens: number
  maxSpeed: number
  bestRun: number
}

const Game: React.FC = () => {
  const { address, isConnected } = useAccount()
  const [currentScore, setCurrentScore] = useState(0)
  const [gameStats, setGameStats] = useState<GameStats>({
    distance: 0,
    tokens: 0,
    maxSpeed: 1.0,
    bestRun: parseInt(localStorage.getItem('bestRun') || '0')
  })
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showCharacterModal, setShowCharacterModal] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState('smantha')

  const monanimals = {
    smantha: { emoji: '🐨', speed: 1.2, jump: 1.0, slide: 1.1, name: 'Smantha' },
    fake0ne: { emoji: '🎭', speed: 1.0, jump: 1.4, slide: 0.8, name: 'Fake0ne' },
    frycook: { emoji: '🍳', speed: 1.4, jump: 0.9, slide: 1.0, name: 'Frycook' },
    'nad-og': { emoji: '👑', speed: 0.9, jump: 1.2, slide: 1.3, name: 'Nad-OG' },
    mo: { emoji: '🎯', speed: 1.1, jump: 1.1, slide: 1.2, name: 'Mo' },
    shitposter: { emoji: '💩', speed: 1.3, jump: 1.3, slide: 0.7, name: 'Shitposter' }
  }

  const handleScoreUpdate = (score: number) => {
    setCurrentScore(score)
    setGameStats(prev => ({
      ...prev,
      distance: score,
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

  const selectCharacter = (characterId: string) => {
    setSelectedCharacter(characterId)
  }

  return (
    <div className="game-container">
      <h1 className="main-header">🐾 MONANIMAL TEMPLE DASH 🏛️</h1>
      
      <GameCanvas 
        onScoreUpdate={handleScoreUpdate}
        onGameEnd={handleGameEnd}
        selectedCharacter={selectedCharacter}
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
          onClick={() => setShowLeaderboard(!showLeaderboard)}
        >
          📊 LEADERBOARD
        </button>
        <button 
          className="mega-button" 
          onClick={() => setShowCharacterModal(true)}
        >
          🐾 CHOOSE MONANIMAL
        </button>
        {isConnected && (
          <button className="mega-button">
            🚀 SUBMIT TO LEADERBOARD
          </button>
        )}
      </div>
      
      {showLeaderboard && (
        <div className="leaderboard-container">
          <Leaderboard />
        </div>
      )}
      
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
              🐾 Choose Your Monanimal
            </h2>
            
            <div className="monanimal-selector">
              {Object.entries(monanimals).map(([id, character]) => (
                <div 
                  key={id}
                  className={`monanimal-option ${selectedCharacter === id ? 'selected' : ''}`}
                  onClick={() => selectCharacter(id)}
                >
                  <div className="monanimal-avatar">{character.emoji}</div>
                  <div className="monanimal-name">{character.name}</div>
                  <div className="monanimal-trait">
                    {id === 'smantha' && 'Balanced Runner'}
                    {id === 'fake0ne' && 'High Jumper'}
                    {id === 'frycook' && 'Speed Demon'}
                    {id === 'nad-og' && 'Slide Master'}
                    {id === 'mo' && 'Precision Runner'}
                    {id === 'shitposter' && 'Chaos Agent'}
                  </div>
                  <div className="monanimal-stats">
                    <div className="mini-stat">Speed: {character.speed}</div>
                    <div className="mini-stat">Jump: {character.jump}</div>
                    <div className="mini-stat">Slide: {character.slide}</div>
                  </div>
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