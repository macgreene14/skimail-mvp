// Function to calculate the arc between two coordinates
function createArc(start, end) {
  const steps = 100;
  const arc = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const lat = start[1] + (end[1] - start[1]) * t;
    const lng = start[0] + (end[0] - start[0]) * t;
    const alt = Math.sin(Math.PI * t) * 200000; // Altitude for curvature
    arc.push([lng, lat, alt]);
  }
  return arc;
}

// Sample flight data
const flights = [
  { start: [-73.77, 40.64], end: [-118.4, 33.94] }, // JFK to LAX
  // Add more flights as needed
];

// Create GeoJSON data for the arcs
const arcsGeoJSON = {
  type: "FeatureCollection",
  features: flights.map((flight) => ({
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: createArc(flight.start, flight.end),
    },
  })),
};

// Initialize the map
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-98, 38],
  zoom: 3,
});

// Add the arcs layer when the map loads
map.on("load", () => {
  map.addSource("arcs", {
    type: "geojson",
    data: arcsGeoJSON,
  });
  map.addLayer({
    id: "arcs",
    type: "line",
    source: "arcs",
    layout: {
      "line-cap": "round",
    },
    paint: {
      "line-color": "#007cbf",
      "line-width": 4,
    },
  });
});
