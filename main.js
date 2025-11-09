function Screen({ tab }) {
    const labels = {
      map: "Map",
      places: "My Places",
      nearby: "Nearby",
      alerts: "Alerts",
    };
    return (
      <div className="screen">
        <div className="title" style={{ fontSize: 22, marginBottom: 6 }}>
          {labels[tab]}
        </div>
        <div style={{ opacity: 0.85 }}>
          {/* Replace this with the real screen content per your mocks */}
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
  
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
  