// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PipelinePursuitLeaderboard is Ownable, ReentrancyGuard {
    struct Score {
        uint256 score;
        uint256 timestamp;
        string playerName;
        uint256 fid; // Farcaster ID
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
        uint256 timestamp;
        string playerName;
        uint256 fid;
    }

    // Mapping from player address to their score
    mapping(address => Score) public playerScores;
    
    // Array of leaderboard entries, sorted by score (highest first)
    LeaderboardEntry[] public leaderboard;
    
    // Minimum score required to submit to leaderboard
    uint256 public minScoreToSubmit = 10;
    
    // Maximum number of entries in leaderboard
    uint256 public maxLeaderboardSize = 100;

    event ScoreSubmitted(address indexed player, uint256 score, string playerName, uint256 fid);
    event MinScoreUpdated(uint256 newMinScore);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Submit a score to the leaderboard
     * @param _score The player's score
     * @param _playerName The player's name
     * @param _fid The player's Farcaster ID
     */
    function submitScore(uint256 _score, string memory _playerName, uint256 _fid) 
        external 
        nonReentrant 
    {
        require(_score >= minScoreToSubmit, "Score too low for leaderboard");
        require(bytes(_playerName).length > 0, "Player name cannot be empty");
        
        address player = msg.sender;
        Score storage currentScore = playerScores[player];
        
        // Only update if new score is higher
        if (_score > currentScore.score) {
            // Update player's score
            currentScore.score = _score;
            currentScore.timestamp = block.timestamp;
            currentScore.playerName = _playerName;
            currentScore.fid = _fid;
            
            // Update leaderboard
            _updateLeaderboard(player, _score, _playerName, _fid);
            
            emit ScoreSubmitted(player, _score, _playerName, _fid);
        }
    }

    /**
     * @dev Update the leaderboard with a new score
     */
    function _updateLeaderboard(address _player, uint256 _score, string memory _playerName, uint256 _fid) internal {
        // Find if player already exists in leaderboard
        int256 existingIndex = -1;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == _player) {
                existingIndex = int256(i);
                break;
            }
        }
        
        // Remove existing entry if found
        if (existingIndex >= 0) {
            _removeFromLeaderboard(uint256(existingIndex));
        }
        
        // Find correct position to insert new score
        uint256 insertIndex = leaderboard.length;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (_score > leaderboard[i].score) {
                insertIndex = i;
                break;
            }
        }
        
        // Insert new entry
        LeaderboardEntry memory newEntry = LeaderboardEntry({
            player: _player,
            score: _score,
            timestamp: block.timestamp,
            playerName: _playerName,
            fid: _fid
        });
        
        // Insert at correct position
        if (insertIndex == leaderboard.length) {
            leaderboard.push(newEntry);
        } else {
            // Shift elements to make room
            leaderboard.push(leaderboard[leaderboard.length - 1]);
            for (uint256 i = leaderboard.length - 1; i > insertIndex; i--) {
                leaderboard[i] = leaderboard[i - 1];
            }
            leaderboard[insertIndex] = newEntry;
        }
        
        // Trim leaderboard if it exceeds max size
        if (leaderboard.length > maxLeaderboardSize) {
            leaderboard.pop();
        }
    }

    /**
     * @dev Remove an entry from the leaderboard
     */
    function _removeFromLeaderboard(uint256 _index) internal {
        require(_index < leaderboard.length, "Index out of bounds");
        
        // Shift all elements after the index
        for (uint256 i = _index; i < leaderboard.length - 1; i++) {
            leaderboard[i] = leaderboard[i + 1];
        }
        leaderboard.pop();
    }

    /**
     * @dev Get the complete leaderboard
     */
    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    /**
     * @dev Get the length of the leaderboard
     */
    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    /**
     * @dev Get top N scores
     */
    function getTopScores(uint256 _count) external view returns (LeaderboardEntry[] memory) {
        uint256 count = _count > leaderboard.length ? leaderboard.length : _count;
        LeaderboardEntry[] memory topScores = new LeaderboardEntry[](count);
        
        for (uint256 i = 0; i < count; i++) {
            topScores[i] = leaderboard[i];
        }
        
        return topScores;
    }

    /**
     * @dev Get a player's position in the leaderboard (1-based, 0 if not found)
     */
    function getPlayerPosition(address _player) external view returns (uint256) {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == _player) {
                return i + 1; // 1-based indexing
            }
        }
        return 0; // Not found
    }

    /**
     * @dev Get a player's score
     */
    function getPlayerScore(address _player) external view returns (Score memory) {
        return playerScores[_player];
    }

    /**
     * @dev Set the minimum score required to submit (owner only)
     */
    function setMinScoreToSubmit(uint256 _minScore) external onlyOwner {
        minScoreToSubmit = _minScore;
        emit MinScoreUpdated(_minScore);
    }

    /**
     * @dev Set the maximum leaderboard size (owner only)
     */
    function setMaxLeaderboardSize(uint256 _maxSize) external onlyOwner {
        maxLeaderboardSize = _maxSize;
        
        // Trim leaderboard if it exceeds new max size
        while (leaderboard.length > maxLeaderboardSize) {
            leaderboard.pop();
        }
    }
} 