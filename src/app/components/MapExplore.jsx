'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Source, Layer, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useMapStore from '../store/useMapStore';
import { useBatchSnowData } from '../hooks/useResortWeather';
import { getPercentile } from '../utils/percentiles';
import MapControls from './MapControls';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

const MAP_STYLES = {
  skimail: 'mapbox://styles/macgreene14/cllt2prpu004m01r9fw2v6yb8',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
};

const PASS_COLORS = {
  Ikon: '#3b82f6',
  Epic: '#f97316',
  'Mountain Collective': '#7c3aed',
  Indy: '#16a34a',
  Independent: '#6b7280',
};

const PASS_LINKS = {
  Ikon: 'https://www.ikonpass.com/',
  Epic: 'https://www.epicpass.com/',
  'Mountain Collective': 'https://mountaincollective.com/',
  Indy: 'https://www.indyskipass.com/',
};

// REGIONS moved to MapControls.jsx

export function MapExplore({ resortCollection }) {
  const resorts = resortCollection.features;
  const mapRef = useRef(null);
  const spinTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const lastFlewToRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spinning, setSpinning] = useState(true);
  const [userStopped, setUserStopped] = useState(false);
  const [popupInfo, setPopupInfo] = useState(null);

  const {
    mapStyle, mapStyleKey,
    showIkon, showEpic, showMC, showIndy, showIndependent, showSnow,
    selectedResort, setSelectedResort,
    setRenderedResorts,
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

  // Dataset stats for percentile charts
  const datasetStats = useMemo(() => {
    const vals = (key) =>
      resorts
        .map((r) => parseFloat(r.properties[key]))
        .filter((v) => !isNaN(v) && v > 0)
        .sort((a, b) => a - b);
    return { snowfall: vals('avg_snowfall'), vertical: vals('vertical_drop'), acres: vals('skiable_acres') };
  }, [resorts]);

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
        if (map.getZoom() < 5) return;
        const layers = [];
        if (map.getLayer('resort-dots')) layers.push('resort-dots');
        if (map.getLayer('resort-markers')) layers.push('resort-markers');
        if (layers.length === 0) return;
        const features = map.queryRenderedFeatures(undefined, { layers });
        if (features?.length) {
          const seen = new Set();
          const unique = features.filter((f) => {
            if (seen.has(f.properties.slug)) return false;
            seen.add(f.properties.slug);
            return true;
          });
          setRenderedResorts(unique);
          setVisibleSlugs(unique.map((f) => f.properties.slug));
        }
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
    if (zoom < 5) return;
    const layers = [];
    if (map.getLayer('resort-dots')) layers.push('resort-dots');
    if (map.getLayer('resort-markers')) layers.push('resort-markers');
    if (layers.length === 0) return;
    const features = map.queryRenderedFeatures(undefined, { layers });
    if (features?.length) {
      const seen = new Set();
      const unique = features.filter((f) => {
        if (seen.has(f.properties.slug)) return false;
        seen.add(f.properties.slug);
        return true;
      });
      setRenderedResorts(unique);
      setVisibleSlugs(unique.map((f) => f.properties.slug));
    }
  }, [setRenderedResorts]);

  // Uncontrolled mode — no onMove needed. Map manages its own viewState.
  // Read position from mapRef.current when needed (flyToResort, resetView, etc.)

  // Click on resort dot
  const onClick = useCallback(
    (e) => {
      stopSpin();
      const features = e.features;
      if (!features?.length) {
        setPopupInfo(null);
        return;
      }
      const f = features[0];

      // Handle cluster click — fly to nearest matching REGION preset
      if (f.properties.cluster) {
        const map = mapRef.current;
        if (!map) return;
        const [lng, lat] = f.geometry.coordinates;
        // Find closest region to the cluster center
        const REGIONS = [
          { lat: 41.0, lng: -101.0, zoom: 4.5 },   // USA
          { lat: 40.7, lng: -109.7, zoom: 5.5 },    // Rockies
          { lat: 45.6, lng: -120.7, zoom: 5.5 },    // PNW
          { lat: 37.0, lng: -121.0, zoom: 5.5 },    // California
          { lat: 41.4, lng: -78.9, zoom: 5.0 },     // Eastern US
          { lat: 51.3, lng: -119.4, zoom: 5.0 },    // Canada
          { lat: 45.6, lng: 6.6, zoom: 5.0 },       // Europe
          { lat: 38.4, lng: 136.2, zoom: 5.0 },     // Japan
          { lat: -38.1, lng: 156.2, zoom: 4.0 },    // Oceania
          { lat: -34.9, lng: -72.4, zoom: 5.5 },    // S. America
        ];
        let closest = REGIONS[0];
        let minDist = Infinity;
        for (const r of REGIONS) {
          const d = Math.hypot(r.lat - lat, r.lng - lng);
          if (d < minDist) { minDist = d; closest = r; }
        }
        const zoom = window.innerWidth <= 768 ? closest.zoom - 0.5 : closest.zoom;
        map.flyTo({ center: [closest.lng, closest.lat], zoom, duration: 1200 });
        return;
      }

      const resort = resorts.find((r) => r.properties.slug === f.properties.slug);
      if (resort) {
        // Only set selection — the useEffect on selectedResort handles flyTo + popup
        lastFlewToRef.current = null; // clear so effect will fly
        setSelectedResort(resort);
      }
    },
    [resorts, setSelectedResort, stopSpin]
  );

  // When selectedResort changes externally (e.g. from card click)
  // Use a ref to track which resort we already flew to, preventing re-fly loops.
  useEffect(() => {
    if (!selectedResort || !mapRef.current) return;
    const slug = selectedResort.properties?.slug;
    if (slug === lastFlewToRef.current) return; // already flying/flew here
    lastFlewToRef.current = slug;
    const snowInfo = snowData?.find((d) => d.slug === slug);
    setPopupInfo({ resort: selectedResort, snowInfo });
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
    () => ['clusters', 'resort-dots', 'resort-markers'],
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
          <Layer id="snow-circles" type="circle" minzoom={3}
            layout={{ visibility: showSnow ? 'visible' : 'none' }}
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['get', 'snowfall_7d'], 0, 5, 15, 12, 50, 20, 150, 30],
              'circle-color': ['interpolate', ['linear'], ['get', 'snowfall_7d'],
                0, 'rgba(100,181,246,0.7)', 15, 'rgba(66,165,245,0.8)', 40, 'rgba(30,136,229,0.9)', 100, 'rgba(255,255,255,1)'],
              'circle-stroke-width': 2, 'circle-stroke-color': 'rgba(255,255,255,0.7)',
              'circle-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0, 4, 0.9],
            }}
          />
          <Layer id="snow-labels" type="symbol" minzoom={2}
            layout={{
              visibility: showSnow ? 'visible' : 'none',
              'text-field': ['concat', '❄ ', ['get', 'name'], '\n', ['to-string', ['round', ['get', 'snowfall_7d']]], 'cm'],
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 4, 13, 7, 14],
              'text-allow-overlap': false, 'text-ignore-placement': false,
              'text-offset': [0, -2.5], 'text-line-height': 1.2, 'text-max-width': 12, 'text-padding': 8,
              'symbol-sort-key': ['*', -1, ['get', 'snowfall_7d']],
            }}
            paint={{
              'text-color': '#ffffff', 'text-halo-color': 'rgba(14,165,233,0.6)',
              'text-halo-width': 2, 'text-halo-blur': 1,
            }}
          />
        </Source>

        {/* Resort source with clustering — filtered by active pass toggles */}
        <Source
          id="resorts"
          type="geojson"
          data={filteredGeoJSON}
          cluster={true}
          clusterMaxZoom={4}
          clusterRadius={40}
        >
          {/* === Layer 1: Clusters (zoom 0-7) === */}
          <Layer
            id="clusters"
            type="circle"
            maxzoom={5}
            filter={['has', 'point_count']}
            paint={{
              'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26, 200, 32],
              'circle-color': [
                'step', ['get', 'point_count'],
                '#3b82f6',  // small clusters — Ikon blue
                10, '#7c3aed', // medium — purple
                50, '#f97316', // large — orange
                200, '#ef4444', // very large — red
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': 'rgba(255,255,255,0.4)',
              'circle-opacity': 0.85,
            }}
          />

          {/* === Layer 2: Cluster count labels (zoom 0-7) === */}
          <Layer
            id="cluster-count"
            type="symbol"
            maxzoom={5}
            filter={['has', 'point_count']}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': 12,
              'text-allow-overlap': true,
            }}
            paint={{
              'text-color': '#ffffff',
            }}
          />

          {/* === Layer 3: Mid-zoom individual dots (zoom 5-11) === */}
          <Layer
            id="resort-dots"
            type="symbol"
            minzoom={5}
            maxzoom={11}
            filter={['all', ['!', ['has', 'point_count']], passFilter]}
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
            filter={['all', ['!', ['has', 'point_count']], passFilter]}
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
            filter={['all', ['!', ['has', 'point_count']], passFilter]}
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

        {/* Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.resort.geometry.coordinates[0]}
            latitude={popupInfo.resort.geometry.coordinates[1]}
            anchor="bottom"
            closeOnClick={true}
            onClose={() => setPopupInfo(null)}
            maxWidth="300px"
            className="skimail-popup"
            offset={-5}
          >
            <PopupContent
              selectedResort={popupInfo.resort}
              snowData={popupInfo.snowInfo}
              stats={datasetStats}
            />
          </Popup>
        )}
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
      />
    </div>
  );
}

// Percentile helper
function percentile(sortedArr, val) {
  if (!sortedArr.length || isNaN(val)) return 0;
  let count = 0;
  for (const v of sortedArr) { if (v <= val) count++; else break; }
  return Math.round((count / sortedArr.length) * 100);
}

const DonutChart = ({ pct, color, bgColor, label, value, size = 52 }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <svg width={size} height={size} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke={bgColor} strokeWidth="5" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeDashoffset={circ * 0.25}
          strokeLinecap="round"
        />
        <text x="24" y="22" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: '10px', fontWeight: '700', fill: '#f8fafc' }}>
          {Math.round(pct)}
        </text>
        <text x="24" y="31" textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: '7px', fill: '#94a3b8' }}>
          %ile
        </text>
      </svg>
      <div style={{ fontSize: '10px', fontWeight: '600', color, lineHeight: '1.2', textAlign: 'center' }}>{value}</div>
      <div style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
};

const PopupContent = ({ selectedResort, snowData, stats }) => {
  const p = selectedResort.properties;
  const passColor = PASS_COLORS[p.pass] || '#6b7280';
  const passLink = PASS_LINKS[p.pass];
  const location = [
    p.state !== 'Unknown' ? p.state : null,
    p.country !== 'Unknown' ? p.country : null,
  ].filter(Boolean).join(', ');

  const snowVal = parseFloat(p.avg_snowfall);
  const vertVal = parseFloat(p.vertical_drop);
  const acresVal = parseFloat(p.skiable_acres);
  const snowPct = stats ? percentile(stats.snowfall, snowVal) : 0;
  const vertPct = stats ? percentile(stats.vertical, vertVal) : 0;
  const acresPct = stats ? percentile(stats.acres, acresVal) : 0;
  const hasCharts = stats && (!isNaN(snowVal) || !isNaN(vertVal) || !isNaN(acresVal));

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minWidth: '200px', maxWidth: '280px' }}>
      <div style={{ display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          {passLink ? (
            <a href={passLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
              backgroundColor: passColor, color: 'white', fontSize: '10px', fontWeight: '700',
              letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: '0',
              textDecoration: 'none',
            }}>{p.pass === 'Mountain Collective' ? 'MC' : p.pass}</a>
          ) : (
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
              backgroundColor: passColor, color: 'white', fontSize: '10px', fontWeight: '700',
              letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: '0',
            }}>{p.pass}</span>
          )}
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', lineHeight: '1.2' }}>
            {p.name !== 'Unknown' ? p.name : ''}
          </span>
        </div>

        {location && (
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>📍 {location}</div>
        )}

        {hasCharts && (
          <div style={{
            display: 'flex', justifyContent: 'space-around', marginBottom: '8px',
            padding: '8px 4px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {!isNaN(snowVal) && snowVal > 0 && (
              <DonutChart pct={snowPct} color="#38bdf8" bgColor="rgba(56,189,248,0.15)" label="Snowfall" value={`${p.avg_snowfall}"`} />
            )}
            {!isNaN(vertVal) && vertVal > 0 && (
              <DonutChart pct={vertPct} color="#4ade80" bgColor="rgba(74,222,128,0.15)" label="Vert" value={`${p.vertical_drop}ft`} />
            )}
            {!isNaN(acresVal) && acresVal > 0 && (
              <DonutChart pct={acresPct} color="#facc15" bgColor="rgba(250,204,21,0.15)" label="Acres" value={`${p.skiable_acres}ac`} />
            )}
          </div>
        )}

        {snowData && (snowData.snowfall_24h > 0 || snowData.snow_depth > 0 || snowData.snowfall_7d > 0) && (
          <div style={{
            display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px',
            padding: '6px', borderRadius: '8px', background: 'rgba(14,165,233,0.1)',
            border: '1px solid rgba(14,165,233,0.2)',
          }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', width: '100%', marginBottom: '2px' }}>❄️ Live Snow</span>
            {snowData.snowfall_24h > 0 && (
              <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', fontSize: '11px', fontWeight: '600', color: '#7dd3fc' }}>
                24h: {Math.round(snowData.snowfall_24h)}cm
              </span>
            )}
            {snowData.snowfall_7d > 0 && (
              <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(56,189,248,0.2)', fontSize: '11px', fontWeight: '600', color: '#7dd3fc' }}>
                7d: {Math.round(snowData.snowfall_7d)}cm
              </span>
            )}
            {snowData.snow_depth > 0 && (
              <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                Base: {Math.round(snowData.snow_depth)}cm
              </span>
            )}
            {snowData.temperature !== null && (
              <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                {Math.round(snowData.temperature)}°C
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
