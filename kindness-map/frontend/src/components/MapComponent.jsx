import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, MapPin } from 'lucide-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource, XYZ } from 'ol/source';
import { Style, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const getCategoryColor = (category) => {
  switch (category) {
    case 'Môi trường':
    case 'Environment':
      return '#16a34a';
    case 'Trồng cây':
    case 'Tree Planting':
      return '#15803d';
    case 'Hiến máu':
    case 'Blood Donation':
      return '#dc2626';
    case 'Người cao tuổi':
    case 'Elderly Care':
      return '#ca8a04';
    case 'Giáo dục':
    case 'Education':
      return '#2563eb';
    case 'Tình nguyện':
    case 'Volunteer':
      return '#7c3aed';
    default:
      return '#0891b2';
  }
};

const HEATMAP_HOTSPOTS = [
  { name: 'Khu vực Hồ Tây, Hà Nội', lat: 21.0583, lng: 105.8159, radius: 8000, count: 28 },
  { name: 'Cầu Giấy & Đống Đa, Hà Nội', lat: 21.0382, lng: 105.7826, radius: 10000, count: 45 },
  { name: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009, radius: 12000, count: 62 },
  { name: 'Tân Bình, TP. Hồ Chí Minh', lat: 10.7925, lng: 106.6541, radius: 9000, count: 31 },
  { name: 'Trung tâm Đà Nẵng', lat: 16.0544, lng: 108.2022, radius: 11000, count: 39 },
  { name: 'Đại học Cần Thơ', lat: 10.0333, lng: 105.7833, radius: 7000, count: 22 },
];

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
    coords.push(
      fromLonLat([
        lng + metersToLngDeg(radiusMeters, lat) * Math.cos(angle),
        lat + metersToLatDeg(radiusMeters) * Math.sin(angle),
      ])
    );
  }
  return new Polygon([coords]);
};

const createRasterSource = (maptilerKey, isDark) => {
  const styleId = isDark ? 'streets-v2-dark' : 'streets-v2';
  return new XYZ({
    url: `https://api.maptiler.com/maps/${styleId}/{z}/{x}/{y}.png?key=${maptilerKey}`,
    crossOrigin: 'anonymous',
    maxZoom: 20,
    transition: 0,
  });
};

