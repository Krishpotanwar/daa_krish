import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface Route {
  id: string;
  name: string;
  color: string;
  points: { x: number; y: number }[];
  visible: boolean;
}

interface MapViewProps {
  routes: Route[];
  selectedRoute: string;
  onSelectRoute: (id: string) => void;
}

const MapView = ({ routes, selectedRoute, onSelectRoute }: MapViewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isLoading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Draw dark map background
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid (streets)
    ctx.strokeStyle = '#2a3a4a';
    ctx.lineWidth = 1;

    // Horizontal streets
    for (let y = 50; y < rect.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Vertical streets
    for (let x = 50; x < rect.width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }

    // Draw some pollution zones (subtle colored areas)
    const pollutionZones = [
      { x: 150, y: 120, r: 80, color: 'rgba(239, 68, 68, 0.15)' },
      { x: 350, y: 200, r: 60, color: 'rgba(245, 158, 11, 0.12)' },
      { x: 250, y: 350, r: 100, color: 'rgba(239, 68, 68, 0.1)' },
      { x: 450, y: 150, r: 70, color: 'rgba(245, 158, 11, 0.1)' },
    ];

    pollutionZones.forEach(zone => {
      const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.r);
      gradient.addColorStop(0, zone.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw routes
    routes.forEach(route => {
      if (!route.visible) return;

      const isSelected = route.id === selectedRoute;
      ctx.strokeStyle = route.color;
      ctx.lineWidth = isSelected ? 5 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (!isSelected) {
        ctx.globalAlpha = 0.4;
        ctx.setLineDash([8, 8]);
      } else {
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      route.points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      // Glow effect for selected route
      if (isSelected) {
        ctx.shadowColor = route.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    });

    // Draw start point
    const startPoint = { x: 80, y: 380 };
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw end point
    const endPoint = { x: 480, y: 80 };
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();

  }, [routes, selectedRoute, isLoading]);

  if (isLoading) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#1a2332] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={(e) => {
          // Simple click detection for route selection
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Check if click is near any route
          routes.forEach(route => {
            if (!route.visible) return;
            const isNear = route.points.some(p => 
              Math.abs(p.x - x) < 20 && Math.abs(p.y - y) < 20
            );
            if (isNear) onSelectRoute(route.id);
          });
        }}
      />
      
      {/* Map Labels */}
      <div className="absolute top-4 left-4 glass-panel px-3 py-2 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">Downtown District</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-panel px-3 py-2">
        <div className="text-xs font-medium mb-2">Pollution Level</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-pollution-low" />
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-pollution-moderate" />
            <span className="text-xs text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-pollution-high" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </div>

      {/* Compass */}
      <div className="absolute top-4 right-4 glass-panel w-10 h-10 flex items-center justify-center">
        <Navigation className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
};

export default MapView;
