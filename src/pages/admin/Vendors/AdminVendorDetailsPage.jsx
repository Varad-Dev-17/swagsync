import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  MapPin,
  Landmark,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCheck,
  FileCheck,
  Factory,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";

const AdminVendorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Sensitive Bank Account reveal state
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Modal dialog states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchVendorDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/vendors/${id}`);
      if (res.data.success) {
        setVendor(res.data.vendor);
      } else {
        toast.error(res.data.message || "Failed to load vendor details");
      }
    } catch (err) {
      console.error("Error loading vendor details:", err);
      toast.error(err.response?.data?.message || "Failed to fetch vendor details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVendorDetails();
  }, [fetchVendorDetails]);

  // Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 1. APPROVE VENDOR ACTION
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/vendors/${id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message || "Vendor approved successfully!");
        setShowApproveModal(false);
        fetchVendorDetails();
      }
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err.response?.data?.message || "Failed to approve vendor");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. REJECT VENDOR ACTION
  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/vendors/${id}/reject`, {
        reason: rejectReason.trim(),
      });
      if (res.data.success) {
        toast.success("Vendor application rejected.");
        setShowRejectModal(false);
        fetchVendorDetails();
      }
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(err.response?.data?.message || "Failed to reject vendor");
    } finally {
      setActionLoading(false);
    }
  };

  // 3. SUSPEND VENDOR ACTION
  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/vendors/${id}/suspend`);
      if (res.data.success) {
        toast.success("Vendor suspended successfully.");
        setShowSuspendModal(false);
        fetchVendorDetails();
      }
    } catch (err) {
      console.error("Suspend error:", err);
      toast.error(err.response?.data?.message || "Failed to suspend vendor");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. REACTIVATE VENDOR ACTION
  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/vendors/${id}/reactivate`);
      if (res.data.success) {
        toast.success("Vendor reactivated successfully!");
        setShowReactivateModal(false);
        fetchVendorDetails();
      }
    } catch (err) {
      console.error("Reactivate error:", err);
      toast.error(err.response?.data?.message || "Failed to reactivate vendor");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="inline-flex items-center gap-2.5 text-sm text-slate-500 font-medium">
          <Loader2 size={20} className="animate-spin text-[#4648d4]" />
          <span>Loading vendor details...</span>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle size={40} className="text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Vendor Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested vendor account could not be found.
        </p>
        <Link
          to="/admin/vendors"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#4648d4] text-white text-xs font-semibold rounded-xl"
        >
          <ArrowLeft size={14} /> Back to Vendors List
        </Link>
      </div>
    );
  }

  const profile = vendor.vendorProfile || {};
  const address = profile.storeAddress || {};
  const mfg = profile.manufacturerDetails || {};
  const manufacturers = Array.isArray(profile.manufacturers) ? profile.manufacturers : [];
  const primaryMfg = manufacturers.find((m) => m.isDefault) || manufacturers[0] || mfg;
  const business = profile.businessDetails || {};
  const bank = profile.bankDetails || {};
  const documents = profile.documents || [];
  const status = vendor.vendorStatus || "PENDING";
  const isEmailVerified = vendor.emailVerified || vendor.verified;

  const maskAccount = (num) => {
    if (!num) return "—";
    if (num.length <= 4) return num;
    return "•".repeat(Math.max(4, num.length - 4)) + " " + num.slice(-4);
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/vendors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#4648d4] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Vendors List
        </Link>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#4648d4] font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
              {(profile.storeName || vendor.username || "V").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profile.storeName || "Vendor Store"}
                </h1>
                {/* Status Badge */}
                {status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Approved
                  </span>
                )}
                {status === "PENDING" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock size={12} className="text-amber-500" />
                    Pending Approval
                  </span>
                )}
                {status === "SUSPENDED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle size={12} className="text-rose-500" />
                    Suspended
                  </span>
                )}
                {status === "REJECTED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <XCircle size={12} className="text-slate-400" />
                    Rejected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-semibold text-slate-700">{profile.fullName || vendor.username}</span>
                <span>•</span>
                <span className="font-mono">{vendor.vendorId || vendor._id}</span>
                <span>•</span>
                <span>Registered on {new Date(vendor.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons depending on Status (Requirement 11) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {status === "PENDING" && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  <CheckCircle2 size={14} /> Approve Vendor
                </button>
              </>
            )}

            {status === "APPROVED" && (
              <button
                onClick={() => setShowSuspendModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <AlertTriangle size={14} /> Suspend Vendor
              </button>
            )}

            {status === "SUSPENDED" && (
              <button
                onClick={() => setShowReactivateModal(true)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
              >
                <CheckCircle2 size={14} /> Reactivate Vendor
              </button>
            )}

            {status === "REJECTED" && (
              <div className="text-xs text-slate-500 font-medium px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                Application Rejected
              </div>
            )}
          </div>
        </div>

        {profile.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-800">
            <strong>Rejection Reason:</strong> {profile.rejectionReason}
          </div>
        )}
      </div>

      {/* Grid: Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. PERSONAL INFORMATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4648d4] flex items-center justify-center">
              <User size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Full Name</span>
              <span className="font-semibold text-slate-800">{profile.fullName || vendor.username}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">System Username</span>
              <span className="font-mono text-slate-700">{vendor.username}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Email Address</span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800">{vendor.email}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(vendor.email, "Email")}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {copiedField === "Email" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Phone Number</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-slate-800">
                  {profile.phone || vendor.mobileNo || "—"}
                </span>
                {profile.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.phone, "Phone")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedField === "Phone" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block mb-0.5">Email Verification Status</span>
                <span className="text-slate-700 font-medium">
                  {isEmailVerified ? "Email ownership verified via 6-digit code" : "Not verified"}
                </span>
              </div>
              {isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <CheckCircle2 size={13} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <Clock size={13} /> Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. MANUFACTURER DETAILS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                <Factory size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Manufacturer Profiles</h2>
                <span className="text-[11px] text-slate-400">
                  {manufacturers.length} registered profile{manufacturers.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(manufacturers.length > 0 ? manufacturers : [primaryMfg]).map((m, idx) => (
              <div
                key={m._id || idx}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {m.manufacturerName || profile.storeName || "Primary Manufacturer"}
                    </span>
                    {m.isDefault && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                    {m.countryOfOrigin || "India"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Manufacturer Address</span>
                  <span className="font-medium text-slate-800 leading-relaxed">
                    {m.manufacturerAddress || "—"}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Packer:</span>
                    <span className="font-semibold text-slate-800">{m.packer || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Packer Phone:</span>
                    <span className="font-semibold text-slate-800">{m.packerPhone || "—"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[11px] block">Packer Address:</span>
                    <span className="font-medium text-slate-700 leading-relaxed">
                      {m.packerAddress || "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. STORE INFORMATION & REGISTERED ADDRESS (MERGED) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Store Information</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block mb-0.5">Store Display Name</span>
                <span className="font-bold text-slate-900 text-sm">{profile.storeName || "—"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Store Phone / Contact</span>
                <span className="font-semibold text-slate-800">{profile.phone || vendor.mobileNo || "—"}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Store Description</span>
              <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {profile.storeDescription || "No store description provided."}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Registered Store & Warehouse Address
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <span className="text-slate-400 block mb-0.5">Address Line 1</span>
                  <span className="font-semibold text-slate-800">{address.addressLine1 || "—"}</span>
                </div>

                {address.addressLine2 && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block mb-0.5">Address Line 2</span>
                    <span className="text-slate-700">{address.addressLine2}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block mb-0.5">City</span>
                  <span className="font-semibold text-slate-800">{address.city || "—"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">State</span>
                  <span className="font-semibold text-slate-800">{address.state || "—"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Pincode / Postal Code</span>
                  <span className="font-mono font-bold text-slate-900">{address.pincode || "—"}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Country</span>
                  <span className="text-slate-700">{address.country || "India"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BUSINESS / LEGAL DETAILS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Business & Legal Entity</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2">
              <span className="text-slate-400 block mb-0.5">Business Registered Legal Name</span>
              <span className="font-bold text-slate-900">{business.businessName || "—"}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Business Constitution / Type</span>
              <span className="font-medium text-slate-800">{business.businessType || "—"}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">GST Number (GSTIN)</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{business.gstNumber || "Not Provided"}</span>
                {business.gstNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopy(business.gstNumber, "GSTIN")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedField === "GSTIN" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">PAN Card Number</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{business.panNumber || "—"}</span>
                {business.panNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopy(business.panNumber, "PAN")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedField === "PAN" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. BANK & PAYOUT INFORMATION (With Sensitive Field Protection) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Landmark size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bank & Payout Information</h2>
              <p className="text-[11px] text-slate-400">Sensitive disbursement details</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Beneficiary / Account Holder</span>
              <span className="font-bold text-slate-900">{bank.accountHolderName || "—"}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Bank Name</span>
              <span className="font-semibold text-slate-800">{bank.bankName || "—"}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">
                  {showAccountNumber ? bank.accountNumber : maskAccount(bank.accountNumber)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={showAccountNumber ? "Hide Account Number" : "Reveal Account Number"}
                >
                  {showAccountNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {showAccountNumber && bank.accountNumber && (
                  <button
                    type="button"
                    onClick={() => handleCopy(bank.accountNumber, "Account Number")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  >
                    {copiedField === "Account Number" ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">IFSC Code</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{bank.ifscCode || "—"}</span>
                {bank.ifscCode && (
                  <button
                    type="button"
                    onClick={() => handleCopy(bank.ifscCode, "IFSC")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {copiedField === "IFSC" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 6. BUSINESS DOCUMENTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Submitted Business Documents</h2>
              <p className="text-[11px] text-slate-400">Attached files for compliance verification</p>
            </div>
          </div>

          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 italic">No business documents uploaded.</p>
          ) : (
            <div className="space-y-2.5">
              {documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#4648d4] font-bold">
                      <FileCheck size={16} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{doc.name}</span>
                      <span className="text-[10px] text-slate-400">
                        Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "During Registration"}
                      </span>
                    </div>
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#4648d4] hover:text-[#4648d4] font-semibold text-slate-700 shadow-2xs transition-colors"
                  >
                    <span>View Document</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Approve Vendor Account?
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to approve{" "}
              <strong className="text-slate-900">{profile.storeName || vendor.username}</strong>?
              This will grant vendor portal access and send an official approval email with the login URL.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowApproveModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <XCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Reject Vendor Application
                </h3>
                <p className="text-xs text-slate-500">Decline seller registration</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              The vendor will be marked as REJECTED and will not be able to log in. You may optionally provide a reason to include in the notification email:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete GST documentation, unverified PAN details..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all outline-hidden text-slate-800"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/20 transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Suspend Vendor Account?
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to suspend{" "}
              <strong className="text-slate-900">{profile.storeName || vendor.username}</strong>?
              The vendor will immediately lose access to all vendor portal APIs and functionality.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowSuspendModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSuspend}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/20 transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REACTIVATE MODAL */}
      {showReactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Reactivate Vendor Account?
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will restore vendor access for{" "}
              <strong className="text-slate-900">{profile.storeName || vendor.username}</strong>{" "}
              and allow them to log into the vendor portal again.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowReactivateModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReactivate}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-colors flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm Reactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorDetailsPage;
