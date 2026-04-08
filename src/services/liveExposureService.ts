/**
 * Live Exposure Service - Real-time Pollution Monitoring During Navigation
 * 
 * Monitors pollution exposure in real-time, samples pollution ahead of user,
 * calculates inhaled dose, and triggers alerts for threshold exceedances.
 */

import { Position } from './locationService';
import { getPollutionData, PollutionData } from './pollutionService';
import { lungHealthScoringService } from './lungHealthScoringService';

export interface ExposureData {
    currentPollution: PollutionData | null;
    pollutionAhead: PollutionData | null;
    totalDoseInhaled: number; // micrograms
    currentVentilationRate: number; // L/min
    exposureLevel: 'low' | 'moderate' | 'high' | 'very-high';
    timeInCurrentLevel: number; // seconds
}

export interface ExposureAlert {
    type: 'threshold-exceeded' | 'high-pollution-ahead' | 'detour-suggested';
    message: string;
    severity: 'info' | 'warning' | 'danger';
    pollutionLevel: number;
}

type ExposureUpdateCallback = (data: ExposureData) => void;
type AlertCallback = (alert: ExposureAlert) => void;

class LiveExposureService {
    private isMonitoring = false;
    private currentExposure: ExposureData = {
        currentPollution: null,
        pollutionAhead: null,
        totalDoseInhaled: 0,
        currentVentilationRate: 15, // Default: walking
        exposureLevel: 'low',
        timeInCurrentLevel: 0
    };

    private exposureCallbacks: Set<ExposureUpdateCallback> = new Set();
    private alertCallbacks: Set<AlertCallback> = new Set();

    private lastSampleTime = 0;
    private readonly SAMPLE_INTERVAL = 5000; // Sample every 5 seconds
    private readonly LOOKAHEAD_DISTANCE = 300; // meters

    // Ventilation rates (L/min) based on activity
    private readonly VENTILATION_RATES = {
        walking: 15,
        cycling: 40,
        running: 60
    };

    // WHO PM2.5 thresholds (μg/m³)
    private readonly PM25_THRESHOLDS = {
        low: 12,
        moderate: 35,
        high: 55,
        veryHigh: 150
    };

    // Maximum safe dose (arbitrary units for demo)
    private readonly DOSE_THRESHOLD = 1000; // micrograms

    private routeCoordinates: [number, number][] = [];
    private currentSegmentIndex = 0;

    /**
     * Start monitoring exposure
     */
    startMonitoring(userMode: 'pedestrian' | 'cyclist' = 'pedestrian'): void {
        this.isMonitoring = true;
        this.currentExposure.totalDoseInhaled = 0;
        this.currentExposure.currentVentilationRate =
            userMode === 'cyclist' ? this.VENTILATION_RATES.cycling : this.VENTILATION_RATES.walking;
        this.lastSampleTime = Date.now();
    }

    /**
     * Stop monitoring exposure
     */
    stopMonitoring(): void {
        this.isMonitoring = false;
        this.routeCoordinates = [];
        this.currentSegmentIndex = 0;
    }

    /**
     * Set route for lookahead pollution sampling
     */
    setRoute(coordinates: [number, number][]): void {
        this.routeCoordinates = coordinates;
        this.currentSegmentIndex = 0;
    }

