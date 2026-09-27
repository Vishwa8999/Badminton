import { Match, Player, Team, Tournament, TournamentFormat } from '../types';

/**
 * Proper unbiased Fisher-Yates shuffle algorithm.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export interface ValidationFeedback {
  isValid: boolean;
  fieldErrors: Record<number, string>;
  globalError?: string;
}

/**
 * Validates that all entries for the given player count are filled, trimmed, non-empty, and unique.
 */
export function validatePlayerInputs(inputs: string[], expectedCount: number = 8): ValidationFeedback {
  const fieldErrors: Record<number, string> = {};
  const seen = new Map<string, number>();

  if (inputs.length !== expectedCount) {
    return {
      isValid: false,
      fieldErrors,
      globalError: `Exactly ${expectedCount} player names are required.`
    };
  }

  inputs.forEach((name, index) => {
    const trimmed = name.trim();
    if (!trimmed) {
      fieldErrors[index] = `Player ${index + 1} name cannot be blank.`;
    } else {
      const normalized = trimmed.toLowerCase();
      if (seen.has(normalized)) {
        const originalIndex = seen.get(normalized)!;
        fieldErrors[index] = `Duplicate with Player ${originalIndex + 1}.`;
      } else {
        seen.set(normalized, index);
      }
    }
  });

  const isValid = Object.keys(fieldErrors).length === 0;

  return {
    isValid,
    fieldErrors,
    globalError: isValid
      ? undefined
      : `Please provide ${expectedCount} unique, non-empty player names to proceed.`
  };
}

/**
 * Format options definition for UI and selection
 */
export interface FormatOption {
  format: TournamentFormat;
  playerCount: number;
  label: string;
  badge: string;
  description: string;
  isRecommended?: boolean;
}

export const FORMAT_OPTIONS: Record<number, FormatOption[]> = {
  8: [
    {
      format: '8_player_2v2_bracket',
      playerCount: 8,
      label: '2v2 Tournament (4 Teams)',
      badge: '👑 Semis & Final',
      description: '4 two-player teams compete in semifinals & grand final bracket.',
      isRecommended: true
    },
    {
      format: '8_player_4v4',
      playerCount: 8,
      label: '4 vs 4 Mega Clash',
      badge: '⚔️ 1 Showdown',
      description: '2 squads of 4 players clash in a single epic match.'
    }
  ],
  7: [
    {
      format: '7_player_3v4',
      playerCount: 7,
      label: '3 vs 4 Showdown',
      badge: '🔥 3v4 Clash',
      description: 'Team of 3 vs Team of 4 in an intense head-to-head match.',
      isRecommended: true
    }
  ],
  6: [
    {
      format: '6_player_3v3',
      playerCount: 6,
      label: '3 vs 3 Showdown',
      badge: '⚔️ 1 Match',
      description: '2 balanced teams of 3 players compete head-to-head.',
      isRecommended: true
    },
    {
      format: '6_player_2v2v2',
      playerCount: 6,
      label: '3 Teams of 2 (2v2v2)',
      badge: '⚡ 3 Teams',
      description: '3 two-player teams formed for round-robin or multi-team play.'
    }
  ],
  4: [
    {
      format: '4_player_2v2',
      playerCount: 4,
      label: '2 vs 2 Match',
      badge: '⚔️ 1 Match',
      description: '2 two-player teams face off in a single match.',
      isRecommended: true
    },
    {
      format: '4_player_1v1_bracket',
      playerCount: 4,
      label: '1v1 Knockout Bracket',
      badge: '🏆 Semis & Final',
      description: '4 solo players compete in semifinals and final championship.'
    }
  ]
};

/**
 * Splits 8 players into 4 random 2-player teams (Original untouched logic).
 */
export function generateTeams(players: Player[]): Team[] {
  if (players.length !== 8) {
    throw new Error('Exactly 8 players are required to generate teams.');
  }

  // 1. Randomly shuffle the 8 players
  const shuffledPlayers = shuffle(players);

  // 2. Pair consecutive players into 4 teams
  const teams: Team[] = [];
  for (let i = 0; i < 4; i++) {
    const p1 = shuffledPlayers[i * 2];
    const p2 = shuffledPlayers[i * 2 + 1];
    teams.push({
      id: `team-${i + 1}-${Math.random().toString(36).substring(2, 7)}`,
      name: `Team ${i + 1}`,
      players: [p1, p2],
      colorIndex: i
    });
  }

  return teams;
}

/**
 * Generates teams dynamically based on the selected format.
 */
