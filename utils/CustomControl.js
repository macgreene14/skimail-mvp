export default class CustomControl {
  constructor(onClick) {
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl custom-control";

    // <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
    //     <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z"/>
    // </svg>

    this._container.innerHTML = `
    <div>
      <div data-lat="41.0" data-lng="-101.0" data-zoom="2.7" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
       US
      </div> 
      <div data-lat="40.7" data-lng="-109.7" data-zoom="4.9" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        Rockies
      </div> 
      <div data-lat="45.6" data-lng="-120.7" data-zoom="5.5" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        PNW 
      </div> 
      <div data-lat="37.0" data-lng="-121.0" data-zoom="5.3" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        California
      </div> 
      <div data-lat="41.4" data-lng="-78.9" data-zoom="3.8" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        Eastern US
      </div> 
      <div data-lat="51.3" data-lng="-119.4" data-zoom="4.6" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        Canada
      </div> 
      <div data-lat="45.6" data-lng="6.6" data-zoom="4.4" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        Europe
      </div>     
      <div data-lat="-38.1" data-lng="156.2" data-zoom="2.5" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        Oceania
      </div>    
      <div data-lat="38.4" data-lng="136.2" data-zoom="3.8" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        Japan
      </div>     
      <div data-lat="-34.9759" data-lng="-72.4741" data-zoom="5" style="cursor: pointer; padding: .1rem; border-radius: 3px; color: blue; margin: 10px;">
        South America
      </div>    
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
