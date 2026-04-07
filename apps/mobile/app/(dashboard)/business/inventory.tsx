import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api';
import type { Item, Business } from '@local-market/shared';

export default function InventoryScreen() {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const biz = await apiClient.businesses.myBusiness();
      setBusiness(biz);
      const result = await apiClient.items.list(biz._id);
      setItems(result.data);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        Alert.alert('Error', 'Failed to load inventory');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600';
      case 'PENDING_REVIEW': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!business) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-5xl mb-4">🏪</Text>
        <Text className="text-xl font-bold text-center mb-2">No Business Registered</Text>
        <Text className="text-gray-500 text-center">
          Go to the Shop tab to register your business first.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold">{business.name}</Text>
        <Text className={`text-sm font-medium ${business.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>
          {business.status}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">📦</Text>
            <Text className="text-gray-400 text-center">No items yet. Use AI Import to add products!</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{item.displayName}</Text>
                {item.rawName !== item.displayName && (
                  <Text className="text-xs text-gray-400">{item.rawName}</Text>
                )}
              </View>
              <Text className="text-green-600 font-bold text-base">
                Rs {item.price}{item.unit ? `/${item.unit}` : ''}
              </Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className={`text-xs font-medium ${statusColor(item.status)}`}>{item.status}</Text>
              {item.stock != null && (
                <Text className="text-xs text-gray-400">Stock: {item.stock}</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}
