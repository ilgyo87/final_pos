import { Alert } from 'react-native';

export async function generateLabelHTML({
  orderNumber,
  customerName,
  garmentType,
  notes
}: {
  orderNumber: string,
  customerName: string,
  garmentType: string,
  notes: string
}): Promise<string> {
  // Encode the order info as JSON for the QR code
  const qrPayload = JSON.stringify({ orderNumber, customerName, garmentType, notes });
  // Increased QR code size for better scanning
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

  // Inline the QR code as an <img> tag
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          @page {
            size: 90mm 29mm; /* Adjusted to match the 29x90mm label */
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 90mm;
            height: 29mm;
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 10px; /* Reduced base font size */
            line-height: 1.2;
            background: #fff;
            color: #000;
            overflow: hidden;
          }
          .label {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 1mm 2mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 2mm;
          }
          .qr {
            width: 25mm;
            height: 25mm;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;
            padding: 0.5mm;
            flex-shrink: 0;
          }
          .qr img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .info {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            gap: 1.5mm;
            padding: 1mm 0;
          }
          .label-title {
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
          }
          .label-text {
            font-size: 10px;
            white-space: nowrap;
          }
          .label-b {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="qr">
            <img src="${qrApiUrl}" alt="QR Code" width="70" height="70" style="display: block; width: 100%; height: auto;" onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2270%22%20height%3D%2270%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2270%22%20height%3D%2270%22%20fill%3D%22%23f0f0f0%22%2F%3E%3Ctext%20x%3D%2235%22%20y%3D%2235%22%20font-family%3D%22Arial%22%20font-size%3D%228%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EQR%20Code%3C%2Ftext%3E%3C%2Fsvg%3E'" />
          </div>
          <div class="info">
            <span class="label-title">#${orderNumber}</span>
            <span class="label-text"><span class="label-b">Name:</span> ${customerName}</span>
            <span class="label-text"><span class="label-b">Garment:</span> ${garmentType}</span>
            <span class="label-text"><span class="label-b">Notes:</span> ${notes}</span>
          </div>
        </div>
      </body>
    </html>
  `;
}

import RNPrint from 'react-native-print';

export const printLabel = async (html: string) => {
  try {
    // Print with the default printer
    await RNPrint.print({
      html,
      jobName: 'Order Label',
      isLandscape: false  // Ensures portrait orientation
    });
  } catch (error) {
    console.error('Error printing:', error);
    Alert.alert('Error', 'Failed to print. Please try again.');
    throw error;
  }
};
