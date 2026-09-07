import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Diamond,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Mail,
  User,
  Lock,
} from "lucide-react";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("form");
  const [verificationCode, setVerificationCode] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    console.log("Signup started");
    setError("");
    setIsLoading(true);

    try {
      console.log("Sending signup request");
      const response = await api.post("/auth/signup", formData);
      console.log("Signup response:", response);

      if (response.data.success) {
        console.log("Navigating to OTP verification");
        setStep("verify");
      } else {
        setError(response.data.message || "Sign up failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.patch("/auth/verify-verification-code", {
        email: formData.email,
        codeProvided: verificationCode,
      });

      if (response.data.success) {
        setStep("success");
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    fontSize: "16px",
    color: "#1f2937",
    background: "rgba(243, 244, 246, 0.5)",
    border: "1px solid rgba(209, 213, 219, 0.5)",
  };

  const labelStyle = {
    fontSize: "12px",
    lineHeight: 1,
    letterSpacing: "0.1em",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#334155",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "#4338CA";
    e.target.style.background = "rgba(255, 255, 255, 0.8)";
    e.target.style.boxShadow = "0 0 0 4px rgba(67, 56, 202, 0.15)";
    e.target.style.outline = "none";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "rgba(209, 213, 219, 0.5)";
    e.target.style.background = "rgba(243, 244, 246, 0.5)";
    e.target.style.boxShadow = "none";
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
              {step === "form" && "Begin your premium journey"}
              {step === "verify" && "Verify your email"}
              {step === "success" && "Welcome aboard!"}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* FORM */}
            {step === "form" && (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignUp}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block ml-1"
                    style={labelStyle}
                  >
                    Username
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: "#767586" }}
                    />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="johndoe"
                      required
                      className="w-full h-12 pl-12 pr-4 rounded-xl transition-all duration-300"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block ml-1"
                    style={labelStyle}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: "#767586" }}
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="hello@swagsync.com"
                      required
                      className="w-full h-12 pl-12 pr-4 rounded-xl transition-all duration-300"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block ml-1"
                    style={labelStyle}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: "#767586" }}
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full h-12 pl-12 pr-12 rounded-xl transition-all duration-300"
                      style={inputStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
                  style={{
                    background:
                      "linear-gradient(135deg, #EA580C 0%, #FD7100 100%)",
                    fontSize: "16px",
                    boxShadow: "0 10px 25px rgba(253, 113, 0, 0.25)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}

            {/* VERIFY */}
            {step === "verify" && (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerify}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "#e1e0ff" }}
                  >
                    <Mail className="w-7 h-7" style={{ color: "#4338CA" }} />
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#464554",
                      lineHeight: 1.5,
                    }}
                  >
                    We sent a 6-digit code to{" "}
                    <span
                      className="font-semibold"
                      style={{ color: "#1b1b23" }}
                    >
                      {formData.email}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="code"
                    className="block ml-1"
                    style={labelStyle}
                  >
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full h-12 px-4 rounded-xl transition-all duration-300 text-center tracking-[0.5em] text-lg font-bold"
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
                  style={{
                    background:
                      "linear-gradient(135deg, #EA580C 0%, #FD7100 100%)",
                    fontSize: "16px",
                    boxShadow: "0 10px 25px rgba(253, 113, 0, 0.25)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Email</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full text-center py-2 transition-colors hover:text-[#4338CA]"
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  Back to sign up
                </button>
              </motion.form>
            )}

            {/* SUCCESS */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring" }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: "#e1e0ff" }}
                >
                  <CheckCircle2
                    className="w-10 h-10"
                    style={{ color: "#4338CA" }}
                  />
                </motion.div>
                <h2
                  className="text-2xl font-bold mb-3"
                  style={{
                    
                    color: "#1b1b23",
                  }}
                >
                  Email Verified!
                </h2>
                <p
                  style={{
                    
                    fontSize: "16px",
                    color: "#464554",
                    lineHeight: 1.5,
                  }}
                >
                  Your account is ready. Redirecting to sign in...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign In Link */}
          {step === "form" && (
            <div className="mt-8 text-center">
              <p
                style={{
                  
                  fontSize: "16px",
                  lineHeight: 1.5,
                  color: "#475569",
                }}
              >
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="font-bold hover:underline transition-all"
                  style={{ color: "#4338CA" }}
                >
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>


    </div>
  );
};

export default SignUp;
