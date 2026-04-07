import { Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@local-market/shared';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardLayout() {
  const { user } = useAuth();

  if (user?.role === UserRole.BUSINESS) {
    return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#16a34a' }}>
        <Tabs.Screen
          name="business/inventory"
          options={{
            title: 'Inventory',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="business/import"
          options={{
            title: 'AI Import',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="business/profile"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Hide influencer/admin tabs */}
        <Tabs.Screen name="influencer/approvals" options={{ href: null }} />
        <Tabs.Screen name="admin/businesses" options={{ href: null }} />
        <Tabs.Screen name="admin/canonical" options={{ href: null }} />
      </Tabs>
    );
  }

  if (user?.role === UserRole.INFLUENCER) {
    return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
        <Tabs.Screen
          name="influencer/approvals"
          options={{
            title: 'Approvals',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="checkmark-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen name="business/inventory" options={{ href: null }} />
        <Tabs.Screen name="business/import" options={{ href: null }} />
        <Tabs.Screen name="business/profile" options={{ href: null }} />
        <Tabs.Screen name="admin/businesses" options={{ href: null }} />
        <Tabs.Screen name="admin/canonical" options={{ href: null }} />
      </Tabs>
    );
  }

  // Admin
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#dc2626' }}>
      <Tabs.Screen
        name="admin/businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin/canonical"
        options={{
          title: 'Canonical',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="business/inventory" options={{ href: null }} />
      <Tabs.Screen name="business/import" options={{ href: null }} />
      <Tabs.Screen name="business/profile" options={{ href: null }} />
      <Tabs.Screen name="influencer/approvals" options={{ href: null }} />
    </Tabs>
  );
}
