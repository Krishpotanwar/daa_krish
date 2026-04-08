/**
 * Lung Health Scoring Service - Gamification System
 * 
 * Tracks user's lung health score based on route choices and navigation behavior.
 * Implements levels, badges, achievements, and historical tracking.
 */

import { supabase } from '@/lib/supabaseClient';
import { authClient } from '@/lib/auth-client';

export type HealthProfileType = 'NORMAL' | 'ASTHMATIC' | 'ELDERLY' | 'CHILD_SENSITIVE';

export interface HealthProfile {
    type: HealthProfileType;
    name: string;
    sensitivityFactor: number;
    description: string;
}

export const HEALTH_PROFILES: Record<HealthProfileType, HealthProfile> = {
    NORMAL: {
        type: 'NORMAL',
        name: 'Normal',
        sensitivityFactor: 1.0,
        description: 'Standard health profile with average pollution sensitivity.'
    },
    ASTHMATIC: {
        type: 'ASTHMATIC',
        name: 'Asthmatic',
        sensitivityFactor: 1.8,
        description: 'Increased sensitivity. Higher risk of respiratory irritation.'
    },
    ELDERLY: {
        type: 'ELDERLY',
        name: 'Elderly',
        sensitivityFactor: 1.5,
        description: 'Sensitive to prolonged exposure. Lower exertion recommended.'
    },
    CHILD_SENSITIVE: {
        type: 'CHILD_SENSITIVE',
        name: 'Child-sensitive',
        sensitivityFactor: 2.0,
        description: 'Highly sensitive. Maximum protection from PM2.5 recommended.'
    }
};

export interface LungHealthScore {
    totalScore: number;
    dailyScore: number;
    level: LungHealthLevel;
    badges: Badge[];
    stats: HealthStats;
    activeProfile: HealthProfileType;
}

export interface LungHealthLevel {
    name: string;
    icon: string;
    minScore: number;
    maxScore: number;
    color: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number; // timestamp
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface HealthStats {
    totalRoutes: number;
    cleanRoutes: number;
    pollutedRoutes: number;
    totalDistance: number; // meters
    cleanAirDistance: number; // meters
    pollutionAvoided: number; // μg
    streak: number; // consecutive days
    lastActivity: number; // timestamp
    dailyHistory: DailyStat[]; // last 30 days
    weeklyDose: number; // last 7 days aggregation
}

export interface DailyStat {
    date: string; // YYYY-MM-DD
    dose: number;
    avoided: number;
    distance: number;
}

// Level definitions
const LEVELS: LungHealthLevel[] = [
    { name: 'Fresh Lungs', icon: '🌱', minScore: 0, maxScore: 100, color: '#22c55e' },
    { name: 'Air Aware', icon: '🍃', minScore: 101, maxScore: 300, color: '#10b981' },
    { name: 'Urban Survivor', icon: '🏙️', minScore: 301, maxScore: 600, color: '#3b82f6' },
    { name: 'Pollution Ninja', icon: '😷', minScore: 601, maxScore: 1000, color: '#8b5cf6' },
    { name: 'Breath Master', icon: '🧘', minScore: 1001, maxScore: Infinity, color: '#f59e0b' }
];

// Badge definitions
const BADGE_DEFINITIONS = {
    FIRST_CLEAN_ROUTE: { id: 'first_clean_route', name: 'Clean Start', description: 'Completed your first clean air route', icon: '🌟', rarity: 'common' as const },
    POLLUTION_AVOIDER: { id: 'pollution_avoider', name: 'Pollution Avoider', description: 'Avoided 1000μg of PM2.5', icon: '🛡️', rarity: 'rare' as const },
    WEEK_STREAK: { id: 'week_streak', name: 'Week Warrior', description: '7 day streak of clean routes', icon: '🔥', rarity: 'epic' as const },
    DISTANCE_MASTER: { id: 'distance_master', name: 'Distance Master', description: 'Traveled 100km on clean routes', icon: '🏃', rarity: 'epic' as const },
    PERFECT_MONTH: { id: 'perfect_month', name: 'Perfect Month', description: '30 days of only clean routes', icon: '👑', rarity: 'legendary' as const }
};

class LungHealthScoringService {
    private readonly STORAGE_KEY = 'breatheway_lung_health_v2'; // Bump version for new schema
    private readonly CLEAN_ROUTE_POINTS = 10;
    private readonly POLLUTED_ROUTE_PENALTY = -5;

