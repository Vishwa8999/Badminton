import React from 'react';
import { TournamentViewTab } from '../types';
import { GitBranch, Users2, UserPlus, Shuffle, PlusCircle, Sun, Moon, Volume2, VolumeX, Clapperboard, Trophy } from 'lucide-react';
import { playClick } from '../utils/sound';

interface TournamentControlsProps {
  currentTab: TournamentViewTab;
  onTabChange: (tab: TournamentViewTab) => void;
  onRegenerate: () => void;
  onNewTournament: () => void;
  hasActiveTournament: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onReplaySplash?: () => void;
  isSingleMatch?: boolean;
}

export const TournamentControls: React.FC<TournamentControlsProps> = ({
  currentTab,
  onTabChange,
  onRegenerate,
  onNewTournament,
  hasActiveTournament,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onReplaySplash,
  isSingleMatch = false
}) => {
  const handleTabClick = (tab: TournamentViewTab) => {
    playClick();
    onTabChange(tab);
  };

  return (
    <div className="controls-bar-wrapper">
      <div className="controls-bar">
        {/* Navigation Tabs */}
        <div className="controls-tabs">
          {hasActiveTournament && (
            <>
              <button
                type="button"
                className={`tab-btn btn-3d-tap ${currentTab === 'bracket' ? 'active' : ''}`}
                onClick={() => handleTabClick('bracket')}
              >
                <GitBranch size={16} />
                <span>{isSingleMatch ? 'Showdown' : 'Bracket'}</span>
              </button>
              <button
                type="button"
                className={`tab-btn btn-3d-tap ${currentTab === 'teams' ? 'active' : ''}`}
                onClick={() => handleTabClick('teams')}
              >
                <Users2 size={16} />
                <span>Teams</span>
              </button>
            </>
          )}
          <button
            type="button"
            className={`tab-btn btn-3d-tap ${currentTab === 'setup' ? 'active' : ''}`}
            onClick={() => handleTabClick('setup')}
          >
            <UserPlus size={16} />
            <span>Edit Players</span>
          </button>
          <button
            type="button"
            className={`tab-btn btn-3d-tap ${currentTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('leaderboard')}
          >
            <Trophy size={16} />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Global Utilities: Sound Toggle, Light/Dark Theme Switch */}
        <div className="controls-utility-cluster">
          {/* Replay Funny Intro Splash */}
          {onReplaySplash && (
            <button
              type="button"
              className="util-icon-btn btn-3d-tap"
              onClick={() => {
                playClick();
                onReplaySplash();
              }}
              title="Replay Funny Intro"
              aria-label="Replay Intro"
            >
              <Clapperboard size={16} color="#ec4899" />
            </button>
          )}

          {/* Sound FX Toggle */}
          <button
            type="button"
            className={`util-icon-btn btn-3d-tap ${soundEnabled ? 'active' : ''}`}
            onClick={() => {
              playClick();
              onToggleSound();
            }}
            title={soundEnabled ? 'Mute 8-bit sound effects' : 'Enable 8-bit sound effects'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            className="util-icon-btn theme-toggle btn-3d-tap"
            onClick={() => {
              playClick();
              onToggleTheme();
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Theme Toggle"
          >
            {theme === 'light' ? (
              <Sun size={17} className="sun-icon" />
            ) : (
              <Moon size={17} className="moon-icon" />
            )}
          </button>
        </div>

        {/* Tournament Actions */}
        {hasActiveTournament && (
          <div className="actions-group">
            <button
              type="button"
              className="btn-secondary btn-3d-tap"
              onClick={() => {
                playClick();
                onRegenerate();
              }}
              title="Keep the same 8 players, but create new random teams & matches"
            >
              <Shuffle size={15} />
              <span>Reshuffle</span>
            </button>
            <button
              type="button"
              className="btn-secondary danger btn-3d-tap"
              onClick={() => {
                playClick();
                onNewTournament();
              }}
              title="Reset and enter new player names"
            >
              <PlusCircle size={15} />
              <span>New</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
