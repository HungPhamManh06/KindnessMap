import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ExternalLink, MapPin, AlertTriangle } from 'lucide-react';
import { getGoogleMapsApiKey, loadGoogleMaps } from '../utils/googleMapsLoader';

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
  { name: 'Khu vực Hồ Tây, Hà Nội', lat: 21.0583, lng: 105.8159, weight: 28 },
  { name: 'Cầu Giấy & Đống Đa, Hà Nội', lat: 21.0382, lng: 105.7826, weight: 45 },
  { name: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009, weight: 62 },
  { name: 'Tân Bình, TP. Hồ Chí Minh', lat: 10.7925, lng: 106.6541, weight: 31 },
  { name: 'Trung tâm Đà Nẵng', lat: 16.0544, lng: 108.2022, weight: 39 },
  { name: 'Đại học Cần Thơ', lat: 10.0333, lng: 105.7833, weight: 22 },
];

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const MapComponent = ({
  posts = [],
  selectedCenter = null,
  className = 'h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200',
}) => {
  const navigate = useNavigate();
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [mapError, setMapError] = useState('');

  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !mapDivRef.current || mapRef.current) return;

        mapRef.current = new maps.Map(mapDivRef.current, {
          center: { lat: 16.0544, lng: 108.2022 },
          zoom: 6,
          minZoom: 4,
          maxZoom: 18,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          gestureHandling: 'greedy',
          clickableIcons: true,
          mapTypeId: maps.MapTypeId.ROADMAP,
        });

        infoWindowRef.current = new maps.InfoWindow();
      } catch (error) {
        if (!cancelled) setMapError(error.message || 'Không tải được Google Maps.');
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    if (!selectedCenter) return;

    const lat = Number(selectedCenter[0]);
    const lng = Number(selectedCenter[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14);
  }, [selectedCenter]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    const maps = window.google.maps;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (heatmapMode) return;

    posts.forEach((post) => {
      const lat = Number(post.latitude);
      const lng = Number(post.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = new maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: post.title,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: getCategoryColor(post.category),
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 10,
        },
      });

      marker.addListener('click', () => {
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
            <button id="kindness-map-story-${post.id}" style="width:100%;margin-top:10px;padding:9px;border:0;border-radius:12px;background:#059669;color:white;font-size:12px;font-weight:900;cursor:pointer;">Xem Chi Tiết</button>
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, marker);

        maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
          const btn = document.getElementById(`kindness-map-story-${post.id}`);
          if (btn) btn.onclick = () => navigate(`/stories?id=${post.id}`);
        });
      });

      markersRef.current.push(marker);
    });
  }, [posts, heatmapMode, navigate]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps?.visualization) return;
    const maps = window.google.maps;

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (!heatmapMode) return;

    const heatmapData = heatmapHotspots.map((spot) => ({
      location: new maps.LatLng(spot.lat, spot.lng),
      weight: spot.weight,
    }));

    heatmapRef.current = new maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapRef.current,
      radius: 55,
      opacity: 0.65,
      dissipating: true,
      gradient: [
        'rgba(16, 185, 129, 0)',
        'rgba(16, 185, 129, 0.55)',
        'rgba(245, 158, 11, 0.70)',
        'rgba(244, 63, 94, 0.85)',
      ],
    });
  }, [heatmapMode]);

  if (!apiKey) {
    return (
      <div className={`relative bg-slate-100 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl border border-amber-200 shadow-xl p-6 flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
            <h3 className="font-black text-slate-900">Chưa cấu hình Google Maps API Key</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vui lòng thêm biến môi trường <strong>VITE_GOOGLE_MAPS_API_KEY</strong> trên Vercel/Local để hiển thị Google Maps.
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
        <span>Google Maps Platform</span>
      </div>

      {mapError && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-slate-100 p-6 text-center">
          <div className="max-w-md bg-white rounded-3xl border border-rose-200 shadow-xl p-6 flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
            <h3 className="font-black text-slate-900">Không tải được Google Maps</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{mapError}</p>
          </div>
        </div>
      )}

      <div ref={mapDivRef} className="w-full h-full" />
    </div>
  );
};
