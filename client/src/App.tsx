import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
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
import { StablePayParticle } from "@/pages/stablepay-particle";


function Router() {
  return (
    <Switch>
      <Route path="/" component={StablePayParticle} />
      <Route path="/swap" component={Swap} />
      <Route path="/kyc" component={KYC} />
      <Route path="/withdraw" component={Withdraw} />
      <Route path="/dashboard" component={StablePayDashboard} />
      <Route path="/remittance" component={Remittance} />
      <Route path="/home" component={AnimatedHome} />
      <Route path="/convert" component={StablePayConversion} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
          <StablePayNav />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