    getScore(): LungHealthScore {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        return this.initializeScore();
    }

    async syncWithSupabase() {
        const session = await authClient.getSession();
        const user = session.data?.user;
        if (!user) return;

        // Fetch user stats from Supabase
        const { data: stats, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error('Error fetching user stats:', error);
            return;
        }

        const currentScore = this.getScore();

        if (stats) {
            // Update local score with server data if server data is newer or local is empty
            // For now, let's just merge them simply
            const updatedScore: LungHealthScore = {
                ...currentScore,
                totalScore: stats.total_score,
                dailyScore: stats.daily_score,
                activeProfile: stats.active_profile as HealthProfileType,
                stats: {
                    ...currentScore.stats,
                    totalRoutes: stats.total_routes,
                    cleanRoutes: stats.clean_routes,
                    pollutedRoutes: stats.polluted_routes,
                    totalDistance: stats.total_distance,
                    cleanAirDistance: stats.clean_air_distance,
                    pollutionAvoided: stats.pollution_avoided,
                    streak: stats.streak,
                    lastActivity: new Date(stats.last_activity).getTime(),
                }
            };

            // Also fetch route history
            const { data: history } = await supabase
                .from('route_history')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(30);

            if (history) {
                updatedScore.stats.dailyHistory = history.map(h => ({
                    date: h.date,
                    dose: h.dose,
                    avoided: h.avoided,
                    distance: h.distance
                })).reverse();
            }

            this.saveScore(updatedScore);
        } else {
            // First time sync: push local data to Supabase
            await this.pushToSupabase(currentScore, user.id);
        }
    }

    private async pushToSupabase(score: LungHealthScore, userId: string) {
        const { error } = await supabase
            .from('user_stats')
            .upsert({
                user_id: userId,
                total_score: score.totalScore,
                daily_score: score.dailyScore,
                active_profile: score.activeProfile,
                total_routes: score.stats.totalRoutes,
                clean_routes: score.stats.cleanRoutes,
                polluted_routes: score.stats.pollutedRoutes,
                total_distance: score.stats.totalDistance,
                clean_air_distance: score.stats.cleanAirDistance,
                pollution_avoided: score.stats.pollutionAvoided,
                streak: score.stats.streak,
                last_activity: new Date(score.stats.lastActivity).toISOString(),
            });

        if (error) console.error('Error pushing to Supabase:', error);
    }

    private initializeScore(): LungHealthScore {
        const score: LungHealthScore = {
            totalScore: 0,
            dailyScore: 0,
            level: LEVELS[0],
            badges: [],
            stats: {
                totalRoutes: 0,
                cleanRoutes: 0,
                pollutedRoutes: 0,
                totalDistance: 0,
                cleanAirDistance: 0,
                pollutionAvoided: 0,
                streak: 0,
                lastActivity: Date.now(),
                dailyHistory: [],
                weeklyDose: 0
            },
            activeProfile: 'NORMAL'
        };
        this.saveScore(score);
        return score;
    }


    getActiveProfile(): HealthProfile {
        const score = this.getScore();
        return HEALTH_PROFILES[score.activeProfile || 'NORMAL'];
    }

