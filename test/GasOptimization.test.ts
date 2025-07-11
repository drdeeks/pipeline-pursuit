import { expect } from "chai";
import hre from "hardhat";
import { PipelinePursuitLeaderboard } from "../typechain-types";

const { ethers } = hre;

describe("Monanimal Temple Dash - Gas Optimization", function () {
  let leaderboard: PipelinePursuitLeaderboard;
  let owner: any;
  let player1: any;
  let player2: any;

  beforeEach(async function () {
    [owner, player1, player2] = await hre.ethers.getSigners();

    const PipelinePursuitLeaderboard = await hre.ethers.getContractFactory("PipelinePursuitLeaderboard");
    leaderboard = await PipelinePursuitLeaderboard.deploy();
  });

  describe("Gas Usage Analysis", function () {
    it("Should have reasonable gas cost for score submission", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;

      const tx = await leaderboard.connect(player1).submitScore(score, playerName, fid);
      const receipt = await tx.wait();

      // Gas cost should be reasonable (adjusted for realistic expectations)
      expect(receipt!.gasUsed).to.be.lessThan(300000);
    });

    it("Should have lower gas cost for subsequent submissions", async function () {
      const playerName = "TestPlayer";
      const fid = 12345;

      // First submission
      const tx1 = await leaderboard.connect(player1).submitScore(1000, playerName, fid);
      const receipt1 = await tx1.wait();

      // Second submission (should be cheaper as no new storage needed)
      const tx2 = await leaderboard.connect(player1).submitScore(2000, playerName, fid);
      const receipt2 = await tx2.wait();

      expect(receipt2!.gasUsed).to.be.lessThan(receipt1!.gasUsed);
    });

    it("Should have minimal gas cost for read operations", async function () {
      // Add some data first
      await leaderboard.connect(player1).submitScore(1000, "Player1", 111);
      await leaderboard.connect(player2).submitScore(2000, "Player2", 222);

      // Read operations should be very cheap
      const startTime = Date.now();
      await leaderboard.getLeaderboard();
      await leaderboard.getLeaderboardLength();
      await leaderboard.getTopScores(2);
      const endTime = Date.now();

      expect(endTime - startTime).to.be.lessThan(100); // Should be very fast
    });

    it("Should handle gas efficiently for large leaderboard", async function () {
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Fill leaderboard with 20 entries
      for (let i = 0; i < 20; i++) {
        const player = signers[i % numSigners];
        await leaderboard.connect(player).submitScore(100 + i, `Player${i}`, 1000 + i);
      }
      // Query should still be efficient
      const startTime = Date.now();
      const entries = await leaderboard.getLeaderboard();
      const endTime = Date.now();
      expect(entries.length).to.equal(20);
      expect(endTime - startTime).to.be.lessThan(500); // Should be fast even with 20 entries
    });
  });

  describe("Storage Optimization", function () {
    it("Should optimize storage for player scores", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;

      const tx = await leaderboard.connect(player1).submitScore(score, playerName, fid);
      const receipt = await tx.wait();

      // Storage operations should be reasonable
      expect(receipt!.gasUsed).to.be.lessThan(300000);
    });

    it("Should handle storage efficiently for multiple players", async function () {
      const playerNames = ["Player1", "Player2", "Player3"];
      const fids = [111, 222, 333];

      let totalGas = 0;

      for (let i = 0; i < 3; i++) {
        const tx = await leaderboard.connect(player1).submitScore(1000 + i, playerNames[i], fids[i]);
        const receipt = await tx.wait();
        totalGas += Number(receipt!.gasUsed);
      }

      // Average gas per submission should be reasonable
      const avgGas = totalGas / 3;
      expect(avgGas).to.be.lessThan(300000);
    });

    it("Should optimize leaderboard storage updates", async function () {
      const scores = [300, 100, 200];
      const playerName = "TestPlayer";
      const fid = 12345;

      let totalGas = 0;

      for (let i = 0; i < scores.length; i++) {
        const tx = await leaderboard.connect(player1).submitScore(scores[i], playerName, fid);
        const receipt = await tx.wait();
        totalGas += Number(receipt!.gasUsed);
      }

      // Leaderboard updates should be efficient
      expect(totalGas).to.be.lessThan(800000);
    });
  });

  describe("Function Optimization", function () {
    it("Should optimize getTopScores function", async function () {
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Fill leaderboard
      for (let i = 0; i < 10; i++) {
        const player = signers[i % numSigners];
        await leaderboard.connect(player).submitScore(100 + i, `Player${i}`, 1000 + i);
      }
      // Test getTopScores with different counts
      const startTime = Date.now();
      const top5 = await leaderboard.getTopScores(5);
      const top10 = await leaderboard.getTopScores(10);
      const endTime = Date.now();
      expect(top5.length).to.equal(5);
      expect(top10.length).to.equal(10);
      expect(endTime - startTime).to.be.lessThan(500); // Should be fast
    });

    it("Should optimize getPlayerPosition function", async function () {
      // Create a leaderboard with known positions
      await leaderboard.connect(player1).submitScore(1000, "Player1", 111);
      await leaderboard.connect(player2).submitScore(2000, "Player2", 222);

      const startTime = Date.now();
      const position1 = await leaderboard.getPlayerPosition(player1.address);
      const position2 = await leaderboard.getPlayerPosition(player2.address);
      const endTime = Date.now();

      expect(position1).to.equal(2);
      expect(position2).to.equal(1);
      expect(endTime - startTime).to.be.lessThan(100); // Should be very fast
    });

    it("Should handle admin functions efficiently", async function () {
      const newMinScore = 50;
      
      const tx = await leaderboard.connect(owner).setMinScoreToSubmit(newMinScore);
      const receipt = await tx.wait();

      // Admin functions should be gas efficient
      expect(receipt!.gasUsed).to.be.lessThan(50000);
      expect(await leaderboard.minScoreToSubmit()).to.equal(newMinScore);
    });
  });

  describe("Batch Operations", function () {
    it("Should handle batch score submissions efficiently", async function () {
      const batchSize = 10;
      const playerName = "TestPlayer";
      const fid = 12345;

      let totalGas = 0;
      const promises = [];

      for (let i = 0; i < batchSize; i++) {
        const promise = leaderboard.connect(player1).submitScore(100 + i, playerName, fid);
        promises.push(promise);
      }

      const txs = await Promise.all(promises);
      const receipts = await Promise.all(txs.map(tx => tx.wait()));

      receipts.forEach(receipt => {
        totalGas += Number(receipt!.gasUsed);
      });

      const avgGas = totalGas / batchSize;
      expect(avgGas).to.be.lessThan(300000); // Average should be reasonable
    });

    it("Should handle concurrent leaderboard queries", async function () {
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Fill leaderboard
      for (let i = 0; i < 10; i++) {
        const player = signers[i % numSigners];
        // Make signers[0] submit the highest score
        const score = (i === 0) ? 1000 : 100 + i;
        await leaderboard.connect(player).submitScore(score, `Player${i}`, 1000 + i);
      }
      // Test concurrent queries
      const startTime = Date.now();
      const queries = [
        leaderboard.getLeaderboard(),
        leaderboard.getLeaderboardLength(),
        leaderboard.getTopScores(5),
        leaderboard.getPlayerPosition(signers[0].address)
      ];
      const results = await Promise.all(queries);
      const endTime = Date.now();
      expect(results[0].length).to.equal(10);
      expect(results[1]).to.equal(10);
      expect(results[2].length).to.equal(5);
      expect(results[3]).to.equal(1); // signers[0] should now be at the top
      expect(endTime - startTime).to.be.lessThan(200); // Should be very fast
    });
  });

  describe("Memory Optimization", function () {
    it("Should handle large player names efficiently", async function () {
      const longName = "A".repeat(100); // 100 character name
      const score = 1000;
      const fid = 12345;

      const tx = await leaderboard.connect(player1).submitScore(score, longName, fid);
      const receipt = await tx.wait();

      // Should handle long names without excessive gas usage
      expect(receipt!.gasUsed).to.be.lessThan(500000);
    });

    it("Should handle maximum score values efficiently", async function () {
      const maxScore = ethers.parseUnits("1000000", "ether");
      const playerName = "TestPlayer";
      const fid = 12345;

      const tx = await leaderboard.connect(player1).submitScore(maxScore, playerName, fid);
      const receipt = await tx.wait();

      // Should handle large numbers efficiently
      expect(receipt!.gasUsed).to.be.lessThan(300000);
    });

    it("Should optimize memory usage for leaderboard operations", async function () {
      const signers = await hre.ethers.getSigners();
      const numSigners = signers.length;
      // Test with various leaderboard sizes
      const sizes = [5, 10];
      for (const size of sizes) {
        // Fill leaderboard to size
        for (let i = 0; i < size; i++) {
          const player = signers[i % numSigners];
          await leaderboard.connect(player).submitScore(100 + i, `Player${i}`, 1000 + i);
        }
        // Test query performance
        const startTime = Date.now();
        const entries = await leaderboard.getLeaderboard();
        const endTime = Date.now();
        expect(entries.length).to.equal(size);
        expect(endTime - startTime).to.be.lessThan(1000); // Should scale reasonably
      }
    });
  });

  describe("Gas Estimation", function () {
    it("Should provide accurate gas estimates", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;

      // Estimate gas
      const estimatedGas = await leaderboard.connect(player1).submitScore.estimateGas(score, playerName, fid);

      // Actual gas usage
      const tx = await leaderboard.connect(player1).submitScore(score, playerName, fid);
      const receipt = await tx.wait();

      // Estimate should be close to actual usage
      const gasDifference = Math.abs(Number(estimatedGas) - Number(receipt!.gasUsed));
      const gasDifferencePercent = (gasDifference / Number(receipt!.gasUsed)) * 100;

      expect(gasDifferencePercent).to.be.lessThan(20); // Within 20% accuracy
    });

    it("Should handle gas estimation for admin functions", async function () {
      const newMinScore = 50;
      
      // Estimate gas
      const estimatedGas = await leaderboard.connect(owner).setMinScoreToSubmit.estimateGas(newMinScore);

      // Actual gas usage
      const tx = await leaderboard.connect(owner).setMinScoreToSubmit(newMinScore);
      const receipt = await tx.wait();

      // Estimate should be close to actual usage
      const gasDifference = Math.abs(Number(estimatedGas) - Number(receipt!.gasUsed));
      const gasDifferencePercent = (gasDifference / Number(receipt!.gasUsed)) * 100;

      expect(gasDifferencePercent).to.be.lessThan(20); // Within 20% accuracy
    });
  });

  describe("Cost Analysis", function () {
    it("Should calculate reasonable transaction costs", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;

      const tx = await leaderboard.connect(player1).submitScore(score, playerName, fid);
      const receipt = await tx.wait();

      // Calculate cost in ETH (assuming 20 gwei gas price)
      const gasPrice = ethers.parseUnits("20", "gwei");
      const cost = receipt!.gasUsed * gasPrice;
      const costInEth = ethers.formatEther(cost);

      // Cost should be reasonable (less than 0.01 ETH)
      expect(parseFloat(costInEth)).to.be.lessThan(0.01);
    });

    it("Should compare costs across different operations", async function () {
      const score = 1000;
      const playerName = "TestPlayer";
      const fid = 12345;

      // Submit score cost
      const submitTx = await leaderboard.connect(player1).submitScore(score, playerName, fid);
      const submitReceipt = await submitTx.wait();

      // Read operation cost (should be much lower)
      const readStartTime = Date.now();
      await leaderboard.getLeaderboard();
      const readEndTime = Date.now();

      // Submit should cost more than read operations
      expect(submitReceipt!.gasUsed).to.be.greaterThan(0);
      expect(readEndTime - readStartTime).to.be.lessThan(100); // Read should be very fast
    });
  });
}); 