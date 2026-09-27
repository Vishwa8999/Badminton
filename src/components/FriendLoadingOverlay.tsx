import React, { useState, useEffect } from 'react';
import friendImg from '../assets/friend.jpg';
import { playBoing } from '../utils/sound';
import { Sparkles, Trophy } from 'lucide-react';

interface FriendLoadingOverlayProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  isAutoDismiss?: boolean;
  durationMs?: number;
  customTitle?: string;
}

const BADMINTON_LOADING_STEPS = [
  { progress: 15, text: "Testing shuttlecock speed & feathers... 🏸" },
  { progress: 40, text: "Checking racket string tension & grip... ⚡" },
  { progress: 70, text: "Forming balanced badminton doubles teams... 🤝" },
  { progress: 90, text: "Calibrating smash angles & net drops... 💥" },
  { progress: 100, text: "Court ready! Match point awaits! 🏆" }
];

export const FriendLoadingOverlay: React.FC<FriendLoadingOverlayProps> = ({
  isOpen,
  onClose,
  onComplete,
  durationMs = 2400,
  customTitle
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState(BADMINTON_LOADING_STEPS[0].text);
  const [isWobbling, setIsWobbling] = useState(false);

  // Loading progress calculation & auto complete
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      const matchingStep = [...BADMINTON_LOADING_STEPS].reverse().find((s) => pct >= s.progress);
      if (matchingStep) {
        setCurrentStepText(matchingStep.text);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) onComplete();
          if (onClose) onClose();
        }, 250);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, durationMs, onComplete, onClose]);

  if (!isOpen) return null;

  const handleFaceClick = () => {
    playBoing();
    setIsWobbling(true);
    setTimeout(() => setIsWobbling(false), 500);
  };

  return (
    <div className="friend-loading-modal-backdrop">
      <div className="badminton-spinner-card">
        {/* Badminton Tournament Tag */}
        <div className="friend-tag-badge">
          <Sparkles size={14} className="spin-slow" />
          <span>{customTitle || "BADMINTON TOURNAMENT SHUFFLER"}</span>
          <Trophy size={14} color="#f59e0b" />
        </div>

        {/* Animated Badminton Spinner with Friend's Face */}
        <div className="badminton-spinner-stage">
          {/* Orbiting Shuttlecock on Circular Path */}
          <div className="shuttlecock-orbit-path">
            <span className="orbiting-shuttlecock">🏸</span>
          </div>

          {/* Continuous Spinning Gradient Ring */}
          <div className="spinner-gradient-ring" />

          {/* Rotating Dashed Accent Ring */}
          <div className="spinner-dashed-ring" />

          {/* Friend Face Avatar Container */}
          <div
            className={`friend-photo-spinner ${isWobbling ? 'wobble-click' : ''}`}
            onClick={handleFaceClick}
            title="Tap for smash boost!"
          >
            <img
              src={friendImg}
              alt="Badminton Organizer"
              className="friend-avatar-spinner-img"
            />
          </div>
        </div>

        {/* Dynamic English Loading Message */}
        <div className="loading-status-area">
          <p className="loading-step-msg">{currentStepText}</p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="progress-section">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-meta">
            <span className="progress-label">Preparing Matchups</span>
            <span className="progress-pct">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
