import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axiosConfig";
import ShopProductCard from "../shop-now/product/ShopProductCard";
import { Sparkles } from "lucide-react";

const RecommendedProductsSection = ({ productId, categoryName, departmentName }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchRelated = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/related/${productId}?limit=20`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching recommended products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [productId]);

  const displayItems = useMemo(() => {
    if (!products || products.length === 0) return [];

    const sameCategoryItems = [];
    const otherDepartmentItems = [];

    products.forEach((product) => {
      if (product.status === "Inactive" || !Array.isArray(product.variants) || product.variants.length === 0) {
        return;
      }

      // Group variants by color (matching ProductGrid logic)
      const colorGroups = new Map();

      product.variants.forEach((v) => {
        if (v.status === "Inactive") return;

        const colorAttr = v.attributes?.find((attr) => {
          const name = attr.attribute?.name?.toLowerCase();
          return (
            name === "color" ||
            name === "colour" ||
            name === "color / shade" ||
            name === "shade" ||
            attr.attribute?.fieldType === "color"
          );
        });

        const colorName = colorAttr?.option?.displayName || colorAttr?.option?.storedValue || "default";

        if (!colorGroups.has(colorName)) {
          colorGroups.set(colorName, []);
        }
        colorGroups.get(colorName).push(v);
      });

      // If no color attribute, treat all variants as default
      if (colorGroups.size === 0) {
        colorGroups.set("default", product.variants);
      }

      const prodCatName = product.category?.name || (typeof product.category === "string" ? product.category : "");
      const isSameCategory = Boolean(
        categoryName && prodCatName && prodCatName.toLowerCase() === categoryName.toLowerCase()
      );

      // Create a visual card for each color variant
      colorGroups.forEach((groupVariants, colorName) => {
        const primaryVariant = groupVariants[0] || {};
        const price = primaryVariant.price || product.price || 0;
        const mrp = primaryVariant.mrp || product.mrp || price;
        const discountPercentage = mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;

        const images = [primaryVariant.mainImage, ...(primaryVariant.galleryImages || [])].filter(Boolean);
        if (images.length === 0 && product.images) {
          images.push(...product.images);
        }

        const totalStock = groupVariants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

        // Extract available sizes / secondary attributes for this color variant
        const sizeSet = new Set();
        let secondaryAttributeName = "Sizes";
        groupVariants.forEach((v) => {
          const secAttr = v.attributes?.find((attr) => {
            const attrName = attr.attribute?.name?.toLowerCase();
            return (
              attrName &&
              attrName !== "color" &&
              attrName !== "colour" &&
              attrName !== "shade" &&
              attrName !== "color / shade" &&
              attr.attribute?.fieldType !== "color"
            );
          });
          if (secAttr && (secAttr.option?.displayName || secAttr.option?.storedValue)) {
            secondaryAttributeName = secAttr.attribute?.name || "Sizes";
            sizeSet.add(secAttr.option.displayName || secAttr.option.storedValue);
          }
        });
        const availableSizes = Array.from(sizeSet);

        const cardItem = {
          _id: `${product._id}-${colorName}`,
          productId: product._id,
          variantId: primaryVariant._id,
          colorName: colorName !== "default" ? colorName : "",
          slug: product.slug,
          brand: product.brand?.name || product.brand || "Brand",
          title: product.title,
          productName: product.title,
          price,
          mrp,
          discountPercentage,
          rating: product.ratingAverage || null,
          ratingCount: product.ratingCount || 0,
          images,
          stock: totalStock,
          variants: groupVariants,
          availableSizes,
          secondaryAttributeName,
          currentSize: availableSizes[0] || "",
        };

        if (isSameCategory) {
          sameCategoryItems.push(cardItem);
        } else {
          otherDepartmentItems.push(cardItem);
        }
      });
    });

    // Priority 1: All color variants of the same category (Suits) across all brands
    // Priority 2: Other department products to fill remaining slots
    const combined = [...sameCategoryItems, ...otherDepartmentItems];
    return combined.slice(0, 10); // Display up to 10 cards (2 clean rows of 5)
  }, [products, categoryName]);

  if (loading || displayItems.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-[#eaeaec]">
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-[20px] sm:text-[22px] font-extrabold text-[#282c3f] tracking-wide uppercase">
            Similar Products
          </h3>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FD7100] bg-[#FFF4EB] px-2 py-0.5 rounded-full uppercase tracking-wider">
            <Sparkles size={12} />
            Recommended
          </span>
        </div>
        <p className="text-[13px] sm:text-[14px] text-[#7e818c] mt-1">
          Explore similar styles {categoryName ? `in ${categoryName}` : ""}
          {departmentName && categoryName ? ` (${departmentName})` : ""}
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {displayItems.map((item) => (
          <div key={item._id} className="h-full">
            <ShopProductCard product={item} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedProductsSection;
