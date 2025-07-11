import { expect } from "chai";
import hre from "hardhat";
import { PipelinePursuitLeaderboard } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("PipelinePursuitLeaderboard", function () {
  let leaderboard: PipelinePursuitLeaderboard;
  let owner: HardhatEthersSigner;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let player3: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await hre.ethers.getSigners();
    
    const LeaderboardFactory = await hre.ethers.getContractFactory("PipelinePursuitLeaderboard");
    leaderboard = await LeaderboardFactory.deploy();
    await leaderboard.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await leaderboard.owner()).to.equal(owner.address);
    });

    it("Should have correct minimum score requirement", async function () {
      expect(await leaderboard.minScoreToSubmit()).to.equal(10);
    });

    it("Should start with empty leaderboard", async function () {
      expect(await leaderboard.getLeaderboardLength()).to.equal(0);
    });
  });

  describe("Score Submission", function () {
    it("Should allow valid score submission", async function () {
      const score = 100;
      const playerName = "TestPlayer";
      const fid = 12345;

      await expect(leaderboard.connect(player1).submitScore(score, playerName, fid))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, score, playerName, fid);

      const playerScore = await leaderboard.getPlayerScore(player1.address);
      expect(playerScore.score).to.equal(score);
      expect(playerScore.playerName).to.equal(playerName);
      expect(playerScore.fid).to.equal(fid);
    });

    it("Should reject score below minimum", async function () {
      const lowScore = 5;
      const playerName = "TestPlayer";
      const fid = 12345;

      await expect(
        leaderboard.connect(player1).submitScore(lowScore, playerName, fid)
      ).to.be.revertedWith("Score too low for leaderboard");
    });

    it("Should reject empty player name", async function () {
      const score = 100;
      const emptyName = "";
      const fid = 12345;

      await expect(
        leaderboard.connect(player1).submitScore(score, emptyName, fid)
      ).to.be.revertedWith("Player name cannot be empty");
    });

    it("Should only update score if new score is higher", async function () {
      const score1 = 100;
      const score2 = 50; // Lower score
      const playerName = "TestPlayer";
      const fid = 12345;

      // Submit first score
      await leaderboard.connect(player1).submitScore(score1, playerName, fid);
      
      // Submit lower score
      await leaderboard.connect(player1).submitScore(score2, playerName, fid);

      const playerScore = await leaderboard.getPlayerScore(player1.address);
      expect(playerScore.score).to.equal(score1); // Should keep the higher score
    });

    it("Should update score if new score is higher", async function () {
      const score1 = 100;
      const score2 = 200; // Higher score
      const playerName = "TestPlayer";
      const fid = 12345;

      // Submit first score
      await leaderboard.connect(player1).submitScore(score1, playerName, fid);
      
      // Submit higher score
      await expect(leaderboard.connect(player1).submitScore(score2, playerName, fid))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, score2, playerName, fid);

      const playerScore = await leaderboard.getPlayerScore(player1.address);
      expect(playerScore.score).to.equal(score2);
    });
  });

  describe("Leaderboard Management", function () {
    it("Should maintain correct leaderboard order", async function () {
      const scores = [300, 100, 200];
      const players = [player1, player2, player3];
      const playerNames = ["Player1", "Player2", "Player3"];
      const fids = [111, 222, 333];

      // Submit scores in random order
      await leaderboard.connect(players[1]).submitScore(scores[1], playerNames[1], fids[1]);
      await leaderboard.connect(players[0]).submitScore(scores[0], playerNames[0], fids[0]);
      await leaderboard.connect(players[2]).submitScore(scores[2], playerNames[2], fids[2]);

      const leaderboardEntries = await leaderboard.getLeaderboard();
      
      // Should be sorted by score (highest first)
      expect(leaderboardEntries[0].score).to.equal(300);
      expect(leaderboardEntries[0].player).to.equal(player1.address);
      expect(leaderboardEntries[1].score).to.equal(200);
      expect(leaderboardEntries[1].player).to.equal(player3.address);
      expect(leaderboardEntries[2].score).to.equal(100);
      expect(leaderboardEntries[2].player).to.equal(player2.address);
    });

    it("Should update player position when score improves", async function () {
      const initialScore = 100;
      const improvedScore = 250;
      const playerName = "TestPlayer";
      const fid = 12345;

      // Player2 submits first
      await leaderboard.connect(player2).submitScore(initialScore, playerName, fid);
      
      // Player1 submits higher score
      await leaderboard.connect(player1).submitScore(improvedScore, playerName, fid);
      
      // Player2 improves their score
      await leaderboard.connect(player2).submitScore(improvedScore + 50, playerName, fid);

      const leaderboardEntries = await leaderboard.getLeaderboard();
      
      // Player2 should now be first
      expect(leaderboardEntries[0].player).to.equal(player2.address);
      expect(leaderboardEntries[0].score).to.equal(improvedScore + 50);
      expect(leaderboardEntries[1].player).to.equal(player1.address);
      expect(leaderboardEntries[1].score).to.equal(improvedScore);
    });

    it("Should limit leaderboard to 20 entries", async function () {
      const score = 100;
      const playerName = "TestPlayer";
      const fid = 12345;
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Submit 21 scores with different players
      for (let i = 0; i < 21; i++) {
        const player = signers[i % numSigners];
        await leaderboard.connect(player).submitScore(score + i, `${playerName}${i}`, fid + i);
      }
      expect(await leaderboard.getLeaderboardLength()).to.equal(20);
      const leaderboardEntries = await leaderboard.getLeaderboard();
      expect(leaderboardEntries.length).to.equal(20);
      // Highest score should be first
      expect(leaderboardEntries[0].score).to.equal(120); // 100 + 20
    });

    it("Should return 0 for player not in leaderboard", async function () {
      const signers = await hre.ethers.getSigners();
      // Use a new address not in the leaderboard
      const newWallet = hre.ethers.Wallet.createRandom();
      expect(await leaderboard.getPlayerPosition(newWallet.address)).to.equal(0);
    });

    it("Should return correct top scores", async function () {
      // Setup: submit three scores
      await leaderboard.connect(player1).submitScore(300, "Player1", 111);
      await leaderboard.connect(player2).submitScore(200, "Player2", 222);
      await leaderboard.connect(player3).submitScore(100, "Player3", 333);
      const top2 = await leaderboard.getTopScores(2);
      expect(top2.length).to.equal(2);
      expect(top2[0].score).to.equal(300);
      expect(top2[1].score).to.equal(200);
    });

    it("Should handle getTopScores with count larger than leaderboard", async function () {
      // Setup: submit three scores
      await leaderboard.connect(player1).submitScore(300, "Player1", 111);
      await leaderboard.connect(player2).submitScore(200, "Player2", 222);
      await leaderboard.connect(player3).submitScore(100, "Player3", 333);
      const top10 = await leaderboard.getTopScores(10);
      expect(top10.length).to.equal(3); // Only 3 entries exist
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to change minimum score", async function () {
      const newMinScore = 50;
      await leaderboard.connect(owner).setMinScoreToSubmit(newMinScore);
      expect(await leaderboard.minScoreToSubmit()).to.equal(newMinScore);
    });

    it("Should prevent non-owner from changing minimum score", async function () {
      const newMinScore = 50;
      await expect(
        leaderboard.connect(player1).setMinScoreToSubmit(newMinScore)
      ).to.be.revertedWithCustomError(leaderboard, "OwnableUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very large scores", async function () {
      const largeScore = ethers.parseUnits("1000000", "ether");
      const playerName = "TestPlayer";
      const fid = 12345;

      await expect(leaderboard.connect(player1).submitScore(largeScore, playerName, fid))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, largeScore, playerName, fid);
    });

    it("Should handle long player names", async function () {
      const longName = "A".repeat(100); // 100 character name
      const score = 100;
      const fid = 12345;

      await expect(leaderboard.connect(player1).submitScore(score, longName, fid))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, score, longName, fid);
    });

    it("Should handle zero FID", async function () {
      const score = 100;
      const playerName = "TestPlayer";
      const fid = 0;

      await expect(leaderboard.connect(player1).submitScore(score, playerName, fid))
        .to.emit(leaderboard, "ScoreSubmitted")
        .withArgs(player1.address, score, playerName, fid);
    });
  });
}); 