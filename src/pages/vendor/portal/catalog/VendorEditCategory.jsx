import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../../../components/admin/ui/Breadcrumbs';
import CategoryForm from '../../../admin/Catalog/CategoriesModule/CategoryForm';

const VendorEditCategory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(
          `${import.meta.env.PROD ? '' : 'http://localhost:8000'}/categories/${id}`,
          { headers }
        );
        if (response.data.success) {
          setCategory(response.data.category);
        }
      } catch (error) {
        console.error('Error fetching category:', error);
        toast.error('Failed to load category.');
        navigate('/vendor/portal/catalog');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategory();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#fe4a03] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Catalog', path: '/vendor/portal/catalog' },
            { label: 'Edit Category' },
          ]}
        />
      </div>
      <CategoryForm initialData={category} isEdit={true} isVendor={true} />
    </div>
  );
};

export default VendorEditCategory;
