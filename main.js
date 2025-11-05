function App() {
    return (
      <div className="hello">
        Hello World
      </div>
    );
  }
  
  // Mount the app
  const rootEl = document.getElementById('root');
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
  