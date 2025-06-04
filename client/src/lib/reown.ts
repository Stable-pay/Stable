import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, polygon, bsc, base, avalanche, arbitrum, optimism } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Production Reown project configuration
const projectId = '6dfca9af31141b1fb9220aa7db3eee37'

// Get current domain for proper configuration
const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://stable-pay.app'

// Configure supported networks for multi-chain DeFi
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  polygon,
  bsc,
  base,
  avalanche,
  arbitrum,
  optimism
]

// Create EVM adapter with enhanced configuration
const ethersAdapter = new EthersAdapter()

// Create the AppKit instance with production-ready Web3 configuration
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata: {
    name: 'Stable Pay',
    description: 'Production Multi-Chain USDC Platform with Real-Time Swapping',
    url: currentUrl,
    icons: [`${currentUrl}/icon-192.png`]
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    onramp: true,
    swaps: true,
    history: true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '--w3m-accent': '#6366F1',
    '--w3m-color-mix': '#6366F1',
    '--w3m-color-mix-strength': 15,
    '--w3m-border-radius-master': '12px',
    '--w3m-z-index': 9999
  }
})

// Export utilities for wallet operations
export { projectId }
export default appKit
