export const SUPPORTED_NETWORKS = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    icon: 'fab fa-ethereum',
    color: 'from-blue-400 to-blue-600',
    standard: 'ERC-20'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    icon: 'fas fa-gem',
    color: 'from-purple-400 to-purple-600',
    standard: 'ERC-20'
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    icon: 'fas fa-sun',
    color: 'from-green-400 to-green-600',
    standard: 'SPL'
  },
  {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    icon: 'fas fa-coins',
    color: 'from-yellow-400 to-yellow-600',
    standard: 'BEP-20'
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    icon: 'fas fa-layer-group',
    color: 'from-blue-500 to-indigo-600',
    standard: 'ERC-20'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    icon: 'fas fa-mountain',
    color: 'from-red-400 to-red-600',
    standard: 'ARC-20'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    icon: 'fas fa-bolt',
    color: 'from-blue-400 to-cyan-500',
    standard: 'ERC-20'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    icon: 'fas fa-rocket',
    color: 'from-red-500 to-pink-500',
    standard: 'ERC-20'
  },
  {
    id: 'zksync',
    name: 'zkSync Era',
    symbol: 'ETH',
    icon: 'fas fa-shield-alt',
    color: 'from-gray-600 to-gray-800',
    standard: 'ERC-20'
  }
]

export const MOCK_TOKENS = {
  ethereum: [
    { symbol: 'ETH', name: 'Ethereum', icon: 'fab fa-ethereum', balance: '2.5432' },
    { symbol: 'USDT', name: 'Tether USD', icon: 'fas fa-dollar-sign', balance: '1250.00' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: 'fab fa-bitcoin', balance: '0.1234' }
  ],
  polygon: [
    { symbol: 'MATIC', name: 'Polygon', icon: 'fas fa-gem', balance: '1500.00' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'fas fa-dollar-sign', balance: '500.00' }
  ],
  solana: [
    { symbol: 'SOL', name: 'Solana', icon: 'fas fa-sun', balance: '25.50' },
    { symbol: 'USDC', name: 'USD Coin', icon: 'fas fa-dollar-sign', balance: '750.00' }
  ]
}

export const EXCHANGE_RATES = {
  'ETH/USDC': 2451.32,
  'MATIC/USDC': 0.85,
  'SOL/USDC': 142.50,
  'BNB/USDC': 325.75,
  'AVAX/USDC': 28.45,
  'USDC/INR': 83.24
}

export const KYC_DOCUMENT_TYPES = [
  {
    id: 'aadhaar',
    name: 'Aadhaar Card',
    description: 'Upload front and back of your Aadhaar card',
    icon: 'fas fa-id-card',
    required: true
  },
  {
    id: 'pan',
    name: 'PAN Card',
    description: 'Upload your PAN card for tax compliance',
    icon: 'fas fa-credit-card',
    required: true
  },
  {
    id: 'selfie',
    name: 'Live Selfie',
    description: 'Take a live selfie for identity verification',
    icon: 'fas fa-camera',
    required: true
  }
]

export const TRANSACTION_TYPES = {
  swap: {
    name: 'Token Swap',
    icon: 'fas fa-exchange-alt',
    color: 'text-primary'
  },
  withdrawal: {
    name: 'INR Withdrawal',
    icon: 'fas fa-university',
    color: 'text-secondary'
  }
}

export const TRANSACTION_STATUS = {
  pending: {
    name: 'Pending',
    color: 'text-yellow-500 bg-yellow-50 border-yellow-200'
  },
  processing: {
    name: 'Processing',
    color: 'text-blue-500 bg-blue-50 border-blue-200'
  },
  completed: {
    name: 'Completed',
    color: 'text-green-500 bg-green-50 border-green-200'
  },
  failed: {
    name: 'Failed',
    color: 'text-red-500 bg-red-50 border-red-200'
  }
}
