import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USDCCollectionMonitor } from "@/components/dashboard/usdc-collection-monitor";
import { TRANSACTION_TYPES, TRANSACTION_STATUS, EXCHANGE_RATES } from "@/lib/constants";
import { TrendingUp, Wallet, Shield, University } from "lucide-react";

export default function Dashboard() {
  const [networkFilter, setNetworkFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Mock data - in production, fetch from API
  const mockStats = {
    totalConverted: 12456.78,
    inrWithdrawn: 845632,
    availableBalance: 2451.32,
    kycStatus: "verified" as const
  };

  const mockTransactions = [
    {
      id: 1,
      type: "swap" as const,
      network: "ethereum",
      fromToken: "ETH",
      toToken: "USDC",
      fromAmount: "1.0",
      toAmount: "2451.32",
      status: "completed" as const,
      txHash: "0x742d35cc632c4532c76b78aae1cbad4b5e3d6f8e",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      type: "withdrawal" as const,
      network: "fiat",
      fromToken: "USDC",
      toToken: "INR",
      fromAmount: "300.00",
      toAmount: "25000.00",
      status: "completed" as const,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      type: "swap" as const,
      network: "polygon",
      fromToken: "MATIC",
      toToken: "USDC",
      fromAmount: "1471.00",
      toAmount: "1250.75",
      status: "completed" as const,
      txHash: "0x863f46dd741f6b78fce9b721c1a35c9d8c34f5ad",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      type: "withdrawal" as const,
      network: "fiat",
      fromToken: "USDC",
      toToken: "INR",
      fromAmount: "180.50",
      toAmount: "15000.00",
      status: "processing" as const,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const filteredTransactions = mockTransactions.filter(tx => {
    if (networkFilter !== "all" && tx.network !== networkFilter) return false;
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getNetworkIcon = (network: string) => {
    const networkIcons: { [key: string]: string } = {
      ethereum: "fab fa-ethereum",
      polygon: "fas fa-gem",
      solana: "fas fa-sun",
      fiat: "fas fa-university"
    };
    return networkIcons[network] || "fas fa-circle";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600">Track your transactions, balances, and account status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Converted</span>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ${mockStats.totalConverted.toLocaleString()}
            </h3>
            <p className="text-sm text-green-600">+12.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">INR Withdrawn</span>
              <University className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              ₹{mockStats.inrWithdrawn.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Available Balance</span>
              <Wallet className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {mockStats.availableBalance.toLocaleString()} USDC
            </h3>
            <p className="text-sm text-gray-600">
              ≈ ₹{(mockStats.availableBalance * EXCHANGE_RATES['USDC/INR']).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">KYC Status</span>
              <Shield className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-secondary">Verified</h3>
            <p className="text-sm text-gray-600">Tier 1 - ₹50K/day</p>
          </CardContent>
        </Card>
      </div>

      {/* USDC Collection Monitor */}
      <USDCCollectionMonitor />

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex items-center space-x-3">
              <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Networks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="fiat">Fiat</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="swap">Swap</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-inbox text-4xl mb-4 opacity-50"></i>
                <p>No transactions found with the selected filters</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const txType = TRANSACTION_TYPES[transaction.type];
                const txStatus = TRANSACTION_STATUS[transaction.status];
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center`}>
                        <i className={`${txType.icon} ${txType.color}`}></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {transaction.fromToken} → {transaction.toToken} {txType.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <i className={getNetworkIcon(transaction.network)}></i>
                          <span className="capitalize">{transaction.network} Network</span>
                          <span>•</span>
                          <span>{formatTimeAgo(transaction.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {transaction.type === "withdrawal" 
                          ? `₹${parseFloat(transaction.toAmount).toLocaleString()}`
                          : `${parseFloat(transaction.toAmount).toLocaleString()} ${transaction.toToken}`
                        }
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={txStatus.color}>
                          {txStatus.name}
                        </Badge>
                        {transaction.txHash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-primary hover:underline p-0"
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Load More */}
          {filteredTransactions.length > 0 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                Load More Transactions
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
