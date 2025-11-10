function Screen({ tab, renderMap }) {
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

    return (
        <>
        <KeyboardContext.Provider value={{ setKeyboardVisible, keyboardHeight }}>
          <Screen
            tab={tab}
            renderMap={() =>
              tab === "map" ? (
                <MapExperience onSheetVisibilityChange={setSheetOpen} />
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
  const height = 291;
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
      left: 0,
      right: 0,
      height: height,
      background: 'rgba(210, 213, 219, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,0.1)',
      padding: '8px 4px 8px 4px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 10000,
      transition: 'transform 0.3s ease',
      transform: visible ? 'translateY(0)' : 'translateY(100%)',
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
                      height: 42,
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
function bubbleSize(count, {min=26, max=56} = {}) {
    const s = Math.sqrt(count);
    const norm = Math.min(s / Math.sqrt(2000), 1);
    return Math.round(min + (max - min) * norm);
  }

function pinColor(count) {
  const intensity = Math.min(Math.sqrt(count) / Math.sqrt(2000), 1);
  const lightness = 70 - intensity * 35;
  return `hsl(28, 95%, ${lightness}%)`;
}
  
const INITIAL_VENUES = [
    {
      id: "cbp",
      name: "Citizens Bank Park",
      xPct: 57,
      yPct: 26,
      count: 10,
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
      name: "Lincoln Financial Park",
      xPct: 45,
      yPct: 80,
      count: 109,
      details: {
        event: "Eagles Open Practice",
        date: "09/20/2025",
        time: "10:00AM EST",
        address: "1 Lincoln Financial Field Way, Philadelphia, PA 19148",
      },
      comments: [
        { id: "c4", author: "Rob", text: "Security lines are moving fast.", upvotes: 42, downvotes: 0, time: "9:05am", replies: [] },
      ],
    },
    {
      id: "monster",
      name: "Monster Jam",
      xPct: 91,
      yPct: 78,
      count: 2,
      details: {
        event: "Monster Jam Qualifiers",
        date: "09/25/2025",
        time: "4:00PM EST",
        address: "3601 S Broad St, Philadelphia, PA 19148",
      },
      comments: [
        { id: "c5", author: "Sam", text: "Crew is still setting up the track.", upvotes: 3, downvotes: 0, time: "3:10pm", replies: [] },
      ],
    },
];

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

function MapExperience({ onSheetVisibilityChange }) {
  const [venues, setVenues] = React.useState(INITIAL_VENUES);
  const [userVotes, setUserVotes] = React.useState({});
  const [selectedVenue, setSelectedVenue] = React.useState(null);
  const [sheetState, setSheetState] = React.useState("closed");

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
        />
      </div>
    </div>
  );
}

function MapStatic({ venues, onSelectVenue }) {
  return (
    <div className="map-wrap">
      <div className="map-static" />
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

function BottomSheet({ venue, state, onStateChange, onClose, onAddComment, onEditComment, onDeleteComment, onAddReply, onVote, userVotes }) {
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
              <button className="icon-btn" aria-label="Save">
                <span className="material-symbols-outlined">bookmark_add</span>
                <span>Save</span>
              </button>
              <button className="icon-btn" aria-label="Alert">
                <span className="material-symbols-outlined">notifications</span>
                <span>Alert</span>
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
