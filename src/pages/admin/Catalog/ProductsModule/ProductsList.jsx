import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, PackageSearch, Eye, Star, Package, Layers } from 'lucide-react';
import DataTable from '../../../../components/admin/ui/DataTable';
import SearchToolbar from '../../../../components/admin/ui/SearchToolbar';
import StatusBadge from '../../../../components/admin/ui/StatusBadge';
import ConfirmDialog from '../../../../components/admin/ui/ConfirmDialog';
import Pagination from '../../../../components/admin/ui/Pagination';
import SearchableSelect from '../../../../components/admin/ui/SearchableSelect';


const ProductsList = () => {
  const navigate = useNavigate();
  
  // Data State
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('products');
  const [variantGroups, setVariantGroups] = useState([]);
  
  // Filter Options State
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  
  // Filter/Search State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Removed client-side variant grouping logic as it is now handled by the backend API

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [deptsRes, catsRes, brandsRes] = await Promise.all([
          axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/departments`, { params: { limit: 1000 } }),
          axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/categories`, { params: { limit: 1000 } }),
          axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/brands`, { params: { limit: 1000 } })
        ]);
        
        if (deptsRes.data.success) setDepartments(deptsRes.data.departments || deptsRes.data.data);
        if (catsRes.data.success) setCategories(catsRes.data.categories || catsRes.data.data);
        if (brandsRes.data.success) setBrands(brandsRes.data.brands || brandsRes.data.data);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = viewMode === 'variants' ? '/admin/products/variants/groups' : '/admin/products';
      const response = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}${endpoint}`, {
        params: {
          page: currentPage,
          limit,
          search: debouncedSearch,
          status: statusFilter,
          department: departmentFilter,
          category: categoryFilter,
          brand: brandFilter
        },
        withCredentials: true
      });
      
      if (response.data.success) {
        const responseData = response.data.data || {};
        const pagination = responseData.pagination || {};
        
        if (viewMode === 'products') {
          setProducts(responseData.products || []);
          setTotalItems(pagination.total || 0);
          setTotalPages(pagination.pages || 1);
        } else {
          setVariantGroups(responseData.variantGroups || []);
          setTotalItems(pagination.total || 0);
          setTotalPages(pagination.pages || 1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, departmentFilter, categoryFilter, brandFilter, viewMode]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page to 1 when filters or viewMode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, departmentFilter, categoryFilter, brandFilter, viewMode]);

  // Delete Handler
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/products/${productToDelete._id}`, {
        withCredentials: true
      });
      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to delete product';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'title',
      align: 'center',
      headerAlign: 'center',
      render: (row) => {
        let image = null;
        if (row.variants && row.variants.length > 0) {
          const variantWithImage = row.variants.find(v => v.mainImage?.url);
          if (variantWithImage) {
            image = variantWithImage.mainImage.url;
          }
        }
        return (
          <div className="flex items-center gap-3 py-0.5 w-[240px] max-w-full mx-auto text-left">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
              {image ? (
                <img src={image} alt={row.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <PackageSearch className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="font-medium text-slate-800 line-clamp-1">
                {row.title}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Brand',
      accessor: 'brand',
      render: (row) => <span className="text-xs text-gray-600">{row.brand?.name || 'N/A'}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <span className="text-xs text-gray-600">{row.department?.name || 'N/A'}</span>
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span className="text-xs text-gray-600">{row.category?.name || 'N/A'}</span>
    },

    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status.toLowerCase()} />
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/admin/products/${row._id}/view`)}
            className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-[#4648d4] border border-[#4648d4]/30 hover:bg-[#4648d4]/10 rounded-xl transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye size={14} />
            View
          </button>
          <button
            onClick={() => navigate(`/admin/products/${row._id}/edit`)}
            className="p-1.5 text-gray-400 hover:text-[#4648d4] hover:bg-[#4648d4]/10 rounded-lg transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  const variantColumns = [
    {
      header: 'ID',
      accessor: 'productDisplayId',
      render: (row) => (
        <span className="text-xs font-medium text-gray-500">{row.productDisplayId || row.productId}</span>
      )
    },
    {
      header: 'Product',
      accessor: 'product',
      align: 'center',
      headerAlign: 'center',
      render: (row) => (
        <div className="flex items-center gap-3 py-0.5 w-[240px] max-w-full mx-auto text-left">
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
            {row.productImage ? (
              <img src={row.productImage} alt={row.productTitle} className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <PackageSearch className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-medium text-slate-800 line-clamp-1">{row.productTitle}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Group',
      accessor: 'primaryOptionName',
      render: (row) => (
        <span className="text-xs font-medium text-gray-900">{row.primaryOptionName}</span>
      )
    },
    {
      header: 'Options',
      accessor: 'secondaryOptions',
      render: (row) => (
        <span className="text-xs text-gray-600 line-clamp-1" title={row.secondaryOptions.join(' · ')}>
          {row.secondaryOptions.length > 0 ? row.secondaryOptions.join(' · ') : '-'}
        </span>
      )
    },
    {
      header: 'Price Range',
      accessor: 'price',
      render: (row) => {
        const p = row.minPrice === row.maxPrice ? `₹${row.minPrice}` : `₹${row.minPrice} - ₹${row.maxPrice}`;
        return <span className="text-xs font-medium text-gray-900">{p}</span>;
      }
    },
    {
      header: 'Total Stock',
      accessor: 'stock',
      render: (row) => <span className="text-xs font-medium text-gray-900">{row.stock}</span>
    },
    {
      header: 'GST',
      accessor: 'gst',
      render: (row) => {
        const gstStr = row.gstRates.length === 0 ? '-' : (row.gstRates.length === 1 ? `${row.gstRates[0]}%` : `${row.gstRates[0]}% - ${row.gstRates[row.gstRates.length - 1]}%`);
        return <span className="text-xs text-gray-600">{gstStr}</span>;
      }
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-900">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            {row.ratingAverage?.toFixed(1) || '0.0'}
          </div>
          <span className="text-[10px] text-gray-500">{row.ratingCount || 0} Reviews</span>
        </div>
      )
    },
    {
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(`/admin/products/${row.productId}/variant-group/${row.primaryOptionId}/view`)}
            className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-[#4648d4] border border-[#4648d4]/30 hover:bg-[#4648d4]/10 rounded-xl transition-colors"
            title="View Variant Group"
          >
            <Eye size={14} />
            View
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4 lg:pl-7 lg-pr-7">
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
        <SearchToolbar 
          leftSlot={
            <div className="flex items-center">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setViewMode('products')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'products'
                      ? 'bg-[#4648d4] text-white shadow-sm shadow-[#4648d4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Package size={14} className={viewMode === 'products' ? 'text-white' : 'text-slate-400'} />
                  Products
                </button>
                <button
                  onClick={() => setViewMode('variants')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'variants'
                      ? 'bg-[#4648d4] text-white shadow-sm shadow-[#4648d4]/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={14} className={viewMode === 'variants' ? 'text-white' : 'text-slate-400'} />
                  Variants
                </button>
              </div>
            </div>
          }
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search products..."
          extraFilters={
            <div className="flex items-center gap-2">
              <SearchableSelect
                className="w-[145px] shrink-0"
                size="sm"
                value={departmentFilter}
                onChange={setDepartmentFilter}
                options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
              />
              
              <SearchableSelect
                className="w-[135px] shrink-0"
                size="sm"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c._id, label: c.name }))]}
              />

              <SearchableSelect
                className="w-[120px] shrink-0"
                size="sm"
                value={brandFilter}
                onChange={setBrandFilter}
                options={[{ value: '', label: 'All Brands' }, ...brands.map(b => ({ value: b._id, label: b.name }))]}
              />

              <SearchableSelect
                className="w-[110px] shrink-0"
                size="sm"
                align="right"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Active', label: 'Active' }
                ]}
              />
            </div>
          }
          actionButton={
            <button 
              onClick={() => navigate('/admin/products/add')}
              className="bg-[#4648d4] hover:bg-[#3b3dbf] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-bold shadow-sm shadow-[#4648d4]/20 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus size={16} />
              <span>Add Product</span>
            </button>
          }
        />
        
        <div className="flex-1 overflow-y-auto">
          <DataTable 
            columns={viewMode === 'products' ? columns : variantColumns}
            data={viewMode === 'products' ? products : variantGroups}
            isLoading={isLoading}
            emptyMessage={
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <PackageSearch className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-[#4648d4] mb-1">No {viewMode} found</h3>
                <p className="text-xs text-gray-500 text-center max-w-sm mb-6">
                  {search || departmentFilter || categoryFilter || brandFilter || statusFilter 
                    ? `We couldn't find any ${viewMode} matching your current filters. Try adjusting them.`
                    : "Get started by adding your first product to the catalog."}
                </p>
                {!(search || departmentFilter || categoryFilter || brandFilter || statusFilter) && (
                  <button
                    onClick={() => navigate('/admin/products/add')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4648d4] hover:bg-[#3b3db0] rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                )}
              </div>
            }
          />
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={limit}
          itemLabel={viewMode === 'products' ? "products" : "variant groups"}
        />
      </div>

      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.title}"? This action cannot be undone and will remove all associated images.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />


    </div>
  );
};

export default ProductsList;
