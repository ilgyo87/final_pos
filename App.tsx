import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Amplify } from 'aws-amplify';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot } from 'expo-router';
import outputs from './amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

function RootLayoutNav() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simple loading timeout for now
    // We'll implement proper auth flow once the app is running
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function App() {
  return (
    <RootLayoutNav />
  );
}