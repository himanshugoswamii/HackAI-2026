import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FONT_CURSIVE } from '../theme';

export default function WelcomePage() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="welcome-page">
      <div className="welcome-bg" />
      <div className="welcome-overlay" />
      <div className="welcome-doodles-top">
        <span>👠</span>
        <span>☕</span>
        <span>👓</span>
      </div>

      <div
        className="welcome-content"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.96)',
        }}
      >
        <div className="welcome-logo-row">
          <span>👜</span>
          <h1 style={{ fontFamily: `${FONT_CURSIVE}, cursive` }}>Neural Threads</h1>
          <span>✨</span>
        </div>
        <p className="welcome-tagline">Your style, simplified.</p>
        <div className="welcome-scribble" />
        <p className="welcome-message">
          Dress with confidence. Let AI help you choose what to wear and what to let go.
        </p>
        <p className="welcome-thats-all" style={{ fontFamily: `${FONT_CURSIVE}, cursive` }}>
          That&apos;s all.
        </p>
      </div>

      <div className="welcome-footer" style={{ opacity: visible ? 1 : 0 }}>
        <div className="welcome-doodles-bottom">
          <span>📸</span>
          <span>✨</span>
        </div>
        <button
          type="button"
          className="welcome-button"
          onClick={() => navigate('/app-info')}
        >
          Get started
        </button>
      </div>
    </div>
  );
}
