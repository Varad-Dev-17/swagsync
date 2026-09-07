import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Eye,
  EyeOff,
  Diamond,
  ArrowRight,
  Loader2,
} from "lucide-react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || "Invalid credentials");
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center md:justify-end px-4 md:px-16 lg:px-32 relative overflow-hidden bg-cover bg-no-repeat"
      style={{
        backgroundImage: 'url("/authentication_bg/auth_bg.png")',
        backgroundPosition: "center",
      }}
    >
      {/* Mobile Light Overlay for readability */}
      <div className="absolute inset-0 bg-white/40 md:bg-transparent z-0 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[400px] z-10"
      >
        {/* Glass Card */}
        <div
          className="rounded-4xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <img src="/Logo/logo.png" alt="SwagSync Logo" className="h-16 w-auto mb-2 object-contain" />
            <p
              className="mt-1 text-center"
              style={{
                
                fontSize: "16px",
                lineHeight: 1.5,
                color: "#475569",
              }}
            >
              Welcome back! Enjoy your shopping experience.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl text-center"
              style={{
                background: "#ffdad6",
                color: "#93000a",
                
                fontSize: "14px",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block ml-1"
                style={{
                  
                  fontSize: "12px",
                  lineHeight: 1,
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#334155",
                }}
              >
                Email Address
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: "#767586" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@swagsync.com"
                  required
                  className="w-full h-12 pl-12 pr-4 rounded-xl transition-all duration-300"
                  style={{
                    
                    fontSize: "16px",
                    color: "#1f2937",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4338CA";
                    e.target.style.background = "rgba(255, 255, 255, 0.3)";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(67, 56, 202, 0.15)";
                    e.target.style.outline = "none";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    e.target.style.background = "rgba(255, 255, 255, 0.15)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block ml-1"
                placeholder="●●●●●●●●●"
                style={{
                  
                  fontSize: "12px",
                  lineHeight: 1,
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "#334155",
                }}
              >
                Password
              </label>
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: "#767586" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="●●●●●●●●●"
                  required
                  className="w-full h-12 pl-12 pr-12 rounded-xl transition-all duration-300"
                  style={{
                    
                    fontSize: "16px",
                    color: "#1f2937",
                    background: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#4338CA";
                    e.target.style.background = "rgba(255, 255, 255, 0.3)";
                    e.target.style.boxShadow =
                      "0 0 0 4px rgba(67, 56, 202, 0.15)";
                    e.target.style.outline = "none";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    e.target.style.background = "rgba(255, 255, 255, 0.15)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#4338CA]"
                  style={{ color: "#767586" }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm hover:underline transition-all"
                style={{
                  
                  color: "#4338CA",
                  fontWeight: 600,
                }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, #3730A3 0%, #4F46E5 100%)",
                
                fontSize: "16px",
                boxShadow: "0 10px 25px rgba(67, 56, 202, 0.25)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "#c7c4d7" }} />
            <span
              style={{
                
                fontSize: "12px",
                color: "#64748b",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              or
            </span>
            <div className="flex-1 h-px" style={{ background: "#c7c4d7" }} />
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p
              style={{
                
                fontSize: "16px",
                lineHeight: 1.5,
                color: "#475569",
              }}
            >
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-bold hover:underline transition-all"
                style={{ color: "#4338CA" }}
              >
                Create Account
              </Link>
            </p>
          </div>
          {/* Admin Portal Link */}
          <div className="text-center mt-4">
            <Link
              to="/admin-login"
              className="inline-flex items-center gap-2 text-sm font-semibold hover:underline transition-all"
              style={{
                
                color: "#904900",
              }}
            ></Link>
          </div>
        </div>
      </motion.div>


    </div>
  );
};

export default SignIn;
