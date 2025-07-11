#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Deploying Pipeline Pursuit Frame to Vercel...\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.log('❌ Vercel CLI not found. Installing...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Vercel CLI. Please install manually:');
    console.error('   npm install -g vercel');
    process.exit(1);
  }
}

// Check if user is logged in
try {
  execSync('vercel whoami', { stdio: 'ignore' });
  console.log('✅ Vercel account authenticated');
} catch (error) {
  console.log('🔐 Please login to Vercel...');
  try {
    execSync('vercel login', { stdio: 'inherit' });
  } catch (loginError) {
    console.error('❌ Login failed. Please try again.');
    process.exit(1);
  }
}

// Build the project
console.log('\n📦 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
try {
  execSync('vercel --prod --yes', { stdio: 'inherit' });
  console.log('✅ Deployment completed');
} catch (error) {
  console.error('❌ Deployment failed');
  process.exit(1);
}

// Get deployment URL
console.log('\n🔍 Getting deployment URL...');
try {
  const output = execSync('vercel ls --json', { encoding: 'utf8' });
  const deployments = JSON.parse(output);
  const latestDeployment = deployments.find(d => d.name === 'pipeline-pursuit-miniapp');
  
  if (latestDeployment) {
    const frameUrl = `https://${latestDeployment.url}/api/frame`;
    console.log('✅ Frame deployed successfully!');
    console.log('\n📋 Frame Information:');
    console.log('=====================');
    console.log(`Frame URL: ${frameUrl}`);
    console.log(`App URL: https://${latestDeployment.url}`);
    console.log(`Project: ${latestDeployment.name}`);
    
    // Update .env with the new URL
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update app URL
      if (envContent.includes('VITE_FARCASTER_APP_URL=')) {
        envContent = envContent.replace(
          /VITE_FARCASTER_APP_URL=.*/,
          `VITE_FARCASTER_APP_URL=https://${latestDeployment.url}`
        );
      } else {
        envContent += `\nVITE_FARCASTER_APP_URL=https://${latestDeployment.url}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Environment variables updated');
    }
    
    console.log('\n🎉 Frame deployment completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test your Frame: ' + frameUrl);
    console.log('   2. Share on Warpcast');
    console.log('   3. Use Frame Validator: https://warpcast.com/~/developers/frames');
    
  } else {
    console.log('⚠️  Could not find deployment URL');
  }
} catch (error) {
  console.log('⚠️  Could not retrieve deployment information');
  console.log('   Check your Vercel dashboard for the deployment URL');
}

console.log('\n👋 Frame deployment script finished'); 