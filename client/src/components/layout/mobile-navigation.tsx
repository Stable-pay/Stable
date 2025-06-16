import { Wallet, Send, History, User, Home } from 'lucide-react';
import { useLocation } from 'wouter';

interface MobileNavigationProps {
  currentStep: string;
  isConnected: boolean;
  onNavigate: (step: string) => void;
}

export function MobileNavigation({ currentStep, isConnected, onNavigate }: MobileNavigationProps) {
  const [location] = useLocation();
  
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      step: 'connect',
      active: currentStep === 'connect' || location === '/'
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      step: 'wallet',
      active: currentStep === 'wallet',
      disabled: !isConnected
    },
    {
      id: 'send',
      label: 'Send',
      icon: Send,
      step: 'transfer',
      active: currentStep === 'transfer' || currentStep === 'review',
      disabled: !isConnected
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      step: 'history',
      active: currentStep === 'history',
      disabled: !isConnected
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      step: 'kyc',
      active: currentStep === 'kyc',
      disabled: !isConnected
    }
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          const isDisabled = item.disabled;
          
          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onNavigate(item.step)}
              className={`mobile-nav-item touch-manipulation transition-all duration-200 ${
                isActive 
                  ? 'text-primary' 
                  : isDisabled 
                    ? 'text-muted-foreground/50' 
                    : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={isDisabled}
            >
              <Icon className={`w-5 h-5 mb-1 transition-transform duration-200 ${
                isActive ? 'scale-110' : ''
              }`} />
              <span className={`text-xs font-medium ${
                isActive ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}