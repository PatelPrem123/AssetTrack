import React, { useEffect, useState } from 'react';
import { Laptop, QrCode, Cpu, ShieldCheck, ArrowRight, RefreshCw, Layers, ShoppingBag, Boxes, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';

export function LandingPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      setHealth({ status: 'offline', error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const landingSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AssetTrack Enterprise ITAM',
    url: 'https://assettrack.enterprise/',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://assettrack.enterprise/catalog?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Primary Dynamic SEO */}
      <SEO
        title="AssetTrack | Enterprise IT Asset & Hardware Inventory Platform"
        description="Enterprise ITAM system with granular hardware specifications modeling, opaque QR-code labels, chain of custody tracking, warranty monitoring, and spare parts catalog."
        keywords="IT asset management, enterprise hardware inventory, DDR5 RAM SODIMM, Samsung 990 PRO NVMe SSD, Dell Latitude 7440, HP Z4 workstation, QR code asset labels"
        canonical="https://assettrack.enterprise/"
        schema={landingSchema}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold backdrop-blur-md border border-brand-400/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>Enterprise ITAM & Hardware Store Architecture</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            Enterprise IT Asset, Hardware Inventory & Spare Parts Platform
          </h1>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
            AssetTrack delivers granular hardware modeling (CPU, multi-module DDR4/5, NVMe/SATA drives),
            opaque QR-code label binding, an immutable chain of custody, and an auditable spare parts stock ledger.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors shadow-md shadow-sky-500/20"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Browse Hardware Store</span>
            </Link>
            <Link
              to="/assets"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-brand-900 font-semibold text-sm hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>Explore Inventory</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/scanner"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-700/60 hover:bg-brand-700 text-white font-medium text-sm border border-brand-500/30 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              <span>QR Mobile Scanner</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Gateway Status Probe (DEC-001) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              API Gateway
            </span>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Refresh Health"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <div
              className={`h-4 w-4 rounded-full ${
                health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            ></div>
            <div>
              <div className="text-xl font-bold capitalize text-slate-900 dark:text-white">
                {health?.status || 'Probing...'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {health?.service || 'Node.js Express /api/v1'}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
            Environment: {health?.environment || 'development'} | Uptime: {health?.uptimeSeconds || 0}s
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Database Persistence
            </span>
            <Layers className="h-4 w-4 text-brand-600" />
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-900 dark:text-white">MongoDB 7.x Cluster</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Multi-Tenant Compound Unique Indexing
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
            Isolated Tenancy: orgId Enforced
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Hardware Granularity
            </span>
            <Cpu className="h-4 w-4 text-brand-600" />
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-900 dark:text-white">Deep Specs Engine</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              CPU, Multi-Slot RAM, Dual NVMe SSDs
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
            Component Evolution Ledger Active
          </div>
        </div>
      </div>

      {/* Feature Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
            <Laptop className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Structured Hardware</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Individual slot DDR4/DDR5 MT/s capacities and multi-drive NVMe/SATA health arrays.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Immutable Custody</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Employee handover conditions, accessory checks, and non-destructive return history.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
            <QrCode className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Opaque QR Barcodes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Non-sensitive QR payloads with role-based camera scanning triage.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Spare Parts Ledger</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Audited IN, OUT, and ADJUSTMENT movements for cables, thermal paste, and RAM.
          </p>
        </div>
      </div>

      {/* Public E-Commerce Hardware Showcase Section (SEO & Storefront Integration) */}
      <section className="mt-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Public Hardware & Spare Parts Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Procure Enterprise Laptops, Workstations & Upgrade Modules
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Browse certified OEM hardware models with pre-configured structured specifications, warranty coverage, and instant procurement requisition.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/catalog"
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-xs rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <span>Explore Storefront</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/catalog?category=laptops"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition border border-white/10"
            >
              Enterprise Laptops
            </Link>
            <Link
              to="/catalog?category=workstations"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition border border-white/10"
            >
              CAD Workstations
            </Link>
            <Link
              to="/catalog?category=networking"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition border border-white/10"
            >
              Managed Switches
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
