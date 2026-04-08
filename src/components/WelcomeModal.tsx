import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wind, Map, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WelcomeModal = () => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome_v1');
        if (!hasSeenWelcome) {
            // Small delay for better UX on load
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setOpen(false);
        localStorage.setItem('hasSeenWelcome_v1', 'true');
    };

    const content = [
        {
            icon: <Wind className="w-16 h-16 text-pollution-high mb-6 animate-pulse" />,
            title: "The Invisible Killer",
            description: "Air pollution (PM2.5) causes 7 million premature deaths annually. It's not just about what you see, but what you breathe.",
            color: "bg-pollution-high/10 text-pollution-high"
        },
        {
            icon: <Map className="w-16 h-16 text-primary mb-6 animate-bounce" />,
            title: "Navigate Smarter",
            description: "Most maps find the fastest route. We find the cleanest. Avoid toxic hotspots without losing significant time.",
            color: "bg-primary/10 text-primary"
        },
        {
            icon: <ShieldCheck className="w-16 h-16 text-health-good mb-6 animate-pulse" />,
            title: "Protect Your Health",
            description: "Reduce your daily inhaled dose of pollutants by up to 40%. Your lungs will thank you.",
            color: "bg-health-good/10 text-health-good"
        }
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col h-[500px]">
                    {/* Visual Area */}
                    <div className={cn("flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors duration-500", content[step].color)}>
                        {content[step].icon}
                        <h2 className="text-2xl font-display font-bold mb-3 tracking-tight">{content[step].title}</h2>
                        <p className="text-base font-medium opacity-90 leading-relaxed max-w-[260px] mx-auto">
                            {content[step].description}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="p-6 bg-card border-t border-border">
                        <div className="flex items-center justify-between">
                            {/* Indicators */}
                            <div className="flex gap-2">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                            step === i ? "bg-primary w-6" : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Button */}
                            <Button onClick={handleNext} className="group">
                                {step === 2 ? "Get Started" : "Next"}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WelcomeModal;
