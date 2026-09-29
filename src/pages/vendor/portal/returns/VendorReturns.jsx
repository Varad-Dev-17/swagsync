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
  RotateCcw,
  Search,
  RefreshCcw,
  Camera,
  X,
  ShieldCheck,
  Check,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../api/axiosConfig";
import PageCard from "../../../../components/admin/ui/PageCard";
import DataTable from "../../../../components/admin/ui/DataTable";
import Pagination from "../../../../components/admin/ui/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

export default function VendorReturns() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [settlementFilter, setSettlementFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);

  // Case Inspection & Action Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    returnId: null,
    action: "", // "approve" | "reject" | "qc"
    vendorNotes: "",
    rejectionReason: "",
    qcStatus: "passed",
    submitting: false,
  });

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        limit: 10,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (settlementFilter) params.append("settlementType", settlementFilter);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await api.get(`/vendor/portal/returns?${params.toString()}`);
      if (res.data.success) {
        const dataList = res.data.data.requests || res.data.data.returns || [];
        setRequests(dataList);
        setTotalPages(res.data.data.pagination?.pages || res.data.data.pagination?.totalPages || 1);
        setTotalRequests(res.data.data.pagination?.total || 0);

        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch vendor return requests:", err);
      setError("Failed to load return requests.");
      toast.error(err.response?.data?.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter, settlementFilter, startDate, endDate]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setSettlementFilter("");
    setDateRange([null, null]);
    setPage(1);
  };

  const handleProcessAction = async () => {
    if (!actionModal.returnId || !actionModal.action) return;
    setActionModal((prev) => ({ ...prev, submitting: true }));

    try {
      const payload = {
        action: actionModal.action,
        vendorNotes: actionModal.vendorNotes,
      };

      if (actionModal.action === "reject") {
        if (!actionModal.rejectionReason.trim()) {
          toast.error("Please provide a rejection reason");
          setActionModal((prev) => ({ ...prev, submitting: false }));
          return;
        }
        payload.rejectionReason = actionModal.rejectionReason;
      }

      if (actionModal.action === "qc") {
        payload.qcStatus = actionModal.qcStatus;
      }

      const res = await api.patch(`/vendor/portal/returns/${actionModal.returnId}/status`, payload);
      if (res.data.success) {
        toast.success(`Return request updated successfully`);
        setActionModal({ open: false, returnId: null, action: "", vendorNotes: "", rejectionReason: "", qcStatus: "passed", submitting: false });
        setSelectedCase(null);
        fetchRequests();
      }
    } catch (err) {
      console.error("Return status update error:", err);
      toast.error(err.response?.data?.message || "Failed to process return action");
    } finally {
      setActionModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-orange-50 text-[#fe4a03] border-orange-200",
      requested: "bg-orange-50 text-[#fe4a03] border-orange-200",
      approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
      pickup: "bg-amber-50 text-amber-700 border-amber-200",
      pickup_replace: "bg-indigo-50 text-indigo-700 border-indigo-200",
      replace_and_exchange: "bg-indigo-50 text-indigo-700 border-indigo-200",
      pickup_scheduled: "bg-amber-50 text-amber-700 border-amber-200",
      picked_up: "bg-amber-50 text-amber-700 border-amber-200",
      rejected: "bg-rose-50 text-rose-600 border-rose-200",
      received: "bg-blue-50 text-blue-600 border-blue-200",
      completed: "bg-purple-50 text-purple-600 border-purple-200",
      refunded: "bg-purple-50 text-purple-600 border-purple-200",
      exchanged: "bg-purple-50 text-purple-600 border-purple-200",
    };

    const style = styles[status] || "bg-slate-50 text-slate-500 border-slate-200";

    const displayLabels = {
      pending: "Requested",
      requested: "Requested",
      approved: "Approved",
      rejected: "Rejected",
      pickup_scheduled: "Picked up schedule",
      pickup: "Picked up schedule",
      picked_up: "Picked up schedule",
      received: "Recieved",
      replace_and_exchange: "Replace and Exchange",
      pickup_replace: "Replace and Exchange",
      completed: "Completed",
      refunded: "Completed",
      exchanged: "Completed",
    };

    const displayStatus = displayLabels[status] || (typeof status === "string" ? status.replace(/_/g, " ") : "Unknown");

    return (
      <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold border ${style} capitalize shadow-2xs`}>
        {displayStatus}
      </div>
    );
  };

  const columns = [
    {
      header: "REQUEST ID",
      accessor: "_id",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <button
          onClick={() => navigate(`/vendor/portal/returns/${row._id}`)}
          className="font-bold text-[#fe4a03] hover:underline text-xs font-mono cursor-pointer"
        >
          RET{row._id.slice(-4).toUpperCase()}
        </button>
      ),
    },
    {
      header: "CUSTOMER",
      accessor: "user",
      align: "left",
      headerAlign: "left",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800 text-xs">
            {row.user?.username || row.user?.name || "Customer"}
          </span>
          {row.user?.email && <span className="text-[10px] text-slate-400">{row.user.email}</span>}
        </div>
      ),
    },
    {
      header: "ORDER ID",
      accessor: "order",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        let orderIdDisplay = "N/A";
        if (row.order) {
          if (typeof row.order === "object" && row.order.orderId) {
            orderIdDisplay = row.order.orderId;
          } else if (typeof row.order === "string") {
            orderIdDisplay = `ID: ${row.order.slice(-6).toUpperCase()}`;
          }
        }
        return <span className="font-medium text-slate-700 text-xs font-mono">{orderIdDisplay}</span>;
      },
    },
    {
      header: "PRODUCT",
      accessor: "product",
      align: "left",
      headerAlign: "left",
      render: (row) => {
        const product = row.product;
        const variant = row.originalVariant;
        if (!product) return <span className="text-slate-400 text-xs">N/A</span>;

        const productName = product.title || "Product";
        const productImage =
          variant?.mainImage?.url ||
          product.images?.[0]?.url ||
          product.images?.[0] ||
          "";

        let color = "";
        let size = "";
        if (variant && variant.attributes) {
          const colorAttr = variant.attributes.find(
            (a) => a.attribute?.name?.toLowerCase() === "color" || a.name?.toLowerCase() === "color"
          );
          const sizeAttr = variant.attributes.find(
            (a) => a.attribute?.name?.toLowerCase() === "size" || a.name?.toLowerCase() === "size"
          );
          if (colorAttr) color = colorAttr.option?.displayName || colorAttr.value;
          if (sizeAttr) size = sizeAttr.option?.displayName || sizeAttr.value;
        }
        const variantText = [color ? `Color: ${color}` : "", size ? `Size: ${size}` : ""].filter(Boolean).join(" | ");

        return (
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              {productImage ? (
                <img
                  src={typeof productImage === "string" ? productImage : productImage.url}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-4 h-4 m-auto text-slate-400 mt-2" />
              )}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-semibold text-slate-900 line-clamp-1 text-xs">{productName}</span>
              {variantText && <span className="text-[10px] text-slate-400 mt-0.5">{variantText}</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: "TYPE",
      accessor: "type",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const style = row.type === "exchange" ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600";
        return (
          <div className="flex items-center justify-center">
            <span className={`text-[11px] px-2.5 py-0.5 rounded font-medium capitalize ${style}`}>
              {row.type}
            </span>
          </div>
        );
      },
    },
    {
      header: "STATUS",
      accessor: "status",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <div className="flex items-center justify-center">
          {getStatusBadge(row.status)}
        </div>
      ),
    },
    {
      header: "SETTLEMENT",
      accessor: "settlementType",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        let label = "Refund";
        let color = "text-emerald-600 bg-emerald-50";
        if (row.type === "exchange") {
          if (row.settlementType === "additional_payment") {
            label = "Additional Payment";
            color = "text-purple-600 bg-purple-50";
          } else if (row.settlementType === "refund") {
            label = "Refund";
            color = "text-emerald-600 bg-emerald-50";
          } else {
            label = "No Difference";
            color = "text-blue-600 bg-blue-50";
          }
        }
        return (
          <div className="flex items-center justify-center">
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium whitespace-nowrap ${color}`}>
              {label}
            </span>
          </div>
        );
      },
    },
    {
      header: "REQUESTED ON",
      accessor: "createdAt",
      align: "center",
      headerAlign: "center",
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-slate-700 font-medium text-xs">
              {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-[10px] text-gray-400">
              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      header: "ACTIONS",
      align: "center",
      headerAlign: "center",
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate(`/vendor/portal/returns/${row._id}`)}
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
      {/* Top Stats Banner */}
      <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
        {/* Pending */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[170px]">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">PENDING</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.pending}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[170px]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">APPROVED</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.approved}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[170px]">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <XCircle size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">REJECTED</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.rejected}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[170px]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Box size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">COMPLETED</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.completed}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[170px]">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <RotateCcw size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">TOTAL REQUESTS</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.total}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">All Time</p>
          </div>
        </div>
      </div>

      {/* Main PageCard */}
      <PageCard>
        {/* Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-slate-100 bg-white">
          <div className="relative flex-1 min-w-[250px] max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Request ID, Order, Reason..."
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
                <option value="pending">Requested</option>
                <option value="approved">Approved</option>
                <option value="pickup">Pickup</option>
                <option value="received">Received</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-600 mb-1">Type</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#fe4a03]/20 text-xs text-slate-700 cursor-pointer w-[120px] font-medium shadow-2xs"
              >
                <option value="">All Types</option>
                <option value="return">Return</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-600 mb-1">Settlement</span>
              <select
                value={settlementFilter}
                onChange={(e) => {
                  setSettlementFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#fe4a03]/20 text-xs text-slate-700 cursor-pointer w-[150px] font-medium shadow-2xs"
              >
                <option value="">All Settlements</option>
                <option value="refund">Refund</option>
                <option value="additional_payment">Additional Payment</option>
                <option value="no_difference">No Difference</option>
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
          data={requests}
          isLoading={loading}
          emptyMessage="No return or exchange requests found."
        />

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalRequests}
          itemsPerPage={10}
        />
      </PageCard>

      {/* Case Details Drawer / Modal */}
      {selectedCase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#fe4a03] border border-orange-100 flex items-center justify-center font-bold">
                  <RefreshCcw size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Return Case #RET{selectedCase._id.slice(-4).toUpperCase()}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Requested on {new Date(selectedCase.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Product and Claim Reason */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Claim Type: <span className="font-extrabold text-[#fe4a03] capitalize">{selectedCase.type}</span>
                  </span>
                  {getStatusBadge(selectedCase.status)}
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <p className="text-xs font-bold text-slate-900">Reason for Request:</p>
                  <p className="text-xs text-slate-700 mt-0.5">{selectedCase.reason || "Defective / Size issue"}</p>
                  {selectedCase.comments && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{selectedCase.comments}"</p>
                  )}
                </div>
              </div>

              {/* Uploaded Evidence Photos */}
              {selectedCase.images && selectedCase.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Camera size={14} className="text-[#fe4a03]" />
                    Customer Uploaded Photos ({selectedCase.images.length})
                  </h4>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {selectedCase.images.map((img, idx) => {
                      const imgUrl = typeof img === "string" ? img : img.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveLightboxImage(imgUrl)}
                          className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 shrink-0"
                        >
                          <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QC Status & Vendor Actions */}
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-3">
                <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#fe4a03]" />
                  Vendor Action Controls
                </h4>
                <p className="text-xs text-orange-900/80">
                  Inspect the customer issue, verify product tags, and execute return acceptance or QC verification.
                </p>

                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {(selectedCase.status === "pending" || selectedCase.status === "requested") && (
                    <>
                      <button
                        onClick={() =>
                          setActionModal({
                            open: true,
                            returnId: selectedCase._id,
                            action: "approve",
                            vendorNotes: "",
                            rejectionReason: "",
                            qcStatus: "passed",
                            submitting: false,
                          })
                        }
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Approve Request
                      </button>

                      <button
                        onClick={() =>
                          setActionModal({
                            open: true,
                            returnId: selectedCase._id,
                            action: "reject",
                            vendorNotes: "",
                            rejectionReason: "",
                            qcStatus: "passed",
                            submitting: false,
                          })
                        }
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Reject Claim
                      </button>
                    </>
                  )}

                  {selectedCase.status === "approved" && (
                    <button
                      onClick={() =>
                        setActionModal({
                          open: true,
                          returnId: selectedCase._id,
                          action: "pickup_scheduled",
                          vendorNotes: "",
                          rejectionReason: "",
                          qcStatus: "passed",
                          submitting: false,
                        })
                      }
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Schedule Pickup
                    </button>
                  )}

                  {(selectedCase.status === "pickup_scheduled" || selectedCase.status === "pickup") && (
                    selectedCase.type === "exchange" ? (
                      <button
                        onClick={() =>
                          setActionModal({
                            open: true,
                            returnId: selectedCase._id,
                            action: "replace_and_exchange",
                            vendorNotes: "",
                            rejectionReason: "",
                            qcStatus: "passed",
                            submitting: false,
                          })
                        }
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Replace and Exchange
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setActionModal({
                            open: true,
                            returnId: selectedCase._id,
                            action: "received",
                            vendorNotes: "",
                            rejectionReason: "",
                            qcStatus: "passed",
                            submitting: false,
                          })
                        }
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        Mark Recieved
                      </button>
                    )
                  )}

                  {(selectedCase.status === "received" || selectedCase.status === "replace_and_exchange" || selectedCase.status === "pickup_replace") && (
                    <button
                      onClick={() =>
                        setActionModal({
                          open: true,
                          returnId: selectedCase._id,
                          action: "complete",
                          vendorNotes: "",
                          rejectionReason: "",
                          qcStatus: "passed",
                          submitting: false,
                        })
                      }
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}

                  {(selectedCase.status === "completed" || selectedCase.status === "refunded" || selectedCase.status === "exchanged") && (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                      Case Completed
                    </span>
                  )}

                  {selectedCase.status === "rejected" && (
                    <span className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                      Case Rejected
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog (Approve, Reject, or QC) */}
      {actionModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => setActionModal({ ...actionModal, open: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {actionModal.action === "approve"
                  ? "Approve Return Request"
                  : actionModal.action === "reject"
                  ? "Reject Return Request"
                  : "Product QC Verification"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {actionModal.action === "approve" && "Authorize pickup & warehouse intake"}
                {actionModal.action === "reject" && "Provide mandatory justification to customer"}
                {actionModal.action === "qc" && "Confirm package condition & physical tags"}
              </p>
            </div>

            <div className="space-y-3">
              {actionModal.action === "reject" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Explain why this request is declined (e.g. tag removed, used condition)..."
                    value={actionModal.rejectionReason}
                    onChange={(e) => setActionModal({ ...actionModal, rejectionReason: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20"
                  />
                </div>
              )}

              {actionModal.action === "qc" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Quality Inspection Result
                  </label>
                  <select
                    value={actionModal.qcStatus}
                    onChange={(e) => setActionModal({ ...actionModal, qcStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20"
                  >
                    <option value="passed">Passed (Item intact, tags verified)</option>
                    <option value="failed">Failed (Damaged, missing tags)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Vendor Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Internal notes..."
                  value={actionModal.vendorNotes}
                  onChange={(e) => setActionModal({ ...actionModal, vendorNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#fe4a03] focus:ring-2 focus:ring-[#fe4a03]/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActionModal({ ...actionModal, open: false })}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessAction}
                disabled={actionModal.submitting}
                className="px-4 py-2 bg-[#fe4a03] hover:bg-[#e03f00] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#fe4a03]/20 cursor-pointer"
              >
                {actionModal.submitting ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Evidence Images */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={activeLightboxImage} alt="Evidence Large" className="w-full h-auto object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
