import { AlertTriangle, X, ArrowRight, Clock } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HealthAlertProps {
  exceedsIn: number; // minutes
  alternativeAddsMinutes: number;
  onDismiss: () => void;
  onSwitchRoute: () => void;
}

const HealthAlert = ({
  exceedsIn,
  alternativeAddsMinutes,
  onDismiss,
  onSwitchRoute
}: HealthAlertProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  return (
    <div className={cn(
      'fixed bottom-28 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-2rem)] z-50',
      'animate-slide-in-right'
    )}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-health-warning/90 to-health-danger/90 border border-health-warning/30 p-4 shadow-lg backdrop-blur-xl">
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-health-warning/50 animate-pulse" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-foreground/10 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-health-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-health-warning" />
          </div>

          <div className="flex-1 pr-6">
            <h4 className="font-display font-semibold text-foreground mb-1">
              Health Alert
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              This route exceeds safe PM2.5 exposure in <strong className="text-health-warning">{exceedsIn} minutes</strong>.
              WHO recommends max 15 µg/m³ daily average.
            </p>

            <button
              onClick={onSwitchRoute}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-clean text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-glow"
            >
              <span>Switch to cleaner route</span>
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Clock className="w-3 h-3" />
                <span>+{alternativeAddsMinutes} min</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAlert;
