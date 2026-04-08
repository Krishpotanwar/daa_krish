import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, Popup, Circle, useMapEvents } from 'react-leaflet';
import L, { LatLngExpression, LocationEvent } from 'leaflet';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import MapControls from './MapControls';
import { reverseGeocode } from '@/services/geocodingService';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Route {
  id: string;
  name: string;
  color: string;
  coordinates: LatLngExpression[];
  visible: boolean;
}

interface PollutionZone {
  center: LatLngExpression;
  radius: number;
  level: 'low' | 'moderate' | 'high';
}

interface InteractiveMapProps {
  routes: Route[];
  selectedRoute: string;
  onSelectRoute: (id: string) => void;
  startPoint: LatLngExpression;
  endPoint: LatLngExpression;
  startName?: string;
  endName?: string;
  pollutionZones: PollutionZone[];
  userPosition?: LatLngExpression | null;
  userAccuracy?: number;
  navigationActive?: boolean;
  followUser?: boolean;
  onZoomChange?: (zoom: number) => void;
  onRecenter?: () => void;
  navigationProgress?: number;
  userHeading?: number | null;
  compassMode?: boolean;
  onToggleCompass?: () => void;
  onSetStart?: (location: { lat: number, lon: number, name: string }) => void;
  onSetEnd?: (location: { lat: number, lon: number, name: string }) => void;
}

// Custom marker icons using divIcon
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const startIcon = createCustomIcon('#14b8a6');
const endIcon = createCustomIcon('#0ea5e9');

