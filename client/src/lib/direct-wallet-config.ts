import { createConfig, http } from 'wagmi'
import { mainnet, polygon, bsc, arbitrum } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'

// Create query client
export const queryClient = new QueryClient()

// Create direct wallet configuration without WalletConnect dependency
export const directWalletConfig = createConfig({
  chains: [mainnet, polygon, bsc, arbitrum],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    metaMask({
      dappMetadata: {
        name: 'StablePay',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://stablepay.app',
        iconUrl: 'https://avatars.githubusercontent.com/u/179229932',
      },
    }),
  ],
  transports: {
    [mainnet.id]: http('https://ethereum.publicnode.com'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
    [arbitrum.id]: http('https://arbitrum.public-rpc.com'),
  },
  ssr: false,
})

// Fallback configuration that works without external dependencies
export const config = directWalletConfig