const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  // Try env variables first (Vercel / production)
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel stores \n as literal \\n — fix it
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  } else {
    // Fallback to serviceAccount.json for local development
    const serviceAccountPath = path.resolve(__dirname, '../serviceAccount.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error('No Firebase credentials found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars or add serviceAccount.json');
    }
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
}

const db = getFirestore();
const MEMBERS_COL = db.collection('badminton_members');
const MATCHES_COL = db.collection('badminton_matches');
const STATS_DOC = db.collection('badminton_stats').doc('club_summary');
const DAILY_STATS_COL = db.collection('badminton_daily_stats');

/**
 * Format timestamp into YYYY-MM-DD local date string
 */
function toDateKey(ts) {
  if (!ts) {
    return new Date().toLocaleDateString('en-CA');
  }
  const d = new Date(ts);
  if (isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-CA');
  }
  return d.toLocaleDateString('en-CA');
}

/**
 * Get today's local date key YYYY-MM-DD
 */
function getTodayDateKey() {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Format a YYYY-MM-DD date into friendly human readable string
 */
function formatFriendlyDate(dateKey) {
  try {
    const parts = dateKey.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch {
    // fallback
  }
  return dateKey;
}

/**
 * Normalize player name for document ID
 */
function toDocId(name) {
  if (!name) return 'player_unknown';
  return name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
}

/**
 * Safely extract player names from an array of strings or objects
 */
function extractPlayerNames(players) {
  if (!Array.isArray(players)) return [];
  return players
    .map((p) => {
      if (typeof p === 'string') return p.trim();
      if (p && typeof p.name === 'string') return p.name.trim();
      if (p && typeof p.id === 'string') return p.id.trim();
      return String(p || '').trim();
    })
    .filter(Boolean);
}

/**
 * Retrieve all unique dates with match activity
 */
async function getAvailableDates() {
  const matchesSnap = await MATCHES_COL.orderBy('timestamp', 'desc').get();
  const dateMap = {};

  matchesSnap.forEach((doc) => {
    const data = doc.data();
    const dateKey = data.dateKey || toDateKey(data.timestamp);
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        dateKey,
        label: formatFriendlyDate(dateKey),
        matchCount: 0,
        isToday: dateKey === getTodayDateKey()
      };
    }
    dateMap[dateKey].matchCount += 1;
  });

  const todayKey = getTodayDateKey();
  if (!dateMap[todayKey]) {
    dateMap[todayKey] = {
      dateKey: todayKey,
      label: formatFriendlyDate(todayKey),
      matchCount: 0,
      isToday: true
    };
  }

  // Sort dates descending (newest date first)
  return Object.values(dateMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

/**
 * Calculate and return daily statistics for a specific dateKey (YYYY-MM-DD)
 */
async function getDailyStats(targetDateKey) {
  const dateKey = targetDateKey || getTodayDateKey();
  const isToday = dateKey === getTodayDateKey();

  // 1. Fetch matches for this specific date
  const matchesSnap = await MATCHES_COL.orderBy('timestamp', 'desc').get();
  const dateMatches = [];

  matchesSnap.forEach((doc) => {
    const m = { id: doc.id, ...doc.data() };
    const matchDate = m.dateKey || toDateKey(m.timestamp);
    if (matchDate === dateKey) {
      dateMatches.push(m);
    }
  });

  // 2. Aggregate player points, matches, win rates, and tournament trophies for this day
  const dailyMembersMap = {};
  let dailyTournaments = 0;

  for (const match of dateMatches) {
    if (match.isFinal) {
      dailyTournaments += 1;
    }

    const winners = extractPlayerNames(match.winnerTeam?.players);
    const losers = extractPlayerNames(match.loserTeam?.players);

    // Winner points: +3 pts, +1 match played, +1 match won
    for (const name of winners) {
      const docId = toDocId(name);
      if (!dailyMembersMap[docId]) {
        dailyMembersMap[docId] = {
          id: docId,
          name,
          matchesPlayed: 0,
          matchesWon: 0,
          points: 0,
          trophies: 0,
          winRate: 0,
          lastPlayedAt: match.timestamp
        };
      }
      dailyMembersMap[docId].points += 3;
      dailyMembersMap[docId].matchesPlayed += 1;
      dailyMembersMap[docId].matchesWon += 1;
      if (match.isFinal) {
        dailyMembersMap[docId].trophies += 1;
      }
      if (!dailyMembersMap[docId].lastPlayedAt || match.timestamp > dailyMembersMap[docId].lastPlayedAt) {
        dailyMembersMap[docId].lastPlayedAt = match.timestamp;
      }
    }

    // Loser points: +1 pt (participation), +1 match played
    for (const name of losers) {
      const docId = toDocId(name);
      if (!dailyMembersMap[docId]) {
        dailyMembersMap[docId] = {
          id: docId,
          name,
          matchesPlayed: 0,
          matchesWon: 0,
          points: 0,
          trophies: 0,
          winRate: 0,
          lastPlayedAt: match.timestamp
        };
      }
      dailyMembersMap[docId].points += 1;
      dailyMembersMap[docId].matchesPlayed += 1;
      if (!dailyMembersMap[docId].lastPlayedAt || match.timestamp > dailyMembersMap[docId].lastPlayedAt) {
        dailyMembersMap[docId].lastPlayedAt = match.timestamp;
      }
    }
  }

  // Calculate win rate & sort leaderboard
  const leaderboard = Object.values(dailyMembersMap)
    .map((member) => ({
      ...member,
      winRate: member.matchesPlayed > 0 ? Math.round((member.matchesWon / member.matchesPlayed) * 100) : 0
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      return a.name.localeCompare(b.name);
    });

  // Save/cache this aggregated day snapshot in Firestore for fast persistence
  if (dateMatches.length > 0) {
    DAILY_STATS_COL.doc(dateKey).set({
      dateKey,
      totalMatches: dateMatches.length,
      totalTournaments: dailyTournaments,
      lastUpdated: Date.now(),
      memberCount: leaderboard.length
    }, { merge: true }).catch(() => {});
  }

  const availableDates = await getAvailableDates();

  // All-time summary overview for badge context
  const statsSnap = await STATS_DOC.get();
  const statsData = statsSnap.exists ? statsSnap.data() : { totalMatchesDone: 0, totalTournamentsDone: 0 };
  const allMembersSnap = await MEMBERS_COL.get();

  return {
    view: 'daily',
    selectedDate: dateKey,
    formattedDate: formatFriendlyDate(dateKey),
    isToday,
    totalMatchesDone: dateMatches.length,
    totalTournamentsDone: dailyTournaments,
    leaderboard,
    recentMatches: dateMatches,
    mvp: leaderboard.length > 0 ? leaderboard[0] : null,
    availableDates,
    allTimeOverview: {
      totalMatchesDone: statsData.totalMatchesDone || 0,
      totalTournamentsDone: statsData.totalTournamentsDone || 0,
      totalMembers: allMembersSnap.size || 0
    }
  };
}

/**
 * Get overall club stats or daily stats depending on options
 */
async function getStats(options = {}) {
  const { date, view = 'daily' } = options;

  if (view === 'daily') {
    return getDailyStats(date);
  }

  // All-Time Leaderboard view
  const statsSnap = await STATS_DOC.get();
  const statsData = statsSnap.exists ? statsSnap.data() : { totalMatchesDone: 0, totalTournamentsDone: 0 };

  const membersSnap = await MEMBERS_COL.orderBy('points', 'desc').limit(50).get();
  const leaderboard = [];
  membersSnap.forEach((doc) => {
    leaderboard.push({ id: doc.id, ...doc.data() });
  });

  const matchesSnap = await MATCHES_COL.orderBy('timestamp', 'desc').limit(20).get();
  const recentMatches = [];
  matchesSnap.forEach((doc) => {
    recentMatches.push({ id: doc.id, ...doc.data() });
  });

  const availableDates = await getAvailableDates();
  const todayKey = getTodayDateKey();

  return {
    view: 'all-time',
    selectedDate: todayKey,
    formattedDate: 'All-Time Club History',
    isToday: false,
    totalMatchesDone: statsData.totalMatchesDone || 0,
    totalTournamentsDone: statsData.totalTournamentsDone || 0,
    leaderboard,
    recentMatches,
    mvp: leaderboard.length > 0 ? leaderboard[0] : null,
    availableDates,
    allTimeOverview: {
      totalMatchesDone: statsData.totalMatchesDone || 0,
      totalTournamentsDone: statsData.totalTournamentsDone || 0,
      totalMembers: leaderboard.length
    }
  };
}

/**
 * Get all registered members (all-time)
 */
async function getMembers() {
  const snap = await MEMBERS_COL.orderBy('points', 'desc').get();
  const members = [];
  snap.forEach((doc) => {
    members.push({ id: doc.id, ...doc.data() });
  });
  return members;
}

/**
 * Add or register a single member
 */
async function addMember(name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Member name cannot be empty');
  const docId = toDocId(trimmed);
  const docRef = MEMBERS_COL.doc(docId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    const newMember = {
      name: trimmed,
      matchesPlayed: 0,
      matchesWon: 0,
      points: 0,
      trophies: 0,
      winRate: 0,
      createdAt: Date.now(),
      lastPlayedAt: null
    };
    await docRef.set(newMember);
    return { id: docId, ...newMember, created: true };
  }
  return { id: docId, ...docSnap.data(), created: false };
}

/**
 * Delete a member
 */
async function deleteMember(memberId) {
  await MEMBERS_COL.doc(memberId).delete();
  return { success: true };
}

/**
 * Sync members from player names (creates member if not exists)
 */
async function syncMembers(playerNames) {
  const batch = db.batch();
  const updatedMembers = [];

  for (const name of playerNames) {
    const trimmed = typeof name === 'string' ? name.trim() : (name?.name || '').trim();
    if (!trimmed) continue;
    const docId = toDocId(trimmed);
    const docRef = MEMBERS_COL.doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      const newMember = {
        name: trimmed,
        matchesPlayed: 0,
        matchesWon: 0,
        points: 0,
        trophies: 0,
        winRate: 0,
        createdAt: Date.now(),
        lastPlayedAt: Date.now()
      };
      batch.set(docRef, newMember);
      updatedMembers.push({ id: docId, ...newMember });
    } else {
      updatedMembers.push({ id: docId, ...docSnap.data() });
    }
  }

  await batch.commit();
  return updatedMembers;
}

/**
 * Record a match result, update match count, award points for both daily and all-time
 */
async function recordMatch({ format, winnerTeam, loserTeam, isFinal = false, tournamentId, dateKey }) {
  const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = Date.now();
  const activeDateKey = dateKey || toDateKey(timestamp);

  const winnerNames = extractPlayerNames(winnerTeam.players);
  const loserNames = extractPlayerNames(loserTeam.players);

  // 1. Create match record with dateKey
  const matchRecord = {
    id: matchId,
    format: format || 'match',
    isFinal,
    tournamentId: tournamentId || null,
    dateKey: activeDateKey,
    winnerTeam: {
      name: winnerTeam.name,
      players: winnerNames
    },
    loserTeam: {
      name: loserTeam.name,
      players: loserNames
    },
    timestamp
  };

  await MATCHES_COL.doc(matchId).set(matchRecord);

  // 2. Update Club Stats (All-time)
  const statsSnap = await STATS_DOC.get();
  const currentTotal = statsSnap.exists ? statsSnap.data().totalMatchesDone || 0 : 0;
  const currentTourneys = statsSnap.exists ? statsSnap.data().totalTournamentsDone || 0 : 0;

  await STATS_DOC.set({
    totalMatchesDone: currentTotal + 1,
    totalTournamentsDone: isFinal ? currentTourneys + 1 : currentTourneys,
    lastMatchAt: timestamp
  }, { merge: true });

  // 3. Update All-Time Winners: +3 points, +1 match played, +1 match won
  for (const name of winnerNames) {
    const docId = toDocId(name);
    const docRef = MEMBERS_COL.doc(docId);
    const docSnap = await docRef.get();

    const existing = docSnap.exists ? docSnap.data() : { matchesPlayed: 0, matchesWon: 0, points: 0, trophies: 0 };
    const played = (existing.matchesPlayed || 0) + 1;
    const won = (existing.matchesWon || 0) + 1;
    const trophies = isFinal ? (existing.trophies || 0) + 1 : (existing.trophies || 0);
    const points = (existing.points || 0) + 3;
    const winRate = Math.round((won / played) * 100);

    await docRef.set({
      name,
      matchesPlayed: played,
      matchesWon: won,
      points,
      trophies,
      winRate,
      lastPlayedAt: timestamp
    }, { merge: true });
  }

  // 4. Update All-Time Losers: +1 point (participation), +1 match played
  for (const name of loserNames) {
    const docId = toDocId(name);
    const docRef = MEMBERS_COL.doc(docId);
    const docSnap = await docRef.get();

    const existing = docSnap.exists ? docSnap.data() : { matchesPlayed: 0, matchesWon: 0, points: 0, trophies: 0 };
    const played = (existing.matchesPlayed || 0) + 1;
    const won = existing.matchesWon || 0;
    const points = (existing.points || 0) + 1;
    const winRate = Math.round((won / played) * 100);

    await docRef.set({
      name,
      matchesPlayed: played,
      matchesWon: won,
      points,
      trophies: existing.trophies || 0,
      winRate,
      lastPlayedAt: timestamp
    }, { merge: true });
  }

  // 5. Update/Invalidate daily cache so getDailyStats retrieves fresh data
  try {
    await getDailyStats(activeDateKey);
  } catch (err) {
    console.error('Failed to refresh daily stats cache:', err);
  }

  return { success: true, matchId, dateKey: activeDateKey };
}

module.exports = {
  toDateKey,
  getTodayDateKey,
  getAvailableDates,
  getDailyStats,
  getStats,
  getMembers,
  addMember,
  deleteMember,
  syncMembers,
  recordMatch
};