    /**
     * Update user position and calculate exposure
     */
    async updatePosition(position: Position, segmentIndex: number): Promise<void> {
        if (!this.isMonitoring) return;

        const now = Date.now();

        // Throttle sampling to save API calls
        if (now - this.lastSampleTime < this.SAMPLE_INTERVAL) {
            return;
        }

        this.lastSampleTime = now;
        this.currentSegmentIndex = segmentIndex;

        try {
            // Sample current pollution
            const currentPollution = await getPollutionData(position.lat, position.lon);

            // Sample pollution ahead
            const aheadPoint = this.getPointAhead(position, this.LOOKAHEAD_DISTANCE);
            const pollutionAhead = aheadPoint
                ? await getPollutionData(aheadPoint[0], aheadPoint[1])
                : null;

            // Calculate inhaled dose since last sample
            const timeDelta = (now - this.lastSampleTime) / 1000 / 60; // minutes
            const doseDelta = this.calculateDose(
                currentPollution,
                this.currentExposure.currentVentilationRate,
                timeDelta
            );

            // Update exposure data
            this.currentExposure.currentPollution = currentPollution;
            this.currentExposure.pollutionAhead = pollutionAhead;
            this.currentExposure.totalDoseInhaled += doseDelta;
            this.currentExposure.exposureLevel = this.getExposureLevel(currentPollution);

            // Emit update
            this.emitExposureUpdate(this.currentExposure);

            // Check for alerts
            this.checkAlerts(currentPollution, pollutionAhead);

        } catch (error) {
            console.error('Error updating exposure:', error);
        }
    }

    /**
     * Calculate point ahead on route
     */
    private getPointAhead(position: Position, distance: number): [number, number] | null {
        if (this.routeCoordinates.length === 0) {
            // No route available, estimate based on heading
            if (position.heading !== null) {
                return this.projectPoint([position.lat, position.lon], distance, position.heading);
            }
            return null;
        }

        // Find point on route that is approximately 'distance' meters ahead
        let accumulatedDistance = 0;

        for (let i = this.currentSegmentIndex; i < this.routeCoordinates.length - 1; i++) {
            const segmentStart = this.routeCoordinates[i];
            const segmentEnd = this.routeCoordinates[i + 1];
            const segmentLength = this.haversineDistance(segmentStart, segmentEnd);

            if (accumulatedDistance + segmentLength >= distance) {
                // Point is on this segment
                const ratio = (distance - accumulatedDistance) / segmentLength;
                return [
                    segmentStart[0] + (segmentEnd[0] - segmentStart[0]) * ratio,
                    segmentStart[1] + (segmentEnd[1] - segmentStart[1]) * ratio
                ];
            }

            accumulatedDistance += segmentLength;
        }

        // If we've gone through all segments, return the last point
        return this.routeCoordinates[this.routeCoordinates.length - 1];
    }

    /**
     * Project a point forward by distance and bearing
     */
    private projectPoint(point: [number, number], distance: number, bearing: number): [number, number] {
        const R = 6371000; // Earth's radius in meters
        const [lat1, lon1] = point;
        const bearingRad = this.toRadians(bearing);
        const lat1Rad = this.toRadians(lat1);
        const lon1Rad = this.toRadians(lon1);

        const lat2Rad = Math.asin(
            Math.sin(lat1Rad) * Math.cos(distance / R) +
            Math.cos(lat1Rad) * Math.sin(distance / R) * Math.cos(bearingRad)
        );

        const lon2Rad = lon1Rad + Math.atan2(
            Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1Rad),
            Math.cos(distance / R) - Math.sin(lat1Rad) * Math.sin(lat2Rad)
        );

