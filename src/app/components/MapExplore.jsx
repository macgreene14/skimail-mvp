'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Map, { Source, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import useMapStore from '../store/useMapStore';
import useGlobeSpin from '../hooks/useGlobeSpin';
import useMapNavigation from '../hooks/useMapNavigation';
import useSnowData from '../hooks/useSnowData';
import useMapSetup from '../hooks/useMapSetup';
import MapControls from './MapControls';
import SnowLayers from './layers/SnowLayers';
import PisteLayers from './layers/PisteLayers';
import ResortLayers from './layers/ResortLayers';
import RegionMarkers from './layers/RegionMarkers';
import regionsManifest from '../../../assets/regions.json';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_APIKEY;

const PISTE_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/skimail-mvp/data/pistes`
  : '/skimail-mvp/data/pistes';

export function MapExplore({ resortCollection, nav }) {
  const resorts = resortCollection.features;
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursor, setCursor] = useState('auto');
  const onMouseEnter = useCallback(() => setCursor('pointer'), []);
  const onMouseLeave = useCallback(() => setCursor('auto'), []);

  const {
    mapStyle,
    showIkon, showEpic, showMC, showIndy, showIndependent,
    selectedResort, setSelectedResort,
    setHighlightedSlug,
    showPistes,
    isResortView,
  } = useMapStore();

  const setPisteData = useMapStore((s) => s.setPisteData);

  // Hooks — called unconditionally before any returns
  const setCurrentZoom = useMapStore((s) => s.setCurrentZoom);
  const { spinning, setSpinning, spinningRef, stopSpin } = useGlobeSpin(mapRef, nav.isGlobe);
  const { flyToResort, resetView, flyToRegion, onRegionClick, clickedFromMapRef } =
    useMapNavigation(mapRef, stopSpin, nav);
  const {
    snowGeoJSON, regionSnowAvg, setVisibleSlugs,
    snowBySlugRef, snowStableKey,
  } = useSnowData(resorts);
  const { onMapLoad, onStyleData } = useMapSetup(mapRef);

  // Piste data loading
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

  // Consume pendingRegionFly — fly to region when card clicked
  const pendingRegionFly = useMapStore((s) => s.pendingRegionFly);
  useEffect(() => {
    if (!pendingRegionFly || !mapRef.current) return;
    const region = regionsManifest.find((r) => r.id === pendingRegionFly);
    if (!region) return;
    useMapStore.getState().setPendingRegionFly(null);
    stopSpin();
    const zoom = window.innerWidth <= 768 ? region.zoom - 0.5 : region.zoom;
    useMapStore.getState().setLastRegion({ lng: region.center[0], lat: region.center[1], zoom: region.zoom });
    mapRef.current.flyTo({
      center: region.center,
      zoom,
      pitch: 0,
      bearing: 0,
      duration: 1200,
      curve: 1.5,
      essential: true,
    });
  }, [pendingRegionFly, stopSpin]);

  // Filtered GeoJSON with snow data merged
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

  // onMoveEnd — update zoom + visible slugs for tiered snow fetching
  const onMoveEnd = useCallback(() => {
    if (spinningRef.current) return;
    const mapWrapper = mapRef.current;
    if (!mapWrapper) return;
    const map = mapWrapper.getMap ? mapWrapper.getMap() : mapWrapper;
    setCurrentZoom(map.getZoom());
    const bounds = map.getBounds();
    if (!bounds) return;
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const slugs = resorts
      .filter((r) => {
        const coords = r.geometry?.coordinates;
        if (!coords) return false;
        const [lng, lat] = coords;
        return lng >= west && lng <= east && lat >= south && lat <= north;
      })
      .map((r) => r.properties?.slug)
      .filter(Boolean);
    setVisibleSlugs(slugs);
  }, [spinningRef, resorts, setVisibleSlugs, setCurrentZoom]);

  // Click on resort
  const onClick = useCallback(
    (e) => {
      stopSpin();
      const features = e.features;
      if (!features?.length) return;
      const f = features[0];
      if (f.properties.cluster) return;
      const resort = resorts.find((r) => r.properties.slug === f.properties.slug);
      if (resort) {
        setHighlightedSlug(resort.properties.slug);
        clickedFromMapRef.current = true;
        setSelectedResort(resort);
        flyToResort(resort);
      }
    },
    [resorts, setSelectedResort, setHighlightedSlug, stopSpin, flyToResort, clickedFromMapRef]
  );

  // Escape fullscreen
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  const handleMapLoad = useCallback(() => {
    onMapLoad();
    // Animate in from wide zoom on initial load — centered over US
    const map = mapRef.current;
    if (map) {
      setTimeout(() => {
        map.flyTo({
          center: [-98, 39],
          zoom: 1.5,
          pitch: 0,
          bearing: 0,
          duration: 3000,
          curve: 1.2,
          essential: true,
        });
      }, 300);
    }
  }, [onMapLoad, mapRef]);

  const interactiveLayerIds = useMemo(() => ['resort-dots', 'resort-markers'], []);
  const currentZoom = useMapStore((s) => s.currentZoom);

  return (
    <div className={`relative h-full w-full ${isFullscreen ? 'map-wrapper-fullscreen' : ''}`}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -98, latitude: 39, zoom: 0.5, pitch: 0, bearing: 0 }}
        onMoveEnd={onMoveEnd}
        onMouseDown={stopSpin}
        onTouchStart={stopSpin}
        onLoad={handleMapLoad}
        onStyleData={onStyleData}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={interactiveLayerIds}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.8 }}
        projection="globe"
        style={{ width: '100%', height: '100%' }}
        cursor={cursor}
      >
        {/* Terrain DEM source */}
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />

        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={false}
          showUserHeading={true}
          fitBoundsOptions={{ maxZoom: 5 }}
        />

        {/* Layer order: snow → pistes → resorts (back to front) */}
        <SnowLayers snowGeoJSON={snowGeoJSON} />
        <PisteLayers />
        <ResortLayers filteredGeoJSON={filteredGeoJSON} />
        <RegionMarkers regionSnowAvg={regionSnowAvg} onRegionClick={onRegionClick} navView={nav.navView} />
      </Map>

      <MapControls
        mapRef={mapRef}
        stopSpin={stopSpin}
        isResortView={isResortView}
        resetView={resetView}
        flyToRegion={flyToRegion}
        currentZoom={currentZoom}
        nav={nav}
      />
    </div>
  );
}
