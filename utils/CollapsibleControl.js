const REGIONS = [
  { label: "🌎 Global", lat: 20, lng: -30, zoom: 1.2 },
  { label: "🇺🇸 USA", lat: 41.0, lng: -101.0, zoom: 2.7 },
  { label: "⛰️ Rockies", lat: 40.7, lng: -109.7, zoom: 4.9 },
  { label: "🌲 PNW", lat: 45.6, lng: -120.7, zoom: 5.5 },
  { label: "☀️ California", lat: 37.0, lng: -121.0, zoom: 5.3 },
  { label: "🏔️ Eastern US", lat: 41.4, lng: -78.9, zoom: 4.5 },
  { label: "🍁 Canada", lat: 51.3, lng: -119.4, zoom: 4.6 },
  { label: "🇪🇺 Europe", lat: 45.6, lng: 6.6, zoom: 4.4 },
  { label: "🗾 Japan", lat: 38.4, lng: 136.2, zoom: 3.8 },
  { label: "🌏 Oceania", lat: -38.1, lng: 156.2, zoom: 2.5 },
  { label: "🏔️ S. America", lat: -34.9, lng: -72.4, zoom: 5.0 },
];

export default class CollapsibleControl {
  constructor(onRegionClick) {
    this._onRegionClick = onRegionClick;
    this._open = false;

    // Outer container
    this._container = document.createElement("div");
    this._container.className = "skimail-ctrl";

    // Toggle button
    this._toggleButton = document.createElement("button");
    this._toggleButton.title = "Jump to region";
    Object.assign(this._toggleButton.style, {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "5px 10px",
      border: "1.5px solid rgba(255,255,255,0.15)",
      borderRadius: "8px",
      background: "rgba(0,0,0,0.4)",
      color: "rgba(255,255,255,0.8)",
      fontSize: "11px",
      fontWeight: "600",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      cursor: "pointer",
      transition: "all 0.2s ease",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      lineHeight: "1",
      whiteSpace: "nowrap",
    });
    this._toggleButton.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg><span>Regions</span>`;
    this._toggleButton.onclick = (e) => {
      e.stopPropagation();
      this._toggle();
    };

    // Dropdown menu
    this._menu = document.createElement("div");
    Object.assign(this._menu.style, {
      display: "none",
      position: "absolute",
      top: "100%",
      left: "0",
      marginTop: "4px",
      padding: "4px",
      borderRadius: "10px",
      background: "rgba(15,23,42,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      zIndex: "100",
      minWidth: "140px",
    });

    REGIONS.forEach((region) => {
      const item = document.createElement("button");
      item.dataset.lat = region.lat;
      item.dataset.lng = region.lng;
      item.dataset.zoom = region.zoom;
      Object.assign(item.style, {
        display: "block",
        width: "100%",
        padding: "6px 10px",
        border: "none",
        borderRadius: "6px",
        background: "transparent",
        color: "rgba(255,255,255,0.8)",
        fontSize: "12px",
        fontWeight: "500",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
        lineHeight: "1.4",
      });
      item.textContent = region.label;
      item.onmouseenter = () => { item.style.background = "rgba(255,255,255,0.1)"; };
      item.onmouseleave = () => { item.style.background = "transparent"; };
      item.onclick = (e) => {
        e.stopPropagation();
        this._onRegionClick(e);
        this._close();
      };
      this._menu.appendChild(item);
    });

    this._container.style.position = "relative";
    this._container.appendChild(this._toggleButton);
    this._container.appendChild(this._menu);
  }

  _toggle() {
    this._open = !this._open;
    this._menu.style.display = this._open ? "block" : "none";
    this._toggleButton.style.background = this._open ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)";
  }

  _close() {
    this._open = false;
    this._menu.style.display = "none";
    this._toggleButton.style.background = "rgba(0,0,0,0.4)";
  }

  onAdd(map) {
    this._map = map;
    this._map.on("move", () => this._close());
    return this._container;
  }

  onRemove() {
    this._map.off("move", () => this._close());
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
