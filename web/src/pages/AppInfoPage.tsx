import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CREAM, TEXT_PRIMARY, TEXT_MUTED, BORDER, FONT_CURSIVE, CARD_BG } from '../theme';
import { useUser } from '../contexts/UserContext';

const GENDER_OPTIONS = ['Woman', 'Man', 'Non-binary'] as const;

const steps = [
  { icon: '👔', title: 'Wardrobe', desc: 'Add your clothes with a photo—AI classifies each item. Browse your digital closet in a clean grid.' },
  { icon: '✨', title: 'Stylist', desc: 'Ask "What should I wear?" Pick your style and get top 3 outfit suggestions with photos and reasons.' },
  { icon: '🤔', title: 'Do I need this?', desc: 'Check if you have a similar item and then decide if you really need this!', route: '/do-i-need-this' },
  { icon: '🧹', title: 'Declutter', desc: 'See in-season pieces you haven\'t worn lately. Get friendly suggestions on what to donate.' },
];

export default function AppInfoPage() {
  const navigate = useNavigate();
  const { setOnboardingProfile } = useUser();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<string | null>(null);

  const onGoToApp = () => {
    if (name.trim()) setOnboardingProfile(name, gender || '');
    navigate('/app', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: CREAM }}>
      <div style={{ padding: '32px 24px 48px', maxWidth: 480, margin: '0 auto' }}>
        <div
          style={{
            marginBottom: 28,
            padding: '20px 16px',
            backgroundColor: CARD_BG,
            borderRadius: 16,
            border: `1px solid ${BORDER}`,
          }}
        >
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            style={{
              width: '100%',
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 16,
              color: TEXT_PRIMARY,
              backgroundColor: CREAM,
            }}
          />
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_MUTED, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Gender
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setGender(opt)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: `1px solid ${gender === opt ? TEXT_PRIMARY : BORDER}`,
                  backgroundColor: gender === opt ? TEXT_PRIMARY : CREAM,
                  color: gender === opt ? CREAM : TEXT_PRIMARY,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: `${FONT_CURSIVE}, cursive`, fontSize: 32, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: 0.3, lineHeight: 1.25, marginBottom: 12 }}>
            Your smarter closet awaits
          </h2>
          <p style={{ fontSize: 15, color: TEXT_MUTED, lineHeight: 1.5, maxWidth: 300 }}>
            Discover what to wear and what to let go—powered by AI.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          {steps.map((step, i) => {
            const isTouchable = 'route' in step && step.route;
            const content = (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: CARD_BG,
                  borderRadius: 20,
                  minHeight: 100,
                  border: `1px solid ${BORDER}`,
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: 80, height: 80, margin: 16, borderRadius: 16, backgroundColor: CREAM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1, padding: '16px 20px 16px 0' }}>
                  <h3 style={{ fontFamily: `${FONT_CURSIVE}, cursive`, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 6px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
            if (isTouchable && step.route) {
              return (
                <Link key={i} to={step.route} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {content}
                </Link>
              );
            }
            return <div key={i}>{content}</div>;
          })}
        </div>

        <button
          type="button"
          onClick={onGoToApp}
          style={{
            width: '100%',
            backgroundColor: TEXT_PRIMARY,
            color: CREAM,
            padding: '18px 28px',
            borderRadius: 14,
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 0.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Go to app
          <span> &gt;&gt;</span>
        </button>
      </div>
    </div>
  );
}
