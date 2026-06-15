let hereMapsPromise = null;

const HERE_SCRIPT_URLS = [
  'https://js.api.here.com/v3/3.1/mapsjs-core.js',
  'https://js.api.here.com/v3/3.1/mapsjs-service.js',
  'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
  'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js',
];

const HERE_CSS_URL = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';

export const getHereMapsApiKey = () => import.meta.env.VITE_HERE_MAPS_API_KEY || '';

const loadCssOnce = () => {
  if (document.querySelector('link[data-here-maps-css="true"]')) return;
  const link = document.createElement('link');
  link.dataset.hereMapsCss = 'true';
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = HERE_CSS_URL;
  document.head.appendChild(link);
};

const loadScript = (src) => new Promise((resolve, reject) => {
  const existed = document.querySelector(`script[src="${src}"]`);
  if (existed) {
    if (existed.dataset.loaded === 'true') return resolve();
    existed.addEventListener('load', resolve, { once: true });
    existed.addEventListener('error', () => reject(new Error(`Không tải được HERE Maps script: ${src}`)), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.defer = true;
  script.onload = () => {
    script.dataset.loaded = 'true';
    resolve();
  };
  script.onerror = () => reject(new Error(`Không tải được HERE Maps script: ${src}`));
  document.head.appendChild(script);
});

export const loadHereMaps = async () => {
  if (typeof window === 'undefined') {
    throw new Error('HERE Maps chỉ chạy trên trình duyệt.');
  }

  if (window.H?.Map && window.H?.service?.Platform) {
    return window.H;
  }

  const apiKey = getHereMapsApiKey();
  if (!apiKey) {
    throw new Error('Thiếu VITE_HERE_MAPS_API_KEY. Vui lòng cấu hình HERE Maps API key trên Vercel.');
  }

  if (hereMapsPromise) return hereMapsPromise;

  hereMapsPromise = (async () => {
    loadCssOnce();
    for (const src of HERE_SCRIPT_URLS) {
      await loadScript(src);
    }
    if (!window.H?.Map || !window.H?.service?.Platform) {
      throw new Error('HERE Maps SDK chưa sẵn sàng. Vui lòng thử tải lại trang.');
    }
    return window.H;
  })().catch((error) => {
    hereMapsPromise = null;
    throw error;
  });

  return hereMapsPromise;
};
