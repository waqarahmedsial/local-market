import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Business } from '@local-market/shared';

export default function BusinessProfileScreen() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    apiClient.businesses.myBusiness()
      .then((b) => {
        setBusiness(b);
        setName(b.name);
        setDescription(b.description ?? '');
        setAddress(b.address);
        setCity(b.city);
        setPhone(b.phone);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleRegister = async () => {
    if (!name || !address || !city || !phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setIsSaving(true);
    try {
      const biz = await apiClient.businesses.create({ name, description, address, city, phone });
      setBusiness(biz);
      Alert.alert('Success', 'Business registered! Awaiting approval.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Registration failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#16a34a" /></View>;
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold mb-2">🏪 Shop Profile</Text>

      {business ? (
        <View className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <InfoRow label="Business Name" value={business.name} />
          {business.description && <InfoRow label="Description" value={business.description} />}
          <InfoRow label="Address" value={`${business.address}, ${business.city}`} />
          <InfoRow label="Phone" value={business.phone} />
          <View>
            <Text className="text-xs text-gray-400 uppercase font-medium mb-1">Status</Text>
            <View className={`self-start px-3 py-1 rounded-full ${
              business.status === 'APPROVED' ? 'bg-green-100' :
              business.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Text className={`text-sm font-medium ${
                business.status === 'APPROVED' ? 'text-green-700' :
                business.status === 'PENDING' ? 'text-yellow-700' : 'text-red-700'
              }`}>{business.status}</Text>
            </View>
            {business.status === 'PENDING' && (
              <Text className="text-xs text-gray-400 mt-1">
                Awaiting influencer or admin approval.
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-gray-500 mb-4 text-sm">Register your business to start listing products.</Text>
          <Field label="Business Name *" value={name} onChange={setName} placeholder="e.g. Ahmed's Grocery" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="What do you sell?" />
          <Field label="Address *" value={address} onChange={setAddress} placeholder="Street / Area" />
          <Field label="City *" value={city} onChange={setCity} placeholder="e.g. Lahore" />
          <Field label="Phone *" value={phone} onChange={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={isSaving}
            className="bg-green-600 rounded-lg py-3.5 items-center mt-2"
          >
            {isSaving ? <ActivityIndicator color="white" /> : (
              <Text className="text-white font-semibold">Register Business</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-xs text-gray-400 uppercase font-medium mb-0.5">{label}</Text>
      <Text className="text-gray-900">{value}</Text>
    </View>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
}) {
  return (
    <View className="mb-3">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType}
        className="border border-gray-300 rounded-lg px-3 py-3 text-base"
      />
    </View>
  );
}
