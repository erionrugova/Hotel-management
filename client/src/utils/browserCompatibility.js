/**
 * Browser Compatibility Utilities
 * Checks for required browser features and provides polyfills
 */

export const checkBrowserCompatibility = () => {
  const features = {
    fetch: typeof fetch !== "undefined",
    localStorage: typeof Storage !== "undefined" && typeof localStorage !== "undefined",
    sessionStorage: typeof Storage !== "undefined" && typeof sessionStorage !== "undefined",
    intersectionObserver: typeof IntersectionObserver !== "undefined",
    promise: typeof Promise !== "undefined",
    asyncAwait: (() => {
      try {
        // eslint-disable-next-line no-eval
        eval("(async () => {})");
        return true;
      } catch {
        return false;
      }
    })(),
  };

  const missingFeatures = Object.entries(features)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);

  if (missingFeatures.length > 0) {
    console.warn("Missing browser features:", missingFeatures);
    return {
      compatible: false,
      missingFeatures,
      features,
    };
  }

  return {
    compatible: true,
    missingFeatures: [],
    features,
  };
};

/**
 * Polyfill for older browsers
 */
export const applyPolyfills = () => {
  // IntersectionObserver polyfill (if needed)
  // Note: Polyfill packages are optional and only needed for very old browsers
  // Modern browsers (Chrome 51+, Firefox 55+, Safari 12.1+) support IntersectionObserver natively
  if (typeof window !== "undefined" && !window.IntersectionObserver) {
    console.warn("IntersectionObserver not supported. Some features may not work in older browsers.");
    // Polyfill would be loaded here if package was installed:
    // import("intersection-observer").catch((err) => {
    //   console.warn("Failed to load IntersectionObserver polyfill:", err);
    // });
  }

  // Promise polyfill (if needed)
  // Modern browsers all support Promise natively
  if (typeof window !== "undefined" && !window.Promise) {
    console.warn("Promise not supported. This browser is too old for this application.");
    // Polyfill would be loaded here if package was installed:
    // import("es6-promise/auto").catch((err) => {
    //   console.warn("Failed to load Promise polyfill:", err);
    // });
  }
};

/**
 * Get browser information
 */
export const getBrowserInfo = () => {
  if (typeof window === "undefined") {
    return { name: "Unknown", version: "Unknown" };
  }

  const ua = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) {
    browserName = "Chrome";
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
    browserName = "Safari";
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.indexOf("Edg") > -1) {
    browserName = "Edge";
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : "Unknown";
  } else if (ua.indexOf("Brave") > -1) {
    browserName = "Brave";
    browserVersion = "Unknown";
  }

  return { name: browserName, version: browserVersion };
};

/**
 * Check if browser is supported
 */
export const isBrowserSupported = () => {
  const compatibility = checkBrowserCompatibility();
  const browserInfo = getBrowserInfo();

  // Minimum supported versions
  const minVersions = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90,
  };

  if (!compatibility.compatible) {
    return false;
  }

  const minVersion = minVersions[browserInfo.name];
  if (minVersion && parseInt(browserInfo.version) < minVersion) {
    return false;
  }

  return true;
};
