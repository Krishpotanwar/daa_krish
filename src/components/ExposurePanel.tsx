import { TrendingDown, Heart, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExposurePanelProps {
  fastestDose: number;
  healthDose: number;
  userMode: 'pedestrian' | 'cyclist';
}

const ExposurePanel = ({ fastestDose, healthDose, userMode }: ExposurePanelProps) => {
  const reduction = Math.round(((fastestDose - healthDose) / fastestDose) * 100);
  const doseSaved = fastestDose - healthDose;

  const breathingMultiplier = userMode === 'cyclist' ? 2.5 : 1.0;

  return (
    <div className="glass-panel p-5 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-clean flex items-center justify-center shadow-glow">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Health Protection</h3>
          <p className="text-xs text-muted-foreground">Lung exposure comparison</p>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="space-y-3">
        {/* Fastest Route */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Fastest Route</span>
            <span className="font-semibold text-pollution-high">{fastestDose} µg</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-pollution-high rounded-full transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Health Route */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Health-Optimized</span>
            <span className="font-semibold text-pollution-low">{healthDose} µg</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-pollution-low rounded-full transition-all duration-500"
              style={{ width: `${(healthDose / fastestDose) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reduction Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-accent/50 border border-accent">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Reduction</span>
          </div>
          <div className="text-2xl font-display font-bold text-primary">{reduction}%</div>
        </div>

        <div className="p-3 rounded-xl bg-accent/50 border border-accent">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Saved</span>
          </div>
          <div className="text-2xl font-display font-bold text-primary">{doseSaved} µg</div>
        </div>
      </div>

      {/* Breathing Rate Info */}
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-secondary" />
          <span className="text-xs font-medium text-foreground">Breathing Rate Factor</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize">{userMode}</span>
          <span className={cn(
            'text-sm font-bold',
            userMode === 'cyclist' ? 'text-pollution-moderate' : 'text-pollution-low'
          )}>
            {breathingMultiplier}x
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {userMode === 'cyclist' 
            ? 'Cycling increases breathing rate, making cleaner routes more important.'
            : 'Walking has baseline breathing rate for exposure calculation.'}
        </p>
      </div>
    </div>
  );
};

export default ExposurePanel;
