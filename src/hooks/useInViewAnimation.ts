import { useEffect, useRef, useState } from "react";

export function useInViewAnimation() {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  return { ref, isInView };
}
