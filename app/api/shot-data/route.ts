import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")
    const playerName = searchParams.get("playerName")
    const team = searchParams.get("team")
    const season = searchParams.get("season")
    const league = searchParams.get("league") || "euroleague"
    const fetchLeagueData = searchParams.get("fetchLeagueData") === "true" // New parameter

    if ((!playerId && !playerName && !team && !fetchLeagueData) || !season) {
      return NextResponse.json(
        { error: "Player ID/Name/Team/League data flag and season are required" },
        { status: 400 },
      )
    }

    console.log(
      `Fetching shot data for ${team ? "team " + team : fetchLeagueData ? "entire league" : "player " + (playerId || playerName)} in season ${season}`,
    )

    // Helper function to get the correct shot data table
    function getShotDataTable(league: string) {
      return league === "eurocup" ? "shot_data_eurocup" : "shot_data"
    }

    const shotDataTable = getShotDataTable(league)

    // Handle league-wide data requests
    if (fetchLeagueData) {
      console.log(`Fetching league-wide shot data for ${league} season ${season}`)

      const leagueWideData = await sql.query(
        `
        SELECT 
          id, season, phase, round, gamecode, num_anot, team, 
          id_player, player, id_action, action, points, 
          coord_x, coord_y, zone, fastbreak, second_chance, 
          points_off_turnover, minute, console, points_a, points_b, utc
        FROM ${shotDataTable} 
        WHERE season = $1
        ORDER BY round, minute
        `,
        [season],
      )

      console.log(`League-wide query: Found ${leagueWideData.length} total shots for season ${season}`)

      return NextResponse.json({
        success: true,
        data: leagueWideData,
        count: leagueWideData.length,
        debug: {
          season: season,
          league: league,
          shotDataTable: shotDataTable,
          isLeagueWide: true,
        },
      })
    }

    // Handle team queries
    // Handle team queries
    if (team) {
      console.log(`Fetching shot data for team ${team} in season ${season}`)

      // First, let's see what teams are available in the shot data table
      const availableTeams = await sql.query(
        `
    SELECT DISTINCT team, COUNT(*) as shot_count
    FROM ${shotDataTable} 
    WHERE season = $1
    GROUP BY team
    ORDER BY shot_count DESC
    `,
        [season],
      )
      console.log("Available teams in shot data:", availableTeams)

      const teamShotData = await sql.query(
        `
    SELECT 
      id, season, phase, round, gamecode, num_anot, team, 
      id_player, player, id_action, action, points, 
      coord_x, coord_y, zone, fastbreak, second_chance, 
      points_off_turnover, minute, console, points_a, points_b, utc
    FROM ${shotDataTable} 
    WHERE team = $1 AND season = $2
    ORDER BY round, minute
    `,
        [team, season],
      )

      console.log(`Team query (${team}): Found ${teamShotData.length} shots`)
      console.log(`Searched for team: "${team}" in season: ${season}`)

      return NextResponse.json({
        success: true,
        data: teamShotData,
        count: teamShotData.length,
        debug: {
          searchedTeam: team,
          season: season,
          league: league,
          shotDataTable: shotDataTable,
          availableTeams: availableTeams,
        },
      })
    }

    // First, let's check what data exists in shot_data table
    const sampleData = await sql.query(
      `
      SELECT DISTINCT id_player, player, season 
      FROM ${shotDataTable} 
      WHERE season = $1
      LIMIT 10
    `,
      [season],
    )
    console.log("Sample shot data players:", sampleData)

    let shotData = []

    // Try multiple matching strategies
    if (playerId) {
      // Strategy 1: Match by id_player directly
      shotData = await sql.query(
        `
        SELECT 
          id, season, phase, round, gamecode, num_anot, team, 
          id_player, player, id_action, action, points, 
          coord_x, coord_y, zone, fastbreak, second_chance, 
          points_off_turnover, minute, console, points_a, points_b, utc
        FROM ${shotDataTable} 
        WHERE id_player = $1 AND season = $2
        ORDER BY round, minute
      `,
        [playerId, season],
      )
      console.log(`Strategy 1 (id_player = ${playerId}): Found ${shotData.length} shots`)

      // Strategy 2: If no results, try matching by player name from the player stats
      if (shotData.length === 0 && playerName) {
        shotData = await sql.query(
          `
          SELECT 
            id, season, phase, round, gamecode, num_anot, team, 
            id_player, player, id_action, action, points, 
            coord_x, coord_y, zone, fastbreak, second_chance, 
            points_off_turnover, minute, console, points_a, points_b, utc
          FROM ${shotDataTable} 
          WHERE player = $1 AND season = $2
          ORDER BY round, minute
        `,
          [playerName, season],
        )
        console.log(`Strategy 2 (player = ${playerName}): Found ${shotData.length} shots`)
      }

      // Strategy 3: Try partial name matching
      if (shotData.length === 0 && playerName) {
        shotData = await sql.query(
          `
          SELECT 
            id, season, phase, round, gamecode, num_anot, team, 
            id_player, player, id_action, action, points, 
            coord_x, coord_y, zone, fastbreak, second_chance, 
            points_off_turnover, minute, console, points_a, points_b, utc
          FROM ${shotDataTable} 
          WHERE player ILIKE $1 AND season = $2
          ORDER BY round, minute
        `,
          ["%" + playerName + "%", season],
        )
        console.log(`Strategy 3 (player ILIKE %${playerName}%): Found ${shotData.length} shots`)
      }
    } else if (playerName) {
      // If only player name is provided
      shotData = await sql.query(
        `
        SELECT 
          id, season, phase, round, gamecode, num_anot, team, 
          id_player, player, id_action, action, points, 
          coord_x, coord_y, zone, fastbreak, second_chance, 
          points_off_turnover, minute, console, points_a, points_b, utc
        FROM ${shotDataTable} 
        WHERE player = $1 AND season = $2
        ORDER BY round, minute
      `,
        [playerName, season],
      )
      console.log(`Direct name match (${playerName}): Found ${shotData.length} shots`)
    }

    // If still no results, let's see what players are available for this season
    if (shotData.length === 0) {
      const availablePlayers = await sql.query(
        `
        SELECT DISTINCT id_player, player, COUNT(*) as shot_count
        FROM ${shotDataTable} 
        WHERE season = $1
        GROUP BY id_player, player
        ORDER BY shot_count DESC
        LIMIT 20
      `,
        [season],
      )
      console.log("Available players with shot data:", availablePlayers)
    }

    return NextResponse.json({
      success: true,
      data: shotData,
      count: shotData.length,
      debug: {
        searchedPlayerId: playerId,
        searchedPlayerName: playerName,
        season: season,
        league: league,
        shotDataTable: shotDataTable,
        samplePlayers: sampleData.slice(0, 5),
      },
    })
  } catch (error) {
    console.error("Error fetching shot data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch shot data",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
