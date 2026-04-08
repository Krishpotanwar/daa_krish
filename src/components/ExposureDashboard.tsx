import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HealthStats } from '@/services/lungHealthScoringService';
import { Shield, Wind, TrendingDown, Calendar } from 'lucide-react';

interface ExposureDashboardProps {
    stats: HealthStats;
}

const ExposureDashboard = ({ stats }: ExposureDashboardProps) => {
    // Mock data if history is empty for better initial UI
    const chartData = useMemo(() => {
        if (stats.dailyHistory.length > 0) {
            return stats.dailyHistory.map(d => ({
                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                dose: d.dose,
                avoided: d.avoided
            }));
        }
        // Fallback/Demo data
        return [
            { date: 'Mon', dose: 45, avoided: 12 },
            { date: 'Tue', dose: 52, avoided: 10 },
            { date: 'Wed', dose: 38, avoided: 15 },
            { date: 'Thu', dose: 65, avoided: 8 },
            { date: 'Fri', dose: 48, avoided: 20 },
            { date: 'Sat', dose: 30, avoided: 25 },
            { date: 'Sun', dose: 35, avoided: 18 },
        ];
    }, [stats.dailyHistory]);

    return (
        <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="glass-panel border-blue-100 bg-blue-50/30">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Calendar className="w-4 h-4" />
                            <CardTitle className="text-sm font-medium uppercase tracking-wider">Weekly Dose</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-blue-700">{Math.round(stats.weeklyDose)} <span className="text-xs font-normal">μg</span></div>
                        <p className="text-[10px] text-blue-600/70 mt-1 italic">
                            WHO limit: ~105μg/week (avg)
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-panel border-green-100 bg-green-50/30">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-2 text-green-600">
                            <Shield className="w-4 h-4" />
                            <CardTitle className="text-sm font-medium uppercase tracking-wider">Pollution Saved</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-2xl font-bold text-green-700">{Math.round(stats.pollutionAvoided)} <span className="text-xs font-normal">μg</span></div>
                        <p className="text-[10px] text-green-600/70 mt-1">
                            Equivalent to 3 days of clean air!
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Trend Graph */}
            <Card className="glass-panel overflow-hidden border-primary/10">
                <CardHeader className="p-4 pb-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-primary" />
                                Exposure Trend
                            </CardTitle>
                            <CardDescription className="text-[10px]">Inhaled PM2.5 over time</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                <span>Dose</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span>Saved</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-2 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorDose" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAvoided" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                className="text-[9px]"
                                tick={{ fill: '#94a3b8' }}
                            />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '10px'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="dose"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDose)"
                            />
                            <Area
                                type="monotone"
                                dataKey="avoided"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAvoided)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default ExposureDashboard;
