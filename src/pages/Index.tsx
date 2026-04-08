import { useState, useCallback, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import InteractiveMap from '@/components/InteractiveMap';
import RouteCard from '@/components/RouteCard';
import ExposurePanel from '@/components/ExposurePanel';
import HealthAlert from '@/components/HealthAlert';
import UserModeSelector from '@/components/UserModeSelector';
import LocationSearch from '@/components/LocationSearch';
import WelcomeModal from '@/components/WelcomeModal';
import NavigationControls from '@/components/NavigationControls';
import LiveStatsPanel from '@/components/LiveStatsPanel';
import LungHealthScoreCard from '@/components/LungHealthScoreCard';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';
import { mockRoutes, pollutionZones, startPoint as defaultStart, endPoint as defaultEnd, calculateExceedanceTime, RouteData } from '@/data/routeData';
import { LatLngExpression } from 'leaflet';
import { PollutionZone } from '@/data/routeData';
import { searchLocation, reverseGeocode } from '@/services/geocodingService';
import { getRoutes } from '@/services/routingService';
import { getPollutionData, generatePollutionZones } from '@/services/pollutionService';
import { locationService, Position } from '@/services/locationService';
import { navigationService, NavigationRoute } from '@/services/navigationService';
import { liveExposureService, ExposureData } from '@/services/liveExposureService';
import { lungHealthScoringService } from '@/services/lungHealthScoringService';
import { ArrivalModal } from '@/components/ArrivalModal';
import { useToast } from "@/hooks/use-toast"

const Index = () => {
  const [selectedRoute, setSelectedRoute] = useState('health');
  const [userMode, setUserMode] = useState<'pedestrian' | 'cyclist'>('pedestrian');
  const [showAlert, setShowAlert] = useState(false);
  const [routesCalculated, setRoutesCalculated] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Navigation state
  const [navigationActive, setNavigationActive] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [compassMode, setCompassMode] = useState(false);
  const [userPosition, setUserPosition] = useState<LatLngExpression | null>(null);
  const [userAccuracy, setUserAccuracy] = useState(0);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [headerAqi, setHeaderAqi] = useState(42);
  const [headerStatus, setHeaderStatus] = useState('Good');
  const [showArrivalModal, setShowArrivalModal] = useState(false);

  // Navigation progress state
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [navigationProgress, setNavigationProgress] = useState(0); // 0-100 percentage
  const [exposureData, setExposureData] = useState<ExposureData>({
    currentPollution: null,
    pollutionAhead: null,
    totalDoseInhaled: 0,
    currentVentilationRate: 15,
    exposureLevel: 'low',
    timeInCurrentLevel: 0
  });

  // State for map data
  const [currentStart, setCurrentStart] = useState<LatLngExpression>(defaultStart);
  const [currentEnd, setCurrentEnd] = useState<LatLngExpression>(defaultEnd);
  const [startName, setStartName] = useState<string>('Delhi');
  const [endName, setEndName] = useState<string>('Delhi');
  const [currentRoutes, setCurrentRoutes] = useState<RouteData[]>([]);
  const [currentZones, setCurrentZones] = useState<PollutionZone[]>(pollutionZones);

  const { toast } = useToast();

  // Cleanup services on unmount
  useEffect(() => {
    return () => {
      locationService.stopWatching();
      navigationService.stopNavigation();
      liveExposureService.stopMonitoring();
    };
  }, []);

  // Initial load: Try to get current location or use default
  useEffect(() => {
    const init = async () => {
      const data = await getPollutionData(28.6295, 77.2185); // Delhi default
      if (data) {
        setHeaderAqi(data.aqi);
        setHeaderStatus(data.aqi <= 50 ? 'Good' : data.aqi <= 100 ? 'Moderate' : 'Unhealthy');
      }
    };
    init();
    setRoutesCalculated(true);
  }, []);

  // Listen for navigation arrival
  useEffect(() => {
    return navigationService.onArrival(() => {
      setShowArrivalModal(true);
      setNavigationActive(false);
      setFollowUser(false);
      locationService.stopWatching();
      navigationService.stopNavigation();
      toast({ title: "Destination Reached", description: "You have arrived at your destination." });
    });
  }, [toast]);

  const handleSearch = useCallback(async (from: string, to: string) => {
    console.log('Searching routes from', from, 'to', to);
    setIsSearching(true);
    setCurrentRoutes([]); // Clear existing routes before searching

    try {
      const startResult = await searchLocation(from);
      if (!startResult) {
        toast({ title: "Location not found", description: `Could not find location: ${from}`, variant: "destructive" });
        setIsSearching(false);
        return;
      }

      const endResult = await searchLocation(to);
      if (!endResult) {
        toast({ title: "Location not found", description: `Could not find location: ${to}`, variant: "destructive" });
        setIsSearching(false);
        return;
      }

      setCurrentStart([startResult.lat, startResult.lon]);
      setCurrentEnd([endResult.lat, endResult.lon]);
      setStartName(startResult.display_name);
      setEndName(endResult.display_name);

      try {
        const newZones = await generatePollutionZones({ lat: startResult.lat, lon: startResult.lon });
        const formattedZones: PollutionZone[] = newZones.map(z => ({
          center: z.center as LatLngExpression,
          radius: z.radius,
          level: z.level
        }));
        setCurrentZones(formattedZones);
      } catch (err) {
        console.warn("Failed to generate pollution zones", err);
      }

      const foundRoutes = await getRoutes(startResult, endResult, userMode);

      if (foundRoutes.length > 0) {
        setCurrentRoutes(foundRoutes);
        setRoutesCalculated(true);
        setSelectedRoute(foundRoutes[0].id);
        setShowAlert(foundRoutes[0].pollutionScore > 70);

        toast({
          title: "Routes found!",
          description: `Found ${foundRoutes.length} routes from ${startResult.display_name.split(',')[0]} to ${endResult.display_name.split(',')[0]}`,
        });
      } else {
        toast({
          title: "No routes found",
          description: "Could not calculate a route between these locations.",
          variant: "destructive"
        });
      }

      const headerData = await getPollutionData(startResult.lat, startResult.lon);
      if (headerData) {
        setHeaderAqi(headerData.aqi);
        setHeaderStatus(headerData.aqi <= 50 ? 'Good' : headerData.aqi <= 100 ? 'Moderate' : 'Unhealthy');
      }

    } catch (error) {
      console.error("Search error:", error);
      toast({ title: "Error", description: "An error occurred while searching. Please try again.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [toast, userMode]);

  // Re-calculate routes when travel mode changes
  useEffect(() => {
    const updateRoutes = async () => {
      // Only update if we have a valid route/start/end and not currently searching
      if (!currentStart || !currentEnd || !routesCalculated || isSearching) return;

      // Extract coordinates handling both array and object formats
      let startLat, startLon, endLat, endLon;

      if (Array.isArray(currentStart)) {
        [startLat, startLon] = currentStart;
      } else {
        startLat = currentStart.lat;
        startLon = currentStart.lng;
      }

      if (Array.isArray(currentEnd)) {
        [endLat, endLon] = currentEnd;
      } else {
        endLat = currentEnd.lat;
        endLon = currentEnd.lng;
      }

      if (!startLat || !startLon || !endLat || !endLon) return;

      setIsSearching(true);
      try {
        const foundRoutes = await getRoutes(
          { lat: startLat, lon: startLon },
          { lat: endLat, lon: endLon },
          userMode
        );

        if (foundRoutes.length > 0) {
          setCurrentRoutes(foundRoutes);
          setSelectedRoute(foundRoutes[0].id);
        }
      } catch (error) {
        console.error("Failed to update route for mode", error);
      } finally {
        setIsSearching(false);
      }
    };

    updateRoutes();
  }, [userMode, routesCalculated]);

  const handleUseCurrentLocation = useCallback(async () => {

    if (!locationService.isSupported()) {
      toast({ title: "Location not supported", description: "Your browser doesn't support geolocation.", variant: "destructive" });
      return;
    }

    setIsDetectingLocation(true);
    try {
      const position = await locationService.getCurrentPosition();
      setUserPosition([position.lat, position.lon]);
      setUserAccuracy(position.accuracy);

      // Update the start input with the detected address
      const address = await reverseGeocode(position.lat, position.lon);
      const displayName = address || `${position.lat.toFixed(4)}, ${position.lon.toFixed(4)}`;
      setStartName(displayName);
      setCurrentStart([position.lat, position.lon]);

      toast({ title: "Location detected", description: `Accuracy: ±${Math.round(position.accuracy)}m` });
    } catch (error: any) {
      toast({ title: "Location error", description: error.message || "Could not get your location", variant: "destructive" });
      if (error.code === 1) setShowPermissionDialog(true);
    } finally {
      setIsDetectingLocation(false);
    }
  }, [toast]);

  const handleStartNavigation = useCallback(() => {
    const selectedRouteData = currentRoutes.find(r => r.id === selectedRoute);
    if (!selectedRouteData) {
      toast({ title: "No route selected", description: "Please select a route first", variant: "destructive" });
      return;
    }

    locationService.startWatching();

    // OPTIONAL: Immediately update start location if we have a high-accuracy fix
    // This addresses the user's request to update the search start pos on navigation start
    locationService.getCurrentPosition().then(async (pos) => {
      setUserPosition([pos.lat, pos.lon]);
      // Only update if it seems we are starting from 'current location' intent or if it's way off?
      // For now, simpler is better: Update state to track user
      const address = await reverseGeocode(pos.lat, pos.lon);
      if (address) setStartName(address);
    }).catch(() => { });

    const unsubscribePosition = locationService.onPositionUpdate((position: Position) => {
      setUserPosition([position.lat, position.lon]);
      setUserAccuracy(position.accuracy);
      setUserHeading(position.heading);

      if (navigationService.getIsNavigating()) navigationService.updatePosition(position);
      if (liveExposureService) {
        const progress = navigationService.getCurrentProgress();
        liveExposureService.updatePosition(position, progress?.currentSegmentIndex || 0);
      }
    });

    const unsubscribeError = locationService.onError((error) => {
      toast({ title: "GPS Error", description: error.message, variant: "destructive" });
    });

    const navRoute: NavigationRoute = {
      id: selectedRouteData.id,
      coordinates: selectedRouteData.coordinates,
      distance: parseFloat(selectedRouteData.distance) * 1000,
      duration: parseInt(selectedRouteData.duration) * 60
    };
    navigationService.startNavigation(navRoute);

    const unsubscribeProgress = navigationService.onProgress((progress) => {
      setDistanceRemaining(progress.distanceRemaining);
      setTimeRemaining(progress.timeRemaining);
      setNavigationProgress(progress.percentComplete);
    });

    const unsubscribeDeviation = navigationService.onDeviation((distance) => {
      toast({ title: "Off Route", description: `You're ${Math.round(distance)}m off route. Recalculating...` });
    });

    const unsubscribeArrival = navigationService.onArrival(() => {
      const currentRoute = currentRoutes.find(r => r.id === selectedRoute);
      const fastest = currentRoutes.find(r => r.id.includes('fastest')) || currentRoutes[0];

      if (currentRoute && fastest) {
        const isCleanRoute = currentRoute.pollutionScore < 50;
        const avoided = Math.max(0, fastest.inhaledDose - currentRoute.inhaledDose);

        lungHealthScoringService.recordRoute({
          distance: parseFloat(currentRoute.distance) * 1000,
          avgAQI: currentRoute.pollutionScore,
          pollutionAvoided: avoided,
          inhaledDose: currentRoute.inhaledDose,
          isCleanRoute
        });
      }

      toast({ title: "Destination Reached!", description: "You have arrived at your destination." });
      handleStopNavigation();
    });

    liveExposureService.startMonitoring(userMode);
    liveExposureService.setRoute(selectedRouteData.coordinates.map(c => c as [number, number]));

    const unsubscribeExposure = liveExposureService.onExposureUpdate(setExposureData);
    const unsubscribeAlerts = liveExposureService.onAlert((alert) => {
      toast({
        title: alert.type === 'threshold-exceeded' ? '⚠️ Exposure Alert' : '🚨 High Pollution',
        description: alert.message,
        variant: alert.severity === 'danger' ? 'destructive' : 'default'
      });
    });

    setNavigationActive(true);
    setFollowUser(true);
    toast({ title: "Navigation Started", description: "Follow the blue dot on the map" });

    (window as any).__navigationCleanup = () => {
      unsubscribePosition();
      unsubscribeError();
      unsubscribeProgress();
      unsubscribeDeviation();
      unsubscribeArrival();
      unsubscribeExposure();
      unsubscribeAlerts();
    };
  }, [selectedRoute, currentRoutes, userMode, toast]);

  const handleStopNavigation = useCallback(() => {
    locationService.stopWatching();
    navigationService.stopNavigation();
    liveExposureService.stopMonitoring();
    if ((window as any).__navigationCleanup) {
      (window as any).__navigationCleanup();
      delete (window as any).__navigationCleanup;
    }
    setNavigationActive(false);
    setFollowUser(false);
    setNavigationProgress(0);
    toast({ title: "Navigation Stopped", description: "GPS tracking has been disabled" });
  }, [toast]);

  const handleRecenter = useCallback(() => setFollowUser(true), []);
  const handleToggleCompass = useCallback(() => setCompassMode(prev => !prev), []);

  const handleSwitchToHealthRoute = () => {
    const healthy = currentRoutes.find(r => r.isRecommended || r.name.toLowerCase().includes('clean') || r.name.toLowerCase().includes('health'));
    if (healthy) setSelectedRoute(healthy.id);
    else if (currentRoutes.length > 1) setSelectedRoute(currentRoutes[1].id);
    setShowAlert(false);
  };

  const [breathingMultiplier, setBreathingMultiplier] = useState(1.0);
  const [activeProfile, setActiveProfile] = useState(lungHealthScoringService.getActiveProfile());

  useEffect(() => {
    setBreathingMultiplier(userMode === 'cyclist' ? 2.5 : 1.0);
  }, [userMode]);

  useEffect(() => {
    return lungHealthScoringService.onProfileChange(() => {
      setActiveProfile(lungHealthScoringService.getActiveProfile());
    });
  }, []);

  const adjustedRoutes = useMemo(() => currentRoutes.map(route => {
    const sensitivity = activeProfile.sensitivityFactor;
    const finalInhaledDose = Math.round(route.inhaledDose * breathingMultiplier * sensitivity);

    // Reactive Safety Warning Logic
    let warning = undefined;
    if (activeProfile.type !== 'NORMAL' && route.pollutionScore > (100 / sensitivity)) {
      warning = `Consultation advised: High exposure for ${activeProfile.name.toLowerCase()} profile`;
    }
    if (route.pollutionScore > 150) {
      warning = "Not recommended for sensitive lungs";
    }

    return {
      ...route,
      inhaledDose: finalInhaledDose,
      warning
    };
  }), [currentRoutes, breathingMultiplier, activeProfile]);

  const fastestRoute = adjustedRoutes.find(r => r.id.includes('fastest')) || adjustedRoutes[0];
  const healthRoute = adjustedRoutes.find(r => r.isRecommended) || adjustedRoutes.find(r => r.id.includes('clean') || r.id.includes('health')) || adjustedRoutes[adjustedRoutes.length - 1];

  const mapRoutes = useMemo(() => adjustedRoutes.map(route => ({
    id: route.id,
    name: route.name,
    color: route.color,
    coordinates: route.coordinates,
    visible: route.visible,
  })), [adjustedRoutes]);

  const exceedanceMinutes = fastestRoute ? calculateExceedanceTime(fastestRoute.pollutionScore) : 60;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Header aqi={headerAqi} status={headerStatus} />

      <main className="pt-16">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          <aside className="w-full lg:w-[420px] p-4 lg:p-6 lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)] scrollbar-hide border-r border-border/50 space-y-4">
            <LocationSearch
              onSearch={handleSearch}
              onUseCurrentLocation={handleUseCurrentLocation}
              isDetectingLocation={isDetectingLocation}
              startName={startName}
              endName={endName}
            />
            <div className="flex justify-center"><UserModeSelector mode={userMode} onChange={setUserMode} /></div>
            {navigationActive && <LiveStatsPanel distanceRemaining={distanceRemaining} timeRemaining={timeRemaining} exposureData={exposureData} />}
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground animate-pulse">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p>Calculating best routes...</p>
              </div>
            ) : routesCalculated && adjustedRoutes.length > 0 ? (
              <>
                <div className="pt-2">
                  <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">Available Routes</h2>
                  <div className="space-y-3">
                    {adjustedRoutes.map((route, index) => (
                      <div key={route.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <RouteCard id={route.id} name={route.name} algorithm={route.algorithm} duration={route.duration} distance={route.distance} pollutionScore={route.pollutionScore} inhaledDose={route.inhaledDose} color={route.color} isSelected={selectedRoute === route.id} isRecommended={route.isRecommended} hasAlert={route.id.includes('fastest') && route.pollutionScore > 70} onClick={() => setSelectedRoute(route.id)} />
                      </div>
                    ))}
                  </div>
                </div>
                {fastestRoute && healthRoute && <ExposurePanel fastestDose={fastestRoute.inhaledDose} healthDose={healthRoute.inhaledDose} userMode={userMode} />}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground glass-panel border-dashed border-2">
                <p className="text-xs">Enter a start and destination to see routes.</p>
              </div>
            )}
          </aside>

          <div className="flex-1 p-4 lg:p-6 lg:pl-0 relative">
            <div className="h-[400px] lg:h-full">
              <InteractiveMap
                routes={mapRoutes}
                selectedRoute={selectedRoute}
                onSelectRoute={setSelectedRoute}
                startPoint={currentStart}
                endPoint={currentEnd}
                startName={startName}
                endName={endName}
                pollutionZones={currentZones}
                userPosition={userPosition}
                userAccuracy={userAccuracy}
                navigationActive={navigationActive}
                followUser={followUser}
                navigationProgress={navigationProgress}
                userHeading={userHeading}
                compassMode={compassMode}
                onToggleCompass={handleToggleCompass}
                onRecenter={handleRecenter}
                onSetStart={(loc) => {
                  setCurrentStart([loc.lat, loc.lon]);
                  setStartName(loc.name);
                  // Optional: Trigger path update or just let user click search
                  toast({ title: "Start Location Set", description: loc.name });
                }}
                onSetEnd={(loc) => {
                  setCurrentEnd([loc.lat, loc.lon]);
                  setEndName(loc.name);
                  toast({ title: "Destination Set", description: loc.name });
                }}
              />
            </div>
            {routesCalculated && currentRoutes.length > 0 && <NavigationControls navigationActive={navigationActive} followUser={followUser} onStartNavigation={handleStartNavigation} onStopNavigation={handleStopNavigation} onRecenter={handleRecenter} disabled={!selectedRoute} />}
          </div>
        </div>
      </main>

      {showAlert && selectedRoute.includes('fastest') && <HealthAlert exceedsIn={exceedanceMinutes} alternativeAddsMinutes={3} onDismiss={() => setShowAlert(false)} onSwitchRoute={handleSwitchToHealthRoute} />}
      <ArrivalModal
        isOpen={showArrivalModal}
        onClose={() => setShowArrivalModal(false)}
        stats={{
          distance: `${(navigationService.getCurrentProgress()?.distanceTraveled || 0).toFixed(0)}m`,
          duration: `${Math.round((navigationService.getCurrentProgress()?.distanceTraveled || 0) / 1.4 / 60)} min`
        }}
      />
      <WelcomeModal />
      <LocationPermissionDialog open={showPermissionDialog} onClose={() => setShowPermissionDialog(false)} onRetry={handleUseCurrentLocation} />
    </div>
  );
};

export default Index;