        return [this.toDegrees(lat2Rad), this.toDegrees(lon2Rad)];
    }

    /**
     * Calculate inhaled dose
     * Formula: Ventilation Rate (L/min) × Time (min) × PM2.5 (μg/m³) / 1000
     */
    private calculateDose(
        pollution: PollutionData | null,
        ventilationRate: number,
        timeMinutes: number
    ): number {
        if (!pollution) return 0;

        // Convert L to m³ (1 L = 0.001 m³)
        const volumeM3 = (ventilationRate * timeMinutes) / 1000;

        // Dose = Volume × Concentration
        return volumeM3 * pollution.pm2_5;
    }

    /**
     * Determine exposure level based on PM2.5 and active profile sensitivity
     */
    private getExposureLevel(pollution: PollutionData | null): 'low' | 'moderate' | 'high' | 'very-high' {
        if (!pollution) return 'low';

        const pm25 = pollution.pm2_5;
        const sensitivity = lungHealthScoringService.getActiveProfile().sensitivityFactor;

        // Scale thresholds: more sensitive profiles hit 'high' levels sooner
        const adjustedThresholds = {
            veryHigh: this.PM25_THRESHOLDS.veryHigh / sensitivity,
            high: this.PM25_THRESHOLDS.high / sensitivity,
            moderate: this.PM25_THRESHOLDS.moderate / sensitivity
        };

        if (pm25 >= adjustedThresholds.veryHigh) return 'very-high';
        if (pm25 >= adjustedThresholds.high) return 'high';
        if (pm25 >= adjustedThresholds.moderate) return 'moderate';
        return 'low';
    }

    /**
     * Check for alert conditions with profile sensitivity
     */
    private checkAlerts(current: PollutionData | null, ahead: PollutionData | null): void {
        if (!current) return;

        const sensitivity = lungHealthScoringService.getActiveProfile().sensitivityFactor;
        const adjustedDoseThreshold = this.DOSE_THRESHOLD / sensitivity;
        const adjustedHighThreshold = this.PM25_THRESHOLDS.high / sensitivity;
        const adjustedVeryHighThreshold = this.PM25_THRESHOLDS.veryHigh / sensitivity;

        // Alert 1: Total dose threshold exceeded (Adjusted for sensitivity)
        if (this.currentExposure.totalDoseInhaled >= adjustedDoseThreshold) {
            this.emitAlert({
                type: 'threshold-exceeded',
                message: `Exposure alert: You've inhaled significant PM2.5 for your health profile.`,
                severity: 'warning',
                pollutionLevel: current.pm2_5
            });
        }

        // Alert 2: High pollution ahead (Adjusted for sensitivity)
        if (ahead && ahead.pm2_5 >= adjustedHighThreshold) {
            this.emitAlert({
                type: 'high-pollution-ahead',
                message: `Sensitive group alert: High pollution ahead (${Math.round(ahead.pm2_5)}μg/m³).`,
                severity: 'warning',
                pollutionLevel: ahead.pm2_5
            });
        }

        // Alert 3: Suggest detour if pollution is very high (Adjusted for sensitivity)
        if (current.pm2_5 >= adjustedVeryHighThreshold) {
            this.emitAlert({
                type: 'detour-suggested',
                message: `Caution: Extremely high pollution for your profile (${Math.round(current.pm2_5)}μg/m³).`,
                severity: 'danger',
                pollutionLevel: current.pm2_5
            });
        }
    }

    /**
     * Get current exposure data
     */
    getCurrentExposure(): ExposureData {
        return { ...this.currentExposure };
    }

    /**
     * Subscribe to exposure updates
     */
    onExposureUpdate(callback: ExposureUpdateCallback): () => void {
        this.exposureCallbacks.add(callback);
        return () => this.exposureCallbacks.delete(callback);
    }

    /**
     * Subscribe to alerts
     */
    onAlert(callback: AlertCallback): () => void {
        this.alertCallbacks.add(callback);
        return () => this.alertCallbacks.delete(callback);
    }

    /**
     * Emit exposure update
     */
    private emitExposureUpdate(data: ExposureData): void {
        this.exposureCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in exposure callback:', error);
            }
        });
    }

    /**
     * Emit alert
     */
    private emitAlert(alert: ExposureAlert): void {
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error in alert callback:', error);
            }
        });
    }

    /**
     * Haversine distance calculation
     */
    private haversineDistance(point1: [number, number], point2: [number, number]): number {
        const R = 6371000;
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

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private toDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * Clean up
     */
    destroy(): void {
        this.stopMonitoring();
        this.exposureCallbacks.clear();
        this.alertCallbacks.clear();
    }
}

// Export singleton instance
export const liveExposureService = new LiveExposureService();
