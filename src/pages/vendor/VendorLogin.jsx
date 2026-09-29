import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

const VendorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [vendorStatusError, setVendorStatusError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { vendorLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/vendor/portal";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVendorStatusError(null);
    setIsLoading(true);

    try {
      const result = await vendorLogin(email.trim().toLowerCase(), password);

      if (result.success) {
        toast.success("Vendor login successful!");
        navigate(from, { replace: true });
      } else {
        if (result.vendorStatus) {
          setVendorStatusError({
            status: result.vendorStatus,
            message: result.message,
          });
        } else {
          setError(result.message || "Invalid vendor credentials.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 relative overflow-hidden bg-cover bg-no-repeat"
      style={{
        backgroundImage: 'url("/authentication_bg/auth_bg.png")',
        backgroundPosition: "center",
      }}
    >
      {/* Light Overlay for Contrast */}
      <div className="absolute inset-0 bg-white/40 md:bg-white/20 backdrop-blur-xs z-0 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10 my-8"
      >
        <div
          className="rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/60"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-6">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#4648d4] text-white flex items-center justify-center font-bold text-xl shadow-md shadow-[#4648d4]/30">
                S
              </div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">SwagSync</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4648d4] text-xs font-bold uppercase tracking-wider mb-2">
              <Store size={12} /> Vendor Portal
            </div>
            <p className="text-center text-xs text-slate-500 max-w-xs">
              Access your merchant account and manage your store.
            </p>
          </div>

          {/* Status Alert for PENDING, SUSPENDED, REJECTED */}
          <AnimatePresence>
            {vendorStatusError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-5 p-4 rounded-xl text-xs leading-relaxed border ${
                  vendorStatusError.status === "PENDING"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : vendorStatusError.status === "SUSPENDED"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-slate-100 border-slate-300 text-slate-800"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {vendorStatusError.status === "PENDING" ? (
                    <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-bold text-[13px] mb-0.5">
                      {vendorStatusError.status === "PENDING"
                        ? "Account Pending Approval"
                        : vendorStatusError.status === "SUSPENDED"
                        ? "Account Suspended"
                        : "Application Rejected"}
                    </strong>
                    <p>{vendorStatusError.message}</p>
                    {vendorStatusError.status === "PENDING" && (
                      <p className="mt-1 text-[11px] text-amber-700">
                        Our compliance team is verifying your registration. You will receive an approval email once activated.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registered Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-3 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#4648d4] focus:ring-3 focus:ring-[#4648d4]/10 transition-all outline-hidden text-slate-800"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#4648d4] hover:bg-[#3730a3] text-white font-bold text-sm shadow-md shadow-[#4648d4]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Log In to Vendor Portal <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link to Register */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Want to become a seller on SwagSync?{" "}
              <Link
                to="/vendor/register"
                className="font-bold text-[#4648d4] hover:underline"
              >
                Register as Vendor
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorLogin;
