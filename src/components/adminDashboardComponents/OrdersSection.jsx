import { useState, useEffect, useCallback } from "react";
import { Package, AlertCircle, Eye, Box, Clock, Truck, CheckCircle2, XCircle, Settings, RotateCcw, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axiosConfig";
import PageCard from "../admin/ui/PageCard";
import DataTable from "../admin/ui/DataTable";
import Pagination from "../admin/ui/Pagination";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";

const OrdersSection = () => {
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
    cancelled: 0
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

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/orders/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch order stats:", err);
    }
  };

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

      const res = await api.get(`/admin/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.data.orders);
        setTotalPages(res.data.data.pagination.pages);
        setTotalOrders(res.data.data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, paymentMethodFilter, startDate, endDate]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!newStatus) return;
    try {
      const res = await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      if (res.data.success) {
        toast.success("Order status updated");
        fetchOrders();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setDateRange([null, null]);
    setPage(1);
  };

  const getStatusBadge = (status, orderId) => {
    const styles = {
      pending: "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100 cursor-pointer",
      processing: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 cursor-pointer",
      packed: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 cursor-pointer",
      shipped: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 cursor-pointer",
      on_the_way: "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 cursor-pointer",
      delivered: "bg-emerald-50 text-emerald-600 border-emerald-100 cursor-default",
      cancelled: "bg-red-50 text-red-600 border-red-100 cursor-default",
    };
    
    const nextStatusMap = {
      pending: 'packed',
      processing: 'shipped',
      packed: 'shipped',
      shipped: 'on_the_way',
      on_the_way: 'delivered'
    };

    const displayLabelMap = {
      pending: "Order Confirmed",
      processing: "Packed",
      packed: "Packed",
      shipped: "Shipped",
      on_the_way: "Out for delivery",
      delivered: "Delivered",
      cancelled: "Cancelled"
    };
    
    const style = styles[status] || "bg-gray-50 text-gray-500 border-gray-100 cursor-default";
    const nextStatus = nextStatusMap[status];
    const displayLabel = displayLabelMap[status] || status;
    
    return (
      <div 
        onClick={() => nextStatus && handleStatusUpdate(orderId, nextStatus)}
        title={nextStatus ? `Click to mark as ${nextStatus}` : ""}
        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold border ${style} capitalize transition-colors shadow-sm`}
      >
        {displayLabel}
      </div>
    );
  };

  const columns = [
    {
      header: 'Order ID',
      accessor: 'orderId',
      render: (row) => (
        <span className="font-bold text-[#4648d4]">
          {row.orderId || row._id.slice(-8).toUpperCase()}
        </span>
      )
    },
    {
      header: 'Product',
      accessor: 'product',
      render: (row) => {
        const item = row.items && row.items.length > 0 ? row.items[0] : null;
        if (!item) return <span>N/A</span>;
        
        const productName = item.product?.title || "Unknown Product";
        const productImage = item.variant?.mainImage?.url || item.product?.images?.[0]?.url || "";
        
        let color = "";
        let size = "";
        if (item.variant && item.variant.attributes) {
          const colorAttr = item.variant.attributes.find(a => a.attribute?.name?.toLowerCase() === 'color');
          const sizeAttr = item.variant.attributes.find(a => a.attribute?.name?.toLowerCase() === 'size');
          if (colorAttr) color = colorAttr.option?.displayName;
          if (sizeAttr) size = sizeAttr.option?.displayName;
        }
        
        const variantText = [color ? `Color: ${color}` : '', size ? `Size: ${size}` : ''].filter(Boolean).join(" | ");
        
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
              {productImage ? (
                <img src={productImage} alt={productName} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <Package className="w-5 h-5 m-auto text-gray-400 mt-2.5" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-gray-900 line-clamp-1 text-sm">{productName}</span>
              {variantText && <span className="text-[11px] text-gray-500 mt-0.5">{variantText}</span>}
              {row.items.length > 1 && (
                <span className="text-[10px] text-[#4648d4] font-medium mt-0.5">+{row.items.length - 1} more items</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => (
        <span className="font-semibold text-gray-900">{row.user?.username || "Unknown"}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'createdAt',
      render: (row) => {
        const d = new Date(row.createdAt);
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-gray-900 font-medium">
              {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-xs text-gray-500">
              {d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => {
        const method = row.paymentMethod || 'cod';
        let longText = 'Cash on Delivery';
        if (method === 'upi' || method === 'card') { longText = 'Online Payment'; } 
        
        return (
          <div className="flex items-center justify-center">
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 font-medium whitespace-nowrap">{longText}</span>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <div className="flex items-center justify-center">
           {getStatusBadge(row.status, row._id)}
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => navigate(`/admin/orders/${row._id}`)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold text-[#4648d4] bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-100 shadow-sm"
          >
            <Eye size={14} />
            View
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* All Orders */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-[#4648d4] shrink-0 border border-indigo-100">
               <Box size={20} />
             </div>
             <div className="flex flex-col">
               <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">All Orders</p>
             </div>
          </div>
          <div className="flex items-end justify-between mt-1">
             <h3 className="text-2xl font-bold text-gray-900 leading-none">{stats.total}</h3>
             <p className="text-[10px] text-gray-400 font-medium">All Time</p>
          </div>
        </div>
        


        {/* Shipped */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0 border border-green-100">
               <Truck size={20} />
             </div>
             <div className="flex flex-col">
               <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Shipped</p>
             </div>
          </div>
          <div className="flex items-end justify-between mt-1">
             <h3 className="text-2xl font-bold text-gray-900 leading-none">{stats.shipped || 0}</h3>
             <p className="text-[10px] text-gray-400 font-medium">Orders</p>
          </div>
        </div>


        {/* Delivered */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100">
               <CheckCircle2 size={20} />
             </div>
             <div className="flex flex-col">
               <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Delivered</p>
             </div>
          </div>
          <div className="flex items-end justify-between mt-1">
             <h3 className="text-2xl font-bold text-gray-900 leading-none">{stats.delivered}</h3>
             <p className="text-[10px] text-gray-400 font-medium">Orders</p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100">
               <XCircle size={20} />
             </div>
             <div className="flex flex-col">
               <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Cancelled</p>
             </div>
          </div>
          <div className="flex items-end justify-between mt-1">
             <h3 className="text-2xl font-bold text-gray-900 leading-none">{stats.cancelled}</h3>
             <p className="text-[10px] text-gray-400 font-medium">Orders</p>
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
               placeholder="Search by Order ID, Customer, Email or Phone"
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
                  <option value="pending">Order Confirmed</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="on_the_way">Out for delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-gray-600 mb-1">Payment Method</span>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-[#4648d4] text-[13px] text-gray-700 cursor-pointer w-[160px]"
                >
                  <option value="">All Methods</option>
                  <option value="cod">Cash on Delivery</option>
                  <option value="upi">UPI / Online</option>
                  <option value="card">Credit/Debit Card</option>
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
          {error && orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="text-gray-800 font-medium mb-2">{error}</p>
              <button
                onClick={fetchOrders}
                className="text-[#4648d4] hover:underline text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders}
              isLoading={loading && orders.length === 0}
              noBorders={true}
              emptyMessage={
                <div className="text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-800 font-medium">No orders found</p>
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
             totalItems={totalOrders}
             itemsPerPage={10}
           />
        </div>
      </PageCard>
    </div>
  );
};

export default OrdersSection;
