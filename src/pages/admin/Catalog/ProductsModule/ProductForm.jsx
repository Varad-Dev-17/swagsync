import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import SearchableSelect from '../../../../components/admin/ui/SearchableSelect';
import { Factory, Store, Plus, MapPin, Phone, Star, X, Loader2, Check, ChevronDown } from 'lucide-react';

const slugify = (text = '', preserveTrailingDash = false) => {
  let s = text
    .toString()
    .toLowerCase()
    .trimStart()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '');
  if (!preserveTrailingDash) {
    s = s.replace(/-+$/, '');
  }
  return s;
};

const ProductForm = forwardRef(({ isEdit = false, isUnifiedMode = false, onFormChange = () => {}, isVendor = false }, ref) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const draftKey = `swagsync_product_draft_${isVendor ? 'vendor' : 'admin'}`;

  const getHeaders = useCallback(() => {
    if (isVendor) {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    return {};
  }, [isVendor]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    longDescription: '',
    status: 'Active',
    department: '',
    category: '',
    brand: '',
    returnable: true,
    exchangeable: true,
    returnDays: 7
  });

  const [slugModified, setSlugModified] = useState(false);

  // Dropdown Options State
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Loading States
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isBrandsLoading, setIsBrandsLoading] = useState(false);
  const [isDynamicAttributesLoading, setIsDynamicAttributesLoading] = useState(false);

  // Dynamic Attributes State
  const [dynamicAttributesConfig, setDynamicAttributesConfig] = useState([]);
  const [dynamicAttributes, setDynamicAttributes] = useState([]);

  // Save current form state as draft and navigate to create missing catalog data
  const handleRedirectToAdd = (type) => {
    const draftData = {
      formData,
      slugModified,
      selectedStoreId,
      selectedMfgId,
      dynamicAttributes
    };
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save draft to sessionStorage', e);
    }

    const returnUrl = isVendor ? '/vendor/portal/products/add' : '/admin/products/add';

    if (type === 'category') {
      if (!formData.department) {
        toast.error('Please select a Department first.');
        return;
      }
      const targetUrl = isVendor
        ? `/vendor/portal/catalog/categories/add?departmentId=${formData.department}&returnTo=${encodeURIComponent(returnUrl)}`
        : `/admin/catalog/categories/add?departmentId=${formData.department}&returnTo=${encodeURIComponent(returnUrl)}`;
      navigate(targetUrl);
    } else if (type === 'brand') {
      if (!formData.department) {
        toast.error('Please select a Department first.');
        return;
      }
      const targetUrl = isVendor
        ? `/vendor/portal/catalog/brands/add?departmentId=${formData.department}&returnTo=${encodeURIComponent(returnUrl)}`
        : `/admin/catalog/brands/add?departmentId=${formData.department}&returnTo=${encodeURIComponent(returnUrl)}`;
      navigate(targetUrl);
    } else if (type === 'attribute') {
      if (!formData.category) {
        toast.error('Please select a Category first.');
        return;
      }
      const targetUrl = isVendor
        ? `/vendor/portal/catalog/attributes/add?categoryId=${formData.category}&usage=Product&returnTo=${encodeURIComponent(returnUrl)}`
        : `/admin/catalog/attributes/add?categoryId=${formData.category}&usage=Product&returnTo=${encodeURIComponent(returnUrl)}`;
      navigate(targetUrl);
    }
  };

  // Restore draft state and check for newly created catalog entities from query params
  useEffect(() => {
    if (isEdit) return;

    const savedDraft = sessionStorage.getItem(draftKey);
    let draft = null;
    if (savedDraft) {
      try {
        draft = JSON.parse(savedDraft);
      } catch (e) {
        console.error('Failed to parse draft from sessionStorage', e);
      }
    }

    const newCategoryId = searchParams.get('newCategoryId');
    const newBrandId = searchParams.get('newBrandId');
    const newAttributeId = searchParams.get('newAttributeId');
    const newDeptId = searchParams.get('newDeptId');
    const newCatId = searchParams.get('newCatId');

    if (draft || newCategoryId || newBrandId || newAttributeId) {
      setFormData(prev => {
        const next = draft ? { ...prev, ...draft.formData } : { ...prev };
        if (newDeptId) next.department = newDeptId;
        if (newCategoryId) next.category = newCategoryId;
        if (newBrandId) next.brand = newBrandId;
        if (newCatId) next.category = newCatId;
        return next;
      });

      if (draft?.slugModified !== undefined) {
        setSlugModified(draft.slugModified);
      }
      if (draft?.selectedStoreId) {
        setSelectedStoreId(draft.selectedStoreId);
      }
      if (draft?.selectedMfgId) {
        setSelectedMfgId(draft.selectedMfgId);
      }
      if (draft?.dynamicAttributes && !newAttributeId) {
        setDynamicAttributes(draft.dynamicAttributes);
      }

      if (newCategoryId || newBrandId || newAttributeId) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [isEdit, draftKey, searchParams]);

  // Store Selection State (Address-Book style for vendor products)
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeSubmitting, setStoreSubmitting] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    storeName: '',
    phone: '',
    storeDescription: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    isDefault: false,
  });

  const fetchStores = useCallback(async () => {
    if (!isVendor) return;
    try {
      setIsStoreLoading(true);
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const response = await axios.get(`${baseUrl}/vendor/portal/stores`, {
        withCredentials: true,
        headers: getHeaders(),
      });
      if (response.data.success) {
        const list = response.data.data || [];
        setStores(list);
        setSelectedStoreId((prev) => {
          if (prev) return prev;
          const def = list.find((s) => s.isDefault);
          return def ? def._id : (list[0]?._id || null);
        });
      }
    } catch (err) {
      console.error('Failed to load stores in product form:', err);
    } finally {
      setIsStoreLoading(false);
    }
  }, [isVendor, getHeaders]);

  const handleQuickAddStore = async (e) => {
    e.preventDefault();
    if (!storeFormData.storeName.trim()) {
      toast.error('Store name is required');
      return;
    }
    try {
      setStoreSubmitting(true);
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const response = await axios.post(`${baseUrl}/vendor/portal/stores`, storeFormData, {
        withCredentials: true,
        headers: getHeaders(),
      });
      if (response.data.success) {
        toast.success('Store added successfully!');
        const updatedList = response.data.data || [];
        setStores(updatedList);
        const newlyAdded = updatedList[updatedList.length - 1];
        if (newlyAdded) {
          setSelectedStoreId(newlyAdded._id);
        }
        setIsStoreModalOpen(false);
        setStoreFormData({
          storeName: '',
          phone: '',
          storeDescription: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          country: 'India',
          pincode: '',
          isDefault: false,
        });
      }
    } catch (err) {
      console.error('Quick add store error:', err);
      toast.error(err.response?.data?.message || 'Failed to add store');
    } finally {
      setStoreSubmitting(false);
    }
  };

  // Manufacturer Selection State (Address-Book style for vendor products)
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedMfgId, setSelectedMfgId] = useState(null);
  const [isMfgLoading, setIsMfgLoading] = useState(false);
  const [isMfgModalOpen, setIsMfgModalOpen] = useState(false);
  const [mfgSubmitting, setMfgSubmitting] = useState(false);
  const [mfgFormData, setMfgFormData] = useState({
    manufacturerName: '',
    countryOfOrigin: 'India',
    manufacturerAddress: '',
    packer: '',
    packerPhone: '',
    packerAddress: '',
    isDefault: false,
  });

  const fetchManufacturers = useCallback(async () => {
    if (!isVendor) return;
    try {
      setIsMfgLoading(true);
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const response = await axios.get(`${baseUrl}/vendor/portal/manufacturers`, {
        withCredentials: true,
        headers: getHeaders(),
      });
      if (response.data.success) {
        const list = response.data.data || [];
        setManufacturers(list);
        setSelectedMfgId((prev) => {
          if (prev) return prev;
          const def = list.find((m) => m.isDefault);
          return def ? def._id : (list[0]?._id || null);
        });
      }
    } catch (err) {
      console.error('Failed to load manufacturers in product form:', err);
    } finally {
      setIsMfgLoading(false);
    }
  }, [isVendor, getHeaders]);

  useEffect(() => {
    if (isVendor) {
      fetchStores();
      fetchManufacturers();
    }
  }, [isVendor, fetchStores, fetchManufacturers]);

  const handleQuickAddMfg = async (e) => {
    e.preventDefault();
    if (!mfgFormData.manufacturerName.trim()) {
      toast.error('Manufacturer name is required');
      return;
    }
    try {
      setMfgSubmitting(true);
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const response = await axios.post(`${baseUrl}/vendor/portal/manufacturers`, mfgFormData, {
        withCredentials: true,
        headers: getHeaders(),
      });
      if (response.data.success) {
        toast.success('Manufacturer added successfully!');
        const updatedList = response.data.data || [];
        setManufacturers(updatedList);
        const newlyAdded = updatedList[updatedList.length - 1];
        if (newlyAdded) {
          setSelectedMfgId(newlyAdded._id);
        }
        setIsMfgModalOpen(false);
        setMfgFormData({
          manufacturerName: '',
          countryOfOrigin: 'India',
          manufacturerAddress: '',
          packer: '',
          packerPhone: '',
          packerAddress: '',
          isDefault: false,
        });
      }
    } catch (err) {
      console.error('Quick add manufacturer error:', err);
      toast.error(err.response?.data?.message || 'Failed to add manufacturer');
    } finally {
      setMfgSubmitting(false);
    }
  };

  // Submit & Edit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(isEdit);
  const fetchedAttributesRef = useRef([]);
  const initialBrandRef = useRef(null);
  const initialCategoryRef = useRef(null);

  // Validation State & Refs
  const [errors, setErrors] = useState({});
  const fieldRefs = useRef({});
  const setRef = useCallback((key) => (el) => {
    if (el) {
      fieldRefs.current[key] = el;
    }
  }, []);

  // Notify parent of changes for contextual info (prevent infinite loop)
  const onFormChangeRef = useRef(onFormChange);
  useEffect(() => {
    onFormChangeRef.current = onFormChange;
  });

  const prevContextRef = useRef({ title: '', categoryId: '', brandName: '' });

  useEffect(() => {
    if (isUnifiedMode && typeof onFormChangeRef.current === 'function') {
      const brandName = brands.find(b => b._id === formData.brand)?.name || '';
      const currentTitle = formData.title || '';
      const currentCat = formData.category || '';

      if (
        prevContextRef.current.title !== currentTitle ||
        prevContextRef.current.categoryId !== currentCat ||
        prevContextRef.current.brandName !== brandName
      ) {
        prevContextRef.current = {
          title: currentTitle,
          categoryId: currentCat,
          brandName
        };
        onFormChangeRef.current(prevContextRef.current);
      }
    }
  }, [formData.title, formData.category, formData.brand, brands, isUnifiedMode]);

  useImperativeHandle(ref, () => ({
    validateAndGetPayload: () => {
      let isValid = true;
      let newErrors = {};

      if (!formData.title.trim()) { newErrors.title = 'Title is required'; isValid = false; }
      if (!formData.slug.trim()) { newErrors.slug = 'Slug is required'; isValid = false; }
      if (!formData.shortDescription.trim()) { newErrors.shortDescription = 'Short description is required'; isValid = false; }
      if (!formData.longDescription.trim()) { newErrors.longDescription = 'Long description is required'; isValid = false; }
      if (!formData.department) { newErrors.department = 'Department is required'; isValid = false; }
      if (!formData.category) { newErrors.category = 'Category is required'; isValid = false; }
      if (!formData.brand) { newErrors.brand = 'Brand is required'; isValid = false; }

      if (isVendor) {
        if (!selectedStoreId) {
          newErrors.store = 'Store selection is required';
          isValid = false;
        }
        if (!selectedMfgId) {
          newErrors.manufacturer = 'Manufacturer selection is required';
          isValid = false;
        }
      }

      const payloadAttributes = [];
      dynamicAttributesConfig.forEach(config => {
        const attr = dynamicAttributes.find(a => a.attribute === config._id);
        const val = attr?.values?.[0];
        
        if (config.isRequired && (!val || val === '')) {
          newErrors[`attr_${config._id}`] = 'This attribute is required';
          isValid = false;
        }
        if (val && val !== '') {
          payloadAttributes.push({ attribute: config._id, values: [val] });
        }
      });

      setErrors(newErrors);

      if (!isValid) {
        return { isValid: false, errors: newErrors };
      }

      const selectedStore = stores.find(s => s._id === selectedStoreId);
      const storePayload = selectedStore ? {
        storeName: selectedStore.storeName,
        phone: selectedStore.phone,
        storeDescription: selectedStore.storeDescription,
        addressLine1: selectedStore.addressLine1,
        addressLine2: selectedStore.addressLine2,
        city: selectedStore.city,
        state: selectedStore.state,
        country: selectedStore.country,
        pincode: selectedStore.pincode,
      } : undefined;

      const selectedMfg = manufacturers.find(m => m._id === selectedMfgId);
      const mfgPayload = selectedMfg ? {
        manufacturerName: selectedMfg.manufacturerName,
        countryOfOrigin: selectedMfg.countryOfOrigin,
        manufacturerAddress: selectedMfg.manufacturerAddress,
        packer: selectedMfg.packer,
        packerPhone: selectedMfg.packerPhone,
        packerAddress: selectedMfg.packerAddress,
      } : undefined;

      return {
        isValid: true,
        payload: {
          ...formData,
          attributes: payloadAttributes,
          storeId: selectedStoreId || null,
          store: storePayload,
          manufacturerId: selectedMfgId || null,
          manufacturer: mfgPayload,
        }
      };
    }
  }));

  // For Edit Mode: Fetch Product Data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!isEdit || !id) return;
      try {
        const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const url = isVendor ? `${baseUrl}/vendor/portal/products/${id}` : `${baseUrl}/admin/products/${id}`;
        const response = await axios.get(url, {
          withCredentials: true,
          headers: getHeaders()
        });
        if (response.data.success) {
          const prod = response.data.data.product || response.data.data;
          const currentSlug = prod.slug || '';
          setFormData({
            title: prod.title || '',
            slug: currentSlug,
            shortDescription: prod.shortDescription || '',
            longDescription: prod.longDescription || '',
            status: prod.status || 'Active',
            department: prod.department?._id || '',
            category: prod.category?._id || '',
            brand: prod.brand?._id || '',
            returnable: prod.returnPolicy?.returnable ?? true,
            exchangeable: prod.returnPolicy?.exchangeable ?? true,
            returnDays: prod.returnPolicy?.returnDays ?? 7
          });
          if (prod.storeId) {
            setSelectedStoreId(prod.storeId);
          }
          if (prod.manufacturerId) {
            setSelectedMfgId(prod.manufacturerId);
          }
          // If product had a custom slug differing from auto-slug, mark as modified, else keep auto-typing enabled
          const autoSlug = slugify(prod.title || '');
          if (currentSlug && currentSlug !== autoSlug) {
            setSlugModified(true);
          } else {
            setSlugModified(false);
          }
          if (prod.brand) {
            const brandObj = typeof prod.brand === 'object'
              ? { _id: prod.brand._id, name: prod.brand.name }
              : { _id: prod.brand, name: 'Current Brand' };
            initialBrandRef.current = brandObj;
            setBrands(prev => {
              if (brandObj._id && !prev.some(b => (b._id || b.id) === brandObj._id)) {
                return [brandObj, ...prev];
              }
              return prev;
            });
          }
          if (prod.category) {
            const catObj = typeof prod.category === 'object'
              ? { _id: prod.category._id, name: prod.category.name }
              : { _id: prod.category, name: 'Current Category' };
            initialCategoryRef.current = catObj;
            setCategories(prev => {
              if (catObj._id && !prev.some(c => (c._id || c.id) === catObj._id)) {
                return [catObj, ...prev];
              }
              return prev;
            });
          }
          fetchedAttributesRef.current = prod.attributes || [];
        }
      } catch (error) {
        console.error('Failed to load product', error);
        toast.error('Failed to load product data');
      }
    };
    fetchProduct();
  }, [isEdit, id]);

  // Fetch initial data (Departments)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsDepartmentsLoading(true);
        const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const res = await axios.get(`${baseUrl}/departments`, { 
          params: { limit: 1000, status: 'Active' },
          headers: getHeaders()
        });
        if (res.data.success) {
          setDepartments(res.data.departments || res.data.data);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
        toast.error('Failed to load departments.');
      } finally {
        setIsDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, [getHeaders]);

  // Fetch Categories and Brands when Department changes
  useEffect(() => {
    const fetchCascadingOptions = async () => {
      if (!formData.department) {
        setCategories([]);
        setBrands([]);
        return;
      }

      try {
        setIsCategoriesLoading(true);
        setIsBrandsLoading(true);

        const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const headers = getHeaders();

        const [catsRes, brandsRes] = await Promise.all([
          axios.get(`${baseUrl}/categories`, { 
            params: { limit: 1000, status: 'Active', department: formData.department, departmentId: formData.department },
            headers
          }),
          axios.get(`${baseUrl}/brands`, { 
            params: { limit: 1000, status: 'Active', department: formData.department, departmentId: formData.department },
            headers
          })
        ]);

        if (catsRes.data.success) {
          let cats = catsRes.data.categories || catsRes.data.data || [];
          cats = cats.filter(c => c.departmentIds && c.departmentIds.some(d => (d._id ? d._id.toString() : d.toString()) === formData.department.toString()));
          if (initialCategoryRef.current?._id && !cats.some(c => (c._id || c.id) === initialCategoryRef.current._id)) {
            cats.unshift(initialCategoryRef.current);
          }
          setCategories(cats);
        }

        if (brandsRes.data.success) {
          let bs = brandsRes.data.brands || brandsRes.data.data || [];
          bs = bs.filter(b => b.departmentIds && b.departmentIds.some(d => (d._id ? d._id.toString() : d.toString()) === formData.department.toString()));
          if (initialBrandRef.current?._id && !bs.some(b => (b._id || b.id) === initialBrandRef.current._id)) {
            bs.unshift(initialBrandRef.current);
          }
          setBrands(bs);
        }
      } catch (error) {
        console.error('Failed to fetch cascading options:', error);
        toast.error('Failed to load categories/brands.');
        setCategories([]);
        setBrands([]);
      } finally {
        setIsCategoriesLoading(false);
        setIsBrandsLoading(false);
      }
    };

    fetchCascadingOptions();
  }, [formData.department, getHeaders]);

  // Fetch Dynamic Attributes when Category changes
  useEffect(() => {
    const fetchDynamicAttributes = async () => {
      if (!isInitialLoad) {
        setDynamicAttributesConfig([]);
        setDynamicAttributes([]);
      }

      if (!formData.category) {
        return;
      }

      try {
        setIsDynamicAttributesLoading(true);
        const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
        const headers = getHeaders();
        const attrUrl = isVendor
          ? `${baseUrl}/vendor/portal/categories/${formData.category}/attributes?usage=Product`
          : `${baseUrl}/admin/attribute-mapping/${formData.category}/attributes?usage=Product`;

        const { data } = await axios.get(attrUrl, {
          withCredentials: true,
          headers
        });

        if (data.success && data.attributes) {
          let attrs = data.attributes;

          const configList = [];
          const initialData = [];

          for (const attr of attrs) {
            // Include all attributes (do not skip Color/Size)
            let options = [];
            if (['select', 'color', 'multiselect'].includes(attr.fieldType)) {
              try {
                const optRes = await axios.get(`${baseUrl}/attribute-options/attribute/${attr._id}?limit=1000`, { headers });
                if (optRes.data.success) {
                  options = optRes.data.options;
                }
              } catch (optErr) {
                console.error(`Failed to load options for attribute ${attr.name}:`, optErr);
              }
            }

            configList.push({
              _id: attr._id,
              name: attr.name,
              fieldType: attr.fieldType,
              isRequired: attr.isRequired, // Assume Attributes have isRequired if needed, or default false
              options
            });

            const existingVal = fetchedAttributesRef.current?.find(a =>
              (a.attribute?._id || a.attribute)?.toString() === attr._id.toString()
            );

            let initialValues = [];
            if (existingVal && Array.isArray(existingVal.values) && existingVal.values.length > 0) {
              initialValues = existingVal.values.map(v => {
                const matchedOpt = options.find(o => 
                  o.storedValue === v || 
                  o.displayName === v || 
                  o.displayName?.toLowerCase() === v?.toString().toLowerCase() ||
                  o.storedValue?.toLowerCase() === v?.toString().toLowerCase()
                );
                return matchedOpt ? matchedOpt.storedValue : v;
              });
            }

            initialData.push({
              attribute: attr._id,
              values: initialValues
            });
          }

          setDynamicAttributesConfig(configList);
          setDynamicAttributes(initialData);

          if (isInitialLoad) {
            setIsInitialLoad(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dynamic attributes:', error);
        toast.error('Failed to load dynamic attributes.');
      } finally {
        setIsDynamicAttributesLoading(false);
      }
    };

    fetchDynamicAttributes();
  }, [formData.category, isInitialLoad]);

  // Handlers
  const clearError = (field) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleNameChange = (e) => {
    const newTitle = e.target.value;
    clearError('title');
    if (!slugModified || !formData.slug.trim()) {
      const generatedSlug = slugify(newTitle, true);
      setFormData(prev => ({ ...prev, title: newTitle, slug: generatedSlug }));
      clearError('slug');
    } else {
      setFormData(prev => ({ ...prev, title: newTitle }));
    }
  };

  const handleSlugChange = (e) => {
    const val = e.target.value;
    clearError('slug');
    if (!val.trim()) {
      setSlugModified(false);
      setFormData(prev => ({ ...prev, slug: '' }));
    } else {
      setSlugModified(true);
      setFormData(prev => ({ ...prev, slug: val }));
    }
  };

  const handleTitleBlur = () => {
    if (!slugModified && formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(prev.slug)
      }));
    }
  };

  const handleSlugBlur = () => {
    if (formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: slugify(prev.slug)
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    clearError(name);
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate Form
    if (!formData.title?.trim()) newErrors.title = "Product Name is required.";
    if (!formData.slug?.trim()) newErrors.slug = "Product Slug is required.";
    if (!formData.department) newErrors.department = "Please select a department.";
    if (!formData.category) newErrors.category = "Please select a category.";
    if (!formData.brand) newErrors.brand = "Please select a brand.";
    if (!formData.shortDescription?.trim()) newErrors.shortDescription = "Short Description is required.";
    if (!formData.longDescription?.trim()) newErrors.longDescription = "Long Description is required.";

    // Validate Dynamic Attributes
    for (const config of dynamicAttributesConfig) {
      if (config.isRequired) {
        const attrVal = dynamicAttributes.find(a => a.attribute === config._id);
        if (!attrVal || !attrVal.values || attrVal.values.length === 0 || attrVal.values[0] === '') {
          newErrors[`attr_${config._id}`] = `${config.name} is required.`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const errorKeys = Object.keys(newErrors);
      const orderedFields = ['title', 'slug', 'department', 'category', 'brand', 'shortDescription', 'longDescription'];
      let firstErrorKey = orderedFields.find(f => errorKeys.includes(f));
      if (!firstErrorKey) {
        firstErrorKey = errorKeys.find(k => k.startsWith('attr_'));
      }
      if (firstErrorKey && fieldRefs.current[firstErrorKey]) {
        const el = fieldRefs.current[firstErrorKey];
        if (typeof el.focus === 'function') el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Construct Payload
    const payload = {
      title: formData.title,
      slug: formData.slug,
      shortDescription: formData.shortDescription,
      longDescription: formData.longDescription,
      status: formData.status,
      department: formData.department,
      category: formData.category,
      brand: formData.brand,
      attributes: dynamicAttributes.filter(a => a.values && a.values.length > 0 && a.values[0] !== ''), // only send non-empty attributes
      returnPolicy: {
        returnable: formData.returnable,
        exchangeable: formData.exchangeable,
        returnDays: parseInt(formData.returnDays) || 0
      }
    };

    setIsSubmitting(true);

    try {
      const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:8000';
      const headers = getHeaders();
      if (isEdit) {
        const updateUrl = isVendor ? `${baseUrl}/vendor/portal/products/${id}` : `${baseUrl}/admin/products/${id}`;
        const response = await axios.put(updateUrl, payload, {
          withCredentials: true,
          headers
        });
        if (response.data.success) {
          toast.success('Product updated successfully');
          navigate(isVendor ? `/vendor/portal/products/${id}/variants` : `/admin/products/${id}/variants`);
        }
      } else {
        const createUrl = isVendor ? `${baseUrl}/vendor/portal/products` : `${baseUrl}/admin/products`;
        const response = await axios.post(createUrl, payload, {
          withCredentials: true,
          headers
        });
        if (response.data.success) {
          toast.success('Product created successfully. Now add variants.');
          const newProductId = response.data.data._id;
          navigate(isVendor ? `/vendor/portal/products/${newProductId}/variants` : `/admin/products/${newProductId}/variants`);
        }
      }
    } catch (error) {
      console.error('Submit error', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Dynamic Field Component
  const renderDynamicField = (config) => {
    const currentAttr = dynamicAttributes.find(a => a.attribute === config._id);
    const currentValue = currentAttr?.values[0] || '';
    const hasError = !!errors[`attr_${config._id}`];
    const borderClass = hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]';

    const handleValueChange = (val) => {
      setDynamicAttributes(prev => prev.map(attr =>
        attr.attribute === config._id ? { ...attr, values: [val] } : attr
      ));
      clearError(`attr_${config._id}`);
    };

    switch (config.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`w-full px-4 h-12 border ${borderClass} rounded-lg outline-none focus:ring-1 transition-colors`}
            placeholder={`Enter ${config.name}`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`w-full px-4 h-12 border ${borderClass} rounded-lg outline-none focus:ring-1 transition-colors`}
            placeholder={`Enter ${config.name}`}
          />
        );
      case 'select':
      case 'multiselect':
        const matchedOpt = config.options.find(
          o => o.storedValue === currentValue || 
               o.displayName === currentValue || 
               o.displayName?.toLowerCase() === currentValue?.toString().toLowerCase() ||
               o.storedValue?.toLowerCase() === currentValue?.toString().toLowerCase()
        );
        const resolvedVal = matchedOpt ? matchedOpt.storedValue : currentValue;
        return (
          <select
            value={resolvedVal}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`w-full px-4 h-12 border ${borderClass} rounded-lg outline-none focus:ring-1 transition-colors bg-white cursor-pointer text-sm`}
          >
            <option value="">-- Select {config.name} --</option>
            {config.options.map(opt => (
              <option key={opt._id} value={opt.storedValue}>{opt.displayName}</option>
            ))}
          </select>
        );
      case 'color':
        return (
          <div className="flex flex-col gap-2">
            <div className={`flex flex-wrap gap-2 p-2 rounded-lg border ${hasError ? 'border-red-500 bg-red-50' : 'border-transparent'}`}>
              {config.options.map(opt => (
                <button
                  key={opt._id}
                  type="button"
                  onClick={() => handleValueChange(opt.storedValue)}
                  className={`flex items-center gap-2 px-3 h-12 rounded-lg border transition-all ${currentValue === opt.storedValue
                      ? isVendor
                        ? 'border-[#fe4a03] bg-[#fe4a03]/5 ring-1 ring-[#fe4a03]'
                        : 'border-[#4648d4] bg-[#4648d4]/5 ring-1 ring-[#4648d4]'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                    style={{ backgroundColor: opt.storedValue }}
                  />
                  <span className="text-sm font-medium text-gray-700">{opt.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <form onSubmit={handleSubmit} className="w-full relative flex flex-col">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
           <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isVendor ? 'bg-[#fe4a03]' : 'bg-[#4648d4]'} text-white font-bold text-sm`}>1</span>
           <div>
             <h3 className="text-lg font-bold text-slate-900">Product Information</h3>
             <p className="text-xs text-gray-500">Basic details about your product</p>
           </div>
        </div>

        {/* Basic Information - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {/* Row 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
            <input
              ref={setRef('title')}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleNameChange}
              onBlur={handleTitleBlur}
              placeholder="e.g. Men Solid Polo Collar T-shirt"
              className={`w-full px-4 h-11 border ${errors.title ? 'border-red-500 focus:ring-red-500' : isVendor ? 'border-gray-200 focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]'} rounded-lg outline-none focus:ring-1 transition-colors`}
            />
            {errors.title && <span className="text-red-500 text-xs mt-1 block">❌ {errors.title}</span>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Product Slug <span className="text-red-500">*</span></label>
              {formData.title && (
                <button
                  type="button"
                  onClick={() => {
                    const generated = slugify(formData.title);
                    setFormData(prev => ({ ...prev, slug: generated }));
                    setSlugModified(false);
                    clearError('slug');
                  }}
                  className={`text-xs ${isVendor ? 'text-[#fe4a03]' : 'text-[#4648d4]'} hover:underline font-medium cursor-pointer`}
                  title="Generate slug from product name"
                >
                  Auto-generate
                </button>
              )}
            </div>
            <input
              ref={setRef('slug')}
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleSlugChange}
              onBlur={handleSlugBlur}
              placeholder="e.g. men-solid-polo-collar-t-shirt"
              className={`w-full px-4 h-11 border ${errors.slug ? 'border-red-500 focus:ring-red-500' : isVendor ? 'border-gray-200 focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]'} rounded-lg outline-none focus:ring-1 transition-colors font-mono text-sm`}
            />
            {errors.slug && <span className="text-red-500 text-xs mt-1 block">❌ {errors.slug}</span>}
          </div>
          <div ref={setRef('department')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={formData.department}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, department: val, category: '', brand: '' }));
                clearError('department');
                clearError('category');
                clearError('brand');
              }}
              disabled={isDepartmentsLoading}
              options={[{ value: '', label: isDepartmentsLoading ? "Loading..." : "-- Select --" }, ...departments.map(d => ({ value: d._id, label: d.name }))]}
            />
            {errors.department && <span className="text-red-500 text-xs mt-1 block">❌ {errors.department}</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-4 h-11 border border-gray-200 rounded-lg outline-none ${isVendor ? 'focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'focus:border-[#4648d4] focus:ring-[#4648d4]'} focus:ring-1 transition-colors bg-white cursor-pointer`}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Row 2 */}
          <div ref={setRef('category')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={formData.category}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, category: val }));
                clearError('category');
              }}
              disabled={!formData.department || isCategoriesLoading}
              options={[{ value: '', label: !formData.department ? "-- Department First --" : isCategoriesLoading ? "Loading..." : "-- Select --" }, ...categories.map(c => ({ value: c._id, label: c.name }))]}
            />
            {errors.category && <span className="text-red-500 text-xs mt-1 block">❌ {errors.category}</span>}
          </div>
          <div ref={setRef('brand')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={formData.brand}
              onChange={(val) => {
                setFormData(prev => ({ ...prev, brand: val }));
                clearError('brand');
              }}
              disabled={!formData.department || isBrandsLoading}
              options={[{ value: '', label: !formData.department ? "-- Department First --" : isBrandsLoading ? "Loading..." : "-- Select --" }, ...brands.map(b => ({ value: b._id, label: b.name }))]}
            />
            {errors.brand && <span className="text-red-500 text-xs mt-1 block">❌ {errors.brand}</span>}
          </div>
        </div>

        {/* Descriptions - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short Description <span className="text-red-500">*</span></label>
            <textarea
              ref={setRef('shortDescription')}
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Brief summary of the product"
              className={`w-full px-4 py-2 min-h-[80px] border ${errors.shortDescription ? 'border-red-500 focus:ring-red-500' : isVendor ? 'border-gray-200 focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]'} rounded-lg outline-none focus:ring-1 transition-colors resize-y`}
            />
            {errors.shortDescription && <span className="text-red-500 text-xs mt-1 block">❌ {errors.shortDescription}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Long Description <span className="text-red-500">*</span></label>
            <textarea
              ref={setRef('longDescription')}
              name="longDescription"
              value={formData.longDescription}
              onChange={handleChange}
              placeholder="Detailed description..."
              className={`w-full px-4 py-2 min-h-[80px] border ${errors.longDescription ? 'border-red-500 focus:ring-red-500' : isVendor ? 'border-gray-200 focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]'} rounded-lg outline-none focus:ring-1 transition-colors resize-y`}
            ></textarea>
            {errors.longDescription && <span className="text-red-500 text-xs mt-1 block">❌ {errors.longDescription}</span>}
          </div>
        </div>
      </div>

      {/* Dynamic Attributes or Info Card */}
      {formData.category && !isDynamicAttributesLoading && dynamicAttributesConfig.length === 0 ? (
        <div className="p-6 sm:p-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isVendor ? 'bg-[#fe4a03]' : 'bg-[#4648d4]'} text-white font-bold text-sm`}>2</span>
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Attributes</h3>
                 <p className="text-xs text-gray-500">Product specific attributes</p>
               </div>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-2">No product attributes mapped to this category yet.</p>
          <p className="text-sm text-gray-600 mb-3">You can continue below to configure variants:</p>
          <ul className="text-sm text-gray-600 mb-4 ml-1 space-y-1">
            <li>• Color</li>
            <li>• Size</li>
            <li>• SKU</li>
            <li>• Stock</li>
            <li>• Images</li>
            <li>• Price</li>
          </ul>
        </div>
      ) : (
        <div className="p-6 sm:p-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isVendor ? 'bg-[#fe4a03]' : 'bg-[#4648d4]'} text-white font-bold text-sm`}>2</span>
               <div>
                 <h3 className="text-lg font-bold text-slate-900">Attributes</h3>
                 <p className="text-xs text-gray-500">Product specific attributes</p>
               </div>
            </div>
          </div>

          {isDynamicAttributesLoading ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 bg-gray-50/50 rounded-xl">
              <div className={`w-6 h-6 border-2 ${isVendor ? 'border-[#fe4a03]' : 'border-[#4648d4]'} border-t-transparent rounded-full animate-spin mb-2`}></div>
              <span className="text-sm text-gray-500 font-medium">Loading attributes...</span>
            </div>
          ) : !formData.category ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-gray-200 bg-gray-50/50 rounded-xl min-h-[140px]">
              <span className="text-sm text-gray-500 font-medium">Select a Category to load product attributes.</span>
              <p className="text-xs text-gray-400 mt-1">Attributes will appear here based on the selected category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {dynamicAttributesConfig.map((config) => (
                <div key={config._id} className="flex flex-col" ref={setRef(`attr_${config._id}`)}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {config.name} {config.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  {renderDynamicField(config)}
                  {errors[`attr_${config._id}`] && <span className="text-red-500 text-xs mt-1 block">❌ {errors[`attr_${config._id}`]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Return & Exchange Policy */}
      <div className="p-6 sm:p-8 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-6">
           <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isVendor ? 'bg-[#fe4a03]' : 'bg-[#4648d4]'} text-white font-bold text-sm`}>3</span>
           <div>
             <h3 className="text-lg font-bold text-slate-900">Return / Exchange</h3>
             <p className="text-xs text-gray-500">Set return and exchange policy</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 sm:gap-12">
          {/* Returnable Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Returnable</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="returnable"
                checked={formData.returnable}
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isVendor ? 'peer-checked:bg-[#fe4a03]' : 'peer-checked:bg-[#4648d4]'}`}></div>
            </label>
          </div>

          {/* Exchangeable Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Exchangeable</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="exchangeable"
                checked={formData.exchangeable}
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isVendor ? 'peer-checked:bg-[#fe4a03]' : 'peer-checked:bg-[#4648d4]'}`}></div>
            </label>
          </div>

          {/* Return Window */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Return In</span>
            <input
              type="number"
              name="returnDays"
              min="0"
              value={formData.returnDays}
              onChange={handleChange}
              disabled={!formData.returnable && !formData.exchangeable}
              className={`w-16 h-10 px-3 text-center border border-gray-200 rounded-lg outline-none ${isVendor ? 'focus:border-[#fe4a03] focus:ring-[#fe4a03]' : 'focus:border-[#4648d4] focus:ring-[#4648d4]'} focus:ring-1 disabled:bg-gray-100 transition-colors`}
            />
            <span className="text-sm font-medium text-gray-700">days</span>
          </div>
        </div>
      </div>

      {/* 4. Store Details (Vendor Selection - Dropdown) */}
      {isVendor && (
        <div className="p-6 sm:p-8 border-t border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isVendor ? 'bg-[#fe4a03]' : 'bg-[#4648d4]'} text-white font-bold text-sm`}>
                4
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Store size={18} className="text-[#fe4a03]" /> Store Details
                </h3>
                <p className="text-xs text-gray-500">
                  Select which store and fulfillment location supplies this product
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStoreModalOpen(true)}
              className="text-xs font-bold text-[#fe4a03] border border-[#fe4a03] px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={15} /> ADD NEW STORE
            </button>
          </div>

          {isStoreLoading ? (
            <div className="p-8 text-center flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#fe4a03] animate-spin" />
            </div>
          ) : stores.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50/50 space-y-3">
              <div className="w-10 h-10 bg-orange-50 text-[#fe4a03] rounded-xl flex items-center justify-center mx-auto">
                <Store size={20} />
              </div>
              <p className="text-xs text-gray-500">No stores saved yet. Add one to continue.</p>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(true)}
                className="px-4 py-2 bg-[#fe4a03] text-white rounded-lg text-xs font-bold hover:bg-[#e03f00] transition-colors cursor-pointer"
              >
                + Add Store
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Store <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedStoreId || ''}
                    onChange={(e) => {
                      setSelectedStoreId(e.target.value);
                      clearError('store');
                    }}
                    className={`w-full appearance-none bg-white px-4 py-3 pr-10 border ${errors.store ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] transition-colors cursor-pointer`}
                  >
                    <option value="" disabled>-- Select Store --</option>
                    {stores.map((st) => {
                      const addrParts = [st.addressLine1, st.city, st.state, st.pincode].filter(Boolean);
                      const addrStr = addrParts.join(', ');
                      const label = addrStr ? `${st.storeName} — ${addrStr}` : st.storeName;
                      return (
                        <option key={st._id} value={st._id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
                {errors.store && <span className="text-red-500 text-xs mt-1 block">❌ {errors.store}</span>}
              </div>

              {/* Selected Store preview showing only store name and address */}
              {(() => {
                const current = stores.find((s) => s._id === selectedStoreId);
                if (!current) return null;
                const addrParts = [
                  current.addressLine1,
                  current.addressLine2,
                  current.city,
                  current.state,
                  current.pincode,
                  current.country,
                ].filter(Boolean);
                const fullAddr = addrParts.join(', ');

                return (
                  <div className="p-3.5 bg-orange-50/50 border border-orange-200/80 rounded-xl flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#fe4a03]/10 text-[#fe4a03] flex items-center justify-center shrink-0 mt-0.5">
                      <Store size={15} />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{current.storeName}</span>
                        {current.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Default Store
                          </span>
                        )}
                        {current.phone && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {current.phone}
                          </span>
                        )}
                      </div>
                      {fullAddr && (
                        <div className="flex items-start gap-1 text-slate-600 mt-1">
                          <MapPin size={13} className="text-[#fe4a03] shrink-0 mt-0.5" />
                          <span className="leading-snug">{fullAddr}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 5. Manufacturer & Compliance Details (Vendor Selection - Dropdown) */}
      {isVendor && (
        <div className="p-6 sm:p-8 border-t border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${isVendor ? 'bg-[#fe4a03]' : 'bg-[#4648d4]'} text-white font-bold text-sm`}>
                5
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Factory size={18} className="text-[#fe4a03]" /> Manufacturer Details
                </h3>
                <p className="text-xs text-gray-500">
                  Select which manufacturer and compliance profile applies to this product
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMfgModalOpen(true)}
              className="text-xs font-bold text-[#fe4a03] border border-[#fe4a03] px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={15} /> ADD NEW MANUFACTURER
            </button>
          </div>

          {isMfgLoading ? (
            <div className="p-8 text-center flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#fe4a03] animate-spin" />
            </div>
          ) : manufacturers.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50/50 space-y-3">
              <div className="w-10 h-10 bg-orange-50 text-[#fe4a03] rounded-xl flex items-center justify-center mx-auto">
                <Factory size={20} />
              </div>
              <p className="text-xs text-gray-500">No manufacturers saved yet. Add one to continue.</p>
              <button
                type="button"
                onClick={() => setIsMfgModalOpen(true)}
                className="px-4 py-2 bg-[#fe4a03] text-white rounded-lg text-xs font-bold hover:bg-[#e03f00] transition-colors cursor-pointer"
              >
                + Add Manufacturer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Manufacturer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedMfgId || ''}
                    onChange={(e) => {
                      setSelectedMfgId(e.target.value);
                      clearError('manufacturer');
                    }}
                    className={`w-full appearance-none bg-white px-4 py-3 pr-10 border ${errors.manufacturer ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03] transition-colors cursor-pointer`}
                  >
                    <option value="" disabled>-- Select Manufacturer --</option>
                    {manufacturers.map((mfg) => {
                      const label = mfg.manufacturerAddress
                        ? `${mfg.manufacturerName} — ${mfg.manufacturerAddress}`
                        : mfg.manufacturerName;
                      return (
                        <option key={mfg._id} value={mfg._id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <ChevronDown size={18} />
                  </div>
                </div>
                {errors.manufacturer && <span className="text-red-500 text-xs mt-1 block">❌ {errors.manufacturer}</span>}
              </div>

              {/* Selected Manufacturer preview showing only manufacturer name and address */}
              {(() => {
                const current = manufacturers.find((m) => m._id === selectedMfgId);
                if (!current) return null;
                return (
                  <div className="p-3.5 bg-orange-50/50 border border-orange-200/80 rounded-xl flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#fe4a03]/10 text-[#fe4a03] flex items-center justify-center shrink-0 mt-0.5">
                      <Factory size={15} />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{current.manufacturerName}</span>
                        {current.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Default
                          </span>
                        )}
                      </div>
                      {current.manufacturerAddress && (
                        <div className="flex items-start gap-1 text-slate-600 mt-1">
                          <MapPin size={13} className="text-[#fe4a03] shrink-0 mt-0.5" />
                          <span className="leading-snug">{current.manufacturerAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* QUICK ADD STORE MODAL */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                  <Store size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Store Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeFormData.storeName}
                    onChange={(e) => setStoreFormData((prev) => ({ ...prev, storeName: e.target.value }))}
                    placeholder="e.g. Acme Lifestyle Store - Bandra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Phone / Support Contact
                  </label>
                  <input
                    type="tel"
                    value={storeFormData.phone}
                    onChange={(e) => setStoreFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Description / Tagline
                  </label>
                  <textarea
                    rows={2}
                    value={storeFormData.storeDescription}
                    onChange={(e) => setStoreFormData((prev) => ({ ...prev, storeDescription: e.target.value }))}
                    placeholder="Brief description or warehouse notes..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address Line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeFormData.addressLine1}
                    onChange={(e) => setStoreFormData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    placeholder="Building No., Floor, Street Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={storeFormData.addressLine2}
                    onChange={(e) => setStoreFormData((prev) => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="Locality, Area, Landmark"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeFormData.city}
                      onChange={(e) => setStoreFormData((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeFormData.state}
                      onChange={(e) => setStoreFormData((prev) => ({ ...prev, state: e.target.value }))}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={storeFormData.pincode}
                      onChange={(e) => setStoreFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                      placeholder="e.g. 400001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={storeFormData.country}
                      onChange={(e) => setStoreFormData((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="e.g. India"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddStore}
                  disabled={storeSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {storeSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save & Select"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD MANUFACTURER MODAL */}
      {isMfgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#fe4a03] flex items-center justify-center">
                  <Factory size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Manufacturer</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMfgModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manufacturer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mfgFormData.manufacturerName}
                    onChange={(e) => setMfgFormData((prev) => ({ ...prev, manufacturerName: e.target.value }))}
                    placeholder="e.g. Acme Lifestyle Manufacturing Ltd."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={mfgFormData.countryOfOrigin}
                    onChange={(e) => setMfgFormData((prev) => ({ ...prev, countryOfOrigin: e.target.value }))}
                    placeholder="e.g. India"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Manufacturer Address
                  </label>
                  <textarea
                    rows={2}
                    value={mfgFormData.manufacturerAddress}
                    onChange={(e) => setMfgFormData((prev) => ({ ...prev, manufacturerAddress: e.target.value }))}
                    placeholder="Plot No., Industrial Area, City, State, Pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Packer</label>
                    <input
                      type="text"
                      value={mfgFormData.packer}
                      onChange={(e) => setMfgFormData((prev) => ({ ...prev, packer: e.target.value }))}
                      placeholder="e.g. Acme Logistics"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Packer Phone</label>
                    <input
                      type="tel"
                      value={mfgFormData.packerPhone}
                      onChange={(e) => setMfgFormData((prev) => ({ ...prev, packerPhone: e.target.value }))}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Packer Address</label>
                  <textarea
                    rows={2}
                    value={mfgFormData.packerAddress}
                    onChange={(e) => setMfgFormData((prev) => ({ ...prev, packerAddress: e.target.value }))}
                    placeholder="Fulfillment / packaging facility address..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#fe4a03]/20 focus:border-[#fe4a03]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMfgModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddMfg}
                  disabled={mfgSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#fe4a03] hover:bg-[#e03f00] text-white text-xs font-bold shadow-md shadow-[#fe4a03]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {mfgSubmitting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save & Select"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Actions (Only in non-unified mode) */}
      {!isUnifiedMode && (
        <div className="flex justify-center gap-4 py-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate(isVendor ? '/vendor/portal/products' : '/admin/products')}
            className="h-10 px-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`h-10 px-8 text-sm font-medium text-white ${isVendor ? 'bg-[#fe4a03] hover:bg-[#e03f00] shadow-[#fe4a03]/25' : 'bg-[#4648d4] hover:bg-[#3b3db0]'} rounded-lg shadow-sm transition-colors flex items-center justify-center min-w-[200px] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              isEdit ? 'Update Product →' : 'Save Product & Add Variants →'
            )}
          </button>
        </div>
      )}
    </form>
  );
});

export default ProductForm;
