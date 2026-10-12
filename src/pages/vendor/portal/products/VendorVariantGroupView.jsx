import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Package, Image as ImageIcon, Info, WalletCards, 
  ShoppingCart, Box, Users, ChevronDown, Activity, Star, Edit2, Trash2, MoreVertical,
  RotateCcw, CreditCard
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../../../../api/axiosConfig';

const VendorVariantGroupView = () => {
  const { id, primaryOptionId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('3 Months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const [productRes, variantsRes, analyticsRes] = await Promise.all([
          api.get(`/vendor/portal/products/${id}`),
          api.get(`/vendor/portal/products/${id}/variants`),
          api.get(`/vendor/portal/products/${id}/variant-group/${primaryOptionId}/analytics`).catch(() => null)
        ]);

        if (productRes.data.success) {
          const pData = productRes.data.data.product || productRes.data.data;
          setProduct(pData);
        }

        if (variantsRes.data.success) {
          const allVariants = variantsRes.data.data || [];
          const filtered = allVariants.filter(variant => {
            let pOptId = 'default';
            if (variant.attributes && variant.attributes.length > 0) {
              const visualAttr = variant.attributes.find(a => {
                const name = a.attribute?.name?.toLowerCase();
                return name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || a.attribute?.fieldType === 'color';
              });
              const fragranceAttr = variant.attributes.find(a => {
                const name = a.attribute?.name?.toLowerCase();
                return name === 'fragrance' || name === 'fragrance / scent' || name === 'scent';
              });
              const sizeAttr = variant.attributes.find(a => {
                const name = a.attribute?.name?.toLowerCase();
                return name === 'size / net quantity' || name === 'net quantity' || name === 'size';
              });
              const primaryAttr = visualAttr || fragranceAttr || sizeAttr || variant.attributes[0];
              if (primaryAttr) {
                pOptId = primaryAttr.option?._id?.toString() || primaryAttr.option?.toString() || 'default';
              }
            }
            return pOptId === primaryOptionId;
          });
          setVariants(filtered);
        }

        if (analyticsRes && analyticsRes.data && analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching variant details:', error);
        toast.error('Failed to load variant details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id, primaryOptionId]);

  const groupDetails = useMemo(() => {
    if (variants.length === 0) return null;
    let groupName = 'Standard';
    let groupLabel = 'Option';
    const firstVariant = variants[0];
    if (primaryOptionId !== 'default') {
      const visualAttr = firstVariant.attributes?.find(a => {
        const name = a.attribute?.name?.toLowerCase();
        return name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || a.attribute?.fieldType === 'color';
      });
      const fragranceAttr = firstVariant.attributes?.find(a => {
        const name = a.attribute?.name?.toLowerCase();
        return name === 'fragrance' || name === 'fragrance / scent' || name === 'scent';
      });
      const sizeAttr = firstVariant.attributes?.find(a => {
        const name = a.attribute?.name?.toLowerCase();
        return name === 'size / net quantity' || name === 'net quantity' || name === 'size';
      });
      const primaryAttr = visualAttr || fragranceAttr || sizeAttr || firstVariant.attributes?.[0];
      if (primaryAttr && primaryAttr.option) {
        groupName = primaryAttr.option.displayName || primaryAttr.option.storedValue;
        groupLabel = primaryAttr.attribute?.name || 'Option';
      }
    }
    const mainImage = firstVariant.mainImage?.url || null;
    const galleryImages = firstVariant.galleryImages?.map(img => img.url).filter(Boolean) || [];
    return { groupName, groupLabel, mainImage, galleryImages, firstVariant };
  }, [variants, primaryOptionId]);

  const { 
    counts = {}, 
    salesChart = [], 
    timeSeries = {},
    orderStats = {}, 
    inventorySummary = {}, 
    recentOrders = [], 
    reviews = [],
    stockHistory = [],
    qa = [],
    activity = [] 
  } = analytics || {};

  const METRIC_CONFIG = {
    revenue: {
      label: 'Revenue',
      color: '#fe4a03',
      yFormatter: (val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`,
      tooltipFormatter: (val) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Revenue'],
    },
    orders: {
      label: 'Orders',
      color: '#3b82f6',
      yFormatter: (val) => (Number.isInteger(val) ? val : ''),
      tooltipFormatter: (val) => [`${val} orders`, 'Orders'],
    },
    units: {
      label: 'Units Sold',
      color: '#10b981',
      yFormatter: (val) => (Number.isInteger(val) ? val : ''),
      tooltipFormatter: (val) => [`${val} units`, 'Units Sold'],
    },
    avgOrderValue: {
      label: 'Avg. Order Value',
      color: '#f59e0b',
      yFormatter: (val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`,
      tooltipFormatter: (val) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Avg. Order Value'],
    },
  };

  const activeChartData = useMemo(() => {
    if (timeSeries && timeSeries[timeRange] && timeSeries[timeRange].length > 0) {
      return timeSeries[timeRange];
    }
    return salesChart || [];
  }, [timeSeries, timeRange, salesChart]);

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">Loading variant details...</p>
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[400px]">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Variant Group Not Found</h3>
        <button onClick={() => navigate('/vendor/portal/products')} className="mt-6 px-6 py-2 bg-[#fe4a03] text-white rounded-xl">Back to Products</button>
      </div>
    );
  }

  // Donut chart colors
  const orderPieData = [
    { name: "Delivered", value: orderStats.delivered || 0, color: "#10b981" },
    { name: "Processing", value: orderStats.processing || 0, color: "#3b82f6" },
    { name: "Cancelled", value: orderStats.cancelled || 0, color: "#ef4444" },
    { name: "Shipped", value: orderStats.shipped || 0, color: "#f59e0b" },
    { name: "Pending", value: orderStats.pending || 0, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  if (orderPieData.length === 0) {
    orderPieData.push({ name: "No Orders", value: 1, color: "#e5e7eb" });
  }
  const COLORS = orderPieData.map(d => d.color);

  const statusColors = {
    delivered: "text-emerald-600 bg-emerald-50",
    processing: "text-blue-600 bg-blue-50",
    shipped: "text-amber-600 bg-amber-50",
    pending: "text-purple-600 bg-purple-50",
    cancelled: "text-rose-600 bg-rose-50",
  };

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1) : "0.0";
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++; });
  const getRatingPct = (r) => totalReviews > 0 ? ((ratingCounts[r] / totalReviews) * 100).toFixed(0) : "0";

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-6 bg-[#fafafa]">
      
      {/* 3. TOP HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => navigate('/vendor/portal/products')}>
          <ArrowLeft size={16} /> Back to Products
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/vendor/portal/products/${id}/variants`, { state: { action: 'edit', primaryOptionId, isolatedMode: true } })}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-orange-200 text-[#fe4a03] bg-white rounded-md hover:bg-orange-50 text-xs font-bold transition-colors cursor-pointer"
          >
            <Edit2 size={12} /> Edit Variant
          </button>
          <button 
            onClick={() => navigate(`/vendor/portal/products/${id}/variants`, { state: { action: 'delete', primaryOptionId } })}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-red-200 text-red-500 bg-white rounded-md hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 size={12} /> Delete Variant
          </button>
          <button 
            onClick={() => navigate(`/vendor/portal/products/${id}/view`)}
            className="p-1.5 border border-gray-200 text-gray-500 bg-white rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
            title="View Product"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar space-y-5">
        
        {/* 4 & 5. VARIANT HEADER CARD */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
          {/* Left: Media */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="w-36 h-32 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              {groupDetails.mainImage ? (
                <img src={groupDetails.mainImage} alt="Main" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex gap-2">
              {groupDetails.galleryImages.slice(0, 3).map((img, idx) => (
                <div key={idx} className="w-10 h-10 rounded-md bg-gray-50 border border-gray-100 overflow-hidden">
                  <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {groupDetails.galleryImages.length > 3 && (
                <div className="w-10 h-10 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{groupDetails.galleryImages.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col flex-1 py-1">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">{product?.title} - {groupDetails.groupName}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${variants[0]?.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {variants[0]?.status || 'Active'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 font-medium mb-3">
              <span className="font-bold text-gray-600">{groupDetails.firstVariant?.sku || 'SKU-N/A'}</span>
              <span className="text-gray-300">•</span>
              <span>{product?.brand?.name || 'SwagSync'}</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star size={12} fill="currentColor" /> {avgRating} <span className="text-[#fe4a03] hover:underline cursor-pointer font-medium" onClick={() => navigate('/vendor/portal/reviews')}>({totalReviews} Reviews)</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400 font-medium mb-5">
              <span>{product?.department?.name || 'Department'}</span>
              <span className="text-gray-300">•</span>
              <span>{product?.category?.name || 'Category'}</span>
              <span className="text-gray-300">•</span>
              <span>Created {new Date(product?.createdAt || Date.now()).toLocaleDateString('en-US', {month: 'short', day:'2-digit', year:'numeric'})}</span>
            </div>

            {/* Compact Specifications */}
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {groupDetails.firstVariant?.attributes?.map((attr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Box size={16} className="text-gray-400" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{attr.attribute?.name || 'Attribute'}</span>
                    <span className="text-xs font-bold text-slate-700">{attr.option?.displayName || attr.option?.storedValue || 'N/A'}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <WalletCards size={16} className="text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price Range</span>
                  <span className="text-xs font-bold text-slate-700">
                    ₹{Math.min(...variants.map(v => v.price))} - ₹{Math.max(...variants.map(v => v.price))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            { label: 'Total Sales', value: `₹${(counts.totalSales || 0).toLocaleString()}`, change: '-', isPositive: true, icon: WalletCards, bg: 'bg-purple-100', color: 'text-purple-600' },
            { label: 'Units Sold', value: counts.unitsSold || 0, change: '-', isPositive: true, icon: ShoppingCart, bg: 'bg-blue-100', color: 'text-blue-600' },
            { label: 'Returns', value: counts.returns || 0, change: '-', isPositive: false, icon: RotateCcw, bg: 'bg-orange-100', color: 'text-orange-500' },
            { label: 'Refund Amount', value: `₹${(counts.refundAmount || 0).toLocaleString()}`, change: '-', isPositive: false, icon: CreditCard, bg: 'bg-emerald-100', color: 'text-emerald-600' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{stat.value}</h3>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[11px] font-bold ${stat.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{stat.change}</span>
                <span className="text-[10px] font-medium text-gray-400">vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* 7 & 8. SALES PERFORMANCE + ORDER STATUS BREAKDOWN */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Sales Performance Chart */}
          <div className="xl:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Sales Performance</h3>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                {['7 Days', '30 Days', '3 Months', '6 Months', '1 Year'].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      timeRange === range
                        ? 'bg-orange-50 text-[#fe4a03] shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {range}
                  </button>
                ))}

                <div className="relative ml-2">
                  <button
                    type="button"
                    onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 text-[11px] font-bold text-gray-700 bg-white transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: METRIC_CONFIG[selectedMetric]?.color || '#fe4a03' }}
                    />
                    <span>{METRIC_CONFIG[selectedMetric]?.label || 'Revenue'}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${isMetricDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isMetricDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setIsMetricDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-1.5 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30">
                        {Object.entries(METRIC_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedMetric(key);
                              setIsMetricDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 hover:bg-orange-50 hover:text-[#fe4a03] transition-colors ${
                              selectedMetric === key ? 'text-[#fe4a03] bg-orange-50/70 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                            {config.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVendorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={METRIC_CONFIG[selectedMetric]?.color || '#fe4a03'} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={METRIC_CONFIG[selectedMetric]?.color || '#fe4a03'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={5} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={METRIC_CONFIG[selectedMetric]?.yFormatter}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={METRIC_CONFIG[selectedMetric]?.tooltipFormatter}
                  />
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke={METRIC_CONFIG[selectedMetric]?.color || '#fe4a03'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVendorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Sales Overview directly below chart - Interactive metric quick selectors */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 px-2">
              <button
                type="button"
                onClick={() => setSelectedMetric('revenue')}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left ${
                  selectedMetric === 'revenue' ? 'bg-orange-50/80 ring-1 ring-[#fe4a03]/40' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#fe4a03] shrink-0"></span>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block leading-none">Revenue</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">₹{(counts.totalSales || 0).toLocaleString()}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMetric('orders')}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left ${
                  selectedMetric === 'orders' ? 'bg-blue-50/80 ring-1 ring-blue-500/40' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block leading-none">Orders</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">{counts.totalOrders || 0}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMetric('units')}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left ${
                  selectedMetric === 'units' ? 'bg-emerald-50/80 ring-1 ring-emerald-500/40' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block leading-none">Units Sold</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">{counts.unitsSold || 0}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMetric('avgOrderValue')}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left ${
                  selectedMetric === 'avgOrderValue' ? 'bg-amber-50/80 ring-1 ring-amber-500/40' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase block leading-none">Avg. Order Value</span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800">₹{counts.avgOrderValue || 0}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Order Status Breakdown</h3>
            <div className="relative h-[160px] flex justify-center items-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                    {orderPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-800">{counts.totalOrders || 0}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Orders</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-auto">
              {orderPieData.map((item, index) => {
                if (item.name === "No Orders") return null;
                const total = orderPieData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={index} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-500 font-semibold">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 9. SALES OVERVIEW TABS */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex gap-6 border-b border-gray-100 px-5 pt-4">
            <button
              type="button"
              className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                activeTab === 'sales' ? 'border-[#fe4a03] text-[#fe4a03]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Overview
            </button>
            <button
              type="button"
              className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                activeTab === 'returns' ? 'border-[#fe4a03] text-[#fe4a03]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('returns')}
            >
              Returns Overview
            </button>
            <button
              type="button"
              className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
                activeTab === 'refunds' ? 'border-[#fe4a03] text-[#fe4a03]' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('refunds')}
            >
              Refunds Overview
            </button>
          </div>
          
          <div className="p-5">
            {activeTab === 'sales' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</span>
                  <span className="text-base font-extrabold text-slate-800">₹{(counts.totalSales || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1">From completed orders</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</span>
                  <span className="text-base font-extrabold text-slate-800">{counts.totalOrders || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Unique orders placed</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Units Sold</span>
                  <span className="text-base font-extrabold text-slate-800">{counts.unitsSold || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Items across variants</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Average Order Value</span>
                  <span className="text-base font-extrabold text-slate-800">₹{counts.avgOrderValue || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Per transaction</span>
                </div>
              </div>
            )}
            {activeTab === 'returns' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Return Requests</span>
                  <span className="text-base font-extrabold text-slate-800">{counts.returns || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Total customer claims</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Return Rate</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {counts.returnRate !== undefined ? counts.returnRate : (counts.totalOrders > 0 ? ((counts.returns / counts.totalOrders) * 100).toFixed(1) : 0)}%
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">Relative to total orders</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Exchanges / Replacements</span>
                  <span className="text-base font-extrabold text-slate-800">{counts.exchangeCount || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Size/color replacement</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">QC Passed Returns</span>
                  <span className="text-base font-extrabold text-emerald-600">{counts.qcPassedCount || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Verified by warehouse</span>
                </div>
              </div>
            )}
            {activeTab === 'refunds' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Refund Amount</span>
                  <span className="text-base font-extrabold text-slate-800">₹{(counts.refundAmount || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-rose-500 font-semibold mt-1">Total refunded payout</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Refunded Orders</span>
                  <span className="text-base font-extrabold text-slate-800">{counts.refundedOrdersCount || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Settled or initiated</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Refund / Return</span>
                  <span className="text-base font-extrabold text-slate-800">₹{(counts.avgRefundPerReturn || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Average per claim</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Return Claims</span>
                  <span className="text-base font-extrabold text-slate-800">{counts.returns || 0}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Items received back</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 10. INVENTORY SUMMARY & STOCK HISTORY */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Inventory Summary */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Inventory Summary</h3>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Total Products', value: variants.length, color: 'text-slate-800 font-bold' },
                { label: 'Available', value: inventorySummary.available !== undefined ? inventorySummary.available : variants.reduce((s, v) => s + (v.stock || 0), 0), color: 'text-emerald-500 font-bold' },
                { label: 'Reserved', value: inventorySummary.reserved || 0, color: 'text-rose-500 font-bold' },
                { label: 'Low Stock', value: variants.filter(v => v.stock > 0 && v.stock <= 5).length, color: 'text-amber-500 font-bold' },
                { label: 'Out of Stock', value: variants.filter(v => v.stock === 0).length, color: 'text-slate-500 font-bold' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">{row.label}</span>
                  <span className={row.color}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                <span>Total Stock</span>
                <span>{variants.reduce((s, v) => s + (v.stock || 0), 0)}</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#fe4a03] h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-gray-400">Warehouse: </span>
                <span className="font-bold text-slate-700">{inventorySummary.warehouse || 'Main Warehouse'}</span>
              </div>
              <div>
                <span className="text-gray-400">Supplier SKU: </span>
                <span className="font-bold text-slate-700">{groupDetails.firstVariant?.sku || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Stock History */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">Stock History</h3>
                <span 
                  className="text-xs text-[#fe4a03] font-bold cursor-pointer hover:underline"
                  onClick={() => navigate('/vendor/portal/inventory')}
                >
                  View All
                </span>
              </div>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {variants && variants.length > 0 ? (
                  variants.map((v, idx) => {
                    const sizeAttr = v.attributes?.find(a => 
                      ['size', 'size / net quantity', 'net quantity'].includes(a.attribute?.name?.toLowerCase())
                    );
                    const sizeLabel = sizeAttr?.option?.displayName || sizeAttr?.option?.storedValue || `Variant ${idx + 1}`;
                    const isLow = (v.stock || 0) > 0 && (v.stock || 0) <= 5;
                    const isOut = (v.stock || 0) === 0;

                    return (
                      <div key={v._id || idx} className="p-3 bg-gray-50/80 rounded-lg border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isOut ? 'bg-rose-100 text-rose-600' : isLow ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            <Box size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{v.sku || 'SKU-N/A'} ({sizeLabel})</span>
                            <span className="text-[10px] text-gray-400">
                              Updated {new Date(v.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-extrabold text-slate-800">{v.stock || 0} units</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            isOut ? 'text-rose-600 bg-rose-50' : isLow ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                          }`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <p className="text-xs text-gray-400">No stock history records found.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
              <span>Managed SKUs: {variants.length}</span>
              <span className="font-bold text-slate-700">Total: {variants.reduce((s, v) => s + (v.stock || 0), 0)} units</span>
            </div>
          </div>
        </div>

        {/* 11. CUSTOMER REVIEWS & RECENT ORDERS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Customer Reviews */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Customer Reviews</h3>
              <span 
                className="text-xs text-[#fe4a03] font-bold cursor-pointer hover:underline"
                onClick={() => navigate('/vendor/portal/reviews')}
              >
                View All
              </span>
            </div>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-extrabold text-slate-800">{avgRating}</span>
                <div className="flex text-yellow-400 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(avgRating) ? "currentColor" : "none"} className={i < Math.round(avgRating) ? "text-yellow-400" : "text-gray-200"} />
                  ))}
                </div>
                <span className="text-[10px] text-gray-400 font-bold">{totalReviews} Reviews</span>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                    <span className="w-2">{stars}</span>
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full rounded-full" style={{ width: `${getRatingPct(stars)}%` }}></div>
                    </div>
                    <span className="w-6 text-right">{getRatingPct(stars)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {reviews && reviews.length > 0 ? (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {reviews.map((rev, idx) => (
                  <div key={rev._id || idx} className="p-3 bg-gray-50/80 rounded-lg border border-gray-100 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-100 text-[#fe4a03] flex items-center justify-center text-[10px] font-bold uppercase">
                          {rev.user?.username?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{rev.user?.username || 'Customer'}</span>
                        {rev.verifiedBuyer && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Verified Buyer</span>
                        )}
                      </div>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "text-yellow-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    {rev.review && (
                      <p className="text-xs text-slate-600 italic">"{rev.review}"</p>
                    )}
                    <span className="text-[10px] text-gray-400">
                      {new Date(rev.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs text-gray-400">No customer reviews yet.</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Recent Orders</h3>
              <span 
                className="text-xs text-[#fe4a03] font-bold cursor-pointer hover:underline"
                onClick={() => navigate('/vendor/portal/orders')}
              >
                View All
              </span>
            </div>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {recentOrders.map((ord, idx) => (
                  <div key={ord._id || idx} className="p-3 bg-gray-50/80 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-[#fe4a03] flex items-center justify-center font-bold text-xs">
                        <ShoppingCart size={14} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">
                          {ord.orderId || `#${(ord._id || '').toString().slice(-6).toUpperCase()}`}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {ord.user?.username || ord.user?.email || 'Customer'} • {new Date(ord.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-extrabold text-slate-800">₹{(ord.amount || 0).toLocaleString()}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        statusColors[ord.status?.toLowerCase()] || 'text-gray-600 bg-gray-100'
                      }`}>
                        {ord.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <p className="text-xs text-gray-400">No recent orders found.</p>
              </div>
            )}
          </div>
        </div>

        {/* 12. QUESTIONS & ACTIVITY */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Questions & Answers</h3>
              <span 
                className="text-xs text-[#fe4a03] font-bold cursor-pointer hover:underline"
                onClick={() => navigate('/vendor/portal/tickets')}
              >
                View All
              </span>
            </div>
            {qa && qa.length > 0 ? (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {qa.map((item, idx) => (
                  <div key={item._id || idx} className="p-3 bg-gray-50/80 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{item.subject || 'Product Inquiry'}</span>
                      <span className="text-[10px] text-gray-400">
                        Ticket {item.ticketId || 'N/A'} • {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      {item.status || 'Open'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xs text-gray-400">No questions or inquiries found.</p>
                <button
                  type="button"
                  onClick={() => navigate('/vendor/portal/tickets')}
                  className="mt-2 text-[11px] font-bold text-[#fe4a03] hover:underline cursor-pointer"
                >
                  Manage Tickets
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Product Activity</h3>
              <span 
                className="text-xs text-[#fe4a03] font-bold cursor-pointer hover:underline"
                onClick={() => navigate(`/vendor/portal/products/${id}/view`)}
              >
                View All
              </span>
            </div>
            {activity && activity.length > 0 ? (
              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {activity.map((act, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50/80 rounded-lg border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${
                        act.type === 'order' ? 'bg-blue-500' : act.type === 'return' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{act.action}</span>
                        <span className="text-[10px] text-gray-400">{act.description}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {new Date(act.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <p className="text-xs text-gray-400">No recent activity.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorVariantGroupView;
