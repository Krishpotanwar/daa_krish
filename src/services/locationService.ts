/**
 * Location Service - GPS Tracking and Position Management
 * 
 * Provides real-time GPS tracking with position smoothing and error handling.
 * Uses the browser's Geolocation API with event-based updates.
 * Enhanced with mobile-specific optimizations for iOS and Android.
 */

import MobileGPSHelper from '@/utils/mobileGPSHelper';

export interface Position {
    lat: number;
    lon: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    timestamp: number;
}

export interface LocationError {
    code: number;
    message: string;
}

type PositionCallback = (position: Position) => void;
type ErrorCallback = (error: LocationError) => void;

class LocationService {
    private watchId: number | null = null;
    private positionCallbacks: Set<PositionCallback> = new Set();
    private errorCallbacks: Set<ErrorCallback> = new Set();
    private isWatching = false;

    // Position smoothing - moving average filter
    private positionHistory: Position[] = [];
    private readonly HISTORY_SIZE = 5; // Keep last 5 positions for smoothing
    private readonly UPDATE_THROTTLE = 1500; // Throttle to 1.5 seconds
    private lastUpdateTime = 0;
    private wakeLock: any = null; // Screen wake lock for mobile

    /**
     * Check if geolocation is supported by the browser
     */
    isSupported(): boolean {
        return 'geolocation' in navigator;
    }

    /**
     * Get current position (one-time snapshot)
     */
    async getCurrentPosition(): Promise<Position> {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                reject({
                    code: 0,
                    message: 'Geolocation is not supported by this browser'
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(this.formatPosition(position));
                },
                (error) => {
                    reject(this.formatError(error));
                },
                MobileGPSHelper.getGPSOptions()
            );
        });
    }

    /**
     * Start watching user's position with continuous updates
     */
    startWatching(): void {
        if (!this.isSupported()) {
            this.emitError({
                code: 0,
                message: 'Geolocation is not supported by this browser'
            });
            return;
        }

        if (this.isWatching) {
            console.warn('Already watching position');
            return;
        }

        this.isWatching = true;
        this.positionHistory = [];

        // Request wake lock on mobile to prevent screen sleep during navigation
        if (MobileGPSHelper.isMobile()) {
            MobileGPSHelper.preventSleep().then(lock => {
                this.wakeLock = lock;
            });
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handlePositionUpdate(position);
            },
            (error) => {
                this.emitError(this.formatError(error));
            },
            MobileGPSHelper.getGPSOptions()
        );
    }

    /**
     * Stop watching user's position
     */
    stopWatching(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isWatching = false;
            this.positionHistory = [];
        }

        // Release wake lock
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    /**
     * Check if currently watching position
     */
    getIsWatching(): boolean {
        return this.isWatching;
    }

    /**
     * Subscribe to position updates
     */
    onPositionUpdate(callback: PositionCallback): () => void {
        this.positionCallbacks.add(callback);
        // Return unsubscribe function
        return () => {
            this.positionCallbacks.delete(callback);
        };
    }

    /**
     * Subscribe to error events
     */
    onError(callback: ErrorCallback): () => void {
        this.errorCallbacks.add(callback);
        // Return unsubscribe function
        return () => {
            this.errorCallbacks.delete(callback);
        };
    }

    /**
     * Handle position update with throttling and smoothing
     */
    private handlePositionUpdate(geoPosition: GeolocationPosition): void {
        const now = Date.now();

        // Throttle updates
        if (now - this.lastUpdateTime < this.UPDATE_THROTTLE) {
            return;
        }

        this.lastUpdateTime = now;

        const position = this.formatPosition(geoPosition);

        // Add to history
        this.positionHistory.push(position);
        if (this.positionHistory.length > this.HISTORY_SIZE) {
            this.positionHistory.shift();
        }

        // Apply smoothing (moving average)
        const smoothedPosition = this.smoothPosition();

        // Emit to all subscribers
        this.emitPosition(smoothedPosition);
    }

    /**
     * Apply moving average filter to reduce GPS noise
     */
    private smoothPosition(): Position {
        if (this.positionHistory.length === 0) {
            throw new Error('No position history available');
        }

        // If we only have one position, return it as-is
        if (this.positionHistory.length === 1) {
            return this.positionHistory[0];
        }

        // Calculate weighted average (more recent positions have higher weight)
        let totalWeight = 0;
        let weightedLat = 0;
        let weightedLon = 0;
        let avgAccuracy = 0;

        this.positionHistory.forEach((pos, index) => {
            const weight = index + 1; // Linear weighting: 1, 2, 3, 4, 5
            totalWeight += weight;
            weightedLat += pos.lat * weight;
            weightedLon += pos.lon * weight;
            avgAccuracy += pos.accuracy;
        });

        const latest = this.positionHistory[this.positionHistory.length - 1];

        return {
            lat: weightedLat / totalWeight,
            lon: weightedLon / totalWeight,
            accuracy: avgAccuracy / this.positionHistory.length,
            speed: latest.speed,
            heading: latest.heading,
            timestamp: latest.timestamp
        };
    }

    /**
     * Format GeolocationPosition to our Position interface
     */
    private formatPosition(geoPosition: GeolocationPosition): Position {
        return {
            lat: geoPosition.coords.latitude,
            lon: geoPosition.coords.longitude,
            accuracy: geoPosition.coords.accuracy,
            speed: geoPosition.coords.speed,
            heading: geoPosition.coords.heading,
            timestamp: geoPosition.timestamp
        };
    }

    /**
     * Format GeolocationPositionError to our LocationError interface
     */
    private formatError(geoError: GeolocationPositionError): LocationError {
        const messages: Record<number, string> = {
            1: 'Location permission denied by user',
            2: 'Location position unavailable',
            3: 'Location request timeout'
        };

        return {
            code: geoError.code,
            message: messages[geoError.code] || 'Unknown location error'
        };
    }

    /**
     * Emit position to all subscribers
     */
    private emitPosition(position: Position): void {
        this.positionCallbacks.forEach(callback => {
            try {
                callback(position);
            } catch (error) {
                console.error('Error in position callback:', error);
            }
        });
    }

    /**
     * Emit error to all subscribers
     */
    private emitError(error: LocationError): void {
        this.errorCallbacks.forEach(callback => {
            try {
                callback(error);
            } catch (err) {
                console.error('Error in error callback:', err);
            }
        });
    }

    /**
     * Clean up all subscriptions
     */
    destroy(): void {
        this.stopWatching();
        this.positionCallbacks.clear();
        this.errorCallbacks.clear();
        this.positionHistory = [];
    }
}

// Export singleton instance
export const locationService = new LocationService();
