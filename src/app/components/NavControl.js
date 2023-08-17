import React, { useState } from "react";
// import { Layers } from "./Layers";
// import { MapSVG } from "./MapSVG";

export function NavControl({ map }) {
  const regionalFlyTo = [
    { region: "US", center: [-104, 42], zoom: 4 },
    { region: "West", center: [-121, 38], zoom: 6 },
    { region: "PNW", center: [-122.1, 45.25], zoom: 6.25 },
    { region: "Rockies", center: [-106.7, 39.5], zoom: 5.6 },
    { region: "Midwest", center: [-84.8, 43.7], zoom: 6.3 },

    { region: "East", center: [-79.25, 40.3], zoom: 5.6 },
    { region: "Canada", center: [-100, 56], zoom: 4 },
    { region: "West", center: [-120.15, 50], zoom: 6 },

    { region: "East", center: [-77.48, 44.6], zoom: 6.5 },
    { region: "Europe", center: [6.5, 43], zoom: 5.25 },
    { region: "Japan", center: [136.9, 37.4], zoom: 5.2 },
    { region: "Oceania", center: [159.879, -47.4952], zoom: 4 },
    { region: "South America", center: [-72.4741, -34.9759], zoom: 5 },
  ];
  //q: datastructure recommendation for mapbox layer control?

  // Layers State
  // const [passLayers, setPassLayers] = useState([
  //   { id: 1, label: "Epic", layer: "epic 22-23", checked: false, type: "pass" },
  //   { id: 2, label: "Ikon", layer: "ikon 22-23", checked: false, type: "pass" },
  //   {
  //     id: 3,
  //     label: "Mountain Collective",
  //     layer: "mc 22-23",
  //     checked: false,
  //     type: "pass",
  //   },
  //   { id: 4, label: "Indy", layer: "indy 22-23", checked: false, type: "pass" },
  //   {
  //     id: 5,
  //     label: "Global Resorts",
  //     layer: "global_resorts",
  //     checked: false,
  //     type: "pass",
  //   },
  //   {
  //     id: 6,
  //     label: "Global Heatmap",
  //     layer: "global_heatmap",
  //     checked: false,
  //     type: "pass",
  //   },
  // ]);

  // function handlePassLayers(index) {
  //   const newLayers = [...passLayers];
  //   newLayers[index].checked = !newLayers[index].checked;
  //   setPassLayers(newLayers);

  //   const layer = newLayers[index].layer;

  //   if (newLayers[index].checked) {
  //     map.current.setLayoutProperty(layer, "visibility", "visible");
  //   } else {
  //     map.current.setLayoutProperty(layer, "visibility", "none");
  //   }

  //   // if ikon and mc is checked
  //   if (newLayers[1].checked && newLayers[2].checked) {
  //     map.current.setLayoutProperty("ikon mc 22-23 ikon", "visibility", "none");
  //     map.current.setLayoutProperty("ikon mc 22-23 mc", "visibility", "none");
  //     map.current.setLayoutProperty(
  //       "ikon mc 22-23 both",
  //       "visibility",
  //       "visible"
  //     );
  //   } else if (newLayers[1].checked) {
  //     // if ikon is checked
  //     map.current.setLayoutProperty(
  //       "ikon mc 22-23 ikon",
  //       "visibility",
  //       "visible"
  //     );
  //     map.current.setLayoutProperty("ikon mc 22-23 mc", "visibility", "none");
  //     map.current.setLayoutProperty("ikon mc 22-23 both", "visibility", "none");
  //   } else if (newLayers[2].checked) {
  //     // if mc is checked
  //     map.current.setLayoutProperty("ikon mc 22-23 ikon", "visibility", "none");
  //     map.current.setLayoutProperty(
  //       "ikon mc 22-23 mc",
  //       "visibility",
  //       "visible"
  //     );
  //     map.current.setLayoutProperty("ikon mc 22-23 both", "visibility", "none");
  //   } else {
  //     map.current.setLayoutProperty("ikon mc 22-23 ikon", "visibility", "none");
  //     map.current.setLayoutProperty("ikon mc 22-23 mc", "visibility", "none");
  //     map.current.setLayoutProperty("ikon mc 22-23 both", "visibility", "none");
  //   }
  // }

  // const [navLayers, setNavLayers] = useState([
  //   { id: 101, label: "Radar", layer: "radar", checked: true, type: "nav" },
  //   {
  //     id: 102,
  //     label: "Traffic",
  //     layer: "traffic",
  //     checked: false,
  //     type: "nav",
  //   },
  //   {
  //     id: 103,
  //     label: "Airports",
  //     layer: "airports",
  //     checked: false,
  //     type: "nav",
  //   },
  //   {
  //     id: 104,
  //     label: "Global Resorts",
  //     layer: "global_resorts",
  //     checked: false,
  //     type: "nav",
  //   },
  //   {
  //     id: 105,
  //     label: "Satellite",
  //     layer: "mapbox-satellite",
  //     checked: false,
  //     type: "nav",
  //   },
  // ]);

  // const handleNavLayers = (index) => {
  //   const newLayers = [...navLayers];
  //   newLayers[index].checked = !newLayers[index].checked;
  //   setNavLayers(newLayers);

  //   const layer = newLayers[index].layer;

  //   if (newLayers[index].checked) {
  //     map.current.setLayoutProperty(layer, "visibility", "visible");
  //   } else {
  //     map.current.setLayoutProperty(layer, "visibility", "none");
  //   }
  // };

  return (
    <div className="fixed flex flex-col h-4/6 backdrop-blur-xs right-10 top-40 bottom-0 p-4 rounded-lg z-30 text-right">
      {/* <p className="text-xl uppercase text-center mt-4 font-bold">PASS type</p> */}
      {/* <div className="space-y-4 bg-white shadow-lg rounded-lg p-4">
        <Layers map={map} />
      </div> */}

      {/* <p className="text-xl uppercase text-center mt-4 font-bold">LAYERS</p>
      <div className="space-y-4 bg-white shadow-lg rounded-lg p-4">
        {navLayers.map((item, index) => (
          <label key={item.id} className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-gray-600"
              onChange={() => handleNavLayers(index)}
              checked={item.checked}
            />
            <p className="ml-2 text-gray-700">{item.label}</p>
          </label>
        ))}
      </div> */}
      {/* <div className="space-y-4 bg-white shadow-lg rounded-lg p-4 my-4 max-w-xs">
        <MapSVG center={map.center} zoom={map.zoom} />
      </div> */}
      {/* <p className="text-xl uppercase text-center mt-4  font-bold">ZOOM</p> */}
      <div className="space-y-2 rounded-lg p-2">
        {regionalFlyTo.map((item, index) => (
          <ol className="sm:text-xl hover:cursor-pointer" key={item.id}>
            <p
              className="text-blue-800"
              onClick={() =>
                map.current.flyTo({
                  center: item.center,
                  zoom: item.zoom,
                  pitch: 0, // camera pointed down
                  bearing: 0, // camera pointed north
                })
              }
            >
              {item.region}
            </p>
          </ol>
        ))}
      </div>
    </div>
  );
}
