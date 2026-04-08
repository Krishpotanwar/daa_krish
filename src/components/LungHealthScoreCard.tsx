import { Trophy, Award, TrendingUp, Target, Flame } from 'lucide-react';
import { useEffect, useState } from 'react';
import { lungHealthScoringService, LungHealthScore } from '@/services/lungHealthScoringService';
import { Progress } from '@/components/ui/progress';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const LungHealthScoreCard = () => {
    const [score, setScore] = useState<LungHealthScore | null>(null);
    const [levelProgress, setLevelProgress] = useState({ current: null as any, next: null as any, progress: 0 });

    useEffect(() => {
        // Load score on mount
        const currentScore = lungHealthScoringService.getScore();
        setScore(currentScore);

        const progress = lungHealthScoringService.getLevelProgress(currentScore.totalScore);
        setLevelProgress(progress);
    }, []);

    if (!score) return null;

    return (
        <Card className="glass-panel border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Lung Health Score</CardTitle>
                            <CardDescription className="text-xs">Keep breathing clean!</CardDescription>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{score.totalScore}</div>
                        <div className="text-xs text-muted-foreground">Total Points</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Current Level */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{score.level.icon}</span>
                            <div>
                                <div className="font-semibold text-sm" style={{ color: score.level.color }}>
                                    {score.level.name}
                                </div>
                                {levelProgress.next && (
                                    <div className="text-xs text-muted-foreground">
                                        Next: {levelProgress.next.icon} {levelProgress.next.name}
                                    </div>
                                )}
                            </div>
                        </div>
                        {score.dailyScore > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                +{score.dailyScore} today
                            </Badge>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {levelProgress.next && (
                        <div className="space-y-1">
                            <Progress value={levelProgress.progress} className="h-2" />
                            <div className="text-xs text-muted-foreground text-right">
                                {Math.round(levelProgress.progress)}% to next level
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Target className="w-3.5 h-3.5" />
                            <span>Clean Routes</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                            {score.stats.cleanRoutes}/{score.stats.totalRoutes}
                        </div>
                    </div>

                    <div className="space-y-1 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Flame className="w-3.5 h-3.5" />
                            <span>Streak</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                            {score.stats.streak} days
                        </div>
                    </div>

                    <div className="space-y-1 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Distance</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                            {(score.stats.cleanAirDistance / 1000).toFixed(1)} km
                        </div>
                    </div>

                    <div className="space-y-1 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Award className="w-3.5 h-3.5" />
                            <span>Badges</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">
                            {score.badges.length}
                        </div>
                    </div>
                </div>

                {/* Recent Badges */}
                {score.badges.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-semibold text-muted-foreground">Recent Badges</div>
                        <div className="flex flex-wrap gap-2">
                            {score.badges.slice(-3).reverse().map((badge) => (
                                <div
                                    key={badge.id}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200"
                                    title={badge.description}
                                >
                                    <span className="text-sm">{badge.icon}</span>
                                    <span className="text-xs font-medium text-yellow-900">{badge.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pollution Avoided */}
                {score.stats.pollutionAvoided > 0 && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="text-xs text-green-700 font-medium">
                            🛡️ You've avoided <span className="font-bold">{Math.round(score.stats.pollutionAvoided)}μg</span> of PM2.5!
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LungHealthScoreCard;
