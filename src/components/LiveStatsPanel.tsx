import { Activity, Wind, Droplets, Navigation2, TrendingUp } from 'lucide-react';
import { ExposureData } from '@/services/liveExposureService';

interface LiveStatsPanelProps {
    distanceRemaining: number; // meters
    timeRemaining: number; // seconds
    exposureData: ExposureData;
}

const LiveStatsPanel = ({
    distanceRemaining,
    timeRemaining,
    exposureData
}: LiveStatsPanelProps) => {
    // Format distance
    const formatDistance = (meters: number): string => {
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        if (mins < 60) {
            return `${mins} min`;
        }
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return `${hours}h ${remainingMins}m`;
    };

    // Get AQI level color and text
    const getAQIInfo = (aqi: number) => {
        if (aqi <= 50) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Good' };
        if (aqi <= 100) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moderate' };
        if (aqi <= 150) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Unhealthy for Sensitive' };
        if (aqi <= 200) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Unhealthy' };
        return { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Very Unhealthy' };
    };

    // Get exposure level info
    const getExposureLevelInfo = (level: string) => {
        switch (level) {
            case 'low':
                return { icon: '🟢', text: 'Low', color: 'text-green-600' };
            case 'moderate':
                return { icon: '🟡', text: 'Moderate', color: 'text-yellow-600' };
            case 'high':
                return { icon: '🟠', text: 'High', color: 'text-orange-600' };
            case 'very-high':
                return { icon: '🔴', text: 'Very High', color: 'text-red-600' };
            default:
                return { icon: '⚪', text: 'Unknown', color: 'text-gray-600' };
        }
    };

    const currentAQI = exposureData.currentPollution?.aqi || 0;
    const aqiInfo = getAQIInfo(currentAQI);
    const exposureLevel = getExposureLevelInfo(exposureData.exposureLevel);

    return (
        <div className="glass-panel p-4 space-y-3 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Navigation2 className="w-5 h-5 text-primary animate-pulse" />
                <h3 className="font-semibold text-sm">Navigation Active</h3>
            </div>

            {/* Distance & Time */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Distance Left</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                        {formatDistance(distanceRemaining)}
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Time Left</span>
                    </div>
                    <div className="text-lg font-bold text-foreground">
                        {formatTime(timeRemaining)}
                    </div>
                </div>
            </div>

            {/* Current AQI */}
            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wind className="w-3.5 h-3.5" />
                    <span>Current Air Quality</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full ${aqiInfo.bg} ${aqiInfo.color} text-xs font-semibold`}>
                        AQI {currentAQI}
                    </div>
                    <span className="text-xs text-muted-foreground">{aqiInfo.label}</span>
                </div>
            </div>

            {/* Pollution Ahead */}
            {exposureData.pollutionAhead && (
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Navigation2 className="w-3.5 h-3.5" />
                        <span>Pollution Ahead (300m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${exposureLevel.color}`}>
                            {exposureLevel.icon} {exposureLevel.text}
                        </span>
                    </div>
                </div>
            )}

            {/* Total Dose Inhaled */}
            <div className="space-y-1.5 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Droplets className="w-3.5 h-3.5" />
                    <span>PM2.5 Inhaled</span>
                </div>
                <div className="text-base font-bold text-foreground">
                    {Math.round(exposureData.totalDoseInhaled)} μg
                </div>
                <div className="text-xs text-muted-foreground">
                    Ventilation: {exposureData.currentVentilationRate} L/min
                </div>
            </div>
        </div>
    );
};

export default LiveStatsPanel;
