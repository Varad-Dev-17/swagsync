import { useAuth } from "../../context/AuthContext";
import { CheckCircle2, ShieldCheck, Sparkles, LogOut } from "lucide-react";

const VendorPortalPlaceholder = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4648d4] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">SwagSync</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Vendor Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-600 hidden sm:inline">
              Logged in as <strong className="text-slate-900">{user?.storeName || user?.username}</strong>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16 text-center my-auto">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldCheck size={44} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">
          <CheckCircle2 size={14} /> Account Status: Approved
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome to SwagSync, {user?.storeName || user?.username}!
        </h1>

        <p className="text-slate-600 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
          Your vendor account has been verified and officially approved by SwagSync Administration.
        </p>

        <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-left max-w-xl mx-auto space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Credentials Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Vendor ID</span>
              <span className="font-mono font-bold text-slate-800">{user?.vendorId || "VEND-Active"}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Store Name</span>
              <span className="font-semibold text-slate-800">{user?.storeName || user?.username}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Registered Email</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Role & Status</span>
              <span className="font-bold text-emerald-600">Vendor (Approved)</span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 max-w-xl mx-auto flex items-start gap-3 text-left">
          <Sparkles size={18} className="text-[#4648d4] shrink-0 mt-0.5" />
          <div>
            <strong>Phase 1 Implementation Complete!</strong>
            <p className="text-indigo-800 mt-0.5">
              Vendor registration, email verification, and admin approval workflows are active. Products, Catalog, Inventory, and Order fulfillment dashboard will be enabled in subsequent phases.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} SwagSync Merchant Services. All rights reserved.
      </footer>
    </div>
  );
};

export default VendorPortalPlaceholder;
