export interface ClubMember {
  id: string;
  name: string;
  matchesPlayed: number;
  matchesWon: number;
  points: number;
  trophies: number;
  winRate: number;
  createdAt?: number;
  lastPlayedAt?: number | null;
}

export interface MatchRecord {
  id: string;
  format: string;
  isFinal: boolean;
  tournamentId?: string | null;
  dateKey?: string;
  winnerTeam: {
    name: string;
    players: string[];
  };
  loserTeam: {
    name: string;
    players: string[];
  };
  timestamp: number;
}

export interface DailyDateInfo {
  dateKey: string;
  label: string;
  matchCount: number;
  isToday: boolean;
}

export interface ClubStats {
  view: 'daily' | 'all-time';
  selectedDate: string;
  formattedDate: string;
  isToday: boolean;
  totalMatchesDone: number;
  totalTournamentsDone: number;
  leaderboard: ClubMember[];
  recentMatches: MatchRecord[];
  mvp?: ClubMember | null;
  availableDates: DailyDateInfo[];
  allTimeOverview?: {
    totalMatchesDone: number;
    totalTournamentsDone: number;
    totalMembers: number;
  };
}

export async function fetchClubStats(
  date?: string,
  view: 'daily' | 'all-time' = 'daily'
): Promise<ClubStats> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (view) params.set('view', view);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/stats${query}`);
  if (!res.ok) throw new Error('Failed to fetch club stats');
  const data = await res.json();
  return data.stats;
}

export async function fetchAvailableDates(): Promise<DailyDateInfo[]> {
  const res = await fetch('/api/dates');
  if (!res.ok) throw new Error('Failed to fetch dates');
  const data = await res.json();
  return data.dates || [];
}

export async function fetchMembers(): Promise<ClubMember[]> {
  const res = await fetch('/api/members');
  if (!res.ok) throw new Error('Failed to fetch members');
  const data = await res.json();
  return data.members || [];
}

export async function addClubMember(name: string): Promise<ClubMember> {
  const res = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to add member');
  const data = await res.json();
  return data.member;
}

export async function deleteClubMember(memberId: string): Promise<boolean> {
  const res = await fetch(`/api/members/${memberId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete member');
  const data = await res.json();
  return !!data.success;
}

export async function syncClubMembers(playerNames: string[]): Promise<ClubMember[]> {
  const res = await fetch('/api/members/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerNames })
  });
  if (!res.ok) throw new Error('Failed to sync members');
  const data = await res.json();
  return data.members || [];
}

export interface RecordMatchParams {
  format: string;
  winnerTeam: { name: string; players: (string | { name: string })[] };
  loserTeam: { name: string; players: (string | { name: string })[] };
  isFinal?: boolean;
  tournamentId?: string;
  dateKey?: string;
}

export async function recordMatchResult(params: RecordMatchParams): Promise<string> {
  const payload = {
    ...params,
    dateKey: params.dateKey || new Date().toLocaleDateString('en-CA')
  };
  const res = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to record match');
  const data = await res.json();
  return data.matchId;
}

