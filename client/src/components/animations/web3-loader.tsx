import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Web3LoaderProps {
  size?: number;
  color?: string;
}

export function Web3Loader({ size = 60, color = '#6667AB' }: Web3LoaderProps) {
  const [currentDot, setCurrentDot] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % 3);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="rounded-full"
          style={{ 
            backgroundColor: currentDot === index ? color : '#E5E7EB',
            width: size / 6,
            height: size / 6
          }}
          animate={{
            scale: currentDot === index ? 1.2 : 1,
            opacity: currentDot === index ? 1 : 0.4
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export function Web3SpinLoader({ size = 40, color = '#6667AB' }: Web3LoaderProps) {
  return (
    <motion.div
      className="border-2 border-gray-200 rounded-full"
      style={{ 
        width: size, 
        height: size,
        borderTopColor: color
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

export function Web3PulseLoader({ size = 60, color = '#6667AB' }: Web3LoaderProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border-2"
          style={{ 
            borderColor: color,
            width: size,
            height: size
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.4,
            ease: "easeInOut"
          }}
        />
      ))}
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}