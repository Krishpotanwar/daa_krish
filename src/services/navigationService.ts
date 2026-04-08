/**
 * Navigation Service - Route Progress Tracking and Deviation Detection
 * 
 * Tracks user progress along a selected route, detects deviations,
 * and provides real-time navigation statistics.
 */

import { LatLngExpression } from 'leaflet';
import { Position } from './locationService';

export interface NavigationRoute {
    id: string;
    coordinates: LatLngExpression[];
    distance: number; // Total distance in meters
    duration: number; // Total duration in seconds
}

export interface NavigationProgress {
    distanceRemaining: number; // meters
    distanceTraveled: number; // meters
    timeRemaining: number; // seconds
    percentComplete: number; // 0-100
    currentSegmentIndex: number;
    nearestPointOnRoute: [number, number];
    isOnRoute: boolean;
    deviationDistance: number; // meters from route
}

type ProgressCallback = (progress: NavigationProgress) => void;
type DeviationCallback = (deviation: number) => void;
type ArrivalCallback = () => void;

class NavigationService {
    private route: NavigationRoute | null = null;
    private isNavigating = false;
    private currentProgress: NavigationProgress | null = null;

    private progressCallbacks: Set<ProgressCallback> = new Set();
    private deviationCallbacks: Set<DeviationCallback> = new Set();
    private arrivalCallbacks: Set<ArrivalCallback> = new Set();

    private readonly DEVIATION_THRESHOLD = 50; // meters - trigger re-route
    private readonly ARRIVAL_THRESHOLD = 20; // meters - consider arrived
    private startTime: number = 0;
    private lastPosition: Position | null = null;

    /**
     * Start navigation on a route
     */
    startNavigation(route: NavigationRoute): void {
        this.route = route;
        this.isNavigating = true;
        this.startTime = Date.now();
        this.lastPosition = null;

        // Initialize progress
        this.currentProgress = {
            distanceRemaining: route.distance,
            distanceTraveled: 0,
            timeRemaining: route.duration,
            percentComplete: 0,
            currentSegmentIndex: 0,
            nearestPointOnRoute: route.coordinates[0] as [number, number],
            isOnRoute: true,
            deviationDistance: 0
        };
    }

    /**
     * Stop navigation
     */
    stopNavigation(): void {
        this.isNavigating = false;
        this.route = null;
        this.currentProgress = null;
        this.lastPosition = null;
    }

    /**
     * Check if currently navigating
     */
    getIsNavigating(): boolean {
        return this.isNavigating;
    }

    /**
     * Get current progress
     */
    getCurrentProgress(): NavigationProgress | null {
        return this.currentProgress;
    }

    /**
     * Update user position and calculate progress
     */
    updatePosition(position: Position): void {
        if (!this.isNavigating || !this.route || !this.currentProgress) {
            return;
        }

        this.lastPosition = position;
        const userPoint: [number, number] = [position.lat, position.lon];

        // Find nearest point on route
        const { nearestPoint, segmentIndex, distance } = this.findNearestPointOnRoute(userPoint);

        // Calculate distance traveled and remaining
        const distanceTraveled = this.calculateDistanceAlongRoute(segmentIndex, nearestPoint);
        const distanceRemaining = this.route.distance - distanceTraveled;

        // Calculate time remaining based on average speed
        const elapsedTime = (Date.now() - this.startTime) / 1000; // seconds
        const averageSpeed = distanceTraveled / elapsedTime; // m/s
        const timeRemaining = averageSpeed > 0 ? distanceRemaining / averageSpeed : this.route.duration;

        // Check if on route
        const isOnRoute = distance <= this.DEVIATION_THRESHOLD;

        // Update progress
        this.currentProgress = {
            distanceRemaining,
            distanceTraveled,
            timeRemaining,
            percentComplete: (distanceTraveled / this.route.distance) * 100,
            currentSegmentIndex: segmentIndex,
            nearestPointOnRoute: nearestPoint,
            isOnRoute,
            deviationDistance: distance
        };

        // Emit progress update
        this.emitProgress(this.currentProgress);

        // Check for deviation
        if (!isOnRoute) {
            this.emitDeviation(distance);
        }

        // Check for arrival
        if (distanceRemaining <= this.ARRIVAL_THRESHOLD) {
            this.emitArrival();
            this.stopNavigation();
        }
    }

