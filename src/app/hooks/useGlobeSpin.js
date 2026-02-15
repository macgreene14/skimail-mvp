"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * useGlobeSpin — manages auto-rotation of the globe at low zoom.
 * Spins eastward at 0.8°/frame, pauses on user interaction,
 * resumes after 5s idle (unless user explicitly stopped).
 */
export default function useGlobeSpin(mapRef) {
  const spinTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const [spinning, setSpinning] = useState(true);
  const [userStopped, setUserStopped] = useState(false);
  const spinningRef = useRef(spinning);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  // Start/stop spin interval
  useEffect(() => {
    if (!spinning || userStopped) return;
    spinTimerRef.current = setInterval(() => {
      const map = mapRef.current;
      if (!map) return;
      if (map.getZoom() < 3.5) {
        const center = map.getCenter();
        center.lng += 0.8;
        map.easeTo({ center, duration: 50, easing: (t) => t });
      }
    }, 50);
    return () => clearInterval(spinTimerRef.current);
  }, [spinning, userStopped, mapRef]);

  const stopSpin = useCallback(() => {
    setSpinning(false);
    setUserStopped(true);
    clearTimeout(idleTimerRef.current);
  }, []);

  const resumeSpinAfterIdle = useCallback(() => {
    if (userStopped) return;
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setSpinning(true);
    }, 5000);
  }, [userStopped]);

  return {
    spinning,
    setSpinning,
    spinningRef,
    userStopped,
    setUserStopped,
    stopSpin,
    resumeSpinAfterIdle,
  };
}
