import React from 'react';
import { Team } from '../types';
import { Shield, User, Flame } from 'lucide-react';
import { TiltCard } from './TiltCard';

interface TeamCardProps {
  team: Team;
}

const TEAM_ACCENTS = ['#2563eb', '#d97706', '#059669', '#e11d48'];

export const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  const accentColor = TEAM_ACCENTS[team.colorIndex % TEAM_ACCENTS.length];

  return (
    <TiltCard maxTilt={6} scale={1.02} className="team-card-3d-wrapper">
      <div className="team-card" style={{ borderTop: `4px solid ${accentColor}` }}>
        <div className="team-card-header">
          <span className="team-name-tag" style={{ color: accentColor }}>
            <Shield size={18} />
            {team.name}
          </span>
          <div className="team-badge-pill" style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}33` }}>
            <Flame size={12} />
            <span>
              {team.players.length === 2
                ? '2v2 Squad'
                : team.players.length === 3
                ? '3-Player Unit'
                : team.players.length === 4
                ? '4-Player Squad'
                : `${team.players.length} Player`}
            </span>
          </div>
        </div>

        <div className="team-players-list">
          {team.players.map((player, idx) => (
            <div key={player.id} className="team-player-pill">
              <div className="player-avatar-mini" style={{ color: accentColor, borderColor: accentColor }}>
                <User size={14} />
              </div>
              <div className="player-info-meta">
                <span className="player-pill-name">{player.name}</span>
                <span className="player-pill-role">Player {idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TiltCard>
  );
};
