import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Users,
  Box,
  WalletCards,
  Loader2,
  AlertCircle,
  CalendarDays,
  ChevronDown,
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
import api from "../../api/axiosConfig";

const FilterSelect = ({ value, onChange, large = false }) => {
  return (
    <div className="relative inline-block">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none bg-white border border-slate-300 text-slate-700 font-semibold shadow-2xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
          large ? 'px-4 py-2 font-bold text-sm' : 'px-3 py-1.5 text-xs'
        } pr-8 rounded-lg cursor-pointer transition-all`}
      >
        <option value="This Year">This Year</option>
        <option value="This Month">This Month</option>
        <option value="This Week">This Week</option>
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-600 pointer-events-none stroke-[2.5]" />
    </div>
  );
};

const DashboardSection = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [revenueFilter, setRevenueFilter] = useState("This Week");
  const [ordersFilter, setOrdersFilter] = useState("This Week");
  const [analyticsFilter, setAnalyticsFilter] = useState("This Week");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/dashboard/stats", {
        params: {
          revenueTime: revenueFilter,
          ordersTime: ordersFilter,
          analyticsTime: analyticsFilter
        }
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard stats error:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [revenueFilter, ordersFilter, analyticsFilter]);

  if (loading && !data) {
    return (
      <div className="p-6 h-[50vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#4648d4] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading dashboard stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-[50vh] flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-gray-800 font-bold mb-2">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-[#4648d4] text-white rounded-lg text-sm font-medium hover:bg-[#3a3cb8] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const counts = data?.counts || {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
  };
  const revenue = data?.revenue || { total: 0, growth: 0 };
  const recentOrders = data?.recentOrders || [];
  const topProducts = data?.topProducts || [];
  const revenueChart = data?.revenueChart || [];
  const analyticsChart = data?.analyticsChart || [];
  const orderStats = data?.orders || {};
  const salesByCategory = data?.salesByCategory || [];

  const stats = [
    {
      label: "Total Revenue",
      value: `₹${revenue.total.toLocaleString('en-IN')}`,
      change: `${revenue.growth > 0 ? "+" : ""}${revenue.growth}% vs last month`,
      isPositive: revenue.growth >= 0,
      icon: WalletCards,
      iconBg: "bg-purple-50 border border-purple-200/80",
      iconColor: "text-purple-700",
    },
    {
      label: "Total Orders",
      value: counts.totalOrders.toLocaleString('en-IN'),
      change: "+8.7% vs last month", // mock change
      isPositive: true,
      icon: ShoppingCart,
      iconBg: "bg-emerald-50 border border-emerald-200/80",
      iconColor: "text-emerald-700",
    },
    {
      label: "Total Customers",
      value: counts.totalUsers.toLocaleString('en-IN'),
      change: "+15.3% vs last month", // mock change
      isPositive: true,
      icon: Users,
      iconBg: "bg-amber-50 border border-amber-200/80",
      iconColor: "text-amber-700",
    },
    {
      label: "Total Products",
      value: counts.totalProducts.toLocaleString('en-IN'),
      change: "+4.6% vs last month", // mock change
      isPositive: true,
      icon: Box,
      iconBg: "bg-blue-50 border border-blue-200/80",
      iconColor: "text-blue-700",
    },
  ];

  // Prepare data for Order Overview Donut
  const orderPieData = [
    { name: "Delivered", value: orderStats.delivered || 0, color: "#10b981" },
    { name: "Processing", value: orderStats.processing || 0, color: "#3b82f6" },
    { name: "Shipped", value: orderStats.shipped || 0, color: "#f59e0b" },
    { name: "Pending", value: orderStats.pending || 0, color: "#8b5cf6" },
  ].filter((item) => item.value > 0);
  
  if (orderPieData.length === 0) {
    orderPieData.push({ name: "No Orders", value: 1, color: "#e5e7eb" });
  }

  const COLORS = orderPieData.map((d) => d.color);

  // Status badge colors with crisp borders and dark readable text
  const statusColors = {
    delivered: "text-emerald-800 bg-emerald-50 border-emerald-300",
    processing: "text-blue-800 bg-blue-50 border-blue-300",
    shipped: "text-amber-800 bg-amber-50 border-amber-300",
    pending: "text-purple-800 bg-purple-50 border-purple-300",
    cancelled: "text-rose-800 bg-rose-50 border-rose-300",
  };

  const catColors = [
    "bg-purple-600",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
  ];

  return (
    <div className="min-h-full bg-slate-100/70 font-sans text-slate-900 selection:bg-purple-100 p-4 md:p-6 lg:p-8 rounded-2xl border border-slate-200/90 my-2 lg:my-3 mx-2 lg:mx-3">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1.5 flex items-center gap-2.5 tracking-tight">
          Welcome back, admin! <span>👋</span>
        </h2>
        <p className="text-sm md:text-base text-slate-600 font-medium">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Top Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex items-center gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}>
                <Icon size={24} className={stat.iconColor} />
              </div>
              <div className="flex flex-col z-10 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{stat.label}</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight mb-1.5">{stat.value}</span>
                <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                    stat.isPositive 
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}>
                    {stat.isPositive ? '▲' : '▼'} {stat.change.replace(/[+▲▼]/g, '').trim().split(' ')[0]}
                  </span>
                  <span className="text-slate-500 font-medium text-[11px]">
                    {stat.change.replace(/[+▲▼]/g, '').trim().split(' ').slice(1).join(' ')}
                  </span>
                </div>
              </div>
              {/* Decorative faint circle at bottom right */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.08] ${stat.iconBg}`} />
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#ffffff', color: '#0f172a' }}
                  itemStyle={{ color: '#6d28d9', fontWeight: 700 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Overview Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#ffffff', color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{counts.totalOrders}</span>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Orders</span>
            </div>
          </div>

          <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
            {orderPieData.map((item, index) => {
              if (item.name === "No Orders") return null;
              const total = orderPieData.reduce((sum, d) => sum + d.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shadow-2xs" style={{ backgroundColor: item.color }}></span>
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

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Top Products</h3>
            <button 
              onClick={() => navigate('/admin/products')} 
              className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
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
            {topProducts.slice(0, 4).map((product, index) => (
              <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/70 p-1.5 -mx-1.5 rounded-lg transition-colors">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full bg-slate-200"></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={product.title}>{product.title}</h4>
                    <p className="text-[11px] font-medium text-slate-500">Popular</p>
                  </div>
                </div>
                <div className="flex gap-6 text-right text-xs flex-shrink-0">
                  <span className="font-semibold text-slate-700 w-12">{product.totalSold}</span>
                  <span className="font-bold text-slate-900 w-16">₹{Math.round(product.totalRevenue).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Orders</h3>
            <button 
              onClick={() => navigate('/admin/orders')} 
              className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
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
                {recentOrders.slice(0, 4).map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">#{order.orderId || order._id.toString().substring(0,6)}</td>
                    <td className="py-3 font-medium text-slate-700">{order.user?.username || 'Guest'}</td>
                    <td className="py-3 font-extrabold text-slate-900 text-right pr-4">₹{Math.round(order.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${statusColors[order.status] || "text-slate-700 bg-slate-100 border-slate-300"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sales by Category</h3>
            <button 
              onClick={() => navigate('/admin/catalog')} 
              className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer"
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
                    <span className="font-extrabold text-slate-900 w-16 text-right">₹{Math.round(item.revenue).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div className={`h-2 rounded-full ${catColors[index % catColors.length]}`} style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {salesByCategory.length === 0 && (
              <p className="text-xs font-medium text-slate-500 text-center py-4">No category sales data.</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Sales Analytics</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Cross-metric performance</p>
          </div>
          <FilterSelect value={analyticsFilter} onChange={setAnalyticsFilter} large={false} />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsChart} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} dy={10} />
              <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} tickFormatter={(val) => `₹${val/1000}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#ffffff', color: '#0f172a' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Legend 
                verticalAlign="top" 
                align="left" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontWeight: 600, color: '#334155' }}
              />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#7c3aed" maxBarSize={14} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#2563eb" maxBarSize={14} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="customers" name="Customers" fill="#059669" maxBarSize={14} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;

