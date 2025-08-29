"use client"

import { useState, useEffect } from "react"
import { Users, BarChart3, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { fetchPlayerStatsFromGameLogs } from "@/app/actions/standings"
import type { PlayerStatsFromGameLogs } from "@/lib/db"

// Team background colors (hardcoded as requested)
const teamColors = {
  ZAL: "bg-green-600",
  MAD: "bg-blue-600",
  BAR: "bg-red-600",
  OLY: "bg-red-600",
  PAN: "bg-green-600",
  ULK: "bg-yellow-600",
  IST: "bg-blue-600",
  TEL: "bg-yellow-600",
  MIL: "bg-red-600",
  MUN: "bg-red-600",
  ASV: "bg-gray-600",
  BER: "bg-yellow-600",
  RED: "bg-red-600",
  BAS: "bg-blue-600",
  VIR: "bg-black",
  PAR: "bg-black",
  PRS: "bg-gray-600",
  MCO: "bg-red-600",
}

// Helper function to get team logo from player data
const getTeamLogo = (teamCode: string, teamLogo?: string) => {
  const bgColor = teamColors[teamCode as keyof typeof teamColors] || "bg-gray-600"

  if (teamLogo && teamLogo.trim() !== "") {
    return (
      <div className={`inline-flex items-center justify-center w-full h-full rounded-md ${bgColor} p-0.5`}>
        <img
          src={teamLogo || "/placeholder.svg"}
          alt={`${teamCode} logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg?height=16&width=16"
          }}
        />
      </div>
    )
  } else {
    // Fallback to colored square with team code
    return (
      <div
        className={`inline-flex items-center justify-center w-full h-full rounded-lg ${bgColor} text-white font-bold text-xs`}
      >
        {teamCode}
      </div>
    )
  }
}

// Update the getPercentileBarColor function to match the one in offense-tab.tsx
const getPercentileBarColor = (percentile: number) => {
  if (percentile <= 0) return "bg-gray-500"

  // Calculate the percentile based on rank (1 is best, totalRanks is worst)
  // Convert percentile (0-100) to rank-like system for color calculation
  const rank = Math.round(((100 - percentile) / 100) * 18) + 1 // Simulate 18 teams like standings
  const total = 18

  // Create a more distinct green-to-red color scale with clearer differentiation between ranks
  if (rank === 1) return "bg-green-600" // Best
  if (rank === 2) return "bg-green-500" // 2nd best
  if (rank === 3) return "bg-green-400" // 3rd best
  if (percentile >= 75) return "bg-green-300"
  if (percentile >= 50) return "bg-green-200"
  if (percentile >= 25) return "bg-red-200"
  if (rank === total - 2) return "bg-red-400" // 3rd worst
  if (rank === total - 1) return "bg-red-500" // 2nd worst
  if (rank === total) return "bg-red-600" // Worst

  return "bg-red-300"
}

// Function to determine text color based on percentile
const getPercentileTextColor = (percentile: number) => {
  if (percentile <= 0) return "text-white" // gray-500 background

  // Calculate the percentile based on rank (1 is best, totalRanks is worst)
  // Convert percentile (0-100) to rank-like system for color calculation
  const rank = Math.round(((100 - percentile) / 100) * 18) + 1 // Simulate 18 teams like standings
  const total = 18

  // Return white text for darker backgrounds, black text for lighter backgrounds
  if (rank === 1) return "text-white" // bg-green-600 - dark
  if (rank === 2) return "text-white" // bg-green-500 - dark
  if (rank === 3) return "text-white" // bg-green-400 - dark
  if (percentile >= 75) return "text-black" // bg-green-300 - light
  if (percentile >= 50) return "text-black" // bg-green-200 - light
  if (percentile >= 25) return "text-black" // bg-red-200 - light
  if (rank === total - 2) return "text-white" // bg-red-400 - dark
  if (rank === total - 1) return "text-white" // bg-red-500 - dark
  if (rank === total) return "text-white" // bg-red-600 - dark

  return "text-black" // bg-red-300 - light
}

const ComparisonTab = ({
  selectedSeason = 2024,
  selectedLeague = "euroleague", // Changed from 'league' to 'selectedLeague' to match parent prop
}: { selectedSeason?: number; selectedLeague?: string }) => {
  // Updated interface to use 'selectedLeague'
  const [currentPhase, setCurrentPhase] = useState<string>("Regular Season")
  const [allPlayers, setAllPlayers] = useState<PlayerStatsFromGameLogs[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [comparisonMode, setComparisonMode] = useState<"average" | "per40">("average")

  // State for team and player selection - changed from 4 to 3 players
  const [selectedTeams, setSelectedTeams] = useState<(string | null)[]>([null, null, null])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(string | null)[]>([null, null, null])

  // Organize players by team for selection
  const [teamsList, setTeamsList] = useState<{ id: string; name: string }[]>([])
  const [playersByTeam, setPlayersByTeam] = useState<{ [key: string]: PlayerStatsFromGameLogs[] }>({})

  // Load all players data using the same data source as statistics tab
  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true)
      try {
        console.log("Loading players for comparison tab:", selectedSeason, currentPhase, selectedLeague) // Updated to use selectedLeague
        const players = await fetchPlayerStatsFromGameLogs(
          selectedSeason,
          currentPhase,
          selectedLeague === "international-euroleague" ? "euroleague" : "eurocup",
        ) // Updated to use selectedLeague and convert to expected format
        console.log("Loaded players:", players.length)
        setAllPlayers(players)

        // Extract unique teams from players
        const teamsMap = new Map<string, { id: string; name: string }>()
        const playersByTeamMap: { [key: string]: PlayerStatsFromGameLogs[] } = {}

        players.forEach((player) => {
          const teamCode = player.player_team_code
          const teamName = player.player_team_name

          // Add team to teams list if not already added
          if (!teamsMap.has(teamCode)) {
            teamsMap.set(teamCode, { id: teamCode, name: teamName })
            playersByTeamMap[teamCode] = []
          }

          // Add player to the team's player list
          playersByTeamMap[teamCode].push(player)
        })

        // Convert map to array and sort by team name
        setTeamsList(Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
        setPlayersByTeam(playersByTeamMap)
      } catch (error) {
        console.error("Error loading players:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlayers()
  }, [selectedSeason, currentPhase, selectedLeague]) // Updated dependency to use selectedLeague

  // Handle team selection
  const handleTeamSelect = (slotIndex: number, teamId: string) => {
    const newSelectedTeams = [...selectedTeams]
    const newSelectedPlayerIds = [...selectedPlayerIds]

    newSelectedTeams[slotIndex] = teamId || null
    newSelectedPlayerIds[slotIndex] = null // Reset player selection when team changes

    setSelectedTeams(newSelectedTeams)
    setSelectedPlayerIds(newSelectedPlayerIds)
  }

  // Handle player selection
  const handlePlayerSelect = (slotIndex: number, playerId: string) => {
    const newSelectedPlayerIds = [...selectedPlayerIds]
    newSelectedPlayerIds[slotIndex] = playerId || null

    setSelectedPlayerIds(newSelectedPlayerIds)
  }

  // Function to calculate player rank for a specific stat
  const getPlayerRank = (
    player: PlayerStatsFromGameLogs | null,
    statKey: keyof PlayerStatsFromGameLogs,
    higherIsBetter = true,
  ) => {
    if (!allPlayers.length || !player) return { percentile: 50, rank: 0, total: 0 }

    // Filter out players with 0 or invalid values for percentage stats
    const validPlayers = allPlayers.filter((p) => {
      const value = Number(p[statKey])
      // For percentage stats, filter out players with 0 attempts or very low values
      if (statKey.includes("percentage")) {
        return value > 0 && !isNaN(value)
      }
      return !isNaN(value)
    })

    // Calculate per-40 values for comparison if in per40 mode
    const getStatValue = (p: PlayerStatsFromGameLogs) => {
      const rawValue = Number(p[statKey])
      if (comparisonMode === "per40" && !statKey.includes("percentage")) {
        const minutes = Number(p.minutes_played)
        return minutes > 0 ? (rawValue * 40) / minutes : 0
      }
      return rawValue
    }

    // Sort players by the stat value (adjusted for per-40 if needed)
    const sortedPlayers = validPlayers.sort((a, b) => {
      const aValue = getStatValue(a)
      const bValue = getStatValue(b)
      return higherIsBetter ? bValue - aValue : aValue - bValue
    })

    // Find the selected player's rank using adjusted value
    const selectedPlayerValue = getStatValue(player)
    const playerRank = sortedPlayers.findIndex((p) => getStatValue(p) === selectedPlayerValue) + 1

    // Calculate percentile (higher rank = lower percentile)
    const percentile = Math.round(((sortedPlayers.length - playerRank) / Math.max(1, sortedPlayers.length - 1)) * 100)

    return {
      percentile,
      rank: playerRank,
      total: sortedPlayers.length,
    }
  }

  // Helper function to get the best performing player for a specific stat
  const getBestPerformerForStat = (statKey: keyof PlayerStatsFromGameLogs) => {
    const selectedPlayersData = selectedPlayerIds
      .map((playerId, index) => {
        if (!playerId) return null
        const teamId = selectedTeams[index]
        const playerData = teamId ? playersByTeam[teamId]?.find((p) => p.player_id === playerId) : null
        if (!playerData) return null

        const rankData = getPlayerRank(playerData, statKey)
        return {
          playerId,
          percentile: rankData.percentile,
        }
      })
      .filter(Boolean)

    if (selectedPlayersData.length < 2) return null

    const bestPercentile = Math.max(...selectedPlayersData.map((p) => p.percentile))
    const bestPerformers = selectedPlayersData.filter((p) => p.percentile === bestPercentile)

    return bestPerformers.map((p) => p.playerId)
  }

  // Helper function to format percentage values with 2 decimal places
  const formatPercentage = (value: number): string => {
    return value.toFixed(2)
  }

  return (
    <div className="space-y-3">
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-2 text-sm text-gray-600">Loading player data...</span>
        </div>
      )}

      {/* Player Selection Grid with Header */}
      {!isLoading && (
        <div className="bg-white rounded-md p-4 border border-black shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center mt-1 mb-1">Player Comparison</h3>
            {/* Display Mode Toggle - Updated to match league standings tab */}
            <div className="flex rounded-full bg-[#f1f5f9] p-0.5">
              <button
                onClick={() => setComparisonMode("average")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  comparisonMode === "average" ? "bg-[#475569] text-white" : "text-[#475569]"
                }`}
              >
                Per Game
              </button>
              <button
                onClick={() => setComparisonMode("per40")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  comparisonMode === "per40" ? "bg-[#475569] text-white" : "text-[#475569]"
                }`}
              >
                Per 40
              </button>
            </div>
          </div>

          {/* Player Selection Grid - changed from grid-cols-4 to grid-cols-3 */}
          <div className="grid grid-cols-3 gap-4">
            {/* Changed from [0, 1, 2, 3] to [0, 1, 2] */}
            {[0, 1, 2].map((slotIndex) => {
              const selectedTeamId = selectedTeams[slotIndex]
              const selectedPlayerId = selectedPlayerIds[slotIndex]

              // Find the selected player data
              const playerData =
                selectedTeamId && selectedPlayerId
                  ? playersByTeam[selectedTeamId]?.find((p) => p.player_id === selectedPlayerId)
                  : null

              return (
                <div key={slotIndex} className="flex flex-col space-y-2">
                  {/* Compact Team & Player Selection */}
                  <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-1.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800">
                          {slotIndex + 1}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700">Player Selection</span>
                      </div>
                      {(selectedTeamId || selectedPlayerId) && (
                        <button
                          onClick={() => {
                            const newSelectedTeams = [...selectedTeams]
                            const newSelectedPlayerIds = [...selectedPlayerIds]
                            newSelectedTeams[slotIndex] = null
                            newSelectedPlayerIds[slotIndex] = null
                            setSelectedTeams(newSelectedTeams)
                            setSelectedPlayerIds(newSelectedPlayerIds)
                          }}
                          className="w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                          title="Clear selection"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-[40px_1fr] gap-y-1">
                      {/* Team Selection */}
                      <div className="text-[8px] font-semibold text-gray-500 uppercase flex items-center">Team:</div>
                      <div>
                        <select
                          value={selectedTeamId || ""}
                          onChange={(e) => handleTeamSelect(slotIndex, e.target.value)}
                          className="w-full text-[10px] border border-gray-200 rounded py-0.5 px-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select Team</option>
                          {teamsList.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Player Selection - removed position display */}
                      <div className="text-[8px] font-semibold text-gray-500 uppercase flex items-center">Player:</div>
                      <div>
                        <select
                          value={selectedPlayerId || ""}
                          onChange={(e) => handlePlayerSelect(slotIndex, e.target.value)}
                          disabled={!selectedTeamId}
                          className="w-full text-[10px] border border-gray-200 rounded py-0.5 px-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select Player</option>
                          {selectedTeamId &&
                            playersByTeam[selectedTeamId]?.map((player) => (
                              <option key={player.player_id} value={player.player_id}>
                                {player.player_name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Player Card - fixed team logo function calls */}
                  {playerData ? (
                    <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-xl flex-1">
                      <CardContent className="p-0">
                        {/* Player Info Header - using team logo from player data */}
                        <div className="relative bg-white p-3 border-b border-gray-200">
                          <div className="flex items-center">
                            {/* Team Logo from Player Data */}
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm bg-white flex items-center justify-center">
                                {getTeamLogo(playerData.player_team_code, playerData.teamlogo)}
                              </div>
                            </div>

                            {/* Player Name and Team */}
                            <div className="flex-1">
                              <h3
                                className={`text-gray-900 font-bold truncate mb-1 ${
                                  playerData.player_name.length <= 12
                                    ? "text-sm"
                                    : playerData.player_name.length <= 18
                                      ? "text-xs"
                                      : "text-[11px]"
                                }`}
                              >
                                {playerData.player_name}
                              </h3>
                              <div className="flex items-center">
                                <div className="bg-gray-100 rounded-md w-4 h-4 flex items-center justify-center shadow-sm mr-1 border border-gray-200">
                                  {getTeamLogo(playerData.player_team_code, playerData.teamlogo)}
                                </div>
                                <div className="text-gray-600 text-xs truncate">{playerData.player_team_name}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compact Season Stats Row */}
                        <div className="bg-white px-2 py-1 border-b border-gray-100">
                          <div className="grid grid-cols-4 gap-1">
                            <div className="bg-gray-50 border border-gray-200 rounded-md py-0.5 text-center">
                              <div className="text-[7px] font-semibold text-gray-500 uppercase tracking-wide">MIN</div>
                              <div className="text-[10px] font-bold text-gray-900">
                                {Number(playerData.minutes_played).toFixed(1)}
                              </div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-md py-0.5 text-center">
                              <div className="text-[7px] font-semibold text-gray-500 uppercase tracking-wide">GP</div>
                              <div className="text-[10px] font-bold text-gray-900">{playerData.games_played}</div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-md py-0.5 text-center">
                              <div className="text-[7px] font-semibold text-gray-500 uppercase tracking-wide">GS</div>
                              <div className="text-[10px] font-bold text-gray-900">{playerData.games_started}</div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-md py-0.5 text-center">
                              <div className="text-[7px] font-semibold text-gray-500 uppercase tracking-wide">PIR</div>
                              <div className="text-[10px] font-bold text-gray-900">
                                {Number(playerData.pir).toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Percentile Rankings Section */}
                        <div className="px-2 pt-3 pb-3 overflow-auto bg-white">
                          {/* Traditional Stats Section */}
                          <div className="mb-4">
                            <div className="relative mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="w-3 h-3 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-yellow-600">
                                    <path
                                      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-800 uppercase tracking-wide">
                                  Traditional
                                </span>
                              </div>
                              <div className="h-0.5 w-full bg-gradient-to-r from-yellow-500 to-yellow-600"></div>
                            </div>

                            {/* Performance scale legend */}
                            <div className="flex justify-between items-center text-[7px] font-medium px-8 pb-0.5">
                              <span className="text-red-700">POOR</span>
                              <span className="text-gray-400">AVERAGE</span>
                              <span className="text-teal-700">GREAT</span>
                            </div>

                            {/* Main Stats */}
                            {[
                              {
                                key: "pir" as keyof PlayerStatsFromGameLogs,
                                label: "PIR",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.pir) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.pir),
                                isPercentage: false,
                              },
                              {
                                key: "points_scored" as keyof PlayerStatsFromGameLogs,
                                label: "PTS",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.points_scored) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.points_scored),
                                isPercentage: false,
                              },
                              {
                                key: "total_rebounds" as keyof PlayerStatsFromGameLogs,
                                label: "REB",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.total_rebounds) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.total_rebounds),
                                isPercentage: false,
                              },
                              {
                                key: "assists" as keyof PlayerStatsFromGameLogs,
                                label: "AST",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.assists) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.assists),
                                isPercentage: false,
                              },
                              {
                                key: "three_pointers_made" as keyof PlayerStatsFromGameLogs,
                                label: "3PM",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.three_pointers_made) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.three_pointers_made),
                                isPercentage: false,
                              },
                              {
                                key: "steals" as keyof PlayerStatsFromGameLogs,
                                label: "STL",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.steals) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.steals),
                                isPercentage: false,
                              },
                              {
                                key: "blocks" as keyof PlayerStatsFromGameLogs,
                                label: "BLK",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.blocks) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.blocks),
                                isPercentage: false,
                              },
                            ].map((stat) => {
                              const rankData = getPlayerRank(playerData, stat.key)
                              const bestPerformers = getBestPerformerForStat(stat.key)
                              const isWinner = bestPerformers?.includes(playerData.player_id)
                              const isLoser = bestPerformers && bestPerformers.length > 0 && !isWinner

                              return (
                                <div
                                  key={stat.key}
                                  className={`flex items-center mb-1 relative transition-all duration-200 ${
                                    isWinner
                                      ? "bg-yellow-200 rounded-sm px-1 -mx-1"
                                      : isLoser
                                        ? "opacity-40 grayscale"
                                        : ""
                                  }`}
                                >
                                  <div className="w-8 text-[8px] font-semibold text-gray-800 pr-1 relative flex items-center justify-start h-4">
                                    {stat.label}
                                    <div className="border-b border-dashed border-gray-400 w-full absolute left-0 bottom-0"></div>
                                  </div>
                                  <div className="flex-1 h-4 relative">
                                    {/* Colored bar */}
                                    <div
                                      className={`absolute inset-y-0.5 left-0 ${getPercentileBarColor(rankData.percentile)} rounded-sm`}
                                      style={{ width: `${rankData.percentile}%` }}
                                    ></div>
                                    {/* Extension bar */}
                                    <div
                                      className="absolute bg-gray-300 rounded-sm"
                                      style={{
                                        left: `${rankData.percentile}%`,
                                        width: `${100 - rankData.percentile}%`,
                                        top: "37.5%",
                                        height: "25%",
                                      }}
                                    ></div>
                                    {/* Circle */}
                                    <div
                                      className="absolute flex items-center justify-center"
                                      style={{
                                        left: `${rankData.percentile}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    >
                                      <div
                                        className={`${getPercentileBarColor(rankData.percentile)} rounded-full w-4 h-4 flex items-center justify-center text-[7px] font-bold ${getPercentileTextColor(rankData.percentile)} shadow-lg border border-white z-10`}
                                      >
                                        {rankData.percentile}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-8 text-[8px] text-right font-mono font-semibold text-gray-800 ml-1 relative flex items-center justify-end h-4">
                                    {stat.isPercentage ? formatPercentage(stat.value) : stat.value.toFixed(1)}
                                    <div className="border-b border-dashed border-gray-400 w-full absolute left-0 bottom-0"></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Shooting Section */}
                          <div className="mb-4">
                            <div className="relative mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <Target className="h-3 w-3 text-green-600" />
                                <span className="text-[10px] font-semibold text-gray-800 uppercase tracking-wide">
                                  Shooting
                                </span>
                              </div>
                              <div className="h-0.5 w-full bg-gradient-to-r from-green-500 to-green-600"></div>
                            </div>
                            {[
                              {
                                key: "three_pointers_percentage" as keyof PlayerStatsFromGameLogs,
                                label: "3PT%",
                                value: Number(playerData.three_pointers_percentage),
                                isPercentage: true,
                              },
                              {
                                key: "two_pointers_percentage" as keyof PlayerStatsFromGameLogs,
                                label: "2PT%",
                                value: Number(playerData.two_pointers_percentage),
                                isPercentage: true,
                              },
                              {
                                key: "free_throws_percentage" as keyof PlayerStatsFromGameLogs,
                                label: "FT%",
                                value: Number(playerData.free_throws_percentage),
                                isPercentage: true,
                              },
                            ].map((stat) => {
                              const rankData = getPlayerRank(playerData, stat.key)
                              const bestPerformers = getBestPerformerForStat(stat.key)
                              const isWinner = bestPerformers?.includes(playerData.player_id)
                              const isLoser = bestPerformers && bestPerformers.length > 0 && !isWinner

                              return (
                                <div
                                  key={stat.key}
                                  className={`flex items-center mb-1 relative transition-all duration-200 ${
                                    isWinner
                                      ? "bg-yellow-200 rounded-sm px-1 -mx-1"
                                      : isLoser
                                        ? "opacity-40 grayscale"
                                        : ""
                                  }`}
                                >
                                  <div className="w-8 text-[8px] font-semibold text-gray-800 pr-1 relative flex items-center justify-start h-4">
                                    {stat.label}
                                    <div className="border-b border-dashed border-gray-400 w-full absolute left-0 bottom-0"></div>
                                  </div>
                                  <div className="flex-1 h-4 relative">
                                    {/* Colored bar */}
                                    <div
                                      className={`absolute inset-y-0.5 left-0 ${getPercentileBarColor(rankData.percentile)} rounded-sm`}
                                      style={{ width: `${rankData.percentile}%` }}
                                    ></div>

                                    {/* Extension bar */}
                                    <div
                                      className="absolute bg-gray-300 rounded-sm"
                                      style={{
                                        left: `${rankData.percentile}%`,
                                        width: `${100 - rankData.percentile}%`,
                                        top: "37.5%",
                                        height: "25%",
                                      }}
                                    ></div>

                                    {/* Circle */}
                                    <div
                                      className="absolute flex items-center justify-center"
                                      style={{
                                        left: `${rankData.percentile}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    >
                                      <div
                                        className={`${getPercentileBarColor(rankData.percentile)} rounded-full w-4 h-4 flex items-center justify-center text-[7px] font-bold ${getPercentileTextColor(rankData.percentile)} shadow-lg border border-white z-10`}
                                      >
                                        {rankData.percentile}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-8 text-[8px] text-right font-mono font-semibold text-gray-800 ml-1 relative flex items-center justify-end h-4">
                                    {stat.isPercentage ? formatPercentage(stat.value) : stat.value.toFixed(1)}
                                    <div className="border-b border-dashed border-gray-400 w-full absolute left-0 bottom-0"></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Advanced Section */}
                          <div className="mb-2">
                            <div className="relative mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <BarChart3 className="h-3 w-3 text-blue-600" />
                                <span className="text-[10px] font-semibold text-gray-800 uppercase tracking-wide">
                                  Other
                                </span>
                              </div>
                              <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                            </div>
                            {[
                              {
                                key: "offensive_rebounds" as keyof PlayerStatsFromGameLogs,
                                label: "OR",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.offensive_rebounds) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.offensive_rebounds),
                                isPercentage: false,
                              },
                              {
                                key: "defensive_rebounds" as keyof PlayerStatsFromGameLogs,
                                label: "DR",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.defensive_rebounds) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.defensive_rebounds),
                                isPercentage: false,
                              },
                              {
                                key: "turnovers" as keyof PlayerStatsFromGameLogs,
                                label: "TO",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.turnovers) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.turnovers),
                                isPercentage: false,
                              },
                              {
                                key: "fouls_commited" as keyof PlayerStatsFromGameLogs,
                                label: "PF",
                                value:
                                  comparisonMode === "per40"
                                    ? (Number(playerData.fouls_commited) * 40) / Number(playerData.minutes_played)
                                    : Number(playerData.fouls_commited),
                                isPercentage: false,
                              },
                            ].map((stat) => {
                              const rankData = getPlayerRank(
                                playerData,
                                stat.key,
                                stat.key !== "turnovers" && stat.key !== "fouls_commited",
                              )
                              const bestPerformers = getBestPerformerForStat(stat.key)
                              const isWinner = bestPerformers?.includes(playerData.player_id)
                              const isLoser = bestPerformers && bestPerformers.length > 0 && !isWinner

                              return (
                                <div
                                  key={stat.key}
                                  className={`flex items-center mb-1 relative transition-all duration-200 ${
                                    isWinner
                                      ? "bg-yellow-200 rounded-sm px-1 -mx-1"
                                      : isLoser
                                        ? "opacity-40 grayscale"
                                        : ""
                                  }`}
                                >
                                  <div className="w-8 text-[8px] font-semibold text-gray-800 pr-1 relative flex items-center justify-start h-4">
                                    {stat.label}
                                    <div className="border-b border-dashed border-gray-400 w-full absolute left-0 bottom-0"></div>
                                  </div>
                                  <div className="flex-1 h-4 relative">
                                    {/* Colored bar */}
                                    <div
                                      className={`absolute inset-y-0.5 left-0 ${getPercentileBarColor(rankData.percentile)} rounded-sm`}
                                      style={{ width: `${rankData.percentile}%` }}
                                    ></div>

                                    {/* Extension bar */}
                                    <div
                                      className="absolute bg-gray-300 rounded-sm"
                                      style={{
                                        left: `${rankData.percentile}%`,
                                        width: `${100 - rankData.percentile}%`,
                                        top: "37.5%",
                                        height: "25%",
                                      }}
                                    ></div>

                                    {/* Circle */}
                                    <div
                                      className="absolute flex items-center justify-center"
                                      style={{
                                        left: `${rankData.percentile}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                      }}
                                    >
                                      <div
                                        className={`${getPercentileBarColor(rankData.percentile)} rounded-full w-4 h-4 flex items-center justify-center text-[7px] font-bold ${getPercentileTextColor(rankData.percentile)} shadow-lg border border-white z-10`}
                                      >
                                        {rankData.percentile}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-8 text-[8px] text-right font-mono font-semibold text-gray-800 ml-1 relative flex items-center justify-end h-4">
                                    {stat.isPercentage ? formatPercentage(stat.value) : stat.value.toFixed(1)}
                                    <div className="border-b border-dashed border-gray-400 w-full absolute left-0 bottom-0"></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Empty slot placeholder - make this slightly more compact */
                    <Card className="overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl flex-1 hover:border-gray-400 transition-colors">
                      <CardContent className="p-0 h-full">
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-gray-400 min-h-[380px]">
                          <Users className="h-6 w-6 mb-1" />
                          <span className="text-xs font-medium">Select Team & Player</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparisonTab
