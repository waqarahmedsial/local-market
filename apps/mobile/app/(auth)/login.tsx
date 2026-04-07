import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      Alert.alert(
        'Login failed',
        err?.response?.data?.message ?? 'Invalid email or password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-green-50"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-10">
            <Text className="text-5xl mb-2">🌍</Text>
            <Text className="text-3xl font-bold text-green-700">Majra Marketplace</Text>
            <Text className="text-gray-500 mt-1">Sign in to your account</Text>
          </View>

          {/* Form */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className="bg-green-600 rounded-lg py-3.5 items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500">Don&apos;t have an account? </Text>
            <Link href="/(auth)/register">
              <Text className="text-green-600 font-medium">Register</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
