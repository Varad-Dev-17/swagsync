import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import DataTable from '../../../../components/admin/ui/DataTable';
import StatusBadge from '../../../../components/admin/ui/StatusBadge';

const VariantGroupView = () => {
  const { id, primaryOptionId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const [productRes, variantsRes, analyticsRes] = await Promise.all([
          axios.get(`${import.meta.env.PROD ? '' : 'http://localhost:8000'}/admin/products/${id}`, { withCredentials: true }),
          axios.get(`${import.meta.env.PROD ? '' : 'http://localhost:8000'}/admin/products/${id}/variants`, { withCredentials: true }),
          axios.get(`${import.meta.env.PROD ? '' : 'http://localhost:8000'}/admin/products/${id}/variant-group/${primaryOptionId}/analytics`, { withCredentials: true }).catch(() => null)
        ]);

        if (productRes.data.success) {
          setProduct(productRes.data.data.product);
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
                pOptId = primaryAttr.option?._id?.toString() || 'default';
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

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#4648d4] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">Loading variant details...</p>
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[400px]">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Variant Group Not Found</h3>
        <button onClick={() => navigate('/admin/products')} className="mt-6 px-6 py-2 bg-[#4648d4] text-white rounded-xl">Back to Products</button>
      </div>
    );
  }

  const { 
    counts = {}, 
    salesChart = [], 
    orderStats = {}, 
    inventorySummary = {}, 
    recentOrders = [], 
    reviews = [],
    stockHistory = [],
    qa = [],
    activity = [] 
  } = analytics || {};

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
        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => navigate('/admin/products')}>
          <ArrowLeft size={16} /> Back to Products
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/admin/products/${id}/variants`, { state: { action: 'edit', primaryOptionId, isolatedMode: true } })}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-purple-200 text-purple-600 bg-white rounded-md hover:bg-purple-50 text-xs font-bold transition-colors"
          >
            <Edit2 size={12} /> Edit Variant
          </button>
          <button 
            onClick={() => navigate(`/admin/products/${id}/variants`, { state: { action: 'delete', primaryOptionId } })}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-red-200 text-red-500 bg-white rounded-md hover:bg-red-50 text-xs font-bold transition-colors"
          >
            <Trash2 size={12} /> Delete Variant
          </button>
          <button className="p-1.5 border border-gray-200 text-gray-400 bg-white rounded-md hover:bg-gray-50 transition-colors">
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
                <Star size={12} fill="currentColor" /> {avgRating} <span className="text-purple-600 hover:underline cursor-pointer font-medium">({totalReviews} Reviews)</span>
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Sales Performance</h3>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                <span className="cursor-pointer hover:text-gray-800">7 Days</span>
                <span className="cursor-pointer hover:text-gray-800">30 Days</span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-md cursor-pointer">3 Months</span>
                <span className="cursor-pointer hover:text-gray-800">6 Months</span>
                <span className="cursor-pointer hover:text-gray-800">1 Year</span>
                <span className="ml-2 flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 text-gray-600">
                  Revenue <ChevronDown size={12} />
                </span>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4648d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4648d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={5} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#4648d4" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Sales Overview directly below chart */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center px-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">Revenue</span>
                <span className="text-sm font-extrabold text-slate-800 ml-1">₹{(counts.totalSales || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">Orders</span>
                <span className="text-sm font-extrabold text-slate-800 ml-1">{counts.totalOrders || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">Units Sold</span>
                <span className="text-sm font-extrabold text-slate-800 ml-1">{counts.unitsSold || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span className="text-[11px] font-bold text-gray-500 uppercase">Avg. Order Value</span>
                <span className="text-sm font-extrabold text-slate-800 ml-1">₹{counts.avgOrderValue || 0}</span>
              </div>
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
            <div className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${activeTab === 'sales' ? 'border-[#4648d4] text-[#4648d4]' : 'border-transparent text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab('sales')}>Sales Overview</div>
            <div className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${activeTab === 'returns' ? 'border-[#4648d4] text-[#4648d4]' : 'border-transparent text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab('returns')}>Returns Overview</div>
            <div className={`pb-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors ${activeTab === 'refunds' ? 'border-[#4648d4] text-[#4648d4]' : 'border-transparent text-gray-400 hover:text-gray-600'}`} onClick={() => setActiveTab('refunds')}>Refunds Overview</div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-gray-100 p-5">
            <div className="px-4 first:pl-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-lg font-extrabold text-slate-800 mb-0.5">₹{(counts.totalSales || 0).toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-gray-400">-</p>
            </div>
            <div className="px-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-lg font-extrabold text-slate-800 mb-0.5">{counts.totalOrders || 0}</p>
              <p className="text-[10px] font-semibold text-gray-400">-</p>
            </div>
            <div className="px-4">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Units Sold</p>
              <p className="text-lg font-extrabold text-slate-800 mb-0.5">{counts.unitsSold || 0}</p>
              <p className="text-[10px] font-semibold text-gray-400">-</p>
            </div>
            <div className="px-4 last:pr-0">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Average Order Value</p>
              <p className="text-lg font-extrabold text-slate-800 mb-0.5">₹{counts.avgOrderValue || 0}</p>
              <p className="text-[10px] font-semibold text-gray-400">-</p>
            </div>
          </div>
        </div>

        {/* 10. INVENTORY SUMMARY + STOCK HISTORY */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Inventory Summary</h3>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-50">
                <span className="text-gray-500 font-semibold">Total Products</span>
                <span className="font-extrabold text-slate-800">{inventorySummary.totalProducts || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-50">
                <span className="text-gray-500 font-semibold">Available</span>
                <span className="font-extrabold text-emerald-600">{inventorySummary.available || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-50">
                <span className="text-gray-500 font-semibold">Reserved</span>
                <span className="font-extrabold text-rose-500">{inventorySummary.reserved || 16}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-50">
                <span className="text-gray-500 font-semibold">Low Stock</span>
                <span className="font-extrabold text-orange-500">{inventorySummary.lowStock || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-50">
                <span className="text-gray-500 font-semibold">Out of Stock</span>
                <span className="font-extrabold text-slate-800">{inventorySummary.outOfStock || 0}</span>
              </div>
              
              <div className="py-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800">Total Stock</span>
                  <span className="font-extrabold text-slate-800">{inventorySummary.totalStock || 0}</span>
                </div>
                <div className="w-full bg-indigo-50 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[80%] rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Warehouse</span>
                  <span className="text-slate-700 font-bold text-right">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Last Restocked</span>
                  <span className="text-slate-700 font-bold text-right">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Supplier</span>
                  <span className="text-slate-700 font-bold text-right">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Supplier SKU</span>
                  <span className="text-slate-700 font-bold text-right">{groupDetails.firstVariant?.sku || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Stock History</h3>
              <span className="text-[11px] font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
            </div>
            {stockHistory.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="font-bold text-gray-400 border-b border-gray-100">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2 text-right">Change</th>
                      <th className="pb-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistory.map((sh, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 font-semibold text-slate-700">
                        <td className="py-2.5">{sh.date}</td>
                        <td className="py-2.5">{sh.type}</td>
                        <td className={`py-2.5 text-right ${sh.change > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{sh.change > 0 ? `+${sh.change}` : sh.change}</td>
                        <td className="py-2.5 text-right">{sh.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-400 font-semibold">
                No stock history records found.
              </div>
            )}
          </div>
        </div>

        {/* 11. CUSTOMER REVIEWS + RECENT ORDERS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Customer Reviews</h3>
              <span className="text-[11px] font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="flex gap-6 mb-4 pb-4 border-b border-gray-100">
              <div className="flex flex-col items-center justify-center shrink-0">
                <span className="text-3xl font-extrabold text-slate-800">{avgRating}</span>
                <div className="flex text-yellow-400 my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(parseFloat(avgRating)) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 font-bold">{totalReviews} Reviews</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 text-[10px] font-bold text-gray-500">
                {[5, 4, 3, 2, 1].map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="w-2">{r}</span>
                    <Star size={8} fill="currentColor" className="text-yellow-400"/> 
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${getRatingPct(r)}%` }}></div>
                    </div> 
                    <span className="w-6 text-right">{getRatingPct(r)}%</span>
                  </div>
                ))}
              </div>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="flex gap-3">
                    <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">
                      {r.user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < r.rating ? 'currentColor' : 'none'} />)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">{r.user?.username}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mb-1 line-clamp-2">{r.review}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{r.user?.username} • <span className="text-emerald-500">Verified Purchase</span> • {new Date(r.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-400 font-semibold">No reviews yet.</div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Recent Orders</h3>
              <span className="text-[11px] font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
            </div>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <th className="pb-2">Order ID</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2 text-right pr-4">Amount</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order._id} className="border-b border-gray-50 last:border-0 font-semibold text-slate-700">
                        <td className="py-2.5 text-indigo-600">#{order.orderId || order._id.toString().substring(0,6)}</td>
                        <td className="py-2.5">{order.user?.username || 'Guest'}</td>
                        <td className="py-2.5 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="py-2.5 text-right pr-4">₹{order.amount?.toLocaleString()}</td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wide uppercase ${statusColors[order.status] || "text-slate-600 bg-slate-100"}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-gray-400 font-semibold">No recent orders found.</div>
            )}
          </div>
        </div>

        {/* 12. QUESTIONS & ANSWERS + PRODUCT ACTIVITY */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Questions & Answers</h3>
              <span className="text-[11px] font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
            </div>
            {qa.length > 0 ? (
              <div></div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-4 text-xs text-gray-400 font-semibold">
                No questions found.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Product Activity</h3>
              <span className="text-[11px] font-bold text-purple-600 cursor-pointer hover:underline">View All</span>
            </div>
            {activity.length > 0 ? (
              <div></div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-4 text-xs text-gray-400 font-semibold">
                No recent activity.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VariantGroupView;
