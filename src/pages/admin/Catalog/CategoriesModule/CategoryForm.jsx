import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UploadCloud, X } from 'lucide-react';

const CategoryForm = ({ initialData = null, isEdit = false, isVendor = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const departmentIdParam = searchParams.get('departmentId');
  const returnTo = searchParams.get('returnTo');
  
  const [formData, setFormData] = useState({
    departmentIds: [],
    name: '',
    slug: '',
    status: 'Active',
    image: null
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

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        departmentIds: initialData.departmentIds?.map(d => d._id || d) || [],
        name: initialData.name || '',
        slug: initialData.slug || '',
        status: initialData.status || 'Active',
        image: initialData.image || null
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
    setFormData(prev => {
      const isSelected = prev.departmentIds.includes(departmentId);
      if (isSelected) {
        return { ...prev, departmentIds: prev.departmentIds.filter(id => id !== departmentId) };
      } else {
        return { ...prev, departmentIds: [...prev.departmentIds, departmentId] };
      }
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      setIsLoading(true);
      const data = new FormData();
      data.append("image", file);
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const uploadUrl = isVendor ? `${baseUrl}/vendor/portal/upload/image` : `${baseUrl}/admin/upload/image`;
      const res = await axios.post(uploadUrl, data, {
        withCredentials: true,
        headers: getHeaders()
      });
      if (res.data.success) {
        toast.success("Image uploaded successfully");
        setFormData(prev => ({ 
          ...prev, 
          image: {
            url: res.data.data.url,
            public_id: res.data.data.publicId
          }
        }));
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.departmentIds.length === 0) {
      toast.error('Please select at least one Department.');
      return;
    }
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and Slug are required.');
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const headers = getHeaders();

      if (isEdit) {
        const updateUrl = isVendor
          ? `${baseUrl}/vendor/portal/categories/${initialData._id}`
          : `${baseUrl}/admin/categories/${initialData._id}`;
        await axios.put(updateUrl, formData, {
          withCredentials: true,
          headers
        });
        toast.success('Category updated successfully!');
      } else {
        const createUrl = isVendor
          ? `${baseUrl}/vendor/portal/categories`
          : `${baseUrl}/admin/categories`;
        const res = await axios.post(createUrl, formData, {
          withCredentials: true,
          headers
        });
        toast.success('Category created successfully!');
        
        const newCatId = res.data?.category?._id || res.data?.data?._id;
        const firstDept = formData.departmentIds[0];
        if (returnTo) {
          const sep = returnTo.includes('?') ? '&' : '?';
          navigate(`${returnTo}${sep}newCategoryId=${newCatId}&newDeptId=${firstDept || ''}`);
          return;
        }
      }

      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate(isVendor ? '/vendor/portal/catalog' : '/admin/catalog/categories');
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to save category';
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
        <h2 className={`text-xl font-bold ${primaryText}`}>{isEdit ? 'Edit Category' : 'Add Category'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className={`block text-sm font-medium ${primaryText} mb-2`}>Departments *</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {departments.map(dept => (
              <label 
                key={dept._id} 
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.departmentIds.includes(dept._id) 
                    ? primaryBorderActive 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  className={`w-4 h-4 rounded ${checkboxColor}`}
                  checked={formData.departmentIds.includes(dept._id)}
                  onChange={() => handleDepartmentChange(dept._id)}
                />
                <span className="text-sm font-medium text-gray-700">{dept.name}</span>
              </label>
            ))}
          </div>
          {departments.length === 0 && (
            <p className="text-sm text-gray-500">No active departments found. Please create one first.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={`block text-sm font-medium ${primaryText} mb-2`}>Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. Shirts"
              className={`w-full px-4 h-12 border border-gray-200 rounded-xl outline-none ${primaryRing} focus:ring-1 transition-colors`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${primaryText} mb-2`}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`w-full px-4 h-12 border border-gray-200 rounded-xl outline-none ${primaryRing} focus:ring-1 transition-colors bg-white cursor-pointer`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${primaryText} mb-2`}>Category Image</label>
          {formData.image ? (
            <div className="relative w-32 h-32 border border-gray-200 rounded-xl overflow-hidden group">
              <img src={formData.image.url} alt="Category" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                  className="w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:${isVendor ? 'border-[#fe4a03]' : 'border-[#4648d4]'} transition-colors`}>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0])} />
              <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs font-medium text-gray-600">Upload</span>
            </label>
          )}
          <p className="mt-2 text-xs text-gray-500">Recommended size: 400x400px. PNG, JPG or WEBP.</p>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              if (returnTo) navigate(returnTo);
              else navigate(isVendor ? '/vendor/portal/catalog' : '/admin/catalog/categories');
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
              'Create Category'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
