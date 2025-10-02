"use server"

import {
  getTeamStats,
  getSeasons,
  getPhases,
  getTeamPlayers,
  getTeamSchedule,
  debugPlayerData,
  getPlayerGameLogs,
  getTeamGameLogs,
  getTeamInfoByCode,
  // Import the new efficient functions from the new tables
  getTeamAdvancedStatsPrecalculated,
  getAllTeamAdvancedStatsPrecalculated,
  getLeagueAveragesPrecalculated,
  // Import the new player stats functions
  getPlayerStatsFromGameLogs,
  getTeamPlayerStatsFromGameLogs,
  calculateStandingsFromGameLogs,
  getTeamNamesAndLogos,
  getUniqueTeamCodesFromGameLogs,
  getTeamGameLogsWithOpponent,
  getAllTeamGameLogsWithOpponent,
} from "@/lib/db"
import { neon } from "@neondatabase/serverless"
import type { EuroleaguePlayerStats, EuroleagueGameLog, PlayerStatsFromGameLogs } from "@/lib/db"

// Debug the database URL
console.log("DATABASE_URL available:", !!process.env.DATABASE_URL)

export async function fetchTeamStats(season: number, phase: string, league = "euroleague"): Promise<any> {
  console.log("=== fetchTeamStats CALLED (USING CUMULATIVE STANDINGS) ===")
  console.log("Season:", season, "Phase:", phase, "League:", league)

  try {
    const result = await getTeamStats(season, phase, league)
    console.log("Cumulative standings result:", result.length, "teams found")
    return result
  } catch (error) {
    console.error("Error in fetchTeamStats:", error)
    return []
  }
}

export async function fetchSeasons(): Promise<any> {
  return await getSeasons()
}

export async function fetchPhases(season: number): Promise<any> {
  return await getPhases(season)
}

// UPDATED: Use the new efficient pre-calculated function from the new tables
export async function fetchTeamAdvancedStatsByTeamCode(
  teamCode: string,
  season: number,
  phase: string,
  league = "euroleague",
): Promise<any> {
  console.log("=== fetchTeamAdvancedStatsByTeamCode (NEW PRE-CALCULATED VERSION) ===")
  console.log("TeamCode:", teamCode, "Season:", season, "Phase:", phase, "League:", league)

  try {
    // Use the new pre-calculated function from the new tables
    const result = await getTeamAdvancedStatsPrecalculated(teamCode, season, phase, league)
    console.log("Pre-calculated advanced stats result:", result ? "found" : "not found")
    return result
  } catch (error) {
    console.error("Error in fetchTeamAdvancedStatsByTeamCode:", error)
    return null
  }
}

// NEW: Fetch all teams' pre-calculated advanced stats from the new tables
export async function fetchAllTeamAdvancedStatsCalculated(
  season: number,
  phase: string,
  league = "euroleague",
): Promise<any[]> {
  console.log("=== fetchAllTeamAdvancedStatsCalculated (NEW PRE-CALCULATED VERSION) ===")
  console.log("Season:", season, "Phase:", phase, "League:", league)

  try {
    const result = await getAllTeamAdvancedStatsPrecalculated(season, phase, league)
    console.log("All teams pre-calculated stats result:", result.length, "teams found")
    return result
  } catch (error) {
    console.error("Error in fetchAllTeamAdvancedStatsCalculated:", error)
    return []
  }
}

export async function fetchTeamAdvancedStatsByTeam(teamName: string, season: number, phase: string): Promise<any> {
  console.log("=== DEPRECATED: fetchTeamAdvancedStatsByTeam ===")
  console.log("This function should not be used anymore. Use fetchTeamAdvancedStatsByTeamCode instead.")
  console.log("TeamName:", teamName, "Season:", season, "Phase:", phase)

  // For now, return null to avoid errors
  return null
}

export async function fetchTeamPlayers(teamNameOrCode: string, season: number, phase: string): Promise<any[]> {
  console.log("=== SERVER ACTION DEBUG ===")
  console.log("fetchTeamPlayers called with:", { teamNameOrCode, season, phase })
  console.log("DATABASE_URL available:", !!process.env.DATABASE_URL)

  try {
    let teamCode: string

    // Check if the input is already a team code (3 letters, all caps)
    if (teamNameOrCode.length === 3 && teamNameOrCode === teamNameOrCode.toUpperCase()) {
      console.log("Input appears to be a team code:", teamNameOrCode)
      teamCode = teamNameOrCode
    } else {
      // For team names, we should not use hardcoded mappings anymore
      // Instead, we should get the teamcode from the database
      console.log("Input appears to be a team name, but we should use teamcode instead:", teamNameOrCode)
      console.log("This function should be called with teamcode directly")
      return []
    }

    console.log("Using team code:", teamCode, "for input:", teamNameOrCode)

    const players = await getTeamPlayers(teamCode, season, phase, "euroleague")
    console.log("Server action received players:", players.length)

    if (players.length > 0) {
      console.log("First player from server action:", players[0])
    }

    return players
  } catch (error) {
    console.error("Error in fetchTeamPlayers server action:", error)

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // Return empty array instead of throwing
    return []
  }
}

