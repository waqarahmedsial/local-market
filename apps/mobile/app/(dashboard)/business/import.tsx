import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiClient } from '@/lib/api';
import type { AiImportPreview, AiImportResponse } from '@local-market/shared';

type Step = 'input' | 'preview';

export default function ImportScreen() {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<AiImportResponse | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load business ID on mount
  useEffect(() => {
    apiClient.businesses.myBusiness()
      .then((b) => setBusinessId(b._id))
      .catch(() => {});
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please enter some product information');
      return;
    }
    if (!businessId) {
      Alert.alert('Error', 'Please register your business first');
      return;
    }
    setIsLoading(true);
    try {
      const result = await apiClient.ai.importFromText(text, businessId);
      setPreview(result);
      setStep('preview');
    } catch {
      Alert.alert('Error', 'AI analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || !businessId) return;
    setIsLoading(true);
    try {
      await apiClient.items.bulkCreate(businessId, preview.items);
      Alert.alert('Success', `${preview.items.length} items added!`);
      setText('');
      setPreview(null);
      setStep('input');
    } catch {
      Alert.alert('Error', 'Failed to save items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold mb-1">🤖 AI Import</Text>
      <Text className="text-gray-500 mb-6 text-sm">
        Describe products in any language — Urdu, Hindi, English, or Roman Urdu.
      </Text>

      {step === 'input' ? (
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Product list (any language)
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={
              '1kg tamatar 50rs, 2kg aloo 80rs\nمرغی 350 فی کلو\nTomatoes 50/kg'
            }
            multiline
            numberOfLines={6}
            className="border border-gray-300 rounded-lg p-3 text-base min-h-32"
            textAlignVertical="top"
          />
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={isLoading}
            className="bg-green-600 rounded-lg py-3.5 items-center mt-4"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">🤖 Analyze with AI</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <Text className="font-semibold text-lg mb-3">
              AI found {preview?.items.length} products — review:
            </Text>
            {preview?.items.map((item: AiImportPreview, i: number) => (
              <View key={i} className="py-3 border-b border-gray-100 last:border-0">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{item.suggestedName}</Text>
                    <Text className="text-xs text-gray-400">Original: "{item.rawInput}"</Text>
                    {item.suggestedCategory && (
                      <Text className="text-xs text-gray-400">Category: {item.suggestedCategory}</Text>
                    )}
                  </View>
                  <View className="items-end">
                    {item.price != null && (
                      <Text className="text-green-600 font-bold">
                        Rs {item.price}{item.unit ? `/${item.unit}` : ''}
                      </Text>
                    )}
                    <View className={`mt-1 px-2 py-0.5 rounded-full ${item.confidence >= 0.8 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <Text className={`text-xs font-medium ${item.confidence >= 0.8 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {Math.round(item.confidence * 100)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 rounded-lg py-3.5 items-center mb-3"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">
                ✅ Confirm & Save {preview?.items.length} items
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setStep('input'); setPreview(null); }}
            className="border border-gray-300 rounded-lg py-3 items-center"
          >
            <Text className="text-gray-600 font-medium">← Start over</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
