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
import { UserRole } from '@local-market/shared';

const ROLES = [
  { label: 'Business Owner', value: UserRole.BUSINESS },
  { label: 'Influencer', value: UserRole.INFLUENCER },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUSINESS);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role);
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Registration failed', err?.response?.data?.message ?? 'Please try again');
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
          <View className="items-center mb-10">
            <Text className="text-5xl mb-2">🌍</Text>
            <Text className="text-3xl font-bold text-green-700">Majra Marketplace</Text>
            <Text className="text-gray-500 mt-1">Create your account</Text>
          </View>

          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              />
            </View>
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
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Password (min. 8 chars)</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                className="border border-gray-300 rounded-lg px-3 py-3 text-base"
              />
            </View>

            {/* Role selector */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">I am a…</Text>
              <View className="flex-row gap-2">
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    className={`flex-1 border rounded-lg py-2.5 items-center ${
                      role === r.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        role === r.value ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="bg-green-600 rounded-lg py-3.5 items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Create account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500">Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text className="text-green-600 font-medium">Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
