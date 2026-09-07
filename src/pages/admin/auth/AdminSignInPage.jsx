import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { Eye, EyeOff, Shield, ArrowRight, Loader2 } from "lucide-react";

const AdminSignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await adminLogin(email, password);

      if (result.success) {
        navigate("/admin/dashboard");
      } else {
        setError(result.message || "Invalid admin credentials");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseStyle = {
    
    fontSize: "16px",
    color: "#1b1b23",
    background: "rgba(255, 255, 255, 0.6)",
    border: "1px solid rgba(30, 41, 59, 0.1)",
  };

  const labelStyle = {
    
    fontSize: "12px",
    lineHeight: 1,
    letterSpacing: "0.1em",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#464554",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "#904900";
    e.target.style.background = "rgba(255, 255, 255, 0.9)";
    e.target.style.boxShadow = "0 0 0 4px rgba(144, 73, 0, 0.1)";
    e.target.style.outline = "none";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "rgba(30, 41, 59, 0.1)";
    e.target.style.background = "rgba(255, 255, 255, 0.6)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#fcf8ff]">
      {/* Ambient Background Blobs - Orange tint for admin */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div
          className="absolute w-150 h-150 rounded-full opacity-15 blur-[80px]"
          style={{
            background: "rgba(181, 93, 0, 0.15)",
            top: "-100px",
            left: "-100px",
            animation: "move 20s infinite alternate",
          }}
        />
        <div
          className="absolute w-150 h-150 rounded-full opacity-10 blur-[80px]"
          style={{
            background: "rgba(144, 73, 0, 0.1)",
            bottom: "-200px",
            right: "-100px",
            animation: "move 20s infinite alternate-reverse",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-120"
      >
        {/* Glass Card */}
        <div
          className="rounded-4xl p-8 md:p-12 shadow-sm"
          style={{
            background: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #904900 0%, #b55d00 100%)",
                boxShadow: "0 10px 40px rgba(144, 73, 0, 0.2)",
              }}
            >
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-[32px] font-bold tracking-tight"
              style={{
                
                color: "#904900",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              SwagSync
            </h1>
            <p
              className="mt-2 text-center"
              style={{
                
                fontSize: "16px",
                lineHeight: 1.5,
                color: "#464554",
              }}
            >
              Admin Portal Access
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block ml-1" style={labelStyle}>
                Admin Email
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
                  placeholder="varadmule17@gmail.com"
                  required
                  className="w-full h-14 pl-12 pr-4 rounded-xl transition-all duration-300"
                  style={inputBaseStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block ml-1"
                style={labelStyle}
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
                  placeholder="Enter admin password"
                  required
                  className="w-full h-14 pl-12 pr-12 rounded-xl transition-all duration-300"
                  style={inputBaseStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-[#904900]"
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

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
              style={{
                background: "linear-gradient(135deg, #904900 0%, #b55d00 100%)",
                
                fontSize: "16px",
                boxShadow: "0 10px 40px rgba(144, 73, 0, 0.25)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Admin Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Back to User Login */}
          <div className="mt-8 text-center">
            <p
              style={{
                
                fontSize: "16px",
                lineHeight: 1.5,
                color: "#464554",
              }}
            >
              Not an admin?{" "}
              <Link
                to="/signin"
                className="font-bold hover:underline transition-all"
                style={{ color: "#4648d4" }}
              >
                User Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes move {
          from { transform: translate(-10%, -10%); }
          to { transform: translate(20%, 20%); }
        }
      `}</style>
    </div>
  );
};

export default AdminSignInPage;
