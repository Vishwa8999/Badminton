package com.example.logic

import com.example.model.Match
import com.example.model.MatchRound
import com.example.model.Player
import com.example.model.Team
import com.example.model.TournamentData
import java.util.UUID
import kotlin.random.Random

object TournamentEngine {

    val SAMPLE_PRESETS = mapOf(
        "Alpha (A-H)" to listOf("Player A", "Player B", "Player C", "Player D", "Player E", "Player F", "Player G", "Player H"),
        "Esports Legends" to listOf("Faker", "s1mple", "TenZ", "Shroud", "Boaster", "Aspas", "Chovy", "Scump"),
        "Champions" to listOf("Messi", "Zidane", "Henry", "Pelé", "Ronaldo", "Maradona", "Cruyff", "Ronaldinho"),
        "Casual Crew" to listOf("Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie")
    )

    data class ValidationResult(
        val isValid: Boolean,
        val fieldErrors: Map<Int, String> = emptyMap(),
        val globalError: String? = null
    )

    /**
     * Validates that the list contains exactly 8 non-blank, distinct player names.
     */
    fun validatePlayers(names: List<String>): ValidationResult {
        if (names.size != 8) {
            return ValidationResult(
                isValid = false,
                globalError = "Exactly 8 player names are required."
            )
        }

        val fieldErrors = mutableMapOf<Int, String>()
        val seenNames = mutableMapOf<String, Int>()

        names.forEachIndexed { index, rawName ->
            val trimmed = rawName.trim()
            if (trimmed.isEmpty()) {
                fieldErrors[index] = "Player ${index + 1} name cannot be empty."
            } else {
                val normalized = trimmed.lowercase()
                if (seenNames.containsKey(normalized)) {
                    val originalIndex = seenNames[normalized]!!
                    fieldErrors[index] = "Duplicate name: already used for Player ${originalIndex + 1}."
                } else {
                    seenNames[normalized] = index
                }
            }
        }

        return if (fieldErrors.isEmpty()) {
            ValidationResult(isValid = true)
        } else {
            ValidationResult(
                isValid = false,
                fieldErrors = fieldErrors,
                globalError = "Please ensure all 8 player names are filled and unique."
            )
        }
    }

    /**
     * Unbiased Fisher-Yates shuffle implementation.
     */
    fun <T> fisherYatesShuffle(list: List<T>, random: Random = Random.Default): List<T> {
        val array = list.toMutableList()
        for (i in array.size - 1 downTo 1) {
            val j = random.nextInt(i + 1)
            val temp = array[i]
            array[i] = array[j]
            array[j] = temp
        }
        return array
    }

    /**
     * Generates a new tournament from 8 validated player names.
     */
    fun generateTournament(
        rawNames: List<String>,
        random: Random = Random.Default
    ): TournamentData {
        val validation = validatePlayers(rawNames)
        require(validation.isValid) { validation.globalError ?: "Invalid player list" }

        val players = rawNames.mapIndexed { index, name ->
            Player(
                id = "player_${index + 1}_${UUID.randomUUID().toString().take(6)}",
                name = name.trim()
            )
        }

        return generateTournamentFromPlayers(players, random)
    }

