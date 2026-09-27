import React from 'react';
import { Match, Team } from '../types';
import { CheckCircle2, Trophy, Swords, XCircle, Flame, Sparkles } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { playClick, playFanfare } from '../utils/sound';

interface MatchCardProps {
  match: Match;
  onSelectWinner: (matchId: string, teamId: string) => void;
  isFinal?: boolean;
}

const TEAM_ACCENTS = ['#2563eb', '#d97706', '#059669', '#e11d48'];

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onSelectWinner,
  isFinal = false
}) => {
  const isDecided = !!match.winnerId;

  const handleWinnerClick = (matchId: string, teamId: string) => {
    if (isFinal) {
      playFanfare();
    } else {
      playClick();
    }
    onSelectWinner(matchId, teamId);
  };

  const renderTeamRow = (team: Team, otherTeam: Team) => {
    const isWinner = match.winnerId === team.id;
    const isLoser = match.winnerId === otherTeam.id;
    const accentColor = TEAM_ACCENTS[team.colorIndex % TEAM_ACCENTS.length];

    let rowClass = 'match-team-row';
    if (isWinner) rowClass += ' is-winner';
    if (isLoser) rowClass += ' is-loser';

    return (
      <div className={rowClass}>
        <div className="team-info-left">
          <div className="team-title-row">
            <span
              className="team-indicator-dot"
              style={{ backgroundColor: accentColor }}
            />
            <span className="team-title-text" style={{ color: isWinner ? '#059669' : undefined }}>
              {team.name}
            </span>
            {isWinner && (
              <span className="winner-crown-mini">👑</span>
            )}
          </div>
          <div className="team-roster-text">
            {team.players.map((p, idx) => (
              <React.Fragment key={p.id}>
                {idx > 0 && <span className="roster-plus">&</span>}
                <span className="roster-player">{p.name}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="team-action-right">
          {isWinner ? (
            <span className="status-tag won">
              <CheckCircle2 size={16} />
              Winner
            </span>
          ) : isLoser ? (
            <span className="status-tag eliminated">
              <XCircle size={14} style={{ display: 'inline', marginRight: 3 }} />
              Out
            </span>
          ) : (
            <button
              type="button"
              className={`btn-select-winner btn-3d-tap ${isFinal || match.round === 'showdown' ? 'btn-gold' : ''}`}
              onClick={() => handleWinnerClick(match.id, team.id)}
            >
              {isFinal || match.round === 'showdown' ? <Trophy size={14} /> : <CheckCircle2 size={14} />}
              <span>Pick Winner</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <TiltCard maxTilt={5} scale={1.015} className={`match-card-3d-container ${isFinal || match.round === 'showdown' ? 'is-final-match' : ''}`}>
      <div className={`match-card ${isDecided ? 'decided' : ''} ${isFinal || match.round === 'showdown' ? 'is-final' : ''}`}>
        <div className="match-card-header">
          <div className="match-header-title">
            {match.round === 'showdown' ? (
              <span className="final-header-badge" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(245,158,11,0.2))', borderColor: 'rgba(236,72,153,0.3)', color: '#ec4899' }}>
                <Flame size={14} color="#ec4899" />
                Championship Showdown Match
              </span>
            ) : isFinal ? (
              <span className="final-header-badge">
                <Trophy size={14} color="#d97706" />
                Grand Championship Final
              </span>
            ) : (
              <span className="semi-header-badge">
                <Swords size={13} />
                Semifinal {match.matchNumber}
              </span>
            )}
          </div>
          {isDecided ? (
            <span className="match-status-badge winner-badge">
              <CheckCircle2 size={12} />
              Completed
            </span>
          ) : (
            <span className="match-status-badge live-badge">
              <Flame size={12} color="#f59e0b" />
              Live Match
            </span>
          )}
        </div>

        <div className="match-teams-container">
          {renderTeamRow(match.teamA, match.teamB)}
          <div className="vs-divider">
            <span className="vs-sparkle">⚔️</span>
            <span>VS</span>
            <span className="vs-sparkle">⚔️</span>
          </div>
          {renderTeamRow(match.teamB, match.teamA)}
        </div>

        {isFinal && !isDecided && (
          <div className="final-championship-hint">
            <Sparkles size={13} color="#d97706" />
            <span>Select the champion to trigger the victory celebration!</span>
          </div>
        )}
      </div>
    </TiltCard>
  );
};
