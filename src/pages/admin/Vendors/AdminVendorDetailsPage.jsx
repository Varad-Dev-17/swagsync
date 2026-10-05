import { useState, useEffect, useCallback, useMemo } from "react";
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
  Search,
  Bell,
  Edit2,
  MoreVertical,
  UserCheck,
  Tag,
  X,
  Package,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axiosConfig";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "store", label: "Store Details" },
  { id: "business", label: "Business & Legal" },
  { id: "bank", label: "Bank & Payout" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Orders & Activity" },
];

const AdminVendorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Sensitive Bank Account reveal state
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Modal dialog states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showEditDocsModal, setShowEditDocsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Edit vendor form state
  const [editFormData, setEditFormData] = useState({
    storeName: "",
    fullName: "",
    phone: "",
    storeDescription: "",
  });

  const fetchVendorDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/vendors/${id}`);
      if (res.data.success) {
        setVendor(res.data.vendor);
        setActivity(res.data.activity || null);
        const p = res.data.vendor.vendorProfile || {};
        setEditFormData({
          storeName: p.storeName || "",
          fullName: p.fullName || res.data.vendor.username || "",
          phone: p.phone || res.data.vendor.mobileNo || "",
          storeDescription: p.storeDescription || "",
        });
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

  // 5. UPDATE VENDOR DETAILS
  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/vendors/${id}`, editFormData);
      if (res.data.success) {
        toast.success("Vendor details updated successfully!");
        setShowEditVendorModal(false);
        fetchVendorDetails();
      } else {
        toast.error(res.data.message || "Failed to update vendor");
      }
    } catch (err) {
      console.error("Update vendor error:", err);
      toast.error(err.response?.data?.message || "Failed to update vendor details");
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
  const stores = Array.isArray(profile.stores) && profile.stores.length > 0
    ? profile.stores
    : [
        {
          storeName: profile.storeName || vendor.username || "Primary Store",
          storeDescription: profile.storeDescription,
          phone: profile.phone || vendor.mobileNo,
          addressLine1: address.addressLine1 || "",
          addressLine2: address.addressLine2 || "",
          city: address.city || "",
          state: address.state || "",
          country: address.country || "India",
          pincode: address.pincode || "",
          isDefault: true,
        },
      ];
  const business = profile.businessDetails || {};
  const bank = profile.bankDetails || {};
  const documents = profile.documents || [];
  const status = vendor.vendorStatus || "PENDING";
  const isEmailVerified = vendor.emailVerified || vendor.verified;

  const maskAccount = (num) => {
    if (!num) return "—";
    if (num.length <= 4) return num;
    return "•••••••• " + num.slice(-4);
  };

  const regDateObj = vendor.createdAt ? new Date(vendor.createdAt) : new Date();
  const formattedRegDate = regDateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedRegDateSlash = `${regDateObj.getDate()}/${regDateObj.getMonth() + 1}/${regDateObj.getFullYear()}`;

  const formattedFullAddress = [
    address.addressLine1,
    address.addressLine2,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country || "India",
  ]
    .filter(Boolean)
    .join(", ") || "No address specified";

  const displayDocs = [
    {
      key: "pan",
      name: "PAN Card",
      url: documents.find((d) => d.name?.toLowerCase().includes("pan") || d.key === "pan")?.url || business.panDocumentUrl,
      uploadedAt: documents.find((d) => d.name?.toLowerCase().includes("pan") || d.key === "pan")?.uploadedAt || vendor.createdAt,
    },
    {
      key: "business_proof",
      name: "Business Registration Proof",
      url: documents.find((d) => d.name?.toLowerCase().includes("business") || d.key === "business_proof")?.url || business.businessProofDocumentUrl,
      uploadedAt: documents.find((d) => d.name?.toLowerCase().includes("business") || d.key === "business_proof")?.uploadedAt || vendor.createdAt,
    },
    {
      key: "bank_proof",
      name: "Bank Account Proof",
      url: documents.find((d) => d.name?.toLowerCase().includes("bank") || d.key === "bank_proof")?.url || bank.bankProofDocumentUrl,
      uploadedAt: documents.find((d) => d.name?.toLowerCase().includes("bank") || d.key === "bank_proof")?.uploadedAt || vendor.createdAt,
    },
    {
      key: "gst",
      name: "GST Certificate",
      url: documents.find((d) => d.name?.toLowerCase().includes("gst") || d.key === "gst")?.url || business.gstCertificateUrl,
      uploadedAt: documents.find((d) => d.name?.toLowerCase().includes("gst") || d.key === "gst")?.uploadedAt || vendor.createdAt,
    },
  ];

  const additionalDocs = documents.filter((d) => {
    const n = (d.name || d.key || "").toLowerCase();
    return !n.includes("pan") && !n.includes("business") && !n.includes("bank") && !n.includes("gst");
  });
  const allDocs = [...displayDocs, ...additionalDocs];

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Row with Breadcrumb, Search, and Notification Bell */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Link
            to="/admin/vendors"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#4648d4] transition-colors"
          >
            <ArrowLeft size={14} /> Vendors
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold">{profile.storeName || vendor.username}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-56 sm:w-64 pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] placeholder:text-slate-400 text-slate-800 shadow-2xs"
            />
          </div>
          <button
            type="button"
            className="relative p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-100 text-[#4648d4] font-black text-2xl flex items-center justify-center shrink-0">
              {(profile.storeName || vendor.username || "V").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profile.storeName || "Vendor Store"}
                </h1>
                {/* Status Badge */}
                {status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                )}
                {status === "PENDING" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock size={12} className="text-amber-500" />
                    Pending Approval
                  </span>
                )}
                {status === "SUSPENDED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle size={12} className="text-rose-500" />
                    Suspended
                  </span>
                )}
                {status === "REJECTED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <XCircle size={12} className="text-slate-400" />
                    Rejected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-semibold text-slate-700">{profile.fullName || vendor.username}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono">{vendor.vendorId || vendor._id}</span>
                <span className="text-slate-300">•</span>
                <span>Registered on {formattedRegDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {status === "APPROVED" && (
              <button
                type="button"
                onClick={() => setShowSuspendModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50/70 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <AlertTriangle size={14} className="text-amber-600" /> Suspend Vendor
              </button>
            )}
            {status === "SUSPENDED" && (
              <button
                type="button"
                onClick={() => setShowReactivateModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 size={14} className="text-emerald-600" /> Reactivate Vendor
              </button>
            )}
            {status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  <CheckCircle2 size={14} /> Approve Vendor
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowEditVendorModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Edit2 size={14} className="text-slate-500" /> Edit Vendor
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 rounded-xl text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <MoreVertical size={16} />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleCopy(vendor.vendorId || vendor._id, "Vendor ID");
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Copy size={13} /> Copy Vendor ID
                  </button>
                  <a
                    href={`mailto:${vendor.email}`}
                    onClick={() => setShowMoreMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Mail size={13} /> Email Vendor
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.rejectionReason && (
          <div className="mt-4 p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-800">
            <strong>Rejection Reason:</strong> {profile.rejectionReason}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200/80 -mt-2">
        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 -mb-[1px] cursor-pointer ${
                  isActive
                    ? "text-[#4648d4] border-[#4648d4]"
                    : "text-slate-500 border-transparent hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* 1. VENDOR OVERVIEW CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4648d4] flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Vendor Overview</h2>
                    <p className="text-[11px] text-slate-400">Important vendor details and status information</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700">
                    <span>🇮🇳</span> India
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Approved
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                {/* Full Name */}
                <div className="flex items-start gap-3">
                  <User size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5 font-normal">Full Name</span>
                    <span className="font-semibold text-slate-800">{profile.fullName || vendor.username}</span>
                  </div>
                </div>

                {/* System Username */}
                <div className="flex items-start gap-3">
                  <UserCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5 font-normal">System Username</span>
                    <span className="font-mono text-slate-800">{vendor.username}</span>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5 font-normal">Email Address</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={vendor.email}>
                        {vendor.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(vendor.email, "Email")}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === "Email" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5 font-normal">Phone Number</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-800">
                        {profile.phone || vendor.mobileNo || "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.phone || vendor.mobileNo, "Phone")}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === "Phone" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Verification */}
                <div className="flex items-start gap-3">
                  <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5 font-normal">Email Verification</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700 font-medium">Verified via 6-digit code</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check size={10} className="stroke-[3]" /> Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor ID */}
                <div className="flex items-start gap-3">
                  <Tag size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5 font-normal">Vendor ID</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-800">{vendor.vendorId || vendor._id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(vendor.vendorId || vendor._id, "Vendor ID")}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === "Vendor ID" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. STORE INFORMATION CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4648d4] flex items-center justify-center">
                    <Store size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Store Information</h2>
                    <p className="text-[11px] text-slate-400">Details about the vendor's store</p>
                  </div>
                </div>
                <a
                  href={`/shop?vendor=${vendor._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>View Store</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Store Display Name</span>
                    <span className="font-bold text-slate-900 text-sm">{profile.storeName || "Daily Finds"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-1">Store Phone</span>
                    <span className="font-semibold text-slate-800 text-xs">{profile.phone || vendor.mobileNo || "9779558778"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">Store Description</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-xs">
                    {profile.storeDescription || "No store description provided."}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3">
                    <MapPin size={14} className="text-[#4648d4]" />
                    <span>Registered Store Address</span>
                  </div>

                  <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                    {/* Left Address text */}
                    <div className="flex items-start gap-2.5 max-w-xs">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-slate-700 leading-relaxed font-medium">
                        <div>{address.addressLine1 || "Shop No. 24, GT Road"}</div>
                        {address.addressLine2 && <div>{address.addressLine2}</div>}
                        <div>
                          {address.city || "Mohali"}, {address.state || "Punjab"} {address.pincode || "160055"}
                        </div>
                        <div>{address.country || "India"}</div>
                      </div>
                    </div>

                    {/* Right table/columns */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs border-t md:border-t-0 md:border-l border-slate-200/80 md:pl-6 pt-3 md:pt-0">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Pincode</span>
                        <span className="font-mono font-bold text-slate-800">{address.pincode || "160055"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">State</span>
                        <span className="font-semibold text-slate-800">{address.state || "Punjab"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">City</span>
                        <span className="font-semibold text-slate-800">{address.city || "Mohali"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Country</span>
                        <span className="font-semibold text-slate-800">{address.country || "India"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. BANK & PAYOUT INFORMATION CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Landmark size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Bank & Payout Information</h2>
                    <p className="text-[11px] text-slate-400">Sensitive disbursement details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditBankModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit2 size={12} className="text-slate-500" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Beneficiary / Account Holder</span>
                  <span className="font-bold text-slate-900">{bank.accountHolderName || profile.fullName || "Chahat"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Bank Name</span>
                  <span className="font-semibold text-slate-800">{bank.bankName || "SBI"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      {showAccountNumber ? (bank.accountNumber || "123456789123") : maskAccount(bank.accountNumber || "123456789123")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAccountNumber(!showAccountNumber)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAccountNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">IFSC Code</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{bank.ifscCode || "SBIN0012345"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.ifscCode || "SBIN0012345", "IFSC Code")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedField === "IFSC Code" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* 3. MANUFACTURER PROFILE CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                  <Factory size={18} />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Manufacturer Profile</h2>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {primaryMfg.manufacturerName || profile.storeName || "Daily Finds"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    Default
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block mb-0.5">Manufacturer Address</span>
                  <span className="font-medium text-slate-700 leading-relaxed">
                    {primaryMfg.manufacturerAddress || formattedFullAddress}
                  </span>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Packer</span>
                    <span className="font-semibold text-slate-800">{primaryMfg.packer || profile.storeName || "Daily Finds"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Packer Phone</span>
                    <span className="font-semibold text-slate-800">
                      {primaryMfg.packerPhone || profile.phone || vendor.mobileNo || "9779558778"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px] block">Packer Address</span>
                    <span className="font-medium text-slate-700 leading-relaxed">
                      {primaryMfg.packerAddress || formattedFullAddress}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. BUSINESS & LEGAL ENTITY CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4648d4] flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Business & Legal Entity</h2>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">Business Registered Legal Name</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {business.businessName || "Urban Style Enterprises"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Business Constitution / Type</span>
                    <span className="font-medium text-slate-800">{business.businessType || "Sole Proprietorship"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">GST Number (GSTIN)</span>
                    <span className="font-medium text-slate-800">{business.gstNumber || "Not Provided"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-0.5">PAN Card Number</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{business.panNumber || "ABCDE1234F"}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(business.panNumber || "ABCDE1234F", "PAN Card Number")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedField === "PAN Card Number" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. SUBMITTED BUSINESS DOCUMENTS CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Submitted Business Documents</h2>
                    <p className="text-[11px] text-slate-400">Attached files for compliance verification</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditDocsModal(true)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit2 size={12} className="text-slate-500" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {displayDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50/80 text-[#4648d4] flex items-center justify-center font-bold">
                        <FileText size={15} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 block">{doc.name}</span>
                        <span className="text-[10px] text-slate-400">
                          Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-GB") : formattedRegDateSlash}
                        </span>
                      </div>
                    </div>

                    <a
                      href={doc.url || "#"}
                      target={doc.url ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!doc.url) {
                          e.preventDefault();
                          toast.error("Document file not available");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#4648d4] hover:text-[#4648d4] font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>View Document</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL TABS */}
      {/* 2. STORE DETAILS TAB */}
      {activeTab === "store" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4648d4] flex items-center justify-center">
                  <Store size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Store Profile & Outlets</h2>
                  <p className="text-xs text-slate-400">Customer-facing marketplace storefront and location details</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditVendorModal(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit2 size={13} className="text-slate-500" />
                  <span>Edit Store</span>
                </button>
                <a
                  href={`/shop?vendor=${vendor._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#4648d4] hover:bg-[#3b3db0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>View Public Store</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-slate-400 block mb-1 font-medium">Store Display Name</span>
                <span className="font-bold text-slate-900 text-base">{profile.storeName || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1 font-medium">Store Phone / Support Contact</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm font-mono">{profile.phone || vendor.mobileNo || "—"}</span>
                  {(profile.phone || vendor.mobileNo) && (
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.phone || vendor.mobileNo, "Store Phone")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedField === "Store Phone" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400 block mb-1 font-medium">Store Description</span>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                  {profile.storeDescription || "No store description provided."}
                </div>
              </div>
            </div>
          </div>

          {/* Outlets & Address Locations */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#4648d4]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Registered Outlets & Fulfillment Addresses ({stores.length})
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {stores.map((st, idx) => {
                const fullStAddr = [
                  st.addressLine1,
                  st.addressLine2,
                  [st.city, st.state, st.pincode].filter(Boolean).join(", "),
                  st.country || "India",
                ]
                  .filter(Boolean)
                  .join(", ") || formattedFullAddress;

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{st.storeName || profile.storeName || `Outlet #${idx + 1}`}</span>
                        {st.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            Primary Outlet
                          </span>
                        )}
                        {st.phone && (
                          <span className="text-xs text-slate-500 font-mono">
                            • Phone: {st.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {fullStAddr}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700">
                        <span>🇮🇳</span> {st.country || "India"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. BUSINESS & LEGAL TAB */}
      {activeTab === "business" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Business Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4648d4] flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Business & Tax Details</h2>
                <p className="text-[11px] text-slate-400">Legal entity constitution and compliance registration</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Business Legal Name</span>
                <span className="font-bold text-slate-900 text-sm">{business.businessName || "—"}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block mb-1">Business Type / Constitution</span>
                  <span className="font-semibold text-slate-800">{business.businessType || "Sole Proprietorship"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">GST Number (GSTIN)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{business.gstNumber || "Not Provided"}</span>
                    {business.gstNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopy(business.gstNumber, "GSTIN")}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === "GSTIN" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">PAN Card Number</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">{business.panNumber || "—"}</span>
                  {business.panNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(business.panNumber, "PAN Number")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedField === "PAN Number" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Manufacturer & Packer Profile */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                <Factory size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Manufacturer & Packer Details</h2>
                <p className="text-[11px] text-slate-400">Packaging and legal origin compliance attributes</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block mb-0.5">Manufacturer Name</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {primaryMfg.manufacturerName || profile.storeName || "—"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  🇮🇳 {primaryMfg.countryOfOrigin || "India"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Manufacturing Facility Address</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 font-medium leading-relaxed">
                  {primaryMfg.manufacturerAddress || formattedFullAddress}
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 text-[11px] block">Packer Entity Name</span>
                  <span className="font-semibold text-slate-800">{primaryMfg.packer || profile.storeName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Packer Contact Phone</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-800">
                      {primaryMfg.packerPhone || profile.phone || vendor.mobileNo || "—"}
                    </span>
                    {(primaryMfg.packerPhone || profile.phone || vendor.mobileNo) && (
                      <button
                        type="button"
                        onClick={() => handleCopy(primaryMfg.packerPhone || profile.phone || vendor.mobileNo, "Packer Phone")}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === "Packer Phone" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[11px] block">Packer Address</span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 font-medium leading-relaxed">
                    {primaryMfg.packerAddress || formattedFullAddress}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BANK & PAYOUT TAB */}
      {activeTab === "bank" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Landmark size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bank & Settlement Account</h2>
                  <p className="text-xs text-slate-400">Account used for automated marketplace revenue disbursements</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBankModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Edit2 size={12} /> Edit Bank Info
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Beneficiary / Account Holder</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 text-sm">{bank.accountHolderName || profile.fullName || "—"}</span>
                  {(bank.accountHolderName || profile.fullName) && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.accountHolderName || profile.fullName, "Account Holder")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedField === "Account Holder" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Bank Name</span>
                <span className="font-semibold text-slate-800 text-sm">{bank.bankName || "—"}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {showAccountNumber ? (bank.accountNumber || "—") : maskAccount(bank.accountNumber)}
                  </span>
                  {bank.accountNumber && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showAccountNumber ? "Hide Account Number" : "Show Account Number"}
                      >
                        {showAccountNumber ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(bank.accountNumber, "Account Number")}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {copiedField === "Account Number" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">IFSC Code</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 text-sm">{bank.ifscCode || "—"}</span>
                  {bank.ifscCode && (
                    <button
                      type="button"
                      onClick={() => handleCopy(bank.ifscCode, "IFSC Code")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {copiedField === "IFSC Code" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Disbursement Settlement Status
            </h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl font-semibold">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>Verified & Ready for Direct Bank Settlement</span>
              </div>
              <p className="leading-relaxed">
                Marketplace sales disbursements are routed automatically via IMPS/NEFT according to the platform settlement cycle.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                To update bank details, please contact platform administrators or submit updated bank proof.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Compliance & Verification Documents</h2>
                <p className="text-xs text-slate-400">Attached identity, tax, and banking certificates for compliance</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditDocsModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Edit2 size={12} />
              <span>Edit Documents</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {allDocs.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-[#4648d4] flex items-center justify-center font-bold">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{doc.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">
                        Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-GB") : formattedRegDateSlash}
                      </span>
                      {doc.url ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={10} className="stroke-[3]" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <a
                  href={doc.url || "#"}
                  target={doc.url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!doc.url) {
                      e.preventDefault();
                      toast.error("Document file not available");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors ${
                    doc.url
                      ? "bg-white border-slate-200 hover:border-[#4648d4] hover:text-[#4648d4] text-slate-700 cursor-pointer"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>{doc.url ? "View Document" : "Not Uploaded"}</span>
                  {doc.url && <ExternalLink size={12} />}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ORDERS & ACTIVITY TAB */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-slate-400 text-xs font-medium block mb-1">Total Orders</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {activity?.totalOrders ?? 0}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-slate-400 text-xs font-medium block mb-1">Total Revenue</span>
              <span className="text-2xl font-black text-[#4648d4] tracking-tight">
                ₹{(activity?.totalRevenue ?? 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-slate-400 text-xs font-medium block mb-1">Items Sold</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {activity?.itemsSold ?? 0}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <span className="text-slate-400 text-xs font-medium block mb-1">Avg. Order Value</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹
                {activity?.totalOrders
                  ? Math.round((activity.totalRevenue || 0) / activity.totalOrders).toLocaleString("en-IN")
                  : 0}
              </span>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Orders for Vendor</h3>
                <p className="text-[11px] text-slate-400">Latest orders placed containing items from this vendor</p>
              </div>
              <Link
                to={`/admin/orders?vendor=${vendor._id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4648d4] hover:bg-[#3b3db0] text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
              >
                <span>View All In Orders Page</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {activity?.recentOrders && activity.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Vendor Subtotal</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activity.recentOrders.map((ord) => {
                      const ordDate = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-GB") : "—";
                      const stUpper = (ord.orderStatus || "PENDING").toUpperCase();
                      const isDelivered = stUpper === "DELIVERED";
                      const isCancelled = stUpper === "CANCELLED";

                      return (
                        <tr key={ord._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {ord.orderId || ord._id}
                          </td>
                          <td className="py-3 px-4 text-slate-500">{ordDate}</td>
                          <td className="py-3 px-4 font-medium">{ord.itemCount} item(s)</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{(ord.vendorTotal || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isDelivered
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isCancelled
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {stUpper}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/admin/orders/${ord._id}`}
                              className="text-[#4648d4] hover:underline font-semibold"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Orders Recorded Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Customer orders containing products from this vendor will automatically reflect here in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* EDIT VENDOR MODAL */}
      {showEditVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4648d4] flex items-center justify-center">
                  <Edit2 size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Edit Vendor Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditVendorModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateVendor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Store Display Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.storeName}
                  onChange={(e) => setEditFormData({ ...editFormData, storeName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Store Description</label>
                <textarea
                  rows={3}
                  value={editFormData.storeDescription}
                  onChange={(e) => setEditFormData({ ...editFormData, storeDescription: e.target.value })}
                  placeholder="Tell customers about this store..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditVendorModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-[#4648d4] hover:bg-[#3b3db0] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BANK MODAL */}
      {showEditBankModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Landmark size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Edit Bank Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Beneficiary / Account Holder</span>
                <span className="font-bold text-slate-900">{bank.accountHolderName || profile.fullName || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Bank Name</span>
                <span className="font-semibold text-slate-800">{bank.bankName || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Account Number</span>
                <span className="font-mono font-bold text-slate-900">{bank.accountNumber || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">IFSC Code</span>
                <span className="font-mono font-bold text-slate-900">{bank.ifscCode || "—"}</span>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              Bank disbursements are locked for compliance. To request bank account updates, please ask the vendor to submit a support ticket with bank proof.
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEditBankModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DOCS MODAL */}
      {showEditDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Compliance Documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditDocsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Official documents submitted during vendor registration:
            </p>

            <div className="space-y-2 text-xs">
              {displayDocs.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="font-semibold text-slate-800">{doc.name}</span>
                  <a
                    href={doc.url || "#"}
                    target={doc.url ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!doc.url) {
                        e.preventDefault();
                        toast.error("Document not uploaded");
                      }
                    }}
                    className="text-[#4648d4] hover:underline font-bold text-xs inline-flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEditDocsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorDetailsPage;
