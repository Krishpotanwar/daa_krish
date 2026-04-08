import { DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, AlertTriangle, Sparkles, Calendar } from 'lucide-react';

const mockNotifications = [
    {
        id: 1,
        title: "High Pollution Alert",
        description: "AQI levels are currently unhealthy in your saved route area.",
        time: "2 hours ago",
        type: "alert",
        read: false
    },
    {
        id: 2,
        title: "New Health Feature",
        description: "Check out the new 'Lung Health Score' on your dashboard!",
        time: "1 day ago",
        type: "feature",
        read: true
    },
    {
        id: 3,
        title: "Weekly Summary Ready",
        description: "Your exposure report for last week is now available.",
        time: "2 days ago",
        type: "info",
        read: true
    },
    {
        id: 4,
        title: "Profile Badge Earned",
        description: "You've earned the 'Fresh Start' badge for your first clean route.",
        time: "3 days ago",
        type: "success",
        read: true
    }
];

const NotificationsDialog = () => {
    return (
        <DialogContent className="max-w-sm glass-panel border-none shadow-2xl animate-fade-in sm:rounded-3xl p-0 overflow-hidden">
            <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-display font-bold">Notifications</h2>
                </div>
            </div>

            <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                    {mockNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 rounded-xl border ${notif.read ? 'bg-background/50 border-border/50' : 'bg-primary/5 border-primary/20'} transition-all hover:bg-muted/60 relative`}
                        >
                            {!notif.read && (
                                <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full animate-pulse" />
                            )}
                            <div className="flex gap-3">
                                <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'alert' ? 'bg-red-500/10 text-red-500' :
                                        notif.type === 'feature' ? 'bg-purple-500/10 text-purple-500' :
                                            'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {notif.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                                    {notif.type === 'feature' && <Sparkles className="w-4 h-4" />}
                                    {notif.type === 'info' && <Calendar className="w-4 h-4" />}
                                    {notif.type === 'success' && <Bell className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h3 className={`text-sm font-semibold ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.description}</p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wide">{notif.time}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-muted/20 text-center">
                <button className="text-xs text-primary hover:underline font-medium">Mark all as read</button>
            </div>
        </DialogContent>
    );
};

export default NotificationsDialog;
