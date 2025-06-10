import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
  glow?: boolean;
  hover?: boolean;
}

export function EnhancedCard({ 
  children, 
  className, 
  title, 
  subtitle, 
  icon, 
  gradient = false,
  glow = false,
  hover = true 
}: EnhancedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      className={cn(
        "relative",
        glow && "drop-shadow-2xl",
        className
      )}
    >
      <Card className={cn(
        "relative overflow-hidden border-0 backdrop-blur-sm",
        gradient && "bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-900/90 dark:via-gray-900/80 dark:to-gray-900/70",
        !gradient && "bg-white/95 dark:bg-gray-900/95",
        glow && "shadow-2xl shadow-cyan-500/20",
        "transition-all duration-300"
      )}>
        {gradient && (
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-green-500/10" />
        )}
        
        {title && (
          <CardHeader className="relative pb-3">
            <CardTitle className="flex items-center gap-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {icon}
              <div>
                {title}
                {subtitle && (
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </CardTitle>
          </CardHeader>
        )}
        
        <CardContent className="relative">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}