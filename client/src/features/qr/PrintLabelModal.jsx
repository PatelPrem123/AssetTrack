import React from 'react';
import { X, Printer, Download, QrCode } from 'lucide-react';

export function PrintLabelModal({ isOpen, onClose, asset }) {
  if (!isOpen || !asset) return null;

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/assets/${asset._id}/label.pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Asset-Label-${asset.assetTag}.pdf`;
        link.click();
      });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Industrial QR Asset Label</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Label Preview (2x1" Ratio) */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/60">
          <div
            id="printable-asset-label"
            className="w-80 h-40 bg-white border-2 border-slate-900 rounded-lg p-3 text-slate-900 flex flex-col justify-between shadow-lg"
          >
            {/* Top row */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1">
              <span className="font-mono text-xs font-black tracking-widest uppercase">
                {asset.organizationId?.name || 'ASSETTRACK'}
              </span>
              <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                IT PROPERTY
              </span>
            </div>

            {/* Middle body */}
            <div className="flex items-center justify-between my-1">
              <div className="space-y-0.5 flex-1 pr-2">
                <div className="font-mono text-base font-black tracking-tight text-slate-950">
                  {asset.assetTag}
                </div>
                <div className="text-[11px] font-bold text-slate-800 line-clamp-1">{asset.name}</div>
                <div className="text-[10px] font-mono text-slate-600">S/N: {asset.serialNumber}</div>
              </div>

              {/* QR Image */}
              {asset.qrCodeImage ? (
                <img
                  src={asset.qrCodeImage}
                  alt={asset.assetTag}
                  className="w-16 h-16 border border-slate-300 rounded p-0.5"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-400" />
                </div>
              )}
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between border-t border-slate-300 pt-1 text-[9px] text-slate-500 font-mono">
              <span>SCAN TO AUDIT / VERIFY</span>
              <span>DO NOT REMOVE</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 text-center">
            Standard industrial thermal 2x1" label format (DEC-004)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download Vector PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
