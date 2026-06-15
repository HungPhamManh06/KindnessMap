import React, { useEffect, useRef, useState } from 'react';
import { Flame, MapPin } from 'lucide-react';

// ---------------------------------------------------------------------------
// CDN URLs — MapLibre GL JS (no API key, no backend, pure OSM)
// ---------------------------------------------------------------------------
const MAPLIBRE_CSS_URL = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const MAPLIBRE_JS_URL  = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';

// Free OpenStreetMap raster tiles — public, no key needed
const OSM_STYLE = {
  "version": 8,
  "sources": {
    "osm": {
      "type": "raster",
      "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      "tileSize": 256
    }
  },
  "layers": [
    {
      "id": "osm",
      "type": "raster",
      "source": "osm"
    }
  ]
};

// ---------------------------------------------------------------------------
// Category → colour mapping
// ---------------------------------------------------------------------------
const getCategoryColor = (category) => {
  switch (category) {
    case 'Môi trường':
    case 'Environment':    return '#16a34a';
    case 'Trồng cây':
    case 'Tree Planting':  return '#15803d';
    case 'Hiến máu':
    case 'Blood Donation': return '#dc2626';
    case 'Người cao tuổi':
    case 'Elderly Care':   return '#ca8a04';
    case 'Giáo dục':
    case 'Education':      return '#2563eb';
    case 'Tình nguyện':
    case 'Volunteer':      return '#7c3aed';
    default:               return '#0891b2';
  }
};

// ---------------------------------------------------------------------------
// Heatmap hotspots (demo data)
// ---------------------------------------------------------------------------
const HEATMAP_HOTSPOTS = [
  { name: 'Khu vực Hồ Tây, Hà Nội',        lat: 21.0583, lng: 105.8159, radius: 8000,  count: 28 },
  { name: 'Cầu Giấy & Đống Đa, Hà Nội',    lat: 21.0382, lng: 105.7826, radius: 10000, count: 45 },
  { name: 'Quận 1, TP. Hồ Chí Minh',        lat: 10.7769, lng: 106.7009, radius: 12000, count: 62 },
  { name: 'Tân Bình, TP. Hồ Chí Minh',      lat: 10.7925, lng: 106.6541, radius: 9000,  count: 31 },
  { name: 'Trung tâm Đà Nẵng',              lat: 16.0544, lng: 108.2022, radius: 11000, count: 39 },
  { name: 'Đại học Cần Thơ',                lat: 10.0333, lng: 105.7833, radius: 7000,  count: 22 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/** Dynamically inject a <link> or <script> tag once */
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.onload = resolve;
    el.onerror = reject;
    document.head.appendChild(el);
  });

const loadCss = (href) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = href;
  document.head.appendChild(el);
};

/** Build an SVG pin element for use as a MapLibre marker */
const createPinElement = (color) => {
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = `
    <svg width="34" height="44" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
      <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.35"/>
      </filter>
      <path filter="url(#pin-shadow)"
         d="M19 46C19 46 35 29.8 35 17.8C35 8.5 27.8 1 19 1C10.2 1 3 8.5 3 17.8C3 29.8 19 46 19 46Z"
         fill="${color}" stroke="white" stroke-width="4"/>
      <circle cx="19" cy="18" r="7" fill="white" fill-opacity="0.96"/>
    </svg>`;
  return el;
};

/** Meters → approximate degrees (rough, good enough for circle polygons) */
const metersToLngDeg = (meters, lat) => meters / (111320 * Math.cos((lat * Math.PI) / 180));
const metersToLatDeg = (meters) => meters / 110540;

