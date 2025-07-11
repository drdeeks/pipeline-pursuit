import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { FarcasterKitProvider } from '@farcaster/connect-kit'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterKitProvider>
          <App />
        </FarcasterKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
) 