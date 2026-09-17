import { useState, useEffect, useCallback } from "react";
import { Package, AlertCircle, Eye, Box, Clock, Truck, CheckCircle2, XCircle, Settings, RotateCcw, Search, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axiosConfig";
import PageCard from "../admin/ui/PageCard";
import DataTable from "../admin/ui/DataTable";
import Pagination from "../admin/ui/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const ReturnsSection = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0, // This is combined refunded and exchanged
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

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
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

      const res = await api.get(`/admin/returns?${params.toString()}`);
      if (res.data.success) {
        setRequests(res.data.data.requests);
        setTotalPages(res.data.data.pagination.pages);
        setTotalRequests(res.data.data.pagination.total);
        
        const rawStats = res.data.data.stats;
        setStats({
          total: rawStats.total || 0,
          pending: rawStats.pending || 0,
          approved: rawStats.approved || 0,
          rejected: rawStats.rejected || 0,
          completed: (rawStats.refunded || 0) + (rawStats.exchanged || 0),
        });
      }
    } catch (err) {
      console.error("Failed to fetch returns:", err);
      setError("Failed to load return requests. Please try again.");
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

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-orange-50 text-orange-600 border-orange-100",
      approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
      pickup: "bg-amber-50 text-amber-700 border-amber-200",
      pickup_replace: "bg-amber-50 text-amber-700 border-amber-200",
      pickup_scheduled: "bg-amber-50 text-amber-700 border-amber-200",
      picked_up: "bg-amber-50 text-amber-700 border-amber-200",
      rejected: "bg-red-50 text-red-600 border-red-100",
      received: "bg-blue-50 text-blue-600 border-blue-100",
      completed: "bg-purple-50 text-purple-600 border-purple-100",
      refunded: "bg-purple-50 text-purple-600 border-purple-100",
      exchanged: "bg-purple-50 text-purple-600 border-purple-100",
    };
    
    const style = styles[status] || "bg-gray-50 text-gray-500 border-gray-100";
    
    let displayStatus = status;
    if (status === 'refunded' || status === 'exchanged' || status === 'completed') {
      displayStatus = 'completed';
    } else if (status === 'pickup' || status === 'pickup_scheduled' || status === 'picked_up') {
      displayStatus = 'pickup';
    } else if (status === 'pickup_replace') {
      displayStatus = 'pickup & replace';
    } else if (status === 'pending') {
      displayStatus = 'requested';
    }
    
    return (
      <div 
        className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold border ${style} capitalize shadow-2xs cursor-default`}
      >
        {displayStatus}
      </div>
    );
  };

  const columns = [
    {
      header: 'Request ID',
      accessor: '_id',
      render: (row) => (
        <span className="font-bold text-[#4648d4] text-xs">
          RET{row._id.slice(-4).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'user',
      render: (row) => (
        <div className="flex flex-col">
            <span className="font-medium text-slate-700 text-xs">{row.user?.username || "Unknown"}</span>
        </div>
      )
    },
    {
      header: 'Order ID',
      accessor: 'order',
      render: (row) => {
          let orderIdDisplay = "N/A";
          
          if (row.order) {
              if (typeof row.order === 'object' && row.order.orderId) {
                  orderIdDisplay = row.order.orderId;
              } else if (typeof row.order === 'string' || row.order instanceof String) {
                  orderIdDisplay = `ID: ${row.order.substring(row.order.length - 6).toUpperCase()}`;
              }
          } else {
             orderIdDisplay = "Deleted Order";
          }

          return (
            <div className="flex flex-col">
                <span className="font-medium text-slate-700 text-xs">{orderIdDisplay}</span>
            </div>
          );
      }
    },
    {
      header: 'Product',
      accessor: 'product',
      align: 'left',
      headerAlign: 'left',
      render: (row) => {
        const product = row.product;
        const variant = row.originalVariant;
        if (!product) return <span>N/A</span>;
        
        const productName = product.title || "Unknown Product";
        const productImage = variant?.mainImage?.url || "";
        
        let color = "";
        let size = "";
        if (variant && variant.attributes) {
          const colorAttr = variant.attributes.find(a => a.attribute?.name?.toLowerCase() === 'color' || a.name?.toLowerCase() === 'color');
          const sizeAttr = variant.attributes.find(a => a.attribute?.name?.toLowerCase() === 'size' || a.name?.toLowerCase() === 'size');
          if (colorAttr) color = colorAttr.option?.displayName;
          if (sizeAttr) size = sizeAttr.option?.displayName;
        }
        const variantText = [color ? `Color: ${color}` : '', size ? `Size: ${size}` : ''].filter(Boolean).join(" | ");

        return (
          <div className="flex items-center gap-2.5 py-0.5">
            <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
              {productImage ? (
                <img src={productImage} alt={productName} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <Package className="w-4 h-4 m-auto text-gray-400 mt-2" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium text-slate-700 line-clamp-1 text-xs">{productName}</span>
              {variantText && <span className="text-[10px] text-gray-400 mt-0.5">{variantText}</span>}
            </div>
          </div>
        );
      }
    },
    {
        header: 'Type',
        accessor: 'type',
        render: (row) => {
            const style = row.type === 'exchange' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600';
            return (
                <div className="flex items-center justify-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium capitalize ${style}`}>
                        {row.type}
                    </span>
                </div>
            )
        }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div className="flex items-center justify-center">
           {getStatusBadge(row.status)}
        </div>
      )
    },
    {
        header: 'Settlement',
        accessor: 'settlementType',
        render: (row) => {
            let label = "Refund";
            let color = "text-emerald-600 bg-emerald-50";
            if (row.type === 'exchange') {
                if (row.settlementType === 'additional_payment') {
                    label = "Additional Payment";
                    color = "text-purple-600 bg-purple-50";
                } else if (row.settlementType === 'refund') {
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
            )
        }
    },
    {
      header: 'Requested On',
      accessor: 'createdAt',
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-slate-700 font-medium text-xs">
              {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-[10px] text-gray-400">
              {d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/admin/returns/${row._id}`)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#4648d4] bg-indigo-50 hover:bg-indigo-100 rounded transition-colors border border-indigo-100 shadow-2xs"
          >
            <Eye size={13} />
            View
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* Top Stats Row - Compact & Left-Aligned */}
      <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
        
        {/* Pending */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600">
            <Clock size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Pending</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.pending}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
            <CheckCircle2 size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Approved</p>
            <h3 className="text-xl font-extrabold text-emerald-600 tracking-tight leading-tight mt-0.5">{stats.approved}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
            <XCircle size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Rejected</p>
            <h3 className="text-xl font-extrabold text-rose-600 tracking-tight leading-tight mt-0.5">{stats.rejected}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
            <Box size={19} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Completed</p>
            <h3 className="text-xl font-extrabold text-blue-600 tracking-tight leading-tight mt-0.5">{stats.completed}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">Requests</p>
          </div>
        </div>

        {/* Total Requests */}
        <div className="bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors w-full sm:w-auto sm:min-w-[185px]">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600">
            <RefreshCcw size={18} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">Total Requests</p>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stats.total}</h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">All Time</p>
          </div>
        </div>

      </div>

      {/* Main Card */}
      <PageCard>
        
        {/* Custom Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-gray-100 bg-white">
           
           <div className="relative flex-1 min-w-[250px] max-w-[350px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input
               type="text"
               placeholder="Search by Request ID, Customer, Order ID..."
               value={searchQuery}
               onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
               className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors text-[13px]"
             />
           </div>

           <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-600 mb-1">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#4648d4] text-[13px] text-gray-700 cursor-pointer w-[140px]"
                >
                  <option value="">All Status</option>
                  <option value="pending">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="pickup">Pickup</option>
                  <option value="pickup_replace">Pickup & Replace</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-600 mb-1">Type</span>
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#4648d4] text-[13px] text-gray-700 cursor-pointer w-[140px]"
                >
                  <option value="">All Types</option>
                  <option value="return">Return</option>
                  <option value="exchange">Exchange</option>
                </select>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-600 mb-1">Settlement</span>
                <select
                  value={settlementFilter}
                  onChange={(e) => { setSettlementFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#4648d4] text-[13px] text-gray-700 cursor-pointer w-[140px]"
                >
                  <option value="">All Settlement</option>
                  <option value="refund">Refund</option>
                  <option value="additional_payment">Additional Payment</option>
                  <option value="no_difference">No Difference</option>
                </select>
              </div>

              <div className="flex flex-col relative z-20">
                <span className="text-[11px] font-semibold text-gray-600 mb-1">Date Range</span>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => {
                    setDateRange(update);
                    if (update[0] && update[1]) setPage(1);
                  }}
                  isClearable={true}
                  placeholderText="Select Date Range"
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] text-[13px] text-gray-700 w-[200px]"
                />
              </div>

              <div className="flex flex-col self-end">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#4648d4] text-[#4648d4] bg-[#4648d4]/5 hover:bg-[#4648d4]/10 rounded-lg transition-colors text-[13px] font-semibold"
                >
                  <RotateCcw size={14} />
                  Reset Filters
                </button>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && requests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">{error}</p>
              <button
                onClick={fetchRequests}
                className="text-[#4648d4] hover:underline text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={requests}
              isLoading={loading && requests.length === 0}
              noBorders={true}
              emptyMessage={
                <div className="text-center">
                  <RefreshCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-800 font-medium">No requests found</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              }
            />
          )}
        </div>
        
        <div className="p-2 border-t border-gray-100">
           <Pagination
             currentPage={page}
             totalPages={totalPages}
             onPageChange={setPage}
             totalItems={totalRequests}
             itemsPerPage={10}
           />
        </div>
      </PageCard>
    </div>
  );
};

export default ReturnsSection;
