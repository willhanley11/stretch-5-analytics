import { NextRequest, NextResponse } from "next/server"
import { fetchTeamPlayers } from "@/app/actions/standings"

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

    console.log(`Fetching players for team: ${teamCode}, season: ${season}, phase: ${phase}, league: ${league}`)

    const players = await fetchTeamPlayers(teamCode, season, phase)
    console.log(`Found ${players.length} players for team ${teamCode}:`, players.length > 0 ? players[0] : 'No players')

    return NextResponse.json(players)
  } catch (error) {
    console.error("Error in team players API:", error)
    return NextResponse.json(
      { error: "Failed to fetch team players" },
      { status: 500 }
    )
  }
}
