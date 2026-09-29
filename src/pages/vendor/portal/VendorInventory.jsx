import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Package,
} from "lucide-react";
import Pagination from "../../../components/admin/ui/Pagination";

const VendorInventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalUnits: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filter, setFilter] = useState(initialFilter); // "all" | "low-stock" | "out-of-stock"
  const [search, setSearch] = useState("");

  // Inline stock edits: { [variantId]: newStockValue }
  const [editingStock, setEditingStock] = useState({});
  const [savingId, setSavingId] = useState(null);

  const fetchInventory = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        filter,
      });
      if (search.trim()) params.append("search", search.trim());

      const res = await api.get(`/vendor/portal/inventory?${params.toString()}`);
      if (res.data.success) {
        const items = res.data.data.inventory || [];
        setInventory(items);
        setStats(res.data.data.stats || {});
        setPagination(res.data.data.pagination || {});

        // Initialize local edit state
        const initialEdits = {};
        items.forEach((item) => {
          initialEdits[item._id] = item.stock;
        });
        setEditingStock(initialEdits);
      }
    } catch (error) {
      console.error("Fetch inventory error:", error);
      toast.error(error.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(1);
  }, [filter]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSearchParams(newFilter === "all" ? {} : { filter: newFilter });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventory(1);
  };

  const handleStockInputChange = (variantId, val) => {
    setEditingStock((prev) => ({
      ...prev,
      [variantId]: val === "" ? "" : Math.max(0, parseInt(val, 10) || 0),
    }));
  };

  // Quick save inline stock
  const handleQuickSaveStock = async (item) => {
    const newStock = editingStock[item._id];
    if (newStock === undefined || newStock === item.stock) {
      return; // No change
    }

    try {
      setSavingId(item._id);
      const res = await api.patch(`/vendor/portal/inventory/${item._id}`, {
        stock: newStock,
      });
      if (res.data.success) {
        toast.success(`SKU ${item.sku} stock updated to ${newStock}!`);
        // Update local item
        setInventory((prev) =>
          prev.map((v) => (v._id === item._id ? { ...v, stock: newStock } : v))
        );
        // Refresh aggregate stats
        const delta = newStock - item.stock;
        setStats((prev) => ({ ...prev, totalUnits: prev.totalUnits + delta }));
      }
    } catch (error) {
      console.error("Quick stock update error:", error);
      toast.error(error.response?.data?.message || "Failed to update stock");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="text-[#fe4a03]" size={24} /> Stock & Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time variant inventory tracking, quick stock updates, and low stock replenishment alerts.
          </p>
        </div>

        <Link
          to="/vendor/portal/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shrink-0"
        >
          <Package size={15} /> All Products
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Configured SKUs
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {stats.totalItems}
          </span>
          <span className="text-[11px] text-slate-500">Active variant items</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Available Units
          </span>
          <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-1 block">
            {stats.totalUnits}
          </span>
          <span className="text-[11px] text-slate-500">Live units ready for sale</span>
        </div>

        <div
          onClick={() => handleFilterChange("low-stock")}
          className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            filter === "low-stock"
              ? "border-amber-500 ring-2 ring-amber-500/20"
              : "border-slate-200/80 hover:border-amber-300"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
            <AlertTriangle size={13} /> Low Stock (≤ 10)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 block">
            {stats.lowStockItems}
          </span>
          <span className="text-[11px] text-slate-500">Needs replenishment</span>
        </div>

        <div
          onClick={() => handleFilterChange("out-of-stock")}
          className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-xs cursor-pointer transition-all ${
            filter === "out-of-stock"
              ? "border-red-500 ring-2 ring-red-500/20"
              : "border-slate-200/80 hover:border-red-300"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
            <XCircle size={13} /> Out of Stock (0)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-red-600 mt-1 block">
            {stats.outOfStockItems}
          </span>
          <span className="text-[11px] text-slate-500">Unavailable for purchase</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => handleFilterChange("low-stock")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "low-stock"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Low Stock ({stats.lowStockItems})
          </button>
          <button
            onClick={() => handleFilterChange("out-of-stock")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "out-of-stock"
                ? "bg-white text-red-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Out of Stock ({stats.outOfStockItems})
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU code..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
          />
        </form>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-[#fe4a03] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading inventory records...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Boxes size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No inventory found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search || filter !== "all"
                ? "No variants match the current search or stock filter."
                : "Configure variants on your products to manage inventory."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3.5">SKU & Image</th>
                  <th className="px-5 py-3.5">Product & Category</th>
                  <th className="px-5 py-3.5">Attributes</th>
                  <th className="px-5 py-3.5">Pricing</th>
                  <th className="px-5 py-3.5">Available Stock (Units)</th>
                  <th className="px-5 py-3.5">Stock Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inventory.map((item) => {
                  const isOutOfStock = item.stock <= 0;
                  const isLowStock = item.stock > 0 && item.stock <= 10;
                  const currentVal = editingStock[item._id] ?? item.stock;
                  const hasChanged = currentVal !== item.stock;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Image & SKU */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.mainImage?.url ? (
                              <img
                                src={item.mainImage.url}
                                alt={item.sku}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-slate-900 block">{item.sku}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              GST: {item.gstRate || 5}%
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Product & Category */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-800 max-w-xs truncate">
                          {item.product?.title || "Product"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.product?.category?.name || "General"}
                        </div>
                      </td>

                      {/* Attributes */}
                      <td className="px-5 py-3.5 text-slate-600">
                        {item.attributes?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.attributes.map((a, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-700"
                              >
                                {a.attribute?.name || "Attr"}:{" "}
                                <strong>{a.option?.displayName || a.option?.storedValue || "-"}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Standard</span>
                        )}
                      </td>

                      {/* Pricing */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">₹{item.price?.toLocaleString()}</div>
                        {item.mrp > item.price && (
                          <div className="text-[11px] text-slate-400 line-through">
                            ₹{item.mrp?.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Inline Stock Editor */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={currentVal}
                            onChange={(e) => handleStockInputChange(item._id, e.target.value)}
                            className={`w-20 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono text-center focus:outline-none focus:ring-2 ${
                              hasChanged
                                ? "border-[#fe4a03] bg-orange-50 text-[#fe4a03] focus:ring-[#fe4a03]/30"
                                : "border-slate-300 text-slate-900 focus:ring-slate-300"
                            }`}
                          />
                          {hasChanged && (
                            <button
                              onClick={() => handleQuickSaveStock(item)}
                              disabled={savingId === item._id}
                              className="p-1.5 rounded-lg bg-[#fe4a03] text-white hover:bg-[#e03f00] shadow-xs transition-colors"
                              title="Save Stock Level"
                            >
                              {savingId === item._id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Save size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isOutOfStock
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : isLowStock
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {item.product?._id && (
                          <Link
                            to={`/vendor/portal/products/${item.product._id}/variants`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 font-semibold text-[11px] transition-colors"
                            title="Edit variant matrix"
                          >
                            <Edit size={14} /> Edit Variant
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page || 1}
          totalPages={pagination.totalPages || 1}
          onPageChange={(p) => fetchInventory(p)}
          totalItems={pagination.total || 0}
          itemsPerPage={pagination.limit || 20}
          itemLabel="variants"
        />
      </div>
    </div>
  );
};

export default VendorInventory;
