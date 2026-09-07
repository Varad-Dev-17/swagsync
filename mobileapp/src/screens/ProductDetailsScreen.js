import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route }) {
  const { slug } = route.params;
  const navigation = useNavigation();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Variant Selection State
  // selectedOptions map: { [attributeName]: optionDisplayName }
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeVariant, setActiveVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      const res = await api.get(`/products/slug/${slug}`);
      if (res.data.success) {
        const prod = res.data.data.product;
        setProduct(prod);

        // Pre-select first variant's attributes
        if (prod.variants && prod.variants.length > 0) {
          const firstVariant = prod.variants[0];
          setActiveVariant(firstVariant);

          if (firstVariant.attributes) {
            const initialSelection = {};
            firstVariant.attributes.forEach(attrObj => {
              if (attrObj.attribute?.name && attrObj.option?.displayName) {
                initialSelection[attrObj.attribute.name] = attrObj.option.displayName;
              }
            });
            setSelectedOptions(initialSelection);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch product details', error);
    } finally {
      setLoading(false);
    }
  };

  // When selectedOptions change, find the matching variant
  useEffect(() => {
    if (!product || !product.variants) return;

    const matchingVariant = product.variants.find(variant => {
      if (!variant.attributes) return false;
      
      // Check if every selected option matches this variant
      return Object.entries(selectedOptions).every(([attrName, selectedValue]) => {
        const attrObj = variant.attributes.find(a => a.attribute?.name === attrName);
        return attrObj && attrObj.option?.displayName === selectedValue;
      });
    });

    if (matchingVariant) {
      setActiveVariant(matchingVariant);
    }
  }, [selectedOptions, product]);

  const handleOptionSelect = (attributeName, optionValue) => {
    setSelectedOptions(prev => ({
      ...prev,
      [attributeName]: optionValue
    }));
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigation.navigate('Auth');
      return;
    }
    if (!activeVariant) {
      alert("Please select product options");
      return;
    }

    setAddingToCart(true);
    try {
      const res = await api.post('/cart/add', {
        productId: product._id,
        variantId: activeVariant._id,
        quantity: 1
      });
      if (res.data.success) {
        alert("Added to bag!");
      }
    } catch (error) {
      console.error('Add to cart failed', error);
      alert("Failed to add to bag");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4648d4" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text>Product not found.</Text>
      </SafeAreaView>
    );
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  // Use activeVariant pricing if available, fallback to product level
  const displayPrice = activeVariant?.price || product.price || 0;
  const displayMrp = activeVariant?.mrp || product.mrp || 0;
  
  // Collect all images: active variant image first, then product gallery
  let images = [];
  if (activeVariant?.mainImage?.url) images.push(activeVariant.mainImage);
  if (activeVariant?.galleryImages?.length) images = [...images, ...activeVariant.galleryImages];
  if (images.length === 0 && product.images) images = product.images;

  const discountPercentage = displayMrp > 0 && displayMrp > displayPrice 
    ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100) 
    : 0;

  // Extract unique attributes and options for UI
  const availableAttributes = {};
  if (product.variants) {
    product.variants.forEach(variant => {
      if (variant.attributes) {
        variant.attributes.forEach(attrObj => {
          const attrName = attrObj.attribute?.name;
          const optValue = attrObj.option?.displayName;
          if (attrName && optValue) {
            if (!availableAttributes[attrName]) availableAttributes[attrName] = new Set();
            availableAttributes[attrName].add(optValue);
          }
        });
      }
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 absolute top-10 w-full z-10">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-white/80 p-2 rounded-full shadow-sm"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity className="bg-white/80 p-2 rounded-full shadow-sm">
          <Ionicons name="heart-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Carousel */}
        <View style={{ height: width * 1.25 }}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImage(slide);
            }}
            scrollEventThrottle={16}
          >
            {images.length > 0 ? images.map((img, index) => (
              <Image 
                key={index}
                source={{ uri: img.url }}
                style={{ width, height: width * 1.25 }}
                resizeMode="cover"
              />
            )) : (
              <View style={{ width, height: width * 1.25 }} className="bg-gray-100 justify-center items-center">
                <Ionicons name="image-outline" size={50} color="gray" />
              </View>
            )}
          </ScrollView>
          <View className="absolute bottom-4 w-full flex-row justify-center space-x-2">
            {images.map((_, i) => (
              <View key={i} className={`w-2 h-2 rounded-full ${i === activeImage ? 'bg-primary' : 'bg-gray-300'}`} />
            ))}
          </View>
        </View>

        {/* Product Info */}
        <View className="p-4">
          <Text className="text-primary font-bold tracking-wider mb-1 uppercase">
            {product.brand?.name || product.brand || 'SwagSync'}
          </Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            {product.name || product.title}
          </Text>

          {/* Pricing */}
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900 mr-2">
              {formatPrice(displayPrice)}
            </Text>
            {displayMrp > displayPrice && (
              <>
                <Text className="text-base text-gray-500 line-through mr-2">
                  {formatPrice(displayMrp)}
                </Text>
                <Text className="text-sm font-bold text-orange-500">
                  ({discountPercentage}% OFF)
                </Text>
              </>
            )}
          </View>
          <Text className="text-gray-500 text-xs mb-6">Inclusive of all taxes</Text>

          {/* Variants Selection */}
          {Object.keys(availableAttributes).map(attrName => (
            <View key={attrName} className="mb-6">
              <Text className="text-base font-bold text-gray-900 mb-3 uppercase">{attrName}</Text>
              <View className="flex-row flex-wrap">
                {Array.from(availableAttributes[attrName]).map(optValue => {
                  const isSelected = selectedOptions[attrName] === optValue;
                  return (
                    <TouchableOpacity
                      key={optValue}
                      onPress={() => handleOptionSelect(attrName, optValue)}
                      className={`mr-3 mb-3 px-5 py-2 rounded-full border ${
                        isSelected 
                          ? 'border-primary bg-indigo-50' 
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <Text className={isSelected ? 'text-primary font-bold' : 'text-gray-700'}>
                        {optValue}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}

          {/* Description */}
          <Text className="text-lg font-bold text-gray-900 mb-2 mt-4">Product Description</Text>
          <Text className="text-gray-600 leading-6 mb-6">
            {product.description || "Premium quality product from our curated collection."}
          </Text>
          
          {/* Stock Info */}
          {activeVariant && (
            <Text className={`font-semibold ${activeVariant.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {activeVariant.stock > 0 ? `In Stock (${activeVariant.stock} available)` : 'Out of Stock'}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4 flex-row space-x-4">
        <TouchableOpacity className="flex-1 border border-primary rounded-xl py-4 items-center justify-center">
          <Text className="text-primary font-bold">Add to Wishlist</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Button 
            title={addingToCart ? "Adding..." : "Add to Bag"} 
            onPress={handleAddToCart}
            disabled={addingToCart || (activeVariant && activeVariant.stock <= 0)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
