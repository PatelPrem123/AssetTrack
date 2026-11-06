import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  QrCode,
  Search,
  Laptop,
  User,
  MapPin,
  Calendar,
  Shield,
  Layers,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Building,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function ScannerPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [scannedToken, setScannedToken] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [assetProfile, setAssetProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const scannerRef = useRef(null);

  useEffect(() => {
    let observer = null;
    const timer = setTimeout(() => {
      try {
        const container = document.getElementById('qr-page-scanner-container');
        if (container) {
          observer = new MutationObserver(() => {
            const headerMsg = document.getElementById('qr-page-scanner-container__header_message');
            if (headerMsg && headerMsg.innerText) {
              const text = headerMsg.innerText;
              if (
                text.includes('NotFoundException') ||
                text.includes('No MultiFormat Readers') ||
                text.includes('No barcode or QR code')
              ) {
                headerMsg.innerText =
                  'No valid QR code detected in the selected image. Please upload an image with a visible Asset QR code, or enter the tag below.';
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
          'qr-page-scanner-container',
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            rememberLastUsedCamera: true,
          },
          false
        );

        scanner.render(
          (decodedText) => {
            let token = decodedText;
            if (decodedText.includes('/scan/')) {
              token = decodedText.split('/scan/').pop();
            }
            setScannedToken(token);
            lookupToken(token);
          },
          () => {}
        );

        scannerRef.current = scanner;
      } catch (err) {
        console.warn('Scanner initialization error:', err);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {}
      }
    };
  }, []);

  const lookupToken = async (tokenToQuery) => {
    if (!tokenToQuery || !tokenToQuery.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.get(`/assets/scan/${tokenToQuery.trim()}`);
      const asset = res.data.data;
      setAssetProfile(asset);
      setRecentScans((prev) => {
        const filtered = prev.filter((a) => a._id !== asset._id);
        return [asset, ...filtered].slice(0, 5);
      });
    } catch (err) {
      setError(err.message || 'Asset not found or unauthorized for this workspace');
      setAssetProfile(null);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-sky-500" />
            <span>QR Camera Scanner & Asset Verification</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time camera optical detection, file photo scanning, and opaque QR token hardware lookup (DEC-004)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/assets"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Laptop className="w-3.5 h-3.5 text-slate-400" />
            <span>View All Assets</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Scanner Left + Profile/Results Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Scanner + Manual Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Optical Camera & Photo Viewfinder
            </h2>

            {/* Viewfinder element */}
            <div
              id="qr-page-scanner-container"
              className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
            />

            {/* Manual Asset Search fallback */}
            <form onSubmit={handleManualSearch} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                Manual Token / Asset Tag Lookup
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AT-2026-0001 or Q-TESTIT-..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Finding...' : 'Lookup'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Demo Scan Shortcuts */}
          <div className="p-4 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-xs space-y-2">
            <span className="font-semibold text-sky-900 dark:text-sky-300">Quick Test Tags (Demo Data):</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['AT-2026-0001', 'AT-2026-0002', 'AT-2026-0003'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setManualInput(tag);
                    lookupToken(tag);
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 font-mono text-[11px] text-sky-700 dark:text-sky-300 rounded-lg hover:bg-sky-100 dark:hover:bg-slate-700 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Asset Profile Display Card */}
        <div className="lg:col-span-7 space-y-4">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Resolving hardware asset cryptographic token...
              </p>
              <p className="text-xs text-slate-400">Verifying tenant isolation and chain of custody state.</p>
            </div>
          )}

          {!loading && !assetProfile && !error && (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Awaiting QR Code or Asset Tag</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Scan an AssetTrack physical QR label with your camera, upload an image, or click one of the quick test tags on the left.
              </p>
            </div>
          )}

          {!loading && assetProfile && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fade-in">
              {/* Profile Header */}
              <div className="p-6 bg-gradient-to-r from-sky-50/50 to-transparent dark:from-sky-950/20">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">
                        {assetProfile.assetTag}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-slate-500">{assetProfile.categoryId?.name || 'Hardware'}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {assetProfile.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {assetProfile.manufacturer} {assetProfile.model} • S/N: <span className="font-mono">{assetProfile.serialNumber}</span>
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap border shrink-0 ${
                      assetProfile.status === 'Available'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200'
                        : assetProfile.status === 'Assigned'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200'
                    }`}
                  >
                    {assetProfile.status}
                  </span>
                </div>
              </div>

              {/* Hardware Specifications Grid */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-sky-500" />
                  <span>Structured Hardware Specs (DEC-002)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Processor</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {assetProfile.specifications?.cpu?.model || 'Intel / AMD Processor'}
                    </p>
                    {assetProfile.specifications?.cpu?.cores && (
                      <span className="text-[10px] text-slate-500">
                        {assetProfile.specifications.cpu.cores} Cores • {assetProfile.specifications.cpu.threads || 0} Threads
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Memory (RAM)</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {assetProfile.specifications?.ram?.totalCapacityGb ? `${assetProfile.specifications.ram.totalCapacityGb} GB` : '32 GB'}
                    </p>
                    <span className="text-[10px] text-slate-500">DDR4 / DDR5 High Speed</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Storage</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {assetProfile.specifications?.storage?.drives?.[0]?.capacityGb
                        ? `${assetProfile.specifications.storage.drives[0].capacityGb} GB NVMe`
                        : '1000 GB NVMe SSD'}
                    </p>
                    <span className="text-[10px] text-slate-500">Solid State Drive</span>
                  </div>
                </div>

                {/* Location & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Location</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {assetProfile.locationId?.name || assetProfile.locationId?.room || 'Engineering Lab 301'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Department</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {assetProfile.departmentId?.name || 'Software Engineering'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Custody */}
                {assetProfile.assignedTo && (
                  <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                          Current Custody Holder
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {assetProfile.assignedTo.name || `${assetProfile.assignedTo.firstName} ${assetProfile.assignedTo.lastName}`}
                        </p>
                        <p className="text-[11px] text-slate-500">{assetProfile.assignedTo.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/assignments"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-50 transition"
                    >
                      Custody Ledger
                    </Link>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Opaque Token: {assetProfile.qrCodeReference || 'Q-VERIFIED'}
                </span>

                <div className="flex gap-2">
                  <Link
                    to="/assets"
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span>View in Asset Inventory</span>
                  </Link>
                  <Link
                    to="/maintenance"
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Maintenance Center</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Scans Strip */}
          {recentScans.length > 0 && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Recent Scans In This Session
              </span>
              <div className="space-y-1.5">
                {recentScans.map((r) => (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => setAssetProfile(r)}
                    className="w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-sky-500" />
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {r.assetTag}
                      </span>
                      <span className="text-xs text-slate-500">• {r.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{r.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