    recordRoute(params: {
        distance: number; // meters
        avgAQI: number;
        pollutionAvoided: number; // μg
        inhaledDose: number; // μg
        isCleanRoute: boolean;
    }): LungHealthScore {
        const score = this.getScore();
        score.stats.totalRoutes++;
        score.stats.totalDistance += params.distance;

        if (params.isCleanRoute) {
            score.stats.cleanRoutes++;
            score.stats.cleanAirDistance += params.distance;
            score.totalScore += this.CLEAN_ROUTE_POINTS;
            score.dailyScore += this.CLEAN_ROUTE_POINTS;
        } else {
            score.stats.pollutedRoutes++;
            score.totalScore += this.POLLUTED_ROUTE_PENALTY;
            score.dailyScore += this.POLLUTED_ROUTE_PENALTY;
        }

        score.stats.pollutionAvoided += params.pollutionAvoided;
        score.stats.lastActivity = Date.now();

        // Historical tracking
        const today = new Date().toISOString().split('T')[0];
        let dailyRecord = score.stats.dailyHistory.find(d => d.date === today);
        if (!dailyRecord) {
            dailyRecord = { date: today, dose: 0, avoided: 0, distance: 0 };
            score.stats.dailyHistory.push(dailyRecord);
            if (score.stats.dailyHistory.length > 30) score.stats.dailyHistory.shift();
        }
        dailyRecord.dose += params.inhaledDose;
        dailyRecord.avoided += params.pollutionAvoided;
        dailyRecord.distance += params.distance;

        const last7Entries = score.stats.dailyHistory.slice(-7);
        score.stats.weeklyDose = last7Entries.reduce((acc, curr) => acc + curr.dose, 0);

        this.updateStreak(score);
        score.level = this.calculateLevel(score.totalScore);
        this.checkBadges(score);
        score.totalScore = Math.max(0, score.totalScore);
        score.dailyScore = Math.max(0, score.dailyScore);
        this.saveScore(score);

        // Sync with Supabase in background
        this.syncRouteToSupabase(params, score);

        return score;
    }

    private async syncRouteToSupabase(params: any, score: LungHealthScore) {
        const session = await authClient.getSession();
        const user = session.data?.user;
        if (!user) return;

        // Push route history
        await supabase.from('route_history').insert({
            user_id: user.id,
            dose: params.inhaledDose,
            avoided: params.pollutionAvoided,
            distance: params.distance,
            is_clean_route: params.isCleanRoute,
            avg_aqi: Math.round(params.avgAQI)
        });

        // Update stats
        await this.pushToSupabase(score, user.id);
    }

    private updateStreak(score: LungHealthScore): void {
        const now = Date.now();
        const last = score.stats.lastActivity;
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) score.stats.streak++;
        else if (diffDays > 1) score.stats.streak = 1;
    }

    private calculateLevel(score: number): LungHealthLevel {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (score >= LEVELS[i].minScore) return LEVELS[i];
        }
        return LEVELS[0];
    }

    private checkBadges(score: LungHealthScore): void {
        const ids = new Set(score.badges.map(b => b.id));
        if (score.stats.cleanRoutes === 1 && !ids.has(BADGE_DEFINITIONS.FIRST_CLEAN_ROUTE.id)) this.awardBadge(score, BADGE_DEFINITIONS.FIRST_CLEAN_ROUTE);
        if (score.stats.pollutionAvoided >= 1000 && !ids.has(BADGE_DEFINITIONS.POLLUTION_AVOIDER.id)) this.awardBadge(score, BADGE_DEFINITIONS.POLLUTION_AVOIDER);
        if (score.stats.streak >= 7 && !ids.has(BADGE_DEFINITIONS.WEEK_STREAK.id)) this.awardBadge(score, BADGE_DEFINITIONS.WEEK_STREAK);
        if (score.stats.cleanAirDistance >= 100000 && !ids.has(BADGE_DEFINITIONS.DISTANCE_MASTER.id)) this.awardBadge(score, BADGE_DEFINITIONS.DISTANCE_MASTER);
    }

    private awardBadge(score: LungHealthScore, def: any): void {
        score.badges.push({ ...def, earnedAt: Date.now() });
    }

    getLevelProgress(score: number) {
        const current = this.calculateLevel(score);
        const idx = LEVELS.findIndex(l => l.name === current.name);
        const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
        if (!next) return { current, next, progress: 100 };
        const progress = Math.min(100, ((score - current.minScore) / (next.minScore - current.minScore)) * 100);
        return { current, next, progress };
    }

    private profileListeners: Set<(profile: HealthProfileType) => void> = new Set();

    onProfileChange(callback: (profile: HealthProfileType) => void): () => void {
        this.profileListeners.add(callback);
        return () => this.profileListeners.delete(callback);
    }

    setProfile(profileType: HealthProfileType): LungHealthScore {
        const score = this.getScore();
        score.activeProfile = profileType;
        this.saveScore(score);
        this.profileListeners.forEach(l => {
            try {
                l(profileType);
            } catch (err) {
                console.error("Error in profile listener", err);
            }
        });
        return score;
    }


    private saveScore(score: LungHealthScore): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(score));
    }

    reset(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}

export const lungHealthScoringService = new LungHealthScoringService();
