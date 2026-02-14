import { useEffect, useRef } from 'react';
import useMapStore from '../store/useMapStore';

/**
 * useAutoSelect — auto-select/deselect resorts based on zoom + viewport.
 *
 * - Auto-select: zoom ≥ 13 AND exactly 1 resort in viewport → select it
 * - Auto-deselect: zoom < 10 AND a resort is selected → deselect
 */
export default function useAutoSelect() {
  const currentZoom = useMapStore((s) => s.currentZoom);
  const renderedResorts = useMapStore((s) => s.renderedResorts);
  const selectedResort = useMapStore((s) => s.selectedResort);
  const setSelectedResort = useMapStore((s) => s.setSelectedResort);
  const setIsResortView = useMapStore((s) => s.setIsResortView);

  // Debounce ref to avoid rapid toggling
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Auto-deselect: zoom dropped below 10
      if (currentZoom < 10 && selectedResort) {
        setSelectedResort(null);
        setIsResortView(false);
        return;
      }

      // Auto-select: zoom ≥ 13 and exactly 1 resort visible
      if (currentZoom >= 13 && renderedResorts.length === 1 && !selectedResort) {
        const slug = renderedResorts[0]?.properties?.slug;
        if (slug) {
          setSelectedResort(renderedResorts[0]);
        }
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [currentZoom, renderedResorts, selectedResort, setSelectedResort, setIsResortView]);
}
