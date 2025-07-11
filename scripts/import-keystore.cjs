const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { ethers } = require('hardhat');

/**
 * Keystore Import Script for Pipeline Pursuit
 * 
 * This script allows you to import a wallet from a keystore file (JSON wallet file)
 * and use it for deployment or other transactions on Monad testnet.
 * 
 * Usage:
 * 1. Place your keystore file in the keystore/ directory
 * 2. Run: node scripts/import-keystore.cjs
 * 3. Enter the keystore filename and password when prompted
 */

async function importKeystore() {
  console.log('🔐 Pipeline Pursuit - Keystore Import Script');
  console.log('=============================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Get keystore filename
    const keystoreFile = await new Promise((resolve) => {
      rl.question('Enter the keystore filename (e.g., wallet.json): ', (answer) => {
        resolve(answer.trim());
      });
    });

    // Check if keystore directory exists
    const keystoreDir = path.join(__dirname, '..', 'keystore');
    if (!fs.existsSync(keystoreDir)) {
      console.log('📁 Creating keystore directory...');
      fs.mkdirSync(keystoreDir, { recursive: true });
      console.log('✅ Keystore directory created at: keystore/');
      console.log('📝 Please place your keystore file in the keystore/ directory and run this script again.');
      rl.close();
      return;
    }

    const keystorePath = path.join(keystoreDir, keystoreFile);
    
    // Check if file exists
    if (!fs.existsSync(keystorePath)) {
      console.log(`❌ Keystore file not found: ${keystorePath}`);
      console.log('📁 Available files in keystore directory:');
      const files = fs.readdirSync(keystoreDir);
      if (files.length === 0) {
        console.log('   (no files found)');
      } else {
        files.forEach(file => console.log(`   - ${file}`));
      }
      rl.close();
      return;
    }

    // Read keystore file
    console.log(`📖 Reading keystore file: ${keystoreFile}`);
    const keystoreContent = fs.readFileSync(keystorePath, 'utf8');
    
    // Validate JSON format
    let keystore;
    try {
      keystore = JSON.parse(keystoreContent);
    } catch (error) {
      console.log('❌ Invalid JSON format in keystore file');
      rl.close();
      return;
    }

    // Get password
    const password = await new Promise((resolve) => {
      rl.question('Enter the keystore password: ', (answer) => {
        resolve(answer);
      });
    });

    console.log('🔓 Decrypting keystore...');
    
    // Decrypt the keystore
    let wallet;
    try {
      wallet = ethers.Wallet.fromEncryptedJsonSync(keystoreContent, password);
      console.log('✅ Keystore decrypted successfully!');
    } catch (error) {
      console.log('❌ Failed to decrypt keystore. Please check your password.');
      rl.close();
      return;
    }

    // Display wallet information
    console.log('\n📋 Wallet Information:');
    console.log('======================');
    console.log(`Address: ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);
    
    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    
    // Get balance
    const balance = await ethers.provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    console.log(`Balance: ${balanceEth} MONAD`);

    // Ask if user wants to save to environment file
    const saveToEnv = await new Promise((resolve) => {
      rl.question('\n💾 Save private key to .env file? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (saveToEnv) {
      const envPath = path.join(__dirname, '..', '.env');
      const envContent = `# Pipeline Pursuit Environment Variables
# Generated from keystore import on ${new Date().toISOString()}

# Private Key (from keystore: ${keystoreFile})
PRIVATE_KEY=${wallet.privateKey}

# Network Configuration
MONAD_RPC_URL=https://testnet-rpc.monad.xyz

# App Configuration
VITE_FARCASTER_APP_NAME=Pipeline Pursuit
VITE_CONTRACT_ADDRESS=your_deployed_contract_address_here

# Optional: Wallet Connect Project ID
# VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here
`;

      fs.writeFileSync(envPath, envContent);
      console.log('✅ Private key saved to .env file');
      console.log('⚠️  IMPORTANT: Keep your .env file secure and never commit it to version control!');
    }

    // Ask if user wants to test the wallet
    const testWallet = await new Promise((resolve) => {
      rl.question('\n🧪 Test wallet connection? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (testWallet) {
      console.log('\n🧪 Testing wallet connection...');
      
      try {
        // Test signing a message
        const message = 'Pipeline Pursuit - Wallet Test';
        const signature = await wallet.signMessage(message);
        console.log('✅ Message signing test passed');
        
        // Test signature verification
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() === wallet.address.toLowerCase()) {
          console.log('✅ Signature verification test passed');
        } else {
          console.log('❌ Signature verification failed');
        }
        
        // Test transaction simulation (if balance > 0)
        if (balance > 0) {
          console.log('✅ Wallet has sufficient balance for transactions');
        } else {
          console.log('⚠️  Wallet has no balance - you may need to fund it for transactions');
          console.log('💡 Get MONAD testnet tokens from: https://faucet.monad.xyz/');
        }
        
      } catch (error) {
        console.log('❌ Wallet test failed:', error.message);
      }
    }

    // Ask if user wants to deploy contract
    const deployContract = await new Promise((resolve) => {
      rl.question('\n🚀 Deploy PipelinePursuitLeaderboard contract? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (deployContract) {
      console.log('\n🚀 Deploying PipelinePursuitLeaderboard contract...');
      
      try {
        // Check if we're on the right network
        const network = await ethers.provider.getNetwork();
        if (network.chainId !== 10143n) {
          console.log('⚠️  Warning: Not connected to Monad testnet (Chain ID: 10143)');
          console.log(`   Current network: ${network.name} (Chain ID: ${network.chainId})`);
          console.log('   Please ensure you are connected to Monad testnet for deployment');
        }
        
        // Connect wallet to provider
        const connectedWallet = wallet.connect(ethers.provider);
        
        // Get contract factory
        const PipelinePursuitLeaderboard = await ethers.getContractFactory("PipelinePursuitLeaderboard");
        
        // Deploy contract
        const contract = await PipelinePursuitLeaderboard.connect(connectedWallet).deploy();
        await contract.waitForDeployment();
        
        const address = await contract.getAddress();
        console.log('✅ Contract deployed successfully!');
        console.log(`Contract Address: ${address}`);
        console.log(`Deployer: ${wallet.address}`);
        console.log(`🔗 View on Monad Explorer: https://testnet.monadexplorer.com/address/${address}`);
        
        // Save contract address to .env if it exists
        const envPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          envContent = envContent.replace(
            'VITE_CONTRACT_ADDRESS=your_deployed_contract_address_here',
            `VITE_CONTRACT_ADDRESS=${address}`
          );
          fs.writeFileSync(envPath, envContent);
          console.log('✅ Contract address saved to .env file');
        }
        
      } catch (error) {
        console.log('❌ Contract deployment failed:', error.message);
        if (error.message.includes('insufficient funds')) {
          console.log('💡 Get MONAD testnet tokens from: https://faucet.monad.xyz/');
        }
      }
    }

    console.log('\n🎉 Keystore import completed successfully!');
    console.log('📝 You can now use this wallet for deployment and transactions.');

  } catch (error) {
    console.log('❌ Error during keystore import:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
if (require.main === module) {
  importKeystore()
    .then(() => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { importKeystore }; 