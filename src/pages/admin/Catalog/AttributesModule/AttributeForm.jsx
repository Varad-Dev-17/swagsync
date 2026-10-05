import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2, Plus, Lock, Info } from 'lucide-react';
import MultiSelect from '../../../../components/admin/ui/MultiSelect';

const COMMON_COLORS = {
  'black': '#000000',
  'white': '#FFFFFF',
  'blue': '#0000FF',
  'red': '#FF0000',
  'green': '#008000',
  'grey': '#808080',
  'gray': '#808080',
  'navy blue': '#000080',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'brown': '#A52A2A',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'cyan': '#00FFFF',
  'magenta': '#FF00FF',
  'teal': '#008080',
  'maroon': '#800000',
  'olive': '#808000',
  'lime': '#00FF00',
  'navy': '#000080'
};

const AttributeForm = ({ initialData = null, isEdit = false, isVendor = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdParam = searchParams.get('categoryId');
  const usageParam = searchParams.get('usage');
  const returnTo = searchParams.get('returnTo');

  const token = localStorage.getItem('token');
  let currentVendorId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentVendorId = payload.vendorId;
    } catch (e) {}
  }

  const isAttributeOwned = useMemo(() => {
    if (!isEdit || !isVendor) return true;
    if (!initialData?.vendorId) return false;
    const vId = typeof initialData.vendorId === 'object' ? initialData.vendorId._id || initialData.vendorId : initialData.vendorId;
    return String(vId) === String(currentVendorId);
  }, [isEdit, isVendor, initialData, currentVendorId]);

  const initialCategoryIds = useMemo(() => {
    if (!isEdit || !initialData?.categoryIds) return [];
    return initialData.categoryIds.map(c => (c._id || c).toString());
  }, [isEdit, initialData]);

  const isOptionOwned = (opt) => {
    if (!isVendor) return true;
    if (!opt._id) return true; // new option added in current session
    if (!opt.vendorId || !currentVendorId) return false;
    const optVendorId = typeof opt.vendorId === 'object' ? opt.vendorId._id || opt.vendorId : opt.vendorId;
    return String(optVendorId) === String(currentVendorId);
  };
  
  const [formData, setFormData] = useState({
    categoryIds: [],
    name: '',
    fieldType: 'select',
    usage: usageParam || 'Product',
    status: 'Active'
  });
  
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState([]);
  const [deletedOptionIds, setDeletedOptionIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs to handle auto-focus
  const lastOptionInputRef = useRef(null);

  const getHeaders = () => {
    if (isVendor) {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    return {};
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const response = await axios.get(`${baseUrl}/categories`, {
          params: { status: 'Active', limit: 1000 },
          headers: getHeaders()
        });
        if (response.data.success) {
          setCategories(response.data.categories || response.data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, [isVendor]);

  // Fetch existing attributes for duplicate prevention
  const [existingAttributes, setExistingAttributes] = useState([]);
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const response = await axios.get(`${baseUrl}/attributes`, {
          params: { limit: 1000 },
          headers: getHeaders()
        });
        if (response.data.success) {
          setExistingAttributes(response.data.attributes || response.data.data || []);
        }
      } catch (e) {
        console.error('Failed to load attributes for duplicate check', e);
      }
    };
    fetchAttributes();
  }, [isVendor]);

  const checkDuplicateName = (nameToCheck) => {
    const trimmed = (nameToCheck || '').trim().toLowerCase();
    if (!trimmed) return null;
    return existingAttributes.find(
      (a) => a.name?.trim().toLowerCase() === trimmed && (!isEdit || String(a._id) !== String(initialData?._id))
    );
  };

  const handleNameBlur = () => {
    const match = checkDuplicateName(formData.name);
    if (match) {
      toast.error(`Already present: Attribute "${match.name}" already exists!`);
    }
  };

  // Pre-select category & usage if provided via searchParams
  useEffect(() => {
    if (!initialData) {
      setFormData(prev => ({
        ...prev,
        categoryIds: categoryIdParam && prev.categoryIds.length === 0 ? [categoryIdParam] : prev.categoryIds,
        usage: usageParam || prev.usage
      }));
    }
  }, [categoryIdParam, usageParam, initialData]);

  const fetchExistingOptions = async (attributeId) => {
    try {
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const response = await axios.get(`${baseUrl}/attribute-options/attribute/${attributeId}?limit=1000`, {
        headers: getHeaders()
      });
      if (response.data.success && response.data.options) {
        setOptions(response.data.options.map(opt => ({
          _id: opt._id,
          displayName: opt.displayName,
          storedValue: opt.storedValue,
          hex: opt.hex || '#000000',
          vendorId: opt.vendorId || null,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch existing options', error);
      toast.error('Could not load existing attribute options');
    }
  };

  // Fetch initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        categoryIds: initialData.categoryIds?.map(c => c._id || c) || [],
        name: initialData.name || '',
        fieldType: initialData.fieldType || 'select',
        usage: initialData.usage || 'Product',
        status: initialData.status || 'Active'
      });
      
      // Fetch existing options
      if (['select', 'color'].includes(initialData.fieldType)) {
        fetchExistingOptions(initialData._id);
      }
    }
  }, [initialData]);

  // Auto-create first option row if empty and field type supports it
  useEffect(() => {
    if (['select', 'color'].includes(formData.fieldType) && options.length === 0) {
      setOptions([{ 
        displayName: '', 
        storedValue: '',
        hex: formData.fieldType === 'color' ? '#000000' : undefined 
      }]);
    }
  }, [formData.fieldType, options.length]);

  const handleAddOption = () => {
    setOptions(prev => [...prev, { 
      displayName: '', 
      storedValue: '',
      hex: formData.fieldType === 'color' ? '#000000' : undefined 
    }]);
    // We will auto-focus this newly added row using an effect hook or timeout
    setTimeout(() => {
      if (lastOptionInputRef.current) {
        lastOptionInputRef.current.focus();
      }
    }, 50);
  };

  const handleRemoveOption = (index, optionId) => {
    const opt = options[index];
    if (opt && !isOptionOwned(opt)) {
      toast.error("Existing options cannot be deleted.");
      return;
    }
    if (optionId) {
      setDeletedOptionIds(prev => [...prev, optionId]);
    }
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index, field, value) => {
    const targetOpt = options[index];
    if (targetOpt && !isOptionOwned(targetOpt)) {
      toast.error("Existing options cannot be modified.");
      return;
    }
    setOptions(prev => prev.map((opt, i) => {
      if (i === index) {
        const updatedOpt = { ...opt, [field]: value };
        
        // Auto-generate stored value from display name for color swatches
        if (formData.fieldType === 'color' && field === 'displayName') {
          const trimmedVal = value.trim();
          updatedOpt.storedValue = trimmedVal.toUpperCase().replace(/\s+/g, '_');
          
          // Auto-fill hex if recognized
          const lowerColor = trimmedVal.toLowerCase();
          if (COMMON_COLORS[lowerColor]) {
            updatedOpt.hex = COMMON_COLORS[lowerColor];
          }
        }
        
        return updatedOpt;
      }
      return opt;
    }));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === options.length - 1) {
        handleAddOption();
      }
    }
  };

  const validateForm = () => {
    if (formData.categoryIds.length === 0) {
      toast.error('Please select at least one Category.');
      return false;
    }

    if (!formData.name.trim()) {
      toast.error('Attribute Name is required.');
      return false;
    }

    const duplicate = checkDuplicateName(formData.name);
    if (duplicate) {
      toast.error(`Already present: Attribute "${duplicate.name}" already exists!`);
      return false;
    }

    if (['select', 'color'].includes(formData.fieldType)) {
      if (options.length === 0) {
        toast.error('At least one option is required.');
        return false;
      }

      const displayNames = new Set();
      const storedValues = new Set();

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt.displayName.trim()) {
          toast.error(`Option ${i + 1} is missing a Display Name.`);
          return false;
        }
        if (!opt.storedValue.trim() && formData.fieldType !== 'color') {
          toast.error(`Option ${i + 1} is missing a Stored Value.`);
          return false;
        }

        if (formData.fieldType === 'color') {
          if (!opt.hex || !opt.hex.trim()) {
            toast.error(`Option ${i + 1} is missing a color selection.`);
            return false;
          }
          const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
          if (!hexRegex.test(opt.hex.trim())) {
            toast.error(`Option "${opt.displayName}" has an invalid Color Hex Code.`);
            return false;
          }
        }

        if (displayNames.has(opt.displayName.trim().toLowerCase())) {
          toast.error(`Already present: Option "${opt.displayName}" already exists in this list!`);
          return false;
        }
        if (storedValues.has(opt.storedValue.trim().toLowerCase())) {
          toast.error(`Already present: Stored Value "${opt.storedValue}" already exists in this list!`);
          return false;
        }

        displayNames.add(opt.displayName.trim().toLowerCase());
        storedValues.add(opt.storedValue.trim().toLowerCase());
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const headers = getHeaders();
      let attributeId;
      
      // 1. Save Attribute
      if (isEdit) {
        const updateUrl = isVendor ? `${baseUrl}/vendor/portal/attributes/${initialData._id}` : `${baseUrl}/admin/attributes/${initialData._id}`;
        const response = await axios.put(updateUrl, formData, {
          withCredentials: true,
          headers
        });
        attributeId = response.data.attribute._id;
      } else {
        const createUrl = isVendor ? `${baseUrl}/vendor/portal/attributes` : `${baseUrl}/admin/attributes`;
        const response = await axios.post(createUrl, formData, {
          withCredentials: true,
          headers
        });
        attributeId = response.data.attribute._id;
      }

      // 2. Process Options if fieldType is select or color
      if (['select', 'color'].includes(formData.fieldType)) {
        // Delete removed options
        if (deletedOptionIds.length > 0) {
          const deleteBase = isVendor ? `${baseUrl}/vendor/portal/attribute-options/` : `${baseUrl}/admin/attribute-options/`;
          await Promise.all(deletedOptionIds.map(id => 
            axios.delete(`${deleteBase}${id}`, { withCredentials: true, headers })
          ));
        }

        // Create or Update current options
        const createPromises = [];
        const updatePromises = [];

        options.forEach(opt => {
          // If option is existing and not owned by current vendor, skip sending PUT request
          if (opt._id && !isOptionOwned(opt)) {
            return;
          }

          const payload = {
            attribute: attributeId,
            displayName: opt.displayName.trim(),
            storedValue: opt.storedValue.trim()
          };
          
          if (formData.fieldType === 'color' && opt.hex) {
            payload.hex = opt.hex.trim();
          }

          if (opt._id) {
            const updateOptUrl = isVendor ? `${baseUrl}/vendor/portal/attribute-options/${opt._id}` : `${baseUrl}/admin/attribute-options/${opt._id}`;
            updatePromises.push(axios.put(updateOptUrl, payload, { withCredentials: true, headers }));
          } else {
            const createOptUrl = isVendor ? `${baseUrl}/vendor/portal/attribute-options` : `${baseUrl}/admin/attribute-options`;
            createPromises.push(axios.post(createOptUrl, payload, { withCredentials: true, headers }));
          }
        });

        await Promise.all([...updatePromises, ...createPromises]);
      }

      toast.success(isEdit ? 'Attribute and options updated!' : 'Attribute created successfully!');

      if (returnTo) {
        const sep = returnTo.includes('?') ? '&' : '?';
        const firstCat = formData.categoryIds[0] || '';
        navigate(`${returnTo}${sep}newAttributeId=${attributeId}&newCatId=${firstCat}`);
        return;
      }

      navigate(isVendor ? '/vendor/portal/catalog' : '/admin/catalog/attributes');

    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to save attribute';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const showOptions = ['select', 'color'].includes(formData.fieldType);

  const primaryText = isVendor ? 'text-[#fe4a03]' : 'text-[#4648d4]';
  const primaryBg = isVendor ? 'bg-[#fe4a03] hover:bg-[#e03f00]' : 'bg-[#4648d4] hover:bg-[#3b3db0]';
  const primaryRing = isVendor ? 'focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'focus:border-[#4648d4] focus:ring-[#4648d4]';
  const primarySoftBg = isVendor ? 'text-[#fe4a03] hover:text-[#e03f00] hover:bg-[#fe4a03]/5' : 'text-[#4648d4] hover:text-[#3b3db0] hover:bg-[#4648d4]/5';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${primaryText}`}>{isEdit ? 'Edit Attribute' : 'Add Attribute'}</h2>
      </div>

      {isVendor && isEdit && !isAttributeOwned && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">System Attribute (Partial Editing Mode)</p>
            <p className="text-amber-700 text-xs mt-0.5">
              Previous existing attribute settings and existing options cannot be modified or deleted. You can map additional categories and add new custom options below.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <MultiSelect
            label="Categories"
            required
            options={categories.map(c => ({ value: c._id, label: c.name }))}
            values={formData.categoryIds}
            onChange={(vals) => {
              if (isVendor && isEdit && !isAttributeOwned) {
                const missing = initialCategoryIds.filter(id => !vals.includes(id));
                if (missing.length > 0) {
                  toast.error("Existing category mappings cannot be removed from this attribute.");
                  return;
                }
              }
              setFormData({ ...formData, categoryIds: vals });
            }}
            placeholder="Search categories..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={`block text-sm font-medium ${primaryText} mb-1.5 flex items-center justify-between`}>
              <span>Attribute Name *</span>
              {isVendor && isEdit && !isAttributeOwned && (
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <Lock size={12} /> System field (read-only)
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.name}
              disabled={isVendor && isEdit && !isAttributeOwned}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={handleNameBlur}
              placeholder="e.g. Color, Size, Material"
              className={`w-full px-3 h-12 border border-gray-200 rounded-lg outline-none ${primaryRing} focus:ring-1 transition-colors text-sm ${
                isVendor && isEdit && !isAttributeOwned ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${primaryText} mb-1.5`}>Field Type *</label>
            <select
              value={formData.fieldType}
              onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
              disabled={isEdit}
              className={`w-full px-3 h-12 border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors bg-white text-sm ${isEdit ? 'bg-gray-50 cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
              required
            >
              <option value="select">Select</option>
              <option value="color">Color Swatch</option>
              <option value="text">Text</option>
              <option value="number">Number</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4648d4] mb-1.5 flex items-center justify-between">
              <span>Used In *</span>
              {isVendor && isEdit && !isAttributeOwned && (
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <Lock size={12} /> System field
                </span>
              )}
            </label>
            <select
              value={formData.usage}
              disabled={isVendor && isEdit && !isAttributeOwned}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
              className={`w-full px-3 h-12 border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors bg-white text-sm ${
                isVendor && isEdit && !isAttributeOwned ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'
              }`}
              required
            >
              <option value="Product">Product</option>
              <option value="Variant">Variant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4648d4] mb-1.5 flex items-center justify-between">
              <span>Status</span>
              {isVendor && isEdit && !isAttributeOwned && (
                <span className="text-xs text-slate-400 font-normal flex items-center gap-1">
                  <Lock size={12} /> System field
                </span>
              )}
            </label>
            <select
              value={formData.status}
              disabled={isVendor && isEdit && !isAttributeOwned}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={`w-full px-3 h-12 border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] transition-colors bg-white text-sm ${
                isVendor && isEdit && !isAttributeOwned ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Options Card (only for select and color) */}
      {showOptions && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          {options.length > 0 && (
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 mb-2 px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <div className="col-span-5">Display Name</div>
              {formData.fieldType === 'color' ? (
                <div className="col-span-6">Color</div>
              ) : (
                <div className="col-span-6">Stored Value</div>
              )}
              <div className="col-span-1 text-right">Action</div>
            </div>
          )}

          <div className="space-y-2">
            {options.map((option, index) => {
              const owned = isOptionOwned(option);
              return (
                <div key={index} className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-2 rounded-lg border ${
                  !owned ? 'bg-gray-100/70 border-gray-200' : 'bg-gray-50/50 border-gray-100 sm:bg-transparent sm:border-none'
                }`}>
                  
                  {/* Mobile Labels */}
                  <div className="sm:hidden text-xs font-medium text-gray-500 mb-1 flex items-center justify-between">
                    <span>Display Name</span>
                    {!owned && (
                      <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                        <Lock size={10} /> Existing
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-5">
                    <input
                      type="text"
                      ref={index === options.length - 1 ? lastOptionInputRef : null}
                      value={option.displayName}
                      disabled={!owned}
                      onChange={(e) => updateOption(index, 'displayName', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      placeholder="e.g. Small, Black, XL"
                      className={`w-full px-3 h-10 border rounded-lg outline-none text-sm transition-colors ${
                        !owned 
                          ? 'bg-gray-200/60 border-gray-300 text-gray-600 cursor-not-allowed' 
                          : 'border-gray-200 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]'
                      }`}
                    />
                  </div>

                  {formData.fieldType === 'color' ? (
                    <>
                      <div className="sm:hidden text-xs font-medium text-gray-500 mt-1 mb-1">Color</div>
                      <div className="col-span-1 sm:col-span-6 flex items-center gap-3">
                        <input
                          type="color"
                          disabled={!owned}
                          value={option.hex || '#000000'}
                          onChange={(e) => updateOption(index, 'hex', e.target.value.toUpperCase())}
                          className={`h-10 w-12 p-0.5 border border-gray-200 rounded-lg bg-white shrink-0 ${
                            !owned ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                          }`}
                        />
                        <span className="text-sm text-gray-400 font-mono hidden sm:inline-block">
                          {option.hex || '#000000'}
                        </span>
                        {!owned && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600 shrink-0 ml-auto">
                            <Lock size={10} /> Existing
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="sm:hidden text-xs font-medium text-gray-500 mt-1 mb-1">Stored Value</div>
                      <div className="col-span-1 sm:col-span-6 flex items-center gap-2">
                        <input
                          type="text"
                          disabled={!owned}
                          value={option.storedValue}
                          onChange={(e) => updateOption(index, 'storedValue', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          placeholder="e.g. sm, blk"
                          className={`w-full px-3 h-10 border rounded-lg outline-none text-sm uppercase transition-colors ${
                            !owned 
                              ? 'bg-gray-200/60 border-gray-300 text-gray-600 cursor-not-allowed' 
                              : 'border-gray-200 focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4]'
                          }`}
                        />
                        {!owned && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-200 text-gray-600 shrink-0 whitespace-nowrap">
                            <Lock size={10} /> Existing
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="col-span-1 sm:col-span-1 flex justify-end mt-1 sm:mt-0">
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index, option._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center w-full sm:w-auto border sm:border-none border-red-100 bg-red-50/50 sm:bg-transparent h-10 cursor-pointer"
                        title="Remove Option"
                      >
                        <Trash2 size={16} />
                        <span className="ml-2 sm:hidden text-sm font-medium">Remove</span>
                      </button>
                    ) : (
                      <div className="p-2 text-slate-400 flex items-center justify-center h-10" title="Existing option (read-only)">
                        <Lock size={16} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            className={`mt-3 flex items-center gap-1.5 text-sm font-medium ${primarySoftBg} transition-colors px-3 py-1.5 rounded-md w-max cursor-pointer`}
          >
            <Plus size={16} />
            Add Option
          </button>
        </div>
      )}

      {/* Informational Message for Text/Number Types */}
      {['text', 'number'].includes(formData.fieldType) && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/50 border border-gray-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className={`${primaryText} text-sm font-medium mb-1`}>
              {formData.fieldType === 'text' 
                ? "This attribute accepts free text during product creation." 
                : "This attribute accepts numeric values during product creation."}
            </h3>
            <p className="text-gray-500 text-xs">
              {formData.fieldType === 'text' 
                ? "Example: Material Description, Warranty Details, Model Name"
                : "Example: Weight, Warranty (Years), Battery Capacity, Screen Size"}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            if (returnTo) navigate(returnTo);
            else navigate(isVendor ? '/vendor/portal/catalog' : '/admin/catalog/attributes');
          }}
          disabled={isLoading}
          className="h-12 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`h-12 px-6 ${primaryBg} text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[150px] cursor-pointer`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Create Attribute'
          )}
        </button>
      </div>
    </div>
  );
};

export default AttributeForm;
