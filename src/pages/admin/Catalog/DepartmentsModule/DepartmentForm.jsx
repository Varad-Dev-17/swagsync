import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DepartmentForm = ({ initialData = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    status: 'Active',
    description: '',
    iconName: 'Box'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);

  const ICONS_LIST = [
    { name: 'Box', label: 'Box (Default)' },
    { name: 'User', label: 'User / Person' },
    { name: 'Users', label: 'People / Group' },
    { name: 'Shirt', label: 'Shirt / Apparel' },
    { name: 'Baby', label: 'Baby / Kids' },
    { name: 'Armchair', label: 'Furniture' },
    { name: 'Sparkles', label: 'Beauty / Sparkles' },
    { name: 'ShoppingBag', label: 'Shopping Bag' },
    { name: 'Tag', label: 'Price Tag' },
    { name: 'Laptop', label: 'Laptop' },
    { name: 'Smartphone', label: 'Smartphone' },
    { name: 'Monitor', label: 'Monitor' },
    { name: 'Watch', label: 'Watch' },
    { name: 'Headphones', label: 'Headphones' },
    { name: 'Camera', label: 'Camera' },
    { name: 'Gamepad', label: 'Gaming' },
    { name: 'Heart', label: 'Heart' },
    { name: 'Dribbble', label: 'Sports Ball' },
    { name: 'Activity', label: 'Health / Activity' },
    { name: 'Plane', label: 'Travel / Plane' },
    { name: 'Car', label: 'Automotive' },
    { name: 'Book', label: 'Books / Reading' },
    { name: 'Music', label: 'Music' },
    { name: 'Coffee', label: 'Food & Beverage' },
  ];
  const [slugModified, setSlugModified] = useState(false);
  const [existingDepartments, setExistingDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/departments`, {
          params: { limit: 1000 }
        });
        if (response.data.success) {
          setExistingDepartments(response.data.departments || response.data.data || []);
        }
      } catch (e) {
        console.error('Failed to load departments for duplicate check', e);
      }
    };
    fetchDepartments();
  }, []);

  const checkDuplicateName = (nameToCheck) => {
    const trimmed = (nameToCheck || '').trim().toLowerCase();
    if (!trimmed) return null;
    return existingDepartments.find(
      (d) => d.name?.trim().toLowerCase() === trimmed && (!isEdit || String(d._id) !== String(initialData?._id))
    );
  };

  const handleNameBlur = () => {
    const match = checkDuplicateName(formData.name);
    if (match) {
      toast.error(`Already present: Department "${match.name}" already exists!`);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        iconName: initialData.iconName || 'Box',
        status: initialData.status || 'Active'
      });
      if (initialData.slug) {
        setSlugModified(true);
      }
    }
  }, [initialData]);

  // Auto-generate slug from name if user hasn't manually edited it
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and Slug are required.');
      return;
    }

    const duplicate = checkDuplicateName(formData.name);
    if (duplicate) {
      toast.error(`Already present: Department "${duplicate.name}" already exists!`);
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/departments/${initialData._id}`, formData, {
          withCredentials: true
        });
        toast.success('Department updated successfully!');
      } else {
        await axios.post(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/departments`, formData, {
          withCredentials: true
        });
        toast.success('Department created successfully!');
      }
      navigate('/admin/catalog/departments');
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to save department';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 w-full">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#4648d4]">{isEdit ? 'Edit Department' : 'Add Department'}</h2>
        </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Department Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="e.g. Men's Clothing"
              className="w-full px-4 h-12 border border-gray-200 rounded-xl outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 h-12 border border-gray-200 rounded-xl outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors bg-white cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
            <button
              type="button"
              onClick={() => setIsIconDropdownOpen(!isIconDropdownOpen)}
              className="w-full px-4 h-12 border border-gray-200 rounded-xl outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors bg-white flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-gray-700">
                {(() => {
                  const IconComponent = LucideIcons[formData.iconName] || LucideIcons.Box;
                  return <IconComponent size={20} className="text-[#4648d4]" />;
                })()}
                <span>{ICONS_LIST.find(i => i.name === formData.iconName)?.label || formData.iconName}</span>
              </div>
              <LucideIcons.ChevronDown size={18} className="text-gray-400" />
            </button>
            
            {isIconDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 grid grid-cols-1 gap-1">
                  {ICONS_LIST.filter(iconOption => LucideIcons[iconOption.name]).map((iconOption) => {
                    const IconComp = LucideIcons[iconOption.name];
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, iconName: iconOption.name });
                          setIsIconDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
                          formData.iconName === iconOption.name ? 'bg-[#4648d4]/10 text-[#4648d4]' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <IconComp size={18} className={formData.iconName === iconOption.name ? 'text-[#4648d4]' : 'text-gray-500'} />
                        <span className="text-sm">{iconOption.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Clothing and accessories for men"
            className="w-full px-4 py-3 min-h-[120px] border border-gray-200 rounded-xl outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors resize-y"
          />
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/admin/catalog/departments')}
            disabled={isLoading}
            className="h-12 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 bg-[#4648d4] hover:bg-[#3b3db0] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create Department'
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default DepartmentForm;
