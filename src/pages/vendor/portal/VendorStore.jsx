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
  CheckCircle2,
  RefreshCw,
  Factory,
  Plus,
  Edit3,
  Trash2,
  Star,
  X,
  Check,
} from "lucide-react";

const VendorStore = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "manufacturer"

  const [vendorData, setVendorData] = useState({
    vendorId: "",
    username: "",
    email: "",
    mobileNo: "",
    vendorStatus: "",
  });

  // Store information state (Tab 1)
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

  // Multi-Store list state (Tab 1 Address-Book style)
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [storeSubmitting, setStoreSubmitting] = useState(false);
  const [storeModalData, setStoreModalData] = useState({
    storeName: "",
    storeDescription: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isDefault: false,
  });

  // Manufacturers list state (Tab 2)
  const [manufacturers, setManufacturers] = useState([]);
  const [mfgLoading, setMfgLoading] = useState(false);
  const [isMfgModalOpen, setIsMfgModalOpen] = useState(false);
  const [editingMfg, setEditingMfg] = useState(null);
  const [mfgSubmitting, setMfgSubmitting] = useState(false);
  const [mfgFormData, setMfgFormData] = useState({
    manufacturerName: "",
    countryOfOrigin: "India",
    manufacturerAddress: "",
    packer: "",
    packerPhone: "",
    packerAddress: "",
    isDefault: false,
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

  const fetchStores = async () => {
    try {
      setStoresLoading(true);
      const res = await api.get("/vendor/portal/stores");
      if (res.data.success) {
        setStores(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch stores error:", error);
      toast.error(error.response?.data?.message || "Failed to load stores");
    } finally {
      setStoresLoading(false);
    }
  };

  const fetchManufacturers = async () => {
    try {
      setMfgLoading(true);
      const res = await api.get("/vendor/portal/manufacturers");
      if (res.data.success) {
        setManufacturers(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch manufacturers error:", error);
      toast.error(error.response?.data?.message || "Failed to load manufacturers");
    } finally {
      setMfgLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
    fetchStores();
    fetchManufacturers();
  }, []);

  // Store Modal handlers
  const openAddStoreModal = () => {
    setEditingStore(null);
    setStoreModalData({
      storeName: "",
      storeDescription: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      isDefault: stores.length === 0,
    });
    setIsStoreModalOpen(true);
  };

  const openEditStoreModal = (st) => {
    setEditingStore(st);
    setStoreModalData({
      storeName: st.storeName || "",
      storeDescription: st.storeDescription || "",
      phone: st.phone || "",
      addressLine1: st.addressLine1 || "",
      addressLine2: st.addressLine2 || "",
      city: st.city || "",
      state: st.state || "",
      country: st.country || "India",
      pincode: st.pincode || "",
      isDefault: Boolean(st.isDefault),
    });
    setIsStoreModalOpen(true);
  };

  const handleStoreModalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStoreModalData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStoreModalSubmit = async (e) => {
    e.preventDefault();
    if (!storeModalData.storeName.trim()) {
      toast.error("Store name is required");
      return;
    }

    try {
      setStoreSubmitting(true);
      if (editingStore) {
        const res = await api.put(`/vendor/portal/stores/${editingStore._id}`, storeModalData);
        if (res.data.success) {
          toast.success("Store updated successfully");
          setStores(res.data.data);
          setIsStoreModalOpen(false);
          fetchStoreData();
        }
      } else {
        const res = await api.post("/vendor/portal/stores", storeModalData);
        if (res.data.success) {
          toast.success("Store added successfully");
          setStores(res.data.data);
          setIsStoreModalOpen(false);
          fetchStoreData();
        }
      }
    } catch (error) {
      console.error("Submit store error:", error);
      toast.error(error.response?.data?.message || "Failed to save store");
    } finally {
      setStoreSubmitting(false);
    }
  };

  const handleDeleteStore = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store profile?")) return;
    try {
      const res = await api.delete(`/vendor/portal/stores/${id}`);
      if (res.data.success) {
        toast.success("Store deleted successfully");
        setStores(res.data.data);
        fetchStoreData();
      }
    } catch (error) {
      console.error("Delete store error:", error);
      toast.error(error.response?.data?.message || "Failed to delete store");
    }
  };

  const handleSetDefaultStore = async (id) => {
    try {
      const res = await api.patch(`/vendor/portal/stores/${id}/default`);
      if (res.data.success) {
        toast.success("Default store updated");
        setStores(res.data.data);
        fetchStoreData();
      }
    } catch (error) {
      console.error("Set default store error:", error);
      toast.error(error.response?.data?.message || "Failed to set default store");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitStore = async (e) => {
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

  // Manufacturer Modal handlers
  const openAddMfgModal = () => {
    setEditingMfg(null);
    setMfgFormData({
      manufacturerName: "",
      countryOfOrigin: "India",
      manufacturerAddress: "",
      packer: "",
      packerPhone: "",
      packerAddress: "",
      isDefault: manufacturers.length === 0,
    });
    setIsMfgModalOpen(true);
  };

  const openEditMfgModal = (mfg) => {
    setEditingMfg(mfg);
    setMfgFormData({
      manufacturerName: mfg.manufacturerName || "",
      countryOfOrigin: mfg.countryOfOrigin || "India",
      manufacturerAddress: mfg.manufacturerAddress || "",
      packer: mfg.packer || "",
      packerPhone: mfg.packerPhone || "",
      packerAddress: mfg.packerAddress || "",
      isDefault: Boolean(mfg.isDefault),
    });
    setIsMfgModalOpen(true);
  };

  const handleMfgFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMfgFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMfgSubmit = async (e) => {
    e.preventDefault();
    if (!mfgFormData.manufacturerName.trim()) {
      toast.error("Manufacturer name is required");
      return;
    }

    try {
      setMfgSubmitting(true);
      if (editingMfg) {
        const res = await api.put(`/vendor/portal/manufacturers/${editingMfg._id}`, mfgFormData);
        if (res.data.success) {
          toast.success("Manufacturer updated successfully");
          setManufacturers(res.data.data);
          setIsMfgModalOpen(false);
        }
      } else {
        const res = await api.post("/vendor/portal/manufacturers", mfgFormData);
        if (res.data.success) {
          toast.success("Manufacturer added successfully");
          setManufacturers(res.data.data);
          setIsMfgModalOpen(false);
        }
      }
    } catch (error) {
      console.error("Submit manufacturer error:", error);
      toast.error(error.response?.data?.message || "Failed to save manufacturer");
    } finally {
      setMfgSubmitting(false);
    }
  };

  const handleDeleteMfg = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manufacturer profile?")) return;
    try {
      const res = await api.delete(`/vendor/portal/manufacturers/${id}`);
      if (res.data.success) {
        toast.success("Manufacturer deleted successfully");
        setManufacturers(res.data.data);
      }
    } catch (error) {
      console.error("Delete manufacturer error:", error);
      toast.error(error.response?.data?.message || "Failed to delete manufacturer");
    }
  };

  const handleSetDefaultMfg = async (id) => {
    try {
      const res = await api.patch(`/vendor/portal/manufacturers/${id}/default`);
      if (res.data.success) {
        toast.success("Default manufacturer updated");
        setManufacturers(res.data.data);
      }
    } catch (error) {
      console.error("Set default manufacturer error:", error);
      toast.error(error.response?.data?.message || "Failed to set default");
    }
  };

  if (loading) {
    return (
      <div className="w-full p-6 sm:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading store profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="text-[#fe4a03]" size={24} /> Store Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your public store presence, customer contact information, and manufacturer profiles.
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
          type="button"
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "info"
              ? "border-[#fe4a03] text-[#fe4a03]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building size={16} /> Store Information ({stores.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manufacturer")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "manufacturer"
              ? "border-[#fe4a03] text-[#fe4a03]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Factory size={16} /> Manufacturer Details ({manufacturers.length})
        </button>
      </div>

      {/* TAB 1: STORE INFORMATION (Address-Book Multi-Store Style) */}
      {activeTab === "info" && (
        <div className="space-y-6">
          {/* Header with "+ Add Store" button */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Store size={20} className="text-[#fe4a03]" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Store Locations & Warehouses
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Add and manage locations to fulfill your product orders.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddStoreModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/25 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus size={16} /> Add Store
              </button>
            </div>
          </div>

          {/* Stores List / Cards */}
          {storesLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-50 text-[#fe4a03] rounded-2xl flex items-center justify-center mx-auto">
                <Store size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No Stores Registered</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your primary store profile so you can assign it to your products and listings.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddStoreModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fe4a03] text-white text-xs font-bold hover:bg-[#e03f00] transition-colors shadow-sm"
              >
                <Plus size={16} /> Add First Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {stores.map((st) => {
                const addrParts = [
                  st.addressLine1,
                  st.addressLine2,
                  st.city,
                  st.state,
                  st.pincode,
                  st.country,
                ].filter(Boolean);
                const fullAddr = addrParts.join(", ");

                return (
                  <div
                    key={st._id}
                    className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between relative shadow-xs ${
                      st.isDefault
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Card Top: Name & Badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900 truncate">
                              {st.storeName}
                            </h3>
                            {st.isDefault && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Star size={10} className="fill-emerald-600 text-emerald-600" /> Default Store
                              </span>
                            )}
                          </div>
                          {st.phone && (
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                              <Phone size={12} className="text-slate-400" /> {st.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Store Description / Tagline */}
                      {st.storeDescription && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <p className="italic">{st.storeDescription}</p>
                        </div>
                      )}

                      {/* Registered Store & Warehouse Address */}
                      <div className="text-xs space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Registered Warehouse / Store Address
                        </span>
                        <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                          <MapPin size={14} className="text-[#fe4a03] shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            {fullAddr || "No address specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                      <div>
                        {!st.isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultStore(st._id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Star size={12} /> Set as Default
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <Check size={12} /> Primary Default Store
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditStoreModal(st)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Store"
                        >
                          <Edit3 size={15} />
                        </button>
                        {stores.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStore(st._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MANUFACTURER DETAILS (Address-Book Style) */}
      {activeTab === "manufacturer" && (
        <div className="space-y-6">
          {/* Header with "+ Add Manufacturer" button */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Factory size={20} className="text-[#fe4a03]" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Manufacturer & Product Compliance Details
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Add and manage manufacturer profiles for your products.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddMfgModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/25 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Plus size={16} /> Add Manufacturer
              </button>
            </div>
          </div>

          {/* Manufacturers List / Cards */}
          {mfgLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-medium text-slate-500">Loading manufacturers...</p>
            </div>
          ) : manufacturers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-50 text-[#fe4a03] rounded-2xl flex items-center justify-center mx-auto">
                <Factory size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No Manufacturers Registered</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your primary manufacturer profile so you can assign it to your products.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddMfgModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#fe4a03] text-white text-xs font-bold hover:bg-[#e03f00] transition-colors shadow-sm"
              >
                <Plus size={16} /> Add First Manufacturer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {manufacturers.map((mfg) => (
                <div
                  key={mfg._id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between relative shadow-xs ${
                    mfg.isDefault
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Top: Name & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {mfg.manufacturerName}
                          </h3>
                          {mfg.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Star size={10} className="fill-emerald-600 text-emerald-600" /> Default
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {mfg.countryOfOrigin || "India"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Manufacturer Address */}
                    <div className="text-xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Manufacturer Address
                      </span>
                      <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                        <MapPin size={14} className="text-[#fe4a03] shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          {mfg.manufacturerAddress || "No address specified"}
                        </p>
                      </div>
                    </div>

                    {/* Packer Details */}
                    <div className="text-xs pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Packer Information
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Packer Name:</span>
                          <span className="font-semibold text-slate-800">{mfg.packer || "—"}</span>
                        </div>
                        {mfg.packerPhone && (
                          <div>
                            <span className="text-slate-400 text-[11px] block">Packer Phone:</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" /> {mfg.packerPhone}
                            </span>
                          </div>
                        )}
                        <div className="sm:col-span-2">
                          <span className="text-slate-400 text-[11px] block">Packer Address:</span>
                          <span className="font-medium text-slate-700 leading-relaxed">
                            {mfg.packerAddress || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
                    <div>
                      {!mfg.isDefault ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultMfg(mfg._id)}
                          className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Star size={12} /> Set as Default
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check size={12} /> Primary Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditMfgModal(mfg)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Manufacturer"
                      >
                        <Edit3 size={15} />
                      </button>
                      {manufacturers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMfg(mfg._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Manufacturer"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT MANUFACTURER MODAL */}
      {isMfgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                  <Factory size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingMfg ? "Edit Manufacturer" : "Add New Manufacturer"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMfgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMfgSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manufacturer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="manufacturerName"
                    value={mfgFormData.manufacturerName}
                    onChange={handleMfgFormChange}
                    required
                    placeholder="e.g. Acme Lifestyle Manufacturing Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    name="countryOfOrigin"
                    value={mfgFormData.countryOfOrigin}
                    onChange={handleMfgFormChange}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manufacturer Address
                  </label>
                  <textarea
                    name="manufacturerAddress"
                    value={mfgFormData.manufacturerAddress}
                    onChange={handleMfgFormChange}
                    rows={2}
                    placeholder="Plot No., Industrial Zone, City, State, Pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packer
                  </label>
                  <input
                    type="text"
                    name="packer"
                    value={mfgFormData.packer}
                    onChange={handleMfgFormChange}
                    placeholder="e.g. Acme Logistics Pvt Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packer Phone
                  </label>
                  <input
                    type="tel"
                    name="packerPhone"
                    value={mfgFormData.packerPhone}
                    onChange={handleMfgFormChange}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Packer Address
                  </label>
                  <textarea
                    name="packerAddress"
                    value={mfgFormData.packerAddress}
                    onChange={handleMfgFormChange}
                    rows={2}
                    placeholder="Packaging facility / fulfillment address, Pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={mfgFormData.isDefault}
                      onChange={handleMfgFormChange}
                      className="w-4 h-4 rounded text-[#fe4a03] focus:ring-[#fe4a03]"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Set as default manufacturer for new products
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMfgModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mfgSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {mfgSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Manufacturer"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT STORE MODAL */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                  <Store size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingStore ? "Edit Store Location" : "Add New Store Location"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStoreModalSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={storeModalData.storeName}
                    onChange={handleStoreModalChange}
                    required
                    placeholder="e.g. Acme Lifestyle Store - Bandra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Displayed to buyers on product pages and brand listings.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Phone / Support Contact
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={storeModalData.phone}
                      onChange={handleStoreModalChange}
                      placeholder="e.g. +91 9876543210"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Description / Tagline
                  </label>
                  <textarea
                    name="storeDescription"
                    value={storeModalData.storeDescription}
                    onChange={handleStoreModalChange}
                    rows={2}
                    placeholder="Brief description, specialties, or warehouse identifier..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={storeModalData.addressLine1}
                    onChange={handleStoreModalChange}
                    required
                    placeholder="Building No., Floor, Street Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={storeModalData.addressLine2}
                    onChange={handleStoreModalChange}
                    placeholder="Locality, Landmark, Area"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={storeModalData.city}
                    onChange={handleStoreModalChange}
                    required
                    placeholder="e.g. Mumbai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={storeModalData.state}
                    onChange={handleStoreModalChange}
                    required
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pincode / Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={storeModalData.pincode}
                    onChange={handleStoreModalChange}
                    required
                    placeholder="e.g. 400001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={storeModalData.country}
                    onChange={handleStoreModalChange}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={storeModalData.isDefault}
                      onChange={handleStoreModalChange}
                      className="w-4 h-4 rounded text-[#fe4a03] focus:ring-[#fe4a03]"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Set as primary default store for new products
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={storeSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {storeSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Store Details"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorStore;
