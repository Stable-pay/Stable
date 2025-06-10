import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from 'wagmi';
import { queryClient } from "./lib/queryClient";
import { wagmiConfig } from "./lib/wallet-config";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StablePayNavbar } from "@/components/layout/stablepay-navbar";
import AnimatedHome from "@/pages/animated-home";
import Swap from "@/pages/swap";
import KYC from "@/pages/kyc";
import Withdraw from "@/pages/withdraw";
import Dashboard from "@/pages/dashboard";
import RemittanceDashboard from "@/pages/remittance-dashboard";
import MobileWallet from "@/pages/mobile-wallet";
import NotFound from "@/pages/not-found";
import "./lib/wallet-config";


function Router() {
  return (
    <Switch>
      <Route path="/" component={MobileWallet} />
      <Route path="/wallet" component={MobileWallet} />
      <Route path="/remittance" component={RemittanceDashboard} />
      <Route path="/swap" component={Swap} />
      <Route path="/kyc" component={KYC} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/trading" component={AnimatedHome} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
