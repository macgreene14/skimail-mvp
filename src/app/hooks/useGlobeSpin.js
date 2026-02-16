"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * useGlobeSpin — auto-rotates globe when in globe view.
 * Always spins at globe view; stops on user interaction;
 * resumes after 5s idle. No toggle button needed.
 */
export default function useGlobeSpin(mapRef, isGlobe) {
  const spinTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const [spinning, setSpinning] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const spinningRef = useRef(spinning);

  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  // When nav leaves globe, stop. When returning to globe, resume.
  useEffect(() => {
    if (isGlobe) {
      setUserPaused(false);
      setSpinning(true);
    } else {
      setSpinning(false);
      clearTimeout(idleTimerRef.current);
    }
  }, [isGlobe]);

  // Run spin interval
  useEffect(() => {
    if (!spinning || !isGlobe) return;
    spinTimerRef.current = setInterval(() => {
      const map = mapRef.current;
      if (!map) return;
      const center = map.getCenter();
      center.lng += 0.8;
      map.easeTo({ center, duration: 50, easing: (t) => t });
    }, 50);
    return () => clearInterval(spinTimerRef.current);
  }, [spinning, isGlobe, mapRef]);

  // Stop spin on user interaction (called from map onMouseDown/onTouchStart)
  const stopSpin = useCallback(() => {
    setSpinning(false);
    setUserPaused(true);
    clearTimeout(idleTimerRef.current);
    // Resume after 5s if still in globe view
    idleTimerRef.current = setTimeout(() => {
      setUserPaused(false);
      setSpinning(true);
    }, 5000);
  }, []);

  return {
    spinning,
    setSpinning,
    spinningRef,
    stopSpin,
  };
}
