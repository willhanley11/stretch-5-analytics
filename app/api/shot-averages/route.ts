import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const season = searchParams.get("season")
    const league = searchParams.get("league") || "euroleague"

    if (!season) {
      return NextResponse.json({ error: "Season is required" }, { status: 400 })
    }

    console.log(`Fetching shot averages for league: ${league}, season: ${season}`)

    // Determine which table to use based on league
    const tableName = league === "eurocup" ? "shot_data_eurocup_averages" : "shot_data_euroleague_averages"

    console.log(`Using table: ${tableName}`)

    const averages = await sql.query(
      `SELECT id, season, bin, total_shots, made_shots, shot_percentage 
       FROM ${tableName} 
       WHERE season = $1
       ORDER BY bin`,
      [season],
    )

    console.log(`Found ${averages.length} league average records for ${league} season ${season}`)

    // Log sample data for debugging
    if (averages.length > 0) {
      console.log("Sample league averages:", averages.slice(0, 3))
    }

    return NextResponse.json({
      success: true,
      data: averages,
      count: averages.length,
      debug: {
        league,
        season,
        tableName,
        sampleData: averages.slice(0, 3),
      },
    })
  } catch (error) {
    console.error("Error fetching shot averages:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch shot averages",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
