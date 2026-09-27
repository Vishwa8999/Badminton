import React from 'react';
import { Team } from '../types';
import { TeamCard } from './TeamCard';
import { Users2, Shuffle, ArrowRight } from 'lucide-react';
import { playClick } from '../utils/sound';

interface TeamListProps {
  teams: Team[];
  onRegenerate: () => void;
  onGoToBracket: () => void;
}

export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onRegenerate,
  onGoToBracket
}) => {
  return (
    <div className="teams-section">
      <div className="section-header team-list-header">
        <div>
          <h2 className="section-title">
            <span className="icon-badge-3d gold">
              <Users2 size={22} />
            </span>
            Random 2-Player Teams
          </h2>
          <p className="section-desc">
            All 8 players have been randomly shuffled into 4 balanced 2-player squads.
          </p>
        </div>

        <div className="actions-group">
          <button
            type="button"
            className="btn-secondary btn-3d-tap"
            onClick={() => {
              playClick();
              onRegenerate();
            }}
          >
            <Shuffle size={16} />
            Reshuffle Teams
          </button>
          <button
            type="button"
            className="btn-primary btn-3d-tap"
            onClick={() => {
              playClick();
              onGoToBracket();
            }}
          >
            <span>View Bracket & Matches</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="teams-grid">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
};
