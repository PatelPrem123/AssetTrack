import React, { useState, useMemo } from 'react';
import {
  Laptop,
  Cpu,
  HardDrive,
  Layers,
  Search,
  Filter,
  Shield,
  Clock,
  ArrowRight,
  Boxes,
  CheckCircle2,
  X,
  ExternalLink,
  Tag,
  Star,
  Sparkles,
  ChevronRight,
  ShoppingCart,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/common/SEO';

// Curated Enterprise Hardware & Consumables Catalog with E-Commerce SEO Specs
const CATALOG_PRODUCTS = [
  {
    id: 'prod-lap-01',
    sku: 'TIT-LAP-7440',
    name: 'Dell Latitude 7440 Ultrabook',
    category: 'Laptops',
    categorySlug: 'laptops',
    manufacturer: 'Dell',
    model: 'Latitude 7440 Ultrabook',
    priceInr: 115000,
    priceFormatted: '₹1,15,000',
    condition: 'Brand New',
    stockStatus: 'In Stock',
    stockQty: 12,
    rating: 4.9,
    reviewsCount: 42,
    warranty: '3-Year ProSupport On-Site Next Business Day',
    description: 'Ultra-light enterprise mobile workstation featuring 13th Gen Intel Core i7, 32GB DDR5 5200MHz RAM, and 1TB PCIe 4.0 NVMe SSD.',
    specifications: {
      cpu: 'Intel Core i7-1365U (10 Cores, 12 Threads, Up to 5.2 GHz)',
      ram: '32GB LPDDR5 5200 MT/s Dual-Channel',
      storage: '1TB M.2 PCIe Gen 4 NVMe Solid State Drive',
      display: '14.0" FHD+ (1920x1200) Anti-Glare 400 nits IPS',
      os: 'Windows 11 Pro 64-bit / Ubuntu Linux Certified',
      ports: '2x Thunderbolt 4 with Power Delivery, 2x USB-A 3.2, 1x HDMI 2.0',
    },
  },
  {
    id: 'prod-dsk-02',
    sku: 'TIT-WRK-Z4G5',
    name: 'HP Z4 G5 Workstation Tower',
    category: 'Workstations',
    categorySlug: 'workstations',
    manufacturer: 'HP',
    model: 'Z4 G5 Workstation',
    priceInr: 185000,
    priceFormatted: '₹1,85,000',
    condition: 'Factory Calibrated',
    stockStatus: 'In Stock',
    stockQty: 5,
    rating: 5.0,
    reviewsCount: 28,
    warranty: '5-Year HP Care Pack Next Business Day Hardware Support',
    description: 'High-compute engineering workstation engineered for CAD, AI machine learning workflows, and heavy multitasking with Intel Xeon W processor.',
    specifications: {
      cpu: 'Intel Xeon W-2423 (6 Cores, 12 Threads, 15MB Cache)',
      ram: '64GB (2x32GB) DDR5-4800 ECC Registered Memory (Expandable to 512GB)',
      storage: '2TB NVMe PCIe Gen4 M.2 SSD + Secondary 4TB Enterprise HDD',
      gpu: 'NVIDIA RTX A2000 12GB GDDR6 Professional Workstation GPU',
      os: 'Windows 11 Pro for Workstations 64-bit',
      power: '775W 90% High-Efficiency 80 Plus Gold Power Supply',
    },
  },
  {
    id: 'prod-swt-03',
    sku: 'TIT-NET-2960X',
    name: 'Cisco Catalyst 2960-X Switch',
    category: 'Network Switches',
    categorySlug: 'networking',
    manufacturer: 'Cisco',
    model: 'WS-C2960X-48TS-L',
    priceInr: 95000,
    priceFormatted: '₹95,000',
    condition: 'Certified Enterprise',
    stockStatus: 'Limited Stock',
    stockQty: 3,
    rating: 4.8,
    reviewsCount: 19,
    warranty: 'Enhanced Limited Lifetime Warranty (E-LLW)',
    description: 'Enterprise-grade 48-port Gigabit Ethernet switch with 4x 1G SFP uplinks and dual redundant power supply support for core server rack deployments.',
    specifications: {
      ports: '48x 10/100/1000 Gigabit Ethernet Ports',
      uplinks: '4x 1G Small Form-Factor Pluggable (SFP) Gigabit Uplinks',
      throughput: '216 Gbps Switching Capacity / 107.1 Mpps Forwarding Rate',
      stacking: 'FlexStack-Plus technology up to 8 switches',
      firmware: 'Cisco IOS LAN Base Feature Set',
      rack: '1RU Standard 19-inch Enterprise Rack Mountable',
    },
  },
  {
    id: 'prod-ram-04',
    sku: 'RAM-DDR5-16G-5600',
    name: 'Crucial 16GB DDR5 5600MT/s SODIMM',
    category: 'RAM Modules',
    categorySlug: 'ram',
    manufacturer: 'Crucial',
    model: 'CT16G56C46S5',
    priceInr: 4800,
    priceFormatted: '₹4,800',
    condition: 'Brand New',
    stockStatus: 'In Stock',
    stockQty: 8,
    rating: 4.9,
    reviewsCount: 65,
    warranty: 'Limited Lifetime Replacement Warranty',
    description: 'High-density laptop and workstation memory module engineered for DDR5 memory architectures with on-die ECC and 1.1V low-power profile.',
    specifications: {
      capacity: '16 Gigabytes (Single Module)',
      speed: '5600 MT/s (PC5-44800)',
      formFactor: 'SODIMM 262-pin',
      ecc: 'Non-ECC On-Die ECC',
      latency: 'CL46',
      voltage: '1.1V Standard DDR5 Power',
    },
  },
  {
    id: 'prod-ssd-05',
    sku: 'SSD-NVME-1TB-990P',
    name: 'Samsung 990 PRO 1TB PCIe 4.0 NVMe',
    category: 'Storage Devices',
    categorySlug: 'ssd',
    manufacturer: 'Samsung',
    model: 'MZ-V9P1T0B/AM',
    priceInr: 11000,
    priceFormatted: '₹11,000',
    condition: 'Brand New',
    stockStatus: 'Low Stock',
    stockQty: 2,
    rating: 5.0,
    reviewsCount: 88,
    warranty: '5-Year Manufacturer Limited Warranty (600 TBW)',
    description: 'Flagship PCIe Gen 4.0 x4 internal solid state drive achieving sequential read speeds up to 7,450 MB/s with Samsung nickel-coated Pascal controller.',
    specifications: {
      capacity: '1,000 GB (1TB NVMe)',
      interface: 'PCIe Gen 4.0 x4, NVMe 2.0',
      sequentialRead: 'Up to 7,450 Megabytes per second',
      sequentialWrite: 'Up to 6,900 Megabytes per second',
      endurance: '600 Terabytes Written (TBW)',
      encryption: 'AES 256-bit Full Disk Encryption (Class 0), TCG/Opal',
    },
  },
];

const CATEGORIES = [
  { label: 'All Hardware & Parts', slug: 'all' },
  { label: 'Laptops', slug: 'laptops' },
  { label: 'Workstations', slug: 'workstations' },
  { label: 'Network Hardware', slug: 'networking' },
  { label: 'RAM Modules', slug: 'ram' },
  { label: 'Storage & SSDs', slug: 'ssd' },
];

export function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [quoteSuccess, setQuoteSuccess] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    employeeName: '',
    workEmail: '',
    department: 'Software Engineering',
    quantity: 1,
    notes: '',
  });

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return CATALOG_PRODUCTS.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.categorySlug === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Schema.org Structured Data for E-Commerce SEO
  const catalogSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: 'AssetTrack Enterprise Hardware & Spare Parts Catalog',
        description: 'Verified enterprise laptops, workstations, Cisco switches, and high-performance DDR5/NVMe replacement parts.',
        numberOfItems: filteredProducts.length,
        itemListElement: filteredProducts.map((p, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: p.name,
            sku: p.sku,
            mpn: p.sku,
            image: `https://assettrack.enterprise/favicon.svg`,
            description: p.description,
            brand: {
              '@type': 'Brand',
              name: p.manufacturer,
            },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: p.priceInr.toString(),
              priceValidUntil: '2027-12-31',
              itemCondition: 'https://schema.org/NewCondition',
              availability:
                p.stockQty > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              url: `https://assettrack.enterprise/catalog?item=${p.sku}`,
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: p.rating.toString(),
              reviewCount: p.reviewsCount.toString(),
            },
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://assettrack.enterprise/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Hardware Catalog',
            item: 'https://assettrack.enterprise/catalog',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: selectedCategory.toUpperCase(),
            item: `https://assettrack.enterprise/catalog?category=${selectedCategory}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does AssetTrack track hardware warranty and component changes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AssetTrack binds each hardware device to an immutable serial number and cryptographic opaque QR token. When spare parts (RAM or SSD) are swapped in the maintenance center, the hardware architecture automatically updates while preserving the complete historical custody chain.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can employees submit asset requisitions directly from the catalog?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Authorized organization members can select any catalog item to submit an automated hardware requisition, initiating an approval workflow for IT Asset Managers.',
            },
          },
        ],
      },
    ],
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    setQuoteSuccess(`Requisition request for '${activeModalProduct.name}' submitted successfully to your organization IT administrator.`);
    setTimeout(() => {
      setQuoteSuccess(null);
      setActiveModalProduct(null);
    }, 2200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Dynamic SEO Meta & E-Commerce Schema Injection */}
      <SEO
        title="Enterprise IT Hardware Store & Spare Parts Catalog"
        description="Browse certified enterprise hardware, laptops, desktop workstations, Cisco networking devices, Crucial DDR5 RAM, and Samsung 990 PRO NVMe SSDs with warranty tracking."
        keywords="enterprise hardware catalog, buy refurbished laptops, DDR5 RAM sodimm, Samsung 990 PRO NVMe SSD, HP Z4 workstation, Cisco 2960 switch, IT equipment requisition"
        canonical="https://assettrack.enterprise/catalog"
        schema={catalogSchema}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950 to-brand-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold backdrop-blur-md border border-sky-400/20">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Public Hardware Storefront & Procurement Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Enterprise IT Hardware & Spare Parts Marketplace
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Indexable specifications, certified warranty tiers, transparent INR pricing, and immediate requisition workflows for laptops, workstations, network switches, and consumables.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Verified On-Site Warranties
            </span>
            <span className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1 rounded-lg border border-slate-700">
              <Boxes className="w-3.5 h-3.5 text-sky-400" /> Non-Negative Stock Safety (DEC-006)
            </span>
          </div>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.slug
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by model, brand, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Breadcrumb Bar */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-300">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-sky-600 dark:text-sky-400">Hardware Catalog</span>
          {selectedCategory !== 'all' && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="capitalize text-slate-700 dark:text-slate-300">{selectedCategory}</span>
            </>
          )}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => (
          <article
            key={p.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
          >
            <div>
              {/* Card Header & Brand Pill */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-100 dark:border-sky-800">
                    {p.category}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 ml-2">SKU: {p.sku}</span>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                    p.stockQty > 5
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200'
                  }`}
                >
                  {p.stockStatus} ({p.stockQty} left)
                </span>
              </div>

              {/* Title & Specs */}
              <div className="p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition">
                  {p.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                {/* Specs Pill List */}
                <div className="space-y-1.5 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {Object.entries(p.specifications).slice(0, 3).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-1.5 truncate">
                      <span className="capitalize font-semibold text-slate-400 shrink-0">{key}:</span>
                      <span className="truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Warranty Strip */}
                <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{p.warranty}</span>
                </div>
              </div>
            </div>

            {/* Price & Actions Footer */}
            <div className="p-5 pt-3 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Unit Cost</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {p.priceFormatted}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(p)}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <span>Requisition</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* SEO Rich FAQ Section */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Frequently Asked Questions — Enterprise Hardware & Spare Parts Procurement
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard operating procedures for IT equipment requisitions, warranty dispatch, and asset tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              How does AssetTrack prevent stock depletion and negative inventory?
            </h3>
            <p>
              Under architectural rule DEC-006, the material ledger enforces a non-negative constraint. Dispatches and component swaps will automatically abort if available stock drops below zero, and real-time alerts fire whenever items hit reorder thresholds.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              What is included in the opaque QR label affixed to hardware?
            </h3>
            <p>
              In accordance with DEC-004, QR labels contain only non-sensitive cryptographic tokens. No employee names, MAC addresses, or internal network IPs are printed on physical stickers, ensuring zero physical reconnaissance vulnerabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Requisition / Details Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activeModalProduct.sku}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {activeModalProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {quoteSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{quoteSuccess}</span>
                </div>
              )}

              {/* Specs Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Certified Hardware Architecture
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                  {Object.entries(activeModalProduct.specifications).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-semibold capitalize text-slate-500 block">{k}:</span>
                      <span className="font-mono text-[11px]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requisition Form */}
              <form onSubmit={handleQuoteSubmit} className="space-y-3.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Requisition & Procurement Request
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Requester Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={quoteForm.employeeName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, employeeName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@company.com"
                      value={quoteForm.workEmail}
                      onChange={(e) => setQuoteForm({ ...quoteForm, workEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <select
                      value={quoteForm.department}
                      onChange={(e) => setQuoteForm({ ...quoteForm, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="IT Infrastructure">IT Infrastructure</option>
                      <option value="Security Operations">Security Operations</option>
                      <option value="Design & Creative">Design & Creative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity Needed
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={activeModalProduct.stockQty}
                      value={quoteForm.quantity}
                      onChange={(e) => setQuoteForm({ ...quoteForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Justification & Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Project requirement, replacement for damaged device, or memory upgrade..."
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Total Estimated: {activeModalProduct.priceFormatted}
                  </span>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Requisition</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
