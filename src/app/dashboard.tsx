import * as React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  ScrollView,
  Button
} from 'react-native';
import { Link, useRouter } from 'expo-router';

// TypeScript types for component refs
type TextInputRef = React.RefObject<TextInput>;

interface OrderData {
  orderNumber: string;
  customerName: string;
  garmentType: string;
  notes: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [scanInput, setScanInput] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [orderData, setOrderData] = React.useState<OrderData | null>(null);
  const inputRef = React.useRef<TextInput>(null);

  // Handle QR code scan input
  React.useEffect(() => {
    if (scanInput.includes('{') && scanInput.includes('}')) {
      try {
        const data = JSON.parse(scanInput);
        if (data.orderNumber) {
          setOrderData(data);
          setIsModalVisible(true);
          setScanInput('');
        }
      } catch (error) {
        console.error('Error parsing QR data:', error);
      }
    }
  }, [scanInput]);

  const handleScanInput = (text: string) => {
    setScanInput(text);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setOrderData(null);
    // Focus the input again after closing modal
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to POS</Text>
        
        <View style={styles.scanContainer}>
          <Text style={styles.scanLabel}>Scan QR Code:</Text>
          <TextInput
            ref={inputRef}
            style={styles.scanInput}
            value={scanInput}
            onChangeText={handleScanInput}
            autoFocus
            placeholder="Scan QR code..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/customers')}
          >
            <Text style={styles.actionButtonText}>CUSTOMERS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#059669' }]}
            onPress={() => router.push('/employees')}
          >
            <Text style={styles.actionButtonText}>EMPLOYEES</Text>
          </TouchableOpacity>
        </View>

        {/* Order Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Order Details</Text>
              
              {orderData && (
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order #:</Text>
                    <Text style={styles.detailValue}>{orderData.orderNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer:</Text>
                    <Text style={styles.detailValue}>{orderData.customerName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Garment:</Text>
                    <Text style={styles.detailValue}>{orderData.garmentType}</Text>
                  </View>
                  {orderData.notes ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notes:</Text>
                      <Text style={styles.detailValue}>{orderData.notes}</Text>
                    </View>
                  ) : null}
                </ScrollView>
              )}
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: 60, // Add some top padding
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 48,
    textAlign: 'center',
  },
  scanContainer: {
    marginBottom: 24,
    width: '100%',
  },
  scanLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  scanInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 40,
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#4b5563',
    width: 100,
    marginRight: 8,
  },
  detailValue: {
    flex: 1,
    color: '#1f2937',
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#2563eb',
  },
  customersButton: {
    backgroundColor: '#2563eb',
  },
  employeesButton: {
    backgroundColor: '#059669',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});