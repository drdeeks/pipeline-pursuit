import React from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { formatDistanceToNow } from 'date-fns'
import './Leaderboard.css'

const Leaderboard: React.FC = () => {
  const {
    leaderboard,
    playerScore,
    playerPosition,
    isLoadingLeaderboard,
    isLoadingPlayerScore,
  } = useLeaderboard()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  if (isLoadingLeaderboard) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
        </div>
        <div className="loading">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        <p>Top Pipeline Pursuit players on Monad Testnet</p>
      </div>

      {/* Player's current stats */}
      {playerScore && (
        <div className="player-stats">
          <h3>Your Stats</h3>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-label">Best Score</span>
              <span className="stat-value">{Number(playerScore.score)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Position</span>
              <span className="stat-value">
                {playerPosition > 0 ? `#${playerPosition}` : 'Not ranked'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Last Played</span>
              <span className="stat-value">{formatTimestamp(playerScore.timestamp)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="leaderboard-table">
        <div className="table-header">
          <div className="header-rank">Rank</div>
          <div className="header-player">Player</div>
          <div className="header-score">Score</div>
          <div className="header-time">Time</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="no-scores">
            <p>No scores submitted yet. Be the first to play!</p>
          </div>
        ) : (
          <div className="table-body">
            {leaderboard.slice(0, 20).map((entry, index) => (
              <div
                key={`${entry.player}-${entry.timestamp}`}
                className={`table-row ${playerPosition === index + 1 ? 'current-player' : ''}`}
              >
                <div className="rank">
                  {index + 1 === 1 && '🥇'}
                  {index + 1 === 2 && '🥈'}
                  {index + 1 === 3 && '🥉'}
                  {index + 1 > 3 && `#${index + 1}`}
                </div>
                <div className="player">
                  <div className="player-name">{entry.playerName}</div>
                  <div className="player-address">{formatAddress(entry.player)}</div>
                  {entry.fid > 0 && (
                    <div className="player-fid">FID: {Number(entry.fid)}</div>
                  )}
                </div>
                <div className="score">{Number(entry.score)}</div>
                <div className="time">{formatTimestamp(entry.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network info */}
      <div className="network-info">
        <p>📡 Powered by Monad Testnet</p>
        <p>🔗 Contract: {formatAddress('0x...')} {/* Replace with actual contract address */}</p>
      </div>
    </div>
  )
}

export default Leaderboard 