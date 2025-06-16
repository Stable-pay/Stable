import { ReactNode } from 'react';
import { Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppKit } from '@reown/appkit/react';

interface UniversalPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  showDisconnect?: boolean;
  onDisconnect?: () => void;
}

export function UniversalPageLayout({ 
  children, 
  title, 
  subtitle, 
  badge, 
  showDisconnect = false,
  onDisconnect 
}: UniversalPageLayoutProps) {
  const { open } = useAppKit();

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    }
    open({ view: 'Account' });
  };

  return (
    <div className="pwa-fullscreen bg-gradient-to-br from-[#6667AB] via-[#6667AB] to-[#5A5B9F] relative overflow-hidden no-pull-refresh">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6667AB]/90 via-[#6667AB]/95 to-[#5A5B9F]/90" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FCFBF4]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FCFBF4]/5 rounded-full blur-3xl"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-repeat" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FCFBF4' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }} />
      
      {/* Content Area */}
      <div className="relative z-10 safe-area-inset pwa-scrollable">
        <div className="mobile-container min-h-screen flex flex-col">
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
                <div className="hidden sm:flex items-center gap-6 text-sm text-[#FCFBF4]/70 mr-4">
                  <span>How it works</span>
                  <span>Security</span>
                  <span>Support</span>
                </div>
                {showDisconnect && (
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    size="sm"
                    className="border-[#FCFBF4]/20 text-[#FCFBF4] hover:bg-[#FCFBF4]/10 hover:text-[#FCFBF4] bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center py-8 sm:py-20">
            <div className="max-w-4xl mx-auto text-center w-full">
              {/* Badge */}
              {badge && (
                <div className="inline-flex items-center gap-2 bg-[#FCFBF4]/10 backdrop-blur-sm border border-[#FCFBF4]/20 px-4 py-2 rounded-full mb-8 animate-fade-in-up">
                  <div className="w-2 h-2 bg-[#FCFBF4] rounded-full animate-pulse"></div>
                  <span className="text-[#FCFBF4]/80 text-sm font-medium">{badge}</span>
                </div>
              )}
              
              {/* Main Heading */}
              <h1 className="mobile-text-2xl font-bold mb-6 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <span className="text-[#FCFBF4]">{title}</span>
              </h1>
              
              {/* Subtitle */}
              {subtitle && (
                <p className="mobile-text-lg text-[#FCFBF4]/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  {subtitle}
                </p>
              )}

              {/* Content */}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}