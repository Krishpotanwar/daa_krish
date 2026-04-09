import { useState, useEffect } from 'react';
import { LungHealthScore, lungHealthScoringService } from '@/services/lungHealthScoringService';
import ExposureDashboard from './ExposureDashboard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Info } from 'lucide-react';

const ActivityHistory = () => {
    const [score, setScore] = useState<LungHealthScore | null>(null);

    useEffect(() => {
        setScore(lungHealthScoringService.getScore());
    }, []);

    if (!score) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Health History
                </h2>
                <div className="p-1 px-2 rounded-full bg-muted border border-border flex items-center gap-1.5 cursor-help group relative">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">How it works</span>
                    <div className="absolute top-8 right-0 w-64 p-3 bg-popover text-popover-foreground rounded-xl border border-border shadow-xl text-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        PureWay tracks your inhaled dose based on the PM2.5 levels of your routes. "Pollution Saved" is the difference between the most polluted route and the clean one you chose.
                    </div>
                </div>
            </div>

            <ExposureDashboard stats={score.stats} />

            {/* History List Header */}
            <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h3>

                {score.stats.dailyHistory.length === 0 ? (
                    <div className="py-12 text-center space-y-3 glass-panel border-dashed border-2">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto opacity-50">
                            <History className="w-6 h-6" />
                        </div>
                        <p className="text-xs text-muted-foreground">No completed routes yet.<br />Start navigating to build your history!</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-3 pr-4">
                            {[...score.stats.dailyHistory].reverse().map((day) => (
                                <div key={day.date} className="glass-panel p-4 flex items-center justify-between animate-fade-in group hover:bg-white/50 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-foreground">
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{(day.distance / 1000).toFixed(1)} km traveled</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-blue-600">{Math.round(day.dose)}μg</div>
                                            <div className="text-[9px] text-muted-foreground uppercase">Dose</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-green-600">+{Math.round(day.avoided)}μg</div>
                                            <div className="text-[9px] text-muted-foreground uppercase">Saved</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
};

export default ActivityHistory;
