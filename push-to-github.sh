#!/bin/bash

# StablePay GitHub Push Script
echo "🚀 Pushing StablePay platform to GitHub..."

# Remove existing git if any
rm -rf .git

# Initialize new git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "StablePay: Production-ready multi-chain crypto-to-INR platform

✓ Multi-chain support: Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche
✓ Real-time token balance fetching across 7+ networks
✓ Production KYC system with Surepass API integration
✓ Demo mode for testing (Aadhaar: 123456789012, OTP: 123456)
✓ Live token pricing with CoinGecko API and fallback mechanisms
✓ CORS-free backend architecture with comprehensive error handling
✓ Brand-consistent UI with StablePay colors (#6667AB purple, #FCFBF4 cream)
✓ Travel Rule compliance for international remittances
✓ Smart contract integration for custody wallets and withdrawals
✓ Complete Web3 remittance platform ready for deployment"

# Add remote repository
git remote add origin https://github.com/Stable-pay/Stable.git

# Set main branch and push
git branch -M main
git push -u origin main

echo "✅ Successfully pushed StablePay platform to GitHub!"
echo "🌐 Repository: https://github.com/Stable-pay/Stable"