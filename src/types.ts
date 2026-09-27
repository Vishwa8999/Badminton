export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  colorIndex: number;
}

export type TournamentFormat =
  | '8_player_2v2_bracket'
  | '8_player_4v4'
  | '7_player_3v4'
  | '6_player_3v3'
  | '6_player_2v2v2'
  | '4_player_2v2'
  | '4_player_1v1_bracket';

export type MatchRound = 'semifinal' | 'final' | 'showdown';

export interface Match {
  id: string;
  round: MatchRound;
  matchNumber: number;
  teamA: Team;
  teamB: Team;
  winnerId?: string;
}

export interface Tournament {
  id: string;
  createdAt: number;
  playerCount: number;
  format: TournamentFormat;
  players: Player[];
  teams: Team[];
  semifinals?: [Match, Match];
  final?: Match;
  singleMatch?: Match;
  championId?: string;
}

export type TournamentViewTab = 'bracket' | 'teams' | 'setup' | 'leaderboard';
