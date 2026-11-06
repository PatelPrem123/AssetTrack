import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode, Search, CheckCircle2, AlertCircle, ArrowRight, Laptop, User, MapPin } from 'lucide-react';
import { api } from '../../services/api';

export function QRScannerModal({ isOpen, onClose, onSelectAsset }) {
  const [scannedToken, setScannedToken] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [assetProfile, setAssetProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setAssetProfile(null);
      setError(null);
      setScannedToken('');
      setManualInput('');
      return;
    }

    // Initialize scanner with slight delay to ensure DOM is ready
    let observer = null;
    const timer = setTimeout(() => {
      try {
        const container = document.getElementById('qr-reader-container');
        if (container) {
          observer = new MutationObserver(() => {
            const headerMsg = document.getElementById('qr-reader-container__header_message');
            if (headerMsg && headerMsg.innerText) {
              const text = headerMsg.innerText;
              if (
                text.includes('NotFoundException') ||
                text.includes('No MultiFormat Readers') ||
                text.includes('No barcode or QR code')
              ) {
                headerMsg.innerText =
                  'No valid QR code detected in the selected image. Please upload an image with a clear Asset QR code, or enter the tag manually below.';
                headerMsg.style.fontSize = '12px';
                headerMsg.style.padding = '8px 12px';
                headerMsg.style.borderRadius = '8px';
                headerMsg.style.border = '1px solid #fecdd3';
                headerMsg.style.background = '#fff1f2';
                headerMsg.style.color = '#e11d48';
                headerMsg.style.textAlign = 'center';
                headerMsg.style.margin = '8px 0';
              }
            }
          });
          observer.observe(container, { childList: true, subtree: true, characterData: true });
        }

        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            // Check if it's full scan URL or opaque token
            let token = decodedText;
            if (decodedText.includes('/scan/')) {
              token = decodedText.split('/scan/').pop();
            }
            setScannedToken(token);
            lookupToken(token);
            scanner.clear();
          },
          () => {
            // Handle scan frame errors silently
          }
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.warn('HTML5 Scanner initialization:', err);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, [isOpen]);

  const lookupToken = async (tokenToQuery) => {
    setError(null);
    setLoading(true);
    setAssetProfile(null);

    try {
      const res = await api.get(`/assets/scan/${tokenToQuery.trim()}`);
      setAssetProfile(res.data.data);
    } catch (err) {
      setError(err.message || 'Asset not found or unauthorized');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      lookupToken(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">QR Scanner & Lookup</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Camera Viewfinder */}
          {!assetProfile && (
            <div className="space-y-4">
              <div
                id="qr-reader-container"
                className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950"
              />

              {/* Manual Lookup Fallback */}
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter QR token / Asset tag..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  Find
                </button>
              </form>
            </div>
          )}

          {loading && (
            <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-400 animate-pulse">
              Resolving hardware profile...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scanned Asset Profile Card */}
          {assetProfile && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                      {assetProfile.assetTag}
                    </span>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                      {assetProfile.name}
                    </h4>
                    <p className="text-xs text-slate-500">{assetProfile.model} • {assetProfile.manufacturer}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    {assetProfile.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-sky-100 dark:border-sky-900/40">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span>S/N: {assetProfile.serialNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{assetProfile.locationId?.room || 'Assigned'}</span>
                  </div>
                  {assetProfile.assignedTo && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 col-span-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Custody: {assetProfile.assignedTo.name || `${assetProfile.assignedTo.firstName} ${assetProfile.assignedTo.lastName}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssetProfile(null);
                    setScannedToken('');
                  }}
                  className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Scan Another
                </button>
                {onSelectAsset && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAsset(assetProfile);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    Select Device
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
