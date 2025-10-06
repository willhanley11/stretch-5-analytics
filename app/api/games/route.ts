import { NextRequest, NextResponse } from "next/server"
import { fetchAllGamesByRoundAndSeason } from "@/app/actions/standings"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const season = parseInt(searchParams.get("season") || "2025")
    const league = searchParams.get("league") || "euroleague"

    console.log(`Fetching games for season: ${season}, league: ${league}`)

    const games = await fetchAllGamesByRoundAndSeason(season, league)

    console.log(`Found ${games.length} games for season ${season}`)

    return NextResponse.json(games)
  } catch (error) {
    console.error("Error in games API:", error)
    return NextResponse.json(
      { error: "Failed to fetch games data" },
      { status: 500 }
    )
  }
}