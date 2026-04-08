import { AlertCircle, MapPin, Settings, Smartphone } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MobileGPSHelper from '@/utils/mobileGPSHelper';

interface LocationPermissionDialogProps {
    open: boolean;
    onClose: () => void;
    onRetry: () => void;
}

const LocationPermissionDialog = ({ open, onClose, onRetry }: LocationPermissionDialogProps) => {
    const [showInstructions, setShowInstructions] = useState(false);
    const isIOS = MobileGPSHelper.isIOS();
    const isAndroid = MobileGPSHelper.isAndroid();
    const isMobile = MobileGPSHelper.isMobile();

    const getInstructions = () => {
        if (isIOS) {
            return {
                title: 'Enable Location on iOS',
                steps: [
                    'Open your iPhone Settings app',
                    'Scroll down and tap "Safari"',
                    'Tap "Location"',
                    'Select "Ask" or "Allow"',
                    'Return to BreatheWay and try again'
                ],
                note: 'You may need to reload the page after changing settings.'
            };
        } else if (isAndroid) {
            return {
                title: 'Enable Location on Android',
                steps: [
                    'Open Chrome Settings (three dots menu)',
                    'Tap "Settings"',
                    'Tap "Site Settings"',
                    'Tap "Location"',
                    'Find this website and set to "Allow"',
                    'Return to BreatheWay and try again'
                ],
                note: 'Make sure Location is enabled in your device settings too.'
            };
        } else {
            return {
                title: 'Enable Location in Browser',
                steps: [
                    'Click the lock/info icon in the address bar',
                    'Find "Location" permissions',
                    'Change to "Allow"',
                    'Reload the page and try again'
                ],
                note: 'Location must be allowed for navigation to work.'
            };
        }
    };

    const instructions = getInstructions();

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <DialogTitle>Location Permission Needed</DialogTitle>
                            <DialogDescription className="text-xs mt-1">
                                {isMobile ? 'Required for GPS navigation' : 'Required for real-time tracking'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!showInstructions ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Why we need this:</p>
                                    <ul className="text-xs space-y-1 list-disc list-inside">
                                        <li>Show your current location on the map</li>
                                        <li>Provide turn-by-turn navigation</li>
                                        <li>Track your route progress</li>
                                        <li>Monitor air quality along your path</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                                <strong>Privacy:</strong> Your location is only used on your device and never stored or shared.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button onClick={onRetry} className="w-full">
                                <MapPin className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>

                            <Button
                                onClick={() => setShowInstructions(true)}
                                variant="outline"
                                className="w-full"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                How to Enable Location
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <span>{instructions.title}</span>
                        </div>

                        <ol className="space-y-2">
                            {instructions.steps.map((step, index) => (
                                <li key={index} className="flex gap-3 text-sm">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                        {index + 1}
                                    </span>
                                    <span className="text-gray-700 pt-0.5">{step}</span>
                                </li>
                            ))}
                        </ol>

                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-900">
                                <strong>Note:</strong> {instructions.note}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowInstructions(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button onClick={onClose} className="flex-1">
                                Got It
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default LocationPermissionDialog;
