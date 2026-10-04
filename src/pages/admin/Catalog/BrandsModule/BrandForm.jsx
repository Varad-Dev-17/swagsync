import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock, Info } from 'lucide-react';

const BrandForm = ({ initialData = null, isEdit = false, isVendor = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const departmentIdParam = searchParams.get('departmentId');
  const returnTo = searchParams.get('returnTo');

  const token = localStorage.getItem('token');
  let currentVendorId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentVendorId = payload.vendorId;
    } catch (e) {}
  }

  const isBrandOwned = useMemo(() => {
    if (!isEdit || !isVendor) return true;
    if (!initialData?.vendorId) return false;
    const vId = typeof initialData.vendorId === 'object' ? initialData.vendorId._id || initialData.vendorId : initialData.vendorId;
    return String(vId) === String(currentVendorId);
  }, [isEdit, isVendor, initialData, currentVendorId]);

  const initialDeptIds = useMemo(() => {
    if (!isEdit || !initialData?.departmentIds) return [];
    return initialData.departmentIds.map(d => (d._id || d).toString());
  }, [isEdit, initialData]);
  
  const [formData, setFormData] = useState({
    departmentIds: [],
    name: '',
    slug: '',
    status: 'Active'
  });
  
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slugModified, setSlugModified] = useState(false);

  const getHeaders = () => {
    if (isVendor) {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    return {};
  };

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/departments`, {
          params: { status: 'Active', limit: 1000 },
          headers: getHeaders()
        });
        if (response.data.success) {
          setDepartments(response.data.departments || response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch departments', error);
        toast.error('Failed to load departments');
      }
    };
    fetchDepartments();
  }, [isVendor]);

  // Pre-select department from searchParams if adding
  useEffect(() => {
    if (!initialData && departmentIdParam) {
      setFormData(prev => ({
        ...prev,
        departmentIds: prev.departmentIds.length === 0 ? [departmentIdParam] : prev.departmentIds
      }));
    }
  }, [departmentIdParam, initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        departmentIds: initialData.departmentIds?.map(d => d._id || d) || [],
        name: initialData.name || '',
        slug: initialData.slug || '',
        status: initialData.status || 'Active'
      });
      if (initialData.slug) {
        setSlugModified(true);
      }
    }
  }, [initialData]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (!slugModified) {
      const generatedSlug = newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData({ ...formData, name: newName, slug: generatedSlug });
    } else {
      setFormData({ ...formData, name: newName });
    }
  };

  const handleDepartmentChange = (departmentId) => {
    if (isVendor && !isBrandOwned && initialDeptIds.includes(departmentId.toString())) {
      toast.error("Existing departments cannot be removed from this brand.");
      return;
    }
    setFormData(prev => {
      const isSelected = prev.departmentIds.includes(departmentId);
      if (isSelected) {
        return { ...prev, departmentIds: prev.departmentIds.filter(id => id !== departmentId) };
      } else {
        return { ...prev, departmentIds: [...prev.departmentIds, departmentId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.departmentIds.length === 0) {
      toast.error('Please select at least one Department.');
      return;
    }
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Brand Name and Slug are required.');
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const headers = getHeaders();

      if (isEdit) {
        const updateUrl = isVendor
          ? `${baseUrl}/vendor/portal/brands/${initialData._id}`
          : `${baseUrl}/admin/brands/${initialData._id}`;
        await axios.put(updateUrl, formData, {
          withCredentials: true,
          headers
        });
        toast.success('Brand updated successfully!');
      } else {
        const createUrl = isVendor
          ? `${baseUrl}/vendor/portal/brands`
          : `${baseUrl}/admin/brands`;
        const res = await axios.post(createUrl, formData, {
          withCredentials: true,
          headers
        });
        toast.success('Brand created successfully!');

        const newBrandId = res.data?.brand?._id || res.data?.data?._id;
        const firstDept = formData.departmentIds[0];
        if (returnTo) {
          const sep = returnTo.includes('?') ? '&' : '?';
          navigate(`${returnTo}${sep}newBrandId=${newBrandId}&newDeptId=${firstDept || ''}`);
          return;
        }
      }

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate(isVendor ? '/vendor/portal/catalog' : '/admin/catalog/brands');
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to save brand';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const primaryText = isVendor ? 'text-[#fe4a03]' : 'text-[#4648d4]';
  const primaryBg = isVendor ? 'bg-[#fe4a03] hover:bg-[#e03f00]' : 'bg-[#4648d4] hover:bg-[#3b3db0]';
  const primaryBorderActive = isVendor ? 'border-[#fe4a03] bg-[#fe4a03]/5' : 'border-[#4648d4] bg-[#4648d4]/5';
  const primaryRing = isVendor ? 'focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'focus:border-[#4648d4] focus:ring-[#4648d4]';
  const checkboxColor = isVendor ? 'text-[#fe4a03] focus:ring-[#fe4a03]' : 'text-[#4648d4] focus:ring-[#4648d4]';

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8 w-full">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${primaryText}`}>{isEdit ? 'Edit Brand' : 'Add Brand'}</h2>
      </div>

      {isVendor && isEdit && !isBrandOwned && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">System Brand (Partial Editing Mode)</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Previous existing fields (Brand Name, Status) and assigned departments cannot be modified or removed. You can assign additional departments below.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className={`block text-sm font-medium ${primaryText} mb-2`}>Departments *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map(dept => {
              const isPreExisting = isVendor && isEdit && !isBrandOwned && initialDeptIds.includes(dept._id.toString());
              return (
                <label 
                  key={dept._id} 
                  className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${
                    isPreExisting
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-85'
                      : formData.departmentIds.includes(dept._id) 
                      ? primaryBorderActive + ' cursor-pointer' 
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={isPreExisting}
                    className={`w-4 h-4 rounded ${checkboxColor} ${isPreExisting ? 'cursor-not-allowed opacity-60' : ''}`}
                    checked={formData.departmentIds.includes(dept._id)}
                    onChange={() => handleDepartmentChange(dept._id)}
                  />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-700 truncate">{dept.name}</span>
                    {isPreExisting && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600 shrink-0 ml-auto">
                        <Lock size={10} /> Existing
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {departments.length === 0 && (
            <p className="text-sm text-gray-500">No active departments found. Please create one first.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={`block text-sm font-medium ${primaryText} mb-2 flex items-center justify-between`}>
              <span>Brand Name *</span>
              {isVendor && isEdit && !isBrandOwned && (
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <Lock size={12} /> System field (read-only)
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              disabled={isVendor && isEdit && !isBrandOwned}
              placeholder="e.g. Nike"
              className={`w-full px-4 h-12 border border-gray-200 rounded-xl outline-none ${primaryRing} focus:ring-1 transition-colors ${
                isVendor && isEdit && !isBrandOwned ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${primaryText} mb-2 flex items-center justify-between`}>
              <span>Status</span>
              {isVendor && isEdit && !isBrandOwned && (
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <Lock size={12} /> System field (read-only)
                </span>
              )}
            </label>
            <select
              value={formData.status}
              disabled={isVendor && isEdit && !isBrandOwned}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`w-full px-4 h-12 border border-gray-200 rounded-xl outline-none ${primaryRing} focus:ring-1 transition-colors bg-white ${
                isVendor && isEdit && !isBrandOwned ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              if (returnTo) navigate(returnTo);
              else navigate(isVendor ? '/vendor/portal/catalog' : '/admin/catalog/brands');
            }}
            disabled={isLoading}
            className="h-12 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`h-12 px-6 ${primaryBg} text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px] cursor-pointer`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Brand'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandForm;
