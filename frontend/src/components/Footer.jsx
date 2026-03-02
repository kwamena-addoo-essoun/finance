import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2026 Finsight. All rights reserved.</p>
        <p className="footer-legal-links">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span className="footer-sep">·</span>
          <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
