import { useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../../api/axiosConfig';
import Breadcrumbs from '../../../../components/admin/ui/Breadcrumbs';
import ProductForm from '../../../admin/Catalog/ProductsModule/ProductForm';
import ProductVariants from '../../../admin/Catalog/ProductsModule/ProductVariants';

const VendorEditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
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
    const productValidation = productFormRef.current?.validateAndGetPayload();
    if (!productValidation?.isValid) {
      toast.error("Please fix the errors in the Product Information section.");
      return;
    }
    const productPayload = productValidation.payload;

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

      // Step 1: Update Product for Vendor
      const productRes = await api.put(`/vendor/portal/products/${id}`, productPayload);
      
      if (!productRes.data.success) {
         throw new Error(productRes.data.message || 'Failed to update product');
      }

      // Step 2: Save Variants if any exist
      if (variantsPayload.length > 0) {
         const varRes = await api.put(`/vendor/portal/products/${id}/variants`, { variants: variantsPayload });
         
         if (!varRes.data.success) {
            toast.error("Product updated, but failed to save variants.");
            return;
         }
      }

      toast.success('Product and variants updated successfully!');
      setTimeout(() => {
        navigate('/vendor/portal/products');
      }, 500);

    } catch (error) {
      console.error('Final submit error', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update product & variants');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 py-4 sm:py-6">
      <div className="relative px-4 sm:px-6 max-w-[95%] 2xl:max-w-[1600px] mx-auto w-full flex flex-col h-full">
        <div className="mb-6 flex-shrink-0">
          <Breadcrumbs items={[
            { label: 'Products', path: '/vendor/portal/products' },
            { label: 'Edit Product' }
          ]} />
        </div>

        <div className="flex-1 pb-16">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm relative flex flex-col">
            <div className="p-6 sm:p-8 border-b border-slate-200">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">EDIT PRODUCT</h1>
              <p className="text-sm text-gray-500 mt-1">Update product details and configure variants</p>
            </div>
            
            <div className="flex flex-col">
              <ProductForm 
                ref={productFormRef} 
                isEdit={true} 
                isUnifiedMode={true} 
                isVendor={true}
                onFormChange={handleFormChange}
              />

              <ProductVariants 
                ref={variantFormRef} 
                isUnifiedMode={true}
                isVendor={true}
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
                  onClick={() => navigate('/vendor/portal/products')}
                  className="h-10 px-6 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalSave}
                  disabled={isSubmitting}
                  className={`h-10 px-8 text-xs font-bold text-white bg-[#fe4a03] hover:bg-[#e03f00] rounded-xl shadow-md shadow-[#fe4a03]/25 transition-all flex items-center justify-center min-w-[200px] cursor-pointer ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
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

export default VendorEditProduct;
