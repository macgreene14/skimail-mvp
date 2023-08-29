export default class CustomControl {
  constructor(onClick) {
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

    this._container.innerHTML = `
      <button class="mapboxgl-ctrl-icon" aria-label="Custom Control" title="Navigate">
        <!-- SVG goes here -->
        <svg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill='%23333'><path d='M10 4C9 4 9 5 9 5v.1A5 5 0 0 0 5.1 9H5s-1 0-1 1 1 1 1 1h.1A5 5 0 0 0 9 14.9v.1s0 1 1 1 1-1 1-1v-.1a5 5 0 0 0 3.9-3.9h.1s1 0 1-1-1-1-1-1h-.1A5 5 0 0 0 11 5.1V5s0-1-1-1zm0 2.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 1 1 0-7z'/><circle id='dot' cx='10' cy='10' r='2'/><path id='stroke' d='M14 5l1 1-9 9-1-1 9-9z' display='none'/></svg>
      </button>
      <div class="control-content" style="display: none;">
        <!-- The dropdown content goes here -->
      </div>`;

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
