import React, { useEffect, useRef, useState } from 'react';
import { Flame, MapPin, AlertTriangle } from 'lucide-react';
import { getHereMapsApiKey, loadHereMaps } from '../utils/hereMapsLoader';

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

const heatmapHotspots = [
  { name: 'Khu vực Hồ Tây, Hà Nội', lat: 21.0583, lng: 105.8159, radius: 8000, count: 28 },
  { name: 'Cầu Giấy & Đống Đa, Hà Nội', lat: 21.0382, lng: 105.7826, radius: 10000, count: 45 },
  { name: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009, radius: 12000, count: 62 },
  { name: 'Tân Bình, TP. Hồ Chí Minh', lat: 10.7925, lng: 106.6541, radius: 9000, count: 31 },
  { name: 'Trung tâm Đà Nẵng', lat: 16.0544, lng: 108.2022, radius: 11000, count: 39 },
  { name: 'Đại học Cần Thơ', lat: 10.0333, lng: 105.7833, radius: 7000, count: 22 },
];

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const createPinIcon = (H, color) => new H.map.Icon(`
  <svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.35"/>
    </filter>
    <path filter="url(#shadow)" d="M19 46C19 46 35 29.8 35 17.8C35 8.5 27.8 1 19 1C10.2 1 3 8.5 3 17.8C3 29.8 19 46 19 46Z" fill="${color}" stroke="white" stroke-width="4"/>
    <circle cx="19" cy="18" r="7" fill="white" fill-opacity="0.96"/>
  </svg>
`, { size: { w: 38, h: 48 }, anchor: { x: 19, y: 48 } });

