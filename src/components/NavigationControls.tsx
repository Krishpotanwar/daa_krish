import { Navigation, Square, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationControlsProps {
    navigationActive: boolean;
    followUser: boolean;
    onStartNavigation: () => void;
    onStopNavigation: () => void;
    onRecenter: () => void;
    disabled?: boolean;
}

const NavigationControls = ({
    navigationActive,
    followUser,
    onStartNavigation,
    onStopNavigation,
    onRecenter,
    disabled = false
}: NavigationControlsProps) => {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10] flex items-center gap-3">
            {!navigationActive ? (
                <Button
                    onClick={onStartNavigation}
                    disabled={disabled}
                    size="lg"
                    className="glass-panel bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-base font-semibold"
                >
                    <Navigation className="w-5 h-5 mr-2" />
                    Start Navigation
                </Button>
            ) : (
                <>
                    <Button
                        onClick={onStopNavigation}
                        size="lg"
                        variant="destructive"
                        className="glass-panel shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6"
                    >
                        <Square className="w-5 h-5 mr-2" />
                        Stop
                    </Button>

                    <Button
                        onClick={onRecenter}
                        size="lg"
                        variant={followUser ? "default" : "outline"}
                        className={`glass-panel shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 ${followUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/80 hover:bg-white/90'
                            }`}
                    >
                        <Target className={`w-5 h-5 ${followUser ? 'animate-pulse' : ''}`} />
                    </Button>
                </>
            )}
        </div>
    );
};

export default NavigationControls;
