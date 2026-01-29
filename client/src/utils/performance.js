/**
 * Performance monitoring utilities
 */

/**
 * Measure component render time
 */
export const measureRenderTime = (componentName) => {
  if (process.env.NODE_ENV === "development") {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      if (duration > 16) {
        // Warn if render takes longer than one frame (16ms at 60fps)
        console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {};
};

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Log performance metrics
 */
export const logPerformanceMetrics = () => {
  if (typeof window !== "undefined" && window.performance) {
    const navigation = performance.getEntriesByType("navigation")[0];
    if (navigation) {
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart,
      };

      console.log("[Performance Metrics]", metrics);
      return metrics;
    }
  }
  return null;
};

/**
 * Monitor API call performance
 */
export const monitorAPICall = async (apiCall, endpoint) => {
  const start = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    if (duration > 1000) {
      console.warn(`[API Performance] ${endpoint} took ${duration.toFixed(2)}ms`);
    }
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[API Performance] ${endpoint} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};
