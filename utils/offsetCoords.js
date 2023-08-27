export default function offsetCoords(coords) {
  // Check if the input is valid
  if (!coords || coords.length !== 2) {
    throw new Error("Invalid coordinates provided");
  }

  // Extract the latitude and longitude
  const [lat, lng] = coords;

  // Offset the latitude by 10 degrees
  const newLat = lat - 3;
  const newLng = lng + 7;

  // Return the new coordinates
  return [lat, newLng];
}
