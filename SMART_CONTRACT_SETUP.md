# StablePay Smart Contract Withdrawal System

## Overview
The StablePayWithdrawal smart contract provides a secure, transparent mechanism for handling token transfers with user consent during INR withdrawals. It includes built-in fee management, timeout protection, and comprehensive event logging.

## Contract Features
- **Secure Token Transfers**: Both native tokens (ETH, MATIC, BNB) and ERC20 tokens
- **User Consent Required**: Two-step process with explicit user approval
- **Automatic Fee Calculation**: Configurable service fees with maximum limits
- **Timeout Protection**: 24-hour window for withdrawal completion
- **Emergency Controls**: Owner can pause/unpause and emergency withdraw
- **Comprehensive Logging**: All transactions logged on-chain

## Deployment Instructions

### Prerequisites
1. Node.js and npm installed
2. Hardhat development environment
3. Wallet with deployment funds for each target network

### Setup Hardhat Environment
```bash
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers
npm install @openzeppelin/contracts
```

### Create hardhat.config.js
```javascript
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.19",
  networks: {
    ethereum: {
      url: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY",
      accounts: ["YOUR_PRIVATE_KEY"],
      chainId: 1
    },
    polygon: {
      url: "https://polygon-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY",
      accounts: ["YOUR_PRIVATE_KEY"],
      chainId: 137
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: ["YOUR_PRIVATE_KEY"],
      chainId: 56
    },
    arbitrum: {
      url: "https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
      accounts: ["YOUR_PRIVATE_KEY"],
      chainId: 42161
    },
    optimism: {
      url: "https://opt-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
      accounts: ["YOUR_PRIVATE_KEY"],
      chainId: 10
    },
    base: {
      url: "https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
      accounts: ["YOUR_PRIVATE_KEY"],
      chainId: 8453
    }
  },
  etherscan: {
    apiKey: {
      mainnet: "YOUR_ETHERSCAN_API_KEY",
      polygon: "YOUR_POLYGONSCAN_API_KEY",
      bsc: "YOUR_BSCSCAN_API_KEY",
      arbitrumOne: "YOUR_ARBISCAN_API_KEY",
      optimisticEthereum: "YOUR_OPTIMISTIC_ETHERSCAN_API_KEY",
      base: "YOUR_BASESCAN_API_KEY"
    }
  }
};
```

### Deploy to Networks
```bash
# Deploy to Ethereum
npx hardhat run contracts/deploy.js --network ethereum

# Deploy to Polygon
npx hardhat run contracts/deploy.js --network polygon

# Deploy to BSC
npx hardhat run contracts/deploy.js --network bsc

# Deploy to Arbitrum
npx hardhat run contracts/deploy.js --network arbitrum

# Deploy to Optimism
npx hardhat run contracts/deploy.js --network optimism

# Deploy to Base
npx hardhat run contracts/deploy.js --network base
```

## Contract Configuration

### 1. Set Admin Wallets
After deployment, configure your admin wallets for each chain:

```javascript
// Using ethers.js
const contract = new ethers.Contract(contractAddress, abi, signer);

await contract.setAdminWallet(1, "YOUR_ETHEREUM_ADMIN_WALLET");
await contract.setAdminWallet(137, "YOUR_POLYGON_ADMIN_WALLET");
await contract.setAdminWallet(56, "YOUR_BSC_ADMIN_WALLET");
await contract.setAdminWallet(42161, "YOUR_ARBITRUM_ADMIN_WALLET");
await contract.setAdminWallet(10, "YOUR_OPTIMISM_ADMIN_WALLET");
await contract.setAdminWallet(8453, "YOUR_BASE_ADMIN_WALLET");
```

### 2. Update Frontend Configuration
Update the contract addresses in the frontend:

```typescript
// client/src/hooks/use-smart-contract-withdrawal.ts
const CONTRACT_ADDRESSES: Record<number, string> = {
  1: "0x...", // Ethereum contract address
  137: "0x...", // Polygon contract address
  56: "0x...", // BSC contract address
  42161: "0x...", // Arbitrum contract address
  10: "0x...", // Optimism contract address
  8453: "0x...", // Base contract address
};
```

### 3. Configure Service Fees (Optional)
```javascript
// Set service fee to 0.3% (30 basis points)
await contract.setServiceFeePercentage(30);

// Set minimum transfer amount (in wei)
await contract.setMinimumTransferAmount(ethers.parseEther("0.001"));

// Set withdrawal timeout to 48 hours
await contract.setWithdrawalTimeout(48 * 60 * 60);
```

## How It Works

### User Withdrawal Process
1. **Initiate Withdrawal**: User calls `initiateWithdrawal()` with token details
2. **Consent Modal**: Frontend shows detailed consent modal with fees
3. **Smart Contract Approval**: For ERC20 tokens, user approves contract to spend
4. **Complete Withdrawal**: User calls `completeWithdrawal()` to execute transfer
5. **Funds Transfer**: Contract transfers tokens to admin wallet minus fees

### Fee Structure
- Default: 0.5% service fee
- Maximum: 5% (hard-coded limit)
- Fees collected in separate wallet
- Net amount transferred to admin wallet

### Security Features
- **Reentrancy Protection**: Prevents re-entrance attacks
- **Owner Controls**: Pause/unpause functionality
- **Timeout Protection**: 24-hour completion window
- **Emergency Withdraw**: Owner can rescue stuck funds
- **Operator Authorization**: Multi-admin support

## Integration with StablePay

### Updated Withdrawal Flow
```typescript
import { useSmartContractWithdrawal } from '@/hooks/use-smart-contract-withdrawal';

const { withdrawalState, initiateWithdrawal, completeWithdrawal } = useSmartContractWithdrawal();

// In your withdrawal handler
const handleWithdrawal = async () => {
  const withdrawalId = await initiateWithdrawal(
    tokenAddress,
    amount,
    inrAmount,
    bankAccount
  );
  
  if (withdrawalId) {
    // Withdrawal initiated, proceed with completion
    await completeWithdrawal(withdrawalId);
  }
};
```

### Benefits Over Direct Transfers
1. **Transparency**: All transactions visible on blockchain
2. **Security**: Smart contract handles all token operations
3. **Fees**: Automatic fee calculation and collection
4. **Recovery**: Failed transactions can be cancelled/retried
5. **Audit Trail**: Complete on-chain transaction history

## Monitoring and Maintenance

### Event Monitoring
Monitor these key events:
- `WithdrawalInitiated`: New withdrawal requests
- `WithdrawalCompleted`: Successful transfers
- `WithdrawalCancelled`: Cancelled requests

### Regular Maintenance
1. Monitor contract balances
2. Check for expired withdrawals
3. Update admin wallets if needed
4. Adjust fees based on network conditions

## Security Considerations
1. Keep private keys secure
2. Use multi-sig wallets for contract ownership
3. Regular security audits recommended
4. Monitor for suspicious activity
5. Have emergency response procedures

## Troubleshooting

### Common Issues
1. **Gas Estimation Failed**: Check token allowances
2. **Insufficient Balance**: Verify user has enough tokens
3. **Withdrawal Expired**: Complete within 24 hours
4. **Admin Wallet Not Set**: Configure admin wallet for chain

### Support Commands
```javascript
// Check withdrawal status
await contract.getWithdrawalRequest(withdrawalId);

// Check user's withdrawal history
await contract.getUserWithdrawals(userAddress);

// Calculate fees for amount
await contract.calculateFees(amount);
```

This smart contract system provides a robust, secure foundation for your INR withdrawal functionality with full transparency and user consent.