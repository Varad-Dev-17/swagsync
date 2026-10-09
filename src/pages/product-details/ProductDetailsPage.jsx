import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import ProductImageGrid from "../../components/product-details/ProductImageGrid";
import ProductInfo from "../../components/product-details/ProductInfo";
import ManufacturerSellerDetails from "../../components/product-details/ManufacturerSellerDetails";
import RecommendedProductsSection from "../../components/product-details/RecommendedProductsSection";
import SyncLoader from "../../components/common/SyncLoader";

const api = axios.create({
  baseURL: "",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const colorQuery = searchParams.get("color");
  const variantQuery = searchParams.get("variant");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/products/slug/${slug}`);
        if (res.data.success) {
          const payload = res.data.data;
          const prodData = payload.product ? payload.product : payload; 
          
          setProduct(prodData);
          if (prodData.variants && prodData.variants.length > 0) {
            if (variantQuery) {
              const matchedVariant = prodData.variants.find(v => String(v._id) === String(variantQuery));
              setActiveVariant(matchedVariant || prodData.variants[0]);
            } else if (colorQuery) {
              const matchedVariant = prodData.variants.find(v => {
                const colorAttr = v.attributes?.find(attr => {
                  const name = attr.attribute?.name?.toLowerCase();
                  return name === 'color' || name === 'colour' || name === 'color / shade' || name === 'shade' || attr.attribute?.fieldType === 'color';
                });
                return colorAttr?.option?.displayName?.toLowerCase() === colorQuery.toLowerCase() ||
                       colorAttr?.option?.storedValue?.toLowerCase() === colorQuery.toLowerCase();
              });
              setActiveVariant(matchedVariant || prodData.variants[0]);
            } else {
              setActiveVariant(prodData.variants[0]);
            }
          }
        } else {
          setError("Product not found");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  // Synchronize active variant when variantQuery changes in URL
  useEffect(() => {
    if (!product?.variants?.length || !variantQuery) return;
    const matched = product.variants.find(v => String(v._id) === String(variantQuery));
    if (matched && matched._id !== activeVariant?._id) {
      setActiveVariant(matched);
    }
  }, [variantQuery, product]);

  const handleVariantChange = (variantId) => {
    const variant = product?.variants?.find((v) => String(v._id) === String(variantId));
    if (variant) {
      setActiveVariant(variant);
      setSearchParams({ variant: variantId }, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white pt-20 gap-3.5">
        <SyncLoader color="#FD7100" size={11} gap={7} />
        <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          Loading product...
        </span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#282c3f] mb-2">Oops!</h2>
          <p className="text-[#535766]">{error || "Product not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pt-[100px] pb-20">
      <div className="max-w-[1520px] mx-auto px-6 sm:px-12 lg:px-20 xl:px-32">
        <div className="text-[13px] text-[#535766] mb-6">
          Home / {product.department?.name || 'Store'} / {product.category?.name || 'Category'} / <span className="text-[#282c3f] font-bold">{product.title}</span>
        </div>

        <div className="flex flex-col-reverse lg:flex-row gap-8 xl:gap-14">
          {/* Left: Info */}
          <div className="w-full lg:w-[46%] pt-1">
            <ProductInfo
              product={product}
              activeVariant={activeVariant}
              onVariantChange={handleVariantChange}
            />
          </div>

          {/* Right: Images & Details */}
          <div className="w-full lg:w-[54%]">
            <ProductImageGrid variant={activeVariant} />
            <ManufacturerSellerDetails product={product} />
          </div>
        </div>

        {/* Similar / Recommended Products (Full-Width Section) */}
        <RecommendedProductsSection
          productId={product._id}
          categoryName={product.category?.name || (typeof product.category === 'string' ? product.category : '')}
          departmentName={product.department?.name || (typeof product.department === 'string' ? product.department : '')}
        />
      </div>
    </div>
  );
};

export default ProductDetailsPage;