export const MapComponent = ({
  posts = [],
  selectedCenter = null,
  className = 'h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200',
}) => {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const platformRef = useRef(null);
  const uiRef = useRef(null);
  const behaviorRef = useRef(null);
  const objectsGroupRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [mapError, setMapError] = useState('');

  const apiKey = getHereMapsApiKey();

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        const H = await loadHereMaps();
        if (cancelled || !mapDivRef.current || mapRef.current) return;

        platformRef.current = new H.service.Platform({ apikey: apiKey });
        const defaultLayers = platformRef.current.createDefaultLayers();

        mapRef.current = new H.Map(
          mapDivRef.current,
          defaultLayers.vector.normal.map,
          {
            center: { lat: 16.0544, lng: 108.2022 },
            zoom: 6,
            pixelRatio: window.devicePixelRatio || 1,
          }
        );

        behaviorRef.current = new H.mapevents.Behavior(new H.mapevents.MapEvents(mapRef.current));
        uiRef.current = H.ui.UI.createDefault(mapRef.current, defaultLayers, 'vi-VN');
        objectsGroupRef.current = new H.map.Group();
        mapRef.current.addObject(objectsGroupRef.current);

        resizeHandlerRef.current = () => mapRef.current?.getViewPort().resize();
        window.addEventListener('resize', resizeHandlerRef.current);
      } catch (error) {
        if (!cancelled) setMapError(error.message || 'Không tải được HERE Maps.');
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (resizeHandlerRef.current) window.removeEventListener('resize', resizeHandlerRef.current);
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapRef.current || !window.H || !objectsGroupRef.current) return;
    const H = window.H;
    const group = objectsGroupRef.current;
    group.removeAll();

    if (heatmapMode) {
      heatmapHotspots.forEach((spot) => {
        const strong = spot.count > 40;
        const circle = new H.map.Circle(
          { lat: spot.lat, lng: spot.lng },
          spot.radius,
          {
            style: {
              fillColor: strong ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.32)',
              strokeColor: strong ? 'rgba(225, 29, 72, 0.85)' : 'rgba(5, 150, 105, 0.85)',
              lineWidth: 2,
            },
            data: spot,
          }
        );
        circle.addEventListener('tap', () => {
          uiRef.current?.getBubbles().forEach((bubble) => uiRef.current.removeBubble(bubble));
          const bubble = new H.ui.InfoBubble({ lat: spot.lat, lng: spot.lng }, {
            content: `<div style="font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:800;color:#0f172a;">🔥 ${escapeHtml(spot.name)}<br/><span style="font-weight:600;color:#64748b;">Hơn ${spot.count} hành động việc tốt</span></div>`,
          });
          uiRef.current?.addBubble(bubble);
        });
        group.addObject(circle);
      });
      return;
    }

    posts.forEach((post) => {
      const lat = Number(post.latitude);
      const lng = Number(post.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = new H.map.Marker(
        { lat, lng },
        { icon: createPinIcon(H, getCategoryColor(post.category)), data: post }
      );

      marker.addEventListener('tap', () => {
        uiRef.current?.getBubbles().forEach((bubble) => uiRef.current.removeBubble(bubble));
        const image = post.imageUrl
          ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" style="width:100%;height:120px;object-fit:cover;border-radius:12px;margin:8px 0;"/>`
          : '';
        const content = `
          <div style="width:260px;font-family:Inter,Arial,sans-serif;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:10px;font-weight:900;text-transform:uppercase;">${escapeHtml(post.category)}</span>
            ${image}
            <h4 style="font-size:13px;line-height:1.35;margin:8px 0 4px;color:#0f172a;font-weight:900;">${escapeHtml(post.title)}</h4>
            <p style="font-size:11px;line-height:1.45;margin:0 0 8px;color:#475569;">${escapeHtml(post.description || '').slice(0, 140)}</p>
            <div style="display:flex;justify-content:space-between;gap:8px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:10px;color:#64748b;font-weight:700;">
              <span>👤 ${escapeHtml(post.authorName || 'Người dùng')}</span>
              <span>📍 ${escapeHtml(post.locationName || 'Việt Nam')}</span>
            </div>
            <a href="/stories?id=${encodeURIComponent(post.id)}" style="display:block;text-align:center;text-decoration:none;width:100%;margin-top:10px;padding:9px 0;border-radius:12px;background:#059669;color:white;font-size:12px;font-weight:900;">Xem Chi Tiết</a>
          </div>
        `;
        const bubble = new H.ui.InfoBubble({ lat, lng }, { content });
        uiRef.current?.addBubble(bubble);
      });

      group.addObject(marker);
    });
  }, [posts, heatmapMode]);

  useEffect(() => {
    if (!mapRef.current || !selectedCenter) return;
    const lat = Number(selectedCenter[0]);
    const lng = Number(selectedCenter[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current.setCenter({ lat, lng }, true);
    mapRef.current.setZoom(14, true);
  }, [selectedCenter]);

  if (!apiKey) {
    return (
      <div className={`relative bg-slate-100 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl border border-amber-200 shadow-xl p-6 flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <h3 className="font-black text-slate-900">Chưa cấu hình HERE Maps API Key</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vui lòng thêm biến môi trường <strong>VITE_HERE_MAPS_API_KEY</strong> trên Vercel/Local để hiển thị HERE Maps.
            </p>
          </div>
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
              : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-100 hover:scale-105'
          }`}
        >
          <Flame className={`w-4 h-4 ${heatmapMode ? 'animate-bounce text-yellow-200' : 'text-rose-500'}`} />
          <span>{heatmapMode ? '🔥 Đang Xem Mật Độ' : '📊 Xem Heatmap Việc Tốt'}</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[5] bg-white/95 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 border border-slate-100">
        <MapPin className="w-3.5 h-3.5 text-brand-green" />
        <span>HERE Maps Platform</span>
      </div>

      {mapError && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-slate-100 p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl border border-rose-200 shadow-xl p-6 flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
            <h3 className="font-black text-slate-900">Không tải được HERE Maps</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{mapError}</p>
          </div>
        </div>
      )}

      <div ref={mapDivRef} className="w-full h-full" />
    </div>
  );
};
