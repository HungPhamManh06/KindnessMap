import React from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource, XYZ } from 'ol/source';
import { Style, Icon } from 'ol/style';
import { Translate } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import Collection from 'ol/Collection';
import { MapPin } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const createRasterSource = (maptilerKey, isDark) => {
  const styleId = isDark ? 'streets-v2-dark' : 'streets-v2';
  return new XYZ({
    url: `https://api.maptiler.com/maps/${styleId}/{z}/{x}/{y}.png?key=${maptilerKey}`,
    crossOrigin: 'anonymous',
    maxZoom: 20,
    transition: 0,
  });
};

export const SubmitLocationPicker = ({ position, setPosition }) => {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerFeatureRef = React.useRef(null);
  const tileLayerRef = React.useRef(null);
  const resizeObserverRef = React.useRef(null);
  const [pickerError, setPickerError] = React.useState(null);
  const [ready, setReady] = React.useState(false);
  const [maptilerKey, setMaptilerKey] = React.useState('');
  const { isDark } = useTheme();

  React.useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setPickerError(null);
        setReady(false);

        const res = await api.get('/config/map');
        const nextKey = res.data.maptilerApiKey || '';

        if (!nextKey) {
          if (!cancelled) setPickerError('Cấu hình MapTiler chưa được thiết lập trên máy chủ.');
          return;
        }

        if (cancelled) return;
        setMaptilerKey(nextKey);

        const [lat, lng] = [Number(position[0]), Number(position[1])];
        const tileLayer = new TileLayer({
          source: createRasterSource(nextKey, isDark),
          preload: 1,
          zIndex: 0,
        });

        if (!containerRef.current) return;

        const map = new Map({
          target: containerRef.current,
          layers: [tileLayer],
          view: new View({
            center: fromLonLat([lng, lat]),
            zoom: 14,
          }),
        });

        tileLayerRef.current = tileLayer;

        const svg = `<svg width="32" height="42" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
          <filter id="lp-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.4"/>
          </filter>
          <path filter="url(#lp-shadow)"
            d="M19 46C19 46 35 29.8 35 17.8C35 8.5 27.8 1 19 1C10.2 1 3 8.5 3 17.8C3 29.8 19 46 19 46Z"
            fill="#059669" stroke="white" stroke-width="4"/>
          <circle cx="19" cy="18" r="7" fill="white" fill-opacity="0.96"/>
        </svg>`;
        const iconUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

        const markerFeature = new Feature({ geometry: new Point(fromLonLat([lng, lat])) });
        markerFeature.setStyle(
          new Style({
            image: new Icon({ src: iconUrl, anchor: [0.5, 1], scale: 1 }),
          })
        );
        markerFeatureRef.current = markerFeature;

        const vectorSource = new VectorSource({ features: [markerFeature] });
        const vectorLayer = new VectorLayer({ source: vectorSource, zIndex: 10 });
        map.addLayer(vectorLayer);

        const translate = new Translate({ features: new Collection([markerFeature]) });
        map.addInteraction(translate);

        translate.on('translateend', () => {
          const coords = toLonLat(markerFeature.getGeometry().getCoordinates());
          setPosition([Number(coords[1].toFixed(6)), Number(coords[0].toFixed(6))]);
        });

        map.on('singleclick', (event) => {
          markerFeature.getGeometry().setCoordinates(event.coordinate);
          const coords = toLonLat(event.coordinate);
          setPosition([Number(coords[1].toFixed(6)), Number(coords[0].toFixed(6))]);
        });

        const syncMapSize = () => {
          requestAnimationFrame(() => {
            map.updateSize();
          });
        };

        resizeObserverRef.current = new ResizeObserver(syncMapSize);
        resizeObserverRef.current.observe(containerRef.current);
        syncMapSize();

        mapRef.current = map;
        setReady(true);
      } catch (error) {
        console.error('OpenLayers location picker error:', error);
        if (!cancelled) setPickerError('Không thể kết nối máy chủ để tải bản đồ.');
      }
    };

    init();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (mapRef.current) {
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
      markerFeatureRef.current = null;
      tileLayerRef.current = null;
      setReady(false);
    };
  }, []);

  React.useEffect(() => {
    if (!maptilerKey || !tileLayerRef.current) return;
    tileLayerRef.current.setSource(createRasterSource(maptilerKey, isDark));
  }, [maptilerKey, isDark]);

  React.useEffect(() => {
    if (!markerFeatureRef.current || !mapRef.current) return;
    const lat = Number(position[0]);
    const lng = Number(position[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const coords = fromLonLat([lng, lat]);
    markerFeatureRef.current.getGeometry().setCoordinates(coords);
    mapRef.current.getView().animate({ center: coords, zoom: 14, duration: 400 });
  }, [position]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {pickerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-rose-200 z-10">
          <div className="text-center px-6 py-4 flex flex-col items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-400" />
            <p className="text-xs font-bold text-rose-700">{pickerError}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Vui lòng liên hệ quản trị viên.</p>
          </div>
        </div>
      )}

      {!pickerError && !ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse z-10">
          <div className="text-center px-6 py-4">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Đang tải location picker...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitLocationPicker;
