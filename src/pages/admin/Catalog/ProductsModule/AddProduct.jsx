import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../../../components/admin/ui/Breadcrumbs';
import ProductForm from './ProductForm';
import ProductVariants from './ProductVariants';

const AddProduct = () => {
  const navigate = useNavigate();
  
  const productFormRef = useRef(null);
  const variantFormRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productContext, setProductContext] = useState({
    categoryId: null,
    title: '',
    brandName: ''
  });

  const handleFormChange = useCallback((contextData) => {
    setProductContext((prev) => {
      if (
        prev.categoryId === contextData.categoryId &&
        prev.title === contextData.title &&
        prev.brandName === contextData.brandName
      ) {
        return prev;
      }
      return contextData;
    });
  }, []);

  const handleFinalSave = async () => {
    if (isSubmitting) return;

    // 1. Validate Product Form
    const validationResult = productFormRef.current?.validateAndGetPayload();
    if (!validationResult || !validationResult.isValid) {
      toast.error("Please fix the errors in the Product Information section.");
      return;
    }
    const productPayload = validationResult.payload;

    // 2. Validate Variant Form (Check for unsaved work)
    const variantValidation = variantFormRef.current?.validateCurrentGroup();
    if (variantValidation?.hasUnsaved) {
      toast.error(variantValidation.message);
      return;
    }

    // 3. Get Variants Payload
    const variantsPayload = variantFormRef.current?.getVariantsPayload() || [];

    try {
      setIsSubmitting(true);

      // Step 1: Create Product
      const productRes = await axios.post(`${import.meta.env.PROD ? '' : 'http://localhost:8000'}/admin/products`, productPayload, {
        withCredentials: true
      });
      
      if (!productRes.data.success) {
         throw new Error(productRes.data.message || 'Failed to create product');
      }

      const newProductId = productRes.data.data._id;

      // Step 2: Save Variants if any exist
      if (variantsPayload.length > 0) {
         const varRes = await axios.put(`${import.meta.env.PROD ? '' : 'http://localhost:8000'}/admin/products/${newProductId}/variants`, { variants: variantsPayload }, {
           withCredentials: true
         });
         
         if (!varRes.data.success) {
            toast.error("Product created, but failed to save variants. You may need to edit the product.");
            navigate(`/admin/products/${newProductId}/edit`);
            return;
         }
      }

      toast.success('Product and variants saved successfully!');
      setTimeout(() => {
        window.location.href = '/admin/products';
      }, 500);

    } catch (error) {
      console.error('Final submit error', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save product & variants');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 py-4 sm:py-6">
      <div className="relative px-4 sm:px-6 max-w-[95%] 2xl:max-w-[1600px] mx-auto w-full flex flex-col h-full">
        <div className="mb-6 flex-shrink-0">
          <Breadcrumbs items={[
            { label: 'Products', path: '/admin/products' },
            { label: 'Add Product' }
          ]} />
        </div>

        <div className="flex-1 pb-16">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm relative flex flex-col">
            <div className="p-6 sm:p-8 border-b border-slate-200">
              <h1 className="text-xl font-bold text-[#221B59]">ADD PRODUCT</h1>
              <p className="text-sm text-gray-500 mt-1">Create product details and configure variants</p>
            </div>
            
            <div className="flex flex-col">
              <ProductForm 
                ref={productFormRef} 
                isEdit={false} 
                isUnifiedMode={true} 
                onFormChange={handleFormChange}
              />

              <ProductVariants 
                ref={variantFormRef} 
                isUnifiedMode={true}
                categoryId={productContext.categoryId}
                productTitle={productContext.title}
                brandName={productContext.brandName}
              />
            </div>

            {/* Bottom Action Bar connected to form */}
            <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:px-6 rounded-b-2xl">
              <div className="flex justify-center items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="h-10 px-6 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalSave}
                  disabled={isSubmitting}
                  className={`h-10 px-8 text-sm font-medium text-white bg-[#4648d4] rounded-lg shadow-sm transition-colors flex items-center justify-center min-w-[200px] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#3b3db0]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Product & Variants →'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
