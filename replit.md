# StablePay - Multi-Chain Crypto-to-Fiat Platform

## Overview

StablePay is a comprehensive Web3 remittance and token swapping platform that enables users to convert crypto tokens to USDC and withdraw as INR (Indian Rupees). The platform integrates multiple blockchain networks, Web3 wallet providers, and implements KYC-compliant fiat withdrawals with smart contract-based custody wallets.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and production builds
- **UI Framework**: Radix UI components with shadcn/ui design system and Tailwind CSS
- **Animation**: Framer Motion for smooth transitions and micro-interactions
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks and TanStack Query for server state management

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Build System**: ESBuild for fast bundling and TypeScript compilation
- **API Design**: RESTful endpoints with typed request/response interfaces
- **File Handling**: Multer for KYC document uploads with validation

### Blockchain Integration
- **Primary Wallet**: Particle Network for Account Abstraction and gasless transactions
- **Secondary Wallet**: Reown (WalletConnect) AppKit for multi-wallet support
- **Smart Contracts**: Hardhat development environment with OpenZeppelin contracts
- **Networks**: Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Avalanche support

## Key Components

### Wallet Infrastructure
- **Particle Network**: Account Abstraction wallets with social login capabilities
- **Reown AppKit**: WalletConnect v2 integration for MetaMask, Coinbase Wallet, etc.
- **Multi-Chain Support**: Unified interface across 7+ blockchain networks
- **Balance Fetching**: Real-time token balance queries via RPC endpoints

### Smart Contract System
- **SimpleStablePayWithdrawal**: Core withdrawal contract with user consent mechanism
- **StablePayTransfer**: Admin-controlled token transfer system
- **Custody Wallets**: Multi-chain admin wallet addresses for token storage
- **Fee Management**: Configurable service fees with maximum limits

### KYC & Compliance
- **Document Upload**: Aadhaar, PAN, selfie verification system
- **Travel Rule**: Compliance forms for international remittances
- **Bank Integration**: Indian bank account verification and INR transfers
- **Tier System**: KYC levels 1-3 with increasing transaction limits

### DEX Integration
- **Price Feeds**: CoinGecko API for real-time token pricing
- **Swap Quotes**: Multi-DEX aggregation for best rates
- **Gasless Swaps**: Sponsored transactions through Particle Network
- **USDC Conversion**: Automatic conversion pipeline to stable assets

## Data Flow

### Token Swap Flow
1. User connects wallet via Particle Network or Reown
2. Real-time balance fetching across supported chains
3. Token swap quote generation using price APIs
4. Smart contract execution with gasless options
5. Automatic transfer to custody wallet
6. USDC conversion and INR rate calculation

### Withdrawal Flow
1. User consent via smart contract interaction
2. KYC verification and bank account validation
3. Smart contract withdrawal execution
4. Token transfer to admin custody wallet
5. Off-chain INR bank transfer processing
6. Transaction monitoring and status updates

### Remittance Flow
1. Social wallet creation or existing wallet connection
2. Crypto purchase integration for new users
3. Travel rule compliance form completion
4. Multi-chain token transfer with live tracking
5. Recipient notification and cash pickup/bank transfer

## External Dependencies

### Blockchain Infrastructure
- **Particle Network**: Account Abstraction, social login, gasless transactions
- **Reown AppKit**: WalletConnect v2 protocol for wallet connections
- **Hardhat**: Smart contract development and deployment tooling
- **OpenZeppelin**: Secure smart contract templates and utilities

### APIs and Services
- **CoinGecko**: Real-time cryptocurrency price data
- **Multiple RPC Providers**: Ethereum, Polygon, BSC, Arbitrum endpoints
- **PancakeSwap API**: DEX integration for token swapping
- **Alchemy/Infura**: Blockchain RPC services for production

### Development Tools
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database operations
- **shadcn/ui**: Pre-built accessible UI components
- **Framer Motion**: Animation library for smooth UX

## Deployment Strategy

### Development Environment
- **Replit**: Integrated development environment with PostgreSQL
- **Hot Reload**: Vite development server with instant updates
- **Environment Variables**: Secure API key management
- **Database**: PostgreSQL with Drizzle migrations

### Production Deployment
- **Build Process**: Vite production build with ESBuild optimization
- **Server**: Express.js with static file serving
- **Database**: PostgreSQL with connection pooling
- **Smart Contracts**: Multi-chain deployment via Hardhat scripts

