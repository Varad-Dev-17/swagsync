import React, { useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import ShopProductCard from "./ShopProductCard";

const ProductGrid = ({ paginatedProducts, activeColors = [], priceRange = { min: "", max: "" }, sort = "newest" }) => {
  const displayItems = useMemo(() => {
    const items = [];

    paginatedProducts?.forEach(product => {
      if (product.status === 'Inactive') return;

      const colorGroups = new Map();

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(v => {
          if (v.status === 'Inactive') return;

          const colorAttr = v.attributes?.find(attr => attr.attribute?.name?.toLowerCase() === 'color');
          const colorName = colorAttr?.option?.displayName || 'default';
          
          if (!colorGroups.has(colorName)) {
            colorGroups.set(colorName, []);
          }
          colorGroups.get(colorName).push(v);
        });
      } else if (product.colors && product.colors.length > 0) {
        product.colors.forEach(c => {
          if (c.status === 'Inactive') return;
          const colorName = c.name || c.color || 'default';
          if (!colorGroups.has(colorName)) {
            colorGroups.set(colorName, []);
          }
          colorGroups.get(colorName).push(c);
        });
      }

      if (colorGroups.size === 0) {
        // If the product has variants/colors data but colorGroups is empty, 
        // it means all of them were filtered out (e.g. they were all Inactive). Skip it.
        if ((product.variants && product.variants.length > 0) || (product.colors && product.colors.length > 0)) {
          return;
        }

        const pPrice = product.price || 0;
        const hasPriceFilter = priceRange.min !== "" || priceRange.max !== "";
        let priceMatch = true;
        if (hasPriceFilter) {
          const min = priceRange.min !== "" ? Number(priceRange.min) : 0;
          const max = priceRange.max !== "" ? Number(priceRange.max) : Infinity;
          priceMatch = pPrice >= min && pPrice <= max;
        }

        if (priceMatch) {
          items.push({
            product,
            colorName: 'default',
            variants: [],
            colors: []
          });
        }
      } else {
        colorGroups.forEach((groupItems, colorName) => {
          const hasColorFilter = activeColors.length > 0;
          if (hasColorFilter && colorName !== 'default') {
            const colorMatch = activeColors.map(c => c.toLowerCase()).includes(colorName.toLowerCase());
            if (!colorMatch) return;
          }

          const hasPriceFilter = priceRange.min !== "" || priceRange.max !== "";
          let validGroupItems = groupItems;
          
          if (hasPriceFilter) {
            validGroupItems = groupItems.filter(v => {
              const p = v.price || product.price || 0;
              const min = priceRange.min !== "" ? Number(priceRange.min) : 0;
              const max = priceRange.max !== "" ? Number(priceRange.max) : Infinity;
              return p >= min && p <= max;
            });
          }

          if (validGroupItems.length > 0) {
            items.push({
              product,
              colorName,
              variants: product.variants ? validGroupItems : [],
              colors: product.colors ? validGroupItems : []
            });
          }
        });
      }
    });

    items.forEach(item => {
      if (item.variants.length > 0) {
        item.variants.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          if (sort === "priceAsc") return priceA - priceB;
          if (sort === "priceDesc") return priceB - priceA;
          return 0;
        });
      }
    });

    return items;
  }, [paginatedProducts, activeColors, priceRange, sort]);

  return (
    <motion.div
      layout
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 gap-y-6 sm:gap-y-8 pb-10 sm:pb-20"
    >
      <AnimatePresence mode="popLayout">
        {displayItems.map((item, index) => {
          const { product, colorName, variants, colors } = item;
          let defaultVariant = variants[0] || colors[0] || product;

          let totalStock = 0;
          let availableSizes = [];
          let secondaryAttributeName = 'Size';

          if (variants.length > 0) {
            totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
            const sizeSet = new Set();
            const isLaptop = 
              product.category?.name?.toLowerCase() === 'laptop' || 
              product.category?.slug?.toLowerCase() === 'laptop' || 
              (typeof product.category === 'string' && product.category.toLowerCase() === 'laptop') ||
              (Array.isArray(product.categories) && product.categories.some(c => 
                c?.name?.toLowerCase() === 'laptop' || 
                c?.slug?.toLowerCase() === 'laptop' || 
                (typeof c === 'string' && c.toLowerCase() === 'laptop')
              ));

            variants.forEach(v => {
              let secAttr;
              if (isLaptop) {
                secAttr = v.attributes?.find(attr => attr.attribute?.name?.toLowerCase().includes('processor'));
              }
              if (!secAttr) {
                secAttr = v.attributes?.find(attr => attr.attribute?.name?.toLowerCase() !== 'color');
              }
              if (secAttr && secAttr.option?.displayName) {
                secondaryAttributeName = secAttr.attribute.name;
                sizeSet.add(secAttr.option.displayName);
              }
            });
            availableSizes = Array.from(sizeSet);
          } else if (colors.length > 0) {
            totalStock = colors.reduce((sum, c) => sum + (c.sizes?.reduce((sSum, size) => sSum + (parseInt(size.stock) || 0), 0) || 0), 0);
            const sizeSet = new Set();
            colors.forEach(c => {
              c.sizes?.forEach(s => {
                if (s.size) sizeSet.add(s.size);
              });
            });
            availableSizes = Array.from(sizeSet);
          } else {
             totalStock = product.stock || 0;
          }

          const price = defaultVariant.price || product.price || 0;
          const mrp = defaultVariant.mrp || product.mrp || price;
          let discountPercentage = 0;
          if (mrp > price && mrp > 0) {
            discountPercentage = Math.round(((mrp - price) / mrp) * 100);
          }

          const images = [defaultVariant.mainImage, ...(defaultVariant.galleryImages || [])].filter(Boolean);
          if (images.length === 0 && product.images) {
            images.push(...product.images);
          }

          let currentSize = '';
          if (defaultVariant.attributes) {
            const secAttr = defaultVariant.attributes.find(attr => attr.attribute?.name?.toLowerCase() !== 'color');
            if (secAttr && secAttr.option?.displayName) {
              currentSize = secAttr.option.displayName;
            }
          }

          const formattedProduct = {
            _id: `${product._id}-${colorName}`,
            slug: product.slug,
            brand: product.brand?.name || product.brand || "SwagSync",
            title: product.title,
            productName: product.title,
            price,
            mrp,
            discountPercentage,
            rating: product.ratingAverage || product.rating || null,
            ratingCount: product.ratingCount || product.reviewCount || product.numReviews || 0,
            images,
            stock: totalStock,
            availableSizes: availableSizes,
            currentSize: currentSize,
            colorName: colorName,
            variantId: defaultVariant._id,
            secondaryAttributeName: secondaryAttributeName,
          };

          return (
            <motion.div
              key={formattedProduct._id}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <ShopProductCard product={formattedProduct} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductGrid;
