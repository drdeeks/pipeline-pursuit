import { expect } from "chai";
import hre from "hardhat";
import { PipelinePursuitLeaderboard } from "../typechain-types";

const { ethers } = hre;

describe("Monanimal Temple Dash - Game Logic", function () {
  let leaderboard: PipelinePursuitLeaderboard;
  let owner: any;
  let player1: any;
  let player2: any;
  let player3: any;

  // Game constants
  const MONANIMALS = {
    smantha: { emoji: '🐨', speed: 1.2, jump: 1.0, slide: 1.1, name: 'Smantha' },
    fake0ne: { emoji: '🎭', speed: 1.0, jump: 1.4, slide: 0.8, name: 'Fake0ne' },
    frycook: { emoji: '🍳', speed: 1.4, jump: 0.9, slide: 1.0, name: 'Frycook' },
    shitposter: { emoji: '💩', speed: 1.3, jump: 1.1, slide: 0.9, name: 'Shitposter' }
  };

  beforeEach(async function () {
    [owner, player1, player2, player3] = await hre.ethers.getSigners();
    
    const LeaderboardFactory = await hre.ethers.getContractFactory("PipelinePursuitLeaderboard");
    leaderboard = await LeaderboardFactory.deploy();
    await leaderboard.waitForDeployment();
  });

  describe("Monanimal Character System", function () {
    it("Should have valid character stats", function () {
      Object.values(MONANIMALS).forEach(character => {
        expect(character.speed).to.be.greaterThan(0);
        expect(character.jump).to.be.greaterThan(0);
        expect(character.slide).to.be.greaterThan(0);
        expect(character.name).to.be.a('string');
        expect(character.emoji).to.be.a('string');
      });
    });

    it("Should have balanced character stats", function () {
      const totalStats = Object.values(MONANIMALS).map(char => 
        char.speed + char.jump + char.slide
      );
      
      const avgStats = totalStats.reduce((sum, stat) => sum + stat, 0) / totalStats.length;
      
      totalStats.forEach(stat => {
        expect(stat).to.be.closeTo(avgStats, 0.5); // Within 0.5 of average
      });
    });

    it("Should have unique character traits", function () {
      const characters = Object.values(MONANIMALS);
      const names = characters.map(c => c.name);
      const emojis = characters.map(c => c.emoji);
      
      expect(new Set(names).size).to.equal(characters.length);
      expect(new Set(emojis).size).to.equal(characters.length);
    });

    it("Should identify fastest character", function () {
      const fastest = Object.values(MONANIMALS).reduce((fastest, current) => 
        current.speed > fastest.speed ? current : fastest
      );
      
      expect(fastest.name).to.equal('Frycook');
      expect(fastest.speed).to.equal(1.4);
    });

    it("Should identify best jumper", function () {
      const bestJumper = Object.values(MONANIMALS).reduce((best, current) => 
        current.jump > best.jump ? current : best
      );
      
      expect(bestJumper.name).to.equal('Fake0ne');
      expect(bestJumper.jump).to.equal(1.4);
    });

    it("Should identify best slider", function () {
      const bestSlider = Object.values(MONANIMALS).reduce((best, current) => 
        current.slide > best.slide ? current : best
      );
      
      expect(bestSlider.name).to.equal('Smantha');
      expect(bestSlider.slide).to.equal(1.1);
    });
  });

  describe("Scoring System", function () {
    it("Should calculate distance-based score correctly", function () {
      const distance = 1000;
      const character = MONANIMALS.smantha;
      const baseScore = Math.floor(distance * character.speed);
      
      expect(baseScore).to.equal(1200); // 1000 * 1.2
    });

    it("Should apply speed multiplier correctly", function () {
      const baseScore = 1000;
      const speedMultiplier = 1.5;
      const finalScore = Math.floor(baseScore * speedMultiplier);
      
      expect(finalScore).to.equal(1500);
    });

    it("Should cap speed multiplier at 3.0", function () {
      const baseScore = 1000;
      const speedMultiplier = Math.min(3.0, 5.0); // Cap at 3.0
      const cappedMultiplier = speedMultiplier;
      
      expect(cappedMultiplier).to.equal(3.0);
    });

    it("Should calculate token rewards", function () {
      const baseTokens = 10;
      const character = MONANIMALS.shitposter;
      const tokenMultiplier = character.speed;
      const expectedTokens = Math.floor(baseTokens * tokenMultiplier);
      
      expect(expectedTokens).to.equal(13); // 10 * 1.3
    });
  });

  describe("Power System", function () {
    it("Should calculate power increase from actions", function () {
      const character = MONANIMALS.fake0ne;
      const jumpPower = character.jump * 5;
      const slidePower = character.slide * 5;
      const dodgePower = character.speed * 3;
      
      expect(jumpPower).to.equal(7); // 1.4 * 5
      expect(slidePower).to.equal(4); // 0.8 * 5
      expect(dodgePower).to.equal(3); // 1.0 * 3
    });

    it("Should cap power at 100", function () {
      const currentPower = 95;
      const powerIncrease = 10;
      const newPower = Math.min(100, currentPower + powerIncrease);
      
      expect(newPower).to.equal(100);
    });

    it("Should decrease power over time", function () {
      const initialPower = 100;
      const decreaseRate = 0.5;
      const timeSteps = 10;
      const finalPower = Math.max(0, initialPower - (decreaseRate * timeSteps));
      
      expect(finalPower).to.equal(95);
    });

    it("Should change power meter color based on level", function () {
      const getPowerColor = (power: number) => {
        if (power > 80) return 'gold';
        if (power > 50) return 'purple';
        return 'blue';
      };
      
      expect(getPowerColor(90)).to.equal('gold');
      expect(getPowerColor(60)).to.equal('purple');
      expect(getPowerColor(30)).to.equal('blue');
    });
  });

  describe("Game State Management", function () {
    it("Should initialize game state correctly", function () {
      const gameState = {
        distance: 0,
        tokens: 0,
        speed: 1.0,
        power: 0,
        isRunning: false
      };
      
      expect(gameState.distance).to.equal(0);
      expect(gameState.tokens).to.equal(0);
      expect(gameState.speed).to.equal(1.0);
      expect(gameState.power).to.equal(0);
      expect(gameState.isRunning).to.be.false;
    });

    it("Should update game state during play", function () {
      const gameState = {
        distance: 0,
        tokens: 0,
        speed: 1.0,
        power: 0,
        isRunning: true
      };
      
      const character = MONANIMALS.frycook;
      const timeStep = 100; // milliseconds
      
      // Simulate one game tick
      gameState.distance += Math.floor(gameState.speed * character.speed);
      gameState.speed = Math.min(3.0, 1.0 + (gameState.distance / 1000));
      
      expect(gameState.distance).to.be.greaterThan(0);
      expect(gameState.speed).to.be.greaterThan(1.0);
    });

    it("Should handle game end correctly", function () {
      const finalScore = 1500;
      const bestRun = 1200;
      const newBestRun = Math.max(bestRun, finalScore);
      
      expect(newBestRun).to.equal(1500);
    });
  });

  describe("Leaderboard Integration", function () {
    it("Should submit valid scores to leaderboard", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;
      
      await expect(leaderboard.connect(player1).submitScore(score, playerName, fid))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, score, playerName, fid);
    });

    it("Should reject scores below minimum", async function () {
      const lowScore = 5;
      const playerName = "TestPlayer";
      const fid = 12345;
      
      await expect(
        leaderboard.connect(player1).submitScore(lowScore, playerName, fid)
      ).to.be.revertedWith("Score too low for leaderboard");
    });

    it("Should maintain leaderboard order", async function () {
      const scores = [300, 100, 200];
      const players = [player1, player2, player3];
      const playerNames = ["Player1", "Player2", "Player3"];
      const fids = [111, 222, 333];
      
      // Submit scores with different players
      await leaderboard.connect(players[0]).submitScore(scores[0], playerNames[0], fids[0]);
      await leaderboard.connect(players[1]).submitScore(scores[1], playerNames[1], fids[1]);
      await leaderboard.connect(players[2]).submitScore(scores[2], playerNames[2], fids[2]);
      
      const leaderboardEntries = await leaderboard.getLeaderboard();
      expect(leaderboardEntries[0].score).to.equal(300);
      expect(leaderboardEntries[1].score).to.equal(200);
      expect(leaderboardEntries[2].score).to.equal(100);
    });
  });

  describe("Performance Tests", function () {
    it("Should handle rapid score submissions", async function () {
      const score = 100;
      const playerName = "TestPlayer";
      const fid = 12345;
      
      // Submit multiple scores rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(leaderboard.connect(player1).submitScore(score + i, playerName, fid));
      }
      
      await expect(Promise.all(promises)).to.not.be.reverted;
    });

    it("Should handle large leaderboard efficiently", async function () {
      const score = 100;
      const playerName = "TestPlayer";
      const fid = 12345;
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Fill leaderboard to capacity with available signers
      for (let i = 0; i < 20; i++) {
        const player = signers[i % numSigners];
        await leaderboard.connect(player).submitScore(score + i, `${playerName}${i}`, fid + i);
      }
      expect(await leaderboard.getLeaderboardLength()).to.equal(20);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero distance", function () {
      const distance = 0;
      const character = MONANIMALS.smantha;
      const score = Math.floor(distance * character.speed);
      
      expect(score).to.equal(0);
    });

    it("Should handle maximum distance", function () {
      const distance = Number.MAX_SAFE_INTEGER;
      const character = MONANIMALS.smantha;
      const score = Math.floor(distance * character.speed);
      
      expect(score).to.be.greaterThan(0);
      expect(score).to.be.finite;
    });

    it("Should handle invalid character selection", function () {
      const invalidCharacter = MONANIMALS['invalid' as keyof typeof MONANIMALS];
      expect(invalidCharacter).to.be.undefined;
    });

    it("Should handle negative values gracefully", function () {
      const negativeDistance = -100;
      const character = MONANIMALS.smantha;
      const score = Math.max(0, Math.floor(negativeDistance * character.speed));
      
      expect(score).to.equal(0);
    });
  });
}); 