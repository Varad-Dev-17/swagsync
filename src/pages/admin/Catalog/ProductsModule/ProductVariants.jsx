import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, UploadCloud, Save, ArrowLeft, Package, Edit2, Image as ImageIcon, ChevronLeft, ChevronRight, X, Copy } from 'lucide-react';
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

  // Derived Attributes & Mode Detection
  const hasVisualAttr = useMemo(() => {
    return mappedAttributes.some(a => a.fieldType === 'color' || /^(color|color \/ shade|shade)$/i.test(a.name));
  }, [mappedAttributes]);

  const hasFragranceAttr = useMemo(() => {
    return mappedAttributes.some(a => /^(fragrance|fragrance \/ scent|scent)$/i.test(a.name));
  }, [mappedAttributes]);

  // Shared Image Mode: For products where variants only differ by Size / Net Quantity or Specs
  // (e.g. Skincare, Serums, Shampoos, Face Wash, Creams, etc.)
  const isSharedImageMode = useMemo(() => {
    return !hasVisualAttr && !hasFragranceAttr && mappedAttributes.length > 0;
  }, [hasVisualAttr, hasFragranceAttr, mappedAttributes]);

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

  // Human-friendly contextual label
  const groupTerm = useMemo(() => {
    if (!primaryAttribute) return 'Variant Group';
    const name = primaryAttribute.name?.toLowerCase() || '';
    if (primaryAttribute.fieldType === 'color' || /^(color|color \/ shade|shade)$/i.test(name)) {
      if (name.includes('shade')) return 'Shade';
      const deptName = (product?.department?.name || '').toLowerCase();
      if (deptName.includes('beauty')) return 'Shade';
      return 'Color';
    }
    if (/^(fragrance|fragrance \/ scent|scent)$/i.test(name)) {
      return 'Fragrance';
    }
    if (/^(size \/ net quantity|net quantity|size)$/i.test(name)) {
      return 'Size / Net Quantity';
    }
    return primaryAttribute.name;
  }, [primaryAttribute, product]);

  const secondaryAddButtonLabel = useMemo(() => {
    if (secondaryAttributes.length === 0) return 'Add Variant';
    const firstSecName = secondaryAttributes[0]?.name || '';
    return `Add ${firstSecName}`;
  }, [secondaryAttributes]);

  // ==========================================
  // SHARED IMAGE MODE STATE (Skincare/Haircare)
  // ==========================================
  const [sharedImages, setSharedImages] = useState({ mainImage: null, galleryImages: [] });
  const [sharedItems, setSharedItems] = useState([
    {
      id: Date.now(),
      attributeOptionId: '',
      sku: '',
      mrp: '',
      price: '',
      gstRate: '18',
      stock: 0,
      status: 'Active'
    }
  ]);
  const [selectedSharedPreviewIdx, setSelectedSharedPreviewIdx] = useState(0);

  // ==========================================
  // VISUAL GROUP MODE STATE (Apparel, Shoes, Makeup)
  // ==========================================
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
          gstRate: '5',
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

  // Initial Form Setup for Visual Group Mode
  useEffect(() => {
    if (!isSharedImageMode && !currentGroup && mappedAttributes.length > 0 && primaryAttribute) {
      setCurrentGroup(getEmptyGroup());
    }
  }, [isSharedImageMode, mappedAttributes, primaryAttribute]);

  // Synchronize Shared Image Mode with loaded variants (Edit Mode)
  useEffect(() => {
    if (isSharedImageMode && variants.length > 0 && mappedAttributes.length > 0) {
      const firstVar = variants[0];
      if (firstVar.mainImage) {
        setSharedImages({
          mainImage: firstVar.mainImage || null,
          galleryImages: firstVar.galleryImages || []
        });
      }
      const sizeAttrId = mappedAttributes[0]._id;
      const loaded = variants.map((v, idx) => {
        const pAttr = v.attributes.find(a => String(a.attribute?._id || a.attribute) === String(sizeAttrId));
        return {
          id: v._id || `item-${idx}-${Date.now()}`,
          attributeOptionId: pAttr ? String(pAttr.option?._id || pAttr.option) : '',
          sku: v.sku || '',
          mrp: v.mrp !== undefined ? v.mrp : '',
          price: v.price !== undefined ? v.price : '',
          gstRate: v.gstRate !== undefined ? String(v.gstRate) : '18',
          stock: v.stock !== undefined ? v.stock : 0,
          status: v.status || 'Active'
        };
      });
      if (loaded.length > 0) {
        setSharedItems(loaded);
      }
    }
  }, [isSharedImageMode, variants, mappedAttributes]);

  // Handle preview images for Visual Group Mode
  const groupedVariants = useMemo(() => {
    if (!primaryAttribute || variants.length === 0 || isSharedImageMode) return [];
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
  }, [variants, primaryAttribute, secondaryAttributes, isSharedImageMode]);

  // Auto-slide effect for Live Preview
  useEffect(() => {
    let images = [];
    
    if (isSharedImageMode) {
      if (sharedImages.mainImage) images.push(sharedImages.mainImage);
      if (sharedImages.galleryImages) images.push(...sharedImages.galleryImages);
    } else {
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
    }

    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setPreviewImageIndex(prev => (prev + 1) % images.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [previewPrimaryOption, groupedVariants, editingPrimaryOption, currentGroup, isSharedImageMode, sharedImages]);

  // Load Data
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchData = async () => {
      setIsLoading(true);
      
      let catId = categoryId; // From props for unified mode

      if (id) {
        try {
          const prodRes = await axios.get(`${(import.meta.env.PROD ? '' : 'http://localhost:8000')}/admin/products/${id}`, { 
            withCredentials: true,
            signal: abortController.signal
          });
          if (prodRes.data.success) {
            const prodData = prodRes.data.data.product || prodRes.data.data;
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

  // ==========================================
  // SHARED IMAGE MODE METHODS
  // ==========================================
  const generateSharedSku = (optionId) => {
    const brandCode = (isUnifiedMode ? brandName : product?.brand?.name || 'VYN').substring(0, 3).toUpperCase();
    const titleCode = (isUnifiedMode ? productTitle : product?.title || 'PROD').split(' ')[0].toUpperCase();
    const optName = attributeOptionsMap[mappedAttributes[0]?._id]?.find(o => o._id === optionId)?.displayName || '';
    const optCode = optName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return [brandCode, titleCode, optCode].filter(Boolean).join('-');
  };

  const updateSharedItem = (index, field, value) => {
    setSharedItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'attributeOptionId') {
        copy[index].sku = generateSharedSku(value);
      }
      return copy;
    });
  };

  const addSharedRow = () => {
    setSharedItems(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        attributeOptionId: '',
        sku: '',
        mrp: '',
        price: '',
        gstRate: '18',
        stock: 0,
        status: 'Active'
      }
    ]);
  };

  const removeSharedRow = (index) => {
    if (sharedItems.length <= 1) {
      toast.error("You must have at least one package size.");
      return;
    }
    setSharedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSharedMainImageUpload = async (file) => {
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
        setSharedImages(prev => ({ ...prev, mainImage: res.data.data }));
        toast.success("Main cover photo uploaded");
      }
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const handleSharedGalleryUpload = async (files) => {
    const validFiles = Array.from(files).filter(f => ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type));
    if (!validFiles.length) return;
    const currentCount = sharedImages.galleryImages?.length || 0;
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
        setSharedImages(prev => ({ ...prev, galleryImages: [...(prev.galleryImages || []), ...res.data.data] }));
        toast.success("Gallery photos updated");
      }
    } catch {
      toast.error("Failed to upload gallery");
    }
  };

  const removeSharedGalleryImage = (idx) => {
    setSharedImages(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveSharedVariants = async () => {
    if (!sharedImages.mainImage) {
      return toast.error("Please upload a main product cover photo.");
    }
    if (sharedItems.length === 0) {
      return toast.error("Please add at least one package size.");
    }

    const selectedOptions = new Set();
    const skus = new Set();

    for (let i = 0; i < sharedItems.length; i++) {
      const item = sharedItems[i];
      const sizeAttrName = mappedAttributes[0]?.name || 'Package Size';
      if (!item.attributeOptionId) {
        return toast.error(`Please select a ${sizeAttrName} for row ${i + 1}.`);
      }
      if (selectedOptions.has(item.attributeOptionId)) {
        const optName = attributeOptionsMap[mappedAttributes[0]._id]?.find(o => o._id === item.attributeOptionId)?.displayName || 'this option';
        return toast.error(`Duplicate size "${optName}" found. Each size must be unique.`);
      }
      selectedOptions.add(item.attributeOptionId);

      if (!item.sku) return toast.error(`SKU is required for row ${i + 1}.`);
      if (skus.has(item.sku)) return toast.error(`Duplicate SKU "${item.sku}" found.`);
      skus.add(item.sku);

      if (item.mrp === '') return toast.error(`MRP is required for row ${i + 1}.`);
      if (item.price === '') return toast.error(`Selling price is required for row ${i + 1}.`);
      if (Number(item.price) > Number(item.mrp)) {
        return toast.error(`Selling price cannot exceed MRP for row ${i + 1}.`);
      }
      if (item.stock === '' || Number(item.stock) < 0) {
        return toast.error(`Valid stock is required for row ${i + 1}.`);
      }
    }

    const flatVariantsToSave = sharedItems.map(item => ({
      attributes: [
        { attribute: mappedAttributes[0]._id, option: item.attributeOptionId }
      ],
      sku: item.sku,
      stock: Number(item.stock) || 0,
      mrp: Number(item.mrp) || 0,
      price: Number(item.price) || 0,
      gstRate: Number(item.gstRate || 0),
      status: item.status || 'Active',
      mainImage: sharedImages.mainImage,
      galleryImages: sharedImages.galleryImages || []
    }));

    try {
      setIsSubmitting(true);
      const res = await saveVariantsToBackend(flatVariantsToSave);
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
        setVariants(flatVariantsToSave);
      }
      toast.success("Package sizes and variants saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save variants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // VISUAL GROUP MODE METHODS (Apparel/Shoes/Makeup)
  // ==========================================
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
          gstRate: '5',
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

  // Helper to copy photos from previous group with 1-click
  const lastSavedGroup = groupedVariants.length > 0 ? groupedVariants[groupedVariants.length - 1] : null;
  const handleCopyImagesFromGroup = () => {
    if (!lastSavedGroup) return;
    setCurrentGroup(prev => ({
      ...prev,
      mainImage: lastSavedGroup.mainImage || null,
      galleryImages: lastSavedGroup.galleryImages ? [...lastSavedGroup.galleryImages] : []
    }));
    const optName = attributeOptionsMap[primaryAttribute?._id]?.find(o => o._id === lastSavedGroup.primaryOption)?.displayName || 'previous group';
    toast.success(`Copied images from ${optName}!`);
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
      return toast.error(`Please select a ${groupTerm}.`);
    }

    if (!currentGroup.mainImage) {
      return toast.error(`Please upload a main image for this ${groupTerm.toLowerCase()}.`);
    }

    // Validate items
    for (let i = 0; i < currentGroup.items.length; i++) {
      const item = currentGroup.items[i];
      for (const sa of secondaryAttributes) {
        if (!item.secondaryOptions[sa._id]) {
          return toast.error(`Please select a ${sa.name} for item ${i + 1}.`);
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
        stock: Number(item.stock) || 0,
        mrp: Number(item.mrp) || 0,
        price: Number(item.price) || 0,
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
      toast.success(`${groupTerm} saved successfully!`);
      
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

  // Summaries
  const totalStock = isSharedImageMode
    ? sharedItems.reduce((acc, i) => acc + (Number(i.stock) || 0), 0)
    : variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);

  const prices = isSharedImageMode
    ? sharedItems.map(i => Number(i.price) || 0).filter(p => p > 0)
    : variants.map(v => Number(v.price) || 0).filter(p => p > 0);

  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const priceRange = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
  const totalVariantsCount = isSharedImageMode
    ? sharedItems.filter(i => i.attributeOptionId).length
    : variants.length;
  const totalGroupsCount = isSharedImageMode
    ? (sharedItems.some(i => i.attributeOptionId) ? 1 : 0)
    : groupedVariants.length;

  useImperativeHandle(ref, () => ({
    getVariantsPayload: () => {
      if (isSharedImageMode) {
        const validItems = sharedItems.filter(item => item.attributeOptionId);
        if (validItems.length > 0 && sharedImages.mainImage && mappedAttributes.length > 0) {
          return validItems.map(item => ({
            attributes: [
              { attribute: mappedAttributes[0]._id, option: item.attributeOptionId }
            ],
            sku: item.sku,
            stock: Number(item.stock) || 0,
            mrp: Number(item.mrp) || 0,
            price: Number(item.price) || 0,
            gstRate: Number(item.gstRate || 0),
            status: item.status || 'Active',
            mainImage: sharedImages.mainImage,
            galleryImages: sharedImages.galleryImages || []
          }));
        }
        return variants;
      }
      return variants;
    },
    validateCurrentGroup: () => {
      if (isSharedImageMode) {
        if (sharedItems.length > 0) {
          const hasAnyData = sharedItems.some(i => i.attributeOptionId || i.sku || i.price);
          if (hasAnyData) {
            if (!sharedImages.mainImage) {
              return { hasUnsaved: true, message: "Please upload a main product cover photo for the variants." };
            }
            const sizeAttrName = mappedAttributes[0]?.name || 'Size';
            const selectedSet = new Set();
            for (let i = 0; i < sharedItems.length; i++) {
              const item = sharedItems[i];
              if (!item.attributeOptionId) {
                return { hasUnsaved: true, message: `Please select a ${sizeAttrName} for package size row ${i + 1}.` };
              }
              if (selectedSet.has(item.attributeOptionId)) {
                return { hasUnsaved: true, message: `Duplicate ${sizeAttrName} detected on row ${i + 1}. Each size must be unique.` };
              }
              selectedSet.add(item.attributeOptionId);
              if (!item.sku) {
                return { hasUnsaved: true, message: `Please provide a SKU for row ${i + 1}.` };
              }
              if (item.price === '' || isNaN(Number(item.price)) || Number(item.price) < 0) {
                return { hasUnsaved: true, message: `Please provide a valid selling price for row ${i + 1}.` };
              }
              if (item.mrp !== '' && Number(item.price) > Number(item.mrp)) {
                return { hasUnsaved: true, message: `Selling price cannot exceed MRP on row ${i + 1}.` };
              }
            }
          }
        }
        return { hasUnsaved: false };
      }
      if (currentGroup && currentGroup.primaryOption) {
        return { hasUnsaved: true, message: `Please save or clear the current ${groupTerm.toLowerCase()} before finalizing the product.` };
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
               <p className="text-xs text-gray-500">
                 {isSharedImageMode 
                   ? `Shared image mode for ${mappedAttributes[0]?.name || 'package sizes'}` 
                   : 'Create variants and groups for your product'}
               </p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-[#4648d4]/5 px-4 py-1.5 rounded-lg border border-[#4648d4]/10 text-center min-w-[80px]">
               <span className="text-[10px] font-bold text-[#4648d4] uppercase tracking-wider block mb-0.5">{isSharedImageMode ? 'Product' : 'Groups'}</span>
               <span className="text-lg font-bold text-[#221B59] leading-none">{totalGroupsCount}</span>
             </div>
             <div className="bg-[#4648d4]/5 px-4 py-1.5 rounded-lg border border-[#4648d4]/10 text-center min-w-[80px]">
               <span className="text-[10px] font-bold text-[#4648d4] uppercase tracking-wider block mb-0.5">{isSharedImageMode ? 'Sizes' : 'Variants'}</span>
               <span className="text-lg font-bold text-[#221B59] leading-none">{totalVariantsCount}</span>
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
                <p className="text-sm font-medium text-[#4648d4] mb-1">{isSharedImageMode ? 'Product' : 'Groups'}</p>
                <p className="text-xl font-bold text-gray-900">{totalGroupsCount}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#4648d4] mb-1">{isSharedImageMode ? 'Sizes' : 'Variants'}</p>
                <p className="text-xl font-bold text-gray-900">{totalVariantsCount}</p>
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

      {/* Main Form Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 mb-6">
        
        {/* ========================================================================= */}
        {/* MODE A: SHARED IMAGE MODE (Skincare, Shampoos, Serums, Single-Spec items) */}
        {/* ========================================================================= */}
        {isSharedImageMode ? (
          <div className={`xl:col-span-7 ${isUnifiedMode ? 'bg-slate-50/40 border border-slate-100 rounded-xl' : 'bg-white rounded-[20px] shadow-sm border border-gray-100'} p-5 sm:p-6 flex flex-col`}>
            <div className="pb-3 border-b border-gray-100 mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#221B59]">Product Photos & Media</h2>
                <p className="text-xs text-gray-500">Shared across all package sizes ({mappedAttributes[0]?.name})</p>
              </div>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                Shared Photo Mode
              </span>
            </div>

            {/* Helper Guidance Banner */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 mb-5 flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Package size={14} />
              </div>
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Shared Photo Mode: </span>
                All package sizes for this product share the same photos. Upload your product photos once below, then configure your package sizes in the inventory table.
              </div>
            </div>

            {/* Photos Upload Area */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#221B59]">Product Images</h3>
              <div className="flex flex-wrap gap-6 items-start">
                {/* Main Cover Photo */}
                <div className="flex flex-col shrink-0">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Main Cover Photo <span className="text-red-500">*</span>
                  </label>
                  {sharedImages.mainImage ? (
                    <div className="relative w-28 h-28 border border-gray-200 rounded-xl overflow-hidden group shadow-2xs">
                      <img src={sharedImages.mainImage.url} className="w-full h-full object-cover" alt="Main" loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center gap-2 transition-opacity">
                        <label className="text-[10px] text-white bg-white/20 hover:bg-white/40 px-2 py-1 rounded cursor-pointer transition-colors backdrop-blur-xs font-semibold">
                          Change
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSharedMainImageUpload(e.target.files[0])} />
                        </label>
                        <button type="button" onClick={() => setSharedImages(prev => ({ ...prev, mainImage: null }))} className="text-red-400 hover:text-red-300 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50/80 hover:bg-gray-100 transition-colors group">
                      <UploadCloud className="w-7 h-7 text-gray-400 group-hover:text-[#4648d4] transition-colors mb-1.5" />
                      <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#4648d4]">Upload Cover</span>
                      <span className="text-[9px] text-gray-400">JPG, PNG, WebP</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSharedMainImageUpload(e.target.files[0])} />
                    </label>
                  )}
                </div>

                {/* Gallery Images */}
                <div className="flex flex-col flex-1 min-w-[240px]">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-gray-600">Gallery Photos ({sharedImages.galleryImages?.length || 0}/5)</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sharedImages.galleryImages?.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 border border-gray-200 rounded-xl overflow-hidden group shadow-2xs">
                        <img src={img.url} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} loading="lazy" decoding="async" />
                        <button 
                          type="button" 
                          onClick={() => removeSharedGalleryImage(idx)} 
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white hover:text-red-400 transition-opacity cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(sharedImages.galleryImages?.length || 0) < 5 && (
                      <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50/80 hover:bg-gray-100 transition-colors shrink-0 group">
                        <Plus size={20} className="text-gray-400 group-hover:text-[#4648d4] transition-colors mb-0.5" />
                        <span className="text-[10px] font-semibold text-gray-500 group-hover:text-[#4648d4]">Add More</span>
                        <input type="file" multiple className="hidden" accept="image/*" onChange={(e) => handleSharedGalleryUpload(e.target.files)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE B: VISUAL GROUP MODE (Apparel, Footwear, Makeup, Fragrances)          */
          /* ========================================================================= */
          <div className={`xl:col-span-7 ${isUnifiedMode ? 'bg-slate-50/40 border border-slate-100 rounded-xl' : 'bg-white rounded-[20px] shadow-sm border border-gray-100'} p-5 sm:p-6 flex flex-col`}>
             <div className="pb-3 border-b border-gray-100 mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#221B59]">
                  {editingPrimaryOption !== null ? `Edit ${groupTerm}` : `Add ${groupTerm}`}
                </h2>
                {lastSavedGroup && editingPrimaryOption === null && (
                  <button
                    type="button"
                    onClick={handleCopyImagesFromGroup}
                    className="text-xs font-semibold text-[#4648d4] hover:text-[#3b3db0] bg-[#4648d4]/10 hover:bg-[#4648d4]/15 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy photos from previous group"
                  >
                    <Copy size={13} /> Copy Images from Previous Group
                  </button>
                )}
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
                        <label className="block text-xs font-bold text-[#221B59] mb-1">
                          Select {groupTerm} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={currentGroup.primaryOption}
                          onChange={(e) => updateCurrentGroup('primaryOption', e.target.value)}
                          className="w-full px-3 h-10 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#3A36DB] focus:ring-1 focus:ring-[#3A36DB] bg-white transition-colors text-gray-900 font-medium"
                        >
                          <option value="">Select {groupTerm}</option>
                          {(attributeOptionsMap[primaryAttribute._id] || []).map(opt => (
                            <option key={opt._id} value={opt._id}>{opt.displayName}</option>
                          ))}
                        </select>
                      </div>
                   </div>
                 </div>

                 {/* Variant Images */}
                 <div className="pt-4 border-t border-gray-100">
                   <h3 className="text-xs font-bold text-[#221B59] mb-3">{groupTerm} Images</h3>
                   <div className="flex gap-6">
                     <div className="flex flex-col shrink-0">
                       <label className="block text-xs font-medium text-gray-600 mb-1">Main Image <span className="text-red-500">*</span></label>
                       {currentGroup.mainImage ? (
                         <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden group">
                           <img src={currentGroup.mainImage.url} className="w-full h-full object-cover" alt="Main" loading="lazy" decoding="async" />
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
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMainImageUpload(e.target.files[0])} />
                         </label>
                       )}
                     </div>

                     <div className="flex flex-col flex-1">
                       <label className="block text-xs font-medium text-gray-600 mb-1">Gallery Images (Max 5)</label>
                       <div className="flex flex-wrap gap-2">
                         {currentGroup.galleryImages?.map((img, idx) => (
                           <div key={idx} className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden group">
                             <img src={img.url} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} loading="lazy" decoding="async" />
                             <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                               <X size={14} />
                             </button>
                           </div>
                         ))}
                         {(currentGroup.galleryImages?.length || 0) < 5 && (
                           <label className="w-16 h-16 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors shrink-0">
                             <Plus size={16} className="text-gray-400" />
                             <span className="text-[9px] text-gray-500 mt-1">Add</span>
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
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE PREVIEW                                               */}
        {/* ========================================================================= */}
        <div className={`xl:col-span-5 ${isUnifiedMode ? 'bg-slate-50/40 border border-slate-100 rounded-xl' : 'bg-white rounded-[20px] shadow-sm border border-gray-100'} p-5 sm:p-6 flex flex-col`}>
           <div className="pb-3 border-b border-gray-100 mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#221B59]">Customer Live Preview</h2>
              <span className="text-[11px] font-medium text-gray-500">Real-time view</span>
           </div>

           {isSharedImageMode ? (
             !sharedImages.mainImage ? (
               <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-8 text-center min-h-[260px]">
                 <Package className="w-12 h-12 text-gray-300 mb-3" />
                 <p className="text-sm font-medium text-gray-500 mb-1">No images uploaded</p>
                 <p className="text-xs text-gray-400 max-w-xs">Upload a main product cover photo on the left to see the customer preview here.</p>
               </div>
             ) : (
               <div className="flex flex-col items-center w-full">
                 <div className="w-full h-[240px] rounded-xl bg-gray-50 border border-gray-100 relative flex items-center justify-center mb-4 overflow-hidden group shadow-2xs">
                   <img 
                     src={(() => {
                       const all = [sharedImages.mainImage, ...(sharedImages.galleryImages || [])].filter(Boolean);
                       return all[previewImageIndex]?.url || all[0]?.url;
                     })()} 
                     alt="Preview" 
                     className="w-full h-full object-cover transition-all"
                     loading="lazy" 
                     decoding="async" 
                   />
                   {([sharedImages.mainImage, ...(sharedImages.galleryImages || [])].filter(Boolean).length > 1) && (
                     <>
                       <button 
                         onClick={() => setPreviewImageIndex(p => p === 0 ? (sharedImages.galleryImages?.length || 0) : p - 1)}
                         className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                       >
                         <ChevronLeft size={16} />
                       </button>
                       <button 
                         onClick={() => setPreviewImageIndex(p => (p + 1) % (1 + (sharedImages.galleryImages?.length || 0)))}
                         className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow text-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                       >
                         <ChevronRight size={16} />
                       </button>
                     </>
                   )}
                 </div>

                 {/* Available Sizes Pills */}
                 <div className="w-full">
                   <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                     Select {mappedAttributes[0]?.name || 'Size'}:
                   </div>
                   <div className="flex flex-wrap gap-2 mb-3">
                     {sharedItems.map((item, idx) => {
                       const optName = attributeOptionsMap[mappedAttributes[0]?._id]?.find(o => o._id === item.attributeOptionId)?.displayName || `Size ${idx + 1}`;
                       const isSelected = selectedSharedPreviewIdx === idx;
                       return (
                         <button
                           key={item.id || idx}
                           type="button"
                           onClick={() => setSelectedSharedPreviewIdx(idx)}
                           className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-[#4648d4] bg-[#4648d4]/10 text-[#4648d4] shadow-xs' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                         >
                           {optName}
                         </button>
                       );
                     })}
                   </div>

                   {/* Price info for selected pill */}
                   {sharedItems[selectedSharedPreviewIdx] && (
                     <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex items-center justify-between text-xs">
                       <div>
                         <span className="text-gray-500">Price: </span>
                         <span className="font-bold text-gray-900 text-sm">
                           {sharedItems[selectedSharedPreviewIdx].price ? `₹${sharedItems[selectedSharedPreviewIdx].price}` : '₹--'}
                         </span>
                         {sharedItems[selectedSharedPreviewIdx].mrp && (
                           <span className="text-gray-400 line-through ml-1.5">
                             ₹{sharedItems[selectedSharedPreviewIdx].mrp}
                           </span>
                         )}
                       </div>
                       <div>
                         <span className="text-gray-500">Stock: </span>
                         <span className={`font-bold ${Number(sharedItems[selectedSharedPreviewIdx].stock) > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                           {sharedItems[selectedSharedPreviewIdx].stock || 0} units
                         </span>
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )
           ) : (
             variants.length === 0 && (!currentGroup?.mainImage) ? (
               <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 border border-gray-100 rounded-[20px] p-8 text-center h-[280px]">
                 <Package className="w-12 h-12 text-gray-300 mb-4" />
                 <p className="text-sm font-medium text-gray-400">No preview available</p>
               </div>
             ) : (
               <div className="flex flex-col items-center w-full">
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
                            className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${isSelected ? 'border-[#3A36DB] p-0.5' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            title={optName}
                          >
                            {g.mainImage ? (
                              <img src={g.mainImage.url} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-lg"><Package size={20} className="text-gray-400"/></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
               </div>
             )
           )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INVENTORY CONFIGURATIONS TABLE                                            */}
      {/* ========================================================================= */}
      {isSharedImageMode ? (
        <div className={`${isUnifiedMode ? 'border-t border-slate-200 pt-6 mt-6 w-full mb-6' : 'bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 sm:p-6 w-full mb-6'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-[#221B59]">Package Sizes & Inventory Table</h3>
              <p className="text-xs text-gray-500">Configure prices, MRP, stock and SKU for each package size</p>
            </div>
            <button 
              type="button" 
              onClick={addSharedRow}
              className="text-[11px] font-semibold text-[#4648d4] border border-[#4648d4]/30 hover:bg-[#4648d4]/5 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors uppercase tracking-wide cursor-pointer"
            >
              <Plus size={14} /> Add Another Size
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">{mappedAttributes[0]?.name || 'Package Size'} *</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider">SKU *</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-24">Stock *</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-28">MRP (₹) *</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-28">Price (₹) *</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-24">GST %</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-20 text-center">Status</th>
                  <th className="py-2.5 px-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sharedItems.map((item, index) => {
                  const priceError = item.price && item.mrp && Number(item.price) > Number(item.mrp);
                  return (
                    <tr key={item.id || index} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-2 min-w-[140px]">
                        <select
                          value={item.attributeOptionId}
                          onChange={(e) => updateSharedItem(index, 'attributeOptionId', e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] focus:ring-1 focus:ring-[#4648d4] bg-white transition-colors text-gray-900 font-medium"
                        >
                          <option value="">Select {mappedAttributes[0]?.name || 'Size'}</option>
                          {(attributeOptionsMap[mappedAttributes[0]?._id] || []).map(opt => (
                            <option key={opt._id} value={opt._id}>{opt.displayName}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 min-w-[180px]">
                        <input
                          type="text"
                          value={item.sku}
                          onChange={(e) => updateSharedItem(index, 'sku', e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] text-gray-900 font-mono"
                          placeholder="e.g. SERUM-50ML"
                        />
                      </td>
                      <td className="p-2 w-24">
                        <input
                          type="number"
                          min="0"
                          value={item.stock}
                          onChange={(e) => updateSharedItem(index, 'stock', e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] text-gray-900"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <input
                          type="number"
                          min="0"
                          value={item.mrp}
                          onChange={(e) => updateSharedItem(index, 'mrp', e.target.value)}
                          className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] text-gray-900"
                          placeholder="MRP"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateSharedItem(index, 'price', e.target.value)}
                          className={`w-full px-3 py-2 text-[13px] border rounded-lg outline-none focus:ring-1 text-gray-900 font-medium ${priceError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#4648d4] focus:ring-[#4648d4]'}`}
                          placeholder="Selling"
                        />
                      </td>
                      <td className="p-2 w-24">
                        <select
                          value={item.gstRate}
                          onChange={(e) => updateSharedItem(index, 'gstRate', e.target.value)}
                          className="w-full px-2.5 py-2 text-[13px] border border-gray-200 rounded-lg outline-none focus:border-[#4648d4] bg-white text-gray-900"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => updateSharedItem(index, 'status', item.status === 'Active' ? 'Inactive' : 'Active')}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${item.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                        >
                          {item.status}
                        </button>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeSharedRow(index)}
                          disabled={sharedItems.length <= 1}
                          className={`p-1.5 rounded-lg transition-colors ${sharedItems.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer'}`}
                          title={sharedItems.length <= 1 ? "At least one size required" : "Delete size"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isUnifiedMode && (
            <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={handleSaveSharedVariants}
                disabled={isSubmitting}
                className="px-6 py-2 bg-[#4648d4] hover:bg-[#3b3db0] text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-sm shadow-[#4648d4]/20 cursor-pointer"
              >
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                Save Sizes & Variants
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Visual Group Mode Inventory Table */
        currentGroup && primaryAttribute && (
          <div className={`${isUnifiedMode ? 'border-t border-slate-200 pt-6 mt-6 w-full mb-6' : 'bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 sm:p-6 w-full mb-6'}`}>
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-base font-bold text-[#221B59]">Inventory Configurations</h3>
                     <button 
                       type="button" 
                       onClick={addRow}
                       className="text-[11px] font-semibold text-[#4648d4] border border-[#4648d4]/30 hover:bg-[#4648d4]/5 px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors uppercase tracking-wide cursor-pointer"
                     >
                       <Plus size={14} /> {secondaryAddButtonLabel}
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
                           const priceError = item.price && item.mrp && Number(item.price) > Number(item.mrp);
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
                         className="px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-[13px] cursor-pointer"
                       >
                         Cancel
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleSave(false)}
                         disabled={isSubmitting}
                         className="px-6 py-1.5 bg-[#4648d4] hover:bg-[#3b3db0] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px] text-[13px] cursor-pointer"
                       >
                         {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : `Update ${groupTerm}`}
                       </button>
                     </>
                   ) : (
                     <>
                       <button 
                         type="button"
                         onClick={() => setCurrentGroup(getEmptyGroup())}
                         className="px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-[13px] cursor-pointer"
                       >
                         Clear
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleSave(true)}
                         disabled={isSubmitting}
                         className="px-4 py-1.5 border border-[#4648d4] text-[#4648d4] rounded-lg font-medium hover:bg-[#4648d4]/5 transition-colors disabled:opacity-50 text-[13px] cursor-pointer"
                       >
                         Save & Add Another {groupTerm}
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleSave(false)}
                         disabled={isSubmitting}
                         className="px-6 py-1.5 bg-[#4648d4] hover:bg-[#3b3db0] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px] text-[13px] cursor-pointer"
                       >
                         {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : `Save ${groupTerm}`}
                       </button>
                     </>
                   )}
                 </div>
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: SAVED GROUPS (Only in Visual Group Mode)                   */}
      {/* ========================================================================= */}
      {!isSharedImageMode && (
        <div className={`${isUnifiedMode ? 'border-t border-slate-200 pt-6 mt-6 w-full' : 'bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 sm:p-6 w-full'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-[#221B59]">Saved {groupTerm}s</h2>
            {!isUnifiedMode && (
            <div className="flex gap-4">
              <span className="text-xs font-semibold text-[#4648d4] bg-[#4648d4]/10 px-3 py-1 rounded-full">{groupTerm}s: {groupedVariants.length}</span>
              <span className="text-xs font-semibold text-[#4648d4] bg-[#4648d4]/10 px-3 py-1 rounded-full">Variants: {variants.length}</span>
            </div>
            )}
          </div>

          {groupedVariants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 border border-dashed border-gray-200 rounded-xl">
               <Package className="w-10 h-10 text-gray-300 mb-3" />
               <p className="text-sm font-medium text-gray-600 mb-1">No {groupTerm.toLowerCase()}s added yet</p>
               <p className="text-xs text-gray-400">Configure and save a {groupTerm.toLowerCase()} to see it here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-gray-100">
                     <th className="pb-3 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{groupTerm}</th>
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
                             className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-[#4648d4] bg-[#4648d4]/10 cursor-not-allowed' : 'text-gray-500 hover:text-[#4648d4] hover:bg-[#4648d4]/10 cursor-pointer'}`}
                             title="Edit"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteGroup(group)}
                             disabled={isEditing}
                             className={`p-1.5 rounded-md transition-colors ${isEditing ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-500 hover:bg-red-50 cursor-pointer'}`}
                             title="Delete"
                           >
                             <Trash2 size={16} />
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
});

export default ProductVariants;
