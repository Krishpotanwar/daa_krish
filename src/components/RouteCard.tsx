import { Clock, Wind, Activity, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  id: string;
  name: string;
  algorithm: string;
  duration: string;
  distance: string;
  pollutionScore: number;
  inhaledDose: number;
  color: string;
  isSelected: boolean;
  isRecommended?: boolean;
  hasAlert?: boolean;
  onClick: () => void;
}

const RouteCard = ({
  name,
  algorithm,
  duration,
  distance,
  pollutionScore,
  inhaledDose,
  color,
  isSelected,
  isRecommended,
  hasAlert,
  onClick,
}: RouteCardProps) => {
  const getPollutionLevel = (score: number) => {
    if (score < 30) return { label: 'Low', className: 'text-pollution-low' };
    if (score < 60) return { label: 'Moderate', className: 'text-pollution-moderate' };
    return { label: 'High', className: 'text-pollution-high' };
  };

  const pollution = getPollutionLevel(pollutionScore);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group',
        isSelected
          ? 'border-primary bg-accent shadow-glow'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
      )}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="absolute -top-1 -right-1 gradient-clean text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
          RECOMMENDED
        </div>
      )}

      {/* Route Color Indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-foreground">{name}</h3>
              {hasAlert && (
                <AlertTriangle className="w-4 h-4 text-health-warning animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest bg-muted/50 px-1.5 py-0.5 rounded mt-1 inline-block w-fit border border-border/50">
              Algorithm: {algorithm}
            </span>
          </div>
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 ml-2">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{duration}</div>
              <div className="text-xs text-muted-foreground">{distance}</div>
            </div>
          </div>

          {/* Pollution */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Wind className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <div className={cn('text-sm font-semibold', pollution.className)}>
                {pollution.label}
              </div>
              <div className="text-xs text-muted-foreground">AQI {pollutionScore}</div>
            </div>
          </div>
        </div>

        {/* Inhaled Dose */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Estimated Inhaled</span>
            </div>
            <span className="text-sm font-bold text-foreground">{inhaledDose} µg</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default RouteCard;
