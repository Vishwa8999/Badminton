import React from 'react';
import { TournamentFormat } from '../types';
import {
  PRESET_PLAYERS,
  FORMAT_OPTIONS,
  validatePlayerInputs,
  getPresetsForCount
} from '../utils/tournament';
import { Users, Sparkles, AlertCircle, ArrowRight, RotateCcw, Flame, Trophy, Swords, Zap } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { playClick } from '../utils/sound';
import { fetchMembers } from '../utils/firebaseApi';

interface PlayerSetupProps {
  playerCount: number;
  onSelectPlayerCount: (count: number) => void;
  format: TournamentFormat;
  onSelectFormat: (format: TournamentFormat) => void;
  playerNames: string[];
  onChangePlayerName: (index: number, value: string) => void;
  onSetAllPlayers: (names: string[]) => void;
  onGenerateTournament: () => void;
  hasActiveTournament: boolean;
}

const PLAYER_COUNT_CHOICES = [
  { count: 4, label: '4 Players', sub: '2v2 or 1v1' },
  { count: 6, label: '6 Players', sub: '3v3 or 3 Teams' },
  { count: 7, label: '7 Players', sub: '3 vs 4 Clash' },
  { count: 8, label: '8 Players', sub: '2v2 Tournament' }
];

export const PlayerSetup: React.FC<PlayerSetupProps> = ({
  playerCount,
  onSelectPlayerCount,
  format,
  onSelectFormat,
  playerNames,
  onChangePlayerName,
  onSetAllPlayers,
  onGenerateTournament,
  hasActiveTournament
}) => {
  const validation = validatePlayerInputs(playerNames, playerCount);
  const availableFormats = FORMAT_OPTIONS[playerCount] || FORMAT_OPTIONS[8];

  const handleApplyPreset = (key: keyof typeof PRESET_PLAYERS) => {
    playClick();
    onSetAllPlayers(getPresetsForCount(playerCount, key));
  };

  const handleLoadDbMembers = async () => {
    playClick();
    try {
      const members = await fetchMembers();
      if (members && members.length > 0) {
        const names = members.map((m) => m.name);
        if (names.length >= playerCount) {
          onSetAllPlayers(names.slice(0, playerCount));
        } else {
          const fallback = getPresetsForCount(playerCount, 'letters');
          const merged = [...names, ...fallback.slice(names.length)];
          onSetAllPlayers(merged);
        }
      }
    } catch (err) {
      console.error('Failed to load database members:', err);
    }
  };

  const handleClearAll = () => {
    playClick();
    onSetAllPlayers(Array(playerCount).fill(''));
  };

  const currentFormatMeta = availableFormats.find((f) => f.format === format) || availableFormats[0];

  return (
    <TiltCard maxTilt={3} scale={1.006} className="setup-card-3d-wrapper">
      <div className="setup-card">
        {/* Header Area */}
        <div className="section-header">
          <div className="section-title-row">
            <h2 className="section-title">
              <span className="icon-badge-3d cyan">
                <Users size={22} />
              </span>
              Player & Combination Setup
            </h2>
            <div className="badge-drip">
              <Flame size={14} color="#f59e0b" />
              <span>{currentFormatMeta.label}</span>
            </div>
          </div>
          <p className="section-desc">
            Select the number of players and match combination, then enter player names to generate your matchups!
          </p>
        </div>

        {/* Steps Selection Wrapper */}
        <div className="setup-steps-wrapper">
          {/* Step 1: Number of Players */}
          <div className="setup-step-block">
            <div className="setup-step-title">
              <span className="step-num-badge">1</span>
              <span>Select Number of Players</span>
            </div>
            <div className="player-count-chips">
              {PLAYER_COUNT_CHOICES.map((choice) => {
                const isActive = choice.count === playerCount;
                return (
                  <button
                    key={choice.count}
                    type="button"
                    className={`count-chip-btn btn-3d-tap ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      playClick();
                      onSelectPlayerCount(choice.count);
                    }}
                  >
                    <span className="count-chip-number">{choice.count}</span>
                    <span className="count-chip-sub">{choice.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Matchup Combination */}
          <div className="setup-step-block">
            <div className="setup-step-title">
              <span className="step-num-badge">2</span>
              <span>Select Matchup Combination ({playerCount} Players)</span>
            </div>
            <div className="format-cards-grid">
              {availableFormats.map((opt) => {
                const isSelected = opt.format === format;
                return (
                  <button
                    key={opt.format}
                    type="button"
                    className={`format-choice-card btn-3d-tap ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      playClick();
                      onSelectFormat(opt.format);
                    }}
                  >
                    <div className="format-card-top">
                      <span className="format-card-title">
                        {opt.format === '8_player_2v2_bracket' ? (
                          <Trophy size={16} color="#d97706" />
                        ) : opt.format === '7_player_3v4' ? (
                          <Flame size={16} color="#ec4899" />
                        ) : (
                          <Swords size={16} color="#0284c7" />
                        )}
                        {opt.label}
                      </span>
                      <span className="format-card-badge">{opt.badge}</span>
                    </div>
                    <p className="format-card-desc">{opt.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preset Quick-Loads */}
        <div className="presets-container">
          <span className="presets-label">Quick Fill ({playerCount}):</span>
          <button
            type="button"
            className="preset-chip btn-3d-tap"
            onClick={() => handleApplyPreset('letters')}
          >
            🅰️ Letters (A - {String.fromCharCode(64 + playerCount)})
          </button>
          <button
            type="button"
            className="preset-chip btn-3d-tap"
            onClick={() => handleApplyPreset('legends')}
          >
            🎮 Esports Legends
          </button>
          <button
            type="button"
            className="preset-chip btn-3d-tap"
            onClick={() => handleApplyPreset('allStars')}
          >
            ⚽ Football Stars
          </button>
          <button
            type="button"
            className="preset-chip btn-3d-tap"
            onClick={() => handleApplyPreset('casual')}
          >
            👥 Casual Crew
          </button>
          <button
            type="button"
            className="preset-chip btn-3d-tap db-chip"
            onClick={handleLoadDbMembers}
            title="Load registered club members from Firebase"
          >
            🔥 DB Members
          </button>
          <button
            type="button"
            className="preset-chip btn-3d-tap clear-btn"
            style={{ marginLeft: 'auto' }}
            onClick={handleClearAll}
          >
            <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
            Clear
          </button>
        </div>

        {/* Dynamic Player Input Fields (Exact count) */}
        <div className="players-grid">
          {playerNames.map((name, index) => {
            const hasError = !!validation.fieldErrors[index];
            return (
              <div key={index} className="input-field-wrapper">
                <div className="input-field-label">
                  <span>Player {index + 1}</span>
                  {hasError && (
                    <span className="input-error-msg">{validation.fieldErrors[index]}</span>
                  )}
                </div>
                <div className={`player-input-box ${hasError ? 'error' : ''} ${name.trim() ? 'filled' : ''}`}>
                  <span className="player-number-badge">{index + 1}</span>
                  <input
                    type="text"
                    className="player-input"
                    placeholder={`e.g. Player ${String.fromCharCode(65 + index)}`}
                    value={name}
                    maxLength={24}
                    onChange={(e) => onChangePlayerName(index, e.target.value)}
                  />
                  {name.trim() && (
                    <span className="player-check-icon">✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Footer & Generate Button */}
        <div className="setup-footer">
          <div className={`validation-status ${validation.isValid ? 'ready' : 'invalid'}`}>
            {validation.isValid ? (
              <>
                <Sparkles size={16} className="spin-slow" />
                <span>Ready! {playerCount} players set for {currentFormatMeta.label}.</span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span>{validation.globalError || `Fill all ${playerCount} unique player names.`}</span>
              </>
            )}
          </div>

          <button
            type="button"
            className="btn-primary btn-generate-3d"
            disabled={!validation.isValid}
            onClick={() => {
              playClick();
              onGenerateTournament();
            }}
          >
            <Zap size={18} />
            <span>
              {hasActiveTournament ? `Reshuffle & Generate (${playerCount}P)` : `Generate ${currentFormatMeta.label}`}
            </span>
            <ArrowRight size={18} className="arrow-bounce" />
          </button>
        </div>
      </div>
    </TiltCard>
  );
};
