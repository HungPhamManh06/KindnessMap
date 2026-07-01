import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, MapPin } from 'lucide-react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { defaults as defaultInteractions } from 'ol/interaction/defaults';
import Overlay from 'ol/Overlay';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import { Vector as VectorLayer, Heatmap as HeatmapLayer } from 'ol/layer';
import { Vector as VectorSource, XYZ, Cluster } from 'ol/source';
import { Style, Text, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import CircleGeom from 'ol/geom/Circle';

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
  enableWheelZoom = false,
}) => {
  const [responseTeams, setResponseTeams] = useState([]);
  const containerRef = useRef(null);
  const popupElementRef = useRef(null);
  const mapRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const territoryLayerRef = useRef(null);
  const clusterLayerRef = useRef(null);
  const overlaysRef = useRef([]);
  const userLocationOverlayRef = useRef(null);
  const [emergencyTeams,setEmergencyTeams] = useState([]);

  const [heatmapMode, setHeatmapMode] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [maptilerKey, setMaptilerKey] = useState('');
  const [userLocation, setUserLocation] =
  useState(null);
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
          // Tắt zoom bằng con lăn mặc định để khu vực bản đồ không "nuốt" thao tác cuộn trang.
          // Trang Explore có thể bật lại bằng prop enableWheelZoom nếu cần tương tác bản đồ đầy đủ.
          interactions: defaultInteractions({ mouseWheelZoom: enableWheelZoom }),
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
  if (!mapRef.current || !userLocation) return;

  const marker = new Feature({
    geometry: new Point(
      fromLonLat([userLocation.lng, userLocation.lat])
    ),
  });

  marker.setStyle(
    new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#2563eb' }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2,
        }),
      }),
    })
  );

  const source = new VectorSource({
    features: [marker],
  });

  const layer = new VectorLayer({
    source,
    zIndex: 9999,
  });

  mapRef.current.addLayer(layer);

  return () => {
  if (mapRef.current) {
    mapRef.current.removeLayer(layer);
  }
};
},[userLocation]);
const emergencyLayerRef = useRef(null);
useEffect(() => {

  if (!mapRef.current || !userLocation) return;

  if (!emergencyMode) {

    if (emergencyLayerRef.current) {
      mapRef.current.removeLayer(
        emergencyLayerRef.current
      );
      emergencyLayerRef.current = null;
    }

    return;
  }

  const emergencyFeature = new Feature({
    geometry: new CircleGeom(
      fromLonLat([
        userLocation.lng,
        userLocation.lat
      ]),
      5000
    ),
  });

  emergencyFeature.setStyle(
    new Style({
      fill: new Fill({
        color: 'rgba(255,0,0,0.2)',
      }),
      stroke: new Stroke({
        color: '#ff0000',
        width: 3,
      }),
    })
  );

  const source = new VectorSource({
    features: [emergencyFeature],
  });

  const layer = new VectorLayer({
    source,
    zIndex: 9000,
  });

  mapRef.current.addLayer(layer);

  emergencyLayerRef.current = layer;

  return () => {
    if (mapRef.current && layer) {
      mapRef.current.removeLayer(layer);
    }
  };

}, [emergencyMode, userLocation]);
  useEffect(() => {
  if (!mapRef.current || !userLocation) return;

  mapRef.current.getView().animate({
    center: fromLonLat([
      userLocation.lng,
      userLocation.lat,
    ]),
    zoom: 15,
    duration: 1000,
  });
}, [userLocation]);
  useEffect(() => {
  if (!emergencyMode) return;

  api.get('/matching/emergency')
    .then(res => {
      setEmergencyTeams(res.data);
    });
}, [emergencyMode]);
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

    if (clusterLayerRef.current) {
      map.removeLayer(clusterLayerRef.current);
      clusterLayerRef.current = null;
    }

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    popupOverlayRef.current?.setPosition(undefined);

    // Heatmap mode now overlays a real density layer built from the actual
    // posts being shown, instead of replacing the markers with static demo
    // hotspots. The green location pins/clusters stay visible underneath so
    // toggling Heatmap "adds" information rather than hiding the data.
    if (heatmapMode) {
      const heatFeatures = [];

      posts.forEach((post) => {
        const lat = Number(post.latitude);
        const lng = Number(post.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        heatFeatures.push(new Feature({ geometry: new Point(fromLonLat([lng, lat])) }));
      });

      // Fall back to the illustrative hotspots only if there is no real
      // location data to visualize, so the heatmap is never blank.
      if (heatFeatures.length === 0) {
        HEATMAP_HOTSPOTS.forEach((spot) => {
          heatFeatures.push(
            new Feature({ geometry: new Point(fromLonLat([spot.lng, spot.lat])) })
          );
        });
      }

      heatmapLayerRef.current = new HeatmapLayer({
        source: new VectorSource({ features: heatFeatures }),
        blur: 24,
        radius: 18,
        opacity: 0.75,
        zIndex: 5000,
        gradient: ['#22c55e', '#facc15', '#f97316', '#ef4444'],
      });
      map.addLayer(heatmapLayerRef.current);
    }

    const pointFeatures = [];

    posts.forEach((post) => {
      const lat = Number(post.latitude);
      const lng = Number(post.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const feature = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
      feature.setProperties({ post });
      pointFeatures.push(feature);
    });

    const vectorSource = new VectorSource({ features: pointFeatures });
    const clusterSource = new Cluster({ distance: 42, minDistance: 14, source: vectorSource });
    const styleCache = {};

    clusterLayerRef.current = new VectorLayer({
      source: clusterSource,
      zIndex: 8000,
      updateWhileAnimating: false,
      updateWhileInteracting: false,
      style: (feature) => {
        const features = feature.get('features') || [];
        const size = features.length;
        const post = features[0]?.get('post') || {};
        const color = size > 1 ? '#10b981' : getCategoryColor(post.category);
        const key = `${size}-${color}`;
        if (!styleCache[key]) {
          styleCache[key] = new Style({
            image: new CircleStyle({
              radius: size > 1 ? Math.min(28, 15 + Math.log(size) * 5) : 12,
              fill: new Fill({ color }),
              stroke: new Stroke({ color: '#ffffff', width: 4 }),
            }),
            text: new Text({
              text: size > 1 ? String(size) : '•',
              font: '900 12px Inter, Arial, sans-serif',
              fill: new Fill({ color: '#ffffff' }),
              stroke: new Stroke({ color: 'rgba(15,23,42,0.35)', width: 2 }),
            }),
          });
        }
        return styleCache[key];
      },
    });

    map.addLayer(clusterLayerRef.current);

    const buildPostPopup = (post) => {
      const image = post.imageUrl
        ? `<img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" style="width:100%;height:128px;object-fit:cover;border-radius:18px;margin:10px 0;"/>`
        : '';

      return `
        <div class="km-map-popup-html" style="width:292px;font-family:Inter,Arial,sans-serif;background:${popupPalette.surface};padding:14px;border-radius:24px;box-shadow:0 28px 60px -24px rgb(0 0 0 / 0.45);border:1px solid ${popupPalette.cardBorder};backdrop-filter:blur(18px);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <span style="display:inline-block;padding:5px 11px;border-radius:999px;background:${popupPalette.categoryBg};color:${popupPalette.categoryText};font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;">
              ${escapeHtml(post.category)}
            </span>
            <span style="font-size:10px;color:${popupPalette.subtle};font-weight:800;">📍 ${escapeHtml(post.locationName || 'Việt Nam')}</span>
          </div>
          ${image}
          <h4 style="font-size:15px;line-height:1.35;margin:8px 0 6px;color:${popupPalette.title};font-weight:950;">
            ${escapeHtml(post.title)}
          </h4>
          <p style="font-size:12px;line-height:1.55;margin:0 0 10px;color:${popupPalette.text};">
            ${escapeHtml((post.description || '').slice(0, 150))}${(post.description || '').length > 150 ? '...' : ''}
          </p>
          <div style="display:flex;justify-content:space-between;border-top:1px solid ${popupPalette.cardBorder};padding-top:10px;font-size:11px;color:${popupPalette.subtle};font-weight:800;">
            <span>👤 ${escapeHtml(post.authorName || 'Người dùng')}</span>
            <span>💚 Việc tốt</span>
          </div>
          <a href="/stories?id=${encodeURIComponent(post.id)}" style="display:block;text-align:center;text-decoration:none;width:100%;margin-top:12px;padding:11px 0;border-radius:16px;background:linear-gradient(90deg,#34d399,#22d3ee);color:#020617;font-size:12px;font-weight:950;">
            Xem câu chuyện →
          </a>
        </div>`;
    };

    const clusterClickHandler = (event) => {
      const cluster = map.forEachFeatureAtPixel(event.pixel, (item, layer) => {
        if (layer === clusterLayerRef.current) return item;
        return null;
      });

      if (!cluster) return;
      const features = cluster.get('features') || [];
      const coordinate = cluster.getGeometry().getCoordinates();

      if (features.length > 1) {
        const extent = clusterSource.getSource().getExtent();
        const featureExtent = features.reduce((acc, f) => {
          const c = f.getGeometry().getCoordinates();
          return [Math.min(acc[0], c[0]), Math.min(acc[1], c[1]), Math.max(acc[2], c[0]), Math.max(acc[3], c[1])];
        }, [Infinity, Infinity, -Infinity, -Infinity]);
        map.getView().fit(featureExtent, { duration: 650, padding: [80, 80, 80, 80], maxZoom: 13 });
        popupElementRef.current.innerHTML = `
          <div style="font-family:Inter,Arial,sans-serif;background:${popupPalette.surface};color:${popupPalette.title};border:1px solid ${popupPalette.cardBorder};border-radius:20px;padding:14px 16px;box-shadow:0 24px 55px -26px rgba(0,0,0,.5);font-size:12px;font-weight:900;">
            ✨ ${features.length} việc tốt trong khu vực<br/>
            <span style="font-weight:700;color:${popupPalette.subtle};">Đang phóng to để xem chi tiết</span>
          </div>`;
        popupOverlayRef.current?.setPosition(coordinate);
        return;
      }

      const post = features[0]?.get('post');
      if (!post) return;
      popupElementRef.current.innerHTML = buildPostPopup(post);
      popupOverlayRef.current?.setPosition(coordinate);
    };

    const pointerHandler = (event) => {
      const hit = map.hasFeatureAtPixel(event.pixel, { layerFilter: (layer) => layer === clusterLayerRef.current });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    };

    map.on('singleclick', clusterClickHandler);
    map.on('pointermove', pointerHandler);

    const closePopup = () => popupOverlayRef.current?.setPosition(undefined);
    map.on('singleclick', closePopup);

    return () => {
      map.un('singleclick', clusterClickHandler);
      map.un('pointermove', pointerHandler);
      map.un('singleclick', closePopup);
    };
  }, [posts, heatmapMode, mapReady, popupPalette]);
  useEffect(() => {
  // Không theo dõi GPS ngay khi bản đồ vừa render vì watchPosition có thể tạo
  // nhiều callback và làm giật cuộn trên trang chủ. Chỉ bật khi người dùng thật sự
  // dùng chế độ khẩn cấp cần vị trí hiện tại.
  if (!emergencyMode) return undefined;

  if (!navigator.geolocation) {
    console.log("GPS không được hỗ trợ");
    return undefined;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      console.error("GPS Error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 10000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [emergencyMode]);

  useEffect(() => {
  if (!emergencyMode) return;

  const loadEmergencyTeams = async () => {
    try {
      const res = await api.get('/matching/emergency');

      setResponseTeams(
        res.data.map(team => ({
          type: team.name,
          members: team.members,
          eta: '5-15 phút'
        }))
      );

    } catch (err) {
      console.error('Emergency API Error:', err);
    }
  };

  loadEmergencyTeams();
}, [emergencyMode]);
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
    <div className={`relative ${className} flex items-center justify-center bg-slate-50`}>
      <p>{mapError}</p>
    </div>
  );
}
  return (
  <div className={`relative ${className}`}>

    <div className="absolute top-4 right-4 z-[5] flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 p-1.5 shadow-2xl backdrop-blur-xl">

      <button
        onClick={() => setHeatmapMode((prev) => !prev)}
        className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${heatmapMode ? 'bg-emerald-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}
      >
        Heatmap
      </button>

      <button
        onClick={() => setEmergencyMode(prev => !prev)}
        className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${emergencyMode ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'}`}
      >
        🚨 Khẩn cấp
      </button>

    </div>
    {emergencyMode && (
  <div className="absolute top-20 right-4 z-50 w-80 bg-red-900 text-white rounded-2xl p-4 shadow-2xl">

    <h3 className="font-bold text-lg mb-3">
      🚨 Emergency Response
    </h3>

    {responseTeams.length === 0 ? (
      <div>Đang tải dữ liệu AI...</div>
    ) : (
      responseTeams.map((team, index) => (
        <div
          key={index}
          className="mb-2 p-2 rounded bg-red-800"
        >
          <div className="font-bold">
            {team.name}
          </div>

          <div>
            {team.members} thành viên
          </div>
        </div>
      ))
    )}

  </div>
)}
    <div
      className={`absolute bottom-4 left-4 z-[5] text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 border ${
        isDark
          ? 'bg-slate-900/95 text-slate-200 border-slate-700'
          : 'bg-white/95 text-slate-700 border-slate-100'
      }`}
    >
      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
      <span>OpenLayers · MapTiler</span>
    </div>

    <div ref={containerRef} className="w-full h-full" />
    <div ref={popupElementRef} className="absolute z-50" />

  </div>
);
}
export const MapComponent = memo(MapComponentBase);