/** Build a GeoJSON polygon circle */
const buildCirclePolygon = (lat, lng, radiusMeters, steps = 64) => {
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    coords.push([
      lng + metersToLngDeg(radiusMeters, lat) * Math.cos(angle),
      lat + metersToLatDeg(radiusMeters)      * Math.sin(angle),
    ]);
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const MapComponent = ({
  posts = [],
  selectedCenter = null,
  className = 'h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200',
}) => {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);     // maplibregl.Map instance
  const markersRef    = useRef([]);       // array of maplibregl.Marker
  const popupRef      = useRef(null);     // single shared Popup
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [mapReady,    setMapReady]    = useState(false);

  // ── 1. Load MapLibre GL JS + CSS from CDN, then init map ────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        loadCss(MAPLIBRE_CSS_URL);
        await loadScript(MAPLIBRE_JS_URL);
        if (cancelled || !containerRef.current || mapRef.current) return;

        const maplibregl = window.maplibregl;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: OSM_STYLE,
          center: [108, 16],
          zoom: 5,
          attributionControl: true,
        });

        // Shared popup (re-used for every marker click)
        popupRef.current = new maplibregl.Popup({
          maxWidth: '280px',
          closeButton: true,
          closeOnClick: false,
          className: 'kindness-popup',
        });

        // Example marker: Hà Nội
        const hanoiEl = createPinElement('#059669');
        hanoiEl.title = 'Hà Nội';
        new maplibregl.Marker({ element: hanoiEl })
          .setLngLat([105.8412, 21.0245])
          .setPopup(
            new maplibregl.Popup({ maxWidth: '200px' }).setHTML(
              `<div style="font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:800;color:#0f172a;">
                 📍 Hà Nội<br/>
                 <span style="font-weight:500;color:#64748b;font-size:11px;">Thủ đô Việt Nam</span>
               </div>`
            )
          )
          .addTo(map);

        // Add Hoàng Sa and Trường Sa markers
        new maplibregl.Marker()
          .setLngLat([112.5, 16.5])
          .setPopup(new maplibregl.Popup({ offset: [0, -10] }).setText("Hoàng Sa (Paracel Islands)"))
          .addTo(map);

        new maplibregl.Marker()
          .setLngLat([114.0, 10.5])
          .setPopup(new maplibregl.Popup({ offset: [0, -10] }).setText("Trường Sa (Spratly Islands)"))
          .addTo(map);

        mapRef.current = map;
        map.on('load', () => {
          if (!cancelled) setMapReady(true);
        });
      } catch (err) {
        console.error('MapLibre init error:', err);
      }
    };

    init();

    return () => {
      cancelled = true;
      // Clean up markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapReady(false);
    };
  }, []); // run once

  // ── 2. Render posts markers OR heatmap circles whenever data changes ─────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const maplibregl = window.maplibregl;

    // Remove existing custom markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Remove existing heatmap layers/sources
    ['heatmap-fill', 'heatmap-stroke'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('heatmap')) map.removeSource('heatmap');

    // ── Heatmap mode ──────────────────────────────────────────────────────
    if (heatmapMode) {
      const features = HEATMAP_HOTSPOTS.map((spot) => ({
        ...buildCirclePolygon(spot.lat, spot.lng, spot.radius),
        properties: { name: spot.name, count: spot.count, strong: spot.count > 40 },
      }));

      map.addSource('heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.addLayer({
        id: 'heatmap-fill',
        type: 'fill',
        source: 'heatmap',
        paint: {
          'fill-color': [
            'case',
            ['get', 'strong'], 'rgba(244,63,94,0.35)',
            'rgba(16,185,129,0.32)',
          ],
        },
      });

      map.addLayer({
        id: 'heatmap-stroke',
        type: 'line',
        source: 'heatmap',
        paint: {
          'line-color': [
            'case',
            ['get', 'strong'], 'rgba(225,29,72,0.85)',
            'rgba(5,150,105,0.85)',
          ],
          'line-width': 2,
        },
      });

      // Popup on heatmap circle click
      map.on('click', 'heatmap-fill', (e) => {
        const { name, count } = e.features[0].properties;
        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:800;color:#0f172a;">
               🔥 ${escapeHtml(name)}<br/>
               <span style="font-weight:600;color:#64748b;">Hơn ${count} hành động việc tốt</span>
             </div>`
          )
          .addTo(map);
      });

      map.on('mouseenter', 'heatmap-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'heatmap-fill', () => { map.getCanvas().style.cursor = ''; });
      return;
    }

    // ── Marker mode ───────────────────────────────────────────────────────
    posts.forEach((post) => {
      const lat = Number(post.latitude);
      const lng = Number(post.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const el = createPinElement(getCategoryColor(post.category));

      const image = post.imageUrl
        ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}"
             style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin:8px 0;"/>`
        : '';

      const popupHtml = `
        <div style="width:250px;font-family:Inter,Arial,sans-serif;">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;
            background:#dcfce7;color:#166534;font-size:10px;font-weight:900;text-transform:uppercase;">
            ${escapeHtml(post.category)}
          </span>
          ${image}
          <h4 style="font-size:13px;line-height:1.35;margin:8px 0 4px;color:#0f172a;font-weight:900;">
            ${escapeHtml(post.title)}
          </h4>
          <p style="font-size:11px;line-height:1.45;margin:0 0 8px;color:#475569;">
            ${escapeHtml((post.description || '').slice(0, 140))}
          </p>
          <div style="display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;
            padding-top:8px;font-size:10px;color:#64748b;font-weight:700;">
            <span>👤 ${escapeHtml(post.authorName || 'Người dùng')}</span>
            <span>📍 ${escapeHtml(post.locationName || 'Việt Nam')}</span>
          </div>
          <a href="/stories?id=${encodeURIComponent(post.id)}"
             style="display:block;text-align:center;text-decoration:none;width:100%;
               margin-top:10px;padding:9px 0;border-radius:12px;
               background:#059669;color:white;font-size:12px;font-weight:900;">
            Xem Chi Tiết
          </a>
        </div>`;

      const popup = new maplibregl.Popup({
        maxWidth: '280px',
        closeButton: true,
        closeOnClick: false,
        className: 'kindness-popup',
        offset: [0, -44],
      }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [posts, heatmapMode, mapReady]);

  // ── 3. Pan to selectedCenter when parent updates it ──────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedCenter) return;
    const lat = Number(selectedCenter[0]);
    const lng = Number(selectedCenter[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current.flyTo({ center: [lng, lat], zoom: 14, duration: 900, essential: true });
  }, [selectedCenter, mapReady]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`relative ${className}`}>

      {/* Heatmap toggle button */}
      <div className="absolute top-4 right-4 z-[5] flex items-center gap-2">
        <button
          onClick={() => setHeatmapMode((prev) => !prev)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs shadow-xl
            backdrop-blur-md transition-all duration-300 ${
              heatmapMode
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white scale-105'
                : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-100 hover:scale-105'
            }`}
        >
          <Flame className={`w-4 h-4 ${heatmapMode ? 'animate-bounce text-yellow-200' : 'text-rose-500'}`} />
          <span>{heatmapMode ? '🔥 Đang Xem Mật Độ' : '📊 Xem Heatmap Việc Tốt'}</span>
        </button>
      </div>

      {/* Attribution badge */}
      <div className="absolute bottom-4 left-4 z-[5] bg-white/95 text-slate-700 text-[10px]
        font-black px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center
        gap-1.5 border border-slate-100">
        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
        <span>MapLibre GL · OpenStreetMap</span>
      </div>

      {/* Map container — MapLibre mounts here */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
