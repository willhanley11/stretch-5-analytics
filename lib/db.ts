import { neon } from "@neondatabase/serverless"

// Helper function to get table names based on league
function getTableNames(league: string) {
  const tableMap = {
    euroleague: {
      teamStats: "cumulative_standings_euroleague",
      playerStats: "euroleague_player_stats_with_logo",
      playerStatsFromGameLogs: "player_stats_from_gamelogs_euroleague", // NEW: Pre-calculated player stats
      gameLogs: "euroleague_game_logs",
      scheduleResults: "schedule_results_euroleague",
      shotData: "shot_data_euroleague",
      teamAdvanced: "euroleague_team_advanced",
      teamAdvancedPrecalculated: "team_advanced_stats_euroleague", // NEW: Pre-calculated table
    },
    eurocup: {
      teamStats: "cumulative_standings_eurocup",
      playerStats: "eurocup_player_stats_with_logo",
      playerStatsFromGameLogs: "player_stats_from_gamelogs_eurocup", // NEW: Pre-calculated player stats
      gameLogs: "eurocup_game_logs",
      scheduleResults: "schedule_results_eurocup",
      shotData: "shot_data_eurocup",
      teamAdvanced: "eurocup_team_advanced",
      teamAdvancedPrecalculated: "team_advanced_stats_eurocup", // NEW: Pre-calculated table
    },
  }

  return tableMap[league] || tableMap["euroleague"]
}

