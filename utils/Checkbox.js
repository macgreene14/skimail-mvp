export default class CheckboxControl {
  constructor(options) {
    this._options = options;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
  }

  onAdd(map) {
    this._map = map;
    this._checkbox = document.createElement("input");
    this._checkbox.type = "checkbox";
    this._checkbox.id = "myCheckbox";
    this._checkbox.checked = true; // Set the checkbox to be checked by default
    this._checkbox.style.marginRight = "10px"; // Add padding to the right of the checkbox
    this._label = document.createElement("label");
    this._label.htmlFor = "myCheckbox";
    this._label.textContent = this._options.labelText || "Checkbox";
    // Set the background color if provided in options
    if (this._options.backgroundColor) {
      this._container.style.backgroundColor = this._options.backgroundColor;
    }
    // Add event listener to the checkbox
    this._checkbox.addEventListener("change", (event) => {
      if (event.target.checked) {
        this._map.setLayoutProperty(
          this._options.layerId,
          "visibility",
          "visible"
        );
      } else {
        this._map.setLayoutProperty(
          this._options.layerId,
          "visibility",
          "none"
        );
      }
    });

    this._container.appendChild(this._checkbox);
    this._container.appendChild(this._label);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