    /**
     * Shuffles players, creates 4 teams of 2, shuffles teams, and creates 2 semifinals.
     */
    fun generateTournamentFromPlayers(
        players: List<Player>,
        random: Random = Random.Default
    ): TournamentData {
        require(players.size == 8) { "Tournament requires exactly 8 players." }

        // 1. Randomly shuffle the 8 players using Fisher-Yates
        val shuffledPlayers = fisherYatesShuffle(players, random)

        // 2. Create 4 teams of 2 players each
        val teams = (0 until 4).map { teamIndex ->
            val p1 = shuffledPlayers[teamIndex * 2]
            val p2 = shuffledPlayers[teamIndex * 2 + 1]
            Team(
                id = "team_${teamIndex + 1}_${UUID.randomUUID().toString().take(6)}",
                name = "Team ${teamIndex + 1}",
                player1 = p1,
                player2 = p2,
                colorIndex = teamIndex
            )
        }

        // 3. Randomly shuffle the 4 teams for semifinal pairings
        val shuffledTeams = fisherYatesShuffle(teams, random)

        // 4. Create Semifinal 1 and Semifinal 2
        val semi1 = Match(
            id = "match_semi_1_${UUID.randomUUID().toString().take(6)}",
            round = MatchRound.SEMIFINAL,
            matchNumber = 1,
            teamA = shuffledTeams[0],
            teamB = shuffledTeams[1],
            winnerId = null
        )

        val semi2 = Match(
            id = "match_semi_2_${UUID.randomUUID().toString().take(6)}",
            round = MatchRound.SEMIFINAL,
            matchNumber = 2,
            teamA = shuffledTeams[2],
            teamB = shuffledTeams[3],
            winnerId = null
        )

        return TournamentData(
            id = "tournament_${UUID.randomUUID().toString().take(8)}",
            players = players,
            teams = teams,
            semifinal1 = semi1,
            semifinal2 = semi2,
            finalMatch = null,
            champion = null
        )
    }

    /**
     * Updates the winner of a match (Semifinal 1, Semifinal 2, or Final)
     * and automatically advances winners to the Final or crowns the Champion.
     */
    fun setMatchWinner(
        current: TournamentData,
        matchId: String,
        winnerTeamId: String
    ): TournamentData {
        var updatedSemi1 = current.semifinal1
        var updatedSemi2 = current.semifinal2
        var updatedFinal = current.finalMatch
        var updatedChampion = current.champion

        when (matchId) {
            current.semifinal1.id -> {
                require(winnerTeamId == current.semifinal1.teamA.id || winnerTeamId == current.semifinal1.teamB.id) {
                    "Selected team is not a participant in Semifinal 1"
                }
                updatedSemi1 = current.semifinal1.copy(winnerId = winnerTeamId)
            }
            current.semifinal2.id -> {
                require(winnerTeamId == current.semifinal2.teamA.id || winnerTeamId == current.semifinal2.teamB.id) {
                    "Selected team is not a participant in Semifinal 2"
                }
                updatedSemi2 = current.semifinal2.copy(winnerId = winnerTeamId)
            }
            current.finalMatch?.id -> {
                val finalM = current.finalMatch
                require(winnerTeamId == finalM.teamA.id || winnerTeamId == finalM.teamB.id) {
                    "Selected team is not a participant in the Final"
                }
                updatedFinal = finalM.copy(winnerId = winnerTeamId)
                updatedChampion = if (winnerTeamId == finalM.teamA.id) finalM.teamA else finalM.teamB
                return current.copy(
                    finalMatch = updatedFinal,
                    champion = updatedChampion
                )
            }
            else -> {
                return current
            }
        }

        // Automatic Final Creation or Update when both Semifinals are decided
        val semi1Winner = updatedSemi1.winner
        val semi2Winner = updatedSemi2.winner

        if (semi1Winner != null && semi2Winner != null) {
            // Check if final was already created
            val existingFinal = updatedFinal
            if (existingFinal == null ||
                existingFinal.teamA.id != semi1Winner.id ||
                existingFinal.teamB.id != semi2Winner.id
            ) {
                // If teams changed, reset final winner & champion
                updatedFinal = Match(
                    id = existingFinal?.id ?: "match_final_${UUID.randomUUID().toString().take(6)}",
                    round = MatchRound.FINAL,
                    matchNumber = 3,
                    teamA = semi1Winner,
                    teamB = semi2Winner,
                    winnerId = null
                )
                updatedChampion = null
            }
        } else {
            // If one of the semifinals winner was cleared/changed to undecided
            updatedFinal = null
            updatedChampion = null
        }

        return current.copy(
            semifinal1 = updatedSemi1,
            semifinal2 = updatedSemi2,
            finalMatch = updatedFinal,
            champion = updatedChampion
        )
    }

    /**
     * Keeps the original 8 players, but re-randomizes teams and matchups.
     */
    fun regenerateTournament(
        current: TournamentData,
        random: Random = Random.Default
    ): TournamentData {
        return generateTournamentFromPlayers(current.players, random)
    }
}
