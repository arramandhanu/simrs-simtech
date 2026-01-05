import { useState } from "react";
import { Mail, Lock, ArrowRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("admin@hospital.com");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await authService.login({ email, password });

      if (response.success && response.data.token) {
        // Use context login instead of relying on authService localStorage
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
          {/* Decorative Circles */}
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

          {/* <div className="relative z-10">
            <div className="flex items-center gap-4 text-sm font-medium text-medical-200">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-medical-300/30 border border-white/20 flex items-center justify-center text-xs"
                  >
                    Uses
                  </div>
                ))}
              </div>
              <span>Trusted by 50+ Top Hospitals</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
