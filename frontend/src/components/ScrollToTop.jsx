import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ensures every route change starts the page scrolled to the top,
// instead of keeping the previous page's scroll offset (which caused
// a blank gap at the top of pages like Leaderboard).
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [pathname]);

  return null;
};
