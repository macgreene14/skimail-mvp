export default class CustomControl {
  constructor(onClick) {
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    this._container.style.display = "flex"; // Flexbox layout
    this._container.style.flexDirection = "row"; // Elements appear horizontally

    this._toggleButton = document.createElement("button");
    this._toggleButton.className = "mapboxgl-ctrl-icon";
    this._toggleButton.innerHTML = `
    <?xml version="1.0" encoding="UTF-8"?><svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M22 12L3 20l3.563-8L3 4l19 8zM6.5 12H22" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>    `;
    this._toggleButton.onclick = () => this._toggleContent();

    this._content = document.createElement("div");
    this._content.className = "control-content";
    this._content.style.display = "none";
    this._content.innerHTML = `
    <div>
      <div data-lat="41.0" data-lng="-101.0" data-zoom="2.7" style="cursor: pointer; border-radius: 3px; margin-bottom: 2px;">
       US
      </div> 
      <div data-lat="40.7" data-lng="-109.7" data-zoom="4.9" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        Rockies
      </div> 
      <div data-lat="45.6" data-lng="-120.7" data-zoom="5.5" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        PNW 
      </div> 
      <div data-lat="37.0" data-lng="-121.0" data-zoom="5.3" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        California
      </div> 
      <div data-lat="41.4" data-lng="-78.9" data-zoom="3.8" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        Eastern US
      </div> 
      <div data-lat="51.3" data-lng="-119.4" data-zoom="4.6" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        Canada
      </div> 
      <div data-lat="45.6" data-lng="6.6" data-zoom="4.4" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        Europe
      </div>     
      <div data-lat="-38.1" data-lng="156.2" data-zoom="2.5" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        Oceania
      </div>    
      <div data-lat="38.4" data-lng="136.2" data-zoom="3.8" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        Japan
      </div>     
      <div data-lat="-34.9759" data-lng="-72.4741" data-zoom="5" style="cursor: pointer; border-radius: 3px; margin: 2px;">
        South America
      </div>    
    </div>    
  </div>
    `;

    this._container.appendChild(this._toggleButton);
    this._container.appendChild(this._content);

    // Attach click event listener
    this._content.addEventListener("click", onClick);
  }

  _toggleContent() {
    if (
      this._content.style.display === "none" ||
      !this._content.style.display
    ) {
      this._content.style.display = "inline-block";
    } else {
      this._content.style.display = "none";
    }
  }

  onAdd(map) {
    this._map = map;
    this._map.on("move", this._onMapMove.bind(this));
    return this._container;
  }

  _onMapMove() {
    // Set display to none when the map moves
    this._content.style.display = "none";
  }

  // Add a method to reset the control's display when the map stops moving
  _onMapMoveEnd() {
    this._content.style.display = "block";
  }

  onRemove() {
    // Remove the move event listener when the control is removed
    this._map.off("move", this._onMapMove.bind(this));
    this._content.removeEventListener("click", this._onClick);
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
