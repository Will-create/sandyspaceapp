import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeStorage, getPIN } from '@/lib/storage';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      await initializeStorage();
      
      // Check if PIN is set
      const pin = await getPIN();
      setIsPinSet(!!pin);
      
      setIsInitialized(true);
    };

    initApp();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Show PIN screen first if PIN is set */}
        {isPinSet && <Stack.Screen name="pin" options={{ gestureEnabled: false }} />}
        
        {/* Main application routes */}
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        
        {/* Error screen */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});