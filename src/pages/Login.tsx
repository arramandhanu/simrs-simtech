import { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Activity } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo/logo.png";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keycloakEnabled, setKeycloakEnabled] = useState(false);

  // Check for SSO error from callback
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(`SSO login failed: ${errorParam}`);
    }
  }, [searchParams]);

  // Fetch auth config to check if Keycloak is enabled
  useEffect(() => {
    const fetchAuthConfig = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/config`
        );
        const data = await response.json();
        if (data.success && data.data.keycloak?.enabled) {
          setKeycloakEnabled(true);
        }
      } catch (err) {
        console.log("Auth config not available");
      }
    };
    fetchAuthConfig();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data.token) {
        login(response.data.token, response.data.user);
        navigate("/");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setSsoLoading(true);
    // Redirect to Keycloak with Google IDP hint to skip Keycloak login page
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}/auth/keycloak?kc_idp_hint=google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-medical-50">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        {/* Left Side - Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1 relative">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-medical-600 mb-6">
              <div className="w-12 h-12">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-800">
                SIMRS SIMTECH
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-500">
              Please enter your credentials to access the system.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              placeholder="admin@hospital.com"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={20} />}
            />

            <div>
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={20} />}
              />
              <div className="flex justify-end mt-2">
                <a
                  href="#"
                  className="text-sm font-medium text-medical-600 hover:text-medical-700"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-3.5"
              icon={
                !loading && (
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                )
              }
            >
              Sign In
            </Button>

            {/* SSO Divider */}
            {keycloakEnabled && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  isLoading={ssoLoading}
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5"
                  icon={
                    !ssoLoading && (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )
                  }
                >
                  Continue with Google
                </Button>
              </>
            )}
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <a
              href="#"
              className="font-semibold text-medical-600 hover:text-medical-700"
            >
              Contact IT Support
            </a>
          </p>
        </div>

        {/* Right Side - Hero */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-medical-600 to-medical-800 text-white relative overflow-hidden order-1 md:order-2">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-medical-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <Activity size={32} className="text-white" />
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Streamline Your <br />
              Hospital Operations
            </h2>
            <p className="text-medical-100 text-lg max-w-md">
              A comprehensive ERP solution designed for modern healthcare
              facilities. Efficient, secure, and reliable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
