import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Business } from '@local-market/shared';

interface PinLocation {
  latitude: number;
  longitude: number;
}

const DEFAULT_REGION: Region = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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

  // Location state
  const [pinLocation, setPinLocation] = useState<PinLocation | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    apiClient.businesses.myBusiness()
      .then((b) => {
        setBusiness(b);
        setName(b.name);
        setDescription(b.description ?? '');
        setAddress(b.address);
        setCity(b.city);
        setPhone(b.phone);
        if (b.location) {
          setPinLocation(b.location);
          setMapRegion({
            ...b.location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    // Auto-detect location for new registration
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: PinLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setPinLocation(coords);
      setMapRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    } catch {
      // Location unavailable; user can set pin manually
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setPinLocation({ latitude: coords.latitude, longitude: coords.longitude });
  };

  const handleRegister = async () => {
    if (!name || !address || !city || !phone) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setIsSaving(true);
    try {
      const biz = await apiClient.businesses.create({
        name,
        description,
        address,
        city,
        phone,
        ...(pinLocation ? { location: pinLocation } : {}),
      });
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

  const MapPicker = ({ style }: { style?: object }) => (
    <MapView
      style={style ?? styles.mapSmall}
      region={mapRegion}
      onRegionChangeComplete={setMapRegion}
      onPress={handleMapPress}
      showsUserLocation
    >
      {pinLocation && (
        <Marker
          coordinate={pinLocation}
          draggable
          onDragEnd={(e) =>
            setPinLocation({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
            })
          }
          pinColor="#16a34a"
        />
      )}
    </MapView>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold mb-2">🏪 Shop Profile</Text>

      {business ? (
        <View className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <InfoRow label="Business Name" value={business.name} />
          {business.description && <InfoRow label="Description" value={business.description} />}
          <InfoRow label="Address" value={`${business.address}, ${business.city}`} />
          <InfoRow label="Phone" value={business.phone} />
          {business.location && (
            <View>
              <Text className="text-xs text-gray-400 uppercase font-medium mb-1">Location</Text>
              <MapView
                style={styles.mapSmall}
                initialRegion={{
                  ...business.location,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={business.location} pinColor="#16a34a" />
              </MapView>
            </View>
          )}
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

          {/* Pin Location */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-medium text-gray-700">📍 Business Location</Text>
              <View className="flex-row gap-2">
                {isLocating ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <TouchableOpacity onPress={detectLocation}>
                    <Text className="text-xs text-green-600 font-medium">Use my location</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsMapExpanded(true)}>
                  <Text className="text-xs text-blue-600 font-medium">Expand</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-xs text-gray-400 mb-2">Tap the map or drag the pin to set your business location.</Text>
            <MapPicker />
            {pinLocation && (
              <Text className="text-xs text-gray-400 mt-1">
                {pinLocation.latitude.toFixed(5)}, {pinLocation.longitude.toFixed(5)}
              </Text>
            )}
          </View>

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

      {/* Expanded map modal */}
      <Modal visible={isMapExpanded} animationType="slide" onRequestClose={() => setIsMapExpanded(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📍 Pin Business Location</Text>
            <TouchableOpacity onPress={() => setIsMapExpanded(false)} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalHint}>Tap anywhere or drag the pin to set location.</Text>
          <MapPicker style={styles.mapFull} />
          {pinLocation && (
            <Text style={styles.coordsText}>
              {pinLocation.latitude.toFixed(5)}, {pinLocation.longitude.toFixed(5)}
            </Text>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mapSmall: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mapFull: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  doneButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalHint: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  coordsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

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
