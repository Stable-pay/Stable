# StablePay - Multi-Chain Crypto-to-INR Platform

A comprehensive Web3 remittance platform that enables users to convert cryptocurrency to Indian Rupees (INR) with multi-chain wallet support, real-time token balance fetching, and integrated KYC verification.

## 🚀 Features

### Multi-Chain Support
- **7+ Blockchain Networks**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche
- **Real-time Balance Fetching**: Live token detection across all supported chains
- **Universal Wallet Support**: Reown AppKit integration for MetaMask, Coinbase Wallet, and more

### Production APIs
- **Live Token Pricing**: CoinGecko integration with fallback mechanisms
- **KYC Verification**: Surepass API for Aadhaar and PAN verification
- **Demo Mode**: Test with Aadhaar: `123456789012`, OTP: `123456`
- **CORS-Free Architecture**: All external APIs handled by backend

### User Experience
- **Brand-Consistent Design**: StablePay colors (#6667AB purple, #FCFBF4 cream)
- **Mobile-Responsive PWA**: Touch-optimized interface
- **Step-by-Step Flow**: Connect Wallet → KYC → Bank Details → INR Conversion

## 🛠 Tech Stack

**Frontend**
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS + shadcn/ui components
- Reown AppKit for Web3 integration
- TanStack Query for state management

**Backend**
- Node.js with Express
- Production APIs with timeout handling
- PostgreSQL with Drizzle ORM
- Comprehensive error handling

## 🔧 Quick Start

### Development
```bash
npm install
npm run dev
```

### Demo Testing
- **KYC Demo**: Use Aadhaar `123456789012` with OTP `123456`
- **Token Pricing**: Real-time rates from CoinGecko with fallback
- **Multi-Chain**: Connect any supported wallet to see live balances

## 📡 API Endpoints

- `GET /api/tokens/price/:symbol` - Live token pricing
- `POST /api/kyc/aadhaar-otp` - Send Aadhaar OTP
- `POST /api/kyc/verify-otp` - Verify Aadhaar OTP
- `POST /api/kyc/pan-verify` - PAN card verification
- `GET /api/balance/:address/:chainId` - Multi-chain balance fetching

## 🔐 Environment Variables

```env
DATABASE_URL=postgresql://...
ZEROX_API_KEY=12be1743-8f3e-4867-a82b-501263f3c4b6
SUREPASS_API_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
REOWN_PROJECT_ID=de08fceb9aec3c31d08270dd9eb71c65
```

## 🌐 Deployment

The platform is production-ready with:
- Zero CORS issues
- Comprehensive error handling
- Real-time data fetching
- Secure API integrations
- Mobile-optimized interface

## 📝 Documentation

See `replit.md` for complete technical architecture and implementation details.

## 🏗 Architecture

### Frontend Components
- `UnifiedLandingPage`: Main application interface
- `TokenToINRConverter`: Real-time conversion with live pricing
- `ProductionKYCSystem`: Step-by-step verification process
- `ProductionMultiChainBalanceFetcher`: Live balance detection

### Backend Services
- `PricingService`: CoinGecko integration with fallbacks
- `SurepassKYCAPI`: Production KYC verification
- `BlockchainService`: Multi-chain RPC interactions
- `ProductionSwapAPI`: Token swap integrations

## 📈 Key Features

✅ **Multi-Chain Support**: 7+ networks with unified interface  
✅ **Real-Time Pricing**: Live rates with fallback mechanisms  
✅ **Production KYC**: Surepass API with demo mode  
✅ **CORS-Free**: All external calls handled by backend  
✅ **Mobile-First**: PWA with touch optimization  
✅ **Brand Consistent**: Professional finance app design  
✅ **Error Handling**: Comprehensive timeout and retry logic  
✅ **Demo Ready**: Test mode for development and demos  

---

**StablePay** - Simplifying crypto-to-fiat conversions for the Indian market.