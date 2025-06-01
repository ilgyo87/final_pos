import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { generateLabelHTML, printLabel } from '../utils/printUtils';

export default function Customers() {
  const [isPrinting, setIsPrinting] = useState(false);


  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const html = await generateLabelHTML(orderData);
      await printLabel(html);
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print label');
    } finally {
      setIsPrinting(false);
    }
  };

  // Sample order data - replace with your actual data
  const orderData = {
    orderNumber: '12345',
    customerName: 'John Doe',
    garmentType: 'Shirt',
    notes: 'No starch, rush order',
  };

  // Generate QR code URL
  const qrPayload = JSON.stringify(orderData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrPayload)}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Order Label</Text>
        
        {/* QR Label Preview */}
        <View style={styles.labelContainer}>
          <View style={styles.labelContent}>
            <View style={styles.qrContainer}>
              <View style={styles.qrCode}>
                <Text style={styles.qrPlaceholder}>QR Code</Text>
                <Text style={styles.qrSmallText}>(Preview)</Text>
              </View>
            </View>
            <View style={styles.labelInfo}>
              <Text style={styles.labelTitle}>#{orderData.orderNumber}</Text>
              <Text style={styles.labelText}>
                <Text style={styles.labelBold}>Name:</Text> {orderData.customerName}
              </Text>
              <Text style={styles.labelText}>
                <Text style={styles.labelBold}>Garment:</Text> {orderData.garmentType}
              </Text>
              <Text style={styles.labelText}>
                <Text style={styles.labelBold}>Notes:</Text> {orderData.notes}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.printButton, isPrinting && styles.buttonDisabled]}
            onPress={handlePrint}
            disabled={isPrinting}
          >
            <Text style={styles.actionButtonText}>
              {isPrinting ? 'Printing...' : 'Print Label'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  labelContainer: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  labelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  qrContainer: {
    width: 80,
    height: 80,
    marginRight: 8,
  },
  qrCode: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  qrSmallText: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  labelInfo: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  labelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 8,
  },
  labelText: {
    fontSize: 10,
    color: '#4b5563',
    marginRight: 4,
  },
  labelBold: {
    fontWeight: '600',
    color: '#1f2937',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButton: {
    backgroundColor: '#6b7280',
  },
  printButton: {
    backgroundColor: '#3b82f6',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: '90%',
    width: '90%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 20,
    color: '#6b7280',
    padding: 5,
  },
  webviewContainer: {
    height: 500,
    width: '100%',
    backgroundColor: '#f9fafb',
  },
  webview: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  printModalButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
