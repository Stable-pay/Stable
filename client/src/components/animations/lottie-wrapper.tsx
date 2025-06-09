import { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface LottieWrapperProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  onComplete?: () => void;
  speed?: number;
  direction?: 1 | -1;
  trigger?: boolean;
}

export function LottieWrapper({
  animationData,
  className = '',
  loop = true,
  autoplay = true,
  onComplete,
  speed = 1,
  direction = 1,
  trigger = true
}: LottieWrapperProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.setSpeed(speed);
      lottieRef.current.setDirection(direction);
      
      if (trigger && !autoplay) {
        lottieRef.current.play();
      } else if (!trigger) {
        lottieRef.current.pause();
      }
    }
  }, [speed, direction, trigger, autoplay]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      onComplete={onComplete}
      className={className}
      style={{
        height: '100%',
        width: '100%'
      }}
    />
  );
}

// Predefined animation configurations for consistent UX
export const animationConfigs = {
  success: {
    loop: false,
    autoplay: true,
    speed: 1.2,
    className: 'h-16 w-16'
  },
  loading: {
    loop: true,
    autoplay: true,
    speed: 1,
    className: 'h-8 w-8'
  },
  error: {
    loop: false,
    autoplay: true,
    speed: 0.8,
    className: 'h-12 w-12'
  },
  transfer: {
    loop: true,
    autoplay: true,
    speed: 0.6,
    className: 'h-20 w-20'
  },
  wallet: {
    loop: true,
    autoplay: true,
    speed: 0.4,
    className: 'h-24 w-24'
  }
};