    /**
     * Find nearest point on route polyline
     */
    private findNearestPointOnRoute(userPoint: [number, number]): {
        nearestPoint: [number, number];
        segmentIndex: number;
        distance: number;
    } {
        if (!this.route) {
            throw new Error('No route available');
        }

        let minDistance = Infinity;
        let nearestPoint: [number, number] = this.route.coordinates[0] as [number, number];
        let nearestSegmentIndex = 0;

        // Check each segment of the route
        for (let i = 0; i < this.route.coordinates.length - 1; i++) {
            const segmentStart = this.route.coordinates[i] as [number, number];
            const segmentEnd = this.route.coordinates[i + 1] as [number, number];

            const closestPoint = this.closestPointOnSegment(userPoint, segmentStart, segmentEnd);
            const distance = this.haversineDistance(userPoint, closestPoint);

            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = closestPoint;
                nearestSegmentIndex = i;
            }
        }

        return {
            nearestPoint,
            segmentIndex: nearestSegmentIndex,
            distance: minDistance
        };
    }

    /**
     * Find closest point on a line segment
     */
    private closestPointOnSegment(
        point: [number, number],
        segmentStart: [number, number],
        segmentEnd: [number, number]
    ): [number, number] {
        const [px, py] = point;
        const [ax, ay] = segmentStart;
        const [bx, by] = segmentEnd;

        const atob = { x: bx - ax, y: by - ay };
        const atop = { x: px - ax, y: py - ay };

        const len = atob.x * atob.x + atob.y * atob.y;
        let dot = atop.x * atob.x + atop.y * atob.y;

        const t = Math.min(1, Math.max(0, dot / len));

        return [
            ax + atob.x * t,
            ay + atob.y * t
        ];
    }

    /**
     * Calculate distance along route up to a specific point
     */
    private calculateDistanceAlongRoute(segmentIndex: number, point: [number, number]): number {
        if (!this.route) return 0;

        let totalDistance = 0;

        // Sum distances of all completed segments
        for (let i = 0; i < segmentIndex; i++) {
            const start = this.route.coordinates[i] as [number, number];
            const end = this.route.coordinates[i + 1] as [number, number];
            totalDistance += this.haversineDistance(start, end);
        }

        // Add distance from segment start to current point
        if (segmentIndex < this.route.coordinates.length) {
            const segmentStart = this.route.coordinates[segmentIndex] as [number, number];
            totalDistance += this.haversineDistance(segmentStart, point);
        }

        return totalDistance;
    }

    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in meters
     */
    private haversineDistance(point1: [number, number], point2: [number, number]): number {
        const R = 6371000; // Earth's radius in meters
        const [lat1, lon1] = point1;
        const [lat2, lon2] = point2;

        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Subscribe to progress updates
     */
    onProgress(callback: ProgressCallback): () => void {
        this.progressCallbacks.add(callback);
        return () => this.progressCallbacks.delete(callback);
    }

    /**
     * Subscribe to deviation events
     */
    onDeviation(callback: DeviationCallback): () => void {
        this.deviationCallbacks.add(callback);
        return () => this.deviationCallbacks.delete(callback);
    }

    /**
     * Subscribe to arrival events
     */
    onArrival(callback: ArrivalCallback): () => void {
        this.arrivalCallbacks.add(callback);
        return () => this.arrivalCallbacks.delete(callback);
    }

    /**
     * Emit progress update
     */
    private emitProgress(progress: NavigationProgress): void {
        this.progressCallbacks.forEach(callback => {
            try {
                callback(progress);
            } catch (error) {
                console.error('Error in progress callback:', error);
            }
        });
    }

    /**
     * Emit deviation event
     */
    private emitDeviation(distance: number): void {
        this.deviationCallbacks.forEach(callback => {
            try {
                callback(distance);
            } catch (error) {
                console.error('Error in deviation callback:', error);
            }
        });
    }

    /**
     * Emit arrival event
     */
    private emitArrival(): void {
        this.arrivalCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in arrival callback:', error);
            }
        });
    }

    /**
     * Clean up
     */
    destroy(): void {
        this.stopNavigation();
        this.progressCallbacks.clear();
        this.deviationCallbacks.clear();
        this.arrivalCallbacks.clear();
    }
}

// Export singleton instance
export const navigationService = new NavigationService();
