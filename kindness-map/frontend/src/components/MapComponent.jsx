import React, { useEffect, useRef, useState } from 'react';
import { Flame, MapPin } from 'lucide-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { Translate } from 'ol/interaction';
import { apply } from 'ol-mapbox-style';
import { fromLonLat } from 'ol/proj';
import api from '../services/api';


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

const metersToLngDeg = (meters, lat) => meters / (111320 * Math.cos((lat * Math.PI) / 180));
const metersToLatDeg = (meters) => meters / 110540;

const buildCirclePolygon = (lat, lng, radiusMeters, steps = 64) => {
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    coords.push(fromLonLat([
      lng + metersToLngDeg(radiusMeters, lat) * Math.cos(angle),
      lat + metersToLatDeg(radiusMeters)      * Math.sin(angle),
    ]));
  }
  return new Polygon([coords]);
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
  const popupElementRef = useRef(null);
  
  const mapRef        = useRef(null);
  const popupOverlayRef = useRef(null);
  const markersLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const overlaysRef = useRef([]); // To keep track of marker overlays
  
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [mapReady,    setMapReady]    = useState(false);
  const [mapError,    setMapError]    = useState(null);

  // ── 1. Init Map ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        let MAPTILER_KEY = '';
        try {
          const res = await api.get('/config/map');
          MAPTILER_KEY = res.data.maptilerApiKey || '';
          // Log debug info if available (temporary)
          if (res.data._debug) {
            console.info('[MapTiler Debug]', res.data._debug);
          }
        } catch (err) {
          console.error('Failed to load map API key from backend', err);
          if (!cancelled) setMapError('Không thể kết nối đến máy chủ để tải cấu hình bản đồ.');
          return;
        }

        if (!MAPTILER_KEY || MAPTILER_KEY.length === 0) {
          console.error('MapTiler API Key is empty. Check MAPTILER_API_KEY on Render.com backend.');
          if (!cancelled) setMapError('Không thể tải cấu hình MapTiler từ máy chủ. Bản đồ không khả dụng.');
          return;
        }

        if (cancelled) return;
        
        const map = new Map({
          target: containerRef.current,
          view: new View({
            center: fromLonLat([108, 16]),
            zoom: 5,
          }),
        });

        const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
        const response = await fetch(STYLE_URL);
        const styleJson = await response.json();
        
        // Force Vietnamese language on MapTiler vector tiles and filter foreign labels
        const BANNED_NAMES = [
          'Kalayaan', 'Zhubi', 'Fiery Cross', 'Mischief Reef', 'Meiji Jiao', 'Yongshu Jiao', 'Zhubi Jiao',
          'Sansha', 'Woody Island', 'Yongxing Dao', 'Paracel Islands', 'Spratly Islands',
          'South China Sea', 'Macclesfield Bank', 'Scarborough Shoal', 'Zhongjian Dao', 'Triton Island',
          'Đảo Phú Lâm', 'Thành phố Tam Sa', 'Hoang Sa', 'Truong Sa', 'Pattle Island', 'Duncan Island',
          'Quần đảo Hoàng Sa', 'Quần đảo Trường Sa', 'Itu Aba', 'Taiping Dao', 'Tai Ping Dao',
          'Thitu Island', 'Pag-asa', 'West York Island', 'Likas Island', 'Northeast Cay', 'Parola',
          'Southwest Cay', 'Pugad', 'Loaita Island', 'Kota', 'Nanshan Island', 'Lawak',
          'Sand Cay', 'Bailan', 'Namyit Island', 'Binago', 'Sin Cowe Island', 'Rurok',
          'Swallow Reef', 'Layang-Layang', 'Amboyna Cay', 'Kalantiyaw', 'Flat Island', 'Patag',
          'Lankiam Cay', 'Panata', 'Cuarteron Reef', 'Calderon', 'Kagitingan', 'Gaven Reefs', 'Burgos',
          'Hughes Reef', 'Chigua', 'Johnson South Reef', 'Mabini', 'Panganiban', 'Subi Reef', 'Zamora',
          'Second Thomas Shoal', 'Ayungin', 'Reed Bank', 'Recto', 'Half Moon Shoal', 'Hasa-Hasa',
          'Sabina Shoal', 'Escoda', 'Nansha Qundao', 'Xisha Qundao', 'Zhongsha Qundao', 'Dongsha Qundao',
          'Shi Dao', 'Qilian Yu', 'Huayang Jiao', 'Nanxun Jiao', 'Chigua Jiao', 'Dongmen Jiao',
          'Zhen\'ao Jiao', 'Macclesfield', 'Nansha', 'Xisha', 'Zhongsha', 'Dongsha', 'Triton',
          'Vanguard Bank', 'Rifleman Bank', 'Prince of Wales Bank', 'Grainger Bank', 'Alexandra Bank',
          'Southwest Bank', 'Prince Consort Bank', 'Owen Shoal', 'Bombay Castle', 'Orleana Shoal',
          'Kingston Shoal', 'Coronation Bank', 'Eldad Reef', 'Petley Reef', 'Erica Reef', 'Mariveles Reef',
          'Dallas Reef', 'Ardasier Reef', 'Commodore Reef', 'Barque Canada Reef', 'Investigator Shoal',
          'Louisa Reef', 'Royal Charlotte Reef', 'Discovery Great Reef', 'Nanhai', 'South Sea'
        ];

        if (styleJson.layers) {
          styleJson.layers.forEach(layer => {
            if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
              layer.layout['text-field'] = ['coalesce', ['get', 'name:vi'], ['get', 'name:en'], ['get', 'name']];
              
              // Add a filter to hide banned names
              const banFilter = ['!', ['in', ['get', 'name:en'], ['literal', BANNED_NAMES]]];
              const banFilterVi = ['!', ['in', ['get', 'name:vi'], ['literal', BANNED_NAMES]]];
              const banFilterName = ['!', ['in', ['get', 'name'], ['literal', BANNED_NAMES]]];
              
              if (!layer.filter) {
                layer.filter = ['all', banFilter, banFilterVi, banFilterName];
              } else if (layer.filter[0] === 'all') {
                layer.filter.push(banFilter, banFilterVi, banFilterName);
              } else {
                layer.filter = ['all', layer.filter, banFilter, banFilterVi, banFilterName];
              }
            }
          });
        }
        await apply(map, styleJson);

        if (cancelled) return;

        // Shared popup overlay
        popupOverlayRef.current = new Overlay({
          element: popupElementRef.current,
          positioning: 'bottom-center',
          stopEvent: false,
          offset: [0, -44],
        });
        map.addOverlay(popupOverlayRef.current);

        // --- Territorial GeoJSON Overlays ---
        const territorySource = new VectorSource();
        const territoryLayer = new VectorLayer({
          source: territorySource,
          zIndex: 1000,
          style: (feature, resolution) => {
            const zoom = map.getView().getZoomForResolution(resolution);
            const type = feature.get('type');
            const text = feature.get('name');
            
            if (type === 'territory') {
              // Ẩn nhãn khi zoom quá nhỏ để tránh đè lên các nhãn quốc gia/châu lục khác
              if (zoom < 4.2) return null;
              
              // Scale size dynamically and naturally with zoom level
              const size = Math.min(16, Math.max(9, zoom * 1.2 + 5));
              return new Style({
                text: new Text({
                  text: text,
                  font: `bold ${size}px Inter, Arial, sans-serif`,
                  fill: new Fill({ color: '#b91c1c' }), // Màu đỏ trầm hơn một chút
                  stroke: new Stroke({ color: '#ffffff', width: 3 }),
                  offsetY: 0,
                })
              });
            } else {
              // Chỉ hiển thị các đảo chi tiết khi zoom đủ lớn (VD: >= 6.5)
              if (zoom < 6.5) return null;
              
              const radius = Math.min(4, Math.max(2.5, zoom - 5.5));
              const fontSize = Math.min(12, Math.max(9, zoom * 1.1));
              
              return new Style({
                image: new CircleStyle({
                  radius: radius,
                  fill: new Fill({ color: '#b91c1c' }),
                  stroke: new Stroke({ color: '#ffffff', width: 1.5 })
                }),
                text: new Text({
                  text: text,
                  font: `600 ${fontSize}px Inter, Arial, sans-serif`,
                  fill: new Fill({ color: '#1e293b' }),
                  stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
                  offsetY: -(radius + 7),
                })
              });
            }
          }
        });
        map.addLayer(territoryLayer);

        const addTerritory = async (url) => {
          try {
            const res = await fetch(url);
            const data = await res.json();
            const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
            territorySource.addFeatures(features);
          } catch (e) {
            console.error('Failed to load territory', e);
          }
        };

        addTerritory('/geojson/hoang_sa.geojson');
        addTerritory('/geojson/truong_sa.geojson');

        mapRef.current = map;
        setMapReady(true);
      } catch (err) {
        console.error('Map init error:', err);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
    };
  }, []); // run once

  // ── 2. Render markers OR heatmap ──────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Clean up existing custom overlays (markers)
    overlaysRef.current.forEach(overlay => map.removeOverlay(overlay));
    overlaysRef.current = [];
    
    // Clean up vector layers
    if (markersLayerRef.current) map.removeLayer(markersLayerRef.current);
    if (heatmapLayerRef.current) map.removeLayer(heatmapLayerRef.current);

    popupOverlayRef.current.setPosition(undefined); // hide popup

    // ── Heatmap mode ──────────────────────────────────────────────────────
    if (heatmapMode) {
      const features = HEATMAP_HOTSPOTS.map((spot) => {
        const polygon = buildCirclePolygon(spot.lat, spot.lng, spot.radius);
        const feature = new Feature({ geometry: polygon });
        feature.setProperties({ name: spot.name, count: spot.count, strong: spot.count > 40 });
        return feature;
      });

      const source = new VectorSource({ features });
      
      heatmapLayerRef.current = new VectorLayer({
        source,
        style: (feature) => {
          const strong = feature.get('strong');
          return new Style({
            fill: new Fill({ color: strong ? 'rgba(244,63,94,0.35)' : 'rgba(16,185,129,0.32)' }),
            stroke: new Stroke({ color: strong ? 'rgba(225,29,72,0.85)' : 'rgba(5,150,105,0.85)', width: 2 })
          });
        }
      });
      map.addLayer(heatmapLayerRef.current);

      // Map click for heatmap popups
      const clickHandler = (e) => {
        const feature = map.forEachFeatureAtPixel(e.pixel, (feat, layer) => {
          if (layer === heatmapLayerRef.current) return feat;
        });
        
        if (feature) {
          const { name, count } = feature.getProperties();
          popupElementRef.current.innerHTML = `
            <div style="font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:800;color:#0f172a;background:white;padding:12px;border-radius:12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1);">
               🔥 ${escapeHtml(name)}<br/>
               <span style="font-weight:600;color:#64748b;">Hơn ${count} hành động việc tốt</span>
            </div>`;
          popupOverlayRef.current.setPosition(e.coordinate);
        } else {
          popupOverlayRef.current.setPosition(undefined);
        }
      };
      
      const pointerHandler = (e) => {
        const hit = map.hasFeatureAtPixel(e.pixel, { layerFilter: (l) => l === heatmapLayerRef.current });
        map.getTargetElement().style.cursor = hit ? 'pointer' : '';
      };

      map.on('singleclick', clickHandler);
      map.on('pointermove', pointerHandler);

      return () => {
        map.un('singleclick', clickHandler);
        map.un('pointermove', pointerHandler);
      };
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
        <div style="width:250px;font-family:Inter,Arial,sans-serif;background:white;padding:12px;border-radius:16px;box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);">
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

      const coords = fromLonLat([lng, lat]);
      
      const overlay = new Overlay({
        element: el,
        position: coords,
        positioning: 'bottom-center',
        stopEvent: false
      });
      map.addOverlay(overlay);
      overlaysRef.current.push(overlay);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        popupElementRef.current.innerHTML = popupHtml;
        popupOverlayRef.current.setPosition(coords);
      });
    });

    // Close popup on map click
    const closePopup = () => popupOverlayRef.current.setPosition(undefined);
    map.on('singleclick', closePopup);
    return () => map.un('singleclick', closePopup);

  }, [posts, heatmapMode, mapReady]);

  // ── 3. Pan to selectedCenter when parent updates it ──────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedCenter) return;
    const lat = Number(selectedCenter[0]);
    const lng = Number(selectedCenter[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: 14,
      duration: 900
    });
  }, [selectedCenter, mapReady]);

  // ── Render ───────────────────────────────────────────────────────────────

  // Show visible error banner instead of blank map
  if (mapError) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-slate-50 border border-rose-200`}>
        <div className="flex flex-col items-center gap-3 text-center px-8 py-10">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-slate-800 font-black text-base">Không Thể Tải Bản Đồ</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs">{mapError}</p>
          <p className="text-slate-400 text-[10px]">
            Lỗi cấu hình máy chủ — Vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    );
  }

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
        <span>OpenLayers · MapTiler</span>
      </div>

      {/* Map container */}
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Hidden element for Popup */}
      <div ref={popupElementRef} className="absolute z-50"></div>
    </div>
  );
};
