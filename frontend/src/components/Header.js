import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import './Header.css';

function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false); 
  const [hasActiveShift, setHasActiveShift] = useState(false);

  useEffect(() => {
    const checkActiveShift = () => {
      const active = localStorage.getItem("activeShift");
      setHasActiveShift(!!active);
    };

    checkActiveShift(); // initial check

    // Listen for storage changes (in case user has multiple tabs)
    window.addEventListener("storage", checkActiveShift);

    // Optional: check periodically (in case localStorage changes within same tab)
    const interval = setInterval(checkActiveShift, 2000);

    return () => {
      window.removeEventListener("storage", checkActiveShift);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="site-brand">
        <Link to="/" className="brand-link">Night Shift Tracker</Link>
      </div>

      <button
        className={`burger ${isNavOpen ? "open" : ""}`} 
        onClick={() => setIsNavOpen(!isNavOpen)}         
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`site-nav ${isNavOpen ? "open" : ""}`}> 
        <Link to="/" className="nav-item" onClick={() => setIsNavOpen(false)}>Home</Link>
        <Link to="/shifts" className="nav-item" onClick={() => setIsNavOpen(false)}>Shifts</Link>
        {hasActiveShift && (
          <Link to="/monitor" className="nav-item" onClick={() => setIsNavOpen(false)}>
            Shift Monitor
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;
