import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { env } from '../../config/env.js';

export class PDFLabelGenerator {
  /**
   * Generates a 2x1 inch (144 x 72 pt) vector PDF asset barcode label
   */
  static async generateAssetLabelPDF(asset, orgName = 'AssetTrack') {
    return new Promise(async (resolve, reject) => {
      try {
        // Standard 2x1 inch label @ 72 points per inch: 144 x 72 pt
        const doc = new PDFDocument({
          size: [144, 72],
          margins: { top: 4, bottom: 4, left: 4, right: 4 },
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Generate high-density QR code buffer
        const scanUrl = `${env.QR_BASE_URL}/${asset.qrCodeReference}`;
        const qrBuffer = await QRCode.toBuffer(scanUrl, {
          type: 'png',
          errorCorrectionLevel: 'M',
          margin: 0,
          width: 60,
        });

        // Background border
        doc.lineWidth(0.5).rect(2, 2, 140, 68).stroke('#cbd5e1');

        // Draw QR Code on left
        doc.image(qrBuffer, 6, 6, { width: 60, height: 60 });

        // Organization Name Header
        doc.fillColor('#1e3a8a')
          .fontSize(6)
          .font('Helvetica-Bold')
          .text(orgName.toUpperCase(), 70, 7, { width: 70, ellipsis: true });

        // Asset Tag
        doc.fillColor('#0f172a')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(asset.assetTag, 70, 18, { width: 70 });

        // Asset Name / Model
        doc.fillColor('#475569')
          .fontSize(6)
          .font('Helvetica')
          .text(`${asset.manufacturer} ${asset.model}`, 70, 32, { width: 70, height: 16, ellipsis: true });

        // Serial Number
        if (asset.serialNumber) {
          doc.fillColor('#64748b')
            .fontSize(5)
            .font('Helvetica-Bold')
            .text(`S/N: ${asset.serialNumber}`, 70, 48, { width: 70, ellipsis: true });
        }

        // Footer Tag
        doc.fillColor('#059669')
          .fontSize(5)
          .font('Helvetica-Bold')
          .text('PROPERTY OF IT', 70, 58);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
