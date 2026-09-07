import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProductCard({ product, onPress }) {
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const displayPrice = product.price || product.variants?.[0]?.price || 0;
  const displayMrp = product.mrp || product.variants?.[0]?.mrp || 0;
  const firstVariantWithImage = product.variants?.find(v => v.mainImage?.url);
  const displayImages = product.images || (firstVariantWithImage ? [firstVariantWithImage.mainImage, ...(firstVariantWithImage.galleryImages || [])] : []);
  const discountPercentage = product.discountPercentage || (displayMrp > 0 && displayMrp > displayPrice ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) : 0);

  const imageUrl = displayImages?.[0]?.url || 'https://via.placeholder.com/150';

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="w-44 bg-white rounded-lg shadow-sm mr-4 overflow-hidden border border-gray-100"
    >
      <View className="relative w-full h-56 bg-gray-50">
        <Image 
          source={{ uri: imageUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        {product.rating ? (
          <View className="absolute top-2 left-2 bg-white/90 px-1.5 py-0.5 rounded flex-row items-center space-x-1">
            <Text className="text-xs font-bold">{product.rating}</Text>
            <Ionicons name="star" size={10} color="#FFB800" />
            <Text className="text-[10px] text-gray-500">| {product.ratingCount}</Text>
          </View>
        ) : (
          <View className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded">
            <Text className="text-[10px] font-bold uppercase">New</Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <Text className="text-xs font-bold uppercase text-primary mb-1" numberOfLines={1}>
          {product.brand?.name || product.brand || 'SwagSync'}
        </Text>
        <Text className="text-sm font-semibold text-gray-900 mb-2" numberOfLines={1}>
          {product.name || product.title}
        </Text>
        <View className="flex-row items-center flex-wrap">
          <Text className="text-sm font-bold text-gray-900 mr-2">
            {formatPrice(displayPrice)}
          </Text>
          {displayMrp > displayPrice && (
            <Text className="text-xs text-gray-500 line-through mr-1">
              {formatPrice(displayMrp)}
            </Text>
          )}
          {discountPercentage > 0 && (
            <Text className="text-[10px] font-bold text-orange-500">
              ({discountPercentage}% OFF)
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