// Add this helper function at the top of the file, after the imports but before other functions
async function executeWithRetry(queryFn, maxRetries = 3, initialDelay = 1000) {
  let retries = 0
  let delay = initialDelay

  while (retries <= maxRetries) {
    try {
      return await queryFn()
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
}

// Create a SQL client with the connection string
export const sql = neon(process.env.DATABASE_URL || "")

// Type definitions based on your database schema
export interface EuroleagueTeamStats {
  season: number
  phase: string
  position: number
  teamcode: string
  name: string
  teamlogo: string
  w: number
  l: number
  win_percent: number
  diff: number
  home: string
  away: string
  l10: string
  streak: string
  efg: number
  to_percent: number
  oreb_percent: number
  ftrate: number
  efg_opp: number
  to_percent_opp: number
  oreb_percent_opp: number
  ftrate_opp: number
  // Add the offensive and defensive columns with the correct names
  pace_o: number
  pace_d: number
  efficiency_o: number
  efficiency_d: number
  blockrate_o: number
  blockrate_d: number
  stealrate_o: number
  stealrate_d: number
  assistrate_o: number
  assistrate_d: number
  threeattmprate_o: number
  threeattmprate_d: number
  threeperc_o: number
  threeperc_d: number
  twoperc_o: number
  twoperc_d: number
  ftperc_o: number
  ftperc_d: number
  efgperc_o: number
  efgperc_d: number
  orebperc_o: number
  orebperc_d: number
  toratio_o: number
  toratio_d: number
  ftrate_o: number
  ftrate_d: number
  points2perc_o: number
  points2perc_d: number
  points3perc_o: number
  points3perc_d: number
  pointsftperc_o: number
  pointsftperc_d: number
  foulsdrawnrate_o: number
  foulsdrawnrate_d: number
  valuerate_o: number
  valuerate_d: number
}

// Add the new interface for the advanced stats table
export interface EuroleagueTeamAdvanced {
  name: string
  teamcode: string
  teamlogo: string
  season: number
  phase: string
  pace: number
  pace_opp: number
  efficiency: number
  efficiency_opp: number
  blockrate: number
  blockrate_opp: number
  stealrate: number
  stealrate_opp: number
  assistrate: number
  assistrate_opp: number
  threeattamptrate: number
  threeattamptrate_opp: number
  threeperc: number
  threeperc_opp: number
  twoperc: number
  twoperc_opp: number
  ftperc: number
  ftperc_opp: number
  efgperc: number
  efgperc_opp: number
  orebperc: number
  orebperc_opp: number
  toratio: number
  toratio_opp: number
  ftrate: number
  ftrate_opp: number
  points2perc: number
  points2perc_opp: number
  points3perc: number
  points3perc_opp: number
  pointsftperc: number
  pointsftperc_opp: number
  foulsdrawnrate: number
  foulsdrawnrate_opp: number
  valuerate: number
  valuerate_opp: number
}

export interface ScheduleResult {
  id: number
  team: string
  teamcode: string
  teamlogo: string
  game_date: string
  opponent: string
  opponentcode: string
  opponentlogo: string
  round: number
  result: string
  location: string
  record: string
  team_score: number | null
  opponent_score: number | null
  gamecode: string
  season: number
  phase: string
}

// Updated interface to match your new database schema
export interface EuroleaguePlayerStats {
  id: number
  player_code: string
  player_name: string
  player_age: number
  player_imageurl: string
  player_team_code: string
  player_team_name: string
  teamlogo?: string // Add this line
  // All stats are now per game (no suffixes)
  games_played: number
  games_started: number
  minutes_played: number
  points_scored: number
  two_pointers_made: number
  two_pointers_attempted: number
  two_pointers_percentage: number
  three_pointers_made: number
  three_pointers_attempted: number
  three_pointers_percentage: number
  free_throws_made: number
  free_throws_attempted: number
  free_throws_percentage: number
  offensive_rebounds: number
  defensive_rebounds: number
  total_rebounds: number
  assists: number
  steals: number
  turnovers: number
  blocks: number
  blocks_against: number
  fouls_commited: number
  fouls_drawn: number
  pir: number
  double_doubles: number
  triple_doubles: number
  two_point_rate: number
  points_from_two_pointers_percentage: number
  points_from_three_pointers_percentage: number
  effective_field_goal_percentage: number
  offensive_rebounds_percentage: number
  defensive_rebounds_percentage: number
  rebounds_percentage: number
  assists_to_turnovers_ratio: number
  free_throws_rate: number
  season: number
  phase: string
}

// NEW: Interface for the pre-calculated player stats from game logs
export interface PlayerStatsFromGameLogs {
  season: number
  phase: string
  player_id: string
  player_name: string
  player_team_code: string
  player_team_name: string
  teamlogo: string
  games_played: number
  games_started: number
  minutes_played: number
  points_scored: number
  points_per_40: number
  two_pointers_made: number
  two_pointers_attempted: number
  two_pointers_percentage: number
  two_pointers_made_per_40: number
  two_pointers_attempted_per_40: number
  three_pointers_made: number
  three_pointers_attempted: number
  three_pointers_percentage: number
  three_pointers_made_per_40: number
  three_pointers_attempted_per_40: number
  free_throws_made: number
  free_throws_attempted: number
  free_throws_percentage: number
  free_throws_made_per_40: number
  free_throws_attempted_per_40: number
  offensive_rebounds: number
  defensive_rebounds: number
  total_rebounds: number
  offensive_rebounds_per_40: number
  defensive_rebounds_per_40: number
  total_rebounds_per_40: number
  assists: number
  steals: number
  turnovers: number
  blocks: number
  blocks_against: number
  fouls_commited: number
  fouls_drawn: number
  pir: number
  assists_per_40: number
  steals_per_40: number
  turnovers_per_40: number
  blocks_per_40: number
  blocks_against_per_40: number
  fouls_commited_per_40: number
  fouls_drawn_per_40: number
  pir_per_40: number
  total_points: number
  total_minutes: number
  total_two_pointers_made: number
  total_two_pointers_attempted: number
  total_three_pointers_made: number
  total_three_pointers_attempted: number
  total_free_throws_made: number
  total_free_throws_attempted: number
  total_offensive_rebounds: number
  total_defensive_rebounds: number
  total_total_rebounds: number
  total_assists: number
  total_steals: number
  total_turnovers: number
  total_blocks: number
  total_blocks_against: number
  total_fouls_commited: number
  total_fouls_drawn: number
  total_pir: number
}

// New interface for game logs
export interface EuroleagueGameLog {
  id: number
  season: number
  phase: string
  round: number
  gamecode: string
  home: number
  player_id: string
  is_starter: number
  is_playing: number
  team: string // This is the same as teamcode
  dorsal: number
  player: string
  minutes: string
  points: number
  field_goals_made_2: number
  field_goals_attempted_2: number
  field_goals_made_3: number
  field_goals_attempted_3: number
  free_throws_made: number
  free_throws_attempted: number
  offensive_rebounds: number
  defensive_rebounds: number
  total_rebounds: number
  assistances: number
  steals: number
  turnovers: number
  blocks_favour: number
  blocks_against: number
  fouls_commited: number
  fouls_received: number
  valuation: number
  plusminus: number
  game_sequence: number
  season_round: string
  // Computed fields
  opponent?: string
  location?: string
  date?: string
}

// Add the new interface for the pre-calculated advanced stats
export interface TeamAdvancedStatsCalculated {
  id: number
  season: number
  phase: string
  teamcode: string
  teamname: string
  teamlogo: string
  games_played: number

  // Basic efficiency metrics
  pace: number
  efficiency_o: number
  efficiency_d: number
  net_rating: number

  // Four Factors
  efgperc_o: number
  toratio_o: number
  orebperc_o: number
  ftrate_o: number
  efgperc_d: number
  toratio_d: number
  orebperc_d: number
  ftrate_d: number

  // Shooting percentages
  threeperc_o: number
  twoperc_o: number
  ftperc_o: number
  threeperc_d: number
  twoperc_d: number
  ftperc_d: number

  // Additional rates
  threeattmprate_o: number
  assistperc_o: number
  stealperc_o: number
  blockperc_o: number
  threeattmprate_d: number
  assistperc_d: number
  stealperc_d: number
  blockperc_d: number

  // Point distribution
  points2perc_o: number
  points3perc_o: number
  pointsftperc_o: number
  points2perc_d: number
  points3perc_d: number
  pointsftperc_d: number

  // Rankings
  rank_pace: number
  rank_efficiency_o: number
  rank_efficiency_d: number
  rank_net_rating: number
  rank_efgperc_o: number
  rank_efgperc_d: number
  rank_toratio_o: number
  rank_toratio_d: number
  rank_orebperc_o: number
  rank_orebperc_d: number
  rank_ftrate_o: number
  rank_ftrate_d: number
  rank_threeperc_o: number
  rank_threeperc_d: number
  rank_twoperc_o: number
  rank_twoperc_d: number
  rank_ftperc_o: number
  rank_ftperc_d: number
  rank_threeattmprate_o: number
  rank_threeattmprate_d: number
  rank_points2perc_o: number
  rank_points2perc_d: number
  rank_points3perc_o: number
  rank_points3perc_d: number
  rank_pointsftperc_o: number
  rank_pointsftperc_d: number

  // Metadata
  created_at: string
  updated_at: string
}

// NEW: Interface for the pre-calculated advanced stats tables
export interface TeamAdvancedStatsPrecalculated {
  id: number
  season: number
  phase: string
  teamcode: string
  teamname: string
  teamlogo: string
  games_played: number

  // Basic efficiency metrics
  pace: number
  efficiency_o: number
  efficiency_d: number
  net_rating: number

  // Four Factors
  efgperc_o: number
  toratio_o: number
  orebperc_o: number
  ftrate_o: number
  efgperc_d: number
  toratio_d: number
  orebperc_d: number
  ftrate_d: number

  // Shooting percentages
  threeperc_o: number
  twoperc_o: number
  ftperc_o: number
  threeperc_d: number
  twoperc_d: number
  ftperc_d: number

  // Additional rates
  threeattmprate_o: number
  assistperc_o: number
  stealperc_o: number
  blockperc_o: number
  threeattmprate_d: number
  assistperc_d: number
  stealperc_d: number
  blockperc_d: number

  // Point distribution
  points2perc_o: number
  points3perc_o: number
  pointsftperc_o: number
  points2perc_d: number
  points3perc_d: number
  pointsftperc_d: number

  // Rankings
  rank_pace: number
  rank_efficiency_o: number
  rank_efficiency_d: number
  rank_net_rating: number
  rank_efgperc_o: number
  rank_efgperc_d: number
  rank_toratio_o: number
  rank_toratio_d: number
  rank_orebperc_o: number
  rank_orebperc_d: number
  rank_ftrate_o: number
  rank_ftrate_d: number
  rank_threeperc_o: number
  rank_threeperc_d: number
  rank_twoperc_o: number
  rank_twoperc_d: number
  rank_ftperc_o: number
  rank_ftperc_d: number
  rank_threeattmprate_o: number
  rank_threeattmprate_d: number
  rank_assistperc_o: number
  rank_stealperc_o: number
  rank_blockperc_o: number
  rank_assistperc_d: number
  rank_stealperc_d: number
  rank_blockperc_d: number
  rank_points2perc_o: number
  rank_points2perc_d: number
  rank_points3perc_o: number
  rank_points3perc_d: number
  rank_pointsftperc_o: number
  rank_pointsftperc_d: number

  // Metadata
  created_at: string
  updated_at: string
}

// Update the getTeamStats function to use the retry logic
export async function getTeamStats(season = 2024, phase = "RS", league = "euroleague"): Promise<EuroleagueTeamStats[]> {
  try {
    const tables = getTableNames(league)
    const tableName = tables.teamStats

    const stats = await executeWithRetry(async () => {
      // Use sql.query for dynamic table names
      return (await sql.query(`SELECT * FROM ${tableName} WHERE season = $1 AND phase = $2 ORDER BY position ASC`, [
        season,
        phase,
      ])) as EuroleagueTeamStats[]
    })
    return stats
  } catch (error) {
    console.error("Error fetching team stats:", error)
    return []
  }
}

// Update the getTeamAdvancedStats function to use the retry logic
export async function getTeamAdvancedStats(season = 2024, phase = "RS"): Promise<EuroleagueTeamAdvanced[]> {
  try {
    const stats = await executeWithRetry(async () => {
      return await sql<EuroleagueTeamAdvanced[]>`
        SELECT * FROM public.euroleague_team_advanced 
        WHERE season = ${season} AND phase = ${phase}
        ORDER BY name ASC
      `
    })
    return stats
  } catch (error) {
    console.error("Error fetching advanced team stats:", error)
    return []
  }
}

// Update the getTeamAdvancedStatsByTeam function to use the retry logic
export async function getTeamAdvancedStatsByTeam(
  teamCode: string, // Changed from teamName to teamCode
  season = 2024,
  phase = "RS",
): Promise<EuroleagueTeamAdvanced | null> {
  try {
    const stats = await executeWithRetry(async () => {
      return await sql<EuroleagueTeamAdvanced[]>`
        SELECT * FROM public.euroleague_team_advanced 
        WHERE teamcode = ${teamCode} AND season = ${season} AND phase = ${phase}
        LIMIT 1
      `
    })
    return stats.length > 0 ? stats[0] : null
  } catch (error) {
    console.error("Error fetching team advanced stats:", error)
    return null
  }
}

// NEW FUNCTION: Get pre-calculated advanced stats for a specific team from the new tables
export async function getTeamAdvancedStatsPrecalculated(
  teamCode: string,
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<TeamAdvancedStatsPrecalculated | null> {
  try {
    console.log("=== FETCHING PRE-CALCULATED ADVANCED STATS FROM NEW TABLES ===")
    console.log("TeamCode:", teamCode, "Season:", season, "Phase:", phase, "League:", league)

    const tables = getTableNames(league)
    const tableName = tables.teamAdvancedPrecalculated

    console.log("Using table name:", tableName)

    const stats = await executeWithRetry(async () => {
      return (await sql.query(`SELECT * FROM ${tableName} WHERE teamcode = $1 AND season = $2 AND phase = $3 LIMIT 1`, [
        teamCode,
        season,
        phase,
      ])) as TeamAdvancedStatsPrecalculated[]
    })

    console.log("Pre-calculated stats found:", stats.length > 0 ? "YES" : "NO")
    if (stats.length > 0) {
      console.log("Sample data keys:", Object.keys(stats[0]))
    }
    return stats.length > 0 ? stats[0] : null
  } catch (error) {
    console.error("Error fetching pre-calculated team advanced stats:", error)
    return null
  }
}

// NEW FUNCTION: Get all pre-calculated advanced stats for a season/phase from the new tables
export async function getAllTeamAdvancedStatsPrecalculated(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<TeamAdvancedStatsPrecalculated[]> {
  try {
    console.log("=== FETCHING ALL PRE-CALCULATED ADVANCED STATS FROM NEW TABLES ===")
    console.log("Season:", season, "Phase:", phase, "League:", league)

    const tables = getTableNames(league)
    const tableName = tables.teamAdvancedPrecalculated

    console.log("Using table name:", tableName)

    const stats = await executeWithRetry(async () => {
      return (await sql.query(
        `SELECT * FROM ${tableName} WHERE season = $1 AND phase = $2 AND teamcode != 'League' ORDER BY teamname ASC`,
        [season, phase],
      )) as TeamAdvancedStatsPrecalculated[]
    })

    console.log("Pre-calculated stats for all teams found:", stats.length)
    if (stats.length > 0) {
      console.log(
        "Sample team codes:",
        stats.slice(0, 3).map((s) => s.teamcode),
      )
    }
    return stats
  } catch (error) {
    console.error("Error fetching all pre-calculated team advanced stats:", error)
    return []
  }
}

// NEW FUNCTION: Get league averages from the pre-calculated tables
export async function getLeagueAveragesPrecalculated(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<TeamAdvancedStatsPrecalculated | null> {
  try {
    console.log("=== FETCHING LEAGUE AVERAGES FROM PRE-CALCULATED TABLES ===")
    console.log("Season:", season, "Phase:", phase, "League:", league)

    const tables = getTableNames(league)
    const tableName = tables.teamAdvancedPrecalculated

    console.log("Using table name:", tableName)

    const stats = await executeWithRetry(async () => {
      return (await sql.query(
        `SELECT * FROM ${tableName} WHERE teamcode = 'League' AND season = $1 AND phase = $2 LIMIT 1`,
        [season, phase],
      )) as TeamAdvancedStatsPrecalculated[]
    })

    console.log("League averages found:", stats.length > 0 ? "YES" : "NO")
    return stats.length > 0 ? stats[0] : null
  } catch (error) {
    console.error("Error fetching league averages from pre-calculated tables:", error)
    return null
  }
}

// NEW FUNCTION: Get pre-calculated player stats from game logs
export async function getPlayerStatsFromGameLogs(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {
  try {
    console.log("=== FETCHING PRE-CALCULATED PLAYER STATS FROM GAME LOGS (DB FUNCTION) ===")
    console.log("Input parameters:")
    console.log("- Season:", season, "Type:", typeof season)
    console.log("- Phase:", phase, "Type:", typeof phase)
    console.log("- League:", league, "Type:", typeof league)

    const tables = getTableNames(league)
    const tableName = tables.playerStatsFromGameLogs

    console.log("Table mapping result:", tables)
    console.log("Using table name:", tableName)

    // Check if table exists first
    console.log("Checking if table exists...")
    const tableExists = await executeWithRetry(async () => {
      return await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `
    })
    console.log("Table exists check result:", tableExists)

    // Get a sample of what's in the table
    console.log("Getting sample data from table...")
    const sampleData = await executeWithRetry(async () => {
      return (await sql.query(`SELECT * FROM ${tableName} LIMIT 3`)) as PlayerStatsFromGameLogs[]
    })
    console.log("Sample data count:", sampleData.length)
    if (sampleData.length > 0) {
      console.log("Sample record:", sampleData[0])
      console.log("Sample record keys:", Object.keys(sampleData[0]))
    }

    // Check what seasons are available
    console.log("Checking available seasons...")
    const availableSeasons = await executeWithRetry(async () => {
      return await sql.query(`SELECT DISTINCT season FROM ${tableName} ORDER BY season`)
    })
    console.log("Available seasons:", availableSeasons)

    // Check what phases are available for the requested season
    console.log("Checking available phases for season", season)
    const availablePhases = await executeWithRetry(async () => {
      return await sql.query(`SELECT DISTINCT phase FROM ${tableName} WHERE season = $1 ORDER BY phase`, [season])
    })
    console.log("Available phases for season", season, ":", availablePhases)

    // Now execute the main query
    console.log("Executing main query...")
    console.log("Query: SELECT * FROM", tableName, "WHERE season =", season, "AND phase =", phase)

    const stats = await executeWithRetry(async () => {
      return (await sql.query(
        `SELECT * FROM ${tableName} WHERE season = $1 AND phase = $2 ORDER BY points_scored DESC`,
        [season, phase],
      )) as PlayerStatsFromGameLogs[]
    })

    console.log("=== QUERY RESULTS ===")
    console.log("Query executed successfully")
    console.log("Results count:", stats.length)
    console.log("Results type:", typeof stats)
    console.log("Results is array:", Array.isArray(stats))

    if (stats.length > 0) {
      console.log("First result:", stats[0])
      console.log("First result keys:", Object.keys(stats[0]))
      console.log("Sample player name:", stats[0].player_name)
      console.log("Sample team code:", stats[0].player_team_code)
      console.log("Sample points:", stats[0].points_scored)
    } else {
      console.log("No results found for the query")
    }

    return stats
  } catch (error) {
    console.error("=== ERROR IN DB FUNCTION ===")
    console.error("Error fetching pre-calculated player stats from game logs:", error)
    console.error("Error details:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 500),
    })
    return []
  }
}

// NEW FUNCTION: Get pre-calculated player stats for a specific team
export async function getTeamPlayerStatsFromGameLogs(
  teamCode: string,
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {
  try {
    console.log("=== FETCHING TEAM PRE-CALCULATED PLAYER STATS FROM GAME LOGS ===")
    console.log("TeamCode:", teamCode, "Season:", season, "Phase:", phase, "League:", league)

    const tables = getTableNames(league)
    const tableName = tables.playerStatsFromGameLogs

    console.log("Using table name:", tableName)

    const stats = await executeWithRetry(async () => {
      return (await sql.query(
        `SELECT * FROM ${tableName} WHERE player_team_code = $1 AND season = $2 AND phase = $3 ORDER BY points_scored DESC`,
        [teamCode, season, phase],
      )) as PlayerStatsFromGameLogs[]
    })

    console.log("Pre-calculated player stats for team found:", stats.length)
    return stats
  } catch (error) {
    console.error("Error fetching team pre-calculated player stats from game logs:", error)
    return []
  }
}

// FUNCTION: Get pre-calculated advanced stats for a specific team (LEGACY - keeping for compatibility)
export async function getTeamAdvancedStatsCalculated(
  teamCode: string,
  season: number,
  phase = "RS",
): Promise<TeamAdvancedStatsCalculated | null> {
  try {
    console.log("=== FETCHING PRE-CALCULATED ADVANCED STATS (LEGACY) ===")
    console.log("TeamCode:", teamCode, "Season:", season, "Phase:", phase)

    const stats = await executeWithRetry(async () => {
      return await sql<TeamAdvancedStatsCalculated[]>`
        SELECT * FROM public.team_advanced_stats_calculated 
        WHERE teamcode = ${teamCode} AND season = ${season} AND phase = ${phase}
        LIMIT 1
      `
    })

    console.log("Pre-calculated stats found:", stats.length > 0 ? "YES" : "NO")
    return stats.length > 0 ? stats[0] : null
  } catch (error) {
    console.error("Error fetching pre-calculated team advanced stats:", error)
    return null
  }
}

// FUNCTION: Get all pre-calculated advanced stats for a season/phase (LEGACY - keeping for compatibility)
export async function getAllTeamAdvancedStatsCalculated(
  season: number,
  phase = "RS",
): Promise<TeamAdvancedStatsCalculated[]> {
  try {
    console.log("=== FETCHING ALL PRE-CALCULATED ADVANCED STATS (LEGACY) ===")
    console.log("Season:", season, "Phase:", phase)

    const stats = await executeWithRetry(async () => {
      return await sql<TeamAdvancedStatsCalculated[]>`
        SELECT * FROM public.team_advanced_stats_calculated 
        WHERE season = ${season} AND phase = ${phase}
        ORDER BY teamname ASC
      `
    })

    console.log("Pre-calculated stats for all teams found:", stats.length)
    return stats
  } catch (error) {
    console.error("Error fetching all pre-calculated team advanced stats:", error)
    return []
  }
}

// Function to get team code from team name for UI purposes:

export function getTeamCodeFromName(teamName: string): string | null {
  const teamNameToCode = {
    "Zalgiris Kaunas": "ZAL",
    "FC Bayern Munich": "MUN",
    "Maccabi Playtika Tel Aviv": "TEL",
    "ALBA Berlin": "BER",
    "Paris Basketball": "PRS",
    "LDLC ASVEL Villeurbanne": "ASV",
    "EA7 Emporio Armani Milan": "MIL",
    "Panathinaikos AKTOR Athens": "PAN",
    "Baskonia Vitoria-Gasteiz": "BAS",
    "FC Barcelona": "BAR",
    "Fenerbahce Beko Istanbul": "ULK",
    "Virtus Segafredo Bologna": "VIR",
    "AS Monaco": "MCO",
    "Real Madrid": "MAD",
    "Olympiacos Piraeus": "OLY",
    "Anadolu Efes Istanbul": "IST",
    "Partizan Mozzart Bet Belgrade": "PAR",
    "Crvena Zvezda Meridianbet Belgrade": "RED",
  }

  return teamNameToCode[teamName] || null
}

// Update the getSeasons function to use the retry logic
export async function getSeasons(): Promise<number[]> {
  try {
    const seasons = await executeWithRetry(async () => {
      return await sql<{ season: number }[]>`
        SELECT DISTINCT season FROM public.cumulative_standings_euroleague
        ORDER BY season DESC
      `
    })
    return seasons.map((s) => s.season)
  } catch (error) {
    console.error("Error fetching seasons:", error)
    return []
  }
}

// Function to get available phases for a season
// Update the getPhases function to use the retry logic
export async function getPhases(season: number): Promise<string[]> {
  try {
    const phases = await executeWithRetry(async () => {
      return await sql<{ phase: string }[]>`
        SELECT DISTINCT phase FROM public.cumulative_standings_euroleague
        WHERE season = ${season}
        ORDER BY phase
      `
    })
    return phases.map((p) => p.phase)
  } catch (error) {
    console.error("Error fetching phases:", error)
    return []
  }
}

// Function to get team schedule
export async function getTeamSchedule(
  teamcode: string,
  season: number,
  league = "euroleague",
): Promise<ScheduleResult[]> {
  try {
    const tables = getTableNames(league)
    const tableName = tables.scheduleResults

    console.log("=== FETCHING TEAM SCHEDULE ===")
    console.log("Using table:", tableName, "for league:", league)

    const results = await executeWithRetry(async () => {
      // For Eurocup, include all phases but order them properly (RS first, then TS, then playoffs)
      // For Euroleague, keep existing behavior (all phases)
      if (league === "eurocup") {
        return (await sql.query(
          `SELECT * FROM ${tableName} 
           WHERE teamcode = $1 AND season = $2 
           ORDER BY 
             CASE 
               WHEN phase = 'RS' THEN 1 
               WHEN phase = 'TS' THEN 2 
               WHEN phase = '8F' THEN 3
               WHEN phase = '4F' THEN 4
               WHEN phase = '2F' THEN 5
               WHEN phase = 'Final' THEN 6
               ELSE 7 
             END,
             round ASC`, 
          [teamcode, season]
        )) as ScheduleResult[]
      } else {
        return (await sql.query(`SELECT * FROM ${tableName} WHERE teamcode = $1 AND season = $2 ORDER BY round ASC`, [
          teamcode,
          season,
        ])) as ScheduleResult[]
      }
    })

    console.log("Schedule results found:", results.length)
    return results
  } catch (error) {
    console.error("Error fetching team schedule:", error)
    return []
  }
}

// Updated function to get players for a specific team using team code
export async function getTeamPlayers(
  teamCode: string,
  season: number,
  phase: string,
  league = "euroleague",
): Promise<EuroleaguePlayerStats[]> {
  try {
    console.log("=== PLAYER FETCH DEBUG ===")
    console.log("Input - Team Code:", teamCode, "Season:", season, "Phase:", phase, "League:", league)
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL)

    // Get the correct table name using the table mapping
    const tables = getTableNames(league)
    const tableName = tables.playerStatsFromGameLogs
    console.log("Using table name:", tableName)

    // Test basic connection first with retry
    try {
      await executeWithRetry(async () => {
        const connectionTest = await sql`SELECT 1 as test`
        console.log("Database connection test successful:", connectionTest)
      })
    } catch (connError) {
      console.error("Database connection failed after retries:", connError)
      throw new Error(`Database connection failed: ${connError.message}`)
    }

    // Check if the table exists with retry
    try {
      await executeWithRetry(async () => {
        const tableCheck = await sql`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = ${tableName}
        `
        console.log("Player stats table exists:", tableCheck[0]?.count > 0)
      })
    } catch (tableError) {
      console.error("Error checking table existence:", tableError)
    }

    // First, let's see what teams are available in the player stats table with retry
    const availableTeams = await executeWithRetry(async () => {
      return await sql.query(
        `SELECT DISTINCT player_team_name, player_team_code, season, phase 
         FROM ${tableName} 
         WHERE season = $1
         ORDER BY player_team_name`,
        [season]
      ) as { player_team_name: string; player_team_code: string; season: number; phase: string }[]
    })

    console.log("Available teams in player stats:", availableTeams)

    // Let's also check what data exists for any team to see if the stats are populated with retry
    const sampleData = await executeWithRetry(async () => {
      return await sql.query(
        `SELECT * FROM ${tableName} 
         WHERE season = $1 AND phase = $2
         LIMIT 3`,
        [season, phase]
      ) as EuroleaguePlayerStats[]
    })

    console.log("Sample player data from database:", sampleData)

    // Primary approach: Use team code directly with retry
    const players = await executeWithRetry(async () => {
      return await sql.query(
        `SELECT * FROM ${tableName} 
         WHERE player_team_code = $1 AND season = $2 AND phase = $3
         ORDER BY points_scored DESC`,
        [teamCode, season, phase]
      ) as EuroleaguePlayerStats[]
    })

    console.log("Team code query found:", players.length, "players")

    // If no results with phase, try without phase filter with retry
    if (players.length === 0) {
      const playersNoPhase = await executeWithRetry(async () => {
        return await sql.query(
          `SELECT * FROM ${tableName} 
           WHERE player_team_code = $1 AND season = $2
           ORDER BY points_scored DESC`,
          [teamCode, season]
        ) as EuroleaguePlayerStats[]
      })

      console.log("Team code query (no phase filter) found:", playersNoPhase.length, "players")
      return playersNoPhase
    }

    console.log("Final result:", players.length, "players found")
    return players
  } catch (error) {
    console.error("Error fetching team players:", error)
    return []
  }
}

// Update the getAllPlayers function to use the retry logic
export async function getAllPlayers(
  season: number,
  phase: string,
  league = "euroleague",
): Promise<EuroleaguePlayerStats[]> {
  try {
    console.log("=== FETCHING ALL PLAYERS ===")
    console.log("Season:", season, "Phase:", phase, "League:", league)

    const tables = getTableNames(league)
    const tableName = tables.playerStats

    const players = await executeWithRetry(async () => {
      return (await sql.query(
        `SELECT * FROM ${tableName} WHERE season = $1 AND phase = $2 ORDER BY points_scored DESC`,
        [season, phase],
      )) as EuroleaguePlayerStats[]
    })

    console.log("Found", players.length, "total players for season", season, "phase", phase, "league", league)

    return players
  } catch (error) {
    console.error("Error fetching all players:", error)
    return []
  }
}

// Update the getPlayerGameLogs function to better resolve opponent logos from schedule_results

// Find the getPlayerGameLogs function and replace it with this enhanced version:
export async function getPlayerGameLogs(
  playerName: string,
  season: number,
  league = "euroleague",
): Promise<EuroleagueGameLog[]> {
  try {
    console.log("=== FETCHING PLAYER GAME LOGS ===")
    console.log("Player:", playerName, "Season:", season)

    const tables = getTableNames(league)
    const gameLogsTable = tables.gameLogs
    const scheduleTable = tables.scheduleResults

    console.log("Using game logs table:", gameLogsTable, "for league:", league)
    console.log("Using schedule table:", scheduleTable, "for league:", league)

    // Add a small delay to prevent overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Enhanced query to get opponent information with multiple fallback strategies
    const gameLogs = await executeWithRetry(async () => {
      return (await sql.query(
        `
        WITH player_games AS (
          SELECT 
            gl.*,
            -- Try to get opponent from schedule_results first
            COALESCE(
              sr1.opponentcode,
              sr2.teamcode,
              -- Fallback: try to find another team in the same game
              (SELECT DISTINCT team 
               FROM ${gameLogsTable} gl2 
               WHERE gl2.gamecode = gl.gamecode 
                 AND gl2.season = gl.season 
                 AND gl2.team != gl.team 
               LIMIT 1)
            ) as opponent_code,
            COALESCE(
              sr1.opponentlogo,
              sr2.teamlogo,
              -- Fallback: try to get logo from team stats
              (SELECT teamlogo 
               FROM ${getTableNames(league).teamStats} ts 
               WHERE ts.teamcode = (
                 SELECT DISTINCT team 
                 FROM ${gameLogsTable} gl2 
                 WHERE gl2.gamecode = gl.gamecode 
                   AND gl2.season = gl.season 
                   AND gl2.team != gl.team 
                 LIMIT 1
               ) AND ts.season = gl.season 
               LIMIT 1)
            ) as opponent_logo,
            COALESCE(sr1.game_date, sr2.game_date) as game_date
          FROM ${gameLogsTable} gl
          -- First join: try to match as home team
          LEFT JOIN ${scheduleTable} sr1 ON 
            sr1.season = gl.season 
            AND sr1.gamecode = gl.gamecode 
            AND sr1.teamcode = gl.team
          -- Second join: try to match as away team  
          LEFT JOIN ${scheduleTable} sr2 ON 
            sr2.season = gl.season 
            AND sr2.gamecode = gl.gamecode 
            AND sr2.opponentcode = gl.team
          WHERE gl.player = $1 AND gl.season = $2
        )
        SELECT * FROM player_games
        ORDER BY round ASC
      `,
        [playerName, season],
      )) as EuroleagueGameLog[]
    })

    console.log("Found", gameLogs.length, "game logs for", playerName)

    // Process the results to add computed fields
    const processedLogs = gameLogs.map((log) => {
      // Determine location based on home/away
      const location = log.home === 1 ? "Home" : "Away"

      return {
        ...log,
        location,
        // Use the opponent_code from the enhanced query
        opponent: log.opponent_code || `Round ${log.round}`,
        opponent_logo: log.opponent_logo,
        date: log.game_date ? log.game_date : `R${log.round}`,
      }
    })

    return processedLogs
  } catch (error) {
    console.error("Error fetching player game logs for", playerName, ":", error)

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // Return empty array instead of throwing to prevent cascade failures
    return []
  }
}

// Add a function to get team info by team code (for fallback logo resolution)
export async function getTeamInfoByCode(
  teamCode: string,
  season: number,
): Promise<{ teamcode: string; teamlogo: string } | null> {
  try {
    const teamInfo = await executeWithRetry(async () => {
      return await sql<{ teamcode: string; teamlogo: string }[]>`
        SELECT teamcode, teamlogo 
        FROM public.cumulative_standings_euroleague 
        WHERE teamcode = ${teamCode} AND season = ${season}
        LIMIT 1
      `
    })
    return teamInfo.length > 0 ? teamInfo[0] : null
  } catch (error) {
    console.error("Error fetching team info by code:", error)
    return null
  }
}

// Add a function to get player's team from game logs:

// Update the getPlayerTeamFromGameLogs function to use the retry logic
export async function getPlayerTeamFromGameLogs(playerName: string, season: number): Promise<string | null> {
  try {
    const result = await executeWithRetry(async () => {
      return await sql<{ team: string }[]>`
        SELECT DISTINCT team FROM public.euroleague_game_logs 
        WHERE player = ${playerName} AND season = ${season}
        LIMIT 1
      `
    })
    return result.length > 0 ? result[0].team : null // This returns the teamcode
  } catch (error) {
    console.error("Error fetching player team from game logs:", error)
    return null
  }
}

// Add a debug function to check what data exists
// Update the debugPlayerData function to use the retry logic
export async function debugPlayerData(season: number, league = "euroleague"): Promise<any> {
  try {
    const tables = getTableNames(league)
    const tableName = tables.playerStatsFromGameLogs
    
    const teams = await executeWithRetry(async () => {
      return await sql.query(
        `SELECT DISTINCT player_team_name, player_team_code, season, phase, COUNT(*) as player_count
         FROM ${tableName} 
         WHERE season = $1
         GROUP BY player_team_name, player_team_code, season, phase
         ORDER BY player_team_name`,
        [season]
      )
    })

    const teamStats = await executeWithRetry(async () => {
      return await sql`
        SELECT DISTINCT name, teamcode, season, phase
        FROM public.cumulative_standings_euroleague 
        WHERE season = ${season}
        ORDER BY name
      `
    })

    return {
      playerTeams: teams,
      teamStatsTeams: teamStats,
    }
  } catch (error) {
    console.error("Error in debug function:", error)
    return null
  }
}

// Add a new function to get game logs for all players on a team in batches
// Update the getTeamGameLogs function to use the retry logic and league parameter
export async function getTeamGameLogs(
  teamCode: string,
  season: number,
  league = "euroleague",
): Promise<EuroleagueGameLog[]> {
  try {
    console.log("=== FETCHING TEAM GAME LOGS ===")
    console.log("Team Code:", teamCode, "Season:", season, "League:", league)

    const tables = getTableNames(league)
    const tableName = tables.gameLogs

    console.log("Using table:", tableName, "for league:", league)

    // Get all game logs for the team directly from the database
    const gameLogs = await executeWithRetry(async () => {
      return (await sql.query(`SELECT * FROM ${tableName} WHERE team = $1 AND season = $2 ORDER BY player, round ASC`, [
        teamCode,
        season,
      ])) as EuroleagueGameLog[]
    })

    console.log("Found", gameLogs.length, "total game logs for team", teamCode, "for league:", league)

    // Process the results to add computed fields
    const processedLogs = gameLogs.map((log) => {
      const location = log.home === 1 ? "Home" : "Away"

      return {
        ...log,
        location,
        opponent: `Round ${log.round}`,
        date: `R${log.round}`,
      }
    })

    return processedLogs
  } catch (error) {
    console.error("Error fetching team game logs:", error)

    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
    }

    return []
  }
}

// New function to get team game logs with opponent data for advanced stats calculation
export async function getTeamGameLogsWithOpponent(
  teamCode: string,
  season: number,
  league = "euroleague",
): Promise<any[]> {
  try {
    console.log("=== FETCHING TEAM GAME LOGS WITH OPPONENT ===")
    console.log("Team Code:", teamCode, "Season:", season, "League:", league)

    const tables = getTableNames(league)
    const gameLogsTable = tables.gameLogs
    const scheduleTable = tables.scheduleResults

    console.log("Using game logs table:", gameLogsTable)
    console.log("Using schedule table:", scheduleTable)

    const gameLogsWithOpponent = await executeWithRetry(async () => {
      return await sql.query(
        `
        SELECT 
          t.*,
          t2.teamcode as opponent_teamcode,
          t2.teamlogo as opponent_logo,
          t2.game_date,
          t2.round as schedule_round,
          -- Get opponent's Total stats for the same game
          opp.field_goals_made_2 + opp.field_goals_made_3 as opp_fgm,
          opp.field_goals_attempted_2 + opp.field_goals_attempted_3 as opp_fga,
          opp.field_goals_made_3 as opp_3pm,
          opp.field_goals_attempted_3 as opp_3pa,
          opp.offensive_rebounds as opp_oreb,
          opp.defensive_rebounds as opp_dreb,
          opp.total_rebounds as opp_treb,
          opp.turnovers as opp_to,
          opp.free_throws_made as opp_ftm,
          opp.free_throws_attempted as opp_fta,
          opp.points as opp_points,
          opp.assistances as opp_ast,
          opp.steals as opp_stl,
          opp.blocks_favour as opp_blk,
          opp.fouls_commited as opp_pf
        FROM ${gameLogsTable} t
        LEFT JOIN ${scheduleTable} t2 ON t2.season = t.season 
          AND t2.gamecode = t.gamecode 
          AND t.team = t2.teamcode
        LEFT JOIN ${gameLogsTable} opp ON opp.season = t.season 
          AND opp.gamecode = t.gamecode 
          AND opp.player_id = 'Total' 
          AND opp.team <> t.team
        WHERE t.player_id = 'Total' 
          AND t.team = $1 
          AND t.season = $2
        ORDER BY t.round ASC
      `,
        [teamCode, season],
      )
    })

    console.log("Found", gameLogsWithOpponent.length, "team game logs with opponent data for league:", league)

    if (gameLogsWithOpponent.length > 0) {
      console.log("Sample game log:", gameLogsWithOpponent[0])
    }

    return gameLogsWithOpponent
  } catch (error) {
    console.error("Error fetching team game logs with opponent:", error)
    return []
  }
}

// New function to get all teams' game logs with opponent data for league-wide ranking
export async function getAllTeamGameLogsWithOpponent(season: number, league = "euroleague"): Promise<any[]> {
  try {
    console.log("=== FETCHING ALL TEAMS GAME LOGS WITH OPPONENT ===")
    console.log("Season:", season, "League:", league)

    const tables = getTableNames(league)
    const gameLogsTable = tables.gameLogs
    const scheduleTable = tables.scheduleResults

    console.log("Using game logs table:", gameLogsTable)
    console.log("Using schedule table:", scheduleTable)

    const gameLogsWithOpponent = await executeWithRetry(async () => {
      return await sql.query(
        `
        SELECT 
          t.*,
          t2.teamcode as opponent_teamcode,
          t2.teamlogo as opponent_logo,
          t2.game_date,
          t2.round as schedule_round,
          -- Get opponent's Total stats for the same game
          opp.field_goals_made_2 + opp.field_goals_made_3 as opp_fgm,
          opp.field_goals_attempted_2 + opp.field_goals_attempted_3 as opp_fga,
          opp.field_goals_made_3 as opp_3pm,
          opp.field_goals_attempted_3 as opp_3pa,
          opp.offensive_rebounds as opp_oreb,
          opp.defensive_rebounds as opp_dreb,
          opp.total_rebounds as opp_treb,
          opp.turnovers as opp_to,
          opp.free_throws_made as opp_ftm,
          opp.free_throws_attempted as opp_fta,
          opp.points as opp_points,
          opp.assistances as opp_ast,
          opp.steals as opp_stl,
          opp.blocks_favour as opp_blk,
          opp.fouls_commited as opp_pf
        FROM ${gameLogsTable} t
        LEFT JOIN ${scheduleTable} t2 ON t2.season = t.season
          AND t2.gamecode = t.gamecode
          AND t.team = t2.teamcode
        LEFT JOIN ${gameLogsTable} opp ON opp.season = t.season
          AND opp.gamecode = t.gamecode
          AND opp.player_id = 'Total'
          AND opp.team <> t.team
        WHERE t.player_id = 'Total'
          AND t.season = $1
        ORDER BY t.team, t.round ASC
      `,
        [season],
      )
    })

    console.log("Found", gameLogsWithOpponent.length, "total team game logs with opponent data for league:", league)

    return gameLogsWithOpponent
  } catch (error) {
    console.error("Error fetching all teams game logs with opponent:", error)
    return []
  }
}

// NEW FUNCTION: Calculate standings from game logs and schedule data
export async function calculateStandingsFromGameLogs(
  season: number,
  phase = "RS",
  league = "euroleague",
): Promise<any[]> {
  const tables = getTableNames(league)
  const gameLogsTable = tables.gameLogs
  const scheduleTable = tables.scheduleResults

  console.log("Using game logs table:", gameLogsTable, "for league:", league)
  console.log("Using schedule table:", scheduleTable, "for league:", league)
  try {
    console.log("=== CALCULATING STANDINGS FROM GAME LOGS ===")
    console.log("Season:", season, "Phase:", phase)

    // Get all team game logs with opponent data
    const allGameLogs = await executeWithRetry(async () => {
      return await sql.query(
        `
        SELECT 
          t.*,
          sr.opponentcode,
          sr.opponentlogo,
          sr.game_date,
          sr.result,
          sr.team_score,
          sr.opponent_score,
          sr.location,
          -- Get opponent's stats for the same game
          opp.field_goals_made_2 + opp.field_goals_made_3 as opp_fgm,
          opp.field_goals_attempted_2 + opp.field_goals_attempted_3 as opp_fga,
          opp.field_goals_made_3 as opp_3pm,
          opp.field_goals_attempted_3 as opp_3pa,
          opp.offensive_rebounds as opp_oreb,
          opp.defensive_rebounds as opp_dreb,
          opp.total_rebounds as opp_treb,
          opp.turnovers as opp_to,
          opp.free_throws_made as opp_ftm,
          opp.free_throws_attempted as opp_fta,
          opp.points as opp_points,
          opp.assistances as opp_ast,
          opp.steals as opp_stl,
          opp.blocks_favour as opp_blk,
          opp.fouls_commited as opp_pf
        FROM ${gameLogsTable} t
        LEFT JOIN ${scheduleTable} sr ON sr.season = t.season 
          AND sr.gamecode = t.gamecode 
          AND t.team = sr.teamcode
        LEFT JOIN ${gameLogsTable} opp ON opp.season = t.season 
          AND opp.gamecode = t.gamecode 
          AND opp.player_id = 'Total' 
          AND opp.team <> t.team
        WHERE t.player_id = 'Total' 
          AND t.season = $1
          AND ($2 = 'All' OR t.phase = $2)
        ORDER BY t.team, t.round ASC
      `,
        [season, phase],
      )
    })

    console.log("Found", allGameLogs.length, "team game logs")

    // Group by team
    const teamGameLogs = allGameLogs.reduce((acc, game) => {
      if (!acc[game.team]) {
        acc[game.team] = []
      }
      acc[game.team].push(game)
      return acc
    }, {})

    // Calculate standings for each team
    const standings = Object.entries(teamGameLogs).map(([teamCode, games]: [string, any[]]) => {
      // Calculate basic record
      const wins = games.filter((g) => g.result === "W" || g.result === "Win").length
      const losses = games.filter((g) => g.result === "L" || g.result === "Loss").length
      const totalGames = wins + losses
      const winPercentage = totalGames > 0 ? wins / totalGames : 0

      // Calculate point differential
      const totalPointsFor = games.reduce((sum, g) => sum + (g.team_score || 0), 0)
      const totalPointsAgainst = games.reduce((sum, g) => sum + (g.opponent_score || 0), 0)
      const pointDifferential = totalPointsFor - totalPointsAgainst

      // Calculate home/away records
      const homeGames = games.filter((g) => g.location === "H" || g.location === "Home")
      const awayGames = games.filter((g) => g.location === "A" || g.location === "Away")

      const homeWins = homeGames.filter((g) => g.result === "W" || g.result === "Win").length
      const homeLosses = homeGames.filter((g) => g.result === "L" || g.result === "Loss").length
      const awayWins = awayGames.filter((g) => g.result === "W" || g.result === "Win").length
      const awayLosses = awayGames.filter((g) => g.result === "L" || g.result === "Loss").length

      const homeRecord = `${homeWins}-${homeLosses}`
      const awayRecord = `${awayWins}-${awayLosses}`

      // Calculate last 10 games
      const last10Games = games.slice(-10).filter((g) => g.result)
      const last10Wins = last10Games.filter((g) => g.result === "W" || g.result === "Win").length
      const last10Losses = last10Games.filter((g) => g.result === "L" || g.result === "Loss").length
      const last10Record = `${last10Wins}-${last10Losses}`

      // Calculate current streak - FULL STREAK CALCULATION
      let currentStreak = ""
      if (games.length > 0) {
        // Get ALL games with results, sorted chronologically by round
        const allGamesWithResults = [...games]
          .filter((g) => g.result && g.result.trim() !== "") // Only games with results
          .sort((a, b) => a.round - b.round) // Sort by round ascending (chronological order)

        console.log(`=== FULL STREAK CALCULATION FOR ${teamCode} ===`)
        console.log(`Total games with results: ${allGamesWithResults.length}`)
        console.log(
          "All games chronologically:",
          allGamesWithResults.map((g) => ({
            round: g.round,
            result: g.result.trim(),
            gamecode: g.gamecode,
          })),
        )

        if (allGamesWithResults.length > 0) {
          // Start from the most recent game (last in chronological order)
          const mostRecentGame = allGamesWithResults[allGamesWithResults.length - 1]
          const lastResult = mostRecentGame.result.trim()

          console.log(`Most recent game for ${teamCode}: Round ${mostRecentGame.round} = ${lastResult}`)

          let streakCount = 0

          // Work backwards from the most recent game to count the streak
          for (let i = allGamesWithResults.length - 1; i >= 0; i--) {
            const game = allGamesWithResults[i]
            const gameResult = game.result.trim()

            // Normalize result formats
            const isWin = gameResult === "W" || gameResult === "Win" || gameResult === "win"
            const isLoss = gameResult === "L" || gameResult === "Loss" || gameResult === "loss"
            const lastIsWin = lastResult === "W" || lastResult === "Win" || lastResult === "win"

            // Check if this game continues the streak
            if ((isWin && lastIsWin) || (isLoss && !lastIsWin)) {
              streakCount++
              console.log(
                `${teamCode} streak continues: Round ${game.round} = ${gameResult}, streak count now ${streakCount}`,
              )
            } else {
              console.log(`${teamCode} streak broken at: Round ${game.round} = ${gameResult}`)
              break
            }
          }

          const streakType = lastResult === "W" || lastResult === "Win" || lastResult === "win" ? "W" : "L"
          currentStreak = `${streakType}${streakCount}`

          console.log(`=== FINAL STREAK FOR ${teamCode}: ${currentStreak} ===`)
          console.log(`Calculated from ${streakCount} consecutive games ending with ${lastResult}`)
        }
      }

      // Calculate advanced stats using the same logic as team details
      const totals = games.reduce(
        (acc, game) => {
          const fgm = (game.field_goals_made_2 || 0) + (game.field_goals_made_3 || 0)
          const fga = (game.field_goals_attempted_2 || 0) + (game.field_goals_attempted_3 || 0)
          const fgm3 = game.field_goals_made_3 || 0
          const fga3 = game.field_goals_attempted_3 || 0
          const oreb = game.offensive_rebounds || 0
          const dreb = game.defensive_rebounds || 0
          const to = game.turnovers || 0
          const fta = game.free_throws_attempted || 0
          const ftm = game.free_throws_made || 0
          const points = game.points || 0
          const ast = game.assistances || 0
          const stl = game.steals || 0
          const blk = game.blocks_favour || 0

          // Opponent stats
          const opp_fgm = game.opp_fgm || 0
          const opp_fga = game.opp_fga || 0
          const opp_3pm = game.opp_3pm || 0
          const opp_3pa = game.opp_3pa || 0
          const opp_oreb = game.opp_oreb || 0
          const opp_dreb = game.opp_dreb || 0
          const opp_to = game.opp_to || 0
          const opp_fta = game.opp_fta || 0
          const opp_ftm = game.opp_ftm || 0
          const opp_points = game.opp_points || 0
          const opp_ast = game.opp_ast || 0
          const opp_stl = game.opp_stl || 0
          const opp_blk = game.opp_blk || 0

          // Calculate possessions
          const team_poss = fga + 0.4 * fta - 1.07 * (oreb / (oreb + opp_dreb)) * (fga - fgm) + to
          const opp_poss =
            opp_fga + 0.4 * opp_fta - 1.07 * (opp_oreb / (opp_oreb + dreb)) * (opp_fga - opp_fgm) + opp_to

          return {
            games: acc.games + 1,
            points: acc.points + points,
            fgm: acc.fgm + fgm,
            fga: acc.fga + fga,
            fgm3: acc.fgm3 + fgm3,
            fga3: acc.fga3 + fga3,
            ftm: acc.ftm + ftm,
            fta: acc.fta + fta,
            oreb: acc.oreb + oreb,
            dreb: acc.dreb + dreb,
            to: acc.to + to,
            ast: acc.ast + ast,
            stl: acc.stl + stl,
            blk: acc.blk + blk,
            possessions: acc.possessions + team_poss,
            opp_points: acc.opp_points + opp_points,
            opp_fgm: acc.opp_fgm + opp_fgm,
            opp_fga: acc.opp_fga + opp_fga,
            opp_3pm: acc.opp_3pm + opp_3pm,
            opp_3pa: acc.opp_3pa + opp_3pa,
            opp_fta: acc.opp_fta + opp_fta,
            opp_ftm: acc.opp_ftm + opp_ftm,
            opp_oreb: acc.opp_oreb + opp_oreb,
            opp_dreb: acc.opp_dreb + dreb,
            opp_to: acc.opp_to + opp_to,
            opp_ast: acc.opp_ast + opp_ast,
            opp_stl: acc.opp_stl + opp_stl,
            opp_blk: acc.opp_blk + opp_blk,
            opp_possessions: acc.opp_possessions + opp_poss,
            fgm2: acc.fgm2 + (game.field_goals_made_2 || 0),
            fga2: acc.fga2 + (game.field_goals_attempted_2 || 0),
          }
        },
        {
          games: 0,
          points: 0,
          fgm: 0,
          fga: 0,
          fgm3: 0,
          fga3: 0,
          ftm: 0,
          fta: 0,
          oreb: 0,
          dreb: 0,
          to: 0,
          ast: 0,
          stl: 0,
          blk: 0,
          possessions: 0,
          opp_points: 0,
          opp_fgm: 0,
          opp_fga: 0,
          opp_3pm: 0,
          opp_3pa: 0,
          opp_fta: 0,
          opp_ftm: 0,
          opp_oreb: 0,
          opp_dreb: 0,
          opp_to: 0,
          opp_ast: 0,
          opp_stl: 0,
          opp_blk: 0,
          opp_possessions: 0,
          fgm2: 0,
          fga2: 0,
        },
      )

      // Calculate advanced stats
      const avgTotalPossessions = (totals.possessions + totals.opp_possessions) / totals.games
      const pace = ((200 / 202.2) * avgTotalPossessions) / 2
      const efficiency_o = (totals.points / totals.possessions) * 100
      const efficiency_d = (totals.opp_points / totals.opp_possessions) * 100

      // Four Factors
      const efg = totals.fga > 0 ? ((totals.fgm + 0.5 * totals.fgm3) / totals.fga) * 100 : 0
      const to_percent =
        totals.fga + totals.to + 0.44 * totals.fta > 0
          ? (totals.to / (totals.fga + totals.to + 0.44 * totals.fta)) * 100
          : 0
      const oreb_percent = totals.oreb + totals.opp_dreb > 0 ? (totals.oreb / (totals.oreb + totals.opp_dreb)) * 100 : 0
      const ftrate = totals.fga > 0 ? (totals.fta / totals.fga) * 100 : 0

      const efg_opp = totals.opp_fga > 0 ? ((totals.opp_fgm + 0.5 * totals.opp_3pm) / totals.opp_fga) * 100 : 0
      const to_percent_opp =
        totals.opp_fga + totals.opp_to + 0.44 * totals.opp_fta > 0
          ? (totals.opp_to / (totals.opp_fga + totals.opp_to + 0.44 * totals.opp_fta)) * 100
          : 0
      const oreb_percent_opp =
        totals.opp_oreb + totals.dreb > 0 ? (totals.opp_oreb / (totals.opp_oreb + totals.dreb)) * 100 : 0
      const ftrate_opp = totals.opp_fga > 0 ? (totals.opp_fta / totals.opp_fga) * 100 : 0

      // Additional stats for expanded view
      const threeperc_o = totals.fga3 > 0 ? (totals.fgm3 / totals.fga3) * 100 : 0
      const threeperc_d = totals.opp_3pa > 0 ? (totals.opp_3pm / totals.opp_3pa) * 100 : 0
      const twoperc_o = totals.fga2 > 0 ? (totals.fgm2 / totals.fga2) * 100 : 0
      const twoperc_d =
        totals.opp_fga - totals.opp_3pa > 0
          ? ((totals.opp_fgm - totals.opp_3pm) / (totals.opp_fga - totals.opp_3pa)) * 100
          : 0
      const ftperc_o = totals.fta > 0 ? (totals.ftm / totals.fta) * 100 : 0
      const ftperc_d = totals.opp_fta > 0 ? (totals.opp_ftm / totals.opp_fta) * 100 : 0
      const threeattmprate_o = totals.fga > 0 ? (totals.fga3 / totals.fga) * 100 : 0
      const threeattmprate_d = totals.opp_fga > 0 ? (totals.opp_3pa / totals.opp_fga) * 100 : 0

      const assistrate_o = (totals.ast / (totals.fgm + totals.fgm3)) * 100
      const assistrate_d = (totals.opp_ast / (totals.opp_fgm + totals.opp_3pm)) * 100
      const stealrate_o = (totals.stl / totals.opp_possessions) * 100
      const stealrate_d = (totals.opp_stl / totals.possessions) * 100
      const opp_fg2a = totals.opp_fga - totals.opp_3pa
      const blockrate_o = (totals.opp_blk / totals.fga2) * 100
      const blockrate_d = (totals.blk / opp_fg2a) * 100

      const points2perc_o = totals.points > 0 ? ((totals.fgm2 * 2) / totals.points) * 100 : 0
      const points2perc_d =
        totals.opp_points > 0 ? (((totals.opp_fgm - totals.opp_3pm) * 2) / totals.opp_points) * 100 : 0
      const points3perc_o = totals.points > 0 ? ((totals.fgm3 * 3) / totals.points) * 100 : 0
      const points3perc_d = totals.opp_points > 0 ? ((totals.opp_3pm * 3) / totals.opp_points) * 100 : 0
      const pointsftperc_o = totals.points > 0 ? (totals.ftm / totals.points) * 100 : 0
      const pointsftperc_d = totals.opp_points > 0 ? (totals.opp_ftm / totals.opp_points) * 100 : 0

      const foulsdrawnrate_o = 0 // Placeholder
      const foulsdrawnrate_d = 0 // Placeholder
      const valuerate_o = 0 // Placeholder
      const valuerate_d = 0 // Placeholder

      // Get team info from first game
      const firstGame = games[0]
      const teamName = firstGame?.team || teamCode

      return {
        season,
        phase,
        position: 0, // Will be calculated after sorting
        teamcode: teamCode,
        name: teamName,
        teamlogo: firstGame?.teamlogo || "",
        w: wins,
        l: losses,
        win_percent: winPercentage,
        diff: Math.round(pointDifferential),
        home: homeRecord,
        away: awayRecord,
        l10: last10Record,
        streak: currentStreak, // Use the full calculated streak
        // Four Factors
        efg,
        to_percent,
        oreb_percent,
        ftrate,
        efg_opp,
        to_percent_opp,
        oreb_percent_opp,
        ftrate_opp,
        // Additional stats
        pace_o: pace,
        pace_d: pace,
        efficiency_o,
        efficiency_d,
        blockrate_o,
        blockrate_d,
        stealrate_o,
        stealrate_d,
        assistrate_o,
        assistrate_d,
        threeattmprate_o,
        threeattmprate_d,
        threeperc_o,
        threeperc_d,
        twoperc_o,
        twoperc_d,
        ftperc_o,
        ftperc_d,
        efgperc_o: efg,
        efgperc_d: efg_opp,
        orebperc_o: oreb_percent,
        orebperc_d: oreb_percent_opp,
        toratio_o: to_percent,
        toratio_d: to_percent_opp,
        ftrate_o: ftrate,
        ftrate_d: ftrate_opp,
        points2perc_o,
        points2perc_d,
        points3perc_o,
        points3perc_d,
        pointsftperc_o,
        pointsftperc_d,
        foulsdrawnrate_o,
        foulsdrawnrate_d,
        valuerate_o,
        valuerate_d,
      }
    })

    // Sort by win percentage and assign positions
    const sortedStandings = standings.sort((a, b) => b.win_percent - a.win_percent)
    sortedStandings.forEach((team, index) => {
      team.position = index + 1
    })

    console.log("Calculated standings for", sortedStandings.length, "teams")
    return sortedStandings
  } catch (error) {
    console.error("Error calculating standings from game logs:", error)
    return []
  }
}

// NEW FUNCTION: Get team names and logos for standings
export async function getTeamNamesAndLogos(
  season: number,
  league = "euroleague",
): Promise<Record<string, { name: string; logo: string }>> {
  try {
    const tables = getTableNames(league)
    const scheduleTable = tables.scheduleResults

    const teams = await executeWithRetry(async () => {
      return await sql.query(
        `
        SELECT DISTINCT 
          sr.teamcode,
          sr.team as name,
          sr.teamlogo as logo
        FROM ${scheduleTable} sr
        WHERE sr.season = $1
        ORDER BY sr.team
      `,
        [season],
      )
    })

    const teamMapping = {}
    teams.forEach((team) => {
      teamMapping[team.teamcode] = {
        name: team.name,
        logo: team.logo,
      }
    })

    return teamMapping
  } catch (error) {
    console.error("Error fetching team names and logos:", error)
    return {}
  }
}

// NEW FUNCTION: Get all unique team codes from game logs for a specific season and league
export async function getUniqueTeamCodesFromGameLogs(season: number, league = "euroleague"): Promise<string[]> {
  try {
    console.log("=== FETCHING UNIQUE TEAM CODES FROM GAME LOGS ===")
    console.log("Season:", season, "League:", league)

    const tables = getTableNames(league)
    const gameLogsTable = tables.gameLogs

    console.log("Using game logs table:", gameLogsTable, "for league:", league)

    const teamCodes = await executeWithRetry(async () => {
      return await sql.query(
        `
        SELECT DISTINCT team as teamcode
        FROM ${gameLogsTable}
        WHERE season = $1
          AND team IS NOT NULL
          AND team != ''
        ORDER BY team
        `,
        [season],
      )
    })

    const codes = teamCodes.map((row) => row.teamcode).filter(Boolean)
    console.log("Found unique team codes:", codes)
    return codes
  } catch (error) {
    console.error("Error fetching unique team codes from game logs:", error)
    return []
  }
}

// FUNCTION: Get all players across all seasons for search functionality
export async function getAllPlayersAcrossSeasons(
  league = "euroleague",
): Promise<PlayerStatsFromGameLogs[]> {
  try {
    console.log("=== FETCHING ALL PLAYERS ACROSS SEASONS FOR SEARCH ===")
    console.log("League:", league)

    const tables = getTableNames(league)
    const tableName = tables.playerStatsFromGameLogs

    console.log("Using table name:", tableName)

    const stats = await executeWithRetry(async () => {
      return (await sql.query(
        `SELECT DISTINCT ON (player_id, season, phase) 
         player_id, player_name, season, phase, player_team_code, player_team_name, teamlogo, games_played
         FROM ${tableName} 
         WHERE games_played > 0
         ORDER BY player_id, season DESC, phase, player_name`,
      )) as PlayerStatsFromGameLogs[]
    })

    console.log("All players across seasons found:", stats.length)
    return stats
  } catch (error) {
    console.error("Error fetching all players across seasons:", error)
    return []
  }
}
