import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  return (
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
  );
}