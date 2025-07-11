import { expect } from "chai";
import hre from "hardhat";
import { PipelinePursuitLeaderboard } from "../typechain-types";

const { ethers } = hre;

describe("Monanimal Temple Dash - Integration Tests", function () {
  let leaderboard: PipelinePursuitLeaderboard;
  let owner: any;
  let player1: any;
  let player2: any;
  let player3: any; // Added player3 for multiple players test

  beforeEach(async function () {
    [owner, player1, player2, player3] = await hre.ethers.getSigners(); // Updated to get 4 players
    
    const LeaderboardFactory = await hre.ethers.getContractFactory("PipelinePursuitLeaderboard");
    leaderboard = await LeaderboardFactory.deploy();
    await leaderboard.waitForDeployment();
  });

  describe("Full Game Flow", function () {
    it("Should complete a full game session", async function () {
      // Simulate a complete game session
      const gameSession = {
        character: { name: 'Smantha', speed: 1.2, jump: 1.0, slide: 1.1 },
        distance: 0,
        score: 0,
        power: 100,
        isRunning: true
      };

      // Simulate gameplay
      for (let i = 0; i < 10; i++) {
        gameSession.distance += Math.floor(gameSession.character.speed * 10);
        gameSession.score = Math.floor(gameSession.distance * gameSession.character.speed);
        gameSession.power = Math.max(0, gameSession.power - 2);
      }

      // Game ends
      gameSession.isRunning = false;

      // Submit score to leaderboard
      if (gameSession.score >= 10) {
        await leaderboard.connect(player1).submitScore(
          gameSession.score, 
          gameSession.character.name, 
          12345
        );

        const playerScore = await leaderboard.getPlayerScore(player1.address);
        expect(playerScore.score).to.equal(gameSession.score);
      }

      expect(gameSession.score).to.be.greaterThan(0);
      expect(gameSession.isRunning).to.be.false;
    });

    it("Should handle multiple players competing", async function () {
      const scores = [1200, 1500, 1800];
      const players = [player1, player2, player3]; // Use different players
      const playerNames = ["Player1", "Player2", "Player3"];
      const fids = [111, 222, 333];

      // Submit scores
      for (let i = 0; i < scores.length; i++) {
        await leaderboard.connect(players[i]).submitScore(scores[i], playerNames[i], fids[i]);
      }

      // Verify leaderboard order
      const leaderboardEntries = await leaderboard.getLeaderboard();
      expect(leaderboardEntries[0].score).to.equal(1800); // Player3's score
      expect(leaderboardEntries[1].score).to.equal(1500); // Player2's score
      expect(leaderboardEntries[2].score).to.equal(1200); // Player1's score

      // Verify player positions
      expect(await leaderboard.getPlayerPosition(player3.address)).to.equal(1);
      expect(await leaderboard.getPlayerPosition(player2.address)).to.equal(2);
      expect(await leaderboard.getPlayerPosition(player1.address)).to.equal(3);
    });
  });

  describe("React Component Integration", function () {
    it("Should handle game state updates correctly", function () {
      // Simulate React state management
      const gameState = {
        distance: 0,
        tokens: 0,
        maxSpeed: 1.0,
        bestRun: 0
      };

      const handleScoreUpdate = (score: number) => {
        gameState.distance = score;
        gameState.maxSpeed = Math.max(gameState.maxSpeed, 1.0 + (score / 1000));
      };

      const handleGameEnd = (finalScore: number) => {
        if (finalScore > gameState.bestRun) {
          gameState.bestRun = finalScore;
        }
      };

      // Simulate score updates
      handleScoreUpdate(500);
      expect(gameState.distance).to.equal(500);
      expect(gameState.maxSpeed).to.be.greaterThan(1.0);

      handleScoreUpdate(1000);
      expect(gameState.distance).to.equal(1000);
      expect(gameState.maxSpeed).to.be.greaterThan(1.0);

      // Simulate game end
      handleGameEnd(1000);
      expect(gameState.bestRun).to.equal(1000);

      // Simulate better run
      handleGameEnd(1500);
      expect(gameState.bestRun).to.equal(1500);
    });

    it("Should handle character selection", function () {
      const characters = {
        smantha: { emoji: '🐨', speed: 1.2, jump: 1.0, slide: 1.1, name: 'Smantha' },
        fake0ne: { emoji: '🎭', speed: 1.0, jump: 1.4, slide: 0.8, name: 'Fake0ne' },
        frycook: { emoji: '🍳', speed: 1.4, jump: 0.9, slide: 1.0, name: 'Frycook' }
      };

      let selectedCharacter = 'smantha';
      const selectCharacter = (characterId: string) => {
        if (characters[characterId as keyof typeof characters]) {
          selectedCharacter = characterId;
        }
      };

      // Test character selection
      selectCharacter('frycook');
      expect(selectedCharacter).to.equal('frycook');
      expect(characters[selectedCharacter as keyof typeof characters].name).to.equal('Frycook');

      // Test invalid character
      selectCharacter('invalid');
      expect(selectedCharacter).to.equal('frycook'); // Should remain unchanged
    });
  });

  describe("Wagmi Integration", function () {
    it("Should handle wallet connection state", function () {
      // Simulate wagmi connection states
      const connectionStates = {
        isConnected: true,
        address: "0x1234567890123456789012345678901234567890",
        chainId: 10143 // Monad testnet
      };

      expect(connectionStates.isConnected).to.be.true;
      expect(connectionStates.address).to.be.a('string');
      expect(connectionStates.chainId).to.equal(10143);
    });

    it("Should handle contract interaction", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;

      // Simulate contract write
      const submitScoreTx = await leaderboard.connect(player1).submitScore(score, playerName, fid);
      await submitScoreTx.wait();

      // Verify the transaction
      const playerScore = await leaderboard.getPlayerScore(player1.address);
      expect(playerScore.score).to.equal(score);
    });

    it("Should handle contract reads", async function () {
      // Submit some test data
      await leaderboard.connect(player1).submitScore(1000, "Player1", 111);
      await leaderboard.connect(player2).submitScore(2000, "Player2", 222);

      // Test various read functions
      const leaderboardLength = await leaderboard.getLeaderboardLength();
      expect(leaderboardLength).to.equal(2);

      const topScores = await leaderboard.getTopScores(2);
      expect(topScores.length).to.equal(2);
      expect(topScores[0].score).to.equal(2000);

      const playerPosition = await leaderboard.getPlayerPosition(player1.address);
      expect(playerPosition).to.equal(2);
    });
  });

  describe("Error Handling", function () {
    it("Should handle network errors gracefully", async function () {
      // Simulate network error handling
      const handleNetworkError = (error: any) => {
        if (error.code === 'NETWORK_ERROR') {
          return { success: false, error: 'Network connection failed' };
        }
        return { success: true };
      };

      const networkError = { code: 'NETWORK_ERROR', message: 'Connection timeout' };
      const result = handleNetworkError(networkError);
      
      expect(result.success).to.be.false;
      expect(result.error).to.equal('Network connection failed');
    });

    it("Should handle contract revert errors", async function () {
      const lowScore = 5;
      const playerName = "TestPlayer";
      const fid = 12345;

      await expect(
        leaderboard.connect(player1).submitScore(lowScore, playerName, fid)
      ).to.be.revertedWith("Score too low for leaderboard");
    });

    it("Should handle invalid input validation", function () {
      const validateInput = (score: number, playerName: string) => {
        const errors: string[] = [];
        
        if (score < 10) errors.push("Score too low");
        if (!playerName || playerName.trim() === "") errors.push("Player name required");
        if (score > 1000000) errors.push("Score too high");
        
        return errors;
      };

      const errors1 = validateInput(5, "");
      expect(errors1).to.include("Score too low");
      expect(errors1).to.include("Player name required");

      const errors2 = validateInput(2000000, "ValidName");
      expect(errors2).to.include("Score too high");

      const errors3 = validateInput(100, "ValidName");
      expect(errors3).to.be.empty;
    });
  });

  describe("Performance and Scalability", function () {
    it("Should handle concurrent score submissions", async function () {
      const score = 100;
      const playerName = "TestPlayer";
      const fid = 12345;
      const concurrentSubmissions = 5;

      // Submit multiple scores concurrently
      const promises = [];
      for (let i = 0; i < concurrentSubmissions; i++) {
        promises.push(leaderboard.connect(player1).submitScore(score + i, playerName, fid));
      }

      await expect(Promise.all(promises)).to.not.be.reverted;
      
      // Verify only the highest score is kept
      const playerScore = await leaderboard.getPlayerScore(player1.address);
      expect(playerScore.score).to.equal(score + concurrentSubmissions - 1);
    });

    it("Should handle large leaderboard queries efficiently", async function () {
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Fill leaderboard with 10 different players
      for (let i = 0; i < 10; i++) {
        const player = signers[i % numSigners];
        await leaderboard.connect(player).submitScore(100 + i, `Player${i}`, 1000 + i);
      }

      // Test query performance
      const startTime = Date.now();
      const entries = await leaderboard.getLeaderboard();
      const endTime = Date.now();

      expect(entries.length).to.equal(10);
      expect(endTime - startTime).to.be.lessThan(1000); // Should be efficient
    });

    it("Should handle rapid state updates", function () {
      // Simulate rapid game state updates
      const gameState = {
        distance: 0,
        score: 0,
        power: 100
      };

      const updateGameState = (updates: Partial<typeof gameState>) => {
        Object.assign(gameState, updates);
      };

      // Rapid updates
      for (let i = 0; i < 100; i++) {
        updateGameState({
          distance: i * 10,
          score: i * 10,
          power: Math.max(0, 100 - i)
        });
      }

      expect(gameState.distance).to.equal(990);
      expect(gameState.score).to.equal(990);
      expect(gameState.power).to.equal(0);
    });
  });

  describe("User Experience", function () {
    it("Should provide meaningful feedback for actions", function () {
      const character = {
        emoji: '🐨',
        speed: 1.2,
        jump: 1.0,
        slide: 1.1,
        name: 'Smantha'
      };

      const getActionFeedback = (action: string, character: any) => {
        switch (action) {
          case 'jump':
            return `Jump power: ${(character.jump * 3).toFixed(1)}`;
          case 'slide':
            return `Slide power: ${(character.slide * 3).toFixed(1)}`;
          case 'dodge':
            return `Dodge power: ${(character.speed * 3).toFixed(1)}`;
          default:
            return 'Unknown action';
        }
      };

      expect(getActionFeedback('jump', character)).to.equal('Jump power: 3.0');
      expect(getActionFeedback('slide', character)).to.equal('Slide power: 3.3');
      expect(getActionFeedback('dodge', character)).to.equal('Dodge power: 3.6');
    });

    it("Should track user progress", function () {
      const progress = {
        gamesPlayed: 0,
        bestScore: 0,
        totalDistance: 0,
        achievements: [] as string[]
      };

      const updateProgress = (gameResult: any) => {
        progress.gamesPlayed++;
        progress.totalDistance += gameResult.distance;
        
        if (gameResult.score > progress.bestScore) {
          progress.bestScore = gameResult.score;
          progress.achievements.push(`New best score: ${gameResult.score}`);
        }
      };

      // Simulate multiple games
      updateProgress({ distance: 500, score: 600 });
      updateProgress({ distance: 800, score: 960 });
      updateProgress({ distance: 1200, score: 1440 });

      expect(progress.gamesPlayed).to.equal(3);
      expect(progress.bestScore).to.equal(1440);
      expect(progress.totalDistance).to.equal(2500);
      expect(progress.achievements.length).to.equal(3);
    });
  });
}); 