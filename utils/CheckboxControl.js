export default class CheckboxControl {
  constructor(options) {
    this._options = options;
    this._isVisible = options.defVis;

    this._container = document.createElement("div");
    this._container.className = "skimail-ctrl";

    this._toggleButton = document.createElement("button");
    this._toggleButton.title = `Toggle ${options.labelText} resorts`;
    this._updateButton();
  }

  onAdd(map) {
    this._map = map;

    this._container.addEventListener("click", (e) => {
      e.stopPropagation();
      this._isVisible = !this._isVisible;
      this._map.setLayoutProperty(
        this._options.layerId,
        "visibility",
        this._isVisible ? "visible" : "none"
      );
      this._updateButton();
    });

    this._container.appendChild(this._toggleButton);
    return this._container;
  }

  _updateButton() {
    const { labelText, checkedColor } = this._options;
    const active = this._isVisible;

    // Icon SVGs for each control type
    const icons = {
      Ikon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22h20L12 2z"/><path d="M12 8v6"/><circle cx="12" cy="18" r="1"/></svg>`,
      Epic: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22h20L12 2z"/><path d="M8 16h8"/><path d="M10 12h4"/></svg>`,
      "✼": `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    };

    const icon = icons[labelText] || "";
    const color = active ? checkedColor : "rgba(255,255,255,0.4)";
    const bg = active ? `${checkedColor}22` : "transparent";
    const border = active ? `${checkedColor}44` : "rgba(255,255,255,0.15)";

    Object.assign(this._toggleButton.style, {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "5px 10px",
      border: `1.5px solid ${border}`,
      borderRadius: "8px",
      background: bg,
      color: color,
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

    const label = labelText === "✼" ? "Snow" : labelText;
    this._toggleButton.innerHTML = `${icon}<span>${label}</span>`;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
