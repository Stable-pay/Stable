import { ReactNode } from 'react';
import { MobileNavigation } from './mobile-navigation';

interface MobileLayoutProps {
  children: ReactNode;
  currentStep: string;
  isConnected: boolean;
  onNavigate: (step: string) => void;
  showNavigation?: boolean;
}

export function MobileLayout({ 
  children, 
  currentStep, 
  isConnected, 
  onNavigate, 
  showNavigation = true 
}: MobileLayoutProps) {
  return (
    <div className="pwa-fullscreen bg-gradient-to-br from-[#6667AB] via-[#6667AB] to-[#5A5B9F] relative overflow-hidden no-pull-refresh">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6667AB]/90 via-[#6667AB]/95 to-[#5A5B9F]/90" />
      <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-repeat" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FCFBF4' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
      }} />
      
      {/* Content Area */}
      <div className="relative z-10 safe-area-inset pwa-scrollable">
        <div className={`${showNavigation ? 'pb-20' : ''}`}>
          <div className="mobile-container min-h-screen">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {showNavigation && (
        <MobileNavigation 
          currentStep={currentStep}
          isConnected={isConnected}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}