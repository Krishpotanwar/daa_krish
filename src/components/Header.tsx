import { Wind, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileMenu from './ProfileMenu';

const Header = ({ aqi = 42, status = 'Good' }: { aqi?: number; status?: string }) => {
  const aqiColor =
    aqi <= 50 ? 'text-green-400' : aqi <= 100 ? 'text-yellow-400' : 'text-red-400';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 rounded-none"
      style={{
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center glow-white"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Leaf className="w-4 h-4 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border border-black" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-white leading-tight tracking-tight">
              PureWay
            </h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest">
              Clean Air Navigation
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Live AQI */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Wind className={`w-3.5 h-3.5 ${aqiColor}`} />
            <span className={`text-xs font-medium ${aqiColor}`}>AQI {aqi}</span>
            <span className="text-xs text-white/30">· {status}</span>
          </div>

          {/* Algorithms nav */}
          <Link
            to="/algorithms"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Algorithms
          </Link>

          {/* Help */}
          <button
            className="p-2 rounded-lg text-white/40 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title="How it works"
            onClick={() => { localStorage.removeItem('hasSeenWelcome_v1'); window.location.reload(); }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