export async function fetchTeamPlayersDirectly(teamCode: string, season: number, phase: string): Promise<any[]> {
  console.log("=== fetchTeamPlayersDirectly CALLED ===")
  console.log("Direct teamcode:", teamCode, "Season:", season, "Phase:", phase)

  try {
    const players = await getTeamPlayers(teamCode, season, phase, "euroleague")
    console.log("Direct fetch received players:", players.length)
    return players
  } catch (error) {
    console.error("Error in fetchTeamPlayersDirectly:", error)
    return []
  }
}

export async function fetchTeamSchedule(teamCode: string, season: number, league = "euroleague"): Promise<any> {
  return await getTeamSchedule(teamCode, season, league)
}

export async function fetchDebugPlayerData(season: number): Promise<any> {
  return await debugPlayerData(season, "euroleague")
}

// Update the fetchAllPlayers function to handle rate limiting
export async function fetchAllPlayers(
  season = 2024,
  phase = "RS",
  league = "euroleague",
): Promise<EuroleaguePlayerStats[]> {
  console.log("=== fetchAllPlayers CALLED ===")
  console.log("Fetching players for season:", season, "phase:", phase, "league:", league)

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Add retry logic for this specific function
    let retries = 0
    const maxRetries = 3
    let delay = 1000

    while (retries <= maxRetries) {
      try {
        const tableName = league === "eurocup" ? "eurocup_player_stats_with_logo" : "euroleague_player_stats_with_logo"

        // Use sql.query for dynamic table names with placeholders
        const result = await sql.query(
          `SELECT * FROM ${tableName} WHERE season = $1 AND phase = $2 ORDER BY points_scored DESC`,
          [season, phase],
        )

        console.log("Query executed successfully, received", result.length, "rows")

        // Log a sample of the first result if available
        if (result.length > 0) {
          console.log("Sample result:", {
            id: result[0].id,
            player_name: result[0].player_name,
            season: result[0].season,
            phase: result[0].phase,
          })
        }

        return result as EuroleaguePlayerStats[]
      } catch (error) {
        // Check if it's a rate limit error
        const isRateLimit =
          error.message?.includes("Too Many") || error.message?.includes("rate limit") || error.message?.includes("429")

        retries++

        if (isRateLimit && retries <= maxRetries) {
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        } else {
          throw error // Not a rate limit error or max retries exceeded
        }
      }
    }

    throw new Error("Max retries exceeded")
  } catch (error) {
    console.error("Error in fetchAllPlayers:", error)
    throw error
  }
}

// NEW: Fetch pre-calculated player stats from game logs for all players - THIS IS THE KEY FUNCTION
export async function fetchPlayerStatsFromGameLogs(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {
  console.log("=== fetchPlayerStatsFromGameLogs CALLED (SERVER ACTION) ===")
  console.log("Input parameters:")
  console.log("- Season:", season, "Type:", typeof season)
  console.log("- Phase:", phase, "Type:", typeof phase)
  console.log("- League:", league, "Type:", typeof league)

  try {
    console.log("About to call getPlayerStatsFromGameLogs from lib/db")
    const result = await getPlayerStatsFromGameLogs(season, phase, league)

    console.log("=== SERVER ACTION RESULT ===")
    console.log("Result type:", typeof result)
    console.log("Result is array:", Array.isArray(result))
    console.log("Result length:", Array.isArray(result) ? result.length : "N/A")

    if (Array.isArray(result) && result.length > 0) {
      console.log("First result sample:", result[0])
      console.log("First result keys:", Object.keys(result[0]))
    } else {
      console.log("No results returned or result is not an array")
    }

    return result
  } catch (error) {
    console.error("=== ERROR IN SERVER ACTION ===")
    console.error("Error in fetchPlayerStatsFromGameLogs:", error)
    console.error("Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 500),
    })
    return []
  }
}

// NEW: Fetch pre-calculated player stats from game logs for a specific team
export async function fetchTeamPlayerStatsFromGameLogs(
  teamCode: string,
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {
  console.log("=== fetchTeamPlayerStatsFromGameLogs CALLED ===")
  console.log(
    "Fetching team pre-calculated player stats for:",
    teamCode,
    "season:",
    season,
    "phase:",
    phase,
    "league:",
    league,
  )

  try {
    const result = await getTeamPlayerStatsFromGameLogs(teamCode, season, phase, league)
    console.log("Team pre-calculated player stats result:", result.length, "players found")
    return result
  } catch (error) {
    console.error("Error in fetchTeamPlayerStatsFromGameLogs:", error)
    return []
  }
}

export async function fetchPlayerGameLogs(
  playerName: string,
  season = 2024,
  league = "euroleague",
): Promise<EuroleagueGameLog[]> {
  console.log("=== fetchPlayerGameLogs CALLED ===")
  console.log("Fetching game logs for:", playerName, "season:", season)

  try {
    const logs = await getPlayerGameLogs(playerName, season, league)
    console.log("Server action received game logs:", logs.length)

    if (logs.length > 0) {
      console.log("First game log from server action:", logs[0])
    }

    return logs
  } catch (error) {
    console.error("Error in fetchPlayerGameLogs server action:", error)

    // Log additional error details
    if (error instanceof Error) {
      console.error("Detailed error:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500), // Limit stack trace length
      })
    }

    return []
  }
}

