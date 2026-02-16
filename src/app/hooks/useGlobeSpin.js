"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * useGlobeSpin — rotates globe when toggled on.
 * Defaults to off. User toggles via button. No auto-resume.
 */
export default function useGlobeSpin(mapRef, isGlobe) {
  const spinTimerRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const spinningRef = useRef(spinning);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  // Stop spinning when leaving globe view
  useEffect(() => {
    if (!isGlobe) {
      setSpinning(false);
    }
  }, [isGlobe]);

  // Run spin interval
  useEffect(() => {
    if (!spinning || !isGlobe || !mapRef.current) return;
    spinTimerRef.current = setInterval(() => {
      const map = mapRef.current;
      if (!map) return;
      const center = map.getCenter();
      center.lng += 0.8;
      map.easeTo({ center, duration: 50, easing: (t) => t });
    }, 50);
    return () => clearInterval(spinTimerRef.current);
  }, [spinning, isGlobe, mapRef]);

  // Toggle spin on/off
  const toggleSpin = useCallback(() => {
    setSpinning((s) => !s);
  }, []);

  // Stop spin (for map interactions)
  const stopSpin = useCallback(() => {
    setSpinning(false);
  }, []);

  return {
    spinning,
    setSpinning,
    spinningRef,
    toggleSpin,
    stopSpin,
  };
}
