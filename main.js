function Screen({ tab }) {
  const labels = {
    map: "Map",
    places: "My Places",
    nearby: "Nearby",
    alerts: "Alerts",
  };

  if (tab === "map") {
    return (
      <div className="screen screen-map" aria-label="Map view">
        <div className="map-layout">
          <SearchOverlay />
          <div className="map-viewport">
            <MapStatic />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="title" style={{ fontSize: 22, marginBottom: 6 }}>
        {labels[tab]}
      </div>
      <div style={{ opacity: 0.85 }}>
        {`(${labels[tab]} screen placeholder)`}
      </div>
    </div>
  );
}
  
function NavBar({ value, onChange }) {
    const items = [
        { key: "map",    icon: "language",        label: "Map" },
        { key: "places", icon: "person",          label: "My Places" },
        { key: "nearby", icon: "radar",           label: "Nearby" },   // nice match for “activity/nearby”
        { key: "alerts", icon: "notifications",   label: "Alerts" },
    ];

    return (
        <nav className="tabbar" role="tablist" aria-label="Primary">
        {items.map((it) => {
            const active = value === it.key;
            return (
            <button
                key={it.key}
                className={`tab ${active ? "active" : ""}`}
                role="tab"
                aria-selected={active}
                aria-label={it.label}
                onClick={() => onChange(it.key)}
                style={{
                background: "transparent",
                border: 0,
                color: "inherit",
                }}
            >
                <span className="active-indicator" />
                <span className="material-symbols-outlined">{it.icon}</span>
            </button>
            );
        })}
        </nav>
    );
}

function App() {
    const [tab, setTab] = React.useState("map");

    return (
        <>
        <Screen tab={tab} />
        <NavBar value={tab} onChange={setTab} />
        </>
    );
}

// ---------- Utilities ----------
function bubbleSize(count, {min=26, max=56} = {}) {
    // sqrt scaling: grows sublinearly so big counts don't dominate
    const s = Math.sqrt(count);
    // normalize assuming "typical" max ~ 2000 comments; can change
    const norm = Math.min(s / Math.sqrt(2000), 1);
    return Math.round(min + (max - min) * norm);
  }

function pinColor(count) {
  const intensity = Math.min(Math.sqrt(count) / Math.sqrt(2000), 1);
  const lightness = 70 - intensity * 35; // darker for higher counts
  return `hsl(28, 95%, ${lightness}%)`;
}
  
  // Example hardcoded data: positions in % relative to the image
const VENUES = [
    { id: "cbp", name: "Citizens Bank Park", xPct: 57, yPct: 26, count: 547,},
    { id: "lincoln", name: "Lincoln Financial Park", xPct: 45, yPct: 80, count: 109,},
    { id: "monster", name: "Monster Jam",     xPct: 91, yPct: 78, count: 2,},
];
  
function Pin({ xPct, yPct, count, label, onClick }) {
    const size = bubbleSize(count);
    return (
      <button
        className="pin"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: size,
          height: size,
          backgroundColor: pinColor(count),
          color: "#2b1600",
          transform: "translate(-50%, -50%)",
        }}
        aria-label={`${label} — ${count} comments`}
        onClick={onClick}
      >
        <span className="pin-count">{count}</span>
      </button>
    );
}
  
const RECENT_PLACES = [
  { id: 1, title: "Citizens Bank Park", city: "Philadelphia" },
  { id: 2, title: "bars", city: "Philadelphia" },
  { id: 3, title: "Bala Cynwyd", city: "Philadelphia" },
  { id: 4, title: "Greek Lady", city: "Philadelphia" },
  { id: 5, title: "Cira Green", city: "Philadelphia" },
  { id: 6, title: "Franklin Field", city: "Philadelphia" },
  { id: 7, title: "concert halls", city: "Philadelphia" },
];

const NEARBY_CATEGORIES = [
  { id: 1, icon: "local_gas_station", label: "Gas Stations" },
  { id: 2, icon: "restaurant", label: "Restaurants" },
  { id: 3, icon: "fastfood", label: "Fast Food" },
  { id: 4, icon: "local_parking", label: "Parking" },
];

function SearchOverlay() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const list = query
    ? RECENT_PLACES.filter((r) =>
        `${r.title} ${r.city}`.toLowerCase().includes(query.toLowerCase())
      )
    : RECENT_PLACES;

  const card = (
    <div className="search-card">
      <div className="search-input-row">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Maps"
          aria-label="Search Maps"
        />
        <button
          type="button"
          className="search-cancel"
          onClick={() => {
            setOpen(false);
            setQuery("");
          }}
        >
          Cancel
        </button>
      </div>
      <div className="divider" />
      <div className="recents-header">
        <span className="title">Recents</span>
        <button type="button" className="link-button">
          More
        </button>
      </div>
      <ul className="recents-list">
        {list.map((item) => (
          <li key={item.id}>
            <span className="material-symbols-outlined">search</span>
            <div className="recent-text">
              <span className="recent-name">{item.title}</span>
              <span className="dot">&bull;</span>
              <span className="recent-city">{item.city}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="find-nearby">
        <div className="find-title">Find Nearby</div>
        <div className="nearby-grid">
          {NEARBY_CATEGORIES.map((cat) => (
            <button key={cat.id} type="button" className="nearby-chip">
              <span className="material-symbols-outlined">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (!open) {
    return (
      <div className="search-panel">
        <button
          type="button"
          className="search-pill"
          onClick={() => setOpen(true)}
        >
          <span className="material-symbols-outlined">search</span>
          <span>Search Maps</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="search-panel search-panel-spacer" aria-hidden="true" />
      <div className="search-card-overlay">{card}</div>
    </>
  );
}

function MapStatic() {
  return (
    <div className="map-wrap">
      <div className="map-static" />
      {VENUES.map((v) => (
        <Pin
          key={v.id}
          xPct={v.xPct}
          yPct={v.yPct}
          count={v.count}
          label={v.name}
          onClick={() => console.log("Open venue card:", v.name)}
        />
      ))}
    </div>
  );
}
  
  
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
  
