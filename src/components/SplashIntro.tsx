import React, { useState, useEffect } from 'react';
import friendImg from '../assets/friend.jpg';
import { playBoing, playSlideWhistleUp, playRoyalIntro, playClick } from '../utils/sound';
import { Sparkles, ArrowRight, Flame, Volume2, VolumeX, Crown, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SplashIntroProps {
  onEnter: () => void;
}

const BADMINTON_ROASTS = [
  "Serving straight into the net like a true champion! 🏸",
  "My smash is faster than your Wi-Fi! Watch your head! 💥",
  "Drop shots so weak even the net cord felt bad for you! 🏸",
  "Badminton rule #1: Look stylish with shades, even when missing the birdie! 😎",
  "You call that a clear? That was an invitation for a jump smash! ⚡",
  "Deuce or no deuce, my racket decides who takes the championship! 🏆",
  "Pink court aura + cooling glasses = 100% unbeatable badminton swag! 🔥"
];

export const SplashIntro: React.FC<SplashIntroProps> = ({ onEnter }) => {
  const [animationStage, setAnimationStage] = useState<'loading' | 'emerging' | 'landed'>('loading');
  const [roastIndex, setRoastIndex] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [isWobbling, setIsWobbling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Stage 1: Comical emergence
    const t1 = setTimeout(() => {
      setAnimationStage('emerging');
      if (!isMuted) playSlideWhistleUp();
    }, 350);

    // Stage 2: Dramatic comedic landing & fanfare
    const t2 = setTimeout(() => {
      setAnimationStage('landed');
      if (!isMuted) playRoyalIntro();

      // Confetti burst on entrance!
      confetti({
        particleCount: 45,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#0284c7', '#ec4899', '#10b981']
      });
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isMuted]);

  const handleFaceClick = () => {
    if (!isMuted) playBoing();
    setClickCount((prev) => prev + 1);
    setIsWobbling(true);
    const nextIndex = (roastIndex + 1) % BADMINTON_ROASTS.length;
    setRoastIndex(nextIndex);
    setTimeout(() => setIsWobbling(false), 500);

    // Confetti pop
    confetti({
      particleCount: 25,
      spread: 55,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#ec4899', '#0284c7']
    });
  };

  const handleEnterClick = () => {
    playClick();
    onEnter();
  };

  return (
    <div className="splash-screen-backdrop">
      {/* Dynamic comic rays in background */}
      <div className="splash-comic-burst" />

      {/* Floating badminton & swag stickers */}
      <div className="floating-emoji float-1">🏸</div>
      <div className="floating-emoji float-2">⚡</div>
      <div className="floating-emoji float-3">💥</div>
      <div className="floating-emoji float-4">🏆</div>

      <div className="splash-content-card">
        {/* Top Controls Bar */}
        <div className="splash-top-bar">
          <span className="splash-alert-tag">
            <ShieldAlert size={13} />
            <span>Chief Badminton Overlord</span>
          </span>
          <button
            type="button"
            className="splash-sound-btn"
            onClick={() => {
              setIsMuted(!isMuted);
            }}
            title={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
            aria-label="Sound Toggle"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>

        {/* Dramatic Friend Photo Presentation */}
        <div className="splash-stage">
          <div
            className={`splash-photo-podium ${
              animationStage === 'emerging'
                ? 'stage-emerging'
                : animationStage === 'landed'
                ? 'stage-landed'
                : 'stage-hidden'
            } ${isWobbling ? 'wobble-click' : ''}`}
            onClick={handleFaceClick}
            title="Tap the Smash Master!"
          >
            {/* Crown Meme */}
            <div className="splash-crown">
              <Crown size={30} color="#f59e0b" />
            </div>

            {/* Glowing Aura Rings */}
            <div className="splash-ring ring-outer" />
            <div className="splash-ring ring-pink" />

            {/* Friend Photo */}
            <img
              src={friendImg}
              alt="Badminton Smash Master"
              className="splash-friend-img"
            />

            {/* Bling chain */}
            <div className="splash-chain">
              🏸 BADMINTON MASTER 🥇
            </div>
          </div>

          <div className="splash-tap-callout">
            <span>👉 Tap to test reflexes! ({clickCount} smashes) 👈</span>
          </div>
        </div>

        {/* Dramatic Badminton Title */}
        <div className="splash-title-area">
          <h2 className="splash-boss-title">
            <span className="splash-overlord-text">Badminton Master</span>
            <span className="splash-sub-text">CHIEF SHUTTLECOCK OVERLORD</span>
          </h2>
          <div className="pink-wall-badge">
            <Flame size={13} color="#ec4899" />
            <span>Pink Court • Cooling Glass Power</span>
            <Sparkles size={13} color="#f59e0b" />
          </div>
        </div>

        {/* Funny Badminton Speech Roast Bubble */}
        <div className="splash-speech-bubble" onClick={handleFaceClick}>
          <p className="splash-speech-quote">"{BADMINTON_ROASTS[roastIndex]}"</p>
          <div className="splash-speech-note">— Court Wisdom (Tap to swap quote)</div>
        </div>

        {/* Primary Enter Button */}
        <button
          type="button"
          className="btn-primary btn-splash-enter btn-3d-tap"
          onClick={handleEnterClick}
        >
          <span>ENTER BADMINTON ARENA</span>
          <ArrowRight size={17} className="arrow-bounce" />
        </button>

        <p className="splash-disclaimer">
          Fair Play • Golden Rackets • Zero Net Faults! 🏸🔥
        </p>
      </div>
    </div>
  );
};

