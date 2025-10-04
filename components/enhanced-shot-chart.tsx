"use client"

import type React from "react"
import { useState, useEffect } from "react"
import BasketballShotChart from "./basketball-shot-chart-team"

interface EnhancedShotChartProps {
  playerId?: string
  playerName?: string
  teamCode?: string
  season: string
  league?: string
  fetchLeagueData?: boolean
}

interface ShotData {
  id: number
  season: number
  phase: string
  round: number
  gamecode: string
  num_anot: number
  team: string
  id_player: string
  player: string
  id_action: string
  action: string
  points: number
  coord_x: number
  coord_y: number
  zone: string
  bin: string
  fastbreak: number
  second_chance: number
  points_off_turnover: number
  minute: number
  console: string
  points_a: number
  points_b: number
  utc: string
}

interface LeagueAverageData {
  id: number
  season: number
  bin: string
  total_shots: number
  made_shots: number
  shot_percentage: number
}

const EnhancedShotChart: React.FC<EnhancedShotChartProps> = ({
  playerId,
  playerName,
  teamCode,
  season,
  league = "euroleague",
  fetchLeagueData = false,
}) => {
  const [shotData, setShotData] = useState<ShotData[]>([])
  const [leagueAverages, setLeagueAverages] = useState<LeagueAverageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch shot data and league averages in parallel
        const [shotResponse, averagesResponse] = await Promise.all([fetchShotData(), fetchLeagueAverages()])

        if (shotResponse.success) {
          setShotData(shotResponse.data || [])
        } else {
          console.error("Failed to fetch shot data:", shotResponse.error)
        }

        if (averagesResponse.success) {
          setLeagueAverages(averagesResponse.data || [])
        } else {
          console.error("Failed to fetch league averages:", averagesResponse.error)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [playerId, playerName, teamCode, season, league, fetchLeagueData])

  const fetchShotData = async () => {
    const params = new URLSearchParams({
      season,
      league,
      ...(fetchLeagueData && { fetchLeagueData: "true" }),
      ...(playerId && { playerId }),
      ...(playerName && { playerName }),
      ...(teamCode && { team: teamCode }),
    })

    const response = await fetch(`/api/shot-data?${params}`)
    return await response.json()
  }

  const fetchLeagueAverages = async () => {
    const params = new URLSearchParams({
      season,
      league,
    })

    const response = await fetch(`/api/shot-averages?${params}`)
    return await response.json()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shot chart data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error loading shot chart</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (shotData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-600">
          <p className="text-lg font-semibold mb-2">No shot data available</p>
          <p className="text-sm">
            {fetchLeagueData
              ? `No shots found for ${league} season ${season}`
              : `No shots found for ${playerName || teamCode || playerId} in ${league} season ${season}`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Data summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">Total Shots:</span> {shotData.length}
          </div>
          <div>
            <span className="font-semibold">League Zones:</span> {leagueAverages.length}
          </div>
          <div>
            <span className="font-semibold">Season:</span> {season}
          </div>
          <div>
            <span className="font-semibold">League:</span> {league.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Shot Chart */}
      <BasketballShotChart
        shotData={shotData}
        leagueAveragesData={leagueAverages}
        playerId={playerId || playerName || teamCode || "unknown"}
        season={season}
      />
    </div>
  )
}

export default EnhancedShotChart
