import { useState, useEffect } from 'react';
import { HEALTH_PROFILES, HealthProfileType, lungHealthScoringService } from '@/services/lungHealthScoringService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Heart, User, Milestone, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthProfileSelectorProps {
    onSelect?: (profile: HealthProfileType) => void;
}

const HealthProfileSelector = ({ onSelect }: HealthProfileSelectorProps) => {
    const [activeProfile, setActiveProfile] = useState<HealthProfileType>('NORMAL');

    useEffect(() => {
        const score = lungHealthScoringService.getScore();
        if (score.activeProfile) {
            setActiveProfile(score.activeProfile);
        }
    }, []);

    const handleSelect = (type: HealthProfileType) => {
        setActiveProfile(type);
        lungHealthScoringService.setProfile(type);
        if (onSelect) onSelect(type);
    };

    const getIcon = (type: HealthProfileType) => {
        switch (type) {
            case 'NORMAL': return <User className="w-5 h-5" />;
            case 'ASTHMATIC': return <Heart className="w-5 h-5 text-red-500" />;
            case 'ELDERLY': return <Milestone className="w-5 h-5 text-amber-600" />;
            case 'CHILD_SENSITIVE': return <Baby className="w-5 h-5 text-blue-500" />;
            default: return <User className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                {(Object.keys(HEALTH_PROFILES) as HealthProfileType[]).map((key) => {
                    const profile = HEALTH_PROFILES[key];
                    const isSelected = activeProfile === key;

                    return (
                        <Card
                            key={key}
                            className={cn(
                                "cursor-pointer transition-all duration-200 border-2 overflow-hidden group",
                                isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 hover:bg-muted/50"
                            )}
                            onClick={() => handleSelect(key)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    {getIcon(key)}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-sm">{profile.name}</h4>
                                        {isSelected && <Check className="w-4 h-4 text-primary animate-in zoom-in duration-300" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{profile.description}</p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Badge variant="outline" className="text-[9px] h-4 py-0 font-normal uppercase tracking-wider backdrop-blur-sm">
                                            {profile.sensitivityFactor}x sensitivity
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default HealthProfileSelector;
