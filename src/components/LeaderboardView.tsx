import React, { useState, useEffect } from 'react';
import {
  fetchClubStats,
  addClubMember,
  deleteClubMember,
  ClubStats,
  ClubMember,
  DailyDateInfo
} from '../utils/firebaseApi';
import {
  Trophy,
  Users,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Zap,
  Activity,
  Award,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Flame,
  Clock,
  Check
} from 'lucide-react';
import { playClick, playFanfare } from '../utils/sound';
import confetti from 'canvas-confetti';

interface LeaderboardViewProps {
  onLoadPlayersIntoSetup: (playerNames: string[]) => void;
  onGoToSetup: () => void;
}

function getTodayDateKey(): string {
  return new Date().toLocaleDateString('en-CA');
}

function adjustDay(dateKey: string, deltaDays: number): string {
  try {
    const parts = dateKey.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + deltaDays);
      return d.toLocaleDateString('en-CA');
    }
  } catch {
    // fallback
  }
  return dateKey;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onLoadPlayersIntoSetup,
  onGoToSetup
}) => {
  const todayKey = getTodayDateKey();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [viewMode, setViewMode] = useState<'daily' | 'all-time'>('daily');
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const loadData = async (
    targetDate: string = selectedDate,
    targetView: 'daily' | 'all-time' = viewMode,
    showLoading = true
  ) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const data = await fetchClubStats(targetDate, targetView);
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load leaderboard data:', err);
      setError('Could not connect to Firebase database. Check connection or try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate, viewMode, true);
  }, [selectedDate, viewMode]);

  const handlePrevDay = () => {
    playClick();
    const prev = adjustDay(selectedDate, -1);
    setSelectedDate(prev);
    if (viewMode !== 'daily') setViewMode('daily');
  };

  const handleNextDay = () => {
    if (selectedDate >= todayKey) return;
    playClick();
    const next = adjustDay(selectedDate, 1);
    setSelectedDate(next);
    if (viewMode !== 'daily') setViewMode('daily');
  };

  const handleJumpToToday = () => {
    playClick();
    setSelectedDate(todayKey);
    setViewMode('daily');
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      playClick();
      setSelectedDate(val);
      if (viewMode !== 'daily') setViewMode('daily');
    }
  };

  const handleSelectDateChip = (dateKey: string) => {
    playClick();
    setSelectedDate(dateKey);
    setViewMode('daily');
  };

  const handleSwitchView = (mode: 'daily' | 'all-time') => {
    playClick();
    setViewMode(mode);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    setIsAdding(true);
    try {
      playClick();
      await addClubMember(trimmed);
      setNewMemberName('');
      setNotification(`Registered "${trimmed}" into database!`);
      setTimeout(() => setNotification(null), 3500);
      await loadData(selectedDate, viewMode, false);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMember = async (member: ClubMember) => {
    if (!window.confirm(`Remove member "${member.name}" from database?`)) return;
    try {
      playClick();
      await deleteClubMember(member.id);
      setNotification(`Removed "${member.name}"`);
      setTimeout(() => setNotification(null), 3000);
      await loadData(selectedDate, viewMode, false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete member');
    }
  };

  const handleLoadTopIntoTournament = () => {
    if (!stats || stats.leaderboard.length === 0) return;
    playFanfare();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#0284c7', '#ec4899', '#10b981']
    });

    const topNames = stats.leaderboard.map((m) => m.name);
    onLoadPlayersIntoSetup(topNames);
    onGoToSetup();
  };

  const handleShareDailySummary = () => {
    if (!stats) return;
    playClick();

    const titleDate = stats.formattedDate || selectedDate;
    const isDaily = stats.view === 'daily';
    let text = `🏸 *BADMINTON ARENA — ${isDaily ? (stats.isToday ? "TODAY'S STANDINGS" : "DAILY STANDINGS") : "ALL-TIME CLUB RANKINGS"}* 🏸\n`;
    text += `📅 ${titleDate}\n`;
    text += `⚔️ ${stats.totalMatchesDone} Matches Done | 🏆 ${stats.totalTournamentsDone} Tournaments Completed\n\n`;

    if (stats.leaderboard.length === 0) {
      text += `No matches recorded for this date yet. Ready for the next smash session! 🏸\n`;
    } else {
      text += `👑 *PODIUM STANDINGS:*\n`;
      stats.leaderboard.slice(0, 3).forEach((m, idx) => {
        const medals = ['🥇', '🥈', '🥉'];
        text += `${medals[idx]} #${idx + 1} ${m.name} — ${m.points} pts (${m.matchesWon}W/${m.matchesPlayed}M • ${m.winRate}% win${m.trophies > 0 ? ` • 🏆 ${m.trophies} titles` : ''})\n`;
      });

      if (stats.leaderboard.length > 3) {
        text += `\n📊 *REMAINING STANDINGS:*\n`;
        stats.leaderboard.slice(3, 10).forEach((m, idx) => {
          text += `${idx + 4}. ${m.name} — ${m.points} pts (${m.matchesWon}W/${m.matchesPlayed}M • ${m.winRate}% win${m.trophies > 0 ? ` • 🏆 ${m.trophies}` : ''})\n`;
        });
      }
    }

    text += `\n🔥 Track live scores & next tournament on Badminton Arena!`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedShare(true);
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 }
        });
        setTimeout(() => setCopiedShare(false), 3000);
      })
      .catch(() => {
        setNotification('Could not copy to clipboard.');
        setTimeout(() => setNotification(null), 3000);
      });
  };

  const filteredMembers = (stats?.leaderboard || []).filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top1 = stats?.leaderboard?.[0];
  const top2 = stats?.leaderboard?.[1];
  const top3 = stats?.leaderboard?.[2];

  const isViewingToday = viewMode === 'daily' && selectedDate === todayKey;
  const isFutureDate = selectedDate >= todayKey;

  const mostRecentActiveDate = stats?.availableDates?.find((d) => d.matchCount > 0)?.dateKey;

  return (
    <div className="leaderboard-container">
      {/* Top Banner & Stats Overview */}
      <div className="leaderboard-header-card">
        <div className="leaderboard-header-top">
          <div className="leaderboard-title-group">
            <div className="badge-drip">
              <Sparkles size={14} color="#f59e0b" />
              <span>
                {viewMode === 'daily'
                  ? isViewingToday
                    ? "Today's Live Badminton Session • Firebase Sync"
                    : `Daily Session • ${stats?.formattedDate || selectedDate}`
                  : 'All-Time Club History • Hall of Fame'}
              </span>
            </div>
            <h2 className="leaderboard-title">
              {viewMode === 'daily'
                ? isViewingToday
                  ? "Today's Badminton Leaderboard"
                  : `Daily Leaderboard — ${stats?.formattedDate || selectedDate}`
                : 'All-Time Badminton Hall of Fame'}
            </h2>
            <p className="leaderboard-desc">
              {viewMode === 'daily'
                ? "Daily standings track points (+3 win, +1 participation), match records, and daily tournament trophies won on this day."
                : "Lifetime club statistics aggregating all tournaments, historical match points, and total titles won."}
            </p>
          </div>

          <div className="leaderboard-header-actions">
            <div className="actions-top-row">
              {/* Share / Copy Summary */}
              <button
                type="button"
                className="btn-secondary btn-share-summary btn-3d-tap"
                onClick={handleShareDailySummary}
                title="Copy formatted results to share on WhatsApp or Discord"
              >
                {copiedShare ? (
                  <>
                    <Check size={15} color="#10b981" />
                    <span style={{ color: '#10b981' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={15} />
                    <span>Share Standings</span>
                  </>
                )}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                className="btn-secondary btn-refresh btn-3d-tap"
                onClick={() => {
                  playClick();
                  loadData(selectedDate, viewMode, true);
                }}
                disabled={isLoading}
                title="Refresh Leaderboard Data"
              >
                <RefreshCw size={15} className={isLoading ? 'spin-anim' : ''} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Load into tournament button */}
            {stats && stats.leaderboard.length > 0 && (
              <button
                type="button"
                className="btn-primary btn-load-top btn-3d-tap"
                onClick={handleLoadTopIntoTournament}
                title="Load players from this leaderboard into tournament setup"
              >
                <Zap size={16} />
                <span>Load Players to Tournament</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Date Navigator Bar & Mode Switcher */}
        <div className="daily-nav-toolbar">
          {/* Day Navigation Controls */}
          <div className="daily-nav-group">
            <button
              type="button"
              className="btn-day-nav"
              onClick={handlePrevDay}
              title="Previous Day"
            >
              <ChevronLeft size={16} />
              <span className="nav-btn-text">Prev</span>
            </button>

            {/* Custom Date Input with Calendar Icon */}
            <div className="daily-date-picker-wrap" title="Tap to pick date from calendar">
              <Calendar size={15} className="date-icon" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateInputChange}
                max={todayKey}
                className="daily-date-input"
              />
              <span className="daily-date-display">{stats?.formattedDate || selectedDate}</span>
            </div>

            <button
              type="button"
              className={`btn-day-nav ${isFutureDate ? 'disabled-nav' : ''}`}
              onClick={handleNextDay}
              disabled={isFutureDate}
              title={isFutureDate ? 'Already on newest date' : 'Next Day'}
            >
              <span className="nav-btn-text">Next</span>
              <ChevronRight size={16} />
            </button>

            {/* Quick jump to Today */}
            <button
              type="button"
              className={`btn-today-jump ${isViewingToday ? 'active-today' : 'pulse-today'}`}
              onClick={handleJumpToToday}
              title="Jump to Today's Leaderboard"
            >
              <span className="today-dot" />
              <span>Today</span>
            </button>
          </div>

          {/* Mode Switcher: Daily vs All-Time */}
          <div className="view-mode-switcher">
            <button
              type="button"
              className={`mode-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => handleSwitchView('daily')}
            >
              <Flame size={14} />
              <span>Daily Standings</span>
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === 'all-time' ? 'active' : ''}`}
              onClick={() => handleSwitchView('all-time')}
            >
              <Trophy size={14} />
              <span>All-Time Standings</span>
            </button>
          </div>
        </div>

        {/* Active Session Date Chips */}
        {stats && stats.availableDates && stats.availableDates.length > 0 && (
          <div className="active-dates-strip-wrap">
            <div className="active-dates-label">
              <Clock size={13} />
              <span>Sessions:</span>
            </div>
            <div className="active-dates-strip">
              {stats.availableDates.map((item: DailyDateInfo) => {
                const isActive = viewMode === 'daily' && selectedDate === item.dateKey;
                return (
                  <button
                    key={item.dateKey}
                    type="button"
                    className={`date-chip ${isActive ? 'date-chip-active' : ''}`}
                    onClick={() => handleSelectDateChip(item.dateKey)}
                  >
                    {item.isToday && <span className="chip-badge-today">TODAY</span>}
                    <span>{item.label}</span>
                    <span className="chip-count">{item.matchCount} {item.matchCount === 1 ? 'match' : 'matches'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Global / Daily Key Metrics Counters */}
        <div className="metrics-counter-grid">
          <div className="metric-box box-matches">
            <div className="metric-icon-wrap">
              <Activity size={20} color="#0284c7" />
            </div>
            <div className="metric-info">
              <span className="metric-val">{stats?.totalMatchesDone ?? 0}</span>
              <span className="metric-label">
                {viewMode === 'daily' ? (isViewingToday ? "Today's Matches" : "Matches on Date") : 'Total Matches All-Time'}
              </span>
            </div>
          </div>

          <div className="metric-box box-leader">
            <div className="metric-icon-wrap">
              <CrownIcon size={20} color="#f59e0b" />
            </div>
            <div className="metric-info">
              <span className="metric-val text-truncate">{top1 ? top1.name : '—'}</span>
              <span className="metric-label">
                {viewMode === 'daily' ? "Daily MVP / Smash King" : "All-Time Top Player"} ({top1 ? `${top1.points} pts` : '0 pts'})
              </span>
            </div>
          </div>

          <div className="metric-box box-members">
            <div className="metric-icon-wrap">
              <Users size={20} color="#10b981" />
            </div>
            <div className="metric-info">
              <span className="metric-val">{stats?.leaderboard?.length ?? 0}</span>
              <span className="metric-label">
                {viewMode === 'daily' ? 'Active Players' : 'Total Club Members'}
              </span>
            </div>
          </div>

          <div className="metric-box box-tourneys">
            <div className="metric-icon-wrap">
              <Trophy size={20} color="#ec4899" />
            </div>
            <div className="metric-info">
              <span className="metric-val">{stats?.totalTournamentsDone ?? 0}</span>
              <span className="metric-label">
                {viewMode === 'daily' ? 'Tournaments Won' : 'Tournaments All-Time'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {notification && (
        <div className="db-alert-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="db-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => loadData(selectedDate, viewMode, true)}>Retry</button>
        </div>
      )}

      {/* Top 3 Podium (Gold, Silver, Bronze) */}
      {stats && stats.leaderboard.length > 0 ? (
        <div className="podium-section">
          <h3 className="section-subheading">
            <Award size={18} color="#f59e0b" />
            <span>
              {viewMode === 'daily'
                ? isViewingToday
                  ? "Today's Podium Champions"
                  : `Podium for ${stats.formattedDate}`
                : 'All-Time Hall of Fame Podium'}
            </span>
          </h3>

          <div className="podium-grid">
            {/* Rank 1: Gold */}
            {top1 && (
              <div className="podium-card gold-card podium-rank-1">
                <div className="podium-header-badge">
                  <span className="podium-badge gold">👑 {viewMode === 'daily' ? 'Daily Champion' : 'Champion'} (#1)</span>
                </div>
                <div className="podium-avatar-wrap">
                  <div className="podium-avatar gold-avatar">🏸</div>
                  <span className="podium-mobile-tag gold">👑 #1</span>
                </div>
                <div className="podium-body">
                  <h4 className="podium-name">{top1.name}</h4>
                  <div className="podium-stats">
                    <span>{top1.matchesWon}W / {top1.matchesPlayed}M</span>
                    <span className="podium-winrate">{top1.winRate}% Win</span>
                  </div>
                </div>
                <div className="podium-right-stats">
                  <div className="podium-points">{top1.points} <small>PTS</small></div>
                  {top1.trophies > 0 && (
                    <div className="podium-trophies gold-trophies">
                      🏆 {top1.trophies} {viewMode === 'daily' ? 'Won Today' : 'Titles'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rank 2: Silver */}
            {top2 ? (
              <div className="podium-card silver-card podium-rank-2">
                <div className="podium-header-badge">
                  <span className="podium-badge silver">🥈 Runner-Up (#2)</span>
                </div>
                <div className="podium-avatar-wrap">
                  <div className="podium-avatar silver-avatar">🏸</div>
                  <span className="podium-mobile-tag silver">🥈 #2</span>
                </div>
                <div className="podium-body">
                  <h4 className="podium-name">{top2.name}</h4>
                  <div className="podium-stats">
                    <span>{top2.matchesWon}W / {top2.matchesPlayed}M</span>
                    <span className="podium-winrate">{top2.winRate}% Win</span>
                  </div>
                </div>
                <div className="podium-right-stats">
                  <div className="podium-points">{top2.points} <small>PTS</small></div>
                  {top2.trophies > 0 && (
                    <div className="podium-trophies">
                      🏆 {top2.trophies} {viewMode === 'daily' ? 'Today' : 'Titles'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="podium-card silver-card podium-placeholder podium-rank-2">
                <div className="podium-badge silver">🥈 Rank 2</div>
                <span className="text-muted">Awaiting player</span>
              </div>
            )}

            {/* Rank 3: Bronze */}
            {top3 ? (
              <div className="podium-card bronze-card podium-rank-3">
                <div className="podium-header-badge">
                  <span className="podium-badge bronze">🥉 Bronze (#3)</span>
                </div>
                <div className="podium-avatar-wrap">
                  <div className="podium-avatar bronze-avatar">🏸</div>
                  <span className="podium-mobile-tag bronze">🥉 #3</span>
                </div>
                <div className="podium-body">
                  <h4 className="podium-name">{top3.name}</h4>
                  <div className="podium-stats">
                    <span>{top3.matchesWon}W / {top3.matchesPlayed}M</span>
                    <span className="podium-winrate">{top3.winRate}% Win</span>
                  </div>
                </div>
                <div className="podium-right-stats">
                  <div className="podium-points">{top3.points} <small>PTS</small></div>
                  {top3.trophies > 0 && (
                    <div className="podium-trophies">
                      🏆 {top3.trophies} {viewMode === 'daily' ? 'Today' : 'Titles'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="podium-card bronze-card podium-placeholder podium-rank-3">
                <div className="podium-badge bronze">🥉 Rank 3</div>
                <span className="text-muted">Awaiting player</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State for days without matches */
        <div className="daily-empty-card">
          <div className="empty-shuttle-icon">🏸</div>
          <h3 className="empty-title">
            No matches played on {stats?.formattedDate || selectedDate} yet
          </h3>
          <p className="empty-desc">
            Points are recorded automatically when matches are played! Start today's tournament to generate matchups, score points (+3 win, +1 participation), and crown today's champion.
          </p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn-primary btn-start-today btn-3d-tap"
              onClick={onGoToSetup}
            >
              <Zap size={16} />
              <span>Start Tournament for Today</span>
              <ArrowRight size={16} />
            </button>

            {mostRecentActiveDate && mostRecentActiveDate !== selectedDate && (
              <button
                type="button"
                className="btn-secondary btn-3d-tap"
                onClick={() => handleSelectDateChip(mostRecentActiveDate)}
              >
                <Clock size={15} />
                <span>View Latest Session ({mostRecentActiveDate})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Roster & Point Standings Table */}
      <div className="roster-card">
        <div className="roster-card-header">
          <div className="roster-header-title">
            <Users size={19} color="#0284c7" />
            <span>
              {viewMode === 'daily'
                ? `Daily Standings (${stats?.formattedDate || selectedDate})`
                : 'All-Time Club Standings'}
            </span>
            <span className="badge-count">{filteredMembers.length} Players</span>
          </div>

          <div className="roster-controls">
            {/* Search Input */}
            <div className="roster-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search player..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Register Member Form */}
            <form onSubmit={handleAddMember} className="member-add-form">
              <input
                type="text"
                placeholder="Register new player..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                disabled={isAdding}
                maxLength={25}
              />
              <button
                type="submit"
                className="btn-primary btn-add-member btn-3d-tap"
                disabled={isAdding || !newMemberName.trim()}
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        {/* Member Table */}
        <div className="table-responsive">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="col-rank">Rank</th>
                <th className="col-player">Player Name</th>
                <th className="col-points">
                  <span className="desktop-text">{viewMode === 'daily' ? "Today's Points" : 'All-Time Points'}</span>
                  <span className="mobile-text">Pts</span>
                </th>
                <th className="col-matches">
                  <span className="desktop-text">Matches (W/P)</span>
                  <span className="mobile-text">W/P</span>
                </th>
                <th className="col-winrate">
                  <span className="desktop-text">Win Rate</span>
                  <span className="mobile-text">Win%</span>
                </th>
                <th className="col-trophies">
                  <span className="desktop-text">{viewMode === 'daily' ? 'Titles Today' : 'All-Time Titles'}</span>
                  <span className="mobile-text">🏆</span>
                </th>
                <th className="col-actions" style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    {searchQuery
                      ? 'No members match your search.'
                      : viewMode === 'daily'
                      ? 'No players participated on this date yet. Launch a tournament above!'
                      : 'No members registered yet. Add one above or play a tournament!'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => {
                  const rank = index + 1;
                  return (
                    <tr key={member.id} className={rank <= 3 ? `top-row rank-${rank}` : ''}>
                      <td className="rank-cell col-rank">
                        {rank === 1 ? (
                          <span className="rank-badge gold">1 👑</span>
                        ) : rank === 2 ? (
                          <span className="rank-badge silver">2 🥈</span>
                        ) : rank === 3 ? (
                          <span className="rank-badge bronze">3 🥉</span>
                        ) : (
                          <span className="rank-badge standard">#{rank}</span>
                        )}
                      </td>
                      <td className="player-name-cell col-player">
                        <div className="player-identity">
                          <span className="player-avatar-shuttle">🏸</span>
                          <span className="player-name-text">{member.name}</span>
                          {rank === 1 && (
                            <span className="leader-pill">MVP</span>
                          )}
                        </div>
                      </td>
                      <td className="points-cell col-points">
                        <span className="points-pill">{member.points} pts</span>
                      </td>
                      <td className="matches-cell col-matches">
                        <span className="desktop-text">
                          <span className="won-count">{member.matchesWon} Won</span>
                          <span className="total-count"> / {member.matchesPlayed} Played</span>
                        </span>
                        <span className="mobile-text">
                          <span className="won-count">{member.matchesWon}</span>
                          <span className="total-count">/{member.matchesPlayed}</span>
                        </span>
                      </td>
                      <td className="winrate-cell col-winrate">
                        <div className="winrate-bar-wrap">
                          <div
                            className="winrate-bar-fill"
                            style={{ width: `${Math.min(100, member.winRate)}%` }}
                          />
                          <span className="winrate-text">{member.winRate}%</span>
                        </div>
                      </td>
                      <td className="trophies-cell col-trophies">
                        {member.trophies > 0 ? (
                          <span className="trophy-pill">🏆 {member.trophies}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="actions-cell col-actions" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-delete-member"
                          onClick={() => handleDeleteMember(member)}
                          title={`Delete ${member.name}`}
                          aria-label={`Delete ${member.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matches Log for the Selected Date */}
      {stats && stats.recentMatches.length > 0 && (
        <div className="recent-matches-card">
          <div className="roster-card-header">
            <div className="roster-header-title">
              <Activity size={18} color="#f59e0b" />
              <span>
                {viewMode === 'daily'
                  ? `Match Activity for ${stats.formattedDate || selectedDate}`
                  : 'Recent Matches (All-Time)'}
              </span>
              <span className="badge-count">{stats.recentMatches.length} matches</span>
            </div>
          </div>

          <div className="matches-list-grid">
            {stats.recentMatches.map((match) => {
              const timeStr = new Date(match.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const dateStr = new Date(match.timestamp).toLocaleDateString([], {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div key={match.id} className="match-log-card">
                  <div className="match-log-top">
                    <span className="match-log-format">{match.format.replace(/_/g, ' ')}</span>
                    {match.isFinal && <span className="match-log-final">🏆 Championship Final</span>}
                    <span className="match-log-date">{dateStr} • {timeStr}</span>
                  </div>

                  <div className="match-log-teams">
                    <div className="match-team winner-team">
                      <span className="team-status winner-status">WINNER (+3 PTS)</span>
                      <span className="team-name">{match.winnerTeam.name}</span>
                      <span className="team-players">
                        {match.winnerTeam.players.join(' & ')}
                      </span>
                    </div>

                    <div className="match-vs-divider">VS</div>

                    <div className="match-team loser-team">
                      <span className="team-status loser-status">RUNNER UP (+1 PT)</span>
                      <span className="team-name">{match.loserTeam.name}</span>
                      <span className="team-players">
                        {match.loserTeam.players.join(' & ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

function CrownIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}
