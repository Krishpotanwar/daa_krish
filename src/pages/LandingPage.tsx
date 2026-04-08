import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Leaf, Wind, Shield, Activity, Map as MapIcon, ChevronDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';

const LandingPage = () => {
    const navigate = useNavigate();
    const { data: session } = useSession();
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    const handleEnterApp = () => {
        navigate('/app');
    };

    const handleLogin = () => {
        navigate('/app');
    };

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-x-hidden font-display selection:bg-primary/30">

            {/* Background Animated Gradient / Fog */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1a3d32_0%,#000000_70%)] opacity-60" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
            </div>

            {/* Perspective Grid Line Animation (Route-like background) */}
            <div className="fixed inset-0 z-0 pointer-events-none perspective-grid-container opacity-30">
                <div className="perspective-grid animate-grid-move" />
            </div>

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <Leaf className="w-6 h-6 text-primary" />
                        <span className="text-xl font-bold tracking-tight">BreatheWay</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How it Works</button>
                        <button onClick={() => scrollToSection('science')} className="hover:text-white transition-colors">Science</button>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Button className="bg-primary hover:bg-primary/90 text-black font-semibold" onClick={handleEnterApp}>
                            Go to App
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Content */}
            <main className="relative z-10 container mx-auto px-6 pt-32 pb-24 md:pt-48 flex flex-col md:flex-row items-center border-b border-white/5">

                {/* Animated Route Path (Global Background for Hero) */}
                <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none opacity-40">
                    <svg width="100%" height="100%" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                        {/* Start Point (Left side) */}
                        <circle cx="10%" cy="80%" r="8" fill="#14b8a6" className="animate-pulse" />
                        <circle cx="10%" cy="80%" r="20" stroke="#14b8a6" strokeWidth="2" opacity="0.5" className="animate-ping" />

                        {/* End Point (Right side) */}
                        <circle cx="90%" cy="20%" r="8" fill="#22c55e" className="animate-pulse" />
                        <circle cx="90%" cy="20%" r="20" stroke="#22c55e" strokeWidth="2" opacity="0.5" className="animate-ping" style={{ animationDelay: '1s' }} />

                        {/* Large Curved Path connecting them across the screen */}
                        <path
                            d="M120,640 C300,600 400,200 600,400 S1000,100 1080,160"
                            stroke="url(#gradient-line)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray="15, 15"
                            className="route-dash-anim"
                            fill="none"
                            opacity="0.5"
                        />
                        <defs>
                            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#14b8a6" />
                                <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <style>
                        {`
                       .route-dash-anim {
                         stroke-dasharray: 15;
                         animation: dash 10s linear infinite;
                       }
                       @keyframes dash {
                         to {
                           stroke-dashoffset: -1000;
                         }
                       }
                     `}
                    </style>
                </div>

                {/* Left Text */}
                <div className={`flex-1 space-y-8 transition-all duration-1000 transform ${animate ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        LIVE AIR INTELLIGENCE
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight">
                        Breathe Easier. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-200">
                            Navigate Smarter.
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
                        Your real-time clean route planner. We analyze millions of data points to find you the path with the least pollution, protecting your lungs with every step.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-black h-12 px-8 text-base" onClick={handleEnterApp}>
                            Start Your Journey <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                {/* Right Visual - Running Man Animation */}
                <div className={`flex-1 relative mt-16 md:mt-0 flex justify-center perspective-1000 transition-all duration-1000 delay-300 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                    <div className="relative w-[300px] h-[400px] md:w-[450px] md:h-[600px]">
                        {/* Glow Behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/20 blur-[100px] rounded-full" />

                        {/* Map/Route Background behind Runner */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[80%] opacity-20 z-10 mix-blend-overlay">
                            <div className="w-full h-full bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/15/9644/12321.png')] bg-cover rounded-lg filter grayscale contrast-125" />
                        </div>



                        <img
                            src="/running-man.png"
                            alt="Running Man"
                            className="w-full h-full object-contain relative z-20 mix-blend-screen drop-shadow-2xl"
                            style={{ filter: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.3))" }}
                        />
                        <div className="absolute inset-0 z-30 animate-spin-slow pointer-events-none">
                            {/* Original Leaf */}
                            <div className="absolute top-[20%] right-[10%] w-16 h-16 animate-float">
                                <img src="/leaf.png" alt="Leaf" className="w-full h-full object-contain drop-shadow-glow mix-blend-screen" />
                            </div>

                            {/* Second Leaf */}
                            <div className="absolute bottom-[30%] left-[10%] w-12 h-12 opacity-80 animate-float" style={{ animationDelay: '1s' }}>
                                <img src="/leaf.png" alt="Leaf" className="w-full h-full object-contain drop-shadow-glow mix-blend-screen" />
                            </div>

                            {/* Third Leaf (New) */}
                            <div className="absolute top-[60%] right-[-5%] w-10 h-10 opacity-70 animate-float" style={{ animationDelay: '2.5s' }}>
                                <img src="/leaf.png" alt="Leaf" className="w-full h-full object-contain drop-shadow-glow mix-blend-screen" />
                            </div>

                            {/* Fourth Leaf (New) */}
                            <div className="absolute top-[10%] left-[20%] w-8 h-8 opacity-60 animate-float" style={{ animationDelay: '1.5s' }}>
                                <img src="/leaf.png" alt="Leaf" className="w-full h-full object-contain drop-shadow-glow mix-blend-screen" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="relative z-10 py-24 bg-black/50 backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose BreatheWay?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">More than just a map. It's a health companion designed for urban life.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <Wind className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Real-Time Air Quality</h3>
                            <p className="text-gray-400">Hyper-local pollution data (PM2.5, NO2) derived from satellite and ground sensors.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Health vs. Speed</h3>
                            <p className="text-gray-400">Compare "Fastest" vs "Cleanest" routes. Powered by <strong>TomTom</strong> for precise navigation.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Personalized Profiles</h3>
                            <p className="text-gray-400">Customize accurate exposure tracking based on your profile (e.g., Asthmatic, Cyclist).</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
                            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
                             <p className="text-gray-400">Your health data is processed locally for maximum privacy and performance.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative z-10 py-24 border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold shrink-0">1</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Search & Plan</h4>
                                        <p className="text-gray-400">Enter your start and end points. We instantly calculate multiple route options.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold shrink-0">2</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Choose Your Path</h4>
                                        <p className="text-gray-400">Select the <strong>Green Route</strong> for cleaner air or see how much pollution you save vs the fastest path.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold shrink-0">3</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Live Guidance</h4>
                                        <p className="text-gray-400">Get real-time exposure alerts if you stay too long in a pollution hotspot.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                            {/* Decorative Map UI */}
                            <div className="absolute inset-0 bg-[url('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/13/2253/3074.png')] bg-cover opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="glass-panel p-6 rounded-xl animate-float">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="font-bold">Optimized Route Found</span>
                                    </div>
                                    <div className="text-sm text-gray-300">-24% Pollution Exposure</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Science Section */}
            <section id="science" className="relative z-10 py-24 bg-primary/5 border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">Science of Safety</h2>
                    <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
                        We don't just measure air; we measure <strong>Impact</strong>. Our "Inhaled Dose" metric combines:
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16 text-left">
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="text-primary font-bold mb-2 text-xl">1. Concentration</h4>
                            <p className="text-sm text-gray-400">Real-time levels of PM2.5, PM10, and NO2 from satellite & ground sensors.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="text-primary font-bold mb-2 text-xl">2. Ventilation</h4>
                            <p className="text-sm text-gray-400">Your breathing rate changes based on activity (Cycling vs Walking vs Running).</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                            <h4 className="text-primary font-bold mb-2 text-xl">3. Duration</h4>
                            <p className="text-sm text-gray-400">Time spent in specific pollution zones to calculate total mass inhaled.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all">
                        <div className="text-xl font-bold flex items-center gap-2"><MapIcon className="w-6 h-6" /> TomTom Maps</div>
                        <div className="text-xl font-bold flex items-center gap-2"><Wind className="w-6 h-6" /> OpenMeteo</div>
                        <div className="text-xl font-bold flex items-center gap-2"><Activity className="w-6 h-6" /> WHO Standards</div>
                        <div className="text-xl font-bold flex items-center gap-2"><Lock className="w-6 h-6" /> Supabase Secure</div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 py-24 border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to Breathe Better?</h2>
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-black h-16 px-12 text-xl rounded-full" onClick={handleEnterApp}>
                        Launch App Now
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-8 border-t border-white/10 bg-black text-center text-gray-600 text-sm">
                <p>&copy; 2024 BreatheWay. All rights reserved.</p>
            </footer>

            <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes grid-move {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0px); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.8));
        }
        .perspective-grid-container {
          perspective: 500px;
          overflow: hidden;
        }
        .perspective-grid {
          position: absolute;
          top: -100%;
          left: -50%;
          width: 200%;
          height: 200%;
          background-image: 
            linear-gradient(to right, rgba(20, 184, 166, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(20, 184, 166, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
          transform: perspective(500px) rotateX(60deg);
          animation: grid-move 1s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default LandingPage;
