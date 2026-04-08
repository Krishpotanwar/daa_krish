import { User, Settings, LogOut, Activity, Award, Bell } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import ActivityHistory from './ActivityHistory';
import LungHealthScoreCard from './LungHealthScoreCard';
import HealthProfileSelector from './HealthProfileSelector';
import UserProfileDialog from './UserProfileDialog';
import NotificationsDialog from './NotificationsDialog';
import SettingsDialog from './SettingsDialog';
import { Heart } from 'lucide-react';

interface ProfileMenuProps {
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
}

const ProfileMenu = ({
    userName = "Guest User",
    userEmail = "user@breatheway.com",
    userAvatar
}: ProfileMenuProps) => {
    const navigate = useNavigate();
    const avatarUrl = userAvatar;

    const [isOpen, setIsOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showProfileSelector, setShowProfileSelector] = useState(false);
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Get user initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-panel p-0 border-none shadow-2xl animate-fade-in sm:rounded-3xl">
                    <div className="p-6 md:p-8">
                        <ActivityHistory />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto glass-panel p-0 border-none shadow-2xl animate-fade-in sm:rounded-3xl">
                    <div className="p-6">
                        <LungHealthScoreCard />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showProfileSelector} onOpenChange={setShowProfileSelector}>
                <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto glass-panel p-0 border-none shadow-2xl animate-fade-in sm:rounded-3xl">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Heart className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-display font-bold">Health Profile</h2>
                        </div>
                        <HealthProfileSelector onSelect={() => setShowProfileSelector(false)} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
                <UserProfileDialog userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
            </Dialog>

            <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
                <NotificationsDialog />
            </Dialog>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <SettingsDialog />
            </Dialog>

            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                        aria-label="User profile menu"
                    >
                        <Avatar className="w-8 h-8 border-2 border-primary/20">
                            <AvatarImage src={avatarUrl} alt={userName} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
                                {getInitials(userName)}
                            </AvatarFallback>
                        </Avatar>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 glass-panel">
                    {/* User Info */}
                    <DropdownMenuLabel className="pb-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border-2 border-primary/20">
                                <AvatarImage src={avatarUrl} alt={userName} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground truncate">
                                    {userName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    {/* Menu Items */}
                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => {
                        e.preventDefault();
                        setShowUserProfile(true);
                        setIsOpen(false);
                    }}>
                        <User className="w-4 h-4 mr-2" />
                        <span>View Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => {
                        e.preventDefault();
                        setShowProfileSelector(true);
                        setIsOpen(false);
                    }}>
                        <Heart className="w-4 h-4 mr-2" />
                        <span>Health Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => {
                        e.preventDefault();
                        setShowHistory(true);
                        setIsOpen(false);
                    }}>
                        <Activity className="w-4 h-4 mr-2" />
                        <span>Activity History</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => {
                        e.preventDefault();
                        setShowAchievements(true);
                        setIsOpen(false);
                    }}>
                        <Award className="w-4 h-4 mr-2" />
                        <span>Achievements</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => {
                        e.preventDefault();
                        setShowNotifications(true);
                        setIsOpen(false);
                    }}>
                        <Bell className="w-4 h-4 mr-2" />
                        <span>Notifications</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="cursor-pointer" onSelect={(e) => {
                        e.preventDefault();
                        setShowSettings(true);
                        setIsOpen(false);
                    }}>
                        <Settings className="w-4 h-4 mr-2" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export default ProfileMenu;
