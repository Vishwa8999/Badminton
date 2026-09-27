import React from 'react';
import { Team, Tournament } from '../types';
import { MatchCard } from './MatchCard';
import { ChampionDisplay } from './ChampionDisplay';
import { Trophy, Swords, Lock, Sparkles } from 'lucide-react';
import { TiltCard } from './TiltCard';

interface TournamentBracketProps {
  tournament: Tournament;
  onSelectWinner: (matchId: string, teamId: string) => void;
  onRegenerate: () => void;
  onNewTournament: () => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onSelectWinner,
  onRegenerate,
  onNewTournament
}) => {
  // Find champion team object if championId exists
  const championTeam: Team | undefined = tournament.championId
    ? tournament.teams.find((t) => t.id === tournament.championId)
    : undefined;

  // Single Showdown Match Layout (e.g. 7-Player 3v4, 4-Player 2v2, 6-Player 3v3, 8-Player 4v4)
  if (tournament.singleMatch) {
    const singleMatch = tournament.singleMatch;
    return (
      <div className="bracket-wrapper showdown-wrapper">
        {championTeam && (
          <ChampionDisplay
            champion={championTeam}
            onRegenerate={onRegenerate}
            onNewTournament={onNewTournament}
          />
        )}

        <div className="showdown-stage-container" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
          <div className="column-title-bar" style={{ marginBottom: '1.25rem' }}>
            <span className="column-title" style={{ fontSize: '1.25rem' }}>
              <span className="icon-badge-3d gold mini">
                <Trophy size={18} />
              </span>
              {tournament.format === '7_player_3v4'
                ? '🔥 3 vs 4 Championship Showdown'
                : tournament.format === '4_player_2v2'
                ? '⚔️ 2 vs 2 Head-to-Head Clash'
                : '🏆 Championship Showdown'}
            </span>
            <span className={`column-status ${singleMatch.winnerId ? 'completed' : 'active'}`}>
              {singleMatch.winnerId ? '🏆 Champion Decided' : '⚡ 1 Winner Takes All'}
            </span>
          </div>

          <MatchCard
            match={singleMatch}
            onSelectWinner={onSelectWinner}
            isFinal={true}
          />

          <div className="bracket-info-card" style={{ marginTop: '1.5rem' }}>
            <div className="info-card-icon">
              <Sparkles size={18} color="#d97706" />
            </div>
            <div className="info-card-text">
              <strong>Showdown Clash Rules:</strong>
              <p>
                {tournament.format === '7_player_3v4'
                  ? '7 players randomly split into 3 vs 4! Pick the winning team to crown the champions.'
                  : 'Teams face off head-to-head in this ultimate match! Click "Pick Winner" to crown the champion.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Bracket Layout (Original untouched 8-player 2v2 and 4-player 1v1)
  const [semi1, semi2] = tournament.semifinals!;
  const finalMatch = tournament.final;
  const bothSemisDecided = !!(semi1.winnerId && semi2.winnerId);

  return (
    <div className="bracket-wrapper">
      {/* Champion Hero celebration banner if crowned */}
      {championTeam && (
        <ChampionDisplay
          champion={championTeam}
          onRegenerate={onRegenerate}
          onNewTournament={onNewTournament}
        />
      )}

      {/* Main Bracket Columns */}
      <div className="bracket-rounds-container">
        {/* Column 1: Semifinals */}
        <div className="bracket-column">
          <div className="column-title-bar">
            <span className="column-title">
              <span className="icon-badge-3d cyan mini">
                <Swords size={16} />
              </span>
              Round 1: Semifinals
            </span>
            <span
              className={`column-status ${
                bothSemisDecided ? 'completed' : 'active'
              }`}
            >
              {bothSemisDecided ? '✓ Completed (2/2)' : 'Select 2 Winners'}
            </span>
          </div>

          <div className="semifinals-matches-stack">
            <MatchCard match={semi1} onSelectWinner={onSelectWinner} />
            
            {/* Visual battle separator between Semi 1 and Semi 2 */}
            <div className="bracket-match-spacer">
              <span className="spacer-line" />
              <span className="spacer-label">2v2 Elimination</span>
              <span className="spacer-line" />
            </div>

            <MatchCard match={semi2} onSelectWinner={onSelectWinner} />
          </div>
        </div>

        {/* Column 2: Championship Final */}
        <div className="bracket-column">
          <div className="column-title-bar">
            <span className="column-title">
              <span className="icon-badge-3d gold mini">
                <Trophy size={16} />
              </span>
              Round 2: Championship Final
            </span>
            <span
              className={`column-status ${
                tournament.championId
                  ? 'completed'
                  : bothSemisDecided
                  ? 'active'
                  : ''
              }`}
            >
              {tournament.championId
                ? '🏆 Champion Crowned'
                : bothSemisDecided
                ? '🔥 Match Ready'
                : '🔒 Locked'}
            </span>
          </div>

          {bothSemisDecided && finalMatch ? (
            <div className="final-match-wrapper">
              <MatchCard
                match={finalMatch}
                onSelectWinner={onSelectWinner}
                isFinal={true}
              />
            </div>
          ) : (
            <TiltCard maxTilt={4} scale={1.01} className="locked-card-tilt-wrap">
              <div className="final-locked-card">
                <div className="lock-icon-circle">
                  <Lock size={28} className="lock-icon-animated" />
                </div>
                <h4 className="locked-card-title">Championship Match Locked</h4>
                <p className="locked-card-desc">
                  Select the winner from both <strong>Semifinal 1</strong> and <strong>Semifinal 2</strong> on the left to advance the two finalists!
                </p>
                <div className="locked-indicator-steps">
                  <span className={`step-dot ${semi1.winnerId ? 'done' : ''}`}>
                    Semi 1: {semi1.winnerId ? '✓ Ready' : 'Pending'}
                  </span>
                  <span className="step-arrow">→</span>
                  <span className={`step-dot ${semi2.winnerId ? 'done' : ''}`}>
                    Semi 2: {semi2.winnerId ? '✓ Ready' : 'Pending'}
                  </span>
                </div>
              </div>
            </TiltCard>
          )}

          {/* Quick info tip card */}
          <div className="bracket-info-card">
            <div className="info-card-icon">
              <Sparkles size={18} color="#d97706" />
            </div>
            <div className="info-card-text">
              <strong>Single-Elimination Rules:</strong>
              <p>4 teams, 2 semifinals, 1 grand final. Click "Pick Winner" on either team to immediately advance them to the championship!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
