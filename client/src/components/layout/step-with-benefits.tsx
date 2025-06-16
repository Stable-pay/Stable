import { ReactNode } from 'react';
import { Globe, LogOut, Shield, Zap, Clock, CheckCircle, TrendingUp, Globe as GlobalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  const benefits = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your funds are protected by enterprise-grade encryption and multi-signature wallets"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Transfers complete in 2-5 minutes vs 3-5 days with traditional banks"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Send money anytime, anywhere - no banking hours or weekend delays"
    },
    {
      icon: TrendingUp,
      title: "Best Exchange Rates",
      description: "Live market rates with transparent fees - no hidden charges ever"
    },
    {
      icon: GlobalIcon,
      title: "Global Reach",
      description: "Connect to 200+ countries with local payment methods"
    },
    {
      icon: CheckCircle,
      title: "Regulatory Compliant",
      description: "Fully licensed and compliant with international financial regulations"
    }
  ];

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
        <div className="mobile-container min-h-screen">
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

          {/* Main Content Grid */}
          <main className="py-8 sm:py-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left Column - Main Content */}
              <div className="order-2 lg:order-1">
                <div className="text-center lg:text-left mb-8">
                  {/* Badge */}
                  {badge && (
                    <div className="inline-flex items-center gap-2 bg-[#FCFBF4]/10 backdrop-blur-sm border border-[#FCFBF4]/20 px-4 py-2 rounded-full mb-6 animate-fade-in-up">
                      <div className="w-2 h-2 bg-[#FCFBF4] rounded-full animate-pulse"></div>
                      <span className="text-[#FCFBF4]/80 text-sm font-medium">{badge}</span>
                    </div>
                  )}
                  
                  {/* Main Heading */}
                  <h1 className="mobile-text-2xl font-bold mb-4 leading-tight tracking-tight text-[#FCFBF4] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {title}
                  </h1>
                  
                  {/* Subtitle */}
                  {subtitle && (
                    <p className="mobile-text-lg text-[#FCFBF4]/70 mb-8 font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      {subtitle}
                    </p>
                  )}
                </div>

                {/* Form Content */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {children}
                </div>
              </div>

              {/* Right Column - Benefits */}
              <div className="order-1 lg:order-2">
                <div className="lg:sticky lg:top-8">
                  <div className="text-center lg:text-left mb-8">
                    <h2 className="text-2xl font-bold text-[#FCFBF4] mb-4">Why Choose StablePay?</h2>
                    <p className="text-[#FCFBF4]/70 leading-relaxed">
                      Experience the future of money transfers with blockchain technology
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {benefits.map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <Card 
                          key={index}
                          className="mobile-card bg-[#FCFBF4]/10 backdrop-blur-md border-[#FCFBF4]/20 hover:bg-[#FCFBF4]/15 transition-all duration-300 animate-fade-in-up"
                          style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                        >
                          <div className="p-4 flex items-start gap-3">
                            <div className="w-10 h-10 bg-[#FCFBF4]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-[#FCFBF4]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#FCFBF4] mb-1">{benefit.title}</h3>
                              <p className="text-sm text-[#FCFBF4]/70 leading-relaxed">{benefit.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}