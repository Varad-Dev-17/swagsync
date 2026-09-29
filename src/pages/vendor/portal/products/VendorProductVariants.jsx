import ProductVariants from '../../../admin/Catalog/ProductsModule/ProductVariants';

const VendorProductVariants = () => {
  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 py-4 sm:py-6">
      <div className="relative px-4 sm:px-6 max-w-[95%] 2xl:max-w-[1600px] mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <ProductVariants isUnifiedMode={false} isVendor={true} />
        </div>
      </div>
    </div>
  );
};

export default VendorProductVariants;
