import Breadcrumbs from '../../../../components/admin/ui/Breadcrumbs';
import CategoryForm from '../../../admin/Catalog/CategoriesModule/CategoryForm';

const VendorAddCategory = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Catalog', path: '/vendor/portal/catalog' },
          { label: 'Add Category' }
        ]} />
      </div>
      <CategoryForm isVendor={true} />
    </div>
  );
};

export default VendorAddCategory;
