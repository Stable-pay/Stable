import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUPPORTED_NETWORKS } from "@/lib/constants";
import { ArrowUpDown, Shield, CreditCard, Zap, Globe, TrendingUp, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-3xl"></div>
        <div className="relative text-center py-16">
          <Badge className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            Powered by Reown AppKit
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Convert Any Token to
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              USDC
            </span>
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              {" "}& Withdraw as{" "}
            </span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              INR
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Multi-chain token swapping with automatic USDC conversion and seamless INR bank withdrawals.
            Supporting 7+ blockchain networks with KYC-compliant fiat off-ramping powered by production-grade infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/swap">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 h-14 px-8 text-lg font-semibold"
              >
                <ArrowUpDown className="w-5 h-5 mr-2" />
                Start Converting
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 h-14 px-8 text-lg font-semibold"
            >
              <Globe className="w-5 h-5 mr-2" />
              View Networks
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: "Networks Supported", value: "7+", icon: Globe },
          { label: "Total Volume", value: "$2.4M+", icon: TrendingUp },
          { label: "Users Served", value: "1,200+", icon: Star },
          { label: "Avg Processing", value: "< 30s", icon: Zap }
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="border-0 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Supported Networks */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardContent className="p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Multi-Chain Support
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Seamlessly swap tokens across major blockchain networks with industry-leading security and speed
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {SUPPORTED_NETWORKS.slice(0, 7).map((network) => (
              <div
                key={network.id}
                className="group flex flex-col items-center p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer bg-white/70 backdrop-blur-sm"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${network.color} rounded-2xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <i className={`${network.icon} text-white text-2xl`}></i>
                </div>
                <span className="font-semibold text-slate-800 mb-1">{network.name}</span>
                <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
                  {network.standard}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          {
            icon: ArrowUpDown,
            title: "Multi-Chain Swapping",
            description: "Convert any supported token to USDC across 7+ blockchain networks with real-time rates and minimal slippage.",
            gradient: "from-indigo-500 to-purple-600"
          },
          {
            icon: CreditCard,
            title: "INR Withdrawals",
            description: "Seamlessly convert your USDC to INR and withdraw directly to your Indian bank account with KYC compliance.",
            gradient: "from-emerald-500 to-teal-600"
          },
          {
            icon: Shield,
            title: "Secure & Compliant",
            description: "Bank-grade security with KYC verification, smart contract audits, and regulatory compliance for safe transactions.",
            gradient: "from-amber-500 to-orange-600"
          }
        ].map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Call to Action */}
      <Card className="border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 shadow-2xl overflow-hidden">
        <CardContent className="p-12 text-center text-white relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Converting?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of users who trust Stable Pay for their crypto-to-fiat conversion needs.
              Experience seamless multi-chain swapping with KYC-compliant withdrawals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/swap">
                <Button 
                  size="lg" 
                  className="bg-white text-indigo-600 hover:bg-gray-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-14 px-8 text-lg font-semibold"
                >
                  <ArrowUpDown className="w-5 h-5 mr-2" />
                  Start Converting Now
                </Button>
              </Link>
              <Link href="/kyc">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 h-14 px-8 text-lg font-semibold transition-all duration-300"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Complete KYC
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
