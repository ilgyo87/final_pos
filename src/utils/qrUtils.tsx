import React from 'react';
import QRCodeSVG from 'react-native-qrcode-svg';

export type QRCodeProps = {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
};

export const QRCode: React.FC<QRCodeProps> = ({ value, size = 200, color = '#000', backgroundColor = '#fff' }) => (
  <QRCodeSVG
    value={value}
    size={size}
    color={color}
    backgroundColor={backgroundColor}
  />
);
