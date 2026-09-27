import React, { useEffect } from 'react';
import { Team } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, RefreshCw, PlusCircle, Crown, Flame } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { playFanfare, playClick } from '../utils/sound';

interface ChampionDisplayProps {
  champion: Team;
  onRegenerate: () => void;
  onNewTournament: () => void;
}

export const ChampionDisplay: React.FC<ChampionDisplayProps> = ({
  champion,
  onRegenerate,
  onNewTournament
}) => {
  useEffect(() => {
    // Play victory fanfare sound
    playFanfare();

    // Fire fireworks confetti
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#f59e0b', '#0284c7', '#10b981', '#ec4899', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [champion.id]);

  return (
    <TiltCard maxTilt={5} scale={1.015} className="champion-tilt-container">
      <div className="champion-celebration-container">
        {/* Animated glowing rays in background */}
        <div className="champion-sunburst" />

        <div className="champion-trophy-pedestal">
          <div className="trophy-glow-halo" />
          <Trophy className="trophy-hero-icon trophy-animated-float" />
          <div className="crown-badge-floating">
            <Crown size={20} color="#f59e0b" />
          </div>
        </div>

        <div>
          <span className="champion-tag">
            <Sparkles size={16} className="spin-slow" />
            <span>Tournament Champions</span>
            <Flame size={16} color="#d97706" />
          </span>
        </div>

        <h1 className="champion-team-name">{champion.name}</h1>

        <div className="champion-players-badge">
          <span className="champ-star">★</span>
          <span className="champ-names">{champion.players.map(p => p.name).join(' & ')}</span>
          <span className="champ-star">★</span>
        </div>

        <p className="champion-cheer">
          Congratulations to the champions! Maximum glory and supreme bragging rights unlocked! 🔥
        </p>

        <div className="champion-actions">
          <button
            type="button"
            className="btn-primary btn-3d-tap"
            onClick={() => {
              playClick();
              onRegenerate();
            }}
          >
            <RefreshCw size={16} />
            <span>Rematch (Reshuffle Teams)</span>
          </button>
          <button
            type="button"
            className="btn-secondary btn-3d-tap"
            onClick={() => {
              playClick();
              onNewTournament();
            }}
          >
            <PlusCircle size={16} />
            <span>New Tournament (New Players)</span>
          </button>
        </div>
      </div>
    </TiltCard>
  );
};
