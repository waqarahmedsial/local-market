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
import { apiClient } from '@/lib/api';
import type { Business } from '@local-market/shared';

export default function InfluencerApprovalsScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPending = async () => {
    try {
      const result = await apiClient.businesses.list({ status: 'PENDING' as any });
      setBusinesses(result.data);
    } catch {
      Alert.alert('Error', 'Failed to load pending businesses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await apiClient.businesses.approve(id);
      setBusinesses((prev) => prev.filter((b) => b._id !== id));
    } catch {
      Alert.alert('Error', 'Approval failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    Alert.alert('Reject Business', 'Are you sure you want to reject this business?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setActionId(id);
          try {
            await apiClient.businesses.reject(id, 'Rejected by influencer');
            setBusinesses((prev) => prev.filter((b) => b._id !== id));
          } catch {
            Alert.alert('Error', 'Rejection failed');
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold">Pending Approvals</Text>
        <Text className="text-gray-500 text-sm">{businesses.length} businesses awaiting review</Text>
      </View>

      <FlatList
        data={businesses}
        keyExtractor={(b) => b._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPending(); }} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={() => (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🎉</Text>
            <Text className="text-gray-400">All caught up! No pending approvals.</Text>
          </View>
        )}
        renderItem={({ item: business }) => (
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <Text className="font-semibold text-lg">{business.name}</Text>
            {business.description && (
              <Text className="text-gray-500 text-sm mt-1">{business.description}</Text>
            )}
            <Text className="text-gray-400 text-sm mt-1">📍 {business.address}, {business.city}</Text>
            <Text className="text-gray-400 text-sm">📞 {business.phone}</Text>
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => handleApprove(business._id)}
                disabled={actionId === business._id}
                className="flex-1 bg-green-600 rounded-lg py-2.5 items-center"
              >
                {actionId === business._id ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-medium">✅ Approve</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReject(business._id)}
                disabled={actionId === business._id}
                className="flex-1 border border-red-500 rounded-lg py-2.5 items-center"
              >
                <Text className="text-red-600 font-medium">✗ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
