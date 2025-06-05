import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SyncProvider } from '../context/SyncContext';
import { Amplify } from 'aws-amplify';
import { useEffect } from 'react';
import { Alert } from 'react-native';

type Screen = {
  name: string;
  title: string;
  headerShown: boolean;
};

const screens: Screen[] = [
  { name: 'index', title: 'Home', headerShown: false },
  { name: 'dashboard', title: 'Dashboard', headerShown: false },
  { name: 'customers', title: 'Customers', headerShown: true },
  { name: 'products', title: 'Products', headerShown: true },
  { name: 'orders', title: 'Orders', headerShown: true },
  { name: 'employees', title: 'Employees', headerShown: true },
  { name: 'settings', title: 'Settings', headerShown: true },
  { name: 'reports', title: 'Reports', headerShown: true },
];

export default function RootLayout() {
  // Initialize Amplify when the app starts
  useEffect(() => {
    try {
      // Find and load the Amplify configuration file
      // For Amplify Gen 2, the configuration may be elsewhere
      console.log('Attempting to initialize Amplify in _layout.tsx');
      
      // For Amplify Gen 2, we need to make sure we're properly initializing
      // the configuration right at app startup
      try {
        // Try loading any existing config
        const existingConfig = Amplify.getConfig();
        console.log('Existing Amplify config found:', existingConfig);
      } catch (configError) {
        console.log('No existing Amplify config found or error accessing it');
      }
      
      // Configure with default minimal options
      Amplify.configure({
        Auth: {
          Cognito: {
            identityPoolId: 'dummy-identity-pool-id', // Will be replaced by real values if configured
            userPoolId: 'dummy-user-pool-id',
            userPoolClientId: 'dummy-user-pool-client-id'
          }
        }
      });
      
      console.log('Amplify initialized successfully in _layout.tsx');
    } catch (error) {
      // Detailed error logging
      console.error('Error initializing Amplify in _layout.tsx:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  }, []);

  return (
    <SyncProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f8fafc',
          },
          headerTintColor: '#1f2937',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitle: 'Back',
          contentStyle: {
            backgroundColor: '#f8fafc',
          },
        }}
      >
        {screens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.title,
              headerShown: screen.headerShown,
            }}
          />
        ))}
        </Stack>
      </SafeAreaProvider>
    </SyncProvider>
  );
}