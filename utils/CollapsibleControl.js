export default class CustomControl {
  constructor(onClick) {
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl custom-control";

    this._content = document.createElement("div");
    this._content.className = "control-content";
    this._content.style.display = "none";

    this._toggleButton = document.createElement("button");
    this._toggleButton.innerHTML = `<img src="https://ik.imagekit.io/bamlnhgnz/tr:w-20,h-20/layers.png" alt=""></img>`;
    this._toggleButton.onclick = () => this._toggleContent();

    this._container.appendChild(this._toggleButton);
    this._container.appendChild(this._content);

    this._content.innerHTML = `
    <div>
      <div data-lat="41.0" data-lng="-101.0" data-zoom="2.7" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
       US
      </div> 
      <div data-lat="40.7" data-lng="-109.7" data-zoom="4.9" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        Rockies
      </div> 
      <div data-lat="45.6" data-lng="-120.7" data-zoom="5.5" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        PNW 
      </div> 
      <div data-lat="37.0" data-lng="-121.0" data-zoom="5.3" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        California
      </div> 
      <div data-lat="41.4" data-lng="-78.9" data-zoom="3.8" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        Eastern US
      </div> 
      <div data-lat="51.3" data-lng="-119.4" data-zoom="4.6" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        Canada
      </div> 
      <div data-lat="45.6" data-lng="6.6" data-zoom="4.4" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        Europe
      </div>     
      <div data-lat="-38.1" data-lng="156.2" data-zoom="2.5" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        Oceania
      </div>    
      <div data-lat="38.4" data-lng="136.2" data-zoom="3.8" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        Japan
      </div>     
      <div data-lat="-34.9759" data-lng="-72.4741" data-zoom="5" style="cursor: pointer; border-radius: 3px; color: blue; margin: 2px;">
        South America
      </div>    
    </div>    `;

    // Attach click event listener
    this._content.addEventListener("click", onClick);
  }

  _toggleContent() {
    if (
      this._content.style.display === "none" ||
      !this._content.style.display
    ) {
      this._content.style.display = "block";
    } else {
      this._content.style.display = "none";
    }
  }

  onAdd(map) {
    this._map = map;
    return this._container;
  }

  onRemove() {
    this._content.removeEventListener("click", this._onClick);
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
