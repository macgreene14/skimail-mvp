export default class CheckboxControl {
  constructor(options) {
    this._options = options;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    this._isVisible = this._options.defVis; // Default visibility state

    this._toggleButton = document.createElement("button");
    this._toggleButton.className = "mapboxgl-ctrl-icon";
    this._toggleButton.innerHTML = this._options.labelText || "Checkbox";
  }

  onAdd(map) {
    this._map = map;

    // Set the background color based on the current visibility
    this._updateBackgroundColor();

    // Add click event listener to the container
    this._container.addEventListener("click", () => {
      this._isVisible = !this._isVisible;
      this._map.setLayoutProperty(
        this._options.layerId,
        "visibility",
        this._isVisible ? "visible" : "none"
      );
      this._updateBackgroundColor();
    });

    this._container.appendChild(this._toggleButton);

    return this._container;
  }

  _updateBackgroundColor() {
    if (this._isVisible) {
      this._container.style.backgroundColor =
        this._options.checkedColor || "blue"; // Default color when checked
    } else {
      this._container.style.backgroundColor =
        this._options.uncheckedColor || "grey"; // Default color when unchecked
    }
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
