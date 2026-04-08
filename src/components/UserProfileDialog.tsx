import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Trophy, MapPin, Calendar } from 'lucide-react';

interface UserProfileDialogProps {
    userName: string;
    userEmail: string;
    avatarUrl?: string;
}

const UserProfileDialog = ({ userName, userEmail, avatarUrl }: UserProfileDialogProps) => {
    // Dummy data for visual richness
    const rank = "Eco Warrior";
    const joinDate = "January 2024";
    const homeLocation = "New Delhi, India";
    const totalDistance = "124.5 km";
    const cleanAirScore = "92";

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <DialogContent className="max-w-md glass-panel border-none shadow-2xl animate-fade-in sm:rounded-3xl overflow-hidden p-0">
            {/* Header / Banner */}
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
                <div className="absolute -bottom-12 left-6">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl} alt={userName} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold">
                            {getInitials(userName)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="pt-16 pb-6 px-6 space-y-6">
                {/* Basic Info */}
                <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">{userName}</h2>
                    <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Mail className="w-4 h-4" />
                        {userEmail}
                    </p>
                </div>

                {/* Rank & Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rank</p>
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold">{rank}</span>
                        </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/50">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Clean Air Score</p>
                        <div className="flex items-center gap-2">
                            <WindIcon className="w-5 h-5 text-green-500" />
                            <span className="font-semibold text-green-500">{cleanAirScore}</span>
                        </div>
                    </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{homeLocation}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Member since {joinDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                        <span>Total Tracked Distance: <strong>{totalDistance}</strong></span>
                    </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end">
                    <Badge variant="outline" className="text-xs cursor-default">Profile Public</Badge>
                </div>
            </div>
        </DialogContent>
    );
};

// Helper components for missing icons if crucial, otherwise reuse existing logic
function WindIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
            <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
            <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
        </svg>
    )
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}

export default UserProfileDialog;
