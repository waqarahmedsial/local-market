import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@local-market/shared';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  switch (user.role) {
    case UserRole.BUSINESS:
      return <Redirect href="/(dashboard)/business/inventory" />;
    case UserRole.INFLUENCER:
      return <Redirect href="/(dashboard)/influencer/approvals" />;
    case UserRole.ADMIN:
      return <Redirect href="/(dashboard)/admin/businesses" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
