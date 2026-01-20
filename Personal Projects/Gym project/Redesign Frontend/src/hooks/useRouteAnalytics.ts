import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Optional hook for route change tracking
 * Can be used for performance monitoring or analytics
 * 
 * Usage: Add to AppLayout or Router component
 */
export function useRouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Track route change
    const routePath = location.pathname;
    
    // Example: Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: routePath,
      });
    }

    // Example: Performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('Route navigation timing:', {
          route: routePath,
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
        });
      }
    }

    // Cleanup on unmount
    return () => {
      // Any cleanup logic here
    };
  }, [location.pathname]);
}

