import { useState, useEffect } from 'react';
import { Tournament, TournamentFormat, TournamentViewTab } from './types';
import {
  createTournament,
  regenerateTournament,
  setMatchWinner,
  FORMAT_OPTIONS,
  getPresetsForCount
} from './utils/tournament';
import { PlayerSetup } from './components/PlayerSetup';
import { TeamList } from './components/TeamList';
import { TournamentBracket } from './components/TournamentBracket';
import { TournamentControls } from './components/TournamentControls';
import { LeaderboardView } from './components/LeaderboardView';
import { FriendLoadingOverlay } from './components/FriendLoadingOverlay';
import { SplashIntro } from './components/SplashIntro';
import { Trophy, Globe, Sparkles } from 'lucide-react';
import { setSoundEnabled, playShuffle } from './utils/sound';
import { recordMatchResult, syncClubMembers } from './utils/firebaseApi';

const STORAGE_KEY_PLAYERS = 'rtt_players_v1';
const STORAGE_KEY_TOURNAMENT = 'rtt_tournament_v1';
const STORAGE_KEY_THEME = 'rtt_theme_v1';
const STORAGE_KEY_SOUND = 'rtt_sound_v1';
const STORAGE_KEY_COUNT = 'rtt_count_v1';
const STORAGE_KEY_FORMAT = 'rtt_format_v1';

