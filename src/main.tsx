import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { monadTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const config = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected(),
    walletConnect({ projectId: 'your-project-id' }), // Replace with your WalletConnect project ID
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
})

const queryClient = new QueryClient()

declare global {
  interface Window {
    farcaster?: {
      miniapps?: {
        ready?: () => void
      }
    }
  }
}

function ReadyEffect() {
  React.useEffect(() => {
    // Farcaster Mini App ready call (see https://miniapps.farcaster.xyz/docs/guides/loading)
    if (window.farcaster && window.farcaster.miniapps && typeof window.farcaster.miniapps.ready === 'function') {
      window.farcaster.miniapps.ready()
    }
  }, [])
  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ReadyEffect />
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
) 