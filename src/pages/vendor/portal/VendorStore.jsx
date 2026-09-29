import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  Store,
  MapPin,
  Save,
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Globe,
  FileText,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const VendorStore = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "address"

  const [vendorData, setVendorData] = useState({
    vendorId: "",
    username: "",
    email: "",
    mobileNo: "",
    vendorStatus: "",
  });

  const [formData, setFormData] = useState({
    storeName: "",
    storeDescription: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  });

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendor/portal/store");
      if (res.data.success) {
        const { vendorId, username, email, mobileNo, vendorStatus, vendorProfile } = res.data.data;
        setVendorData({
          vendorId,
          username,
          email,
          mobileNo,
          vendorStatus,
        });

        const storeAddress = vendorProfile?.storeAddress || {};
        setFormData({
          storeName: vendorProfile?.storeName || username || "",
          storeDescription: vendorProfile?.storeDescription || "",
          phone: vendorProfile?.phone || mobileNo || "",
          addressLine1: storeAddress.addressLine1 || "",
          addressLine2: storeAddress.addressLine2 || "",
          city: storeAddress.city || "",
          state: storeAddress.state || "",
          country: storeAddress.country || "India",
          pincode: storeAddress.pincode || "",
        });
      }
    } catch (error) {
      console.error("Fetch store error:", error);
      toast.error(error.response?.data?.message || "Failed to load store information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/vendor/portal/store", formData);
      if (res.data.success) {
        toast.success(res.data.message || "Store details updated successfully!");
        fetchStoreData();
      }
    } catch (error) {
      console.error("Update store error:", error);
      toast.error(error.response?.data?.message || "Failed to update store details");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading store profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="text-[#fe4a03]" size={24} /> Store Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your public store presence, customer contact information, and fulfillment address.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            ID: {vendorData.vendorId}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={14} /> Approved
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "info"
              ? "border-[#fe4a03] text-[#fe4a03]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building size={16} /> Store Information
        </button>
        <button
          onClick={() => setActiveTab("address")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "address"
              ? "border-[#fe4a03] text-[#fe4a03]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin size={16} /> Store & Warehouse Address
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: Store Information */}
        {activeTab === "info" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
              Basic Store Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Acme Lifestyle Store"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Displayed to buyers on product pages and brand listings.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Business Phone / Support Contact
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Store Description / Tagline
                </label>
                <textarea
                  name="storeDescription"
                  value={formData.storeDescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Tell customers about your brand, product quality, and specialties..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>
            </div>

            {/* Read-Only Account Security Information */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Security & Account Credentials (Read-Only)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Registered Email</span>
                  <span className="font-semibold text-slate-800 break-all">{vendorData.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vendor Username</span>
                  <span className="font-semibold text-slate-800">{vendorData.username}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Approval Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={13} /> {vendorData.vendorStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Store Address */}
        {activeTab === "address" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
              Warehouse & Fulfillment Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="Building No., Floor, Street Name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Locality, Landmark, Area"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Bangalore"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra, Karnataka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pincode / Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 400001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/25 transition-transform active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={15} /> Save Store Details
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VendorStore;
