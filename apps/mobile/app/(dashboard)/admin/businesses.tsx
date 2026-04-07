import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { apiClient } from '@/lib/api';
import type { Business } from '@local-market/shared';

export default function AdminBusinessesScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    try {
      const result = await apiClient.businesses.list({ limit: 100 } as any);
      setBusinesses(result.data);
    } catch {
      Alert.alert('Error', 'Failed to load businesses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await apiClient.businesses.approve(id);
      setBusinesses((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: 'APPROVED' as any } : b)),
      );
    } catch {
      Alert.alert('Error', 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'APPROVED') return 'text-green-600 bg-green-50';
    if (status === 'PENDING') return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (isLoading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#dc2626" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold">All Businesses</Text>
        <Text className="text-gray-500 text-sm">{businesses.length} total</Text>
      </View>

      <FlatList
        data={businesses}
        keyExtractor={(b) => b._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-gray-400">No businesses yet.</Text>
          </View>
        )}
        renderItem={({ item: b }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold">{b.name}</Text>
                <Text className="text-gray-400 text-xs">📍 {b.city} • 📞 {b.phone}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full ${statusColor(b.status)}`}>
                <Text className={`text-xs font-medium`}>{b.status}</Text>
              </View>
            </View>
            {b.status === 'PENDING' && (
              <TouchableOpacity
                onPress={() => handleApprove(b._id)}
                disabled={actionId === b._id}
                className="mt-3 bg-green-600 rounded-lg py-2 items-center"
              >
                {actionId === b._id ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-medium text-sm">Approve</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
