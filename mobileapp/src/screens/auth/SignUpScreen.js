import React, { useState } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function SignUpScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/signup', {
        username,
        email,
        password,
      });
      if (response.data.success) {
        navigation.navigate('SignIn');
      } else {
        setError(response.data.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <View className="mb-8 items-center mt-10">
            <Text className="text-4xl font-bold text-primary mb-2">Create Account</Text>
            <Text className="text-gray-500 text-lg">Join SwagSync today!</Text>
          </View>

          {error ? <Text className="text-red-500 text-center mb-4">{error}</Text> : null}

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={username}
            onChangeText={setUsername}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View className="mt-6">
            <Button 
              title="Sign Up" 
              onPress={handleSignUp} 
              loading={loading}
            />
          </View>

          <View className="flex-row justify-center mt-6 mb-10">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text className="text-primary font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