export function App() {
  // Theme state: defaults to 'light' as requested!
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Fallback
    }
    return 'light';
  });

  // Sound state
  const [soundEnabled, setSoundState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      if (saved !== null) return saved === 'true';
    } catch {
      // Fallback
    }
    return true;
  });

  // Initial Funny Splash Screen: Shows on initial load
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Player count selection (default: 8)
  const [playerCount, setPlayerCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNT);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([4, 6, 7, 8].includes(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return 8;
  });

  // Matchup format selection (default: '8_player_2v2_bracket')
  const [format, setFormat] = useState<TournamentFormat>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FORMAT);
      if (saved) return saved as TournamentFormat;
    } catch {
      // Fallback
    }
    return '8_player_2v2_bracket';
  });

  // Loading state with friend photo during team shuffle
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingCustomTitle, setLoadingCustomTitle] = useState<string>('SHUFFLING BADMINTON SQUADS');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Player Names state
  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === playerCount) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return getPresetsForCount(playerCount, 'letters');
  });

  // Tournament state
  const [tournament, setTournament] = useState<Tournament | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOURNAMENT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.players && parsed.teams) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<TournamentViewTab>(() => {
    return tournament ? 'bracket' : 'setup';
  });

  // Sync theme with HTML data attribute and storage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Sync sound setting
  useEffect(() => {
    setSoundEnabled(soundEnabled);
    try {
      localStorage.setItem(STORAGE_KEY_SOUND, soundEnabled.toString());
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // Sync player count and format to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COUNT, playerCount.toString());
      localStorage.setItem(STORAGE_KEY_FORMAT, format);
    } catch {
      // Ignore
    }
  }, [playerCount, format]);

  // Save player names to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(playerNames));
    } catch {
      // Ignore
    }
  }, [playerNames]);

  // Save tournament to localStorage
  useEffect(() => {
    try {
      if (tournament) {
        localStorage.setItem(STORAGE_KEY_TOURNAMENT, JSON.stringify(tournament));
      } else {
        localStorage.removeItem(STORAGE_KEY_TOURNAMENT);
      }
    } catch {
      // Ignore
    }
  }, [tournament]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSound = () => {
    setSoundState((prev) => !prev);
  };

  const handleSelectPlayerCount = (newCount: number) => {
    setPlayerCount(newCount);

    // Update format to the recommended choice for this count
    const available = FORMAT_OPTIONS[newCount];
    const nextFormat = available ? available[0].format : '8_player_2v2_bracket';
    setFormat(nextFormat);

    // Adjust player names array
    setPlayerNames((prev) => {
      if (prev.length === newCount) return prev;
      if (prev.length < newCount) {
        const extra = getPresetsForCount(newCount, 'letters').slice(prev.length);
        return [...prev, ...extra];
      }
      return prev.slice(0, newCount);
    });
  };

  const handleSelectFormat = (newFormat: TournamentFormat) => {
    setFormat(newFormat);
  };

  const handlePlayerNameChange = (index: number, value: string) => {
    setPlayerNames((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSetAllPlayers = (names: string[]) => {
    setPlayerNames(names);
  };

  // Trigger tournament creation with Friend Loading screen
  const handleGenerateTournament = () => {
    playShuffle();
    // Asynchronously sync player names to Firebase database
    syncClubMembers(playerNames).catch((err) => console.error('Failed to sync members to Firebase:', err));

    setLoadingCustomTitle('SHUFFLING BADMINTON DOUBLES SQUADS');
    setPendingAction(() => () => {
      const newTournament = createTournament(playerNames, format);
      setTournament(newTournament);
      setCurrentTab('bracket');
    });
    setIsLoading(true);
  };

  // Trigger tournament reshuffle with Friend Loading screen
  const handleRegenerateTournament = () => {
    if (!tournament) return;
    playShuffle();
    setLoadingCustomTitle('RESHUFFLING BADMINTON MATCHUPS');
    setPendingAction(() => () => {
      const reshuffled = regenerateTournament(tournament);
      setTournament(reshuffled);
      setCurrentTab('bracket');
    });
    setIsLoading(true);
  };

  const handleNewTournament = () => {
    setTournament(null);
    setCurrentTab('setup');
  };

  const handleSelectWinner = (matchId: string, teamId: string) => {
    if (!tournament) return;

    // Detect match details to record to Firebase database
    let winnerTeam = null;
    let loserTeam = null;
    let isFinal = false;

    if (tournament.singleMatch && tournament.singleMatch.id === matchId) {
      winnerTeam = teamId === tournament.singleMatch.teamA.id ? tournament.singleMatch.teamA : tournament.singleMatch.teamB;
      loserTeam = teamId === tournament.singleMatch.teamA.id ? tournament.singleMatch.teamB : tournament.singleMatch.teamA;
      isFinal = true;
    } else if (tournament.semifinals) {
      if (matchId === tournament.semifinals[0].id) {
        winnerTeam = teamId === tournament.semifinals[0].teamA.id ? tournament.semifinals[0].teamA : tournament.semifinals[0].teamB;
        loserTeam = teamId === tournament.semifinals[0].teamA.id ? tournament.semifinals[0].teamB : tournament.semifinals[0].teamA;
        isFinal = false;
      } else if (matchId === tournament.semifinals[1].id) {
        winnerTeam = teamId === tournament.semifinals[1].teamA.id ? tournament.semifinals[1].teamA : tournament.semifinals[1].teamB;
        loserTeam = teamId === tournament.semifinals[1].teamA.id ? tournament.semifinals[1].teamB : tournament.semifinals[1].teamA;
        isFinal = false;
      } else if (tournament.final && matchId === tournament.final.id) {
        winnerTeam = teamId === tournament.final.teamA.id ? tournament.final.teamA : tournament.final.teamB;
        loserTeam = teamId === tournament.final.teamA.id ? tournament.final.teamB : tournament.final.teamA;
        isFinal = true;
      }
    }

    if (winnerTeam && loserTeam) {
      const dateKey = new Date().toLocaleDateString('en-CA');
      recordMatchResult({
        format: tournament.format,
        winnerTeam: { name: winnerTeam.name, players: winnerTeam.players },
        loserTeam: { name: loserTeam.name, players: loserTeam.players },
        isFinal,
        tournamentId: tournament.id,
        dateKey
      }).catch((err) => console.error('Failed to log match to Firebase:', err));
    }

    const updated = setMatchWinner(tournament, matchId, teamId);
    setTournament(updated);
  };

  const handleLoadingComplete = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setIsLoading(false);
  };

  const currentFormatMeta = (FORMAT_OPTIONS[playerCount] || FORMAT_OPTIONS[8]).find((f) => f.format === format) || FORMAT_OPTIONS[8][0];

  return (
    <div className={`app-root-wrapper theme-${theme}`}>
      {/* Background 3D decorative shapes */}
      <div className="bg-floating-orb orb-1" />
      <div className="bg-floating-orb orb-2" />
      <div className="bg-floating-orb orb-3" />

      {/* Initial Hilarious Friend Splash Intro */}
      {showSplash && (
        <SplashIntro onEnter={() => setShowSplash(false)} />
      )}

      <div className="app-container">
        {/* App Header */}
        <header className="app-header">
          <div className="brand-badge-3d">
            <Trophy size={14} className="trophy-badge-icon" />
            <span>🏸 Badminton Arena • {currentFormatMeta.label}</span>
            <Sparkles size={14} color="#f59e0b" />
          </div>

          <h1 className="app-title">{playerCount}-Player Badminton Tournament</h1>
          <p className="app-subtitle">
            Unbiased Fisher-Yates generator • {currentFormatMeta.description}
          </p>
        </header>

        {/* Navigation Controls Bar */}
        <TournamentControls
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onRegenerate={handleRegenerateTournament}
          onNewTournament={handleNewTournament}
          hasActiveTournament={!!tournament}
          theme={theme}
          onToggleTheme={toggleTheme}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          onReplaySplash={() => setShowSplash(true)}
          isSingleMatch={!!tournament?.singleMatch}
        />

        {/* Main View Router */}
        <main className="main-content-flow">
          {currentTab === 'setup' && (
            <PlayerSetup
              playerCount={playerCount}
              onSelectPlayerCount={handleSelectPlayerCount}
              format={format}
              onSelectFormat={handleSelectFormat}
              playerNames={playerNames}
              onChangePlayerName={handlePlayerNameChange}
              onSetAllPlayers={handleSetAllPlayers}
              onGenerateTournament={handleGenerateTournament}
              hasActiveTournament={!!tournament}
            />
          )}

          {currentTab === 'teams' && tournament && (
            <TeamList
              teams={tournament.teams}
              onRegenerate={handleRegenerateTournament}
              onGoToBracket={() => setCurrentTab('bracket')}
            />
          )}

          {currentTab === 'bracket' && tournament && (
            <TournamentBracket
              tournament={tournament}
              onSelectWinner={handleSelectWinner}
              onRegenerate={handleRegenerateTournament}
              onNewTournament={handleNewTournament}
            />
          )}

          {currentTab === 'leaderboard' && (
            <LeaderboardView
              onLoadPlayersIntoSetup={(loadedNames) => {
                if (loadedNames.length >= playerCount) {
                  setPlayerNames(loadedNames.slice(0, playerCount));
                } else {
                  const fallback = getPresetsForCount(playerCount, 'letters');
                  setPlayerNames([...loadedNames, ...fallback.slice(loadedNames.length)]);
                }
              }}
              onGoToSetup={() => setCurrentTab('setup')}
            />
          )}
        </main>


        {/* Footer */}
        <footer className="app-footer">
          <p>Built with React, TypeScript & Vite • 3D Badminton Tournament Experience</p>
          <div className="vercel-badge">
            <Globe size={14} />
            <span>Badminton Match Engine • Smash & Rally Ready</span>
          </div>
        </footer>
      </div>

      {/* Friend Loading Overlay: Animated Spinner with Friend's Face */}
      <FriendLoadingOverlay
        isOpen={isLoading}
        onClose={() => setIsLoading(false)}
        onComplete={handleLoadingComplete}
        isAutoDismiss={true}
        durationMs={2400}
        customTitle={loadingCustomTitle}
      />
    </div>
  );
}

export default App;
