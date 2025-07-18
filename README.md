# Pipeline Pursuit - Farcaster Mini App

A thrilling cosmic adventure game built for Farcaster with onchain leaderboard on Monad testnet.

## 🎮 Game Features

- **Cosmic Adventure**: Navigate through space-themed obstacles
- **Character Selection**: Choose from unique cosmic characters
- **Onchain Leaderboard**: Submit scores to Monad testnet
- **Farcaster Integration**: Built with Farcaster Connect Kit
- **Wallet Connection**: Seamless wallet integration with wagmi

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A wallet with MONAD testnet tokens
- Vercel account (for Frame deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/drdeeks/pipeline-pursuit.git
cd pipeline-pursuit

# Install dependencies
npm install

# Copy environment variables
cp env.example .env

# Edit .env with your values
# See Environment Variables section below
```

### Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
# Farcaster App Configuration
VITE_FARCASTER_APP_NAME=Pipeline Pursuit
VITE_FARCASTER_APP_DESCRIPTION=A thrilling cosmic adventure game on Farcaster
VITE_FARCASTER_APP_URL=https://your-deployed-domain.com

# Monad Testnet Configuration
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=your_private_key_here

# Contract Configuration (filled after deployment)
VITE_CONTRACT_ADDRESS=0xdF5d0917518233a5A9d67a9BFBCB1DBAb2367174

# Optional: Wallet Connect Project ID
# VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

## 🏗️ Smart Contract Deployment

### Deploy to Monad Testnet

```bash
# Deploy the leaderboard contract
npm run deploy

# Verify the contract
npx hardhat verify <contract_address> --network monadTestnet
```

### Contract Details

- **Address**: `0xdF5d0917518233a5A9d67a9BFBCB1DBAb2367174`
- **Network**: Monad Testnet (Chain ID: 10143)
- **Explorer**: https://testnet.monadexplorer.com/address/0xdF5d0917518233a5A9d67a9BFBCB1DBAb2367174

## 🖼️ Frame Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add VITE_FARCASTER_APP_URL
   vercel env add VITE_CONTRACT_ADDRESS
   vercel env add MONAD_RPC_URL
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Configure Functions**:
   Create `netlify.toml`:
   ```toml
   [build]
     publish = "dist"
     functions = "api"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

### Option 3: Railway

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

### Frame Configuration

After deployment, your Frame will be available at:
- **Frame URL**: `https://your-domain.com/api/frame`
- **Frame Image**: `https://your-domain.com/og-image.png`

### Testing Your Frame

1. **Frame Validator**: Use [Farcaster Frame Validator](https://warpcast.com/~/developers/frames)
2. **Test on Warpcast**: Share your Frame URL on Warpcast
3. **Debug**: Check Vercel/Netlify logs for any errors

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run gas optimization tests
npm run test:gas

# Compile contracts
npm run compile
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run compile` - Compile smart contracts
- `npm run test` - Run tests
- `npm run deploy` - Deploy to Monad testnet
- `npm run import-keystore` - Import wallet from keystore

## 📁 Project Structure

```
pipeline-pursuit/
├── api/
│   └── frame.ts              # Farcaster Frame API
├── contracts/
│   └── PipelinePursuitLeaderboard.sol
├── src/
│   ├── components/
│   │   ├── Game.tsx
│   │   ├── Leaderboard.tsx
│   │   └── WalletConnect.tsx
│   ├── hooks/
│   │   └── useLeaderboard.ts
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   ├── deploy.cjs
│   └── import-keystore.cjs
├── test/
│   └── PipelinePursuitLeaderboard.test.ts
├── hardhat.config.cjs
├── vercel.json
└── package.json
```

## 🔗 Links

- **Game**: https://your-deployed-domain.com
- **Frame**: https://your-deployed-domain.com/api/frame
- **Contract**: https://testnet.monadexplorer.com/address/0xdF5d0917518233a5A9d67a9BFBCB1DBAb2367174
- **Monad Faucet**: https://faucet.monad.xyz
- **Monad Explorer**: https://testnet.monadexplorer.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Create an issue on GitHub
- **Discord**: Join our community
- **Documentation**: Check the docs folder

---

**Built with ❤️ by DrDeek**