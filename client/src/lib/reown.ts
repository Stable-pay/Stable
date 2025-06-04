import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, polygon, bsc, base, avalanche, arbitrum, optimism } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// Production Reown project configuration
const projectId = '6dfca9af31141b1fb9220aa7db3eee37'

// Configure supported networks for multi-chain
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  polygon,
  bsc,
  base,
  avalanche,
  arbitrum,
  optimism
]

// Create adapter for EVM chains
const ethersAdapter = new EthersAdapter()

// Create the AppKit instance with Web3 styling
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata: {
    name: 'Stable Pay',
    description: 'Multi-chain USDC conversion and INR withdrawal platform',
    url: 'https://stable-pay.replit.app',
    icons: ['https://stable-pay.replit.app/icon.png']
  },
  features: {
    analytics: true,
    email: false,
    socials: ['google', 'x', 'github', 'discord']
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-accent': '#6366F1',
    '--w3m-color-mix': '#6366F1',
    '--w3m-color-mix-strength': 20,
    '--w3m-border-radius-master': '8px'
  }
})

export { projectId }
