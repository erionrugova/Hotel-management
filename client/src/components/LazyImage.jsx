import { useState, useEffect, memo } from "react";

const LazyImage = memo(({ src, alt, className, placeholder, ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let observer;
    let didCancel = false;

    if (imageRef && imageSrc !== src) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (
                !didCancel &&
                (entry.intersectionRatio > 0 || entry.isIntersecting)
              ) {
                setImageSrc(src);
                observer.unobserve(imageRef);
              }
            });
          },
          {
            threshold: 0.01,
            rootMargin: "75px",
          }
        );
        observer.observe(imageRef);
      } else {
        // Fallback for browsers without IntersectionObserver
        setImageSrc(src);
      }
    }

    return () => {
      didCancel = true;
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsLoaded(false);
    // Fallback to placeholder on error
    if (placeholder) {
      setImageSrc(placeholder);
    }
  };

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className || ""} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

LazyImage.displayName = "LazyImage";

export default LazyImage;
