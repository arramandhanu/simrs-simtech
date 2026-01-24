import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");
        const userParam = searchParams.get("user");

        if (token && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam));
                login(token, user);
                navigate("/");
            } catch (err) {
                console.error("Failed to parse user data:", err);
                navigate("/login?error=parse_error");
            }
        } else {
            navigate("/login?error=no_token");
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-medical-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Completing SSO login...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
