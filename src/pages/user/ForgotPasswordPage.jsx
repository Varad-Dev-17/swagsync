import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, Loader2, Mail, KeyRound, Eye, EyeOff } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [providedCode, setProvidedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("email");
  const [isLoading, setIsLoading] = useState(false);

  const { sendForgotPasswordCode, verifyForgotPasswordCode } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const result = await sendForgotPasswordCode(email);

    if (result.success) {
      setSuccess(result.message || "Verification code sent to your email!");
      if (result.code) {
        setProvidedCode(result.code);
      }
      setStep("code");
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const result = await verifyForgotPasswordCode(
      email,
      providedCode,
      newPassword
    );

    if (result.success) {
      setSuccess("Password reset successfully! Redirecting to sign in...");
      setStep("success");
      setTimeout(() => navigate("/signin"), 2000);
    } else {
      setError(result.message);
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-120"
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
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #EA580C 0%, #FD7100 100%)",
                boxShadow: "0 10px 40px rgba(253, 113, 0, 0.2)",
              }}
            >
              {step === "success" ? (
                <Mail className="w-8 h-8 text-white" />
              ) : (
                <KeyRound className="w-8 h-8 text-white" />
              )}
            </div>
            <h1
              className="text-[32px] font-bold tracking-tight"
              style={{

                color: "#4338CA",
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
                color: "#475569",
              }}
            >
              {step === "email"
                ? "Forgot your password? We'll send you a reset code."
                : step === "code"
                  ? "Enter the verification code and your new password."
                  : "Password reset successfully!"}
            </p>
          </div>

          {/* Error */}
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

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl text-center"
              style={{
                background: "#d4edda",
                color: "#155724",

                fontSize: "14px",
              }}
            >
              {success}
            </motion.div>
          )}

          {/* Step 1: Email + Send Code */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div className="space-y-2">
                <label
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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@swagsync.com"
                    required
                    className="w-full h-12 pl-12 pr-4 rounded-xl transition-all duration-300"
                    style={{

                      fontSize: "16px",
                      color: "#1b1b23",
                      background: "rgba(255, 255, 255, 0.75)",
                      border: "1px solid rgba(30, 41, 59, 0.2)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4648d4";
                      e.target.style.background = "rgba(255, 255, 255, 0.95)";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(70, 72, 212, 0.15)";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(30, 41, 59, 0.2)";
                      e.target.style.background = "rgba(255, 255, 255, 0.75)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70"
                style={{
                  background:
                    "linear-gradient(135deg, #4648d4 0%, #6b38d4 100%)",

                  fontSize: "16px",
                  boxShadow: "0 10px 40px rgba(70, 72, 212, 0.25)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Code</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Step 2: Code + New Password */}
          {step === "code" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Email (read-only, auto-filled) */}
              <div className="space-y-2">
                <label
                  className="block ml-1"
                  style={{

                    fontSize: "12px",
                    lineHeight: 1,
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "#464554",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full h-12 px-4 rounded-xl transition-all duration-300 cursor-not-allowed"
                  style={{

                    fontSize: "16px",
                    color: "#64748b",
                    background: "rgba(255, 255, 255, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>

              {/* Verification Code */}
              <div className="space-y-2">
                <label
                  className="block ml-1"
                  style={{

                    fontSize: "12px",
                    lineHeight: 1,
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "#464554",
                  }}
                >
                  Verification Code
                </label>
                <input
                  type="text"
                  value={providedCode}
                  onChange={(e) => setProvidedCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className="w-full h-12 px-4 rounded-xl transition-all duration-300 text-center tracking-[0.5em] text-lg font-bold"
                  style={{

                    fontSize: "16px",
                    color: "#1f2937",
                    background: "rgba(255, 255, 255, 0.95)",
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

              {/* New Password */}
              <div className="space-y-2">
                <label
                  className="block ml-1"
                  style={{

                    fontSize: "12px",
                    lineHeight: 1,
                    letterSpacing: "0.1em",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: "#464554",
                  }}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="w-full h-12 pl-4 pr-12 rounded-xl transition-all duration-300"
                    style={{

                      fontSize: "16px",
                      color: "#1f2937",
                      background: "rgba(255, 255, 255, 0.45)",
                      border: "1px solid rgba(255, 255, 255, 0.5)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#4338CA";
                      e.target.style.background = "rgba(255, 255, 255, 0.65)";
                      e.target.style.boxShadow =
                        "0 0 0 4px rgba(67, 56, 202, 0.15)";
                      e.target.style.outline = "none";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.5)";
                      e.target.style.background = "rgba(255, 255, 255, 0.45)";
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
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Step 3: Success - Auto redirect */}
          {step === "success" && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: "#d4edda" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#155724" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p
                className="text-lg font-semibold mb-2"
                style={{

                  color: "#155724",
                }}
              >
                Password Reset Successful!
              </p>
              <p
                style={{

                  color: "#475569",
                }}
              >
                Redirecting to sign in page...
              </p>
            </div>
          )}

          {/* Back to Sign In */}
          {step !== "success" && (
            <div className="mt-8 text-center">
              <Link
                to="/signin"
                className="font-bold hover:underline transition-all"
                style={{
                  color: "#4338CA",

                }}
              >
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>


    </div>
  );
};

export default ForgotPasswordPage;
