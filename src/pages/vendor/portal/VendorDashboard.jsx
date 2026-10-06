import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Users,
  Box,
  WalletCards,
  AlertCircle,
  Eye,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import api from "../../../api/axiosConfig";
import StatusBadge from "../../../components/admin/ui/StatusBadge";
import PageLoader from "../../../components/common/PageLoader";
import toast from "react-hot-toast";

const FilterSelect = ({ value, onChange, large = false }) => {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-white border border-slate-300 text-slate-700 font-semibold shadow-2xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] ${
          large ? "px-4 py-2 font-bold text-sm" : "px-3 py-1.5 text-xs"
        } pr-8 rounded-xl cursor-pointer transition-all`}
      >
        <option value="This Year">This Year</option>
        <option value="This Month">This Month</option>
        <option value="This Week">This Week</option>
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none stroke-[2.5]"
      />
    </div>
  );
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [revenueFilter, setRevenueFilter] = useState("This Week");
  const [ordersFilter, setOrdersFilter] = useState("This Week");
  const [analyticsFilter, setAnalyticsFilter] = useState("This Week");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/vendor/portal/dashboard/stats", {
        params: {
          revenueTime: revenueFilter,
          ordersTime: ordersFilter,
          analyticsTime: analyticsFilter,
        },
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
      setError("Failed to load dashboard statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.get("/vendor/portal/dashboard/stats", {
        params: {
          revenueTime: revenueFilter,
          ordersTime: ordersFilter,
          analyticsTime: analyticsFilter,
        },
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        toast.error("Failed to refresh dashboard data", { id: "vendor-dash-refresh" });
      }
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      toast.error("Failed to refresh dashboard statistics. Please try again.", { id: "vendor-dash-refresh" });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [revenueFilter, ordersFilter, analyticsFilter]);

  if (loading && !data) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="p-8 h-[50vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-gray-800 font-bold mb-2">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-[#fe4a03] text-white rounded-xl text-xs font-bold hover:bg-[#e03f00] transition-colors shadow-sm shadow-[#fe4a03]/20"
        >
          Retry
        </button>
      </div>
    );
  }

  const counts = data?.counts || { totalProducts: 0, totalOrders: 0, totalUsers: 0 };
  const revenue = data?.revenue || { total: 0, growth: 0 };
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];
  const revenueChart = data?.revenueChart || [];
  const analyticsChart = data?.analyticsChart || [];
  const salesByCategory = data?.salesByCategory || [];
  const orderStats = data?.orders || {};
  const store = data?.store || {};

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${(revenue.total || 0).toLocaleString("en-IN")}`,
      change: `${revenue.growth > 0 ? "+" : ""}${revenue.growth}% vs last month`,
      isPositive: (revenue.growth || 0) >= 0,
      icon: WalletCards,
      iconBg: "bg-orange-50 border border-orange-200/80",
      iconColor: "text-[#fe4a03]",
    },
    {
      label: "Total Orders",
      value: (counts.totalOrders || 0).toLocaleString("en-IN"),
      change: "+8.4% vs last month",
      isPositive: true,
      icon: ShoppingCart,
      iconBg: "bg-emerald-50 border border-emerald-200/80",
      iconColor: "text-emerald-700",
    },
    {
      label: "Total Customers",
      value: (counts.totalUsers || 0).toLocaleString("en-IN"),
      change: "+12.1% vs last month",
      isPositive: true,
      icon: Users,
      iconBg: "bg-blue-50 border border-blue-200/80",
      iconColor: "text-blue-700",
    },
    {
      label: "Total Products",
      value: (counts.totalProducts || 0).toLocaleString("en-IN"),
      change: "+4.2% vs last month",
      isPositive: true,
      icon: Box,
      iconBg: "bg-purple-50 border border-purple-200/80",
      iconColor: "text-purple-700",
    },
  ];

  // Prepare data for Order Overview Donut
  const orderPieData = [
    { name: "Delivered", value: orderStats.delivered || 0, color: "#10b981" },
    { name: "Processing", value: orderStats.processing || 0, color: "#3b82f6" },
    { name: "Packed", value: orderStats.packed || 0, color: "#fe4a03" },
    { name: "Shipped", value: orderStats.shipped || 0, color: "#f59e0b" },
    { name: "Pending", value: orderStats.pending || 0, color: "#8b5cf6" },
    { name: "Cancelled", value: orderStats.cancelled || 0, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  if (orderPieData.length === 0) {
    orderPieData.push({ name: "No Orders", value: 1, color: "#e5e7eb" });
  }

  const COLORS = orderPieData.map((d) => d.color);

  const statusColors = {
    delivered: "text-emerald-800 bg-emerald-50 border-emerald-300",
    processing: "text-blue-800 bg-blue-50 border-blue-300",
    packed: "text-orange-800 bg-orange-50 border-orange-300",
    shipped: "text-amber-800 bg-amber-50 border-amber-300",
    pending: "text-purple-800 bg-purple-50 border-purple-300",
    cancelled: "text-rose-800 bg-rose-50 border-rose-300",
  };

  const catColors = [
    "bg-[#fe4a03]",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-amber-500",
    "bg-purple-500",
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-orange-100 p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-[22px] md:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            Welcome back, {store.storeName || "Vendor"}! <span className="text-xl sm:text-2xl">👋</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Here's what's happening with your store catalog and customer orders today.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all text-xs font-semibold shadow-2xs ${
            isRefreshing
              ? "bg-orange-50 border-orange-200 text-[#fe4a03] cursor-not-allowed"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer active:scale-95"
          }`}
          title="Refresh dashboard stats"
        >
          <RefreshCw
            size={14}
            className={`text-[#fe4a03] transition-transform ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Top Stats Panel - Compact & Responsive */}
      <div className="flex flex-wrap items-center gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="relative overflow-hidden bg-white rounded-xl px-5 py-3.5 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors flex items-center gap-3.5 w-full sm:w-auto sm:min-w-[215px] flex-1"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                <Icon size={20} className={stat.iconColor} />
              </div>
              <div className="flex flex-col z-10 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">{stat.value}</span>
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      stat.isPositive
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                  >
                    {stat.isPositive ? "▲" : "▼"} {stat.change.replace(/[+▲▼]/g, "").trim().split(" ")[0]}
                  </span>
                  <span className="text-slate-400 font-medium text-[10px]">
                    {stat.change.replace(/[+▲▼]/g, "").trim().split(" ").slice(1).join(" ")}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section 1: Revenue AreaChart & Orders Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Revenue Overview</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Earnings progression over time</p>
            </div>
            <FilterSelect value={revenueFilter} onChange={setRevenueFilter} />
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fe4a03" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fe4a03" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                  dy={10}
                  interval={revenueFilter === "This Month" ? 3 : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                  tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                  }}
                  itemStyle={{ color: "#fe4a03", fontWeight: 700 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#fe4a03"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVendorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Overview Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Orders Overview</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Fulfillment breakdown</p>
            </div>
            <FilterSelect value={ordersFilter} onChange={setOrdersFilter} />
          </div>

          <div className="relative h-[200px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {orderPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">
                {orderStats.total !== undefined ? orderStats.total : (counts.totalOrders || 0)}
              </span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Orders</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100">
            {orderPieData.map((item, index) => {
              if (item.name === "No Orders") return null;
              const total = orderPieData.reduce((sum, d) => sum + d.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-semibold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-sm">{item.value}</span>
                    <span className="text-slate-500 font-medium text-xs w-12 text-right">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lists Section 2: Top Products, Recent Orders, Sales by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Products</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Highest volume catalog items</p>
            </div>
            <button
              onClick={() => navigate("/vendor/portal/products")}
              className="text-xs font-bold text-[#fe4a03] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider pb-2.5 border-b border-slate-200">
              <span>Product</span>
              <div className="flex gap-6 text-right">
                <span className="w-12">Sold</span>
                <span className="w-16">Revenue</span>
              </div>
            </div>
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Package size={24} className="mx-auto mb-2 text-slate-300" />
                No sales records yet.
              </div>
            ) : (
              topProducts.slice(0, 4).map((product, index) => {
                const imgUrl = product.images?.[0]?.url || product.image;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/70 p-1.5 -mx-1.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0">
                        {imgUrl ? (
                          <img src={imgUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <Package size={16} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={product.title}>
                          {product.title}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500">Popular</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-right text-xs shrink-0">
                      <span className="font-semibold text-slate-700 w-12">{product.totalSold || product.soldCount || 0}</span>
                      <span className="font-bold text-slate-900 w-16">
                        ₹{Math.round(product.totalRevenue || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Orders</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Latest customer purchases</p>
            </div>
            <button
              onClick={() => navigate("/vendor/portal/orders")}
              className="text-xs font-bold text-[#fe4a03] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="pb-2.5 font-bold">Order ID</th>
                  <th className="pb-2.5 font-bold">Customer</th>
                  <th className="pb-2.5 font-bold text-right pr-4">Amount</th>
                  <th className="pb-2.5 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No customer orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 4).map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-bold text-[#fe4a03]">#{order.orderId || order.orderNumber}</td>
                      <td className="py-3 font-medium text-slate-700">{order.user?.username || "Guest"}</td>
                      <td className="py-3 font-extrabold text-slate-900 text-right pr-4">
                        ₹{Math.round(order.totalAmount || order.total || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                            statusColors[order.status] || "text-slate-700 bg-slate-100 border-slate-300"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sales by Category</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Category revenue distribution</p>
            </div>
            <button
              onClick={() => navigate("/vendor/portal/catalog")}
              className="text-xs font-bold text-[#fe4a03] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {salesByCategory.slice(0, 5).map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 flex justify-center items-center bg-slate-100 border border-slate-200 text-slate-700 rounded">
                      <Box size={12} />
                    </div>
                    <span className="font-bold text-slate-800">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-500">{item.percentage}%</span>
                    <span className="font-extrabold text-slate-900 w-16 text-right">
                      ₹{Math.round(item.revenue).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${catColors[index % catColors.length]}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {salesByCategory.length === 0 && (
              <p className="text-xs font-medium text-slate-500 text-center py-6">No category sales recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Chart (BarChart) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sales Analytics</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Cross-metric performance (Revenue, Orders, Customers)</p>
          </div>
          <FilterSelect value={analyticsFilter} onChange={setAnalyticsFilter} large={false} />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsChart} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                dy={10}
                interval={analyticsFilter === "This Month" ? 3 : 0}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Legend
                verticalAlign="top"
                align="left"
                iconType="circle"
                wrapperStyle={{ paddingBottom: "20px", fontSize: "13px", fontWeight: 600, color: "#334155" }}
              />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#fe4a03" maxBarSize={analyticsFilter === "This Month" ? 8 : 14} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#2563eb" maxBarSize={analyticsFilter === "This Month" ? 8 : 14} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="customers" name="Customers" fill="#059669" maxBarSize={analyticsFilter === "This Month" ? 8 : 14} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
