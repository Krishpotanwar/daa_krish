/**
 * Mobile GPS Helper
 * 
 * Provides mobile-specific GPS enhancements and permission handling
 */

export class MobileGPSHelper {
    /**
     * Check if running on mobile device
     */
    static isMobile(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Check if running on iOS
     */
    static isIOS(): boolean {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    }

    /**
     * Check if running on Android
     */
    static isAndroid(): boolean {
        return /Android/i.test(navigator.userAgent);
    }

    /**
     * Request geolocation permission with mobile-specific handling
     */
    static async requestPermission(): Promise<PermissionState> {
        try {
            // For iOS 13+, we need to request permission through getCurrentPosition first
            if (this.isIOS()) {
                return new Promise((resolve) => {
                    navigator.geolocation.getCurrentPosition(
                        () => resolve('granted'),
                        (error) => {
                            if (error.code === 1) {
                                resolve('denied');
                            } else {
                                resolve('prompt');
                            }
                        },
                        { enableHighAccuracy: true, timeout: 5000 }
                    );
                });
            }

            // For other browsers, use Permissions API if available
            if ('permissions' in navigator) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                return result.state;
            }

            // Fallback: try to get position
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => resolve('granted'),
                    (error) => {
                        if (error.code === 1) {
                            resolve('denied');
                        } else {
                            resolve('prompt');
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Permission check error:', error);
            return 'prompt';
        }
    }

    /**
     * Get optimal GPS options for mobile
     */
    static getGPSOptions(): PositionOptions {
        const isMobile = this.isMobile();

        return {
            enableHighAccuracy: true,
            timeout: isMobile ? 10000 : 5000, // Longer timeout on mobile
            maximumAge: isMobile ? 1000 : 0, // Allow slightly cached position on mobile
        };
    }

    /**
     * Check if device supports compass/heading
     */
    static supportsHeading(): boolean {
        return 'DeviceOrientationEvent' in window;
    }

    /**
     * Request device orientation permission (iOS 13+)
     */
    static async requestOrientationPermission(): Promise<boolean> {
        if (this.isIOS() && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                return permission === 'granted';
            } catch (error) {
                console.error('Orientation permission error:', error);
                return false;
            }
        }
        return this.supportsHeading();
    }

    /**
     * Get device heading from orientation
     */
    static getHeadingFromOrientation(): Promise<number | null> {
        return new Promise((resolve) => {
            if (!this.supportsHeading()) {
                resolve(null);
                return;
            }

            const handleOrientation = (event: DeviceOrientationEvent) => {
                window.removeEventListener('deviceorientation', handleOrientation);

                if (event.alpha !== null) {
                    // alpha is the compass direction (0-360)
                    resolve(event.alpha);
                } else {
                    resolve(null);
                }
            };

            window.addEventListener('deviceorientation', handleOrientation);

            // Timeout after 2 seconds
            setTimeout(() => {
                window.removeEventListener('deviceorientation', handleOrientation);
                resolve(null);
            }, 2000);
        });
    }

    /**
     * Prevent screen sleep during navigation (mobile)
     */
    static async preventSleep(): Promise<WakeLockSentinel | null> {
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await (navigator as any).wakeLock.request('screen');
                return wakeLock;
            }
        } catch (error) {
            console.warn('Wake lock not supported:', error);
        }
        return null;
    }

    /**
     * Show mobile-friendly permission instructions
     */
    static getPermissionInstructions(): string {
        if (this.isIOS()) {
            return 'Tap "Allow" when prompted to enable location services. If you previously denied, go to Settings > Safari > Location Services and enable for this website.';
        } else if (this.isAndroid()) {
            return 'Tap "Allow" when prompted to enable location services. If you previously denied, go to Chrome Settings > Site Settings > Location and enable for this website.';
        } else {
            return 'Click "Allow" when prompted to enable location services.';
        }
    }

    /**
     * Vibrate device for feedback (mobile only)
     */
    static vibrate(pattern: number | number[] = 100): void {
        if ('vibrate' in navigator && this.isMobile()) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Check if running in standalone mode (installed PWA)
     */
    static isStandalone(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    }

    /**
     * Get install prompt for PWA
     */
    static setupInstallPrompt(callback: (event: any) => void): void {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            callback(e);
        });
    }
}

export default MobileGPSHelper;
