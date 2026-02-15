'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl, GeolocateControl, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useMapStore from '../store/useMapStore';
import { useBatchSnowData } from '../hooks/useResortWeather';
import MapControls from './MapControls';
// import useAutoSelect from '../hooks/useAutoSelect'; // disabled — fights user zoom-out
import useViewportResorts from '../hooks/useViewportResorts';
import regionsManifest from '../../../assets/regions.json';
import cameraAngles from '../../../public/data/camera-angles.json';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

// Per-resort piste data base URL
const PISTE_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/skimail-mvp/data/pistes`
  : '/skimail-mvp/data/pistes';

const MAP_STYLES = {
  skimail: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

// Region nav markers derived from manifest
const REGION_MARKERS = regionsManifest.map(r => ({
  id: r.id,
  label: `${r.emoji} ${r.label}`,
  lat: r.center[1],
  lng: r.center[0],
  zoom: r.zoom,
  bounds: r.bounds,
}));

export function MapExplore({ resortCollection }) {
  const resorts = resortCollection.features;
  const mapRef = useRef(null);
  const spinTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastFlewToRef = useRef(null);
  const clickedFromMapRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spinning, setSpinning] = useState(true);
  const [userStopped, setUserStopped] = useState(false);
  const currentZoom = useMapStore((s) => s.currentZoom);
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);

  // Viewport resort filtering hook — must be called before any conditional returns
  const { queryViewport, onMapReady } = useViewportResorts(mapRef);

  const {
    mapStyle, mapStyleKey,
    showIkon, showEpic, showMC, showIndy, showIndependent, showSnow,
    selectedResort, setSelectedResort,
    setRenderedResorts, setHighlightedSlug,
    showSnowCover, showPistes,
    previousViewState, setPreviousViewState,
    isResortView, setIsResortView,
    lastRegion, setLastRegion,
  } = useMapStore();

  const setSnowBySlug = useMapStore((s) => s.setSnowBySlug);
  const pendingBackToRegion = useMapStore((s) => s.pendingBackToRegion);
  const clearPendingBackToRegion = useMapStore((s) => s.clearPendingBackToRegion);

  // Auto-select/deselect based on zoom + viewport
  // useAutoSelect(); // disabled — fights user zoom-out

  const setPisteData = useMapStore((s) => s.setPisteData);
  const pisteData = useMapStore((s) => s.pisteData);

  // Per-resort piste data (lazy loaded)
  useEffect(() => {
    if (!selectedResort || !showPistes) { setPisteData(null); return; }
    const assets = selectedResort.properties?.assets;
    const slug = selectedResort.properties?.slug;
    if (!assets?.pistes || !slug) { setPisteData(null); return; }
    let cancelled = false;
    fetch(`${PISTE_BASE_URL}/${slug}.geojson`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!cancelled) setPisteData(data); })
      .catch(() => { if (!cancelled) setPisteData(null); });
    return () => { cancelled = true; };
  }, [selectedResort, showPistes, setPisteData]);

  // Track viewport-visible slugs for tiered snow fetching
  const [visibleSlugs, setVisibleSlugs] = useState(null);

  // Fetch snow data: pass resorts + viewport independents, with prefetch seed
  const { data: snowData } = useBatchSnowData(resorts, showSnow, visibleSlugs);

  // Populate snowBySlug in Zustand so any component can look up snow data.
  // Key on snowData length + first/last slug to avoid infinite re-render loop
  // (TanStack Query returns new array refs even when data is unchanged).
  const snowKey = snowData?.length
    ? `${snowData.length}-${snowData[0]?.slug}-${snowData[snowData.length - 1]?.slug}`
    : '';
  useEffect(() => {
    if (snowData?.length) {
      const map = {};
      snowData.forEach((d) => { map[d.slug] = d; });
      setSnowBySlug(map);
    }
  }, [snowKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active passes set — used to filter snow data
  const activePasses = useMemo(() => {
    const passes = new Set();
    if (showIkon) passes.add('Ikon');
    if (showEpic) passes.add('Epic');
    if (showMC) passes.add('Mountain Collective');
    if (showIndy) passes.add('Indy');
    if (showIndependent) passes.add('Independent');
    return passes;
  }, [showIkon, showEpic, showMC, showIndy, showIndependent]);

  // Build snow GeoJSON — filtered by active pass toggles
  const snowGeoJSON = useMemo(() => {
    if (!snowData?.length) return { type: 'FeatureCollection', features: [] };
    const withSnow = snowData.filter((d) => d.snowfall_7d > 0 && activePasses.has(d.pass));
    return {
      type: 'FeatureCollection',
      features: withSnow.map((d) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: d.coordinates },
        properties: {
          slug: d.slug,
          name: d.name,
          snowfall_7d: d.snowfall_7d,
          snowfall_24h: d.snowfall_24h,
          snow_depth: d.snow_depth,
          temperature: d.temperature,
        },
      })),
    };
  }, [snowData, activePasses]);

  // Compute average 7-day snowfall per region (for region marker indicators)
  const snowBySlug = useMapStore((s) => s.snowBySlug);
  const regionSnowAvg = useMemo(() => {
    const result = {};
    if (!Object.keys(snowBySlug).length) return result;
    // Assign each resort with snow data to nearest region
    const regionTotals = {};
    const regionTotals24h = {};
    const regionCounts = {};
    REGION_MARKERS.forEach((r) => { regionTotals[r.id] = 0; regionTotals24h[r.id] = 0; regionCounts[r.id] = 0; });
    resorts.forEach((resort) => {
      const slug = resort.properties?.slug;
      const snow = snowBySlug[slug];
      if (!snow || !snow.snowfall_7d) return;
      // Only count pass resorts (not independent)
      if (resort.properties.pass === 'Independent') return;
      const [lng, lat] = resort.geometry.coordinates;
      let closest = REGION_MARKERS[0];
      let minDist = Infinity;
      REGION_MARKERS.forEach((r) => {
        const d = Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2);
        if (d < minDist) { minDist = d; closest = r; }
      });
      regionTotals[closest.id] += snow.snowfall_7d;
      regionTotals24h[closest.id] += (snow.snowfall_24h || 0);
      regionCounts[closest.id] += 1;
    });
    REGION_MARKERS.forEach((r) => {
      result[r.id] = {
        avg7d: regionCounts[r.id] > 0 ? regionTotals[r.id] / regionCounts[r.id] : 0,
        avg24h: regionCounts[r.id] > 0 ? regionTotals24h[r.id] / regionCounts[r.id] : 0,
      };
    });
    return result;
  }, [snowBySlug, resorts]);

  // MODIS snow cover tile date (yesterday for availability)
  const modisDate = useMemo(() => {
    return new Date(Date.now() - 86400000).toISOString().split('T')[0];
  }, []);

  // Fly to resort in 3D
  const flyToResort = useCallback((resort) => {
    const map = mapRef.current;
    if (!map) return;
    // Save current view before flying — read directly from map instance to avoid viewState dependency
    const center = map.getCenter();
    setPreviousViewState({
      longitude: center.lng,
      latitude: center.lat,
      zoom: map.getZoom(),
      pitch: map.getPitch() || 0,
      bearing: map.getBearing() || 0,
    });
    setIsResortView(true);
    const slug = resort.properties?.slug;
    const cam = slug && cameraAngles[slug];
    map.flyTo({
      center: cam ? cam.center : resort.geometry.coordinates,
      zoom: cam ? cam.zoom : 14.5,
      pitch: cam ? cam.pitch : 72,
      bearing: cam ? cam.bearing : -30,
      duration: 2500,
      essential: true,
    });
  }, [setPreviousViewState, setIsResortView]);

  // Reset view back to globe (Spin Globe button)
  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [-98, 39],
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });
    setSelectedResort(null);
    setIsResortView(false);
    setLastRegion(null);
    lastFlewToRef.current = null;
  }, [setIsResortView, setSelectedResort, setLastRegion]);

  // Build pass filter expressions
  const passFilter = useMemo(() => {
    const passes = [];
    if (showIkon) passes.push('Ikon');
    if (showEpic) passes.push('Epic');
    if (showMC) passes.push('Mountain Collective');
    if (showIndy) passes.push('Indy');
    if (showIndependent) passes.push('Independent');
    return ['in', ['get', 'pass'], ['literal', passes]];
  }, [showIkon, showEpic, showMC, showIndy, showIndependent]);

  // Filtered GeoJSON so clusters reflect active pass toggles
  // Merge snow_7d from snowBySlug into properties for label display
  const snowBySlugRef = useRef({});
  useEffect(() => { snowBySlugRef.current = snowBySlug; }, [snowBySlug]);
  const snowStableKey = useMemo(() => Object.keys(snowBySlug).length, [snowBySlug]);

  const filteredGeoJSON = useMemo(() => {
    const passes = new Set();
    if (showIkon) passes.add('Ikon');
    if (showEpic) passes.add('Epic');
    if (showMC) passes.add('Mountain Collective');
    if (showIndy) passes.add('Indy');
    if (showIndependent) passes.add('Independent');
    const snow = snowBySlugRef.current;
    return {
      type: 'FeatureCollection',
      features: resorts
        .filter((r) => passes.has(r.properties.pass))
        .map((r) => {
          const s = snow[r.properties.slug];
          if (!s || !s.snowfall_7d) return r;
          return {
            ...r,
            properties: { ...r.properties, snow_7d: Math.round(s.snowfall_7d) },
          };
        }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resorts, showIkon, showEpic, showMC, showIndy, showIndependent, snowStableKey]);

  // Globe spin — imperative easeTo (works with uncontrolled mode)
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
  }, [spinning, userStopped]);

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

  // Spinning ref for use in callbacks without stale closures
  const spinningRef = useRef(spinning);
  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  // When spin stops, trigger a viewport query so results update
  useEffect(() => {
    if (!spinning && mapRef.current) {
      const timer = setTimeout(() => queryViewport(), 300);
      return () => clearTimeout(timer);
    }
  }, [spinning, queryViewport]);

  // onMoveEnd — just update visible slugs for snow fetching; viewport resorts handled by hook
  const onMoveEnd = useCallback(() => {
    if (spinningRef.current) return;
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    // Update visible slugs for tiered snow fetching
    const layers = [];
    if (map.getLayer('resort-dots')) layers.push('resort-dots');
    if (map.getLayer('resort-markers')) layers.push('resort-markers');
    if (layers.length === 0) return;
    const features = map.queryRenderedFeatures(undefined, { layers });
    const seen = new Set();
    const slugs = [];
    (features || []).forEach((f) => {
      const slug = f.properties?.slug;
      if (slug && !seen.has(slug)) { seen.add(slug); slugs.push(slug); }
    });
    setVisibleSlugs(slugs);
  }, []);

  // Uncontrolled mode — no onMove needed. Map manages its own viewState.
  // Read position from mapRef.current when needed (flyToResort, resetView, etc.)

  // Click on resort dot — no popup, just highlight card
  const onClick = useCallback(
    (e) => {
      stopSpin();
      const features = e.features;
      if (!features?.length) return;
      const f = features[0];

      // Clusters removed — shouldn't get cluster clicks anymore
      if (f.properties.cluster) return;

      const resort = resorts.find((r) => r.properties.slug === f.properties.slug);
      if (resort) {
        setHighlightedSlug(resort.properties.slug);
        // Mark as map click so the useEffect doesn't double-fly
        clickedFromMapRef.current = true;
        lastFlewToRef.current = resort.properties.slug;
        setSelectedResort(resort);
        flyToResort(resort);
      }
    },
    [resorts, setSelectedResort, setHighlightedSlug, stopSpin, flyToResort]
  );

  // Region marker click — fly to region
  const onRegionClick = useCallback((region) => {
    stopSpin();
    const map = mapRef.current;
    if (!map) return;
    setLastRegion({ lng: region.lng, lat: region.lat, zoom: region.zoom });
    const zoom = window.innerWidth <= 768 ? region.zoom - 0.5 : region.zoom;
    map.flyTo({ center: [region.lng, region.lat], zoom, pitch: 0, bearing: 0, duration: 1200, essential: true });
  }, [stopSpin, setLastRegion]);

  // Fly back to region view (from detail view)
  const flyToRegion = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    // Use lastRegion if available, otherwise find nearest region to current position
    let target = lastRegion;
    if (!target) {
      const center = map.getCenter();
      let closest = REGION_MARKERS[0];
      let minDist = Infinity;
      REGION_MARKERS.forEach((r) => {
        const d = Math.pow(r.lat - center.lat, 2) + Math.pow(r.lng - center.lng, 2);
        if (d < minDist) { minDist = d; closest = r; }
      });
      target = { lng: closest.lng, lat: closest.lat, zoom: closest.zoom };
    }
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: 7,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });
    setSelectedResort(null);
    setIsResortView(false);
    lastFlewToRef.current = null;
  }, [lastRegion, setSelectedResort, setIsResortView]);

  // Back-to-region triggered from cards/results panel
  useEffect(() => {
    if (pendingBackToRegion) {
      clearPendingBackToRegion();
      const map = mapRef.current;
      if (!map) return;
      let target = lastRegion;
      if (!target) {
        const center = map.getCenter();
        let closest = REGION_MARKERS[0];
        let minDist = Infinity;
        REGION_MARKERS.forEach((r) => {
          const d = Math.pow(r.lat - center.lat, 2) + Math.pow(r.lng - center.lng, 2);
          if (d < minDist) { minDist = d; closest = r; }
        });
        target = { lng: closest.lng, lat: closest.lat, zoom: closest.zoom };
      }
      map.flyTo({ center: [target.lng, target.lat], zoom: 7, pitch: 0, bearing: 0, duration: 1500, essential: true });
      lastFlewToRef.current = null;
    }
  }, [pendingBackToRegion, clearPendingBackToRegion, lastRegion]);

  // When selectedResort changes externally (e.g. from card click or auto-select)
  useEffect(() => {
    if (!selectedResort || !mapRef.current) return;
    // Skip if this was triggered by a map marker click (already flew)
    if (clickedFromMapRef.current) {
      clickedFromMapRef.current = false;
      return;
    }
    const slug = selectedResort.properties?.slug;
    // Always fly — removed slug dedup check that blocked re-selection from global view
    lastFlewToRef.current = slug;
    flyToResort(selectedResort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResort]); // intentionally minimal deps — flyToResort is stable via useCallback

  const onMapLoad = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    // getMap() returns the raw Mapbox GL map instance for addImage/setFog
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;

    // Create SDF marker images for each pass type
    const size = 32;
    const createMarkerImage = (drawFn) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      drawFn(ctx, size);
      return ctx.getImageData(0, 0, size, size);
    };

    // Circle (Ikon)
    map.addImage('marker-ikon', createMarkerImage((ctx, s) => {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }), { sdf: true });

    // Diamond (Epic)
    map.addImage('marker-epic', createMarkerImage((ctx, s) => {
      const cx = s / 2, cy = s / 2, r = s / 2 - 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();
    }), { sdf: true });

    // Triangle (Mountain Collective)
    map.addImage('marker-mc', createMarkerImage((ctx, s) => {
      const cx = s / 2, r = s / 2 - 2;
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(cx + r, s - 2);
      ctx.lineTo(cx - r, s - 2);
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();
    }), { sdf: true });

    // Star (Indy)
    map.addImage('marker-indy', createMarkerImage((ctx, s) => {
      const cx = s / 2, cy = s / 2, outerR = s / 2 - 2, innerR = outerR * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (Math.PI / 2) * -1 + (Math.PI / 5) * i;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'white';
      ctx.fill();
    }), { sdf: true });

    // Small dot (Independent)
    map.addImage('marker-independent', createMarkerImage((ctx, s) => {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }), { sdf: true });

    // Set fog/atmosphere
    map.setFog({
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(36, 92, 223)',
      'horizon-blend': 0.02,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': 0.6,
    });
    // Mobile padding (initial — will be updated by drawerSnap effect)
    if (window.innerWidth < 640) {
      map.setPadding({ top: 0, right: 0, bottom: 80, left: 0 });
    }
    // Initial rendered resorts
    setRenderedResorts(resorts);
    // Signal to useViewportResorts that map is ready for event subscriptions
    onMapReady();
  }, [resorts, setRenderedResorts, onMapReady]);

  // Re-apply fog on style change
  const onStyleData = useCallback(() => {
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    if (!map.setFog) return;
    const isDark = mapStyleKey === 'dark' || mapStyleKey === 'satellite';
    map.setFog({
      color: isDark ? 'rgb(20, 20, 40)' : 'rgb(186, 210, 235)',
      'high-color': isDark ? 'rgb(10, 10, 30)' : 'rgb(36, 92, 223)',
      'horizon-blend': 0.02,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': isDark ? 0.9 : 0.6,
    });
  }, [mapStyleKey]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  const interactiveLayerIds = useMemo(
    () => ['resort-dots', 'resort-markers'],
    []
  );

  const isDark = mapStyleKey === 'dark' || mapStyleKey === 'satellite';

  return (
    <div className={`relative h-full w-full ${isFullscreen ? 'map-wrapper-fullscreen' : ''}`}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -98, latitude: 39, zoom: 1.2, pitch: 0, bearing: 0 }}
        onMoveEnd={onMoveEnd}
        onMouseDown={stopSpin}
        onTouchStart={stopSpin}
        onLoad={onMapLoad}
        onStyleData={onStyleData}
        onClick={onClick}
        interactiveLayerIds={interactiveLayerIds}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.8 }}
        projection="globe"
        style={{ width: '100%', height: '100%' }}
        cursor="auto"
      >
        {/* Terrain DEM source — always present */}
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />

        {/* NASA MODIS Snow Cover */}
        <Source
          id="modis-snow"
          type="raster"
          tiles={[`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDSI_Snow_Cover/default/${modisDate}/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`]}
          tileSize={256}
          maxzoom={8}
        />
        {showSnowCover && (
          <Layer
            id="modis-snow-layer"
            type="raster"
            source="modis-snow"
            paint={{ 'raster-opacity': 0.5 }}
          />
        )}

        <NavigationControl position="top-left" />
        <GeolocateControl
          position="top-left"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={false}
          showUserHeading={true}
          fitBoundsOptions={{ maxZoom: 5 }}
        />

        {/* Snow data — rendered before resorts (visually behind).
             NOT in interactiveLayerIds so clicks pass through to resort markers. */}
        <Source id="snow-data" type="geojson" data={snowGeoJSON}>
          <Layer id="snow-heatmap" type="heatmap" maxzoom={9}
            layout={{ visibility: showSnow ? 'visible' : 'none' }}
            paint={{
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'snowfall_7d'], 0, 0, 3, 0.2, 15, 0.5, 40, 0.8, 100, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 3, 1.5, 6, 2.5, 9, 3.5],
              'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
                0, 'rgba(0,0,0,0)', 0.1, 'rgba(100,181,246,0.5)', 0.25, 'rgba(56,130,246,0.65)',
                0.4, 'rgba(30,100,240,0.75)', 0.55, 'rgba(100,60,220,0.82)', 0.7, 'rgba(160,80,240,0.88)',
                0.85, 'rgba(220,200,255,0.92)', 1, 'rgba(255,255,255,1)'],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 18, 3, 35, 6, 55, 9, 70],
              'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.9, 9, 0],
            }}
          />
          {/* Snow circles removed — heatmap is sufficient */}
        </Source>

        {/* Piste trails — visible at high zoom */}
        {showPistes && pisteData && (
          <Source id="pistes" type="geojson" data={pisteData}>
            <Layer
              id="piste-runs"
              type="line"
              filter={['==', ['get', 'type'], 'run']}
              minzoom={11}
              paint={{
                'line-color': [
                  'match', ['get', 'difficulty'],
                  'green', '#22c55e',
                  'blue', '#3b82f6',
                  'red', '#ef4444',
                  'black', '#1e293b',
                  'double-black', '#1e293b',
                  '#94a3b8',
                ],
                'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1, 14, 3],
                'line-opacity': 0.8,
              }}
            />
            <Layer
              id="piste-lifts"
              type="line"
              filter={['==', ['get', 'type'], 'lift']}
              minzoom={11}
              paint={{
                'line-color': '#facc15',
                'line-width': 1.5,
                'line-dasharray': [2, 2],
              }}
            />
          </Source>
        )}

        {/* Resort source — no clustering, filtered by active pass toggles */}
        <Source
          id="resorts"
          type="geojson"
          data={filteredGeoJSON}
          cluster={false}
        >

          {/* === Layer 3: Mid-zoom individual dots (zoom 5-11) === */}
          {/* Glow layer behind dots for visibility */}
          <Layer
            id="resort-dots-glow"
            type="circle"
            minzoom={5}
            maxzoom={11}
            filter={passFilter}
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 5, 10, 8],
              'circle-color': [
                'match', ['get', 'pass'],
                'Ikon', '#3b82f6',
                'Epic', '#f97316',
                'Mountain Collective', '#7c3aed',
                'Indy', '#16a34a',
                'Independent', '#6b7280',
                '#6b7280',
              ],
              'circle-opacity': 0.3,
              'circle-blur': 1,
            }}
          />
          <Layer
            id="resort-dots"
            type="symbol"
            minzoom={5}
            maxzoom={11}
            filter={passFilter}
            layout={{
              'icon-image': [
                'match', ['get', 'pass'],
                'Ikon', 'marker-ikon',
                'Epic', 'marker-epic',
                'Mountain Collective', 'marker-mc',
                'Indy', 'marker-indy',
                'Independent', 'marker-independent',
                'marker-independent',
              ],
              'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.55, 8, 0.7, 10, 0.85],
              'icon-allow-overlap': true,
            }}
            paint={{
              'icon-color': [
                'match', ['get', 'pass'],
                'Ikon', '#60a5fa',
                'Epic', '#fb923c',
                'Mountain Collective', '#a78bfa',
                'Indy', '#4ade80',
                'Independent', '#94a3b8',
                '#94a3b8',
              ],
            }}
          />

          {/* === Layer: Resort name labels at Region View (zoom 5-10) === */}
          <Layer
            id="resort-region-labels"
            type="symbol"
            minzoom={5}
            maxzoom={11}
            filter={passFilter}
            layout={{
              'text-field': [
                'case',
                ['has', 'snow_7d'],
                ['format',
                  ['get', 'name'], {},
                  '\n', {},
                  ['concat', '❄ ', ['to-string', ['get', 'snow_7d']], '"'], { 'font-scale': 0.8 },
                ],
                ['get', 'name'],
              ],
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 13, 10, 14],
              'text-offset': [0, 1.4],
              'text-allow-overlap': false,
              'text-optional': true,
              'text-max-width': 8,
              'text-line-height': 1.2,
              'text-padding': 6,
              'symbol-sort-key': ['case', ['has', 'snow_7d'], ['*', -1, ['get', 'snow_7d']], 0],
            }}
            paint={{
              'text-color': isDark ? '#f1f5f9' : '#ffffff',
              'text-halo-color': isDark ? 'rgba(0,0,0,0.9)' : 'rgba(15,23,42,0.9)',
              'text-halo-width': 2,
            }}
          />

          {/* === Layer 4: Close-zoom combined markers (icon + label + snow) (zoom 11+) === */}
          <Layer
            id="resort-markers"
            type="symbol"
            minzoom={11}
            filter={passFilter}
            layout={{
              'icon-image': [
                'match', ['get', 'pass'],
                'Ikon', 'marker-ikon',
                'Epic', 'marker-epic',
                'Mountain Collective', 'marker-mc',
                'Indy', 'marker-indy',
                'Independent', 'marker-independent',
                'marker-independent',
              ],
              'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.7, 14, 1.0],
              'icon-allow-overlap': true,
              'icon-anchor': 'bottom',
              'text-field': [
                'case',
                ['has', 'snow_7d'],
                ['format',
                  ['get', 'name'], {},
                  '\n', {},
                  ['concat', '❄ ', ['to-string', ['get', 'snow_7d']], '"'], { 'font-scale': 0.85 },
                ],
                ['get', 'name'],
              ],
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 14, 14],
              'text-offset': [0, 0.3],
              'text-anchor': 'top',
              'text-allow-overlap': true,
              'text-max-width': 8,
              'text-line-height': 1.2,
            }}
            paint={{
              'icon-color': [
                'match', ['get', 'pass'],
                'Ikon', '#3b82f6',
                'Epic', '#f97316',
                'Mountain Collective', '#7c3aed',
                'Indy', '#16a34a',
                'Independent', '#6b7280',
                '#6b7280',
              ],
              'text-color': isDark ? '#e2e8f0' : '#1e293b',
              'text-halo-color': isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
              'text-halo-width': 1.5,
            }}
          />
        </Source>

        {/* Region navigation markers — visible at low zoom only */}
        {currentZoom < 4 && REGION_MARKERS.map((region) => {
          const snow = regionSnowAvg[region.id] || { avg7d: 0, avg24h: 0 };
          const isSnowing = snow.avg24h > 2; // actively snowing if >2cm avg in 24h
          // Color intensity based on 7-day snowfall: 0cm=slate, 10cm=sky, 30cm+=white-blue
          const intensity = Math.min(snow.avg7d / 30, 1);
          const borderColor = intensity > 0.5
            ? `rgba(255,255,255,${0.4 + intensity * 0.4})`
            : `rgba(56,189,248,${0.3 + intensity * 0.5})`;
          const glowColor = intensity > 0.5
            ? `rgba(255,255,255,${0.15 + intensity * 0.25})`
            : `rgba(56,189,248,${0.15 + intensity * 0.2})`;
          const bgAlpha = 0.75 + intensity * 0.15;

          return (
            <Marker
              key={region.id}
              longitude={region.lng}
              latitude={region.lat}
              anchor="center"
              onClick={(e) => { e.originalEvent.stopPropagation(); onRegionClick(region); }}
            >
              <div
                className="pointer-events-auto cursor-pointer select-none rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:scale-110 relative overflow-hidden"
                style={{
                  background: `rgba(15,23,42,${bgAlpha})`,
                  border: `1.5px solid ${borderColor}`,
                  boxShadow: `0 0 ${12 + intensity * 16}px ${glowColor}, 0 4px 12px rgba(0,0,0,0.4)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {/* Snow animation overlay */}
                {isSnowing && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                    <div className="snowfall-anim absolute inset-0" />
                  </div>
                )}
                <div className="text-center relative z-10">{region.label}</div>
                {snow.avg7d > 0 && (
                  <div className={`text-[9px] text-center mt-0.5 relative z-10 ${intensity > 0.5 ? 'text-white font-semibold' : 'text-sky-300'}`}>
                    {isSnowing ? '🌨' : '❄'} {Math.round(snow.avg7d)}cm/7d
                    {isSnowing && <span className="ml-1 text-white/80">· {Math.round(snow.avg24h)}cm now</span>}
                  </div>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* Consolidated map controls */}
      <MapControls
        mapRef={mapRef}
        spinning={spinning}
        setSpinning={setSpinning}
        stopSpin={stopSpin}
        setUserStopped={setUserStopped}
        isResortView={isResortView}
        resetView={resetView}
        flyToRegion={flyToRegion}
        currentZoom={currentZoom}
      />
    </div>
  );
}

// NOTE: PopupContent, DonutChart, percentile removed — cards now in ResultsContainer
// Keep only the MapExplore export above
