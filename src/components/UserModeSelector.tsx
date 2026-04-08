import { User, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserModeSelectorProps {
  mode: 'pedestrian' | 'cyclist';
  onChange: (mode: 'pedestrian' | 'cyclist') => void;
}

const UserModeSelector = ({ mode, onChange }: UserModeSelectorProps) => {
  const modes = [
    { id: 'pedestrian' as const, label: 'Walking', icon: User, multiplier: '1.0x' },
    { id: 'cyclist' as const, label: 'Cycling', icon: Bike, multiplier: '2.5x' },
  ];

  return (
    <div className="glass-panel p-2 inline-flex gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200',
            mode === m.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <m.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{m.label}</span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            mode === m.id ? 'bg-primary-foreground/20' : 'bg-muted'
          )}>
            {m.multiplier}
          </span>
        </button>
      ))}
    </div>
  );
};

export default UserModeSelector;