### Environment Configuration
- **Particle Network**: Project ID, client key, server key configuration
- **WalletConnect**: Project ID for Reown AppKit integration
- **Database**: PostgreSQL connection string management
- **RPC Endpoints**: Multi-chain blockchain connectivity

## Travel Rule Compliance

### Implementation Details
- **FATF Compliance**: Full Travel Rule implementation for cross-border transactions exceeding $1000 USD
- **Dynamic Thresholds**: Automatic calculation based on currency and jurisdiction pairs
- **Risk Assessment**: Three-tier risk evaluation (low/medium/high) with enhanced due diligence
- **Sanctions Screening**: Built-in checks against restricted countries and PEP lists
- **Multi-Step Process**: Comprehensive data collection for originator, beneficiary, and transaction details

### Compliance Features
- **Originator Information**: Full name, address, country, date of birth, national ID collection
- **Beneficiary Details**: Recipient name, address, bank information, account details
- **Transaction Data**: Purpose classification, source of funds verification, compliance declarations
- **Automated Validation**: Real-time threshold checking and jurisdiction-specific requirements
- **Reference Generation**: Unique compliance reference numbers for audit trails

### API Endpoints
- `POST /api/travel-rule/submit` - Submit complete travel rule data
- `GET /api/travel-rule/:reference` - Retrieve stored compliance information
- `POST /api/travel-rule/validate` - Check if travel rule is required for transaction
- `GET /travel-rule` - Reown AppKit integration endpoint

## Changelog

- June 14, 2025: Initial setup
- June 14, 2025: Implemented comprehensive Travel Rule compliance according to Reown AppKit documentation
- June 14, 2025: Added multi-step compliance workflow with FATF requirements
- June 14, 2025: Enhanced platform with sanctions screening and PEP checks
- June 14, 2025: Integrated dynamic threshold calculation and risk assessment
- June 16, 2025: Complete UI/UX rebuild using only primary color #6667AB (purple) and secondary color #FCFBF4 (cream/off-white)
- June 16, 2025: Updated entire color system, removed all third colors, created cohesive professional finance app design
- June 16, 2025: Implemented StablePay-style buttons with premium gradient effects and shimmer animations
- June 16, 2025: Added advanced hover animations including scale, rotate, and glow effects
- June 16, 2025: Complete mobile-responsive PWA rebuild with comprehensive mobile-first design patterns
- June 16, 2025: Added PWA manifest, service worker, and mobile navigation components
- June 16, 2025: Implemented mobile utilities, safe area handling, and touch optimization
- June 16, 2025: Fixed layout constraints and text visibility issues - removed max-width limitations for full page display
- June 16, 2025: Enhanced form contrast with white backgrounds and proper purple text visibility throughout all steps
- June 16, 2025: Final comprehensive brand color standardization - removed ALL non-brand colors (green, red, blue, gray)
- June 16, 2025: Fixed text visibility issues in KYC forms, success indicators, and error messages using only purple/cream
- June 16, 2025: Updated Web3 benefits comparison section with proper brand colors and enhanced PWA visibility
- June 16, 2025: Made navigation links functional with scroll-to-section behavior for "How it works" and "Benefits"
- June 16, 2025: Complete single-page application restructure - merged landing page with app functionality
- June 16, 2025: Created unified landing page with connect wallet button as primary interaction
- June 16, 2025: Implemented dynamic content switching based on wallet connection status
- June 16, 2025: Added live token swap interface, KYC flow, and Travel Rule compliance in single page design
- June 16, 2025: Updated all landing page content to match approved user specifications
- June 16, 2025: Removed "See How It Works" button and live stats, integrated USD to INR conversion
- June 16, 2025: Implemented exact user flow: Connect Wallet → Complete KYC → Add Bank Details → Off-Ramp to INR
- June 16, 2025: Added target audience section (NRIs, Freelancers, Crypto Holders, Businesses)
- June 16, 2025: Updated security section to remove RBI compliance references, focus on FATF/Travel Rule
- June 16, 2025: Implemented top 100 cryptocurrency validation system with DeFi liquidity checking (content unchanged)
- June 16, 2025: Added comprehensive cryptocurrency database in shared/top-100-crypto.ts with market cap rankings
- June 16, 2025: Created unsupported token detection with popup for inclusion requests
- June 16, 2025: Token validation system allows only top 100 cryptocurrencies with proven DeFi liquidity
- June 16, 2025: Maintained original landing page content while adding backend validation logic

## User Preferences

Preferred communication style: Simple, everyday language.