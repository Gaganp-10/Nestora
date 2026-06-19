import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/Footer.css'

const CITIES = [
  { name: 'Bangalore', emoji: '🌆' },
  { name: 'Mumbai', emoji: '🌊' },
  { name: 'Pune', emoji: '🏔️' },
  { name: 'Hyderabad', emoji: '💎' },
  { name: 'Chennai', emoji: '🌴' },
  { name: 'Delhi', emoji: '🏛️' },
]

/**
 * Footer — site-wide footer with links, cities, and contact info
 */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">🏠</div>
              <span className="footer-logo-text">Nestora</span>
            </Link>
            <p className="footer-tagline">
              India's most trusted PG & hostel finder. Discover verified accommodations
              near your college, filter by your needs, and connect directly with owners.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link" aria-label="Facebook">📘</a>
              <a href="#" className="footer-social-link" aria-label="Instagram">📷</a>
              <a href="#" className="footer-social-link" aria-label="Twitter">🐦</a>
              <a href="#" className="footer-social-link" aria-label="LinkedIn">💼</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">🏡 Home</Link>
              </li>
              <li>
                <Link to="/browse" className="footer-link">🔍 Browse Hostels</Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">➕ List Your Property</Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">🔑 Owner Login</Link>
              </li>
            </ul>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="footer-col-title">Popular Cities</h4>
            <div className="footer-cities">
              {CITIES.map((city) => (
                <Link
                  key={city.name}
                  to={`/browse?city=${city.name}`}
                  className="footer-city"
                >
                  {city.emoji} {city.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-col-title">Contact Us</h4>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📍</span>
              <span className="footer-contact-text">123 Tech Park, Bangalore, Karnataka 560001</span>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📧</span>
              <span className="footer-contact-text">support@nestora.in</span>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📞</span>
              <span className="footer-contact-text">+91 98765 43210</span>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">🕒</span>
              <span className="footer-contact-text">Mon–Sat, 9AM – 6PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Nestora Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">Privacy Policy</a>
            <a href="#" className="footer-bottom-link">Terms of Service</a>
            <a href="#" className="footer-bottom-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
