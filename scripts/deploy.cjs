const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PipelinePursuitLeaderboard to Monad Testnet...");

  // Check if private key is available
  if (!process.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required for deployment");
  }

  console.log("🔑 Private key found:", process.env.PRIVATE_KEY.substring(0, 10) + "...");

  // Get deployer account
  const signers = await ethers.getSigners();
  if (!signers || signers.length === 0) {
    throw new Error("No signers available. Check your private key configuration.");
  }
  
  const [deployer] = signers;
  console.log("📋 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MONAD");

  if (balance === 0n) {
    throw new Error("Insufficient balance. Please fund your account with MONAD testnet tokens.");
  }

  // Get contract factory
  const PipelinePursuitLeaderboard = await ethers.getContractFactory("PipelinePursuitLeaderboard");
  
  // Deploy contract
  console.log("📦 Deploying contract...");
  const leaderboard = await PipelinePursuitLeaderboard.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await leaderboard.waitForDeployment();
  
  const address = await leaderboard.getAddress();
  console.log("✅ PipelinePursuitLeaderboard deployed to:", address);
  console.log("🔗 View on Monad Explorer: https://testnet.monadexplorer.com/address/" + address);

  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const deployedContract = await ethers.getContractAt("PipelinePursuitLeaderboard", address);
  
  // Test basic contract functions
  const owner = await deployedContract.owner();
  const minScore = await deployedContract.minScoreToSubmit();
  const maxSize = await deployedContract.maxLeaderboardSize();
  
  console.log("📋 Contract verification:");
  console.log("   Owner:", owner);
  console.log("   Min Score to Submit:", minScore.toString());
  console.log("   Max Leaderboard Size:", maxSize.toString());
  
  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("✅ Contract ownership verified");
  } else {
    console.log("❌ Contract ownership verification failed");
  }

  // Verify contract on Sourcify
  console.log("🔍 Verifying contract on Sourcify...");
  try {
    const hre = require("hardhat");
    await hre.run("sourcify", {
      contractAddress: address,
    });
    console.log("✅ Contract verified on Sourcify");
    console.log("🔗 View verified contract: https://testnet.monadexplorer.com/address/" + address);
  } catch (error) {
    console.log("⚠️  Sourcify verification failed:", error.message);
    console.log("   You can manually verify the contract later");
  }

  // Save deployment info
  const deploymentInfo = {
    contract: "PipelinePursuitLeaderboard",
    address: address,
    deployer: deployer.address,
    network: "monadTestnet",
    chainId: 10143,
    timestamp: new Date().toISOString(),
    explorer: `https://testnet.monadexplorer.com/address/${address}`,
  };

  console.log("\n📄 Deployment Summary:");
  console.log("=======================");
  console.log("Contract:", deploymentInfo.contract);
  console.log("Address:", deploymentInfo.address);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId);
  console.log("Explorer:", deploymentInfo.explorer);

  // Update .env file if it exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env');
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update contract address
    if (envContent.includes('VITE_CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(
        /VITE_CONTRACT_ADDRESS=.*/,
        `VITE_CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nVITE_CONTRACT_ADDRESS=${address}`;
    }
    
    // Update RPC URL
    if (envContent.includes('MONAD_RPC_URL=')) {
      envContent = envContent.replace(
        /MONAD_RPC_URL=.*/,
        'MONAD_RPC_URL=https://testnet-rpc.monad.xyz'
      );
    } else {
      envContent += '\nMONAD_RPC_URL=https://testnet-rpc.monad.xyz';
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Environment variables updated in .env file");
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📝 Next steps:");
  console.log("   1. Update your frontend with the contract address");
  console.log("   2. Test the contract functions");
  console.log("   3. Share your deployed contract address");
}

main()
  .then(() => {
    console.log("\n👋 Deployment script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 