let googleMapsPromise = null;

export const getGoogleMapsApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const loadGoogleMaps = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps chỉ chạy trên trình duyệt.'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return Promise.reject(new Error('Thiếu VITE_GOOGLE_MAPS_API_KEY. Vui lòng cấu hình Google Maps API key trên Vercel.'));
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-maps="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', () => reject(new Error('Không tải được Google Maps JavaScript API.')));
      return;
    }

    const callbackName = `initGoogleMaps_${Date.now()}`;
    window[callbackName] = () => {
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=visualization&callback=${callbackName}&language=vi&region=VN`;
    script.onerror = () => {
      delete window[callbackName];
      googleMapsPromise = null;
      reject(new Error('Không tải được Google Maps JavaScript API. Kiểm tra API key, billing hoặc domain restriction.'));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};
