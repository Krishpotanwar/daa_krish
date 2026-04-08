import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trophy } from "lucide-react";

interface ArrivalModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats?: {
        distance: string;
        duration: string;
        pollutionAvoided?: string;
    };
}

export const ArrivalModal = ({ isOpen, onClose, stats }: ArrivalModalProps) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                        <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
                        You've Arrived!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-muted-foreground">
                        Great job! You have reached your destination and chosen a healthy path for your lungs.
                    </AlertDialogDescription>

                    {stats && (
                        <div className="w-full bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm mt-4">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Distance</span>
                                <span className="font-medium">{stats.distance}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Time</span>
                                <span className="font-medium">{stats.duration}</span>
                            </div>
                        </div>
                    )}

                    <p className="text-sm font-medium italic text-primary/80 pt-2">
                        "Every clean breath is a victory."
                    </p>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center">
                    <AlertDialogAction onClick={onClose} className="w-full sm:w-auto min-w-[120px]">
                        Awesome!
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
