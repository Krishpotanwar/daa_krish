import { useState, useEffect } from 'react';
import { ArrowRight, Leaf, Wind, Shield, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Reusable glass card
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-2xl p-6 ${className}`}
    style={{
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
    }}
  >
    {children}
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)' }} />
      </div>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(0,0,0,0.5)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PureWay</span>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors"
          >
            Open App <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-40 pb-28 flex flex-col items-center text-center">

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/70 uppercase tracking-widest">Live Air Intelligence</span>
        </div>

        {/* Headline */}
        <h1
          className={`text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          Navigate the
          <span className="block text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #ffffff 30%, #6b7280 100%)' }}
          >
            Cleanest Path.
          </span>
        </h1>

        <p
          className={`text-lg text-white/50 max-w-xl leading-relaxed mb-10 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          PureWay uses real-time air quality data and DAA algorithms to find
          you the route with the lowest pollution exposure — not just the fastest.
        </p>

        {/* CTA buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <button
            onClick={() => navigate('/app')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors"
            style={{ boxShadow: '0 0 40px rgba(255,255,255,0.15)' }}
          >
            Start Your Journey <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/algorithms')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-medium text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            View Algorithms <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Route animation — SVG path */}
        <div
          className={`w-full max-w-2xl mt-20 transition-all duration-1000 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ height: 120 }}
        >
          <svg width="100%" height="120" viewBox="0 0 600 120" fill="none">
            <circle cx="20" cy="60" r="6" fill="white" opacity="0.8" />
            <circle cx="20" cy="60" r="14" stroke="white" strokeWidth="1" opacity="0.2" className="animate-ping" />
            <path
              d="M26,60 C120,20 200,100 300,60 S480,20 580,60"
              stroke="url(#pw-grad)" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="8 6" fill="none" opacity="0.6"
              style={{ animation: 'dash 6s linear infinite' }}
            />
            <circle cx="580" cy="60" r="6" fill="white" opacity="0.6" />
            <defs>
              <linearGradient id="pw-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="white" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
          <style>{`@keyframes dash { to { stroke-dashoffset: -100; } }`}</style>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Why PureWay?</h2>
          <p className="text-white/40">More than a map — a health-first navigation companion.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Wind className="w-5 h-5" />, title: 'Real-Time AQI', desc: 'PM2.5, NO₂, and ozone levels fetched live along every route.' },
            { icon: <Activity className="w-5 h-5" />, title: 'DAA Algorithms', desc: 'Dijkstra, Greedy Selection, and Closest Pair power the routing.' },
            { icon: <Shield className="w-5 h-5" />, title: 'Health First', desc: 'Routes scored by inhaled dose, not just time or distance.' },
            { icon: <Leaf className="w-5 h-5" />, title: 'Any Location', desc: 'Works globally — Nominatim + Open-Meteo, zero API keys needed.' },
          ].map((f) => (
            <GlassCard key={f.title} className="hover:scale-[1.02] transition-transform duration-200">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 text-white/80"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── Algorithm highlight ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <GlassCard className="flex flex-col md:flex-row items-center gap-10 p-10">
          <div className="flex-1">
            <span className="inline-block text-xs uppercase tracking-widest text-white/30 mb-3">DAA Lab · 24CS03TH0402</span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">
              Three algorithms.<br />One clean route.
            </h2>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-2"><span className="text-white font-mono">II</span> Greedy Activity Selection — picks non-overlapping low-AQI segments</li>
              <li className="flex items-start gap-2"><span className="text-white font-mono">III</span> Dijkstra's Algorithm — shortest path on AQI-weighted graph</li>
              <li className="flex items-start gap-2"><span className="text-white font-mono">IV</span> Closest Pair D&C — snaps routes to nearest pollution sensor</li>
            </ul>
            <button
              onClick={() => navigate('/algorithms')}
              className="mt-6 flex items-center gap-2 text-sm font-medium text-white hover:text-white/70 transition-colors"
            >
              See all algorithms <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3 w-full">
            {[['O((V+E) log V)', 'Dijkstra'], ['O(n log n)', 'Greedy'], ['O(n log² n)', 'Closest Pair']].map(([c, n]) => (
              <div key={n} className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <code className="text-xs text-white/80 font-mono block mb-1">{c}</code>
                <span className="text-[10px] text-white/30">{n}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-28 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to breathe pure?</h2>
        <button
          onClick={() => navigate('/app')}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-black font-bold text-base hover:bg-white/90 transition-colors"
          style={{ boxShadow: '0 0 60px rgba(255,255,255,0.12)' }}
        >
          Launch PureWay <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 text-center border-t"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs text-white/20">
          © 2025 PureWay · DAA Lab Project 24CS03TH0402 · RBU Nagpur B.Tech CSE Sem IV
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
