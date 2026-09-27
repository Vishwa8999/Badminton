package com.example.model

/**
 * An individual participant in the tournament.
 */
data class Player(
    val id: String,
    val name: String
)

/**
 * A 2-player team randomly paired from the 8 players.
 */
data class Team(
    val id: String,
    val name: String,
    val player1: Player,
    val player2: Player,
    val colorIndex: Int = 0
) {
    val displayNames: String
        get() = "${player1.name} + ${player2.name}"
}

enum class MatchRound {
    SEMIFINAL,
    FINAL
}

/**
 * A match in the single-elimination tournament.
 */
data class Match(
    val id: String,
    val round: MatchRound,
    val matchNumber: Int,
    val teamA: Team,
    val teamB: Team,
    val winnerId: String? = null
) {
    val isDecided: Boolean
        get() = winnerId != null

    val winner: Team?
        get() = when (winnerId) {
            teamA.id -> teamA
            teamB.id -> teamB
            else -> null
        }

    val loser: Team?
        get() = when (winnerId) {
            teamA.id -> teamB
            teamB.id -> teamA
            else -> null
        }
}

/**
 * Full state of an active tournament.
 */
data class TournamentData(
    val id: String,
    val timestamp: Long = System.currentTimeMillis(),
    val players: List<Player>,
    val teams: List<Team>,
    val semifinal1: Match,
    val semifinal2: Match,
    val finalMatch: Match? = null,
    val champion: Team? = null
) {
    val isSemifinalsComplete: Boolean
        get() = semifinal1.isDecided && semifinal2.isDecided

    val isTournamentComplete: Boolean
        get() = champion != null
}

/**
 * Step navigation for the user experience.
 */
enum class TournamentStep(val label: String) {
    SETUP("1. Players"),
    TEAMS("2. Teams"),
    BRACKET("3. Bracket"),
    CHAMPION("4. Champion")
}
