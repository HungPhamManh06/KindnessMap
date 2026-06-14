import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { MapPin, Heart, Leaf, Droplet, Users, ExternalLink, Flame, Sparkles } from 'lucide-react';

// Custom Map Marker Icons by Category
const createCategoryIcon = (category) => {
  let color = '#10B981'; // default emerald
  let emoji = '💚';

  switch (category) {
    case 'Môi trường':
    case 'Environment':
      color = '#059669'; emoji = '🍃'; break;
    case 'Trồng cây':
    case 'Tree Planting':
      color = '#10B981'; emoji = '🌳'; break;
    case 'Hiến máu':
    case 'Blood Donation':
      color = '#EF4444'; emoji = '🩸'; break;
    case 'Người cao tuổi':
    case 'Elderly Care':
      color = '#F59E0B'; emoji = '👵'; break;
    case 'Giáo dục':
    case 'Education':
      color = '#3B82F6'; emoji = '📚'; break;
    default:
      color = '#14B8A6'; emoji = '✨'; break;
  }

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="36" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.25" />
        </filter>
      </defs>
      <path filter="url(#shadow)" d="M20 2C10.059 2 2 10.059 2 20c0 13.5 18 26 18 26s18-12.5 18-26C38 10.059 29.941 2 20 2z" fill="${color}" />
      <circle cx="20" cy="20" r="13" fill="#ffffff" />
      <text x="20" y="25" font-size="14" text-anchor="middle" font-family="sans-serif">${emoji}</text>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svgIcon,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -40],
  });
};

// Component to recenter map programmatically
const RecenterMap = ({ center }) => {
  const map = useMap();
  if (center) {
    map.flyTo(center, map.getZoom(), { animate: true, duration: 1.2 });
  }
  return null;
};

export const MapComponent = ({ posts = [], selectedCenter = null, className = "h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200" }) => {
  const navigate = useNavigate();
  const [heatmapMode, setHeatmapMode] = useState(false);

  // Focus center (Default: Vietnam / Hanoi / Da Nang midpoint)
  const defaultCenter = [16.0544, 108.2022];

  // Map cluster heatmap data (Simulating areas with many good deeds)
  const heatmapHotspots = [
    { name: 'Khu vực Hồ Tây, Hà Nội', lat: 21.0583, lng: 105.8159, radius: 1500, intensity: 'bg-emerald-500/40', count: 28 },
    { name: 'Cầu Giấy & Đống Đa, Hà Nội', lat: 21.0382, lng: 105.7826, radius: 2000, intensity: 'bg-emerald-500/50', count: 45 },
    { name: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009, radius: 2500, intensity: 'bg-rose-500/45', count: 62 },
    { name: 'Tân Bình, TP. Hồ Chí Minh', lat: 10.7925, lng: 106.6541, radius: 1800, intensity: 'bg-amber-500/40', count: 31 },
    { name: 'Trung tâm Đà Nẵng', lat: 16.0544, lng: 108.2022, radius: 2200, intensity: 'bg-blue-500/40', count: 39 },
    { name: 'Đại học Cần Thơ', lat: 10.0333, lng: 105.7833, radius: 1600, intensity: 'bg-teal-500/40', count: 22 },
  ];

  return (
    <div className="relative group">
      
      {/* Top Floating Heatmap / Layer Mode Toggle Switch */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
        <button
          onClick={() => setHeatmapMode(!heatmapMode)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-xl backdrop-blur-md transition-all duration-300 ${
            heatmapMode 
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/25 scale-105' 
              : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-100 hover:scale-105'
          }`}
        >
          <Flame className={`w-4 h-4 ${heatmapMode ? 'animate-bounce text-yellow-200' : 'text-rose-500'}`} />
          <span>{heatmapMode ? '🔥 Đang Bật Heatmap Mật Độ' : '📊 Xem Heatmap Việc Tốt'}</span>
        </button>
      </div>

      <MapContainer
        center={selectedCenter || defaultCenter}
        zoom={selectedCenter ? 14 : 6}
        className={className}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> KindnessMap VN'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectedCenter && <RecenterMap center={selectedCenter} />}

        {/* Normal Interactive Markers */}
        {!heatmapMode &&
          posts.map((post) => {
            const lat = parseFloat(post.latitude);
            const lng = parseFloat(post.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker
                key={post.id}
                position={[lat, lng]}
                icon={createCategoryIcon(post.category)}
              >
                <Popup className="custom-popup-wrapper">
                  <div className="flex flex-col gap-2 max-w-xs w-64 p-1">
                    <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-lightGreen text-brand-deepGreen border border-brand-green/20">
                      {post.category}
                    </span>
                    <img
                      src={post.imageUrl || 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=400&q=80'}
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-2xl shadow-xs"
                    />
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 mt-1">
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
                      className="w-full mt-2 py-2 rounded-xl bg-brand-green text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-green/20 hover:opacity-95 transition-opacity"
                    >
                      <span>Xem Chi Tiết & Chia Sẻ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Heatmap Overlay Circles */}
        {heatmapMode &&
          heatmapHotspots.map((spot, idx) => (
            <React.Fragment key={idx}>
              <Circle
                center={[spot.lat, spot.lng]}
                radius={spot.radius * 6}
                pathOptions={{
                  color: spot.count > 40 ? '#F43F5E' : '#10B981',
                  fillColor: spot.count > 40 ? '#FB7185' : '#34D399',
                  fillOpacity: 0.45,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-2 text-center">
                    <span className="text-xl">🔥</span>
                    <h4 className="font-extrabold text-xs text-slate-900 mt-1">{spot.name}</h4>
                    <p className="text-[11px] font-bold text-brand-deepGreen mt-0.5">
                      Đã ghi nhận hơn {spot.count} việc tốt trong khu vực!
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-1">Cộng đồng truyền cảm hứng mạnh mẽ</span>
                  </div>
                </Popup>
              </Circle>
            </React.Fragment>
          ))}
      </MapContainer>
    </div>
  );
};
