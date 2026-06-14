import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Flame, ExternalLink, MapPin, Flag } from 'lucide-react';

// Fix Leaflet default icon paths (vite/webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Icon màu theo danh mục
const getCategoryColor = (category) => {
  switch (category) {
    case 'Môi trường': return '#16a34a';
    case 'Trồng cây':  return '#15803d';
    case 'Hiến máu':   return '#dc2626';
    case 'Người cao tuổi': return '#ca8a04';
    case 'Giáo dục':   return '#2563eb';
    case 'Tình nguyện': return '#7c3aed';
    default:           return '#0891b2';
  }
};

const createColoredIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.35);
    transform:rotate(-45deg);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

// Icon cờ đỏ cho Hoàng Sa / Trường Sa
const vietnamFlagIcon = L.divIcon({
  className: '',
  html: `<div style="
    display:flex;flex-direction:column;align-items:center;gap:2px;
  ">
    <div style="
      width:28px;height:18px;background:#DA251D;border-radius:3px;
      border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;
    ">⭐</div>
    <div style="width:2px;height:10px;background:#666;"></div>
  </div>`,
  iconSize: [28, 30],
  iconAnchor: [14, 30],
  popupAnchor: [0, -30],
});

// Component tự động pan tới selectedCenter
const FlyToCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo([parseFloat(center[0]), parseFloat(center[1])], 14, { duration: 1 });
    }
  }, [center, map]);
  return null;
};

// Các điểm nóng heatmap
const heatmapHotspots = [
  { name: 'Khu vực Hồ Tây, Hà Nội',        lat: 21.0583, lng: 105.8159, radius: 8000,  count: 28 },
  { name: 'Cầu Giấy & Đống Đa, Hà Nội',    lat: 21.0382, lng: 105.7826, radius: 10000, count: 45 },
  { name: 'Quận 1, TP. Hồ Chí Minh',        lat: 10.7769, lng: 106.7009, radius: 12000, count: 62 },
  { name: 'Tân Bình, TP. Hồ Chí Minh',      lat: 10.7925, lng: 106.6541, radius: 9000,  count: 31 },
  { name: 'Trung tâm Đà Nẵng',              lat: 16.0544, lng: 108.2022, radius: 11000, count: 39 },
  { name: 'Đại học Cần Thơ',                lat: 10.0333, lng: 105.7833, radius: 7000,  count: 22 },
];

// Quần đảo chủ quyền Việt Nam
const vietnamIslands = [
  { name: 'Quần đảo Hoàng Sa',  lat: 16.5,   lng: 111.9,  note: 'Hoàng Sa - Chủ quyền Việt Nam' },
  { name: 'Quần đảo Trường Sa', lat: 10.0,   lng: 114.5,  note: 'Trường Sa - Chủ quyền Việt Nam' },
];

export const MapComponent = ({
  posts = [],
  selectedCenter = null,
  className = 'h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200',
}) => {
  const navigate = useNavigate();
  const [heatmapMode, setHeatmapMode] = useState(false);

  return (
    <div className={`relative ${className}`}>

      {/* Nút điều khiển */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        <button
          onClick={() => setHeatmapMode(!heatmapMode)}
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

      {/* Badge chủ quyền */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-red-600/90 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5">
        <span>🇻🇳</span>
        <span>Hoàng Sa & Trường Sa thuộc Việt Nam</span>
      </div>

      <MapContainer
        center={[16.0544, 108.2022]}
        zoom={6}
        minZoom={4}
        maxZoom={18}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        {/* 
          Tile: CartoDB Positron — sạch, nhãn tiếng Anh, không có chữ Trung Quốc,
          hiển thị tên quốc tế trung lập cho Hoàng Sa / Trường Sa.
        */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Tự động pan khi có selectedCenter */}
        {selectedCenter && <FlyToCenter center={selectedCenter} />}

        {/* Markers bài viết */}
        {!heatmapMode && posts.map((post) => {
          const lat = parseFloat(post.latitude);
          const lng = parseFloat(post.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          return (
            <Marker
              key={post.id}
              position={[lat, lng]}
              icon={createColoredIcon(getCategoryColor(post.category))}
            >
              <Popup maxWidth={280} className="kindness-popup">
                <div className="flex flex-col gap-2 w-64 p-1">
                  <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {post.category}
                  </span>
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  )}
                  <h4 className="font-black text-xs text-slate-900 leading-snug line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                    <span>👤 {post.authorName || 'Người dùng'}</span>
                    <span>📍 {post.locationName || 'Việt Nam'}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/stories?id=${post.id}`)}
                    className="w-full mt-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
                  >
                    <span>Xem Chi Tiết</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Heatmap Circles */}
        {heatmapMode && heatmapHotspots.map((spot, idx) => (
          <Circle
            key={idx}
            center={[spot.lat, spot.lng]}
            radius={spot.radius}
            pathOptions={{
              fillColor: spot.count > 40 ? '#F43F5E' : '#10B981',
              fillOpacity: 0.4,
              color: spot.count > 40 ? '#E11D48' : '#059669',
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs font-bold text-slate-900">
                🔥 {spot.name}<br/>
                <span className="text-slate-500 font-medium">Hơn {spot.count} hành động Việc Tốt</span>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Markers Hoàng Sa & Trường Sa — Chủ quyền Việt Nam */}
        {vietnamIslands.map((island, idx) => (
          <Marker
            key={`island-${idx}`}
            position={[island.lat, island.lng]}
            icon={vietnamFlagIcon}
          >
            <Popup>
              <div className="text-xs font-black text-red-700 flex flex-col gap-1">
                <span>🇻🇳 {island.name}</span>
                <span className="font-medium text-slate-600">{island.note}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
