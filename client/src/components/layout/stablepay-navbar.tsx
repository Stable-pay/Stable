import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { Link, useLocation } from 'wouter';
import { Menu, X, Wallet } from 'lucide-react';

export function StablePayNavbar() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Swap', href: '/swap' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'KYC', href: '/kyc' },
    { name: 'Withdraw', href: '/withdraw' }
  ];

  const isActive = (href: string) => {
    if (href === '/' && location === '/') return true;
    if (href !== '/' && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="text-2xl font-bold" style={{ color: '#6667AB' }}>
                StablePay
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'border-b-2 border-[#6667AB]'
                      : 'text-gray-600 hover:text-[#6667AB]'
                  }`}
                  style={{ 
                    color: isActive(item.href) ? '#6667AB' : undefined 
                  }}
                >
                  {item.name}
                </button>
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div 
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50"
                  style={{ color: '#6667AB' }}
                >
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
                <Button
                  onClick={() => open()}
                  variant="outline"
                  size="sm"
                  className="border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => open()}
                className="bg-[#6667AB] hover:bg-[#5a5b96] text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-[#6667AB]"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <button
                    className={`block w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-[#6667AB] bg-opacity-10'
                        : 'text-gray-600 hover:text-[#6667AB]'
                    }`}
                    style={{ 
                      color: isActive(item.href) ? '#6667AB' : undefined 
                    }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </button>
                </Link>
              ))}
              
              {/* Mobile Wallet Button */}
              <div className="pt-4 border-t border-gray-100">
                {isConnected ? (
                  <div className="space-y-2">
                    <div 
                      className="px-3 py-2 text-sm font-medium"
                      style={{ color: '#6667AB' }}
                    >
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </div>
                    <Button
                      onClick={() => {
                        open();
                        setIsMenuOpen(false);
                      }}
                      variant="outline"
                      className="w-full border-[#6667AB] text-[#6667AB] hover:bg-[#6667AB] hover:text-white"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Manage Wallet
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      open();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-[#6667AB] hover:bg-[#5a5b96] text-white"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}