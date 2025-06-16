import { ReactNode } from 'react';
import { Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppKit } from '@reown/appkit/react';

interface StepWithBenefitsProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  onDisconnect?: () => void;
}

export function StepWithBenefits({ 
  children, 
  title, 
  subtitle, 
  badge, 
  onDisconnect 
}: StepWithBenefitsProps) {
  const { open } = useAppKit();

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    }
    open({ view: 'Account' });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#6667AB] via-[#6667AB] to-[#5A5B9F] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6667AB]/90 via-[#6667AB]/95 to-[#5A5B9F]/90" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FCFBF4]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FCFBF4]/5 rounded-full blur-3xl"></div>
      
      {/* Content Area */}
      <div className="relative z-10 w-full min-h-screen">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Navigation Header */}
          <header className="w-full py-4 border-b border-[#FCFBF4]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#FCFBF4] to-[#FCFBF4]/80 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#6667AB]" />
                </div>
                <span className="text-[#FCFBF4] font-semibold text-lg">StablePay</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm mr-4">
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-[#FCFBF4] hover:text-[#FCFBF4]/80 font-medium transition-colors"
                  >
                    How it works
                  </button>
                  <button 
                    onClick={() => {
                      const benefitsSection = document.getElementById('web3-benefits');
                      if (benefitsSection) benefitsSection.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-[#FCFBF4] hover:text-[#FCFBF4]/80 font-medium transition-colors"
                  >
                    Benefits
                  </button>
                  <span className="text-[#FCFBF4]/70">Support</span>
                </div>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  size="sm"
                  className="border-[#FCFBF4]/20 text-[#FCFBF4] hover:bg-[#FCFBF4]/10 hover:text-[#FCFBF4] bg-transparent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="py-8 sm:py-12 w-full">
            <div className="w-full max-w-none">
              <div className="text-center mb-8">
                {/* Badge */}
                {badge && (
                  <div className="inline-flex items-center gap-2 bg-[#FCFBF4]/10 backdrop-blur-sm border border-[#FCFBF4]/20 px-4 py-2 rounded-full mb-6">
                    <div className="w-2 h-2 bg-[#FCFBF4] rounded-full animate-pulse"></div>
                    <span className="text-[#FCFBF4]/80 text-sm font-medium">{badge}</span>
                  </div>
                )}
                
                {/* Main Heading */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight tracking-tight text-[#FCFBF4]">
                  {title}
                </h1>
                
                {/* Subtitle */}
                {subtitle && (
                  <p className="text-lg sm:text-xl md:text-2xl text-[#FCFBF4]/70 mb-8 font-light leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form Content */}
              <div className="w-full">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}