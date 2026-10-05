import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const VendorForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [providedCode, setProvidedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("email"); // "email" | "code" | "success"
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { sendVendorForgotPasswordCode, verifyVendorForgotPasswordCode } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const result = await sendVendorForgotPasswordCode(email.trim().toLowerCase());

    if (result.success) {
      setSuccess(result.message || "Reset code sent to your email!");
      if (result.code) {
        setProvidedCode(result.code);
      }
      setStep("code");
    } else {
      setError(result.message || "Failed to send reset code.");
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    const result = await sendVendorForgotPasswordCode(email.trim().toLowerCase());

    if (result.success) {
      toast.success("A new code has been sent!");
      if (result.code) {
        setProvidedCode(result.code);
      }
    } else {
      setError(result.message || "Failed to resend code.");
    }

    setResending(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const result = await verifyVendorForgotPasswordCode(
      email.trim().toLowerCase(),
      providedCode.trim(),
      newPassword
    );

    if (result.success) {
      setSuccess("Password reset successfully! Redirecting to login...");
      setStep("success");
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/vendor/login"), 2500);
    } else {
      setError(result.message || "Failed to reset password.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-950"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4648d4]/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-[#4648d4] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[#4648d4]/30">
                S
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                SwagSync
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4648d4]/10 text-[#4648d4] text-xs font-bold tracking-wide uppercase mb-2">
              <Store size={13} />
              Vendor Portal
            </div>
            <h1 className="text-xl font-bold text-slate-900">Reset Password</h1>
            <p className="text-xs text-slate-500 mt-1">
              {step === "email" && "Enter your registered vendor email to receive a reset code."}
              {step === "code" && `Enter the reset code sent to ${email}`}
              {step === "success" && "Your password has been reset successfully."}
            </p>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
              >
                <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs font-medium text-red-600 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STEP 1: Enter Email */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Vendor Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@company.com"
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-3 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
                  />
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#4648d4] hover:bg-[#3730a3] text-white font-bold text-sm shadow-md shadow-[#4648d4]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending Code...
                  </>
                ) : (
                  <>
                    Send Reset Code <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === "code" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  6-Digit Reset Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={providedCode}
                    onChange={(e) => setProvidedCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full text-sm tracking-widest text-center font-bold pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-3 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
                  />
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-3 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
                  />
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-3 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
                  />
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-[#4648d4] hover:underline font-semibold disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#4648d4] hover:bg-[#3730a3] text-white font-bold text-sm shadow-md shadow-[#4648d4]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    Update Password <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Success */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Password Updated!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You can now log in to the Vendor Portal with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/vendor/login")}
                className="w-full py-3 rounded-xl bg-[#4648d4] hover:bg-[#3730a3] text-white font-bold text-sm shadow-md shadow-[#4648d4]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Go to Vendor Login <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <Link
              to="/vendor/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#4648d4] transition-colors"
            >
              <ArrowLeft size={14} /> Back to Vendor Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorForgotPassword;
