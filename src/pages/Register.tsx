import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Leaf, ArrowLeft, Loader2 } from 'lucide-react';
import { signUp } from '@/lib/auth-client';
import { toast } from 'sonner';

const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { data, error } = await signUp.email({
            email,
            password,
            name,
            callbackURL: '/app'
        });

        setIsLoading(true);

        if (error) {
            toast.error(error.message || "Failed to create account.");
        } else {
            toast.success("Account created successfully!");
            navigate('/app');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-display flex items-center justify-center p-4">

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
            </div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-md animate-fade-in">
                <Button
                    variant="ghost"
                    className="mb-8 text-gray-400 hover:text-white pl-0 hover:bg-transparent"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
                </Button>

                <div className="glass-panel border-white/10 p-8 rounded-2xl bg-black/40 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl gradient-clean flex items-center justify-center shadow-glow mb-4">
                            <Leaf className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
                        <p className="text-muted-foreground text-sm mt-2">Start your healthy journey today</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Full Name</label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 transition-all font-sans"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Email</label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 transition-all font-sans"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-primary/50 focus:ring-primary/20 transition-all font-sans"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-black font-semibold h-11 mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link to="/login" className="text-white hover:underline transition-all">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
