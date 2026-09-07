import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import api from '../api/axiosConfig';
import ProductCard from '../components/home/ProductCard';

const CATEGORIES = [
  { id: '1', name: 'Men', image: 'https://images.unsplash.com/photo-1516826957135-739071e7a5eb?w=500&q=80' },
  { id: '2', name: 'Women', image: 'https://images.unsplash.com/photo-1515347619362-67fd3b782c5a?w=500&q=80' },
  { id: '3', name: 'Kids', image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=500&q=80' },
  { id: '4', name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80' },
];

export default function HomeScreen({ navigation }) {
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      // The web app uses /products?limit=15&sort=random
      const res = await api.get('/products?limit=10&sort=random');
      if (res.data.success) {
        setNewArrivals(res.data.data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch new arrivals', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO SECTION */}
        <View className="relative w-full h-80">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80' }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40" />
          <View className="absolute inset-0 p-6 justify-end pb-10">
            <Text className="text-white text-xs font-bold tracking-widest uppercase mb-2 text-red-500">New Season 2026</Text>
            <Text className="text-white text-4xl font-bold mb-2">Welcome to SwagSync</Text>
            <Text className="text-gray-200 text-sm mb-4">Where timeless fashion meets modern living.</Text>
            <TouchableOpacity 
              className="bg-primary py-3 px-6 rounded w-3/4 items-center"
              onPress={() => navigation.navigate('ShopTab')}
            >
              <Text className="text-white font-semibold">Explore Collection</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIES */}
        <View className="py-6 px-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {CATEGORIES.map(category => (
              <TouchableOpacity key={category.id} className="items-center mr-6">
                <Image 
                  source={{ uri: category.image }} 
                  className="w-16 h-16 rounded-full mb-2 border-2 border-gray-100"
                />
                <Text className="text-sm font-semibold text-gray-800">{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* NEW ARRIVALS */}
        <View className="py-2 pl-4 mb-8">
          <View className="flex-row justify-between items-center pr-4 mb-4">
            <Text className="text-xl font-bold text-gray-900">New Arrivals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ShopTab')}>
              <Text className="text-primary font-semibold">View All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4648d4" className="mt-4" />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={newArrivals}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <ProductCard 
                  product={item} 
                  onPress={() => console.log('Navigate to Product', item.slug)} 
                />
              )}
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
