function Screen({ tab, renderMap, savedPlaces, onRemoveSaved, onShowVenue }) {
  const labels = {
    map: "Map",
    places: "My Places",
    nearby: "Nearby",
    alerts: "Alerts",
  };

  if (tab === "map") {
    return (
      <div className="screen screen-map" aria-label="Map view">
        {renderMap ? renderMap() : null}
      </div>
    );
  }

  if (tab === "places") {
    return (
      <div className="screen screen-places" aria-label="Saved places">
        <MyPlacesScreen
          savedPlaces={savedPlaces}
          onRemoveSaved={onRemoveSaved}
          onShowVenue={onShowVenue}
        />
      </div>
    );
  }

  if (tab === "nearby") {
    return (
      <div
        className="screen screen-places nearby-screen-container"
        aria-label="Nearby"
      >
        <NearbyScreen onShowVenue={onShowVenue} />
      </div>
    );
  }

  if (tab === "alerts") {
    return (
      <div className="screen screen-places" aria-label="Alerts">
        <AlertsScreen onShowVenue={onShowVenue} />
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
        { key: "nearby", icon: "radar",           label: "Nearby" },
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
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);
    const [sheetOpen, setSheetOpen] = React.useState(false);
    const [savedPlaces, setSavedPlaces] = React.useState(DEFAULT_SAVED_PLACES);
    const [pendingVenueId, setPendingVenueId] = React.useState(null);
    const handleExternalVenueHandled = React.useCallback(
      () => setPendingVenueId(null),
      []
    );

    const handleShowVenue = React.useCallback((venueId) => {
      if (!venueId) return;
      setPendingVenueId(venueId);
      setTab("map");
    }, []);

    const handleToggleSavePlace = React.useCallback((venue) => {
      setSavedPlaces((prev) => {
        const exists = prev.find((p) => p.id === venue.id);
        if (exists) {
          return prev.filter((p) => p.id !== venue.id);
        }
        return [
          ...prev,
          {
            id: venue.id,
            name: venue.name,
            details: venue.details,
            icon: venue.icon,
            count: venue.count ?? 0,
          },
        ];
      });
    }, []);

    const handleRemoveSaved = React.useCallback((id) => {
      setSavedPlaces((prev) => prev.filter((p) => p.id !== id));
    }, []);

    return (
        <>
        <KeyboardContext.Provider value={{ setKeyboardVisible, keyboardHeight }}>
          <Screen
            tab={tab}
            savedPlaces={savedPlaces}
            onRemoveSaved={handleRemoveSaved}
            onShowVenue={handleShowVenue}
            renderMap={() =>
              tab === "map" ? (
                <MapExperience
                  onSheetVisibilityChange={setSheetOpen}
                  savedPlaces={savedPlaces}
                  onToggleSavePlace={handleToggleSavePlace}
                  openVenueId={pendingVenueId}
                  onExternalVenueHandled={handleExternalVenueHandled}
                />
              ) : null
            }
          />
        </KeyboardContext.Provider>
        <div className={`tabbar-wrapper ${sheetOpen ? "collapsed" : ""}`}>
          <NavBar value={tab} onChange={setTab} />
        </div>
        <Keyboard 
          visible={keyboardVisible} 
          onHeightChange={setKeyboardHeight}
          onRequestClose={() => setKeyboardVisible(false)}
        />
        </>
    );
}

const KeyboardContext = React.createContext({
  setKeyboardVisible: () => {},
  keyboardHeight: 0,
});

function Keyboard({ visible, onHeightChange, onRequestClose }) {
  const height = 210;
  const [isShifted, setIsShifted] = React.useState(false);

  const setNativeValue = (element, value) => {
    if (!element) return;
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(element, value);
  };

  const insertText = (text) => {
    const target = document.activeElement;
    if (!target || typeof target.value !== "string") return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const nextValue =
      target.value.slice(0, start) + text + target.value.slice(end);
    setNativeValue(target, nextValue);
    const cursor = start + text.length;
    target.setSelectionRange(cursor, cursor);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  };
  
  const handleBackspace = () => {
    const target = document.activeElement;
    if (!target || typeof target.value !== "string") return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    if (start === 0 && end === 0) return;
    const deletionStart = start === end ? start - 1 : start;
    const nextValue =
      target.value.slice(0, deletionStart) + target.value.slice(end);
    setNativeValue(target, nextValue);
    const cursor = Math.max(deletionStart, 0);
    target.setSelectionRange(cursor, cursor);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  };
  
  const handleKeyTap = (key) => {
    if (key === 'return') {
      onRequestClose?.();
      const target = document.activeElement;
      target?.blur();
      return;
    }
    if (key === 'backspace') {
      handleBackspace();
      return;
    }
    if (key === 'space') {
      insertText(' ');
      return;
    }
    if (key === 'shift') {
      setIsShifted((prev) => !prev);
      return;
    }
    if (key === '123') {
      return;
    }
    if (key.length === 1) {
      const char = isShifted ? key.toUpperCase() : key.toLowerCase();
      insertText(char);
      if (isShifted) {
        setIsShifted(false);
      }
    }
  };
  
  React.useEffect(() => {
    onHeightChange(visible ? height : 0);
  }, [visible, height, onHeightChange]);

  React.useEffect(() => {
    if (!visible) {
      setIsShifted(false);
    }
  }, [visible]);

  if (!visible) return null;

  const keys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'backspace'],
    ['123', 'space', 'return']
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      width: 390,
      height: height,
      background: 'rgba(210, 213, 219, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      padding: '8px 4px 4px 4px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 10000,
      transition: 'transform 0.3s ease',
      transform: visible ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
      borderRadius: '18px 18px 0 0',
      boxShadow: '0 -10px 40px rgba(0,0,0,0.35)',
    }}>
      {keys.map((row, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          paddingLeft: i === 1 ? 20 : 0,
          paddingRight: i === 1 ? 20 : 0,
        }}>
          {row.map(key => {
                const isWide = key === 'space';
                const isAction = ['shift', 'backspace', '123', 'return'].includes(key);
                const isShiftKey = key === 'shift';
                const activeShift = isShiftKey && isShifted;
                return (
                  <button
                    key={key}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleKeyTap(key)}
                    style={{
                      flex: isWide ? 3 : isAction ? 1.5 : 1,
                      height: 38,
                      background: activeShift
                        ? '#fff'
                        : isAction
                        ? 'rgba(174, 179, 190, 0.95)'
                        : 'white',
                      border: 0,
                      borderRadius: 5,
                      fontSize: key === 'space' ? 14 : 20,
                      fontWeight: activeShift ? 700 : 400,
                      color: activeShift ? '#182F45' : '#000',
                      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                {key === 'backspace' ? '⌫' : 
                 key === 'shift' ? (activeShift ? '⬆︎' : '⇧') :
                 key === 'return' ? 'return' :
                 key === 'space' ? 'space' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------- Utilities ----------
function bubbleSize(count, {min=25, max=80} = {}) {
    const s = Math.sqrt(count);
    const norm = Math.min(s / Math.sqrt(2000), 1);
    return Math.round(min + (max - min) * norm);
  }

function pinColor(count) {
  const intensity = Math.min(Math.sqrt(count) / Math.sqrt(2000), 1);
  const lightness = 70 - intensity * 35;
  return `hsl(28, 95%, ${lightness}%)`;
}
  
const MAX_INITIAL_COMMENTS = 20;

const RAW_VENUES = [
  {
    id: "cbp",
    name: "Citizens Bank Park",
    icon: "stadium",
    xPct: 57,
    yPct: 26,
    details: {
      event: "Concert with The Lumineers",
      date: "09/19/2025",
      time: "9:00PM EST",
      address: "One Citizens Bank Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "c1", author: "David", text: "First opener just started!", upvotes: 271, downvotes: 1, time: "9:12pm", replies: [] },
      { id: "c2", author: "Mary", text: "I'm at 314 if anyone wants to meet up!", upvotes: 202, downvotes: 4, time: "9:33pm", replies: [
        { id: "r1", author: "John", text: "I'm nearby! Section 312", upvotes: 15, downvotes: 0, time: "9:35pm" },
        { id: "r2", author: "Sarah", text: "Me too! Let's meet at the concession stand", upvotes: 8, downvotes: 0, time: "9:37pm" },
      ]},
      { id: "c3", author: "Annie", text: "Any recommendations for parking?", upvotes: 189, downvotes: 0, time: "9:02pm", replies: [] },
      { id: "c4", author: "Mike", text: "Sound quality is amazing tonight!", upvotes: 156, downvotes: 2, time: "9:15pm", replies: [] },
      { id: "c5", author: "Lisa", text: "Merch line is crazy long", upvotes: 98, downvotes: 0, time: "8:45pm", replies: [] },
      { id: "c6", author: "Tom", text: "Best concert I've been to this year", upvotes: 143, downvotes: 1, time: "9:40pm", replies: [] },
      { id: "c7", author: "Emma", text: "Traffic getting in was brutal", upvotes: 67, downvotes: 3, time: "8:30pm", replies: [] },
      { id: "c8", author: "Chris", text: "Food prices are insane but the nachos are worth it", upvotes: 89, downvotes: 5, time: "8:55pm", replies: [] },
      { id: "c9", author: "Rachel", text: "Anyone know what time the show ends?", upvotes: 45, downvotes: 0, time: "9:05pm", replies: [] },
      { id: "c10", author: "Steve", text: "View from section 420 is perfect!", upvotes: 112, downvotes: 1, time: "9:20pm", replies: [] },
    ],
  },
  {
    id: "lincoln",
    name: "Lincoln Franklin Field",
    icon: "stadium",
    xPct: 45,
    yPct: 80,
    details: {
      event: "Eagles Open Practice",
      date: "09/20/2025",
      time: "10:00AM EST",
      address: "1 Lincoln Financial Field Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "c11", author: "Rob", text: "Security lines are moving fast.", upvotes: 42, downvotes: 0, time: "9:05am", replies: [] },
      { id: "c12", author: "Nina", text: "Team is warming up now.", upvotes: 38, downvotes: 0, time: "9:45am", replies: [] },
      { id: "c20", author: "Alex", text: "Sun just broke through the clouds over the field.", upvotes: 51, downvotes: 1, time: "8:45am", replies: [] },
      { id: "c21", author: "Bree", text: "Pep band warming up and sounds electric already.", upvotes: 37, downvotes: 0, time: "8:47am", replies: [] },
      { id: "c22", author: "Carlos", text: "Kids zone is handing out mini footballs by Gate A.", upvotes: 22, downvotes: 0, time: "8:49am", replies: [] },
      { id: "c23", author: "Dana", text: "Concession lines short near section 108 right now.", upvotes: 18, downvotes: 0, time: "8:52am", replies: [] },
      { id: "c24", author: "Eli", text: "Stadium wifi is holding up for live streaming.", upvotes: 46, downvotes: 1, time: "8:54am", replies: [] },
      { id: "c25", author: "Farah", text: "Cheer squad practicing their new routine on the sideline.", upvotes: 29, downvotes: 0, time: "8:56am", replies: [] },
      { id: "c26", author: "Gabe", text: "Lower bowl filling fast with lots of Kelly green jerseys.", upvotes: 33, downvotes: 0, time: "8:58am", replies: [] },
      { id: "c27", author: "Hannah", text: "Special teams running punt coverage drills up close.", upvotes: 27, downvotes: 0, time: "9:00am", replies: [] },
      { id: "c28", author: "Imani", text: "Jalen signing a few autographs near the tunnel.", upvotes: 58, downvotes: 0, time: "9:01am", replies: [] },
      { id: "c29", author: "Jared", text: "Water misters by the north gate feel amazing.", upvotes: 24, downvotes: 0, time: "9:02am", replies: [] },
      { id: "c30", author: "Keiko", text: "Merch tent restocked the retro jackets.", upvotes: 26, downvotes: 1, time: "9:04am", replies: [] },
      { id: "c31", author: "Liam", text: "Field looks pristine after the overnight rain.", upvotes: 31, downvotes: 0, time: "9:05am", replies: [] },
      { id: "c32", author: "Maya", text: "Security just opened another line at Gate C.", upvotes: 19, downvotes: 0, time: "9:06am", replies: [] },
      { id: "c33", author: "Noah", text: "DJ playing 2000s hits and the crowd is singing.", upvotes: 42, downvotes: 0, time: "9:07am", replies: [] },
      { id: "c34", author: "Olivia", text: "Team captains huddled with coaches at midfield.", upvotes: 34, downvotes: 0, time: "9:08am", replies: [] },
      { id: "c35", author: "Parker", text: "They are testing the pyros for player intros.", upvotes: 21, downvotes: 0, time: "9:09am", replies: [] },
      { id: "c36", author: "Quinn", text: "Practice script posted on the big screen.", upvotes: 17, downvotes: 0, time: "9:10am", replies: [] },
      { id: "c37", author: "Ravi", text: "Lots of families sitting together in section 132.", upvotes: 23, downvotes: 0, time: "9:11am", replies: [] },
      { id: "c38", author: "Sasha", text: "Free cold brew samples next to the pro shop.", upvotes: 28, downvotes: 0, time: "9:12am", replies: [] },
      { id: "c39", author: "Theo", text: "Drumline marching through the concourse.", upvotes: 25, downvotes: 0, time: "9:13am", replies: [] },
      { id: "c40", author: "Uma", text: "Players tossing foam footballs into the crowd.", upvotes: 16, downvotes: 0, time: "9:14am", replies: [] },
      { id: "c41", author: "Vik", text: "Rookies working on footwork with cones.", upvotes: 14, downvotes: 0, time: "9:15am", replies: [] },
      { id: "c42", author: "Will", text: "Jumbotron doing fan cam shoutouts nonstop.", upvotes: 32, downvotes: 1, time: "9:16am", replies: [] },
      { id: "c43", author: "Ximena", text: "Sun glare kind of rough on the east side seats.", upvotes: 12, downvotes: 0, time: "9:17am", replies: [] },
      { id: "c44", author: "Yara", text: "Plenty of parking left in lot K for late arrivals.", upvotes: 11, downvotes: 0, time: "9:18am", replies: [] },
      { id: "c45", author: "Zane", text: "Vendors selling $5 rally towels outside.", upvotes: 15, downvotes: 0, time: "9:19am", replies: [] },
      { id: "c46", author: "Anya", text: "They just ran a two-minute drill that looked sharp.", upvotes: 47, downvotes: 2, time: "9:20am", replies: [] },
      { id: "c47", author: "Blake", text: "Linebackers hitting the sleds hard near south endzone.", upvotes: 36, downvotes: 1, time: "9:21am", replies: [] },
      { id: "c48", author: "Carmen", text: "Practice playlist switched to Meek Mill and crowd went wild.", upvotes: 49, downvotes: 1, time: "9:22am", replies: [] },
      { id: "c49", author: "Dev", text: "Trainers walking around with sunscreen samples.", upvotes: 20, downvotes: 0, time: "9:23am", replies: [] },
      { id: "c50", author: "Eden", text: "Upper deck breeze keeps things comfortable.", upvotes: 13, downvotes: 0, time: "9:24am", replies: [] },
      { id: "c51", author: "Fiona", text: "Mascot swooped in for photos with kids.", upvotes: 30, downvotes: 0, time: "9:25am", replies: [] },
      { id: "c52", author: "Gianni", text: "Scoreboard showing live mic'd up clips between drills.", upvotes: 24, downvotes: 0, time: "9:26am", replies: [] },
      { id: "c53", author: "Helena", text: "Ref crew demonstrating new rule changes.", upvotes: 18, downvotes: 0, time: "9:27am", replies: [] },
      { id: "c54", author: "Ismael", text: "Plaza chalk mural almost finished—super detailed.", upvotes: 22, downvotes: 0, time: "9:28am", replies: [] },
      { id: "c55", author: "Jules", text: "Team store letting people customize jerseys today.", upvotes: 16, downvotes: 0, time: "9:29am", replies: [] },
      { id: "c56", author: "Kara", text: "Coaches reminding everyone to hydrate over PA.", upvotes: 19, downvotes: 0, time: "9:30am", replies: [] },
      { id: "c57", author: "Luca", text: "Local news camera interviewing fans in row 20.", upvotes: 27, downvotes: 0, time: "9:31am", replies: [] },
      { id: "c58", author: "Marlon", text: "Tight ends doing red-zone fade reps repeatedly.", upvotes: 35, downvotes: 0, time: "9:32am", replies: [] },
      { id: "c59", author: "Nadia", text: "Defensive backs practicing one-handed picks.", upvotes: 23, downvotes: 0, time: "9:33am", replies: [] },
      { id: "c60", author: "Owen", text: "Sparkly confetti test just covered section 103.", upvotes: 14, downvotes: 0, time: "9:34am", replies: [] },
      { id: "c61", author: "Priya", text: "Ground crew re-painting hash marks mid-practice.", upvotes: 20, downvotes: 0, time: "9:35am", replies: [] },
      { id: "c62", author: "Rosa", text: "Volunteers giving away schedule posters.", upvotes: 18, downvotes: 0, time: "9:36am", replies: [] },
      { id: "c63", author: "Soren", text: "Club level buffet already serving breakfast sandwiches.", upvotes: 12, downvotes: 0, time: "9:37am", replies: [] },
      { id: "c64", author: "Tara", text: "D-line doing synchronized swim move drills.", upvotes: 26, downvotes: 0, time: "9:38am", replies: [] },
      { id: "c65", author: "Uri", text: "Quarterbacks competing in accuracy challenge for laughs.", upvotes: 17, downvotes: 0, time: "9:39am", replies: [] },
      { id: "c66", author: "Val", text: "They invited fans to lead the E-A-G-L-E-S chant.", upvotes: 31, downvotes: 0, time: "9:40am", replies: [] },
      { id: "c67", author: "Wes", text: "Announcer teased a surprise guest later this morning.", upvotes: 29, downvotes: 0, time: "9:41am", replies: [] },
    ],
  },
  {
    id: "monster",
    name: "Monster Jam",
    icon: "stadia_controller",
    xPct: 91,
    yPct: 78,
    details: {
      event: "Monster Jam Qualifiers",
      date: "09/25/2025",
      time: "4:00PM EST",
      address: "3601 S Broad St, Philadelphia, PA 19148",
    },
    comments: [
      { id: "c13", author: "Sam", text: "Crew is still setting up the track.", upvotes: 3, downvotes: 0, time: "3:10pm", replies: [] },
    ],
  },
  {
    id: "smokey",
    name: "Smokey Joe's",
    icon: "sports_bar",
    xPct: -40,
    yPct: -40,
    details: {
      event: "Student Night",
      date: "09/18/2025",
      time: "11:30PM EST",
      address: "40th & Walnut St, Philadelphia, PA 19104",
    },
    comments: [
      { id: "c14", author: "Jess", text: "Line wraps around the corner right now.", upvotes: 22, downvotes: 1, time: "11:35pm", replies: [] },
      { id: "c15", author: "Leo", text: "DJ just switched to throwbacks.", upvotes: 15, downvotes: 0, time: "11:38pm", replies: [] },
    ],
  },
  {
    id: "theatre",
    name: "Theatre of Living Arts",
    icon: "music_note",
    xPct: -40,
    yPct: -40,
    details: {
      event: "All Time Low — Special Set",
      date: "09/21/2025",
      time: "8:00PM EST",
      address: "334 South St, Philadelphia, PA 19147",
    },
    comments: [
      { id: "c16", author: "Priya", text: "Doors just opened and merch is stocked.", upvotes: 12, downvotes: 0, time: "7:15pm", replies: [] },
    ],
  },
  {
    id: "mcgillins",
    name: "McGillin's Olde Ale House",
    icon: "sports_bar",
    xPct: -40,
    yPct: -40,
    details: {
      event: "Trivia Night Finals",
      date: "09/19/2025",
      time: "9:00PM EST",
      address: "1310 Drury St, Philadelphia, PA 19107",
    },
    comments: [
      { id: "c17", author: "Kelly", text: "Second round questions are tough!", upvotes: 31, downvotes: 0, time: "9:25pm", replies: [] },
    ],
  },
  {
    id: "franklinHall",
    name: "Franklin Music Hall",
    icon: "music_note",
    xPct: -40,
    yPct: -40,
    details: {
      event: "Electronic Showcase",
      date: "09/22/2025",
      time: "9:30PM EST",
      address: "421 N 7th St, Philadelphia, PA 19123",
    },
    comments: [
      { id: "c18", author: "Marco", text: "Light check happening now.", upvotes: 18, downvotes: 0, time: "8:55pm", replies: [] },
    ],
  },
  {
    id: "artmuseum",
    name: "Philadelphia Museum of Art",
    icon: "museum",
    xPct: -40,
    yPct: -40,
    details: {
      event: "Late Night Exhibit Tour",
      date: "09/21/2025",
      time: "7:30PM EST",
      address: "2600 Benjamin Franklin Pkwy, Philadelphia, PA 19130",
    },
    comments: [
      { id: "c19", author: "Andrea", text: "Great photo ops in the modern wing tonight.", upvotes: 44, downvotes: 0, time: "7:40pm", replies: [] },
    ],
  },
  {
    id: "stateside",
    name: "Stateside Live",
    icon: "sports_bar",
    xPct: 61,
    yPct: 24,
    initialCount: 18,
    details: {
      event: "Game Day Watch Party",
      date: "09/19/2025",
      time: "8:00PM EST",
      address: "900 Packer Ave, Philadelphia, PA 19148",
    },
    comments: [
      { id: "stateside-c1", author: "Jordan", text: "House band just kicked off a Springsteen cover.", upvotes: 14, downvotes: 0, time: "8:12pm", replies: [] },
      { id: "stateside-c2", author: "Marta", text: "Two-for-one drafts until 9pm.", upvotes: 11, downvotes: 0, time: "8:05pm", replies: [] },
      { id: "stateside-c3", author: "Evan", text: "Patio heaters are on and super cozy.", upvotes: 9, downvotes: 0, time: "7:55pm", replies: [] },
    ],
  },
  {
    id: "liveCasino",
    name: "Live! Casino",
    icon: "casino",
    xPct: 72,
    yPct: 28,
    initialCount: 17,
    details: {
      event: "High Roller Roulette",
      date: "09/19/2025",
      time: "10:00PM EST",
      address: "900 Packer Ave, Philadelphia, PA 19148",
    },
    comments: [
      { id: "livecasino-c1", author: "Ash", text: "Roulette tables are three deep right now.", upvotes: 18, downvotes: 1, time: "9:48pm", replies: [] },
      { id: "livecasino-c2", author: "Rina", text: "Live band in the lounge is covering 80s hits.", upvotes: 12, downvotes: 0, time: "9:40pm", replies: [] },
    ],
  },
  {
    id: "turfClub",
    name: "The Turf Club",
    icon: "local_bar",
    xPct: 54,
    yPct: 32,
    initialCount: 15,
    details: {
      event: "Post-Game Cocktails",
      date: "09/19/2025",
      time: "9:30PM EST",
      address: "1 Citizens Bank Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "turfclub-c1", author: "Milo", text: "Bartender is doing made-to-order old fashioneds.", upvotes: 16, downvotes: 0, time: "9:15pm", replies: [] },
      { id: "turfclub-c2", author: "Gianna", text: "Great view of the field from the mezzanine.", upvotes: 10, downvotes: 0, time: "9:05pm", replies: [] },
    ],
  },
  {
    id: "sportsComplex",
    name: "The Philadelphia Sports Complex",
    icon: "directions_run",
    xPct: 50,
    yPct: 44,
    initialCount: 12,
    details: {
      event: "Fan Fest",
      date: "09/19/2025",
      time: "5:00PM EST",
      address: "3601 S Broad St, Philadelphia, PA 19148",
    },
    comments: [
      { id: "sportscomplex-c1", author: "Leo", text: "Obstacle course is open to all ages now.", upvotes: 8, downvotes: 0, time: "5:40pm", replies: [] },
      { id: "sportscomplex-c2", author: "Anya", text: "Merch trucks lined up along Pattison Ave.", upvotes: 6, downvotes: 0, time: "5:32pm", replies: [] },
    ],
  },
  {
    id: "passAndStow",
    name: "Pass and Stow",
    icon: "local_pizza",
    xPct: 58,
    yPct: 38,
    initialCount: 9,
    details: {
      event: "Wood-Fired Slice Showcase",
      date: "09/19/2025",
      time: "7:00PM EST",
      address: "1 Citizens Bank Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "passandstow-c1", author: "Drew", text: "Pepperoni special is selling out quick.", upvotes: 9, downvotes: 0, time: "7:20pm", replies: [] },
      { id: "passandstow-c2", author: "Ivy", text: "Plenty of heat lamps on the patio.", upvotes: 5, downvotes: 0, time: "7:14pm", replies: [] },
    ],
  },
  {
    id: "bullsBbq",
    name: "Bull's BBQ",
    icon: "restaurant",
    xPct: 56,
    yPct: 41,
    initialCount: 5,
    details: {
      event: "Smoker Showcase",
      date: "09/19/2025",
      time: "6:30PM EST",
      address: "1 Citizens Bank Way, Philadelphia, PA 19148",
    },
    comments: [
      { id: "bullsbbq-c1", author: "Kurt", text: "Brisket platter comes with extra pickles tonight.", upvotes: 7, downvotes: 0, time: "6:45pm", replies: [] },
      { id: "bullsbbq-c2", author: "Neha", text: "Line is short if you enter from the third-base side.", upvotes: 4, downvotes: 0, time: "6:38pm", replies: [] },
    ],
  },
  {
    id: "shakeShack",
    name: "Shake Shack",
    icon: "lunch_dining",
    xPct: 52,
    yPct: 48,
    initialCount: 2,
    details: {
      event: "Game Night Custard Drop",
      date: "09/19/2025",
      time: "8:30PM EST",
      address: "3500 S Broad St, Philadelphia, PA 19148",
    },
    comments: [
      { id: "shakeshack-c1", author: "Olive", text: "Choco-peanut custard just hit the machines.", upvotes: 5, downvotes: 0, time: "8:36pm", replies: [] },
    ],
  },
];

const INITIAL_VENUES = RAW_VENUES.map((venue) => {
  const comments = (venue.comments || []).slice(0, MAX_INITIAL_COMMENTS);
  const computedCount =
    typeof venue.initialCount === "number" ? venue.initialCount : comments.length;
  return {
    ...venue,
    comments,
    count: computedCount,
  };
});

const QUICK_ACTIONS = [
  { id: "walk", icon: "directions_walk", label: "5 min" },
  { id: "call", icon: "call", label: "Call" },
  { id: "website", icon: "language", label: "Website" },
  { id: "tickets", icon: "confirmation_number", label: "Tickets" },
  { id: "more", icon: "more_horiz", label: "More" },
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

const NEARBY_DESTINATION_CONFIG = [
  { venueId: "stateside", minutes: 2 },
  { venueId: "liveCasino", minutes: 6 },
  { venueId: "turfClub", minutes: 3 },
  { venueId: "sportsComplex", minutes: 11 },
  { venueId: "passAndStow", minutes: 5 },
  { venueId: "bullsBbq", minutes: 6 },
  { venueId: "shakeShack", minutes: 7 },
];

const NEARBY_DESTINATIONS = NEARBY_DESTINATION_CONFIG.map(({ venueId, minutes }) => {
  const venue = INITIAL_VENUES.find((v) => v.id === venueId);
  if (!venue) return null;
  const topCommentCount = venue.comments?.length ?? 0;
  return {
    id: venueId,
    venueId,
    name: venue.name,
    icon: venue.icon,
    count: topCommentCount,
    minutes,
  };
}).filter(Boolean);

const POPULAR_NOW = ["lincoln", "mcgillins", "franklinHall", "artmuseum"]
  .map((venueId) => {
    const venue = INITIAL_VENUES.find((v) => v.id === venueId);
    if (!venue) return null;
    return {
      id: `popular-${venueId}`,
      venueId,
      name: venue.name,
      address: venue.details?.address?.split(",")[0] || "",
      icon: venue.icon,
      count: venue.count,
    };
  })
  .filter(Boolean);

const ALERTS = [
  {
    id: 1,
    location: "Citizens Bank Park",
    venueId: "cbp",
    date: "9/19",
    time: "9:41pm",
    lines: ["Laura replied to you:", "Yes! Everyone is dancing."],
  },
  {
    id: 2,
    location: "Citizens Bank Park",
    venueId: "cbp",
    date: "9/19",
    time: "9:00pm",
    lines: ["Active Event starting now!", "Concert with The Lumineers"],
  },
  {
    id: 3,
    location: "Smokey Joe's",
    venueId: "smokey",
    date: "9/18",
    time: "11:42pm",
    lines: ["Recent spike in activity:", "See what others are saying!"],
  },
];

const USER_LOCATION = {
  xPct: 45,
  yPct: 72,
};

function PlaceRow({ place, onActivate, removable = false, onRemove }) {
  const clickable = typeof onActivate === "function";
  const tabIndex = clickable ? 0 : -1;
  const primaryAddress =
    place.address ||
    (place.details?.address ? place.details.address.split(",")[0] : "");

  const handleKeyPress = (event) => {
    if (!clickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  return (
    <li
      className={`place-row ${clickable ? "place-row-clickable" : ""}`}
      role={clickable ? "button" : undefined}
      tabIndex={tabIndex}
      onClick={clickable ? onActivate : undefined}
      onKeyDown={handleKeyPress}
    >
      <div className="place-icon">
        <span className="material-symbols-outlined">
          {place.icon || "location_on"}
        </span>
        {place.count !== undefined && (
          <span className="place-count">{place.count}</span>
        )}
      </div>
      <div className="place-row-details">
        <div className="place-row-name">{place.name}</div>
        <div className="place-row-address">{primaryAddress}</div>
      </div>
      {removable && (
        <button
          type="button"
          className="remove-icon-btn"
          aria-label={`Remove ${place.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove?.();
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </li>
  );
}

const DEFAULT_SAVED_PLACES = ["cbp", "theatre", "smokey"]
  .map((venueId) => {
    const venue = INITIAL_VENUES.find((v) => v.id === venueId);
    if (!venue) return null;
    return {
      id: venue.id,
      name: venue.name,
      icon: venue.icon,
      count: venue.count,
      details: venue.details,
    };
  })
  .filter(Boolean);

function MyPlacesScreen({ savedPlaces, onRemoveSaved, onShowVenue }) {
  return (
    <div className="places-page">
      <section className="places-section">
        <div className="places-heading">My Places</div>
        <div className="places-panel">
          <div className="places-scroll">
            {savedPlaces && savedPlaces.length > 0 ? (
              <ul className="places-list">
                {savedPlaces.map((place) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    removable
                    onRemove={() => onRemoveSaved?.(place.id)}
                    onActivate={
                      place.id && onShowVenue
                        ? () => onShowVenue(place.id)
                        : undefined
                    }
                  />
                ))}
              </ul>
            ) : (
              <div className="places-empty">
                Save a venue from the map to see it listed here for quick access.
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="places-section">
        <div className="places-heading">Popular Now</div>
        <div className="places-panel">
          <ul className="places-list">
            {POPULAR_NOW.map((place) => (
              <PlaceRow
                key={place.id}
                place={place}
                onActivate={
                  onShowVenue ? () => onShowVenue(place.venueId) : undefined
                }
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function NearbyScreen({ onShowVenue }) {
  return (
    <div className="places-page nearby-page" aria-label="Nearby destinations">
      <section className="places-section">
        <div className="places-heading">Nearby</div>
        <div className="places-panel nearby-panel">
          <ul className="places-list nearby-list">
            {NEARBY_DESTINATIONS.map((spot) => (
              <PlaceRow
                key={spot.id}
                place={{
                  ...spot,
                  address: `${spot.minutes} min`,
                }}
                onActivate={
                  spot.venueId && onShowVenue
                    ? () => onShowVenue(spot.venueId)
                    : undefined
                }
              />
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}


function AlertsScreen({ onShowVenue }) {
  const handleKeyPress = (event, id) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onShowVenue?.(id);
    }
  };

  return (
    <div style={{ width: "100%" }} className="alerts-screen">
      <div className="title" style={{ marginBottom: 16 }}>Alerts</div>
      <ul className="my-places-list alerts-list">
        {ALERTS.map((alert) => (
          <li
            key={alert.id}
            className="alert-card"
            role="button"
            tabIndex={0}
            onClick={() => onShowVenue?.(alert.venueId)}
            onKeyDown={(event) => handleKeyPress(event, alert.venueId)}
          >
            <div className="alert-info">
              <div className="alert-header">
                <div className="alert-location">{alert.location}</div>
                <div className="alert-timestamp">
                  <span>{alert.date}</span>
                  <span>{alert.time}</span>
                </div>
              </div>
              <div className="alert-divider" />
              <div className="alert-body">
                {alert.lines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
            <span
              className="material-symbols-outlined alert-arrow"
              aria-hidden="true"
            >
              chevron_right
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchOverlay() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);
  const { setKeyboardVisible } = React.useContext(KeyboardContext);

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      setKeyboardVisible(true);
    }
  }, [open, setKeyboardVisible]);

  const handleCancel = () => {
    setOpen(false);
    setQuery("");
    setKeyboardVisible(false);
  };

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
            onFocus={() => setKeyboardVisible(true)}
            onBlur={() => setKeyboardVisible(false)}
          />
          <button
            type="button"
            className="search-cancel"
            onClick={handleCancel}
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

function MapExperience({
  onSheetVisibilityChange,
  savedPlaces = [],
  onToggleSavePlace,
  openVenueId,
  onExternalVenueHandled,
}) {
  const [venues, setVenues] = React.useState(INITIAL_VENUES);
  const [userVotes, setUserVotes] = React.useState({});
  const [selectedVenue, setSelectedVenue] = React.useState(null);
  const [sheetState, setSheetState] = React.useState("closed");
  const [alertedVenues, setAlertedVenues] = React.useState([]);

  React.useEffect(() => {
    if (onSheetVisibilityChange) {
      onSheetVisibilityChange(sheetState !== "closed");
    }
  }, [sheetState, onSheetVisibilityChange]);

  React.useEffect(() => {
    return () => {
      if (onSheetVisibilityChange) {
        onSheetVisibilityChange(false);
      }
    };
  }, [onSheetVisibilityChange]);

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    setSheetState("peek");
  };

  const handleClose = () => {
    setSheetState("closed");
    setTimeout(() => setSelectedVenue(null), 280);
  };

  const handleToggleAlerts = React.useCallback((venue) => {
    if (!venue?.id) return;
    setAlertedVenues((prev) => {
      if (prev.includes(venue.id)) {
        return prev.filter((id) => id !== venue.id);
      }
      return [...prev, venue.id];
    });
  }, []);

  const handleAddComment = (venueId, commentText) => {
    setVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }).toLowerCase();
          
          const newComment = {
            id: `c${Date.now()}`,
            author: "You",
            text: commentText,
            upvotes: 0,
            downvotes: 0,
            time: timeStr,
            replies: [],
          };
          
          const updatedVenue = {
            ...v,
            comments: [newComment, ...v.comments],
            count: v.count + 1,
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );
  };

  React.useEffect(() => {
    if (!openVenueId) return;
    const targetVenue = venues.find((v) => v.id === openVenueId);
    if (targetVenue) {
      setSelectedVenue(targetVenue);
      setSheetState("full");
    }
    onExternalVenueHandled?.();
  }, [openVenueId, venues, onExternalVenueHandled]);

  const handleEditComment = (venueId, commentId, newText, isReply = false, parentCommentId = null) => {
    setVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const updatedVenue = {
            ...v,
            comments: v.comments.map(c => {
              if (isReply && c.id === parentCommentId) {
                return {
                  ...c,
                  replies: (c.replies || []).map(r => 
                    r.id === commentId ? { ...r, text: newText } : r
                  ),
                };
              } else if (!isReply && c.id === commentId) {
                return { ...c, text: newText };
              }
              return c;
            }),
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );
  };

  const handleDeleteComment = (venueId, commentId, isReply = false, parentCommentId = null) => {
    setVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          let updatedVenue;
          
          if (isReply) {
            updatedVenue = {
              ...v,
              comments: v.comments.map(c => {
                if (c.id === parentCommentId) {
                  return {
                    ...c,
                    replies: (c.replies || []).filter(r => r.id !== commentId),
                  };
                }
                return c;
              }),
            };
          } else {
            updatedVenue = {
              ...v,
              comments: v.comments.filter(c => c.id !== commentId),
              count: v.count - 1,
            };
          }
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );

    setUserVotes(prev => {
      const newVotes = { ...prev };
      delete newVotes[commentId];
      return newVotes;
    });
  };

  const handleAddReply = (venueId, commentId, replyText) => {
    setVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }).toLowerCase();
          
          const newReply = {
            id: `r${Date.now()}`,
            author: "You",
            text: replyText,
            upvotes: 0,
            downvotes: 0,
            time: timeStr,
          };
          
          const updatedVenue = {
            ...v,
            comments: v.comments.map(c => 
              c.id === commentId 
                ? { ...c, replies: [...(c.replies || []), newReply] }
                : c
            ),
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );
  };

  const handleVote = (venueId, commentId, voteType, isReply = false, parentCommentId = null) => {
    const existingVote = userVotes[commentId];
    
    if (existingVote === voteType) {
      return;
    }

    setVenues(prevVenues => 
      prevVenues.map(v => {
        if (v.id === venueId) {
          const updatedVenue = {
            ...v,
            comments: v.comments.map(c => {
              if (isReply && c.id === parentCommentId) {
                return {
                  ...c,
                  replies: (c.replies || []).map(r => {
                    if (r.id === commentId) {
                      let newUpvotes = r.upvotes;
                      let newDownvotes = r.downvotes;
                      
                      if (existingVote === 'up') {
                        newUpvotes--;
                      } else if (existingVote === 'down') {
                        newDownvotes--;
                      }
                      
                      if (voteType === 'up') {
                        newUpvotes++;
                      } else {
                        newDownvotes++;
                      }
                      
                      return {
                        ...r,
                        upvotes: newUpvotes,
                        downvotes: newDownvotes,
                      };
                    }
                    return r;
                  }),
                };
              } else if (!isReply && c.id === commentId) {
                let newUpvotes = c.upvotes;
                let newDownvotes = c.downvotes;
                
                if (existingVote === 'up') {
                  newUpvotes--;
                } else if (existingVote === 'down') {
                  newDownvotes--;
                }
                
                if (voteType === 'up') {
                  newUpvotes++;
                } else {
                  newDownvotes++;
                }
                
                return {
                  ...c,
                  upvotes: newUpvotes,
                  downvotes: newDownvotes,
                };
              }
              return c;
            }),
          };
          
          if (selectedVenue?.id === venueId) {
            setSelectedVenue(updatedVenue);
          }
          
          return updatedVenue;
        }
        return v;
      })
    );

    setUserVotes(prev => ({
      ...prev,
      [commentId]: voteType,
    }));
  };

  const isSelectedSaved = selectedVenue
    ? savedPlaces.some((p) => p.id === selectedVenue.id)
    : false;
  const isSelectedAlerted = selectedVenue
    ? alertedVenues.includes(selectedVenue.id)
    : false;

  return (
    <div className="map-layout">
      <SearchOverlay />
      <div className="map-viewport">
        <MapStatic venues={venues} onSelectVenue={handleVenueSelect} />
        <BottomSheet
          venue={selectedVenue}
          state={sheetState}
          onStateChange={setSheetState}
          onClose={handleClose}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onAddReply={handleAddReply}
          onVote={handleVote}
          userVotes={userVotes}
          onToggleSave={onToggleSavePlace}
          isSaved={isSelectedSaved}
          onToggleAlerts={handleToggleAlerts}
          isAlertsEnabled={isSelectedAlerted}
        />
      </div>
    </div>
  );
}

function MapStatic({ venues, onSelectVenue }) {
  return (
    <div className="map-wrap">
      <div className="map-static" />
      <div
        className="user-location-dot"
        style={{
          left: `${USER_LOCATION.xPct}%`,
          top: `${USER_LOCATION.yPct}%`,
        }}
        role="img"
        aria-label="Your location"
      />
      {venues.map((v) => (
        <Pin
          key={v.id}
          xPct={v.xPct}
          yPct={v.yPct}
          count={v.count}
          label={v.name}
          onClick={() => onSelectVenue(v)}
        />
      ))}
    </div>
  );
}

function Comment({ comment, venueId, onAddReply, onEditComment, onDeleteComment, onVote, userVotes, isReply = false, parentCommentId = null }) {
  const [showReplyBox, setShowReplyBox] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [showReplies, setShowReplies] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(comment.text);
  const { setKeyboardVisible } = React.useContext(KeyboardContext);

  const isOwnComment = comment.author === "You";
  const userVote = userVotes[comment.id];

  React.useEffect(() => {
    setKeyboardVisible(showReplyBox || isEditing);
  }, [showReplyBox, isEditing, setKeyboardVisible]);

  const handleSubmitReply = () => {
    if (replyText.trim()) {
      onAddReply(venueId, comment.id, replyText.trim());
      setReplyText("");
      setShowReplyBox(false);
      setShowReplies(true);
    }
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== comment.text) {
      onEditComment(venueId, comment.id, editText.trim(), isReply, parentCommentId);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      onDeleteComment(venueId, comment.id, isReply, parentCommentId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (isEditing) {
        handleSaveEdit();
      } else {
        handleSubmitReply();
      }
    }
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <li style={{ marginLeft: isReply ? 24 : 0 }}>
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-time">{comment.time}</span>
      </div>
      
      {isEditing ? (
        <div style={{ marginTop: 4, marginBottom: 8 }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyPress}
            rows="3"
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(12,18,25,0.6)',
              color: 'var(--accent-light)',
              padding: 8,
              fontFamily: 'inherit',
              fontSize: 15,
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSaveEdit}
              disabled={!editText.trim()}
              style={{
                background: editText.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                color: '#182F45',
                border: 0,
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: editText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="comment-body">{comment.text}</div>
      )}
      
      <div 
        className="comment-meta"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button 
            className="link-button"
            onClick={() => onVote(venueId, comment.id, 'up', isReply, parentCommentId)}
            disabled={userVote === 'up'}
            style={{ 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              opacity: userVote === 'up' ? 1 : (userVote === 'down' ? 0.5 : 0.75),
              fontWeight: userVote === 'up' ? 700 : 400,
            }}
          >
            <span>▲</span> <span>{comment.upvotes}</span>
          </button>
          <button 
            className="link-button"
            onClick={() => onVote(venueId, comment.id, 'down', isReply, parentCommentId)}
            disabled={userVote === 'down'}
            style={{ 
              padding: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4,
              opacity: userVote === 'down' ? 1 : (userVote === 'up' ? 0.5 : 0.75),
              fontWeight: userVote === 'down' ? 700 : 400,
            }}
          >
            <span>▼</span> <span>{comment.downvotes}</span>
          </button>
          {!isReply && !isOwnComment && (
            <button 
              className="link-button"
              onClick={() => setShowReplyBox(!showReplyBox)}
            >
              Reply
            </button>
          )}
          {!isReply && replyCount > 0 && (
            <button 
              className="link-button"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? 'Hide' : 'View'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
        {isOwnComment && !isEditing && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="link-button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button 
              className="link-button"
              onClick={handleDelete}
              style={{ color: 'rgba(255,100,100,0.85)' }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      {showReplyBox && (
        <div style={{ marginTop: 8, position: 'relative' }}>
          <textarea
            placeholder="Write a reply..."
            rows="2"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyPress}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(12,18,25,0.6)',
              color: 'var(--accent-light)',
              padding: 8,
              fontFamily: 'inherit',
              fontSize: 14,
              resize: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSubmitReply}
              disabled={!replyText.trim()}
              style={{
                background: replyText.trim() ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                color: '#182F45',
                border: 0,
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: replyText.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Reply
            </button>
            <button
              onClick={() => {
                setShowReplyBox(false);
                setReplyText("");
              }}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                padding: '6px 12px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReplies && replyCount > 0 && (
        <ul className="comment-list" style={{ marginTop: 12, paddingLeft: 0 }}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              venueId={venueId}
              onAddReply={onAddReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              onVote={onVote}
              userVotes={userVotes}
              isReply={true}
              parentCommentId={comment.id}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function BottomSheet({ venue, state, onStateChange, onClose, onAddComment, onEditComment, onDeleteComment, onAddReply, onVote, userVotes, onToggleSave, isSaved, onToggleAlerts, isAlertsEnabled }) {
  const dragRef = React.useRef({ startY: 0, state: "closed" });
  const [commentText, setCommentText] = React.useState("");
  const [isCommentFocused, setIsCommentFocused] = React.useState(false);
  const { setKeyboardVisible, keyboardHeight } = React.useContext(KeyboardContext);

  React.useEffect(() => {
    setKeyboardVisible(isCommentFocused);
  }, [isCommentFocused, setKeyboardVisible]);

  if (!venue && state === "closed") {
    return null;
  }

  const handlePointerDown = (e) => {
    dragRef.current = { startY: e.clientY, state };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e) => {
    const delta = e.clientY - dragRef.current.startY;
    if (delta < -40) {
      onStateChange("full");
    } else if (delta > 40) {
      if (dragRef.current.state === "full") {
        onStateChange("peek");
      } else {
        onClose();
      }
    } else {
      if (dragRef.current.state === "peek") {
        onStateChange("full");
      } else if (dragRef.current.state === "full") {
        onStateChange("peek");
      }
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleSubmitComment = () => {
    if (commentText.trim() && venue) {
      onAddComment(venue.id, commentText.trim());
      setCommentText("");
      setIsCommentFocused(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  const sheetClass = [
    "bottom-sheet",
    state,
    state !== "closed" ? "open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const details = venue?.details || {};
  const comments = venue?.comments || [];

  return (
    <div 
      className={sheetClass}
      style={{
        paddingBottom: keyboardHeight,
      }}
    >
      <div className="sheet-surface">
        <div
          className="sheet-handle"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <span />
        </div>
        <div className="sheet-content">
          <div className="sheet-header">
            <div>
              <div className="sheet-title">{venue?.name}</div>
              <div className="sheet-title-divider" />
              {details.event && (
                <div className="sheet-subtitle">
                  Active Event: {details.event}
                </div>
              )}
            </div>
            <div className="sheet-icon-stack">
              <button className="icon-btn" aria-label="Share">
                <span className="material-symbols-outlined">ios_share</span>
                <span>Share</span>
              </button>
              <button
                className="icon-btn"
                aria-label="Save place"
                onClick={() => onToggleSave?.(venue)}
              >
                <span className="material-symbols-outlined">
                  {isSaved ? "bookmark_added" : "bookmark_add"}
                </span>
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
              <button
                className={`icon-btn ${isAlertsEnabled ? "icon-btn-alert-active" : ""}`}
                aria-label="Alert"
                aria-pressed={isAlertsEnabled}
                onClick={() => onToggleAlerts?.(venue)}
              >
                <span className="material-symbols-outlined">
                  {isAlertsEnabled ? "notifications_active" : "notifications"}
                </span>
                <span>{isAlertsEnabled ? "Alerted" : "Alert"}</span>
              </button>
              <button className="icon-btn" aria-label="Close" onClick={onClose}>
                <span className="material-symbols-outlined">close</span>
                <span>Close</span>
              </button>
            </div>
          </div>
          <div className="sheet-info">
            <div>
              <div className="info-label">Date</div>
              <div className="info-value">{details.date}</div>
            </div>
            <div>
              <div className="info-label">Time</div>
              <div className="info-value">{details.time}</div>
            </div>
          </div>
          <div className="sheet-address">
            <div className="info-label">Address</div>
            <div className="info-value">{details.address}</div>
          </div>
          <div className="sheet-quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <button key={action.id} className="quick-action">
                <span className="material-symbols-outlined">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
            <div className="sheet-comments">
            <div className="sheet-comments-header">Comment</div>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <textarea
                placeholder="Share an update..."
                rows="3"
                aria-label="Add a comment"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsCommentFocused(true)}
                onBlur={() => setIsCommentFocused(false)}
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(12,18,25,0.6)',
                  color: 'var(--accent-light)',
                  padding: '14px 96px 14px 16px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  fontSize: 15,
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: 14,
                  transform: 'translateY(-50%)',
                  background: commentText.trim() ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
                  color: '#182F45',
                  border: 0,
                  borderRadius: 999,
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s ease',
                }}
              >
                Post
              </button>
            </div>
            <ul className="comment-list">
              {comments.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  venueId={venue.id}
                  onAddReply={onAddReply}
                  onEditComment={onEditComment}
                  onDeleteComment={onDeleteComment}
                  onVote={onVote}
                  userVotes={userVotes}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
  
  
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
