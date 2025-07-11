import { http, createConfig } from 'wagmi'
import { monadTestnet } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

const projectId = process.env.VITE_WALLET_CONNECT_PROJECT_ID || 'your-project-id'

export const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }),
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
}) 