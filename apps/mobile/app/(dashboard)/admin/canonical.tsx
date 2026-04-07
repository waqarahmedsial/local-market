import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { apiClient } from '@/lib/api';
import type { CanonicalItem } from '@local-market/shared';

export default function AdminCanonicalScreen() {
  const [items, setItems] = useState<CanonicalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const result = await apiClient.canonical.list({ limit: 100 } as any);
      setItems(result.data);
    } catch {
      Alert.alert('Error', 'Failed to load canonical items');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (isLoading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#dc2626" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold">Canonical Items</Text>
        <Text className="text-gray-500 text-sm">The truth layer — {items.length} clean names</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">📚</Text>
            <Text className="text-gray-400">No canonical items yet.</Text>
            <Text className="text-gray-400 text-sm">Add them from the web admin panel.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row justify-between items-center">
              <Text className="font-semibold text-gray-900">{item.name}</Text>
              <View className={`px-2 py-0.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-medium ${item.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-500'}`}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xs font-mono mt-0.5">{item.slug}</Text>
            {item.description && (
              <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
