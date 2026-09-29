import { useState, useEffect, useCallback } from "react";
import {
  Package,
  AlertCircle,
  Eye,
  Box,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Settings,
  RotateCcw,
  Search,
  MapPin,
  Calendar,
  X,
  Send,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../api/axiosConfig";
import PageCard from "../../../../components/admin/ui/PageCard";
import DataTable from "../../../../components/admin/ui/DataTable";
import Pagination from "../../../../components/admin/ui/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

export default function VendorOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    packed: 0,
    shipped: 0,
    on_the_way: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Detail Modal / Shipping Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingModal, setShippingModal] = useState({
    open: false,
    orderId: null,
    itemId: null,
    courier: "Delhivery",
    trackingNumber: "",
    submitting: false,
  });

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        limit: 10,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentMethodFilter) params.append("paymentMethod", paymentMethodFilter);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await api.get(`/vendor/portal/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.data.orders || []);
        setTotalPages(res.data.data.pagination?.pages || res.data.data.pagination?.totalPages || 1);
        setTotalOrders(res.data.data.pagination?.total || 0);

        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch vendor orders:", err);
      setError("Failed to load orders. Please try again.");
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, paymentMethodFilter, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateItemFulfillment = async (orderId, itemId, status, courier = "", trackingNumber = "") => {
    try {
      const res = await api.patch(`/vendor/portal/orders/${orderId}/items/${itemId}/fulfillment`, {
        status,
        courier,
        trackingNumber,
      });

      if (res.data.success) {
        toast.success(`Item status updated to ${status}`);
        fetchOrders();
        if (selectedOrder && selectedOrder._id === orderId) {
          // Re-fetch or update selectedOrder
          const updatedRes = await api.get(`/vendor/portal/orders/${orderId}`);
          if (updatedRes.data.success) {
            setSelectedOrder(updatedRes.data.data.order || updatedRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error("Update item fulfillment error:", err);
      toast.error(err.response?.data?.message || "Failed to update item fulfillment");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setDateRange([null, null]);
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-orange-50 text-[#fe4a03] border-orange-200",
      processing: "bg-blue-50 text-blue-600 border-blue-200",
      packed: "bg-amber-50 text-amber-700 border-amber-200",
      shipped: "bg-indigo-50 text-indigo-600 border-indigo-200",
      on_the_way: "bg-purple-50 text-purple-600 border-purple-200",
      delivered: "bg-emerald-50 text-emerald-600 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-600 border-rose-200",
    };

    const displayLabelMap = {
      pending: "Order Confirmed",
      processing: "Processing",
      packed: "Packed",
      shipped: "Shipped",
      on_the_way: "Out for delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };

    const style = styles[status] || "bg-slate-50 text-slate-600 border-slate-200";
    const displayLabel = displayLabelMap[status] || status;

    return (
      <div
        className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-semibold border ${style} capitalize shadow-2xs`}
      >
        {displayLabel}
      </div>
    );
  };

  const columns = [
    {
      header: "Order ID",
      accessor: "orderId",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <button
          onClick={() => navigate(`/vendor/portal/orders/${row._id}`)}
          className="font-bold text-[#fe4a03] hover:underline font-mono text-xs cursor-pointer"
        >
          #{row.orderId || row._id.slice(-8).toUpperCase()}
        </button>
      ),
    },
    {
      header: "Product",
      accessor: "product",
      align: "left",
      headerAlign: "left",
      render: (row) => {
        const items = row.vendorItems || row.items || [];
        const item = items.length > 0 ? items[0] : null;
        if (!item) return <span className="text-slate-400 text-xs">N/A</span>;

        const productName = item.product?.title || "Product";
        const productImage =
          item.variant?.mainImage?.url ||
          item.product?.images?.[0]?.url ||
          item.product?.images?.[0] ||
          "";

        let color = "";
        let size = "";
        if (item.variant && item.variant.attributes) {
          const colorAttr = item.variant.attributes.find(
            (a) => a.attribute?.name?.toLowerCase() === "color" || a.name?.toLowerCase() === "color"
          );
          const sizeAttr = item.variant.attributes.find(
            (a) => a.attribute?.name?.toLowerCase() === "size" || a.name?.toLowerCase() === "size"
          );
          if (colorAttr) color = colorAttr.option?.displayName || colorAttr.value;
          if (sizeAttr) size = sizeAttr.option?.displayName || sizeAttr.value;
        }

        const variantText = [color ? `Color: ${color}` : "", size ? `Size: ${size}` : ""]
          .filter(Boolean)
          .join(" | ");

        return (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
              {productImage ? (
                <img
                  src={typeof productImage === "string" ? productImage : productImage.url}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-5 h-5 m-auto text-slate-400 mt-2.5" />
              )}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-semibold text-slate-900 line-clamp-1 text-xs sm:text-sm">
                {productName}
              </span>
              {variantText && <span className="text-[11px] text-slate-500 mt-0.5">{variantText}</span>}
              {items.length > 1 && (
                <span className="text-[10px] text-[#fe4a03] font-bold mt-0.5">
                  +{items.length - 1} more of your items
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: "Customer",
      accessor: "customer",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.customerName || row.user?.username || row.user?.name || "Customer"}
        </span>
      ),
    },
    {
      header: "Date",
      accessor: "createdAt",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-slate-800 font-medium text-xs">
              {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-[11px] text-slate-400">
              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      header: "Your Portion",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs sm:text-sm">
          ₹{(row.vendorSubtotal || row.totalAmount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      header: "Payment Method",
      accessor: "paymentMethod",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const method = row.paymentMethod || "cod";
        let longText = "Cash on Delivery";
        if (method === "upi" || method === "card") longText = "Online Payment";

        return (
          <div className="flex items-center justify-center">
            <span className="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-[#fe4a03] font-medium border border-orange-100 whitespace-nowrap">
              {longText}
            </span>
          </div>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <div className="flex items-center justify-center">
          {getStatusBadge(row.fulfillmentStatus || row.status)}
        </div>
      ),
    },
    {
      header: "Actions",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate(`/vendor/portal/orders/${row._id}`)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#fe4a03] bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-100 shadow-2xs cursor-pointer"
          >
            <Eye size={14} />
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50/50">
      {/* Top Stats Row */}
      <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
        {/* All Orders */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fe4a03] shrink-0">
            <Box size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">All Orders</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.total}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">All Time</p>
          </div>
        </div>

        {/* Shipped */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Truck size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Shipped</p>
            <h3 className="text-xl font-extrabold text-blue-600 tracking-tight leading-tight mt-0.5">
              {stats.shipped || 0}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Orders</p>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Delivered</p>
            <h3 className="text-xl font-extrabold text-emerald-600 tracking-tight leading-tight mt-0.5">
              {stats.delivered || 0}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Orders</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Cancelled</p>
            <h3 className="text-xl font-extrabold text-rose-600 tracking-tight leading-tight mt-0.5">
              {stats.cancelled || 0}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Orders</p>
          </div>
        </div>
      </div>

      {/* Main PageCard */}
      <PageCard>
        {/* Custom Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-100 bg-white">
          <div className="relative flex-1 min-w-[250px] max-w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20 transition-all text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 shadow-2xs font-medium"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-600 mb-1">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#fe4a03]/20 text-xs text-slate-700 cursor-pointer w-[140px] font-medium shadow-2xs"
              >
                <option value="">All Status</option>
                <option value="pending">Order Confirmed</option>
                <option value="processing">Processing</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-600 mb-1">Payment Method</span>
              <select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#fe4a03]/20 text-xs text-slate-700 cursor-pointer w-[150px] font-medium shadow-2xs"
              >
                <option value="">All Methods</option>
                <option value="cod">Cash on Delivery</option>
                <option value="upi">UPI / Online</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>

            <div className="flex flex-col relative z-20">
              <span className="text-[11px] font-bold text-slate-600 mb-1">Date Range</span>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                  if (update[0] && update[1]) setPage(1);
                }}
                isClearable={true}
                placeholderText="Select range"
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#fe4a03]/20 text-xs text-slate-700 cursor-pointer w-[180px] font-medium shadow-2xs"
              />
            </div>

            <button
              onClick={resetFilters}
              title="Reset all filters"
              className="mt-5 p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={orders}
          isLoading={loading}
          emptyMessage="No customer orders found matching your criteria."
        />

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalOrders}
          itemsPerPage={10}
        />
      </PageCard>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fe4a03] border border-orange-100 flex items-center justify-center font-bold">
                  <Box size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Order #{selectedOrder.orderId || selectedOrder._id.slice(-8).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Shipping & Customer Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Customer Info
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedOrder.customerName || selectedOrder.user?.username || "Customer"}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{selectedOrder.customerPhone || "No phone provided"}</p>
                  <p className="text-xs text-slate-600">{selectedOrder.user?.email || ""}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Delivery Address
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress?.address || "Address not provided"}
                    {selectedOrder.shippingAddress?.city && `, ${selectedOrder.shippingAddress.city}`}
                    {selectedOrder.shippingAddress?.pincode && ` - ${selectedOrder.shippingAddress.pincode}`}
                  </p>
                </div>
              </div>

              {/* Items belonging to this vendor */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Your Store Items in this Order ({selectedOrder.vendorItems?.length || selectedOrder.items?.length || 0})
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {(selectedOrder.vendorItems || selectedOrder.items || []).map((item) => {
                    const productName = item.product?.title || "Product";
                    const productImage =
                      item.variant?.mainImage?.url ||
                      item.product?.images?.[0]?.url ||
                      item.product?.images?.[0] ||
                      "";

                    return (
                      <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {productImage ? (
                              <img
                                src={typeof productImage === "string" ? productImage : productImage.url}
                                alt={productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={20} className="m-auto text-slate-400 mt-3" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{productName}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Qty: <span className="font-bold text-slate-800">{item.quantity}</span> • Price: ₹
                              {(item.sellingPrice || item.price || 0).toLocaleString("en-IN")}
                            </p>
                            {item.trackingNumber && (
                              <p className="text-[11px] text-blue-600 mt-1 font-mono">
                                {item.courier || "Carrier"}: {item.trackingNumber}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons per item */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs">{getStatusBadge(item.status || "pending")}</span>

                          {item.status === "pending" && (
                            <button
                              onClick={() =>
                                handleUpdateItemFulfillment(selectedOrder._id, item._id, "packed")
                              }
                              className="px-2.5 py-1 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              Pack Item
                            </button>
                          )}

                          {["pending", "processing", "packed"].includes(item.status) && (
                            <button
                              onClick={() =>
                                setShippingModal({
                                  open: true,
                                  orderId: selectedOrder._id,
                                  itemId: item._id,
                                  courier: "Delhivery",
                                  trackingNumber: "",
                                  submitting: false,
                                })
                              }
                              className="px-2.5 py-1 text-xs font-bold text-white bg-[#fe4a03] hover:bg-[#e03f00] rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              Ship Item
                            </button>
                          )}

                          {item.status === "shipped" && (
                            <button
                              onClick={() =>
                                handleUpdateItemFulfillment(selectedOrder._id, item._id, "delivered")
                              }
                              className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Store Subtotal:{" "}
                <span className="font-extrabold text-slate-900 text-sm">
                  ₹{(selectedOrder.vendorSubtotal || selectedOrder.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Input Dialog */}
      {shippingModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setShippingModal({ ...shippingModal, open: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">Ship / Handover Item</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Enter shipping courier and tracking details
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Courier Partner
                </label>
                <select
                  value={shippingModal.courier}
                  onChange={(e) => setShippingModal({ ...shippingModal, courier: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20"
                >
                  <option value="Delhivery">Delhivery</option>
                  <option value="BlueDart">Blue Dart</option>
                  <option value="DTDC">DTDC</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="Ekart">Ekart</option>
                  <option value="Local Courier">Local Delivery / Self</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Tracking Number / AWB
                </label>
                <input
                  type="text"
                  placeholder="e.g. DLHV-12345678"
                  value={shippingModal.trackingNumber}
                  onChange={(e) => setShippingModal({ ...shippingModal, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-800 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShippingModal({ ...shippingModal, open: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShippingModal({ ...shippingModal, submitting: true });
                  await handleUpdateItemFulfillment(
                    shippingModal.orderId,
                    shippingModal.itemId,
                    "shipped",
                    shippingModal.courier,
                    shippingModal.trackingNumber
                  );
                  setShippingModal({ ...shippingModal, open: false, submitting: false });
                }}
                disabled={shippingModal.submitting}
                className="px-4 py-2 bg-[#fe4a03] hover:bg-[#e03f00] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#fe4a03]/20 cursor-pointer"
              >
                Confirm Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
