import { useEffect } from "react";

export default function CamLog({ map }) {
  useEffect(() => {
    if (!map.current) {
      return;
    }
    // After the map has loaded, you can inspect its layers
    map.current.on("load", function () {
      const layers = map.current.getStyle().layers;

      // Loop through each layer to find the source layer name
      layers.forEach(function (layer) {
        if (layer["source-layer"]) {
          console.log("Layer ID:", layer.id);
          console.log("Source Layer Name:", layer["source-layer"]);
        }
      });
    });
  });
}
