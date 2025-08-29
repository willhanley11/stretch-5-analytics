import { sql } from "./db"

// Verification utilities for EuroCup table structure
export interface TableStructure {
  column_name: string
  data_type: string
  is_nullable: string
}

// Function to get table structure
export async function getTableStructure(tableName: string): Promise<TableStructure[]> {
  try {
    const structure = await sql<TableStructure[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position
    `
    return structure
  } catch (error) {
    console.error(`Error fetching structure for table ${tableName}:`, error)
    return []
  }
}

// Function to verify EuroCup tables exist
export async function verifyEuroCupTablesExist(): Promise<{
  eurocup_team_stats: boolean
  eurocup_game_logs: boolean
  schedule_results_eurocup: boolean
  shot_data_eurocup: boolean
}> {
  try {
    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' 
      AND table_name IN ('eurocup_team_stats', 'eurocup_game_logs', 'schedule_results_eurocup', 'shot_data_eurocup')
    `

    const existingTables = tables.map((t) => t.table_name)

    return {
      eurocup_team_stats: existingTables.includes("eurocup_team_stats"),
      eurocup_game_logs: existingTables.includes("eurocup_game_logs"),
      schedule_results_eurocup: existingTables.includes("schedule_results_eurocup"),
      shot_data_eurocup: existingTables.includes("shot_data_eurocup"),
    }
  } catch (error) {
    console.error("Error checking EuroCup tables:", error)
    return {
      eurocup_team_stats: false,
      eurocup_game_logs: false,
      schedule_results_eurocup: false,
      shot_data_eurocup: false,
    }
  }
}

// Function to compare table structures
export async function compareTableStructures(
  euroleagueTable: string,
  eurocupTable: string,
): Promise<{
  match: boolean
  euroleagueColumns: TableStructure[]
  eurocupColumns: TableStructure[]
  differences: string[]
}> {
  try {
    const euroleagueStructure = await getTableStructure(euroleagueTable)
    const eurocupStructure = await getTableStructure(eurocupTable)

    const differences: string[] = []

    // Check if column counts match
    if (euroleagueStructure.length !== eurocupStructure.length) {
      differences.push(
        `Column count mismatch: ${euroleagueTable} has ${euroleagueStructure.length} columns, ${eurocupTable} has ${eurocupStructure.length} columns`,
      )
    }

    // Check each column
    euroleagueStructure.forEach((euroleagueCol) => {
      const eurocupCol = eurocupStructure.find((col) => col.column_name === euroleagueCol.column_name)

      if (!eurocupCol) {
        differences.push(
          `Column '${euroleagueCol.column_name}' exists in ${euroleagueTable} but not in ${eurocupTable}`,
        )
      } else if (euroleagueCol.data_type !== eurocupCol.data_type) {
        differences.push(
          `Column '${euroleagueCol.column_name}' has different data types: ${euroleagueTable} (${euroleagueCol.data_type}) vs ${eurocupTable} (${eurocupCol.data_type})`,
        )
      }
    })

    // Check for extra columns in EuroCup table
    eurocupStructure.forEach((eurocupCol) => {
      const euroleagueCol = euroleagueStructure.find((col) => col.column_name === eurocupCol.column_name)
      if (!euroleagueCol) {
        differences.push(`Column '${eurocupCol.column_name}' exists in ${eurocupTable} but not in ${euroleagueTable}`)
      }
    })

    return {
      match: differences.length === 0,
      euroleagueColumns: euroleagueStructure,
      eurocupColumns: eurocupStructure,
      differences,
    }
  } catch (error) {
    console.error("Error comparing table structures:", error)
    return {
      match: false,
      euroleagueColumns: [],
      eurocupColumns: [],
      differences: [`Error comparing structures: ${error.message}`],
    }
  }
}

// Function to get sample data from EuroCup tables
export async function getEuroCupSampleData(): Promise<{
  team_stats_count: number
  game_logs_count: number
  schedule_results_count: number
  shot_data_count: number
  sample_team_stats: any[]
  sample_game_logs: any[]
  available_seasons: number[]
}> {
  try {
    // Get counts
    const teamStatsCount = await sql`SELECT COUNT(*) as count FROM eurocup_team_stats`
    const gameLogsCount = await sql`SELECT COUNT(*) as count FROM eurocup_game_logs`
    const scheduleResultsCount = await sql`SELECT COUNT(*) as count FROM schedule_results_eurocup`
    const shotDataCount = await sql`SELECT COUNT(*) as count FROM shot_data_eurocup`

    // Get sample data
    const sampleTeamStats = await sql`SELECT * FROM eurocup_team_stats LIMIT 3`
    const sampleGameLogs = await sql`SELECT * FROM eurocup_game_logs LIMIT 3`

    // Get available seasons
    const seasons = await sql<{ season: number }[]>`
      SELECT DISTINCT season FROM eurocup_team_stats ORDER BY season DESC
    `

    return {
      team_stats_count: teamStatsCount[0]?.count || 0,
      game_logs_count: gameLogsCount[0]?.count || 0,
      schedule_results_count: scheduleResultsCount[0]?.count || 0,
      shot_data_count: shotDataCount[0]?.count || 0,
      sample_team_stats: sampleTeamStats,
      sample_game_logs: sampleGameLogs,
      available_seasons: seasons.map((s) => s.season),
    }
  } catch (error) {
    console.error("Error getting EuroCup sample data:", error)
    return {
      team_stats_count: 0,
      game_logs_count: 0,
      schedule_results_count: 0,
      shot_data_count: 0,
      sample_team_stats: [],
      sample_game_logs: [],
      available_seasons: [],
    }
  }
}

// Main verification function
export async function verifyEuroCupSetup(): Promise<{
  tablesExist: any
  structureComparisons: any
  sampleData: any
  overallStatus: "success" | "warning" | "error"
  issues: string[]
}> {
  console.log("=== STARTING EUROCUP SETUP VERIFICATION ===")

  const issues: string[] = []

  // Check if tables exist
  const tablesExist = await verifyEuroCupTablesExist()
  console.log("Tables exist:", tablesExist)

  // Check for missing tables
  Object.entries(tablesExist).forEach(([table, exists]) => {
    if (!exists) {
      issues.push(`Table '${table}' does not exist`)
    }
  })

  // Compare structures only if tables exist
  const structureComparisons: any = {}

  if (tablesExist.eurocup_team_stats) {
    structureComparisons.team_stats = await compareTableStructures("euroleague_team_stats", "eurocup_team_stats")
    if (!structureComparisons.team_stats.match) {
      issues.push(`eurocup_team_stats structure doesn't match euroleague_team_stats`)
    }
  }

  if (tablesExist.eurocup_game_logs) {
    structureComparisons.game_logs = await compareTableStructures("euroleague_game_logs", "eurocup_game_logs")
    if (!structureComparisons.game_logs.match) {
      issues.push(`eurocup_game_logs structure doesn't match euroleague_game_logs`)
    }
  }

  if (tablesExist.schedule_results_eurocup) {
    structureComparisons.schedule_results = await compareTableStructures("schedule_results", "schedule_results_eurocup")
    if (!structureComparisons.schedule_results.match) {
      issues.push(`schedule_results_eurocup structure doesn't match schedule_results`)
    }
  }

  // Get sample data
  const sampleData = await getEuroCupSampleData()
  console.log("Sample data:", sampleData)

  // Check if tables have data
  if (sampleData.team_stats_count === 0) {
    issues.push("eurocup_team_stats table is empty")
  }
  if (sampleData.game_logs_count === 0) {
    issues.push("eurocup_game_logs table is empty")
  }
  if (sampleData.schedule_results_count === 0) {
    issues.push("schedule_results_eurocup table is empty")
  }

  // Determine overall status
  let overallStatus: "success" | "warning" | "error" = "success"

  if (issues.some((issue) => issue.includes("does not exist"))) {
    overallStatus = "error"
  } else if (issues.length > 0) {
    overallStatus = "warning"
  }

  console.log("=== VERIFICATION COMPLETE ===")
  console.log("Overall status:", overallStatus)
  console.log("Issues found:", issues)

  return {
    tablesExist,
    structureComparisons,
    sampleData,
    overallStatus,
    issues,
  }
}