export function generateTeamsForFormat(players: Player[], format: TournamentFormat): Team[] {
  const shuffled = shuffle(players);

  switch (format) {
    case '8_player_2v2_bracket':
      return generateTeams(players);

    case '8_player_4v4': {
      return [
        {
          id: `team-1-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Squad Alpha (4 Players)',
          players: shuffled.slice(0, 4),
          colorIndex: 0
        },
        {
          id: `team-2-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Squad Omega (4 Players)',
          players: shuffled.slice(4, 8),
          colorIndex: 1
        }
      ];
    }

    case '7_player_3v4': {
      return [
        {
          id: `team-1-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Trio Force (3 Players)',
          players: shuffled.slice(0, 3),
          colorIndex: 0
        },
        {
          id: `team-2-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Titan Quad (4 Players)',
          players: shuffled.slice(3, 7),
          colorIndex: 1
        }
      ];
    }

    case '6_player_3v3': {
      return [
        {
          id: `team-1-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team Alpha (3 Players)',
          players: shuffled.slice(0, 3),
          colorIndex: 0
        },
        {
          id: `team-2-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team Beta (3 Players)',
          players: shuffled.slice(3, 6),
          colorIndex: 1
        }
      ];
    }

    case '6_player_2v2v2': {
      return [
        {
          id: `team-1-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team 1',
          players: shuffled.slice(0, 2),
          colorIndex: 0
        },
        {
          id: `team-2-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team 2',
          players: shuffled.slice(2, 4),
          colorIndex: 1
        },
        {
          id: `team-3-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team 3',
          players: shuffled.slice(4, 6),
          colorIndex: 2
        }
      ];
    }

    case '4_player_2v2': {
      return [
        {
          id: `team-1-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team 1 (2 Players)',
          players: shuffled.slice(0, 2),
          colorIndex: 0
        },
        {
          id: `team-2-${Math.random().toString(36).substring(2, 7)}`,
          name: 'Team 2 (2 Players)',
          players: shuffled.slice(2, 4),
          colorIndex: 1
        }
      ];
    }

    case '4_player_1v1_bracket': {
      return shuffled.map((p, idx) => ({
        id: `team-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
        name: p.name,
        players: [p],
        colorIndex: idx
      }));
    }

    default:
      return generateTeams(players);
  }
}

/**
 * Shuffles the 4 teams into 2 semifinal matches (Original untouched logic).
 */
export function generateSemifinals(teams: Team[]): [Match, Match] {
  if (teams.length !== 4) {
    throw new Error('Exactly 4 teams are required to generate semifinals.');
  }

  // Shuffle teams for randomized matchups
  const shuffledTeams = shuffle(teams);

  const semi1: Match = {
    id: `semi-1-${Math.random().toString(36).substring(2, 7)}`,
    round: 'semifinal',
    matchNumber: 1,
    teamA: shuffledTeams[0],
    teamB: shuffledTeams[1],
    winnerId: undefined
  };

  const semi2: Match = {
    id: `semi-2-${Math.random().toString(36).substring(2, 7)}`,
    round: 'semifinal',
    matchNumber: 2,
    teamA: shuffledTeams[2],
    teamB: shuffledTeams[3],
    winnerId: undefined
  };

  return [semi1, semi2];
}

/**
 * Creates a brand new tournament from player names and chosen format.
 */
export function createTournament(
  playerNames: string[],
  format: TournamentFormat = '8_player_2v2_bracket'
): Tournament {
  const players: Player[] = playerNames.map((name, idx) => ({
    id: `player-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim()
  }));

  const playerCount = players.length;

  // 1. Classic 8-player 2v2 Tournament (Untouched logic!)
  if (format === '8_player_2v2_bracket') {
    const teams = generateTeams(players);
    const semifinals = generateSemifinals(teams);

    return {
      id: `tourney-${Date.now()}`,
      createdAt: Date.now(),
      playerCount: 8,
      format: '8_player_2v2_bracket',
      players,
      teams,
      semifinals,
      final: undefined,
      championId: undefined
    };
  }

  // 2. 4-Player 1v1 Knockout Bracket
  if (format === '4_player_1v1_bracket') {
    const teams = generateTeamsForFormat(players, format);
    const semi1: Match = {
      id: `semi-1-${Math.random().toString(36).substring(2, 7)}`,
      round: 'semifinal',
      matchNumber: 1,
      teamA: teams[0],
      teamB: teams[1],
      winnerId: undefined
    };
    const semi2: Match = {
      id: `semi-2-${Math.random().toString(36).substring(2, 7)}`,
      round: 'semifinal',
      matchNumber: 2,
      teamA: teams[2],
      teamB: teams[3],
      winnerId: undefined
    };

    return {
      id: `tourney-${Date.now()}`,
      createdAt: Date.now(),
      playerCount: 4,
      format: '4_player_1v1_bracket',
      players,
      teams,
      semifinals: [semi1, semi2],
      final: undefined,
      championId: undefined
    };
  }

  // 3. Single Match Showdown formats (7-player 3v4, 4-player 2v2, 6-player 3v3, 8-player 4v4)
  const teams = generateTeamsForFormat(players, format);
  const singleMatch: Match = {
    id: `showdown-${Math.random().toString(36).substring(2, 7)}`,
    round: 'showdown',
    matchNumber: 1,
    teamA: teams[0],
    teamB: teams[1],
    winnerId: undefined
  };

  return {
    id: `tourney-${Date.now()}`,
    createdAt: Date.now(),
    playerCount,
    format,
    players,
    teams,
    singleMatch,
    championId: undefined
  };
}

/**
 * Handles selecting a match winner and automatically managing final / champion state.
 */
export function setMatchWinner(
  tournament: Tournament,
  matchId: string,
  winnerTeamId: string
): Tournament {
  // Case A: Single Match Showdown (e.g. 7_player_3v4, 4_player_2v2, 6_player_3v3, 8_player_4v4)
  if (tournament.singleMatch && tournament.singleMatch.id === matchId) {
    if (winnerTeamId !== tournament.singleMatch.teamA.id && winnerTeamId !== tournament.singleMatch.teamB.id) {
      throw new Error('Invalid winner selected for showdown match');
    }
    const updatedSingleMatch: Match = {
      ...tournament.singleMatch,
      winnerId: winnerTeamId
    };
    return {
      ...tournament,
      singleMatch: updatedSingleMatch,
      championId: winnerTeamId
    };
  }

  // Case B: Semifinals and Final Tournament Bracket (8_player_2v2_bracket or 4_player_1v1_bracket)
  if (tournament.semifinals) {
    let updatedSemi1 = tournament.semifinals[0];
    let updatedSemi2 = tournament.semifinals[1];
    let updatedFinal = tournament.final;
    let updatedChampionId = tournament.championId;

    if (matchId === updatedSemi1.id) {
      if (winnerTeamId !== updatedSemi1.teamA.id && winnerTeamId !== updatedSemi1.teamB.id) {
        throw new Error('Invalid winner selected for Semifinal 1');
      }
      updatedSemi1 = { ...updatedSemi1, winnerId: winnerTeamId };
    } else if (matchId === updatedSemi2.id) {
      if (winnerTeamId !== updatedSemi2.teamA.id && winnerTeamId !== updatedSemi2.teamB.id) {
        throw new Error('Invalid winner selected for Semifinal 2');
      }
      updatedSemi2 = { ...updatedSemi2, winnerId: winnerTeamId };
    } else if (updatedFinal && matchId === updatedFinal.id) {
      if (winnerTeamId !== updatedFinal.teamA.id && winnerTeamId !== updatedFinal.teamB.id) {
        throw new Error('Invalid winner selected for Final');
      }
      updatedFinal = { ...updatedFinal, winnerId: winnerTeamId };
      updatedChampionId = winnerTeamId;

      return {
        ...tournament,
        semifinals: [updatedSemi1, updatedSemi2],
        final: updatedFinal,
        championId: updatedChampionId
      };
    }

    // Automatic Final creation or recalculation
    const semi1Winner = updatedSemi1.winnerId
      ? (updatedSemi1.winnerId === updatedSemi1.teamA.id ? updatedSemi1.teamA : updatedSemi1.teamB)
      : null;

    const semi2Winner = updatedSemi2.winnerId
      ? (updatedSemi2.winnerId === updatedSemi2.teamA.id ? updatedSemi2.teamA : updatedSemi2.teamB)
      : null;

    if (semi1Winner && semi2Winner) {
      // If participants changed, reset final match
      if (
        !updatedFinal ||
        updatedFinal.teamA.id !== semi1Winner.id ||
        updatedFinal.teamB.id !== semi2Winner.id
      ) {
        updatedFinal = {
          id: updatedFinal ? updatedFinal.id : `final-${Math.random().toString(36).substring(2, 7)}`,
          round: 'final',
          matchNumber: 3,
          teamA: semi1Winner,
          teamB: semi2Winner,
          winnerId: undefined
        };
        updatedChampionId = undefined;
      }
    } else {
      // One of the semifinals is not decided yet
      updatedFinal = undefined;
      updatedChampionId = undefined;
    }

    return {
      ...tournament,
      semifinals: [updatedSemi1, updatedSemi2],
      final: updatedFinal,
      championId: updatedChampionId
    };
  }

  return tournament;
}

/**
 * Keeps the original players but reshuffles teams and pairings according to active format.
 */
export function regenerateTournament(tournament: Tournament): Tournament {
  const format = tournament.format || '8_player_2v2_bracket';
  const playerNames = tournament.players.map((p) => p.name);
  return createTournament(playerNames, format);
}

/**
 * Pre-made quick load templates
 */
export const PRESET_PLAYERS = {
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  legends: ['Faker', 's1mple', 'TenZ', 'Shroud', 'Boaster', 'Aspas', 'Chovy', 'Scump'],
  allStars: ['Messi', 'Zidane', 'Pelé', 'Ronaldo', 'Maradona', 'Cruyff', 'Ronaldinho', 'Henry'],
  casual: ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Jamie']
};

/**
 * Helper to get preset sliced to given count
 */
export function getPresetsForCount(count: number, key: keyof typeof PRESET_PLAYERS): string[] {
  const list = PRESET_PLAYERS[key] || PRESET_PLAYERS.letters;
  if (list.length >= count) {
    return list.slice(0, count);
  }
  // If count exceeds length, generate extra
  const result = [...list];
  while (result.length < count) {
    result.push(`Player ${result.length + 1}`);
  }
  return result;
}
