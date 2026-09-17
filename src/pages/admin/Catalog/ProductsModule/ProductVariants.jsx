import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, UploadCloud, Save, ArrowLeft, Package, Edit2, Image as ImageIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Breadcrumbs from '../../../../components/admin/ui/Breadcrumbs';

const ProductVariants = forwardRef(({ isUnifiedMode = false, categoryId = null, productTitle = '', brandName = '' }, ref) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  
  // Dynamic Attributes
  const [mappedAttributes, setMappedAttributes] = useState([]);
  const [attributeOptionsMap, setAttributeOptionsMap] = useState({});
  
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Derived Attributes
  const primaryAttribute = useMemo(() => {
    if (!mappedAttributes || mappedAttributes.length === 0) return null;
    const leadAttr = mappedAttributes.find(a => /^(color|color \/ shade|shade|fragrance \/ scent|fragrance|scent|flavor|flavour)$/i.test(a.name) || a.fieldType === 'color');
    if (leadAttr) return leadAttr;
    return mappedAttributes[0];
  }, [mappedAttributes]);

  const secondaryAttributes = useMemo(() => {
    if (!primaryAttribute) return [];
    return mappedAttributes.filter(a => a._id !== primaryAttribute._id);
  }, [mappedAttributes, primaryAttribute]);

  const isColorGroup = primaryAttribute?.fieldType === 'color' || /^(color|color \/ shade|shade|fragrance \/ scent|fragrance|scent)$/i.test(primaryAttribute?.name || '');

  // Form State (Grouped)
  const getEmptyGroup = () => {
    return {
      primaryOption: '',
      mainImage: null,
      galleryImages: [],
      items: [
        {
          id: Date.now(),
          secondaryOptions: secondaryAttributes.reduce((acc, attr) => ({ ...acc, [attr._id]: '' }), {}),
          sku: '',
          mrp: '',
          price: '',
          gstRate: '',
          stock: 0,
          status: 'Active'
        }
      ]
    };
  };

  const [currentGroup, setCurrentGroup] = useState(null);
  const [editingPrimaryOption, setEditingPrimaryOption] = useState(null);

  // Live Preview State
  const [previewPrimaryOption, setPreviewPrimaryOption] = useState(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Initial Form Setup
  useEffect(() => {
    if (!currentGroup && mappedAttributes.length > 0 && primaryAttribute) {
      setCurrentGroup(getEmptyGroup());
    }
  }, [mappedAttributes, primaryAttribute]);

  // Handle preview images
  const groupedVariants = useMemo(() => {
    if (!primaryAttribute || variants.length === 0) return [];
    const groups = new Map();
    
    variants.forEach(v => {
      const pAttr = v.attributes.find(a => String(a.attribute?._id || a.attribute) === String(primaryAttribute._id));
      const pOptId = pAttr ? String(pAttr.option?._id || pAttr.option) : 'unknown';
      
      if (!groups.has(pOptId)) {
        groups.set(pOptId, {
          primaryOption: pOptId,
          mainImage: v.mainImage,
          galleryImages: v.galleryImages || [],
          items: []
        });
      }
      
      const secOpts = {};
      secondaryAttributes.forEach(sa => {
        const sAttr = v.attributes.find(a => String(a.attribute?._id || a.attribute) === String(sa._id));
        secOpts[sa._id] = sAttr ? String(sAttr.option?._id || sAttr.option) : '';
      });
      
      groups.get(pOptId).items.push({
        _id: v._id,
        secondaryOptions: secOpts,
        sku: v.sku,
        stock: v.stock,
        mrp: v.mrp,
        price: v.price,
        gstRate: v.gstRate,
        status: v.status
      });
    });
    
    return Array.from(groups.values());
  }, [variants, primaryAttribute, secondaryAttributes]);

  // Auto-slide effect for Live Preview
  useEffect(() => {
    let images = [];
    
    // Determine active group images
    if (editingPrimaryOption !== null && currentGroup && previewPrimaryOption === editingPrimaryOption) {
      if (currentGroup.mainImage) images.push(currentGroup.mainImage);
      if (currentGroup.galleryImages) images.push(...currentGroup.galleryImages);
    } else if (previewPrimaryOption !== null) {
      const group = groupedVariants.find(g => g.primaryOption === previewPrimaryOption);
      if (group) {
        if (group.mainImage) images.push(group.mainImage);
        if (group.galleryImages) images.push(...group.galleryImages);
      }
    } else if (groupedVariants.length > 0) {
      const group = groupedVariants[0];
      if (group.mainImage) images.push(group.mainImage);
      if (group.galleryImages) images.push(...group.galleryImages);
    } else if (currentGroup) {
      if (currentGroup.mainImage) images.push(currentGroup.mainImage);
      if (currentGroup.galleryImages) images.push(...currentGroup.galleryImages);
    }

    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setPreviewImageIndex(prev => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [previewPrimaryOption, groupedVariants, editingPrimaryOption, currentGroup]);


  // Load Data
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
      
      let catId = categoryId; // From props for unified mode

      if (id) {
        let prodData = null;
        try {
          const prodRes = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/products/${id}`, { 
            withCredentials: true,
            signal: abortController.signal
          });
          if (prodRes.data.success) {
            prodData = prodRes.data.data.product || prodRes.data.data;
            setProduct(prodData);
            catId = prodData.category?._id || prodData.category;
          }
        } catch (err) {
          if (axios.isCancel(err)) return;
          toast.error("Failed to load Product");
        }

        try {
          const varRes = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/products/${id}/variants`, { 
            withCredentials: true,
            signal: abortController.signal
          });
          if (varRes.data.success) {
            const loadedVariants = varRes.data.data.map(v => ({
              ...v,
              attributes: v.attributes.map(a => ({
                attribute: typeof a.attribute === 'object' ? a.attribute._id : a.attribute,
                option: typeof a.option === 'object' ? a.option._id : a.option
              }))
            }));
            setVariants(loadedVariants);
          }
        } catch (err) {
          if (axios.isCancel(err)) return;
          toast.error("Failed to load Variants");
        }
      }

      if (catId) {
        let attributes = [];
        try {
          const attrRes = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/attribute-mapping/${catId}/attributes?usage=Variant`, { 
            withCredentials: true,
            signal: abortController.signal
          });
          if (attrRes.data.success) {
            attributes = attrRes.data.attributes || [];
            setMappedAttributes(attributes);
          }
        } catch (err) {
          if (axios.isCancel(err)) return;
          toast.error("Failed to load Variant Attributes");
        }
        
        if (attributes.length > 0) {
          const optionsMap = {};
          await Promise.all(attributes.map(async (attr) => {
            if (['select', 'color', 'multiselect'].includes(attr.fieldType)) {
              try {
                const optRes = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/attribute-options/attribute/${attr._id}?limit=1000`, {
                  signal: abortController.signal
                });
                if (optRes.data.success) {
                  optionsMap[attr._id] = optRes.data.options;
                }
              } catch (err) {
                if (axios.isCancel(err)) return;
              }
            }
          }));
          setAttributeOptionsMap(optionsMap);
        }
      } else if (isUnifiedMode) {
          setMappedAttributes([]);
          setAttributeOptionsMap({});
      }

      setIsLoading(false);
    };

    fetchData();
    return () => abortController.abort();
  }, [id, isUnifiedMode, categoryId]);

  useEffect(() => {
    if (groupedVariants.length > 0 && !previewPrimaryOption) {
      setPreviewPrimaryOption(groupedVariants[0].primaryOption);
    }
  }, [groupedVariants, previewPrimaryOption]);

  const generateSkuString = (pOptId, secondaryOptionsObj) => {
    const brandCode = (isUnifiedMode ? brandName : product?.brand?.name || 'VYN').substring(0,3).toUpperCase();
    const titleCode = (isUnifiedMode ? productTitle : product?.title || 'PROD').split(' ')[0].toUpperCase();
    
    let pCode = '';
    if (pOptId) {
      const pOptName = attributeOptionsMap[primaryAttribute?._id]?.find(o => o._id === pOptId)?.displayName || '';
      pCode = pOptName.split(' ')[0].toUpperCase();
    }

    let sCodes = [];
    if (secondaryAttributes.length > 0 && secondaryOptionsObj) {
      secondaryAttributes.forEach(attr => {
        const optId = secondaryOptionsObj[attr._id];
        if (optId) {
          const sOptName = attributeOptionsMap[attr._id]?.find(o => o._id === optId)?.displayName || '';
          sCodes.push(sOptName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, ''));
        }
      });
    }

    const parts = [brandCode, titleCode, pCode, ...sCodes].filter(Boolean);
    return parts.join('-');
  };

  const updateCurrentGroup = (field, value) => {
    setCurrentGroup(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'primaryOption') {
        setPreviewPrimaryOption(value);
        setPreviewImageIndex(0);
        
        // Auto-update SKUs based on new primary option
        updated.items = updated.items.map(item => {
          return { ...item, sku: generateSkuString(value, item.secondaryOptions) };
        });
      }
      return updated;
    });
  };

  const updateItem = (itemIndex, field, value) => {
    setCurrentGroup(prev => {
      const newItems = [...prev.items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const updateItemSecondaryOption = (itemIndex, attributeId, optionId) => {
    setCurrentGroup(prev => {
      const newItems = [...prev.items];
      const newSecondary = { ...newItems[itemIndex].secondaryOptions, [attributeId]: optionId };
      
      const sku = generateSkuString(prev.primaryOption, newSecondary);
      
      newItems[itemIndex] = { ...newItems[itemIndex], secondaryOptions: newSecondary, sku };
      return { ...prev, items: newItems };
    });
  };

  const addRow = () => {
    setCurrentGroup(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          secondaryOptions: secondaryAttributes.reduce((acc, attr) => ({ ...acc, [attr._id]: '' }), {}),
          sku: '',
          mrp: '',
          price: '',
          gstRate: '',
          stock: 0,
          status: 'Active'
        }
      ]
    }));
  };

  const removeRow = (itemIndex) => {
    if (currentGroup.items.length === 1) {
      toast.error("You must have at least one configuration.");
      return;
    }
    setCurrentGroup(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== itemIndex)
    }));
  };

  const handleEditGroup = (group) => {
    const items = group.items.map(item => ({
      id: Math.random().toString(),
      secondaryOptions: item.secondaryOptions,
      sku: item.sku,
      stock: item.stock,
      mrp: item.mrp,
      price: item.price,
      gstRate: item.gstRate,
      status: item.status
    }));

    setCurrentGroup({
      primaryOption: group.primaryOption,
      mainImage: group.mainImage,
      galleryImages: group.galleryImages || [],
      items: items
    });
    setEditingPrimaryOption(group.primaryOption);
    setPreviewPrimaryOption(group.primaryOption);
    setPreviewImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setCurrentGroup(getEmptyGroup());
    setEditingPrimaryOption(null);
  };

  const handleMainImageUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      return toast.error("Only .jpg, .jpeg, .png, .webp allowed");
    }
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/upload/image`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        updateCurrentGroup('mainImage', res.data.data);
        toast.success("Image uploaded");
      }
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const handleGalleryUpload = async (files) => {
    const validFiles = Array.from(files).filter(f => ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type));
    if (!validFiles.length) return;
    
    const currentCount = currentGroup.galleryImages?.length || 0;
    if (currentCount + validFiles.length > 5) {
      return toast.error("Maximum 5 gallery images allowed");
    }

    const formData = new FormData();
    validFiles.forEach(f => formData.append('images', f));
    try {
      const res = await axios.post(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/upload/multiple`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        const newGallery = [...(currentGroup.galleryImages || []), ...res.data.data];
        updateCurrentGroup('galleryImages', newGallery);
        toast.success("Gallery updated");
      }
    } catch {
      toast.error("Failed to upload gallery");
    }
  };

  const removeGalleryImage = (gIndex) => {
    const newGallery = currentGroup.galleryImages.filter((_, idx) => idx !== gIndex);
    updateCurrentGroup('galleryImages', newGallery);
  };

  const saveVariantsToBackend = async (variantsToSave) => {
    if (isUnifiedMode) {
      return { success: true, data: variantsToSave };
    }
    const res = await axios.put(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/products/${id}/variants`, { variants: variantsToSave }, {
      withCredentials: true
    });
    return res.data;
  };

  const handleSave = async (addAnother = false) => {
    if (!currentGroup) return;

    if (!currentGroup.primaryOption) {
      return toast.error(`Please select a ${primaryAttribute?.name || 'Primary Attribute'}.`);
    }

    if (!currentGroup.mainImage) {
      return toast.error("Main Image is required.");
    }

    // Validate Items
    if (currentGroup.items.length === 0) {
      return toast.error("Please add at least one configuration.");
    }

    for (let i = 0; i < currentGroup.items.length; i++) {
      const item = currentGroup.items[i];
      for (const sa of secondaryAttributes) {
        if (!item.secondaryOptions[sa._id]) {
          return toast.error(`Please select ${sa.name} for item ${i + 1}.`);
        }
      }
      if (!item.sku) return toast.error(`SKU is required for item ${i + 1}.`);
      if (item.mrp === '') return toast.error(`MRP is required for item ${i + 1}.`);
      if (item.price === '') return toast.error(`Selling Price is required for item ${i + 1}.`);
      if (item.gstRate === '') return toast.error(`GST Rate is required for item ${i + 1}.`);
      if (Number(item.price) > Number(item.mrp)) {
        return toast.error(`Selling Price cannot exceed MRP for item ${i + 1}.`);
      }
      if (item.stock === '' || item.stock < 0) return toast.error(`Valid stock is required for item ${i + 1}.`);
    }

    // Check for duplicate secondary configurations within the group
    if (secondaryAttributes.length > 0) {
      const configStrings = currentGroup.items.map(item => 
        secondaryAttributes.map(sa => item.secondaryOptions[sa._id]).join('-')
      );
      const uniqueConfigs = new Set(configStrings);
      if (uniqueConfigs.size !== configStrings.length) {
        return toast.error("This variant already exists. You cannot add duplicate combinations.");
      }
    }

    // Convert currentGroup to flat variants
    const flatVariantsToSave = currentGroup.items.map(item => {
      const attributes = [
        { attribute: primaryAttribute._id, option: currentGroup.primaryOption }
      ];
      secondaryAttributes.forEach(sa => {
        attributes.push({ attribute: sa._id, option: item.secondaryOptions[sa._id] });
      });
      
      return {
        attributes,
        sku: item.sku,
        stock: item.stock,
        mrp: item.mrp,
        price: item.price,
        gstRate: Number(item.gstRate),
        status: item.status,
        mainImage: currentGroup.mainImage,
        galleryImages: currentGroup.galleryImages
      };
    });

    let otherVariants = variants.filter(v => {
      const pAttr = v.attributes.find(a => String(a.attribute?._id || a.attribute) === String(primaryAttribute._id));
      const pOptId = pAttr ? String(pAttr.option?._id || pAttr.option) : 'unknown';
      return String(pOptId) !== String(editingPrimaryOption);
    });

    if (editingPrimaryOption !== currentGroup.primaryOption) {
       const alreadyExists = otherVariants.some(v => {
         const pAttr = v.attributes.find(a => String(a.attribute?._id || a.attribute) === String(primaryAttribute._id));
         const pOptId = pAttr ? String(pAttr.option?._id || pAttr.option) : 'unknown';
         return String(pOptId) === String(currentGroup.primaryOption);
       });
       if (alreadyExists) {
         return toast.error(`A group for ${attributeOptionsMap[primaryAttribute._id]?.find(o => o._id === currentGroup.primaryOption)?.displayName || 'this option'} already exists. Please edit that group directly.`);
       }
    }

    const allNewSkus = flatVariantsToSave.map(v => v.sku);
    const uniqueSkus = new Set(allNewSkus);
    if (uniqueSkus.size !== allNewSkus.length) {
      return toast.error("Duplicate SKUs found within this group.");
    }

    const hasDuplicate = otherVariants.some(v => allNewSkus.includes(v.sku));
    if (hasDuplicate) {
      return toast.error("One of the SKUs is already used by another variant.");
    }

    try {
      setIsSubmitting(true);
      
      const newVariantsList = [...otherVariants, ...flatVariantsToSave];

      const res = await saveVariantsToBackend(newVariantsList);
      
      if (res.success && res.data) {
         const savedVariants = res.data.map(v => ({
          ...v,
          attributes: v.attributes.map(a => ({
            attribute: typeof a.attribute === 'object' ? a.attribute._id : a.attribute,
            option: typeof a.option === 'object' ? a.option._id : a.option
          }))
        }));
        setVariants(savedVariants);
      } else {
        setVariants(newVariantsList);
      }
      
      setPreviewPrimaryOption(currentGroup.primaryOption);
      toast.success(isColorGroup ? "Color group saved successfully!" : "Variant group saved successfully!");
      
      if (addAnother || editingPrimaryOption !== null) {
        setCurrentGroup(getEmptyGroup());
        setEditingPrimaryOption(null);
      } else {
        setCurrentGroup(getEmptyGroup());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save variants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Are you sure you want to delete the ${attributeOptionsMap[primaryAttribute._id]?.find(o => o._id === group.primaryOption)?.displayName || 'selected'} group?`)) return;
    try {
      setIsDeleting(true);
      const newVariants = variants.filter(v => {
        const pAttr = v.attributes.find(a => String(a.attribute?._id || a.attribute) === String(primaryAttribute._id));
        const pOptId = pAttr ? String(pAttr.option?._id || pAttr.option) : 'unknown';
        return String(pOptId) !== String(group.primaryOption);
      });
      const res = await saveVariantsToBackend(newVariants);
      
      if (res.success && res.data) {
         const savedVariants = res.data.map(v => ({
          ...v,
          attributes: v.attributes.map(a => ({
            attribute: a.attribute?._id || a.attribute,
            option: a.option?._id || a.option
          }))
        }));
        setVariants(savedVariants);
      } else {
        setVariants(newVariants);
      }
      toast.success("Group deleted.");
      
      if (editingPrimaryOption === group.primaryOption) {
        handleCancelEdit();
      }
    } catch {
      toast.error("Failed to delete group.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
  const prices = variants.map(v => Number(v.price) || 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const priceRange = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;

  useImperativeHandle(ref, () => ({
    getVariantsPayload: () => variants,
    validateCurrentGroup: () => {
       if (currentGroup && currentGroup.primaryOption) {
           return { hasUnsaved: true, message: `Please save or clear the current ${isColorGroup ? 'color' : 'variant'} group before finalizing the product.` };
       }
       return { hasUnsaved: false };
    }
  }));

  if (isLoading && !isUnifiedMode) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-[#4648d4] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto w-full pb-10 ${isUnifiedMode ? 'p-6 sm:p-8 border-t border-slate-200' : 'p-6'}`}>
      
      {!isUnifiedMode && (
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Catalog', path: '/admin/catalog' },
          { label: 'Products', path: '/admin/products' },
          { label: 'Product Variants' }
        ]} />
      </div>
      )}

      {/* Main Variant Workspace Header (for unified mode) */}
      {isUnifiedMode && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4648d4] text-white font-bold text-sm">4</span>
             <div>
               <h3 className="text-lg font-bold text-[#221B59]">Product Variants</h3>
               <p className="text-xs text-gray-500">Create variants for your product</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-[#4648d4]/5 px-4 py-1.5 rounded-lg border border-[#4648d4]/10 text-center min-w-[80px]">
               <span className="text-[10px] font-bold text-[#4648d4] uppercase tracking-wider block mb-0.5">Groups</span>
               <span className="text-lg font-bold text-[#221B59] leading-none">{groupedVariants.length}</span>
             </div>
             <div className="bg-[#4648d4]/5 px-4 py-1.5 rounded-lg border border-[#4648d4]/10 text-center min-w-[80px]">
               <span className="text-[10px] font-bold text-[#4648d4] uppercase tracking-wider block mb-0.5">Variants</span>
               <span className="text-lg font-bold text-[#221B59] leading-none">{variants.length}</span>
             </div>
             <div className="bg-[#4648d4]/5 px-4 py-1.5 rounded-lg border border-[#4648d4]/10 text-center min-w-[80px]">
               <span className="text-[10px] font-bold text-[#4648d4] uppercase tracking-wider block mb-0.5">Total Stock</span>
               <span className="text-lg font-bold text-[#221B59] leading-none">{totalStock}</span>
             </div>
          </div>
        </div>
      )}

      {/* Product Summary */}
      {!isUnifiedMode && (
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8 w-full mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#4648d4] mb-2">{product?.title || 'Unknown Product'}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{product?.brand?.name || '-'}</span>
              <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{product?.department?.name || '-'}</span>
              <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{product?.category?.name || '-'}</span>
              <span className={`px-3 py-1 rounded-lg border ${product?.status === 'Active' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                {product?.status || 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-sm font-medium text-[#4648d4] mb-1">Groups</p>
                <p className="text-xl font-bold text-gray-900">{groupedVariants.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#4648d4] mb-1">Variants</p>
                <p className="text-xl font-bold text-gray-900">{variants.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#4648d4] mb-1">Total Stock</p>
                <p className="text-xl font-bold text-gray-900">{totalStock}</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/admin/products/${id}/edit`)}
              className="h-12 px-6 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Edit2 size={18} /> Edit Product
            </button>
          </div>
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 mb-6">
        
        {/* Left Column: Variant Form Card */}
        <div className={`xl:col-span-7 ${isUnifiedMode ? 'bg-slate-50/40 border border-slate-100 rounded-xl' : 'bg-white rounded-[20px] shadow-sm border border-gray-100'} p-5 sm:p-6 flex flex-col`}>
           <div className="pb-3 border-b border-gray-100 mb-4">
              <h2 className="text-base font-bold text-[#221B59]">
                {editingPrimaryOption !== null ? (isColorGroup ? 'Edit Color' : 'Edit Group') : (isColorGroup ? 'Add Color' : 'Add Variant Group')}
              </h2>
           </div>

           {!primaryAttribute && isUnifiedMode && (
             <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-6 text-center min-h-[260px]">
                <Package className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="text-base font-semibold text-gray-700 mb-1">Select a category first</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  Please select a category in the Product Information section above to configure available variant attributes.
                </p>
             </div>
           )}

           {currentGroup && primaryAttribute && (
             <div className="space-y-6 flex-1">
               
               {/* Primary Group Details */}
               <div>
                 <div className="grid grid-cols-1 gap-4 max-w-sm">
                    <div>
                      <label className="block text-xs font-bold text-[#221B59] mb-1">Primary Attribute (e.g. {primaryAttribute.name}) <span className="text-red-500">*</span></label>
                      <select
                        value={currentGroup.primaryOption}
                        onChange={(e) => updateCurrentGroup('primaryOption', e.target.value)}
                        className="w-full px-3 h-10 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#3A36DB] focus:ring-1 focus:ring-[#3A36DB] bg-white transition-colors text-gray-900"
                      >
                        <option value="">Select {primaryAttribute.name}</option>
                        {(attributeOptionsMap[primaryAttribute._id] || []).map(opt => (
                          <option key={opt._id} value={opt._id}>{opt.displayName}</option>
                        ))}
                      </select>
                    </div>
                 </div>
               </div>

               {/* Variant Images */}
               <div className="pt-4 border-t border-gray-100">
                 <h3 className="text-xs font-bold text-[#221B59] mb-3">Group Images</h3>
                 <div className="flex gap-6">
                   <div className="flex flex-col shrink-0">
                     <label className="block text-xs font-medium text-gray-600 mb-1">Main Image <span className="text-red-500">*</span></label>
                     {currentGroup.mainImage ? (
                       <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden group">
                         <img src={currentGroup.mainImage.url} className="w-full h-full object-cover" alt="Main"  loading="lazy" decoding="async" />
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center gap-2 transition-opacity">
                           <label className="bg-white px-2 py-1 rounded text-[10px] font-medium cursor-pointer shadow-sm text-gray-900">
                             Replace
                             <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMainImageUpload(e.target.files[0])} />
                           </label>
                         </div>
                       </div>
                     ) : (
                       <label className="flex flex-col items-center justify-center w-24 h-24 border border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                         <UploadCloud className="w-5 h-5 text-[#4648d4] mb-1" />
                         <span className="text-[10px] font-medium text-gray-700">Upload</span>
                         <span className="text-[9px] text-gray-400 mt-0.5">JPG, PNG</span>
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMainImageUpload(e.target.files[0])} />
                       </label>
                     )}
                   </div>

                   <div className="flex flex-col flex-1">
                     <div className="flex justify-between items-center mb-1">
                       <label className="block text-xs font-medium text-gray-600">Gallery Images ({currentGroup.galleryImages?.length || 0}/5)</label>
                     </div>
                     <div className="flex gap-3 flex-wrap">
                       {currentGroup.galleryImages?.map((img, gIndex) => (
                         <div key={img.publicId || gIndex} className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden group shrink-0">
                           <img src={img.url} className="w-full h-full object-cover" alt="Gallery"  loading="lazy" decoding="async" />
                           <button type="button" onClick={() => removeGalleryImage(gIndex)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                             <Trash2 size={14} />
                           </button>
                         </div>
                       ))}
                       {(currentGroup.galleryImages?.length || 0) < 5 && (
                         <label className="w-24 h-24 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors shrink-0">
                           <Plus className="w-4 h-4 text-[#4648d4] mb-1" />
                           <span className="text-[10px] font-medium text-gray-700">Add Images</span>
                           <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleGalleryUpload(e.target.files)} />
                         </label>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}
        </div>


        {/* Right Column: Live Preview Card */}
        <div className="xl:col-span-5 bg-white rounded-[20px] shadow-sm border border-gray-100 p-8 flex flex-col">
           <h2 className="text-lg font-bold text-[#221B59] mb-8">Live Preview</h2>
           
           {variants.length === 0 && (!currentGroup?.mainImage) ? (
             <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 border border-gray-100 rounded-[20px] p-8 text-center h-[280px]">
               <Package className="w-12 h-12 text-gray-300 mb-4" />
               <p className="text-sm font-medium text-gray-400">No preview available</p>
             </div>
           ) : (
             <div className="flex flex-col items-center">
                {/* Large Carousel */}
                <div className="w-full h-[280px] rounded-[20px] bg-gray-50 border border-gray-100 relative flex items-center justify-center mb-6 overflow-hidden group">
                  {(() => {
                    let images = [];
                    if (editingPrimaryOption !== null && currentGroup && previewPrimaryOption === editingPrimaryOption) {
                      if (currentGroup.mainImage) images.push(currentGroup.mainImage);
                      if (currentGroup.galleryImages) images.push(...currentGroup.galleryImages);
                    } else if (previewPrimaryOption !== null) {
                      const group = groupedVariants.find(g => g.primaryOption === previewPrimaryOption);
                      if (group) {
                        if (group.mainImage) images.push(group.mainImage);
                        if (group.galleryImages) images.push(...group.galleryImages);
                      }
                    } else if (groupedVariants.length > 0) {
                      const group = groupedVariants[0];
                      if (group.mainImage) images.push(group.mainImage);
                      if (group.galleryImages) images.push(...group.galleryImages);
                    } else if (currentGroup?.mainImage) {
                      images.push(currentGroup.mainImage);
                      if (currentGroup.galleryImages) images.push(...currentGroup.galleryImages);
                    }
                    
                    if (images.length === 0) {
                      return <Package size={48} className="text-gray-300" />;
                    }

                    return (
                      <>
                        <img 
                          src={images[previewImageIndex]?.url || images[0]?.url} 
                          alt="Variant Preview" 
                          className="w-full h-full object-cover object-center transition-all duration-500" 
                         loading="lazy" decoding="async" />
                        {images.length > 1 && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1); }}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-sm text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                            >
                              <ChevronLeft size={20} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(prev => (prev + 1) % images.length); }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-sm text-gray-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                            >
                              <ChevronRight size={20} />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                              {images.map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${idx === previewImageIndex ? 'bg-[#4648d4]' : 'bg-gray-300'}`} />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                
                {/* Thumbnail Strip */}
                {groupedVariants.length > 0 && (
                  <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 scrollbar-hide w-full max-w-full">
                    {groupedVariants.map((g, idx) => {
                      const isSelected = previewPrimaryOption === g.primaryOption;
                      const optName = attributeOptionsMap[primaryAttribute._id]?.find(o => o._id === g.primaryOption)?.displayName || 'Unknown';
                      return (
                        <button
                          key={g.primaryOption || idx}
                          onClick={() => { setPreviewPrimaryOption(g.primaryOption); setPreviewImageIndex(0); }}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${isSelected ? 'border-[#3A36DB] p-0.5' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          title={optName}
                        >
                          {g.mainImage ? (
                            <img src={g.mainImage.url} alt="Thumbnail" className="w-full h-full object-cover rounded-lg"  loading="lazy" decoding="async" />
                          ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg"><Package size={20} className="text-gray-400"/></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
             </div>
           )}
        </div>
      </div>

      {currentGroup && primaryAttribute && (
        <div className={`${isUnifiedMode ? 'border-t border-slate-200 pt-6 mt-6 w-full mb-6' : 'bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 sm:p-6 w-full mb-6'}`}>
               {/* Inventory Table */}
               <div>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-base font-bold text-[#221B59]">Inventory Configurations</h3>
                   <button 
                     type="button" 
                     onClick={addRow}
                     className="text-[11px] font-semibold text-[#4648d4] border border-[#4648d4]/30 hover:bg-[#4648d4]/5 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors uppercase tracking-wide"
                   >
                     <Plus size={14} /> {secondaryAttributes.length > 0 ? (isColorGroup && secondaryAttributes[0]?.name.toLowerCase() === 'size' ? 'Add Size' : 'Add Option') : 'Add Variant'}
                   </button>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[700px]">
                     <thead>
                       <tr className="border-b border-gray-100">
                         {secondaryAttributes.map(sa => (
                           <th key={sa._id} className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{sa.name}</th>
                         ))}
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">MRP (₹)</th>
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price (₹)</th>
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-20">GST</th>
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-20">Status</th>
                         <th className="pb-2 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-10 text-center">Act</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {currentGroup.items.map((item, index) => {
                         const priceError = Number(item.price) > Number(item.mrp);
                         return (
                           <tr key={item.id} className="bg-white hover:bg-gray-50/30 transition-colors">
                             {secondaryAttributes.map(sa => (
                               <td key={sa._id} className="p-1">
                                 <select
                                   value={item.secondaryOptions[sa._id]}
                                   onChange={(e) => updateItemSecondaryOption(index, sa._id, e.target.value)}
                                   className="w-full px-2 py-1.5 text-[13px] border border-gray-200 rounded-md outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] bg-white transition-colors text-gray-900"
                                 >
                                   <option value="">Select</option>
                                   {(attributeOptionsMap[sa._id] || []).map(opt => (
                                     <option key={opt._id} value={opt._id}>{opt.displayName}</option>
                                   ))}
                                 </select>
                               </td>
                             ))}
                             <td className="p-1">
                               <input type="text" value={item.sku} onChange={e => updateItem(index, 'sku', e.target.value)} className="w-full px-2 py-1.5 text-[13px] border border-gray-200 rounded-md outline-none focus:border-[#4648d4] text-gray-900" placeholder="SKU" />
                             </td>
                             <td className="p-1 w-20">
                               <input type="number" value={item.stock} onChange={e => updateItem(index, 'stock', e.target.value)} className="w-full px-2 py-1.5 text-[13px] border border-gray-200 rounded-md outline-none focus:border-[#4648d4] text-gray-900" />
                             </td>
                             <td className="p-1 w-24">
                               <input type="number" value={item.mrp} onChange={e => updateItem(index, 'mrp', e.target.value)} className="w-full px-2 py-1.5 text-[13px] border border-gray-200 rounded-md outline-none focus:border-[#4648d4] text-gray-900" />
                             </td>
                             <td className="p-1 w-24 relative">
                               <input type="number" value={item.price} onChange={e => updateItem(index, 'price', e.target.value)} className={`w-full px-2 py-1.5 text-[13px] border rounded-md outline-none focus:ring-1 text-gray-900 ${priceError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]'}`} />
                             </td>
                             <td className="p-1 w-20">
                               <select value={item.gstRate} onChange={e => updateItem(index, 'gstRate', e.target.value)} className="w-full px-2 py-1.5 text-[13px] border border-gray-200 rounded-md outline-none focus:border-[#4648d4] bg-white text-gray-900">
                                 <option value="">Select</option>
                                 <option value="0">0%</option>
                                 <option value="5">5%</option>
                                 <option value="12">12%</option>
                                 <option value="18">18%</option>
                                 <option value="28">28%</option>
                               </select>
                             </td>
                             <td className="p-1 text-center">
                               <button 
                                 type="button"
                                 onClick={() => updateItem(index, 'status', item.status === 'Active' ? 'Inactive' : 'Active')}
                                 className={`relative text-[11px] font-medium px-2 py-1 rounded border transition-colors ${item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                               >
                                 {item.status}
                               </button>
                             </td>
                             <td className="p-1 text-center">
                               <button 
                                 type="button" 
                                 onClick={() => removeRow(index)} 
                                 disabled={currentGroup.items.length <= 1}
                                 className={`p-1.5 rounded-md transition-colors ${currentGroup.items.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                 title={currentGroup.items.length <= 1 ? "At least one configuration required" : "Delete configuration"}
                               >
                                 <Trash2 size={14} />
                               </button>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
                      {/* Form Actions */}
               <div className="flex flex-wrap items-center justify-end gap-3 pt-4 mt-2">
                 {editingPrimaryOption !== null ? (
                   <>
                     <button 
                       type="button"
                       onClick={handleCancelEdit}
                       className="px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-[13px]"
                     >
                       Cancel
                     </button>
                     <button 
                       type="button"
                       onClick={() => handleSave(false)}
                       disabled={isSubmitting}
                       className="px-6 py-1.5 bg-[#4648d4] hover:bg-[#3b3db0] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px] text-[13px]"
                     >
                       {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isColorGroup ? 'Update Color' : 'Update Group')}
                     </button>
                   </>
                 ) : (
                   <>
                     <button 
                       type="button"
                       onClick={() => setCurrentGroup(getEmptyGroup())}
                       className="px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-[13px]"
                     >
                       Clear
                     </button>
                     <button 
                       type="button"
                       onClick={() => handleSave(true)}
                       disabled={isSubmitting}
                       className="px-4 py-1.5 border border-[#4648d4] text-[#4648d4] rounded-lg font-medium hover:bg-[#4648d4]/5 transition-colors disabled:opacity-50 text-[13px]"
                     >
                       Save & Add Another
                     </button>
                     <button 
                       type="button"
                       onClick={() => handleSave(false)}
                       disabled={isSubmitting}
                       className="px-6 py-1.5 bg-[#4648d4] hover:bg-[#3b3db0] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px] text-[13px]"
                     >
                       {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isColorGroup ? 'Save Color' : 'Save Group')}
                     </button>
                   </>
                 )}
               </div>    </div>
      )}

      {/* Bottom Section: Variants Group Cards */}
      <div className={`${isUnifiedMode ? 'border-t border-slate-200 pt-6 mt-6 w-full' : 'bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 sm:p-6 w-full'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-[#221B59]">Saved Groups</h2>
          {!isUnifiedMode && (
          <div className="flex gap-4">
            <span className="text-xs font-semibold text-[#4648d4] bg-[#4648d4]/10 px-3 py-1 rounded-full">Groups: {groupedVariants.length}</span>
            <span className="text-xs font-semibold text-[#4648d4] bg-[#4648d4]/10 px-3 py-1 rounded-full">Variants: {variants.length}</span>
          </div>
          )}
        </div>

        {groupedVariants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-gray-200 rounded-xl">
             <Package className="w-10 h-10 text-gray-300 mb-3" />
             <p className="text-sm font-medium text-gray-600 mb-1">No variant groups added yet</p>
             <p className="text-xs text-gray-400">Add a variant group to see them here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="border-b border-gray-100">
                   <th className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{primaryAttribute?.name || 'Group'}</th>
                   <th className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Variants</th>
                   <th className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Images</th>
                   <th className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                   <th className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {groupedVariants.map((group, index) => {
                   const optName = primaryAttribute ? attributeOptionsMap[primaryAttribute._id]?.find(o => o._id === group.primaryOption)?.displayName : 'Unknown';
                   const stock = group.items.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
                   const isEditing = editingPrimaryOption === group.primaryOption;
                   
                   return (
                     <tr key={group.primaryOption || index} className={`hover:bg-gray-50/50 transition-colors ${isEditing ? 'bg-[#4648d4]/5' : ''}`}>
                       <td className="p-3">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                               {group.mainImage ? <img src={group.mainImage.url} className="w-full h-full object-cover" alt="Group" loading="lazy" decoding="async"/> : <Package size={16} className="text-gray-400 m-auto mt-3"/>}
                            </div>
                            <span className="text-sm font-bold text-gray-800">{optName}</span>
                         </div>
                       </td>
                       <td className="p-3 text-sm text-gray-600 font-medium">
                         {group.items.length} {group.items.length === 1 ? 'variant' : 'variants'}
                       </td>
                       <td className="p-3 text-sm text-gray-600">
                         {1 + (group.galleryImages?.length || 0)}
                       </td>
                       <td className="p-3 text-sm font-semibold text-gray-800">
                         {stock}
                       </td>
                       <td className="p-3 text-right space-x-2">
                         <button 
                           onClick={() => handleEditGroup(group)}
                           disabled={isEditing}
                           className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-[#4648d4] bg-[#4648d4]/10 cursor-not-allowed' : 'text-gray-500 hover:text-[#4648d4] hover:bg-[#4648d4]/10'}`}
                           title="Edit"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => handleDeleteGroup(group)}
                           disabled={isEditing}
                           className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                           title="Delete"
                         >
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   )
                 })}
               </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
});

export default ProductVariants;
