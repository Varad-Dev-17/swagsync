import Breadcrumbs from '../../../../components/admin/ui/Breadcrumbs';
import AttributeForm from '../../../admin/Catalog/AttributesModule/AttributeForm';

const VendorAddAttribute = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Breadcrumbs items={[
          { label: 'Catalog', path: '/vendor/portal/catalog' },
          { label: 'Add Attribute' }
        ]} />
      </div>
      <AttributeForm isVendor={true} />
    </div>
  );
};

export default VendorAddAttribute;