const MapComponentBase = ({
  posts = [],
  selectedCenter = null,
  className = 'h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200',
}) => {
  const containerRef = useRef(null);
  const popupElementRef = useRef(null);
  const mapRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const territoryLayerRef = useRef(null);
  const overlaysRef = useRef([]);

  const [heatmapMode, setHeatmapMode] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [maptilerKey, setMaptilerKey] = useState('');
  const { isDark } = useTheme();

  const popupPalette = useMemo(
    () =>
      isDark
        ? {
            surface: '#0f172a',
            cardBorder: '#334155',
            title: '#f8fafc',
            text: '#cbd5e1',
            subtle: '#94a3b8',
            categoryBg: 'rgba(16,185,129,0.16)',
            categoryText: '#6ee7b7',
            buttonBg: '#10b981',
            buttonText: '#ffffff',
          }
        : {
            surface: '#ffffff',
            cardBorder: '#e2e8f0',
            title: '#0f172a',
            text: '#475569',
            subtle: '#64748b',
            categoryBg: '#dcfce7',
            categoryText: '#166534',
            buttonBg: '#059669',
            buttonText: '#ffffff',
          },
    [isDark]
  );

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        setMapError(null);
        const res = await api.get('/config/map');
        const nextKey = res.data.maptilerApiKey || '';

        if (!nextKey) {
          if (!cancelled) setMapError('Không thể tải cấu hình MapTiler từ máy chủ. Bản đồ không khả dụng.');
          return;
        }

        if (cancelled) return;
        setMaptilerKey(nextKey);

        const tileLayer = new TileLayer({
          source: createRasterSource(nextKey, isDark),
          preload: 1,
          zIndex: 0,
        });

        const map = new Map({
          target: containerRef.current,
          layers: [tileLayer],
          view: new View({
            center: fromLonLat([108, 16]),
            zoom: 5,
          }),
        });

        tileLayerRef.current = tileLayer;

        popupOverlayRef.current = new Overlay({
          element: popupElementRef.current,
          positioning: 'bottom-center',
          stopEvent: false,
          offset: [0, -44],
        });
        map.addOverlay(popupOverlayRef.current);

        const territorySource = new VectorSource();
        const territoryLayer = new VectorLayer({
          source: territorySource,
          zIndex: 1000,
          updateWhileAnimating: false,
          updateWhileInteracting: false,
          style: (feature, resolution) => {
            const zoom = map.getView().getZoomForResolution(resolution);
            const type = feature.get('type');
            const text = feature.get('name');

            if (type === 'territory') {
              if (zoom < 4.2) return null;
              const size = Math.min(16, Math.max(9, zoom * 1.2 + 5));
              return new Style({
                text: new Text({
                  text,
                  font: `bold ${size}px Inter, Arial, sans-serif`,
                  fill: new Fill({ color: '#b91c1c' }),
                  stroke: new Stroke({ color: '#ffffff', width: 3 }),
                }),
              });
            }

            if (zoom < 6.5) return null;
            const radius = Math.min(4, Math.max(2.5, zoom - 5.5));
            const fontSize = Math.min(12, Math.max(9, zoom * 1.1));

            return new Style({
              image: new CircleStyle({
                radius,
                fill: new Fill({ color: '#b91c1c' }),
                stroke: new Stroke({ color: '#ffffff', width: 1.5 }),
              }),
              text: new Text({
                text,
                font: `600 ${fontSize}px Inter, Arial, sans-serif`,
                fill: new Fill({ color: isDark ? '#f8fafc' : '#1e293b' }),
                stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
                offsetY: -(radius + 7),
              }),
            });
          },
        });

        territoryLayerRef.current = territoryLayer;
        map.addLayer(territoryLayer);

        const loadTerritory = async (url) => {
          try {
            const response = await fetch(url);
            const data = await response.json();
            const features = new GeoJSON().readFeatures(data, { featureProjection: 'EPSG:3857' });
            territorySource.addFeatures(features);
          } catch (error) {
            console.error('Failed to load territory', error);
          }
        };

        await Promise.all([
          loadTerritory('/geojson/hoang_sa.geojson'),
          loadTerritory('/geojson/truong_sa.geojson'),
        ]);

        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        console.error('Map init error:', error);
        if (!cancelled) setMapError('Không thể kết nối đến máy chủ để tải cấu hình bản đồ.');
      }
    };

    initMap();

    return () => {
      cancelled = true;
      overlaysRef.current = [];
      if (mapRef.current) {
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
      tileLayerRef.current = null;
      territoryLayerRef.current = null;
      popupOverlayRef.current = null;
      heatmapLayerRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!maptilerKey || !tileLayerRef.current) return;
    tileLayerRef.current.setSource(createRasterSource(maptilerKey, isDark));
    territoryLayerRef.current?.changed();
  }, [maptilerKey, isDark]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    overlaysRef.current.forEach((overlay) => map.removeOverlay(overlay));
    overlaysRef.current = [];

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    popupOverlayRef.current?.setPosition(undefined);

    if (heatmapMode) {
      const features = HEATMAP_HOTSPOTS.map((spot) => {
        const polygon = buildCirclePolygon(spot.lat, spot.lng, spot.radius);
        const feature = new Feature({ geometry: polygon });
        feature.setProperties({ name: spot.name, count: spot.count, strong: spot.count > 40 });
        return feature;
      });

      heatmapLayerRef.current = new VectorLayer({
        source: new VectorSource({ features }),
        style: (feature) => {
          const strong = feature.get('strong');
          return new Style({
            fill: new Fill({ color: strong ? 'rgba(244,63,94,0.35)' : 'rgba(16,185,129,0.32)' }),
            stroke: new Stroke({ color: strong ? 'rgba(225,29,72,0.85)' : 'rgba(5,150,105,0.85)', width: 2 }),
          });
        },
      });
      map.addLayer(heatmapLayerRef.current);

      const clickHandler = (event) => {
        const feature = map.forEachFeatureAtPixel(event.pixel, (item, layer) => {
          if (layer === heatmapLayerRef.current) return item;
          return null;
        });

        if (feature) {
          const { name, count } = feature.getProperties();
          popupElementRef.current.innerHTML = `
            <div style="font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:800;color:${popupPalette.title};background:${popupPalette.surface};padding:12px;border-radius:12px;box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.18);border:1px solid ${popupPalette.cardBorder};">
               🔥 ${escapeHtml(name)}<br/>
               <span style="font-weight:600;color:${popupPalette.subtle};">Hơn ${count} hành động việc tốt</span>
            </div>`;
          popupOverlayRef.current?.setPosition(event.coordinate);
        } else {
          popupOverlayRef.current?.setPosition(undefined);
        }
      };

      const pointerHandler = (event) => {
        const hit = map.hasFeatureAtPixel(event.pixel, {
          layerFilter: (layer) => layer === heatmapLayerRef.current,
        });
        map.getTargetElement().style.cursor = hit ? 'pointer' : '';
      };

      map.on('singleclick', clickHandler);
      map.on('pointermove', pointerHandler);

      return () => {
        map.un('singleclick', clickHandler);
        map.un('pointermove', pointerHandler);
      };
    }

    posts.forEach((post) => {
      const lat = Number(post.latitude);
      const lng = Number(post.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const el = createPinElement(getCategoryColor(post.category));
      const image = post.imageUrl
        ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin:8px 0;"/>`
        : '';

      const popupHtml = `
        <div style="width:250px;font-family:Inter,Arial,sans-serif;background:${popupPalette.surface};padding:12px;border-radius:16px;box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.18), 0 8px 10px -6px rgb(0 0 0 / 0.18);border:1px solid ${popupPalette.cardBorder};">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${popupPalette.categoryBg};color:${popupPalette.categoryText};font-size:10px;font-weight:900;text-transform:uppercase;">
            ${escapeHtml(post.category)}
          </span>
          ${image}
          <h4 style="font-size:13px;line-height:1.35;margin:8px 0 4px;color:${popupPalette.title};font-weight:900;">
            ${escapeHtml(post.title)}
          </h4>
          <p style="font-size:11px;line-height:1.45;margin:0 0 8px;color:${popupPalette.text};">
            ${escapeHtml((post.description || '').slice(0, 140))}
          </p>
          <div style="display:flex;justify-content:space-between;border-top:1px solid ${popupPalette.cardBorder};padding-top:8px;font-size:10px;color:${popupPalette.subtle};font-weight:700;">
            <span>👤 ${escapeHtml(post.authorName || 'Người dùng')}</span>
            <span>📍 ${escapeHtml(post.locationName || 'Việt Nam')}</span>
          </div>
          <a href="/stories?id=${encodeURIComponent(post.id)}" style="display:block;text-align:center;text-decoration:none;width:100%;margin-top:10px;padding:9px 0;border-radius:12px;background:${popupPalette.buttonBg};color:${popupPalette.buttonText};font-size:12px;font-weight:900;">
            Xem Chi Tiết
          </a>
        </div>`;

      const coords = fromLonLat([lng, lat]);
      const overlay = new Overlay({ element: el, position: coords, positioning: 'bottom-center', stopEvent: false });
      map.addOverlay(overlay);
      overlaysRef.current.push(overlay);

      el.addEventListener('click', (event) => {
        event.stopPropagation();
        popupElementRef.current.innerHTML = popupHtml;
        popupOverlayRef.current?.setPosition(coords);
      });
    });

    const closePopup = () => popupOverlayRef.current?.setPosition(undefined);
    map.on('singleclick', closePopup);

    return () => {
      map.un('singleclick', closePopup);
    };
  }, [posts, heatmapMode, mapReady, popupPalette]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedCenter) return;
    const lat = Number(selectedCenter[0]);
    const lng = Number(selectedCenter[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: 14,
      duration: 700,
    });
  }, [selectedCenter, mapReady]);

  if (mapError) {
    return (
      <div className={`relative ${className} flex items-center justify-center bg-slate-50 border border-rose-200`}>
        <div className="flex flex-col items-center gap-3 text-center px-8 py-10">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-rose-500" />
          </div>
          <h3 className="text-slate-800 font-black text-base">Không Thể Tải Bản Đồ</h3>
          <p className="text-slate-500 text-xs leading-relaxed max-w-xs">{mapError}</p>
          <p className="text-slate-400 text-[10px]">Lỗi cấu hình máy chủ — Vui lòng liên hệ quản trị viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-4 right-4 z-[5] flex items-center gap-2">
        <button
          onClick={() => setHeatmapMode((prev) => !prev)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs shadow-xl backdrop-blur-md transition-all duration-300 ${
            heatmapMode
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white scale-105'
              : isDark
                ? 'bg-slate-900/95 text-slate-100 hover:bg-slate-800 border border-slate-700 hover:scale-105'
                : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-100 hover:scale-105'
          }`}
        >
          <Flame className={`w-4 h-4 ${heatmapMode ? 'animate-bounce text-yellow-200' : 'text-rose-500'}`} />
          <span>{heatmapMode ? '🔥 Đang Xem Mật Độ' : '📊 Xem Heatmap Việc Tốt'}</span>
        </button>
      </div>

      <div
        className={`absolute bottom-4 left-4 z-[5] text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 border ${
          isDark ? 'bg-slate-900/95 text-slate-200 border-slate-700' : 'bg-white/95 text-slate-700 border-slate-100'
        }`}
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
        <span>OpenLayers · MapTiler</span>
      </div>

      <div ref={containerRef} className="w-full h-full" />
      <div ref={popupElementRef} className="absolute z-50" />
    </div>
  );
};

export const MapComponent = memo(MapComponentBase);
