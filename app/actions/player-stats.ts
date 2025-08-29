"use server"

import { getPlayerStatsFromGameLogs } from "@/lib/db"
import type { PlayerStatsFromGameLogs } from "@/lib/types"

export async function fetchAllPlayerStatsFromGameLogs(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {
  console.log("=== fetchAllPlayerStatsFromGameLogs CALLED ===")
  console.log("Season:", season, "Phase:", phase, "League:", league)

  try {
    const result = await getPlayerStatsFromGameLogs(season, phase, league)
    console.log("Fetched", result.length, "players from pre-calculated stats")

    // Log sample data to debug
    if (result.length > 0) {
      console.log("Sample player data:", {
        name: result[0].player_name,
        team: result[0].player_team_name,
        teamCode: result[0].player_team_code,
        points: result[0].points_scored,
        games: result[0].games_played,
      })
    }

    return result
  } catch (error) {
    console.error("Error in fetchAllPlayerStatsFromGameLogs:", error)
    return []
  }
}
