import { NextRequest, NextResponse } from "next/server"
import { fetchTeamAdvancedStatsByTeamCode } from "@/app/actions/standings"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamCode = searchParams.get("teamCode")
    const season = parseInt(searchParams.get("season") || "2025")
    const phase = searchParams.get("phase") || "RS"
    const league = searchParams.get("league") || "euroleague"

    if (!teamCode) {
      return NextResponse.json(
        { error: "Team code is required" },
        { status: 400 }
      )
    }

    console.log(`Fetching advanced stats for team: ${teamCode}, season: ${season}, phase: ${phase}, league: ${league}`)

    const stats = await fetchTeamAdvancedStatsByTeamCode(teamCode, season, phase, league)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error in team advanced stats API:", error)
    return NextResponse.json(
      { error: "Failed to fetch team advanced stats" },
      { status: 500 }
    )
  }
}