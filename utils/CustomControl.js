export default class CustomControl {
  constructor(onClick) {
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl custom-control";

    // Embed the SVG directly
    this._container.innerHTML = `
    <div style="cursor: pointer; background-color: white; padding: 10px; border-radius: 3px;">
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
            <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z"/>
        </svg>    
    </div>
      `;

    // Attach click event listener
    this._container.addEventListener("click", onClick);
  }

  onAdd(map) {
    this._map = map;
    return this._container;
  }

  onRemove() {
    this._container.removeEventListener("click", this._onClick);
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
