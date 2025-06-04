import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, polygon, solana, bsc, base, avalanche, arbitrum, optimism } from '@reown/appkit/networks'

// Reown project configuration
const projectId = '6dfca9af31141b1fb9220aa7db3eee37'

// Configure supported networks
const networks = [
  mainnet,
  polygon,
  solana,
  bsc,
  base,
  avalanche,
  arbitrum,
  optimism,
  // Add zkSync Era when available
]

// Create EthersAdapter
const ethersAdapter = new EthersAdapter()

// Create the AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata: {
    name: 'Stable Pay',
    description: 'Multi-chain USDC conversion and INR withdrawal platform',
    url: 'https://stablepay.com',
    icons: ['https://stablepay.com/icon.png']
  },
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})

export { projectId }
