import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { data: session, isPending } = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isPending && !session) {
            navigate("/login");
        }
    }, [session, isPending, navigate]);

    if (isPending) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-gray-400 font-display animate-pulse">Authenticating...</p>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return <>{children}</>;
};