// User location marker with pulsing animation
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .user-location-marker {
          animation: pulse 2s ease-in-out infinite;
        }
      </style>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="user-location-marker">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="3"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `,
    className: 'user-location-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const userLocationIcon = createUserLocationIcon();

// Component to fit bounds
const FitBounds = ({ routes, startPoint, endPoint }: { routes: Route[], startPoint: LatLngExpression, endPoint: LatLngExpression }) => {
  const map = useMap();

  useEffect(() => {
    const points: LatLngExpression[] = [];

    if (routes.length > 0) {
      routes.forEach(r => points.push(...r.coordinates));
    } else {
      points.push(startPoint);
      points.push(endPoint);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, routes, startPoint, endPoint]);

  return null;
};

// Component to follow user location
const FollowUser = ({
  userPosition,
  followUser,
  navigationActive
}: {
  userPosition: LatLngExpression | null;
  followUser: boolean;
  navigationActive: boolean;
}) => {
  const map = useMap();

  useEffect(() => {
    if (followUser && userPosition && navigationActive) {
      map.setView(userPosition, navigationActive ? 16 : map.getZoom(), {
        animate: true,
        duration: 0.5
      });
    }
  }, [map, userPosition, followUser, navigationActive]);

  return null;
};

// Route line component with progress visualization
const RouteLine = ({
  coordinates,
  color,
  isSelected,
  onClick,
  navigationActive,
  userPosition,
  progress
}: {
  coordinates: LatLngExpression[];
  color: string;
  isSelected: boolean;
  onClick: () => void;
  navigationActive?: boolean;
  userPosition?: LatLngExpression | null;
  progress?: number;
}) => {
  const shouldSplit = navigationActive && isSelected && userPosition && progress !== undefined;

  let completedPath: LatLngExpression[] = [];
  let remainingPath: LatLngExpression[] = [];

  if (shouldSplit && progress > 0) {
    const splitIndex = Math.floor((coordinates.length - 1) * (progress / 100));
    completedPath = coordinates.slice(0, splitIndex + 1);
    remainingPath = coordinates.slice(splitIndex);
  }

  return (
    <>
      {shouldSplit && completedPath.length > 1 ? (
        <>
          <Polyline
            positions={completedPath}
            pathOptions={{
              color: '#9ca3af',
              weight: 4,
              opacity: 0.6,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: '10, 10',
            }}
          />
          {remainingPath.length > 1 && (
            <>
              <Polyline
                positions={remainingPath}
                pathOptions={{
                  color: color,
                  weight: 12,
                  opacity: 0.3,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <Polyline
                positions={remainingPath}
                pathOptions={{
                  color: color,
                  weight: 6,
                  opacity: 1,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: onClick,
                }}
              />
            </>
          )}
        </>
      ) : (
        <>
          {isSelected && (
            <Polyline
              positions={coordinates}
              pathOptions={{
                color: color,
                weight: 12,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}
          <Polyline
            positions={coordinates}
            pathOptions={{
              color: color,
              weight: isSelected ? 5 : 3,
              opacity: isSelected ? 1 : 0.5,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: isSelected ? undefined : '8, 8',
            }}
            eventHandlers={{
              click: onClick,
            }}
          />
        </>
      )}
    </>
  );
};

const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) => {
  const countRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useMapEvents({
    click(e) {
      countRef.current += 1;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (countRef.current === 3) {
        onLocationSelect(e.latlng);
        countRef.current = 0;
        timerRef.current = null;
      } else {
        timerRef.current = setTimeout(() => {
          countRef.current = 0;
        }, 500);
      }
    },
  });
  return null;
};

const InteractiveMap = ({
  routes,
  selectedRoute,
  onSelectRoute,
  startPoint,
  endPoint,
  startName = 'Start',
  endName = 'Destination',
  pollutionZones,
  userPosition = null,
  userAccuracy = 0,
  navigationActive = false,
  followUser = false,
  navigationProgress = 0,
  userHeading = null,
  compassMode = false,
  onToggleCompass,
  onZoomChange,
  onRecenter,
  onSetStart,
  onSetEnd
}: InteractiveMapProps) => {
  const [mounted, setMounted] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const [mapRotation, setMapRotation] = useState(0);
  const mapRef = useRef<L.Map | null>(null);

  const [showTraffic, setShowTraffic] = useState(true);
  const tomTomApiKey = import.meta.env.VITE_TOMTOM_API_KEY;

  const [clickedLocation, setClickedLocation] = useState<{ latlng: L.LatLng, address: string | null } | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (compassMode && navigationActive && userHeading !== null && mapRef.current) {
      const newRotation = userHeading;
      setMapRotation(newRotation);
      const mapContainer = mapRef.current.getContainer();
      if (mapContainer) {
        mapContainer.style.transform = `rotate(${newRotation}deg)`;
        mapContainer.style.transition = 'transform 0.5s ease';
      }
    } else if (mapRef.current) {
      const mapContainer = mapRef.current.getContainer();
      if (mapContainer) {
        mapContainer.style.transform = 'rotate(0deg)';
        setMapRotation(0);
      }
    }
  }, [compassMode, navigationActive, userHeading]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newZoom = Math.min(currentZoom + 1, 18);
      mapRef.current.setZoom(newZoom);
      setCurrentZoom(newZoom);
      onZoomChange?.(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newZoom = Math.max(currentZoom - 1, 3);
      mapRef.current.setZoom(newZoom);
      setCurrentZoom(newZoom);
      onZoomChange?.(newZoom);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current && userPosition) {
      mapRef.current.setView(userPosition, navigationActive ? 16 : currentZoom, {
        animate: true,
        duration: 0.5
      });
      onRecenter?.();
    }
  };

  const handleMapClick = async (latlng: L.LatLng) => {
    if (navigationActive) return; // Disable click selection during navigation

    setClickedLocation({ latlng, address: null });
    setIsLoadingAddress(true);

    try {
      const address = await reverseGeocode(latlng.lat, latlng.lng);
      setClickedLocation({ latlng, address: address || `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` });
    } catch (error) {
      setClickedLocation({ latlng, address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` });
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const getPollutionColor = (level: 'low' | 'moderate' | 'high') => {
    switch (level) {
      case 'low': return { fill: '#22c55e', stroke: '#16a34a' };
      case 'moderate': return { fill: '#f59e0b', stroke: '#d97706' };
      case 'high': return { fill: '#ef4444', stroke: '#dc2626' };
    }
  };

  if (!mounted) {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={startPoint}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        className="z-0"
        ref={(map) => {
          if (map) {
            mapRef.current = map;
            map.on('zoomend', () => {
              const zoom = map.getZoom();
              setCurrentZoom(zoom);
              onZoomChange?.(zoom);
            });
          }
        }}
      >
        <FitBounds routes={routes} startPoint={startPoint} endPoint={endPoint} />
        <FollowUser
          userPosition={userPosition}
          followUser={followUser}
          navigationActive={navigationActive}
        />
        <MapClickHandler onLocationSelect={handleMapClick} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showTraffic && tomTomApiKey && (
          <TileLayer
            attribution='&copy; <a href="https://www.tomtom.com">TomTom</a>'
            url={`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${tomTomApiKey}`}
          />
        )}

        {pollutionZones.map((zone, index) => {
          const colors = getPollutionColor(zone.level);
          return (
            <Circle
              key={index}
              center={zone.center}
              radius={zone.radius * 2}
              pathOptions={{
                fillColor: colors.fill,
                fillOpacity: 0.2,
                color: colors.stroke,
                weight: 1,
                opacity: 0.4,
              }}
            >
              <Popup>
                <span className="capitalize font-medium">{zone.level} Pollution</span>
              </Popup>
            </Circle>
          );
        })}

        {routes.filter(r => r.visible).map((route) => (
          <RouteLine
            key={route.id}
            coordinates={route.coordinates}
            color={route.color}
            isSelected={route.id === selectedRoute}
            onClick={() => onSelectRoute(route.id)}
            navigationActive={navigationActive}
            userPosition={userPosition}
            progress={route.id === selectedRoute ? navigationProgress : undefined}
          />
        ))}

        <Marker position={startPoint} icon={startIcon}>
          <Popup>Start: {startName}</Popup>
        </Marker>

        <Marker position={endPoint} icon={endIcon}>
          <Popup>Destination: {endName}</Popup>
        </Marker>

        {clickedLocation && (
          <Marker position={clickedLocation.latlng}>
            <Popup eventHandlers={{ remove: () => setClickedLocation(null) }}>
              <div className="p-1 space-y-2 max-w-[200px]">
                <p className="text-sm font-medium mb-2 break-words">
                  {isLoadingAddress ? 'Loading address...' : clickedLocation.address}
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      if (clickedLocation.address) {
                        onSetStart?.({ lat: clickedLocation.latlng.lat, lon: clickedLocation.latlng.lng, name: clickedLocation.address });
                        setClickedLocation(null);
                      }
                    }}
                    className="w-full px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs rounded transition-colors"
                    disabled={isLoadingAddress}
                  >
                    Set as Start
                  </button>
                  <button
                    onClick={() => {
                      if (clickedLocation.address) {
                        onSetEnd?.({ lat: clickedLocation.latlng.lat, lon: clickedLocation.latlng.lng, name: clickedLocation.address });
                        setClickedLocation(null);
                      }
                    }}
                    className="w-full px-2 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs rounded transition-colors"
                    disabled={isLoadingAddress}
                  >
                    Set as Destination
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {userPosition && (
          <>
            {userAccuracy > 0 && (
              <Circle
                center={userPosition}
                radius={userAccuracy}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  color: '#3b82f6',
                  weight: 1,
                  opacity: 0.3,
                }}
              />
            )}
            <Marker position={userPosition} icon={userLocationIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-3 py-2 flex items-center gap-2 z-[10]">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">{startName.split(',')[0]}</span>
      </div>

      <div className="absolute top-4 right-4 glass-panel px-3 py-2 z-[10] cursor-pointer hover:bg-white/90 transition-colors"
        onClick={() => setShowTraffic(!showTraffic)}>
        <button className={`text-xs font-medium flex items-center gap-2 ${showTraffic ? 'text-green-600' : 'text-gray-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 9h-5L8 14h5a2 2 0 0 1 2 2v4"></path>
            <circle cx="11.5" cy="5.5" r="2.5"></circle>
            <path d="M5 18v-4"></path>
            <path d="M19 18v-4"></path>
          </svg>
          {showTraffic ? 'Traffic: ON' : 'Traffic: OFF'}
        </button>
      </div>

      {showTraffic && (
        <div className="absolute top-16 right-4 glass-panel px-3 py-2 z-[10]">
          <div className="text-xs font-medium mb-2">Traffic Flow</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-muted-foreground">Fast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1 rounded-full bg-[#f97316]" />
              <span className="text-xs text-muted-foreground">Slow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1 rounded-full bg-[#ef4444]" />
              <span className="text-xs text-muted-foreground">Jam</span>
            </div>
          </div>
        </div>
      )}
      <div className="absolute bottom-4 right-4 glass-panel px-3 py-2 z-[10]">
        <div className="text-xs font-medium mb-2">Pollution Level</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-xs text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </div>



      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={handleRecenter}
        followingUser={followUser}
        currentZoom={currentZoom}
        maxZoom={18}
        minZoom={3}
        compassMode={compassMode}
        onToggleCompass={onToggleCompass}
        mapRotation={mapRotation}
      />
    </div>
  );
};

export default InteractiveMap;
