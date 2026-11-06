import { useEffect } from 'react';

/**
 * Enterprise SEO & Structured Data Head Component
 * Dynamically updates document title, standard meta tags, OpenGraph,
 * Twitter cards, canonical link, and injects Schema.org JSON-LD rich snippets.
 */
export function SEO({
  title = 'AssetTrack - Enterprise IT Asset & Hardware Inventory Platform',
  description = 'Granular IT asset management, enterprise hardware specifications, opaque QR-code labels, chain of custody tracking, and spare parts catalog.',
  keywords = 'IT asset management, ITAM, hardware inventory, computer specs, QR code asset tracking, spare parts inventory, DDR5 RAM, NVMe SSD, enterprise laptops',
  canonical,
  ogType = 'website',
  ogImage = '/og-image.png',
  schema,
  noIndex = false,
  price,
  currency = 'INR',
  availability,
}) {
  useEffect(() => {
    // 1. Update Title
    const fullTitle = title.includes('AssetTrack') ? title : `${title} | AssetTrack Enterprise`;
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');

    // 3. OpenGraph Tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'AssetTrack Enterprise ITAM');
    const currentUrl = canonical || window.location.href;
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);

    // E-commerce OpenGraph Tags
    if (price) {
      setMetaTag('property', 'product:price:amount', price.toString());
      setMetaTag('property', 'product:price:currency', currency);
      if (availability) {
        setMetaTag('property', 'product:availability', availability);
      }
    }

    // 4. Twitter Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`);

    // 5. Canonical Link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', currentUrl);

    // 6. Schema.org JSON-LD Structured Data
    if (schema) {
      let scriptEl = document.getElementById('seo-json-ld');
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.setAttribute('id', 'seo-json-ld');
        scriptEl.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(schema);
    }

    return () => {
      // Cleanup script on unmount
      const scriptEl = document.getElementById('seo-json-ld');
      if (scriptEl && schema) {
        scriptEl.textContent = '';
      }
    };
  }, [title, description, keywords, canonical, ogType, ogImage, schema, noIndex, price, currency, availability]);

  return null;
}

export default SEO;
