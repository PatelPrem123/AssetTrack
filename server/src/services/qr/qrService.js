import QRCode from 'qrcode';
import { env } from '../../config/env.js';

export class QRService {
  /**
   * Generates a Data URL for the opaque QR code deep-link
   */
  static async generateQRCodeDataUrl(qrReference) {
    const scanUrl = `${env.QR_BASE_URL}/${qrReference}`;
    return QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff',
      },
      width: 256,
    });
  }

  /**
   * Generates high-density vector SVG markup for printable physical labels
   */
  static async generateQRCodeSVG(qrReference) {
    const scanUrl = `${env.QR_BASE_URL}/${qrReference}`;
    return QRCode.toString(scanUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 1,
    });
  }
}
