import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Edit2, Plus, MoreVertical, CheckCircle2, 
  AlertCircle, Package, Box, Eye, Filter, ChevronLeft, ChevronRight, Image as ImageIcon, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageLoader from '../../../../components/common/PageLoader';
import DataTable from '../../../../components/admin/ui/DataTable';
import StatusBadge from '../../../../components/admin/ui/StatusBadge';
import api from '../../../../api/axiosConfig';

const VendorProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getVariantGroupId = (variant) => {
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
    return pOptId;
  };
  
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        const [productRes, variantsRes] = await Promise.all([
          api.get(`/vendor/portal/products/${id}`),
          api.get(`/vendor/portal/products/${id}/variants`)
        ]);

        if (productRes.data.success) {
          const pData = productRes.data.data.product || productRes.data.data;
          setProduct(pData);
        }
        
        if (variantsRes.data.success) {
          setVariants(variantsRes.data.data || variantsRes.data.variants || []);
        }
      } catch (error) {
        console.error('Error fetching vendor product details:', error);
        toast.error('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProductData();
  }, [id]);

  // Aggregate Unique Attributes for dynamic columns and filters
  const uniqueAttributes = useMemo(() => {
    if (!variants.length) return {};
    const attrs = {};
    variants.forEach(v => {
      v.attributes?.forEach(a => {
        const attrName = a.attribute?.name || 'Unknown';
        const optName = a.option?.displayName || a.option?.storedValue || 'Unknown';
        if (!attrs[attrName]) attrs[attrName] = new Set();
        attrs[attrName].add(optName);
      });
    });
    return attrs;
  }, [variants]);

  // Filtering & Sorting Logic
  const filteredVariants = useMemo(() => {
    let result = [...variants];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.sku?.toLowerCase().includes(q) || 
        v.attributes?.some(a => 
          (a.option?.displayName?.toLowerCase() || '').includes(q) ||
          (a.option?.storedValue?.toLowerCase() || '').includes(q)
        )
      );
    }

    Object.entries(filters).forEach(([attrName, selectedOpt]) => {
      if (!selectedOpt) return;
      if (attrName === 'status') {
        result = result.filter(v => v.status?.toLowerCase() === selectedOpt.toLowerCase());
      } else {
        result = result.filter(v => 
          v.attributes?.some(a => 
            a.attribute?.name === attrName && 
            (a.option?.displayName === selectedOpt || a.option?.storedValue === selectedOpt)
          )
        );
      }
    });

    if (sortOption) {
      if (sortOption === 'Price: Low to High') result.sort((a, b) => a.price - b.price);
      else if (sortOption === 'Price: High to Low') result.sort((a, b) => b.price - a.price);
      else if (sortOption === 'Stock: Low to High') result.sort((a, b) => a.stock - b.stock);
      else if (sortOption === 'Stock: High to Low') result.sort((a, b) => b.stock - a.stock);
    }

    return result;
  }, [variants, searchQuery, filters, sortOption]);

  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage) || 1;
  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVariants.slice(start, start + itemsPerPage);
  }, [filteredVariants, currentPage, itemsPerPage]);

  const totalVariants = variants.length;
  const activeVariants = variants.filter(v => v.status === 'Active').length;
  const outOfStock = variants.filter(v => v.stock === 0).length;
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  if (isLoading) return <PageLoader />;

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Product Not Found</h2>
        <p className="text-gray-400 mt-1">The requested product could not be loaded.</p>
        <button onClick={() => navigate('/vendor/portal/products')} className="mt-4 px-4 py-2 bg-[#fe4a03] text-white rounded-xl">Back to Products</button>
      </div>
    );
  }

  const dynamicAttrNames = Object.keys(uniqueAttributes);

  const columns = [
    {
      header: 'VARIANT',
      accessor: 'variant',
      align: 'left',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            {row.mainImage?.url ? (
              <img src={row.mainImage.url} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-800 text-[13px] line-clamp-1">{product.title}</span>
            <span className="text-[11px] font-medium text-gray-500">
              {row.attributes?.map(a => a.option?.displayName || a.option?.storedValue).join(' / ')}
            </span>
          </div>
        </div>
      )
    },

    ...dynamicAttrNames.map(attrName => ({
      header: attrName.toUpperCase(),
      accessor: `attr_${attrName}`,
      align: 'center',
      render: (row) => {
        const match = row.attributes?.find(a => a.attribute?.name === attrName);
        const val = match?.option?.displayName || match?.option?.storedValue || '-';
        if (attrName.toLowerCase() === 'color' && val !== '-') {
          return (
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: val.toLowerCase().replace(' ', '') }}></span>
              <span className="text-slate-700 font-bold text-[12px]">{val}</span>
            </div>
          );
        }
        return <span className="text-slate-700 font-bold text-[12px]">{val}</span>;
      }
    })),
    { 
      header: 'PRICE', 
      accessor: 'price', 
      align: 'center',
      render: (row) => <span className="text-slate-900 font-extrabold text-[13px]">₹{row.price.toLocaleString()}</span> 
    },
    { 
      header: 'STOCK', 
      accessor: 'stock', 
      align: 'center',
      render: (row) => <span className={`font-extrabold text-[13px] ${row.stock > 0 ? "text-emerald-500" : "text-rose-500"}`}>{row.stock}</span> 
    },
    { 
      header: 'STATUS', 
      accessor: 'status', 
      align: 'center',
      render: (row) => <StatusBadge status={(row.status || 'Active').toLowerCase()} /> 
    },
    { 
      header: 'ACTIONS', 
      accessor: 'actions', 
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center">
          <button 
            onClick={() => {
              const variantGroupId = getVariantGroupId(row);
              if (!variantGroupId) {
                console.error("Unable to determine variant group ID", row);
                return;
              }
              navigate(`/vendor/portal/products/${product._id}/variant-group/${variantGroupId}/view`);
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-[#fe4a03] border border-[#fe4a03]/30 hover:bg-[#fe4a03]/10 rounded-xl transition-colors cursor-pointer"
            title="View Variant"
          >
            <Eye size={14}/> View
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#fafafa]">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:px-8">

        {/* 2. Header & Actions */}
        <div className="flex flex-col mb-8">
          <button 
            onClick={() => navigate('/vendor/portal/products')} 
            className="flex items-center gap-1.5 text-[13px] font-bold text-[#fe4a03] hover:text-[#e03f00] transition-colors w-fit mb-6 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Products
          </button>

          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Image */}
            {variants[0]?.mainImage?.url ? (
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden p-2">
                <img src={variants[0].mainImage.url} alt={product.title} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 p-2">
                <ImageIcon className="w-8 h-8 text-gray-300" />
              </div>
            )}

            {/* Content */}
            <div className="flex flex-col flex-1 pt-1">
              <h1 className="text-[28px] lg:text-[34px] font-[800] text-slate-900 tracking-tight leading-tight mb-2.5">
                {product.title}
              </h1>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-slate-600">
                  {product.productId && (
                    <>
                      <span className="text-slate-700">{product.productId}</span>
                      <span className="text-gray-300">•</span>
                    </>
                  )}
                  {product.brand?.name && (
                    <>
                      <span className="uppercase tracking-wider">{product.brand.name}</span>
                      <span className="text-gray-300">•</span>
                    </>
                  )}
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star size={13} className="fill-amber-500" />
                    {product.ratingAverage?.toFixed(1) || '0.0'} 
                    <span className="text-[#fe4a03] ml-0.5">({product.ratingCount || 0} Reviews)</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-500">
                  {product.department?.name && (
                    <>
                      <span>{product.department.name}</span>
                      <span className="text-gray-300">•</span>
                    </>
                  )}
                  {product.category?.name && (
                    <>
                      <span>{product.category.name}</span>
                      <span className="text-gray-300">•</span>
                    </>
                  )}
                  {product.createdAt && <span>Created {new Date(product.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Variants */}
          <div className="bg-white rounded-[12px] p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex flex-col items-center justify-center shrink-0">
              <Package size={20} className="text-[#fe4a03]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Variants</span>
              <span className="text-xl font-extrabold text-slate-800 leading-none">{totalVariants}</span>
              <span className="text-[10px] font-medium text-gray-400 mt-1">All variants</span>
            </div>
          </div>
          {/* Active Variants */}
          <div className="bg-white rounded-[12px] p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex flex-col items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Active Variants</span>
              <span className="text-xl font-extrabold text-slate-800 leading-none">{activeVariants}</span>
              <span className="text-[10px] font-medium text-gray-400 mt-1">In stock</span>
            </div>
          </div>
          {/* Out of Stock */}
          <div className="bg-white rounded-[12px] p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex flex-col items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-rose-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Out of Stock</span>
              <span className="text-xl font-extrabold text-slate-800 leading-none">{outOfStock}</span>
              <span className="text-[10px] font-medium text-gray-400 mt-1">Inactive</span>
            </div>
          </div>
          {/* Total Stock */}
          <div className="bg-white rounded-[12px] p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center shrink-0">
              <Box size={20} className="text-blue-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Stock</span>
              <span className="text-xl font-extrabold text-slate-800 leading-none">{totalStock}</span>
              <span className="text-[10px] font-medium text-gray-400 mt-1">Across variants</span>
            </div>
          </div>
        </div>

        {/* 4. All Variants Table Section */}
        <div className="bg-white rounded-[16px] border border-gray-100 shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-slate-800 mb-4">All Variants</h2>
            
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search variants..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#fe4a03] focus:border-[#fe4a03] transition-shadow outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {Object.entries(uniqueAttributes).slice(0, 3).map(([attrName, optionsSet]) => (
                  <select 
                    key={attrName} 
                    value={filters[attrName] || ''} 
                    onChange={(e) => setFilters({...filters, [attrName]: e.target.value})}
                    className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-slate-700 bg-white appearance-none cursor-pointer hover:bg-gray-50 outline-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                  >
                    <option value="">{attrName}</option>
                    {[...optionsSet].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ))}

                <select 
                  value={filters.status || ''} 
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-slate-700 bg-white appearance-none cursor-pointer hover:bg-gray-50 outline-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                >
                  <option value="">Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-slate-700 bg-white appearance-none cursor-pointer hover:bg-gray-50 outline-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                >
                  <option value="">Sort by</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Stock: Low to High">Stock: Low to High</option>
                  <option value="Stock: High to Low">Stock: High to Low</option>
                </select>

                <button 
                  onClick={() => { setSearchQuery(''); setFilters({}); setSortOption(''); }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[#fe4a03] hover:bg-orange-50 rounded-xl transition-colors ml-auto lg:ml-2 border border-transparent cursor-pointer"
                >
                  <Filter size={14} /> Reset
                </button>
              </div>
            </div>
          </div>

          <DataTable 
            columns={columns} 
            data={paginatedVariants} 
            noBorders={true}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white rounded-b-[16px]">
            <span className="text-[12px] font-bold text-gray-500">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredVariants.length)} to {Math.min(currentPage * itemsPerPage, filteredVariants.length)} of {filteredVariants.length} variants
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-[10px] text-[13px] font-extrabold transition-colors ${
                        currentPage === page 
                          ? 'bg-[#fe4a03] text-white shadow-sm' 
                          : 'border border-gray-200 text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="text-gray-400 px-1 font-bold">...</span>;
                }
                return null;
              })}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorProductView;
