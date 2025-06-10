import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Home, 
  History, 
  Bell,
  Grid3X3,
  ArrowUpDown,
  MoreVertical,
  Delete
} from "lucide-react";
import { useProductionWallet } from "@/hooks/use-production-wallet";

export default function MobileWallet() {
  const { balances, isConnected } = useProductionWallet();
  const [amount, setAmount] = useState("0.00");
  const [activeTab, setActiveTab] = useState("home");

  // Get main balance (USDC preferred or first available)
  const mainBalance = balances.find(b => b.symbol === "USDC") || balances[0];
  const displayBalance = mainBalance ? parseFloat(mainBalance.formattedBalance) : 19909.22;

  // Number pad input handler
  const handleNumberPad = (value: string) => {
    if (value === "clear") {
      setAmount("0.00");
    } else if (value === "backspace") {
      if (amount.length > 4) {
        setAmount(amount.slice(0, -1));
      } else {
        setAmount("0.00");
      }
    } else if (value === ".") {
      if (!amount.includes(".")) {
        setAmount(amount === "0.00" ? "0." : amount + ".");
      }
    } else {
      if (amount === "0.00") {
        setAmount(value);
      } else {
        setAmount(amount + value);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Status Bar */}
      <div className="flex justify-between items-center px-6 py-3 text-sm">
        <span className="font-medium">7:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
          </div>
          <span className="ml-2 text-xs">98</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-primary-foreground rounded-full"></div>
          </div>
          <span className="text-foreground font-medium">Shubham Patel</span>
        </div>
        <div className="flex items-center gap-4">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <Grid3X3 className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Available Balance */}
      <div className="px-6 py-4">
        <p className="text-muted-foreground text-sm mb-2">Available Balance</p>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {formatCurrency(displayBalance)}
          </h1>
          <span className="text-muted-foreground text-sm">
            $1.00 = ₹81.99
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="px-6 py-4">
        <p className="text-muted-foreground text-sm mb-3">Enter amount</p>
        <Card className="bg-input border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">
                {amount}
              </span>
              <span className="text-muted-foreground">USD</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Number Pad */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="secondary"
              size="lg"
              className="h-16 text-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              onClick={() => handleNumberPad(num.toString())}
            >
              {num}
            </Button>
          ))}
          
          <Button
            variant="secondary"
            size="lg"
            className="h-16 text-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => handleNumberPad("0")}
          >
            0
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            className="h-16 text-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => handleNumberPad(".")}
          >
            .
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            className="h-16 text-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
            onClick={() => handleNumberPad("backspace")}
          >
            <Delete className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            className="h-14 text-lg font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full"
          >
            Send
          </Button>
          <Button
            size="lg"
            className="h-14 text-lg font-medium bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full"
          >
            Request
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-4">
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === "wallet" ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("wallet")}
          >
            <Wallet className="w-5 h-5" />
            <span>Wallet</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === "home" ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("home")}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className={`flex flex-col items-center gap-1 text-xs ${
              activeTab === "history" ? "text-foreground" : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </Button>
        </div>
        
        {/* Home Indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-32 h-1 bg-foreground rounded-full"></div>
        </div>
      </div>
    </div>
  );
}