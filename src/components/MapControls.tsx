import { ZoomIn, ZoomOut, Target, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRecenter: () => void;
    followingUser?: boolean;
    currentZoom?: number;
    maxZoom?: number;
    minZoom?: number;
    compassMode?: boolean;
    onToggleCompass?: () => void;
    mapRotation?: number; // degrees, 0 = north up
}

const MapControls = ({
    onZoomIn,
    onZoomOut,
    onRecenter,
    followingUser = false,
    currentZoom = 13,
    maxZoom = 18,
    minZoom = 3,
    compassMode = false,
    onToggleCompass,
    mapRotation = 0
}: MapControlsProps) => {
    const canZoomIn = currentZoom < maxZoom;
    const canZoomOut = currentZoom > minZoom;

    return (
        <div className="absolute bottom-24 right-4 z-[10] flex flex-col gap-2">
            {/* Zoom In */}
            <Button
                onClick={onZoomIn}
                disabled={!canZoomIn}
                size="icon"
                className="glass-panel w-10 h-10 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                title="Zoom In"
            >
                <ZoomIn className="w-5 h-5" />
            </Button>

            {/* Zoom Out */}
            <Button
                onClick={onZoomOut}
                disabled={!canZoomOut}
                size="icon"
                className="glass-panel w-10 h-10 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                title="Zoom Out"
            >
                <ZoomOut className="w-5 h-5" />
            </Button>

            {/* Recenter / Follow User */}
            <Button
                onClick={onRecenter}
                size="icon"
                className={`glass-panel w-10 h-10 shadow-md hover:shadow-lg transition-all duration-200 ${followingUser
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-white/80 hover:bg-white/90'
                    }`}
                title={followingUser ? "Following Location" : "Recenter on Location"}
            >
                <Target className={`w-5 h-5 ${followingUser ? 'animate-pulse' : ''}`} />
            </Button>

            {/* Compass */}
            <Button
                onClick={onToggleCompass}
                size="icon"
                className={`glass-panel w-10 h-10 shadow-md hover:shadow-lg transition-all duration-200 ${compassMode
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-white/80 hover:bg-white/90'
                    }`}
                title={compassMode ? "Compass Mode: ON" : "Compass Mode: OFF"}
            >
                <Compass
                    className="w-5 h-5"
                    style={{
                        transform: `rotate(${-mapRotation}deg)`,
                        transition: 'transform 0.3s ease'
                    }}
                />
            </Button>
        </div>
    );
};

export default MapControls;
