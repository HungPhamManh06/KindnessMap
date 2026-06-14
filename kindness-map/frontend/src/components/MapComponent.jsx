import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow, Circle, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, ExternalLink, Flame, Key, Check, ArrowRight, Sparkles, Layers } from 'lucide-react';

const libraries = ['places', 'visualization'];

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '24px'
};

const defaultCenter = { lat: 16.0544, lng: 108.2022 }; // Trung tâm Đà Nẵng / Việt Nam

// Chọn icon màu Google Maps chuẩn theo Danh mục Việc Tốt
const getMarkerIconUrl = (category) => {
  switch (category) {
    case 'Môi trường': return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'Trồng cây': return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'Hiến máu': return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    case 'Người cao tuổi': return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    case 'Giáo dục': return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    case 'Tình nguyện': return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
    default: return 'http://maps.google.com/mapfiles/ms/icons/lightblue-dot.png';
  }
};

export const MapComponent = ({ posts = [], selectedCenter = null, className = "h-[550px] w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200" }) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  // Load Key từ bộ nhớ trình duyệt hoặc biến môi trường
  const [storedApiKey, setStoredApiKey] = useState(() => {
    return localStorage.getItem('google_maps_api_key') || '';
  });

  // Tải Lõi Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: storedApiKey || 'DEMO_KEY', // Nguồn Key động
    libraries: libraries
  });

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    localStorage.setItem('google_maps_api_key', apiKeyInput.trim());
    setStoredApiKey(apiKeyInput.trim());
    setShowKeyPrompt(false);
    window.location.reload(); // Tải lại để Google áp dụng Key mới ngay lập tức
  };

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (selectedCenter && mapRef.current) {
      mapRef.current.panTo({ lat: parseFloat(selectedCenter[0]), lng: parseFloat(selectedCenter[1]) });
      mapRef.current.setZoom(15);
    }
  }, [selectedCenter]);

  // Các điểm nóng tập trung nhiều Việc Tốt (Google Circles Heatmap)
  const heatmapHotspots = [
    { name: 'Khu vực Hồ Tây, Hà Nội', lat: 21.0583, lng: 105.8159, radius: 1500, count: 28 },
    { name: 'Cầu Giấy & Đống Đa, Hà Nội', lat: 21.0382, lng: 105.7826, radius: 2000, count: 45 },
    { name: 'Quận 1, TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009, radius: 2500, count: 62 },
    { name: 'Tân Bình, TP. Hồ Chí Minh', lat: 10.7925, lng: 106.6541, radius: 1800, count: 31 },
    { name: 'Trung tâm Đà Nẵng', lat: 16.0544, lng: 108.2022, radius: 2200, count: 39 },
    { name: 'Đại học Cần Thơ', lat: 10.0333, lng: 105.7833, radius: 1600, count: 22 },
  ];

  return (
    <div className={`relative flex flex-col gap-2 ${className}`}>
      
      {/* Khung Thanh Cấu Hình Google API Key & Chế độ Heatmap */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowKeyPrompt(!showKeyPrompt)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-lg backdrop-blur-md transition-all"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span>{storedApiKey ? '✨ Đã Gắn Google Key' : '🔑 Cấu Hình Google Key'}</span>
        </button>

        <button
          onClick={() => setHeatmapMode(!heatmapMode)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-xs shadow-xl backdrop-blur-md transition-all duration-300 ${
            heatmapMode 
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-rose-500/25 scale-105' 
              : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-100 hover:scale-105'
          }`}
        >
          <Flame className={`w-4 h-4 ${heatmapMode ? 'animate-bounce text-yellow-200' : 'text-rose-500'}`} />
          <span>{heatmapMode ? '🔥 Đang Xem Mật Độ Circles' : '📊 Xem Heatmap Việc Tốt'}</span>
        </button>
      </div>

      {/* Modal Popup Nhập API Key Trực Tiếp Siêu Đẳng Cấp */}
      {showKeyPrompt && (
        <div className="absolute inset-x-4 top-16 z-20 p-6 rounded-3xl bg-white shadow-2xl border border-slate-200 animate-fade-in max-w-lg mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-green" /> Cấu Hình Google Maps JavaScript API Key
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">Chính thức</span>
          </div>

          <form onSubmit={handleSaveKey} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nhập chuỗi Key của bạn (Bắt đầu bằng AIzaSy...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Bạn có thể lấy Google Key miễn phí trên trang quản trị <strong>Google Cloud Console</strong> để kích hoạt đầy đủ mọi chức năng bản đồ.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { localStorage.removeItem('google_maps_api_key'); setStoredApiKey(''); setShowKeyPrompt(false); window.location.reload(); }}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors"
              >
                Xóa Key
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-green text-white font-black text-xs shadow-md"
              >
                Lưu & Kích Hoạt Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Thông Báo Khởi Tạo Khung Bản Đồ */}
      {!storedApiKey && (
        <div className="absolute bottom-4 left-4 z-10 p-3.5 rounded-2xl bg-amber-500/90 text-white font-bold text-xs shadow-lg backdrop-blur-md max-w-xs flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-200 shrink-0 animate-spin" />
          <span>Đang chạy ở Chế độ Google Demo. Bạn có thể bấm "Cấu Hình Google Key" ở góc trên để gắn Key thật của bạn!</span>
        </div>
      )}

      {/* LÕI GOOGLE MAPS INTERACTIVE */}
      {loadError ? (
        <div className="h-full w-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold text-xs p-8 text-center rounded-3xl">
          ⚠️ Không thể tải Bản Đồ Google Maps. Vui lòng kiểm tra lại cấu hình Key hoặc kết nối mạng của bạn!
        </div>
      ) : !isLoaded ? (
        <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-500 font-bold text-xs rounded-3xl">
          🗺️ Đang khởi tạo bộ khung Google Maps JavaScript API...
        </div>
      ) : (
        <div className="h-full w-full relative flex-1">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={selectedCenter ? { lat: parseFloat(selectedCenter[0]), lng: parseFloat(selectedCenter[1]) } : defaultCenter}
            zoom={selectedCenter ? 15 : 6}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              fullscreenControl: true,
              zoomControl: true,
              styles: [
                // Khung Bản Đồ Google phong cách Xanh mướt Hiện Đại (Modern Brand Theme override)
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#E0F2FE' }] },
                { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#F1F5F9' }] },
                { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DCFCE7' }] }
              ]
            }}
          >
            {/* Chế Độ Marker Bình Thường */}
            {!heatmapMode && posts.map((post) => {
              const lat = parseFloat(post.latitude);
              const lng = parseFloat(post.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <Marker
                  key={post.id}
                  position={{ lat, lng }}
                  icon={getMarkerIconUrl(post.category)}
                  onClick={() => setSelectedPost(post)}
                />
              );
            })}

            {/* Google Popups (InfoWindow Detail Cards) */}
            {selectedPost && !heatmapMode && (
              <InfoWindow
                position={{ lat: parseFloat(selectedPost.latitude), lng: parseFloat(selectedPost.longitude) }}
                onCloseClick={() => setSelectedPost(null)}
              >
                <div className="flex flex-col gap-2 max-w-xs w-64 p-1">
                  <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-lightGreen text-brand-deepGreen border border-brand-green/20">
                    {selectedPost.category}
                  </span>
                  <img
                    src={selectedPost.imageUrl || 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80'}
                    alt={selectedPost.title}
                    className="w-full h-32 object-cover rounded-2xl shadow-xs"
                  />
                  <h4 className="font-black text-xs text-slate-900 leading-snug line-clamp-2 mt-1">
                    {selectedPost.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {selectedPost.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                    <span>👤 {selectedPost.authorName || 'Người dùng'}</span>
                    <span>📍 {selectedPost.locationName || 'Việt Nam'}</span>
                  </div>

                  <button
                    onClick={() => navigate(`/stories?id=${selectedPost.id}`)}
                    className="w-full mt-2 py-2 rounded-xl bg-brand-green text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-green/20 hover:opacity-95"
                  >
                    <span>Xem Chi Tiết & Thảo Luận</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </InfoWindow>
            )}

            {/* Chế Độ Xem Điểm Nóng (Google Heatmap Circles Overlay) */}
            {heatmapMode && heatmapHotspots.map((spot, idx) => (
              <Circle
                key={idx}
                center={{ lat: spot.lat, lng: spot.lng }}
                radius={spot.radius * 5}
                options={{
                  fillColor: spot.count > 40 ? '#F43F5E' : '#10B981',
                  fillOpacity: 0.45,
                  strokeColor: spot.count > 40 ? '#E11D48' : '#059669',
                  strokeWeight: 2
                }}
                onClick={() => {
                  alert(`🔥 Khu Vực Nóng: ${spot.name}\nĐã vinh danh hơn ${spot.count} hành động Việc Tốt trong bán kính!`);
                }}
              />
            ))}

          </GoogleMap>
        </div>
      )}

    </div>
  );
};
