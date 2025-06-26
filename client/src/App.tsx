import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { queryClient, config } from "@/lib/reown-config";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StablePayNav } from "@/components/layout/stablepay-nav";
import AnimatedHome from "@/pages/animated-home";
import Swap from "@/pages/swap";
import KYC from "@/pages/kyc";
import Withdraw from "@/pages/withdraw";
import Dashboard from "@/pages/dashboard";
import { StablePayDashboard } from "@/pages/stablepay-dashboard";
import Remittance from "@/pages/remittance";
import NotFound from "@/pages/not-found";
import { StablePayConversion } from "@/pages/stablepay-conversion";
import { StablePayMain } from "@/pages/stablepay-main";
import { StablePayMinimal } from "@/pages/stablepay-minimal";
import { RemittancePlatform } from "@/pages/remittance-platform";
import { UnifiedLanding } from "@/pages/unified-landing";
import { AdminConfig } from "@/pages/admin-config";
import Web3FinancialServices from "@/pages/web3-financial-services";
import { DomainSetup } from "@/components/DomainSetup";
import { useState, useEffect } from 'react';


function Router() {
  return (
    <Switch>
      <Route path="/" component={UnifiedLanding} />
      <Route path="/app" component={RemittancePlatform} />
      <Route path="/admin" component={AdminConfig} />
      <Route path="/swap" component={Swap} />
      <Route path="/kyc" component={KYC} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/dashboard" component={StablePayDashboard} />
      <Route path="/remittance" component={Remittance} />
      <Route path="/home" component={AnimatedHome} />
      <Route path="/convert" component={StablePayConversion} />
      <Route path="/web3-services" component={Web3FinancialServices} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showDomainSetup, setShowDomainSetup] = useState(false);

  useEffect(() => {
    // Monitor for 403 errors indicating domain allowlist issues
    const checkDomainErrors = () => {
      const errors = performance.getEntriesByType('navigation');
      // Also check for failed resource loads
      setTimeout(() => {
        const failedResources = performance.getEntriesByType('resource')
          .filter(resource => resource.transferSize === 0);
        if (failedResources.length > 5) {
          setShowDomainSetup(true);
        }
      }, 3000);
    };

    checkDomainErrors();
    
    // Listen for failed network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 403 && args[0]?.toString().includes('reown')) {
          setShowDomainSetup(true);
        }
        return response;
      } catch (error) {
        return originalFetch(...args);
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            {showDomainSetup && <DomainSetup />}
            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
