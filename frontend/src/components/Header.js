import React, { useState } from "react";
import { Link } from "react-router-dom";
import './Header.css';

function Header() {
  const [isNavOpen, setIsNavOpen] = useState(false); 

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
        
      </nav>
    </header>
  );
}

export default Header;