export async function fetchTeamGameLogs(
  teamCode: string,
  season: number,
  league = "euroleague",
): Promise<EuroleagueGameLog[]> {
  console.log("=== fetchTeamGameLogs CALLED ===")
  console.log("Fetching team game logs for:", teamCode, "season:", season, "league:", league)

  try {
    const logs = await getTeamGameLogs(teamCode, season, league)
    console.log("Server action received team game logs:", logs.length)

    if (logs.length > 0) {
      console.log("First team game log from server action:", logs[0])
    }

    return logs
  } catch (error) {
    console.error("Error in fetchTeamGameLogs server action:", error)
    return []
  }
}

export async function fetchTeamGameLogsWithOpponent(
  teamCode: string,
  season: number,
  league = "euroleague",
): Promise<any[]> {
  console.log("=== fetchTeamGameLogsWithOpponent CALLED ===")
  console.log("Fetching team game logs with opponent for:", teamCode, "season:", season, "league:", league)

  try {
    const logs = await getTeamGameLogsWithOpponent(teamCode, season, league)
    console.log("Server action received team game logs with opponent:", logs.length)

    if (logs.length > 0) {
      console.log("First team game log with opponent from server action:", logs[0])
    }

    return logs
  } catch (error) {
    console.error("Error in fetchTeamGameLogsWithOpponent server action:", error)
    return []
  }
}

export async function fetchAllTeamGameLogsWithOpponent(season: number, league = "euroleague"): Promise<any[]> {
  console.log("=== fetchAllTeamGameLogsWithOpponent CALLED ===")
  console.log("Fetching all teams game logs for season:", season, "league:", league)

  try {
    const logs = await getAllTeamGameLogsWithOpponent(season, league)
    console.log("Server action received all teams game logs:", logs.length)

    return logs
  } catch (error) {
    console.error("Error in fetchAllTeamGameLogsWithOpponent server action:", error)
    return []
  }
}

export async function fetchTeamInfoByCode(teamCode: string, season: number): Promise<any> {
  return await getTeamInfoByCode(teamCode, season)
}

// NEW: Fetch standings calculated from game logs
export async function fetchStandingsFromGameLogs(season: number, phase: string, league = "euroleague"): Promise<any[]> {
  console.log("=== fetchStandingsFromGameLogs CALLED ===")
  console.log("Season:", season, "Phase:", phase, "League:", league)

  try {
    // Get standings calculated from game logs
    const standings = await calculateStandingsFromGameLogs(season, phase, league)

    // Get team names and logos
    const teamInfo = await getTeamNamesAndLogos(season, league)

    // Merge team info with standings
    const standingsWithTeamInfo = standings.map((team) => ({
      ...team,
      name: teamInfo[team.teamcode]?.name || team.name || team.teamcode,
      teamlogo: teamInfo[team.teamcode]?.logo || team.teamlogo || "",
    }))

    console.log("Calculated standings from game logs:", standingsWithTeamInfo.length, "teams")
    return standingsWithTeamInfo
  } catch (error) {
    console.error("Error in fetchStandingsFromGameLogs:", error)
    return []
  }
}

// NEW: Get all unique team codes from game logs for a specific season and league
export async function getAllTeamCodesFromGameLogs(season: number, league = "euroleague"): Promise<string[]> {
  console.log("=== getAllTeamCodesFromGameLogs CALLED ===")
  console.log("Season:", season, "League:", league)

  try {
    const teamCodes = await getUniqueTeamCodesFromGameLogs(season, league)
    console.log("Found unique team codes:", teamCodes.length, "teams")
    return teamCodes
  } catch (error) {
    console.error("Error in getAllTeamCodesFromGameLogs:", error)
    return []
  }
}

// NEW: Fetch league averages from pre-calculated tables
export async function fetchLeagueAveragesPrecalculated(
  season: number,
  phase: string,
  league = "euroleague",
): Promise<any> {
  console.log("=== fetchLeagueAveragesPrecalculated ===")
  console.log("Season:", season, "Phase:", phase, "League:", league)

  try {
    const result = await getLeagueAveragesPrecalculated(season, phase, league)
    console.log("League averages result:", result ? "found" : "not found")
    return result
  } catch (error) {
    console.error("Error in fetchLeagueAveragesPrecalculated:", error)
    return null
  }
}
