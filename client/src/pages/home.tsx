import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORTED_NETWORKS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Convert Any Token to <span className="text-primary">USDC</span>
          <br />
          Withdraw as <span className="text-secondary">INR</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Multi-chain token swapping with automatic USDC conversion and seamless INR bank withdrawals.
          Supporting 9+ blockchain networks with KYC-compliant fiat off-ramping.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/swap">
            <Button size="lg" className="bg-primary hover:bg-indigo-700">
              <i className="fas fa-rocket mr-2"></i>
              Start Converting
            </Button>
          </Link>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>
      </div>

      {/* Supported Networks */}
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Supported Networks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {SUPPORTED_NETWORKS.map((network) => (
              <div
                key={network.id}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${network.color} rounded-full mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <i className={`${network.icon} text-white text-xl`}></i>
                </div>
                <span className="font-medium text-gray-700">{network.name}</span>
                <span className="text-xs text-gray-500 mt-1">{network.standard}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-exchange-alt text-white text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Multi-Chain Swapping</h3>
            <p className="text-gray-600">
              Convert any supported token to USDC across 9+ blockchain networks with real-time rates and minimal slippage.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-8">
            <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-university text-white text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">INR Withdrawals</h3>
            <p className="text-gray-600">
              Seamlessly convert your USDC to INR and withdraw directly to your Indian bank account with KYC compliance.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow">
          <CardContent className="p-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-shield-alt text-white text-xl"></i>
            </div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Secure & Compliant</h3>
            <p className="text-gray-600">
              Bank-grade security with KYC verification, smart contract audits, and regulatory compliance for safe transactions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-primary to-indigo-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-indigo-200 mb-6 max-w-2xl mx-auto">
          Join thousands of users who trust Stable Pay for their crypto-to-fiat conversion needs.
          Start your journey with just a few clicks.
        </p>
        <div className="space-x-4">
          <Link href="/swap">
            <Button size="lg" variant="secondary">
              Start Converting Now
            </Button>
          </Link>
          <Link href="/kyc">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              Complete KYC
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
