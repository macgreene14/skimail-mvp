'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl, GeolocateControl, Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useMapStore from '../store/useMapStore';
import { useBatchSnowData } from '../hooks/useResortWeather';
import MapControls from './MapControls';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

const MAP_STYLES = {
  skimail: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

// Region nav markers for globe/low zoom
const REGION_MARKERS = [
  { id: 'rocky-mountain', label: '⛰️ Rockies', lat: 45.5, lng: -110.5, zoom: 6.5 },
  { id: 'pnw', label: '🌲 PNW', lat: 46.8, lng: -121.7, zoom: 6.5 },
  { id: 'california', label: '☀️ California', lat: 38.5, lng: -120.0, zoom: 6.5 },
  { id: 'northeast', label: '🏔️ Northeast', lat: 44.0, lng: -72.0, zoom: 6.5 },
  { id: 'midwest', label: '🌾 Midwest', lat: 45.0, lng: -89.0, zoom: 6.5 },
  { id: 'western-canada', label: '🍁 W. Canada', lat: 51.0, lng: -117.0, zoom: 6.5 },
  { id: 'eastern-canada', label: '🍁 E. Canada', lat: 47.0, lng: -71.0, zoom: 6.5 },
  { id: 'alps', label: '🏔️ Alps', lat: 46.8, lng: 10.5, zoom: 6.5 },
  { id: 'scandinavia', label: '❄️ Scandinavia', lat: 63.0, lng: 14.0, zoom: 6.0 },
  { id: 'japan', label: '🗾 Japan', lat: 36.8, lng: 138.5, zoom: 6.5 },
  { id: 'oceania', label: '🌏 Oceania', lat: -37.0, lng: 148.0, zoom: 6.5 },
  { id: 'south-america', label: '🏔️ S. America', lat: -33.0, lng: -70.0, zoom: 6.5 },
];

export function MapExplore({ resortCollection }) {
  const resorts = resortCollection.features;
  const mapRef = useRef(null);
  const spinTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastFlewToRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spinning, setSpinning] = useState(true);
  const [userStopped, setUserStopped] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1.2);

  const {
    mapStyle, mapStyleKey,
    showIkon, showEpic, showMC, showIndy, showIndependent, showSnow,
    selectedResort, setSelectedResort,
    setRenderedResorts, setHighlightedSlug,
    showSnowCover,
    previousViewState, setPreviousViewState,
    isResortView, setIsResortView,
  } = useMapStore();

  const setSnowBySlug = useMapStore((s) => s.setSnowBySlug);

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
    const coords = resort.geometry.coordinates;
    map.flyTo({
      center: coords,
      zoom: 14.5,
      pitch: 72,
      bearing: -30,
      duration: 2500,
      essential: true,
    });
  }, [setPreviousViewState, setIsResortView]);

  // Reset view back to globe
  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const prev = previousViewState || { longitude: -98, latitude: 39, zoom: 1.2, pitch: 0, bearing: 0 };
    map.flyTo({
      center: [prev.longitude, prev.latitude],
      zoom: prev.zoom,
      pitch: 0,
      bearing: 0,
      duration: 1500,
      essential: true,
    });
    setIsResortView(false);
    lastFlewToRef.current = null; // allow re-clicking same resort
  }, [previousViewState, setIsResortView]);

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
  const filteredGeoJSON = useMemo(() => {
    const passes = new Set();
    if (showIkon) passes.add('Ikon');
    if (showEpic) passes.add('Epic');
    if (showMC) passes.add('Mountain Collective');
    if (showIndy) passes.add('Indy');
    if (showIndependent) passes.add('Independent');
    return {
      type: 'FeatureCollection',
      features: resorts.filter((r) => passes.has(r.properties.pass)),
    };
  }, [resorts, showIkon, showEpic, showMC, showIndy, showIndependent]);

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

  // Update rendered resorts on move
  // Update rendered resorts on move — only when zoomed in enough for dots/markers.
  // At globe zoom (<5), don't update — let pass filters in page.js handle it.
  // Skip during spin to avoid constant resets from easeTo animation.
  // Update carousel/sidebar with resorts visible in current viewport.
  // Uses a ref for spinning check to avoid stale closure issues.
  const spinningRef = useRef(spinning);
  useEffect(() => { spinningRef.current = spinning; }, [spinning]);

  // When spin stops, query viewport after a short delay so results update
  useEffect(() => {
    if (!spinning && mapRef.current) {
      const timer = setTimeout(() => {
        const mapWrapper = mapRef.current;
        if (!mapWrapper) return;
        const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
        setCurrentZoom(map.getZoom());
        const layers = [];
        if (map.getLayer('resort-dots')) layers.push('resort-dots');
        if (map.getLayer('resort-markers')) layers.push('resort-markers');
        if (layers.length === 0) return;
        const features = map.queryRenderedFeatures(undefined, { layers });
        const seen = new Set();
        const unique = (features || []).filter((f) => {
          if (seen.has(f.properties.slug)) return false;
          seen.add(f.properties.slug);
          return true;
        });
        setRenderedResorts(unique);
        setVisibleSlugs(unique.map((f) => f.properties.slug));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [spinning, setRenderedResorts]);

  const onMoveEnd = useCallback(() => {
    if (spinningRef.current) return;
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    const zoom = map.getZoom();
    setCurrentZoom(zoom);
    // Query visible resorts at any zoom where dots/markers are rendered
    const layers = [];
    if (map.getLayer('resort-dots')) layers.push('resort-dots');
    if (map.getLayer('resort-markers')) layers.push('resort-markers');
    if (layers.length === 0) { setRenderedResorts([]); return; }
    const features = map.queryRenderedFeatures(undefined, { layers });
    const seen = new Set();
    const unique = (features || []).filter((f) => {
      if (seen.has(f.properties.slug)) return false;
      seen.add(f.properties.slug);
      return true;
    });
    setRenderedResorts(unique);
    setVisibleSlugs(unique.map((f) => f.properties.slug));
  }, [setRenderedResorts]);

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
        setSelectedResort(resort);
      }
    },
    [resorts, setSelectedResort, setHighlightedSlug, stopSpin]
  );

  // Region marker click — fly to region
  const onRegionClick = useCallback((region) => {
    stopSpin();
    const map = mapRef.current;
    if (!map) return;
    const zoom = window.innerWidth <= 768 ? region.zoom - 0.5 : region.zoom;
    map.flyTo({ center: [region.lng, region.lat], zoom, duration: 1200, essential: true });
  }, [stopSpin]);

  // When selectedResort changes externally (e.g. from card click)
  useEffect(() => {
    if (!selectedResort || !mapRef.current) return;
    const slug = selectedResort.properties?.slug;
    if (slug === lastFlewToRef.current) return;
    lastFlewToRef.current = slug;
    flyToResort(selectedResort);
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
  }, [resorts, setRenderedResorts]);

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
          <Layer id="snow-circles" type="circle" minzoom={5}
            layout={{ visibility: showSnow ? 'visible' : 'none' }}
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['get', 'snowfall_7d'], 0, 3, 15, 8, 50, 14, 150, 22],
              'circle-color': ['interpolate', ['linear'], ['get', 'snowfall_7d'],
                0, 'rgba(100,181,246,0.7)', 15, 'rgba(66,165,245,0.8)', 40, 'rgba(30,136,229,0.9)', 100, 'rgba(255,255,255,1)'],
              'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255,255,255,0.7)',
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 4, 0.9],
            }}
          />
          <Layer id="snow-labels" type="symbol" minzoom={7}
            layout={{
              visibility: showSnow ? 'visible' : 'none',
              'text-field': ['concat', '❄ ', ['get', 'name'], '\n', ['to-string', ['round', ['get', 'snowfall_7d']]], 'cm'],
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 7, 11, 10, 14],
              'text-allow-overlap': false, 'text-ignore-placement': false,
              'text-offset': [0, -2.5], 'text-line-height': 1.2, 'text-max-width': 12, 'text-padding': 20,
              'symbol-sort-key': ['*', -1, ['get', 'snowfall_7d']],
            }}
            paint={{
              'text-color': '#ffffff', 'text-halo-color': 'rgba(14,165,233,0.6)',
              'text-halo-width': 2, 'text-halo-blur': 1,
            }}
          />
        </Source>

        {/* Resort source — no clustering, filtered by active pass toggles */}
        <Source
          id="resorts"
          type="geojson"
          data={filteredGeoJSON}
          cluster={false}
        >

          {/* === Layer 3: Mid-zoom individual dots (zoom 5-11) === */}
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
              'icon-size': ['interpolate', ['linear'], ['zoom'], 5, 0.35, 10, 0.55],
              'icon-allow-overlap': true,
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
            }}
          />

          {/* === Layer 4: Close-zoom large markers (zoom 11+) === */}
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
            }}
          />

          {/* === Layer 5: Resort name labels (zoom 11+) === */}
          <Layer
            id="resort-labels"
            type="symbol"
            minzoom={11}
            filter={passFilter}
            layout={{
              'text-field': ['get', 'name'],
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 14, 13],
              'text-offset': [0, 1.8],
              'text-allow-overlap': false,
              'text-max-width': 8,
              'text-optional': true,
            }}
            paint={{
              'text-color': isDark ? '#e2e8f0' : '#1e293b',
              'text-halo-color': isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
              'text-halo-width': 1.5,
            }}
          />
        </Source>

        {/* Region navigation markers — visible at low zoom only */}
        {currentZoom < 6 && REGION_MARKERS.map((region) => (
          <Marker
            key={region.id}
            longitude={region.lng}
            latitude={region.lat}
            anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); onRegionClick(region); }}
          >
            <div
              className="pointer-events-auto cursor-pointer select-none rounded-full px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm transition-all hover:scale-110"
              style={{
                background: 'rgba(15,23,42,0.85)',
                border: '1.5px solid rgba(56,189,248,0.5)',
                boxShadow: '0 0 12px rgba(56,189,248,0.3), 0 4px 12px rgba(0,0,0,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              {region.label}
            </div>
          </Marker>
        ))}
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
        currentZoom={currentZoom}
      />
    </div>
  );
}

// NOTE: PopupContent, DonutChart, percentile removed — cards now in ResultsContainer
// Keep only the MapExplore export above
