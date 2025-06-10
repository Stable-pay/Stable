import { useSimpleWallet } from '@/hooks/use-simple-wallet';

export default function StablePayDashboard() {
  const walletData = useSimpleWallet();
  
  if (!walletData.isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to StablePay</h1>
          <p className="text-xl text-gray-300 mb-8">Connect your wallet to access professional DeFi tools</p>
          <button
            onClick={walletData.connect}
            disabled={walletData.isLoading}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-4 text-lg rounded-xl shadow-2xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            {walletData.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Premium Header */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Portfolio Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Connected: {walletData.address?.slice(0, 6)}...{walletData.address?.slice(-4)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={walletData.refreshBalances}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              Refresh
            </button>
            <button
              onClick={walletData.disconnect}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Portfolio',
              value: `$${walletData.getTotalValue().toLocaleString()}`,
              change: '+2.34%',
              icon: '💰',
              gradient: 'from-emerald-500 to-green-600',
              bgGradient: 'from-emerald-50 to-green-50'
            },
            {
              title: 'Active Assets',
              value: walletData.balances.length.toString(),
              change: 'Multi-token',
              icon: '📊',
              gradient: 'from-blue-500 to-cyan-600',
              bgGradient: 'from-blue-50 to-cyan-50'
            },
            {
              title: 'Networks',
              value: '5',
              change: 'Multi-chain',
              icon: '🌐',
              gradient: 'from-purple-500 to-pink-600',
              bgGradient: 'from-purple-50 to-pink-50'
            },
            {
              title: 'Performance',
              value: '+12.5%',
              change: '7d growth',
              icon: '📈',
              gradient: 'from-orange-500 to-red-600',
              bgGradient: 'from-orange-50 to-red-50'
            }
          ].map((stat, index) => (
            <div 
              key={stat.title} 
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${stat.gradient} text-white`}>
                    {stat.change}
                  </div>
                </div>
                <div className="text-4xl ml-4">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Premium Portfolio Section */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Portfolio Overview
              </h3>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {walletData.balances.length} Assets
              </div>
            </div>
            
            <div className="space-y-4">
              {walletData.balances.map((balance, index) => (
                <div 
                  key={`${balance.chainId}-${balance.address}`} 
                  className="group flex items-center justify-between p-6 bg-gradient-to-r from-white/70 to-white/50 hover:from-white/90 hover:to-white/70 rounded-2xl border border-white/30 hover:border-white/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{balance.symbol.charAt(0)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {balance.symbol}
                      </p>
                      <p className="text-sm text-gray-600">{balance.name}</p>
                      <p className="text-xs text-gray-500">Chain {balance.chainId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {balance.formattedBalance}
                    </p>
                    <p className="text-lg text-gray-600 font-medium">
                      ${balance.usdValue.toFixed(2)}
                    </p>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full mt-1 inline-block">
                      +2.4%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Premium Quick Actions */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  { 
                    label: 'Swap Tokens', 
                    gradient: 'from-blue-500 via-blue-600 to-indigo-600', 
                    icon: '🔄',
                    description: 'Exchange cryptocurrencies'
                  },
                  { 
                    label: 'Send Payment', 
                    gradient: 'from-green-500 via-green-600 to-emerald-600', 
                    icon: '💸',
                    description: 'Transfer to any address'
                  },
                  { 
                    label: 'Withdraw Funds', 
                    gradient: 'from-purple-500 via-purple-600 to-pink-600', 
                    icon: '📤',
                    description: 'Cash out to bank'
                  },
                  { 
                    label: 'Add Liquidity', 
                    gradient: 'from-orange-500 via-red-500 to-pink-600', 
                    icon: '➕',
                    description: 'Earn yield on assets'
                  }
                ].map((action, actionIndex) => (
                  <button
                    key={action.label}
                    className={`group w-full p-4 bg-gradient-to-r ${action.gradient} text-white rounded-xl font-semibold flex items-center gap-4 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105`}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                      {action.icon}
                    </span>
                    <div className="text-left flex-1">
                      <div className="font-bold">{action.label}</div>
                      <div className="text-xs opacity-90">{action.description}</div>
                    </div>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Market Insights */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                Live Markets
              </h3>
              <div className="space-y-4">
                {[
                  { pair: 'ETH/USD', price: '$2,045.67', change: '+3.24%', positive: true },
                  { pair: 'BTC/USD', price: '$43,256.89', change: '+1.87%', positive: true },
                  { pair: 'USDC/USD', price: '$1.0001', change: '+0.01%', positive: true },
                  { pair: 'MATIC/USD', price: '$0.8234', change: '-2.15%', positive: false }
                ].map((market, marketIndex) => (
                  <div key={market.pair} className="flex justify-between items-center p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl transition-colors duration-200">
                    <div>
                      <span className="font-semibold text-gray-900">{market.pair}</span>
                      <div className="text-xs text-gray-500 mt-1">24h Volume: $2.1B</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{market.price}</div>
                      <div className={`text-sm font-medium ${market.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {market.change} {market.positive ? '↗' : '↘'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}