import { DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Bell, Moon, Map, Shield } from 'lucide-react';
import { useState } from "react";

const SettingsDialog = () => {
    // Dummy state
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [locationSharing, setLocationSharing] = useState(false);

    return (
        <DialogContent className="max-w-md glass-panel border-none shadow-2xl animate-fade-in sm:rounded-3xl p-0 overflow-hidden">
            <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-display font-bold">Settings</h2>
                </div>
            </div>

            <div className="p-6 space-y-6">

                {/* Notifications Section */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Bell className="w-3 h-3" /> Notifications
                    </h3>
                    <div className="space-y-4 pl-1">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Push Notifications</Label>
                                <p className="text-xs text-muted-foreground">Receive alerts about air quality.</p>
                            </div>
                            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Email Digest</Label>
                                <p className="text-xs text-muted-foreground">Weekly health summary.</p>
                            </div>
                            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="space-y-4 pt-2 border-t border-border/50">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Moon className="w-3 h-3" /> Appearance
                    </h3>
                    <div className="space-y-4 pl-1">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Dark Mode</Label>
                                <p className="text-xs text-muted-foreground">Easier on the eyes at night.</p>
                            </div>
                            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="space-y-4 pt-2 border-t border-border/50">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Map className="w-3 h-3" /> Preferences
                    </h3>
                    <div className="space-y-4 pl-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Distance Units</Label>
                            <Select defaultValue="km">
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                    <SelectValue placeholder="Units" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="km">Kilometers</SelectItem>
                                    <SelectItem value="mi">Miles</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Share Location</Label>
                                <p className="text-xs text-muted-foreground">Allow friends to see routes.</p>
                            </div>
                            <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-border/50 bg-muted/20 text-center">
                <p className="text-[10px] text-muted-foreground">Version 1.0.2 • BreatheWay Inc.</p>
            </div>
        </DialogContent>
    );
};

export default SettingsDialog;
