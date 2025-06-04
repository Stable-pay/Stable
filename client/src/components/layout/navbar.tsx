import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { NetworkSelector } from "@/components/wallet/network-selector";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/", icon: "fas fa-home" },
    { name: "Convert", href: "/swap", icon: "fas fa-exchange-alt" },
    { name: "KYC", href: "/kyc", icon: "fas fa-id-card" },
    { name: "Withdraw", href: "/withdraw", icon: "fas fa-university" },
    { name: "Dashboard", href: "/dashboard", icon: "fas fa-chart-line" }
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-white text-sm"></i>
            </div>
            <span className="text-xl font-bold text-gray-900">Stable Pay</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? "text-primary font-medium"
                    : "text-gray-600 hover:text-primary"
                } transition-colors`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Wallet Section */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <NetworkSelector />
            </div>
            <WalletConnect />
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block py-2 ${
                  isActive(item.href)
                    ? "text-primary font-medium"
                    : "text-gray-600"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className={`${item.icon} mr-3`}></i>
                {item.name}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-200">
              <NetworkSelector />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
