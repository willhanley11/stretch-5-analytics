"use server"

import { getPlayerStatsFromGameLogs, getAllPlayersAcrossSeasons } from "@/lib/db"
import type { PlayerStatsFromGameLogs } from "@/lib/types"

export async function fetchAllPlayerStatsFromGameLogs(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {

  try {
    const result = await getPlayerStatsFromGameLogs(season, phase, league)

    return result
  } catch (error) {
    console.error("Error in fetchAllPlayerStatsFromGameLogs:", error)
    return []
  }
}

export async function fetchAllPlayersAcrossSeasons(
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {

  try {
    const result = await getAllPlayersAcrossSeasons(league)

    return result
  } catch (error) {
    console.error("Error in fetchAllPlayersAcrossSeasons:", error)
    return []
  }
}
