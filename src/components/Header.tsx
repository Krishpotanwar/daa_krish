import { Wind, HeartPulse, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';

const Header = ({ aqi = 42, status = 'Good' }: { aqi?: number, status?: string }) => {
  const getAQIInfo = (val: number) => {
    if (val <= 50) return { color: 'text-pollution-low', bg: 'bg-pollution-low/10', border: 'border-pollution-low/30', icon: 'text-pollution-low' };
    if (val <= 100) return { color: 'text-pollution-moderate', bg: 'bg-pollution-moderate/10', border: 'border-pollution-moderate/30', icon: 'text-pollution-moderate' };
    return { color: 'text-pollution-high', bg: 'bg-pollution-high/10', border: 'border-pollution-high/30', icon: 'text-pollution-high' };
  };

  const aqiInfo = getAQIInfo(aqi);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-border/50 rounded-none">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo ... */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl gradient-clean flex items-center justify-center shadow-glow animate-breathe">
              <HeartPulse className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className={`absolute -top-1 -right-1 w-3 h-3 ${aqi <= 50 ? 'bg-health-good' : aqi <= 100 ? 'bg-yellow-500' : 'bg-red-500'} rounded-full border-2 border-background`} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-tight">
              BreatheWay
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Lung-Aware Navigation
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Live AQI Badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full ${aqiInfo.bg} border ${aqiInfo.border}`}>
            <Wind className={`w-4 h-4 ${aqiInfo.icon}`} />
            <span className={`text-xs font-medium ${aqiInfo.color}`}>AQI {aqi}</span>
            <span className="text-xs text-muted-foreground">• {status}</span>
          </div>

          {/* Algorithms nav link */}
          <Link
            to="/algorithms"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Algorithms
          </Link>

          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="How it works"
            onClick={() => {
              localStorage.removeItem('hasSeenWelcome_v1');
              window.location.reload();
            }}
          >
            <span className="sr-only">How it works</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>

          {/* Profile Menu */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
