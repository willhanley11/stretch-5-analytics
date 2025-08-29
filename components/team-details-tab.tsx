"use client"
import React from "react"
import { useState, useEffect } from "react"
import { ShootingProfileTable } from "@/components/shooting-profile-table"
import { fetchPlayerStatsFromGameLogs } from "@/app/actions/standings"

import {
  fetchTeamSchedule,
  fetchTeamGameLogs,
  fetchTeamAdvancedStatsByTeamCode,
  fetchLeagueAveragesPrecalculated,
} from "@/app/actions/standings"
import { ChevronDown } from "lucide-react"
import BasketballShotChart from "./basketball-shot-chart-team"

interface TeamDetailsTabProps {
  isLoading: boolean
  teamStats: EuroleagueTeamStats[]
  selectedTeam: string
  setSelectedTeam: (team: string) => void
  teamNameToCode: Record<string, string>
  team_logo_mapping: Record<string, string>
  getTeamLogo: (teamName: string) => React.ReactNode
  getTeamColorStyles: (teamName: string) => { backgroundColor: string; textColorClass: string }
  playerStats: any[]
  playerStatsMode: string
  setPlayerStatsMode: (mode: string) => void
  calculatePlayerStats: (player: any, mode: string) => any

  getValueBgClass: (rank: number, total?: number) => string
  selectedSeason: number
  teamPlayers: EuroleaguePlayerStats[]
  selectedPhase: string
  setSelectedPhase: (phase: string) => void
  phases: string[]
  seasons: { id: number; display: string }[]
  setSelectedSeason: (season: number) => void
  league: string // Add this new prop
}

export interface EuroleagueTeamStats {
  id: number
  name: string
  teamcode: string
  season: number
  position: number
  w: number
  l: number
  home: string
  away: string
  streak: string
  teamlogo: string
}

export interface EuroleaguePlayerStats {
  player_id: number
  player_name: string
  player_team_code: string
  player_team_name: string
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
  phase: string
}

export interface ScheduleResult {
  id: number
  teamcode: string
  opponent: string
  opponentlogo: string
  game_date: string
  round: number
  location: string
  team_score: number
  opponent_score: number
  result: string
  record: string
  phase: string
  boxscore: string
}

export interface EuroleagueGameLog {
  id: number
  player: string
  team: string
  opponent: string
  game_date: string
  round: number
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
  is_starter: number
  phase: string
}

export function TeamDetailsTab({
  isLoading,
  teamStats,
  selectedTeam,
  setSelectedTeam,
  teamNameToCode,
  team_logo_mapping,
  getTeamLogo,
  getTeamColorStyles,
  playerStatsMode,
  setPlayerStatsMode,
  getValueBgClass,
  selectedSeason,
  teamPlayers,
  selectedPhase,
  setSelectedPhase,
  phases,
  seasons,
  setSelectedSeason,
  league, // Add this parameter
}: TeamDetailsTabProps) {
  const [teamAdvancedStats, setTeamAdvancedStats] = useState<any>(null)
  const [allTeamsAdvancedStats, setAllTeamsAdvancedStats] = useState<any[]>([])
  const [leagueAverages, setLeagueAverages] = useState<any>(null)
  const [isAdvancedStatsLoading, setIsAdvancedStatsLoading] = useState(true)
  const [expandedGameIndex, setExpandedGameIndex] = useState<number | null>(null)
  const [availableTeams, setAvailableTeams] = useState<string[]>([])
  const [scheduleData, setScheduleData] = useState<ScheduleResult[]>([])
  const [isScheduleLoading, setIsScheduleLoading] = useState(true)
  const [gameLogsData, setGameLogsData] = useState<EuroleagueGameLog[]>([])
  const [isGameLogsLoading, setIsGameLogsLoading] = useState(true)
  const [selectedGameLogPhase, setSelectedGameLogPhase] = useState<string>("All")
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
  const [playerSortColumnLocal, setPlayerSortColumn] = useState<string>("points_scored")
  const [playerSortDirectionLocal, setPlayerSortDirection] = useState<"asc" | "desc">("desc")

  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState<string>("regular")
  const [selectedTeamReportPhase, setSelectedTeamReportPhase] = useState<string>("RS")

  const [teamShotData, setTeamShotData] = useState<any[]>([])
  const [isTeamShotDataLoading, setIsTeamShotDataLoading] = useState(true)

  const [isShotDataLoading, setIsShotDataLoading] = useState(true)
  const [isPlayerStatsLoading, setIsPlayerStatsLoading] = useState(true)
  const [isComponentReady, setIsComponentReady] = useState(false)

  // Function to handle column sorting
  const handlePlayerColumnSort = (column: string) => {
    if (playerSortColumnLocal === column) {
      // If clicking the same column, toggle the sort direction
      setPlayerSortDirection(playerSortDirectionLocal === "asc" ? "desc" : "asc")
    } else {
      // If clicking a new column, set it as the sort column and default to ascending
      setPlayerSortColumn(column) // Assuming you have a setPlayerSortColumn state setter
      setPlayerSortDirection("asc")
    }
  }

  // Function to render sort indicator
  const renderSortIndicator = (column: string) => {
    const isActive = playerSortColumnLocal === column
    return (
      <span className="ml-2 inline-flex flex-col">
        <span
          className={`text-[10px] leading-none ${isActive && playerSortDirectionLocal === "asc" ? "text-blue-600" : "text-black-400"}`}
        >
          ▲
        </span>
        <span
          className={`text-[10px] leading-none ${isActive && playerSortDirectionLocal === "desc" ? "text-blue-600" : "text-black-400"}`}
        >
          ▼
        </span>
      </span>
    )
  }

  const getNetRating = () => {
    if (!teamAdvancedStats) return null
    return teamAdvancedStats.net_rating
  }

  const getAveragePace = () => {
    if (!teamAdvancedStats) return null
    return teamAdvancedStats.pace
  }

  // Create a more robust teamcode lookup that works across seasons
  const getTeamCodeForSeason = (teamName: string, season: number) => {
    // First try the current mapping
    let teamCode = teamNameToCode[teamName]

    if (!teamCode) {
      // If not found, try to find the teamcode from the current season's team stats
      const currentTeamData = teamStats.find((team) => team.name === teamName && team.season === selectedSeason)
      if (currentTeamData) {
        teamCode = currentTeamData.teamcode
      }
    }

    return teamCode
  }

  const isAnyDataLoading =
    !isComponentReady || isLoading || isScheduleLoading || isGameLogsLoading || isAdvancedStatsLoading

  // Add this helper function near the top of the component, after the other helper functions
  const getSelectedTeamCode = () => {
    const teamData = teamStats.find((team) => team.name === selectedTeam)
    return teamData?.teamcode || teamNameToCode[selectedTeam] || ""
  }

  // Add this helper function to get team logo URL using the same logic as the top logos
  const getTeamLogoUrl = (teamCode: string) => {
    // First check if we have a direct logo URL from the database for this team
    const teamData = teamStats.find((team) => team.teamcode === teamCode)
    if (teamData?.teamlogo) {
      console.log(`Using database logo for ${teamCode}:`, teamData.teamlogo)
      return teamData.teamlogo
    }

    // Fallback to the mapping using teamcode
    if (teamCode && team_logo_mapping[teamCode]) {
      console.log(`Using mapping logo for ${teamCode}:`, team_logo_mapping[teamCode])
      return team_logo_mapping[teamCode]
    }

    console.log(`No logo found for ${teamCode}, using placeholder`)
    return null
  }

  const [leagueAveragesData, setLeagueAveragesData] = useState([])
  // Helper function for very subtle conditional formatting with specific thresholds
  const getSubtleConditionalStyle = (value: number, allValues: number[], higherIsBetter = true) => {
    if (!value || !allValues || allValues.length === 0) return {}

    // Filter out invalid values
    const validValues = allValues.filter((v) => !isNaN(v) && v !== null && v !== undefined)
    if (validValues.length === 0) return {}

    // Sort values to determine percentiles
    const sortedValues = [...validValues].sort((a, b) => a - b)

    // Find the percentile of the current value
    const index = sortedValues.findIndex((v) => v >= value)
    const percentile = index / sortedValues.length

    let backgroundColor

    if (higherIsBetter) {
      // For stats where higher is better (points, rebounds, etc.)
      if (percentile > 0.99) {
        backgroundColor = "#1e40af" // Top 1% - blue-800
      } else if (percentile > 0.97) {
        backgroundColor = "#3b82f6" // Top 3% - blue-500
      } else if (percentile > 0.95) {
        backgroundColor = "#60a5fa" // Top 5% - blue-400
      } else if (percentile > 0.9) {
        backgroundColor = "#93c5fd" // Top 10% - blue-300
      } else if (percentile > 0.8) {
        backgroundColor = "#dbeafe" // Top 20% - blue-100
      } else {
        backgroundColor = "transparent" // Bottom 80% - no background
      }
    } else {
      // For stats where lower is better (like turnovers)
      if (percentile > 0.99) {
        backgroundColor = "#1e40af" // Top 1% - blue-800
      } else if (percentile > 0.97) {
        backgroundColor = "#3b82f6" // Top 3% - blue-500
      } else if (percentile > 0.95) {
        backgroundColor = "#60a5fa" // Top 5% - blue-400
      } else if (percentile > 0.9) {
        backgroundColor = "#93c5fd" // Top 10% - blue-300
      } else if (percentile > 0.8) {
        backgroundColor = "#dbeafe" // Top 20% - blue-100
      } else {
        backgroundColor = "transparent" // Bottom 80% - no background
      }
    }

    return { backgroundColor }
  }

  // Calculate advanced team stats from game logs
  const [teamPlayerStats, setTeamPlayerStats] = useState<any[]>([])
  const [isTeamPlayerStatsLoading, setIsTeamPlayerStatsLoading] = useState(false)

  // Helper function to filter schedule data based on selected filter
  const getFilteredScheduleData = () => {
    return scheduleData.filter((game) => {
      const phase = game.phase || "RS"
      const isRegularSeason = phase === "RS"
      const isPlayoffs = ["PI", "PO", "FF"].includes(phase)

      return selectedScheduleFilter === "regular" ? isRegularSeason : isPlayoffs
    })
  }
  useEffect(() => {
    // Component is ready when we have the essential dependencies
    if (selectedTeam && selectedSeason && teamStats.length > 0) {
      setIsComponentReady(true)
    } else {
      setIsComponentReady(false)
    }
  }, [selectedTeam, selectedSeason, teamStats])

  // Add this effect to fetch schedule data when team or season changes
  useEffect(() => {
    const loadScheduleData = async () => {
      if (selectedTeam && selectedSeason && isComponentReady) {
        setIsScheduleLoading(true)
        try {
          const teamCode = getTeamCodeForSeason(selectedTeam, selectedSeason)
          if (teamCode) {
            const data = await fetchTeamSchedule(teamCode, selectedSeason, league)
            setScheduleData(data)
          } else {
            console.warn("No team code found for:", selectedTeam)
            setScheduleData([])
          }
        } catch (error) {
          console.error("Error fetching schedule data:", error)
          setScheduleData([])
        } finally {
          setIsScheduleLoading(false)
        }
      }
      // ✅ Don't set loading to false when dependencies aren't ready
    }

    if (isComponentReady) {
      loadScheduleData()
    }
  }, [selectedTeam, selectedSeason, teamNameToCode, teamStats, league, isComponentReady])

  // Fetch game logs for all players on the selected team
  // Replace the existing game logs fetching useEffect with this improved version
  useEffect(() => {
    const loadGameLogsData = async () => {
      if (selectedTeam && selectedSeason && isComponentReady) {
        setIsGameLogsLoading(true)
        try {
          // Get team code for the selected team
          const teamCode = getTeamCodeForSeason(selectedTeam, selectedSeason)

          if (!teamCode) {
            console.warn("No team code found for:", selectedTeam)
            setGameLogsData([])
            return
          }

          console.log("Using team code:", teamCode)

          // Fetch all game logs for the team at once instead of individual player requests
          const teamGameLogs = await fetchTeamGameLogs(teamCode, selectedSeason, league) // Use league prop

          // Group by player to see distribution
          const playerCounts = teamGameLogs.reduce(
            (acc, log) => {
              acc[log.player] = (acc[log.player] || 0) + 1
              return acc
            },
            {} as Record<string, EuroleagueGameLog[]>,
          )

          setGameLogsData(teamGameLogs)
        } catch (error) {
          console.error("Error fetching game logs data:", error)

          // Log additional error context
          if (error instanceof Error) {
            console.error("Error details:", {
              name: error.name,
              message: error.message,
              selectedTeam,
              selectedSeason,
            })
          }

          setGameLogsData([])
        } finally {
          setIsGameLogsLoading(false)
        }
      } else {
        // Set loading to false when dependencies aren't ready
        setIsGameLogsLoading(false)
      }
    }

    if (isComponentReady) {
      loadGameLogsData()
    }
  }, [selectedTeam, selectedSeason, teamStats, league, isComponentReady])

  useEffect(() => {
    const loadAdvancedStats = async () => {
      if (selectedTeam && selectedSeason && isComponentReady) {
        setIsAdvancedStatsLoading(true)
        try {
          const teamCode = getTeamCodeForSeason(selectedTeam, selectedSeason)

          if (teamCode) {
            // Fetch team-specific advanced stats
            const teamStats = await fetchTeamAdvancedStatsByTeamCode(
              teamCode,
              selectedSeason,
              selectedTeamReportPhase,
              league,
            )
            console.log("Team advanced stats fetched:", teamStats)
            setTeamAdvancedStats(teamStats)

            // Fetch league averages
            const averages = await fetchLeagueAveragesPrecalculated(selectedSeason, selectedTeamReportPhase, league)
            setLeagueAverages(averages)
          } else {
            console.warn("No team code found for:", selectedTeam)
            setTeamAdvancedStats(null)
            setAllTeamsAdvancedStats([])
            setLeagueAverages(null)
          }
        } catch (error) {
          console.error("Error fetching pre-calculated advanced stats:", error)
          setTeamAdvancedStats(null)
          setAllTeamsAdvancedStats([])
          setLeagueAverages(null)
        } finally {
          setIsAdvancedStatsLoading(false)
        }
      } else {
        // Set loading to false when dependencies aren't ready
        setIsAdvancedStatsLoading(false)
        // Also clear the data when dependencies aren't ready
        setTeamAdvancedStats(null)
        setAllTeamsAdvancedStats([])
        setLeagueAverages(null)
      }
    }

    if (isComponentReady) {
      loadAdvancedStats()
    }
  }, [selectedTeam, selectedSeason, selectedTeamReportPhase, teamStats, league, isComponentReady])

  // Add debugging for teamPlayers data
  useEffect(() => {
    console.log("=== TEAM PLAYERS DEBUG ===")
    console.log("teamPlayers length:", teamPlayers.length)
    console.log("selectedPhase:", selectedPhase)
    console.log("selectedTeam:", selectedTeam)
    console.log("selectedSeason:", selectedSeason)

    if (teamPlayers.length > 0) {
      console.log("First player sample:", teamPlayers[0])
      console.log("First player stats:", {
        points_scored: teamPlayers[0].points_scored,
        assists: teamPlayers[0].assists,
        total_rebounds: teamPlayers[0].total_rebounds,
        games_played: teamPlayers[0].games_played,
        minutes_played: teamPlayers[0].minutes_played,
      })

      // Check the raw object keys and values
      console.log("Raw player object keys:", Object.keys(teamPlayers[0]))
      console.log(
        "Raw points_scored value:",
        teamPlayers[0].points_scored,
        "Type:",
        typeof teamPlayers[0].points_scored,
      )
      console.log("Raw assists value:", teamPlayers[0].assists, "Type:", typeof teamPlayers[0].assists)

      // Check if any players match the selected phase
      const playersInPhase = teamPlayers.filter((p) => p.phase === selectedPhase)
      console.log("Players in selected phase:", playersInPhase.length)

      if (playersInPhase.length > 0) {
        console.log("First player in phase:", playersInPhase[0])
        console.log("First player in phase stats:", {
          points_scored: playersInPhase[0].points_scored,
          assists: playersInPhase[0].assists,
          total_rebounds: playersInPhase[0].total_rebounds,
        })
      }
    }
  }, [teamPlayers, selectedPhase, selectedTeam, selectedSeason])
  // Fetch team shot data
  // Fetch team shot data
  useEffect(() => {
    const loadTeamShotData = async () => {
      if (selectedTeam && selectedSeason) {
        setIsTeamShotDataLoading(true)
        try {
          const teamCode = getTeamCodeForSeason(selectedTeam, selectedSeason)

          if (teamCode) {
            let response = await fetch(`/api/shot-data?team=${teamCode}&season=${selectedSeason}&league=${league}`)

            if (!response.ok || (await response.clone().json()).count === 0) {
              // If team code doesn't work, try the full team name
              console.log("Team code failed, trying full team name:", selectedTeam)
              response = await fetch(
                `/api/shot-data?team=${encodeURIComponent(selectedTeam)}&season=${selectedSeason}&league=${league}`,
              )
            }

            if (response.ok) {
              const data = await response.json()
              console.log("Team shot data fetched:", data.data?.length || data.length, "shots")
              setTeamShotData(data.data || data)
            } else {
              console.error("Failed to fetch team shot data")
              setTeamShotData([])
            }
          } else {
            console.warn("No team code found for team shot data:", selectedTeam)
            setTeamShotData([])
          }
        } catch (error) {
          console.error("Error fetching team shot data:", error)
          setTeamShotData([])
        } finally {
          setIsTeamShotDataLoading(false)
        }
      }
    }

    loadTeamShotData()
  }, [selectedTeam, selectedSeason, teamStats, league])

  // Update available teams when teamStats or selectedSeason changes
  useEffect(() => {
    if (teamStats.length > 0) {
      const teams = teamStats.map((team) => team.name)
      setAvailableTeams(teams)

      // If the currently selected team is not in the list for this season, select the first team
      if (!teams.includes(selectedTeam) && teams.length > 0) {
        setSelectedTeam(teams[0])
      }
    }
  }, [teamStats, selectedSeason, selectedTeam, setSelectedTeam])

  useEffect(() => {
    const loadLeagueAverages = async () => {
      const response = await fetch(`/api/shot-averages?season=${selectedSeason}&league=${league}`)
      const data = await response.json()
      setLeagueAveragesData(data.data || [])
    }
    loadLeagueAverages()
  }, [selectedSeason, league])

  // Update the formatStatValue function to handle nulls better and add a special format for league averages
  const formatStatValue = (value: number | undefined | null, decimals = 1) => {
    if (value === null || value === undefined || isNaN(value)) return "-"
    return value
  }

  // Format rate values with specified decimal places
  const formatRateValue = (value: number | undefined | null, decimals = 1) => {
    return formatStatValue(value, decimals)
  }

  // Function to render filtered schedule with phase headers
  const renderFilteredScheduleWithPhaseHeaders = () => {
    const filteredGames = getFilteredScheduleData()

    if (filteredGames.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-8 text-black-500">
            No {selectedScheduleFilter === "regular" ? "regular season" : "playoff"} games available for {selectedTeam}{" "}
            in {selectedSeason}
          </td>
        </tr>
      )
    }

    // Group games by phase
    const gamesByPhase = filteredGames.reduce((acc, game) => {
      const phase = game.phase || "RS" // Default to Regular Season if no phase
      if (!acc[phase]) {
        acc[phase] = []
      }
      acc[phase].push(game)
      return acc
    }, {})

    // Define phase display names
    const phaseNames = {
      PI: "PLAY-IN",
      PO: "PLAYOFFS",
      FF: "FINAL FOUR",
    }

    // Render games with phase headers
    return Object.entries(gamesByPhase).map(([phase, games]) => {
      const showHeader = phase !== "RS" // Only show headers for non-regular season phases
      const phaseName = phaseNames[phase] || ""

      return (
        <React.Fragment key={phase}>
          {/* Phase header - only for special phases */}
          {showHeader && (
            <tr>
              <td colSpan={7} className="border-b-2 border-gray-700">
                <div className="text-center font-semibold text-black-800 py-2">
                  {phaseName}
                  <div className="h-px w-full bg-slate-700 mt-1"></div>
                </div>
              </td>
            </tr>
          )}

          {/* Games for this phase */}
          {games.map((game, index) => {
            // Format the date to remove time
            const formattedDate = game.game_date ? new Date(game.game_date).toLocaleDateString() : ""

            // Format the result to show W/L before score in tabular format
            const isWin = game.result === "W" || game.result === "Win"
            const isLoss = game.result === "L" || game.result === "Loss"

            // Convert result to W/L format
            const resultDisplay = isWin ? "W" : isLoss ? "L" : game.result || "-"

            const formattedResult =
              game.team_score !== null && game.opponent_score !== null
                ? `${resultDisplay} ${game.team_score}-${game.opponent_score}`
                : "-"

            // Determine row background color based on result
            const rowBgColor = isWin
              ? "bg-green-100 hover:bg-green-200"
              : isLoss
                ? "bg-red-100 hover:bg-red-200"
                : "hover:bg-gray-50"

            return (
              <tr
                key={game.id}
                className={`border-b border-black transition-colors ${rowBgColor} ${
                  expandedGameIndex === filteredGames.indexOf(game) ? "bg-gray-100" : ""
                }`}
              >
                <td className="py-0.5 px-1 text-center border-r border-gray-200 text-[10px] md:text-xs">
                  {game.round}
                </td>
                <td className="text-center py-0.5 px-1 border-r border-gray-200 text-[10px] md:text-xs whitespace-nowrap">
                  {formattedDate}
                </td>
                <td className="py-0.5 px-1 border-r border-gray-200">
                  <div className="flex items-center justify-center md:justify-start">
                    <img
                      src={game.opponentlogo || "/placeholder.svg"}
                      alt={`${game.opponent} logo`}
                      className="w-4 h-4 md:mr-2 object-contain flex-shrink-0"
                    />
                    {/* Hide opponent text on mobile, show on md and up */}
                    <span className="hidden md:inline text-xs truncate">{game.opponent}</span>
                  </div>
                </td>
                <td className="py-0.5 px-1 text-center border-r border-gray-200 font-mono text-[10px] md:text-xs">
                  <span
                    className={`font-medium ${isWin ? "text-green-800" : isLoss ? "text-red-800" : ""} whitespace-nowrap`}
                  >
                    {formattedResult}
                  </span>
                </td>
                <td className="py-0.5 px-1 text-center border-r border-gray-200 text-[10px] md:text-xs truncate">
                  {game.location}
                </td>
                <td className="py-0.5 px-1 text-center border-r border-gray-200 text-[10px] md:text-xs whitespace-nowrap">
                  {game.record || "-"}
                </td>
              </tr>
            )
          })}
        </React.Fragment>
      )
    })
  }

  // Helper function to get the appropriate column name based on display mode
  const getColumnName = (baseStat: string) => {
    if (playerStatsMode === "per_40") {
      // Handle special cases for per40 columns (using per_40 naming from database)
      switch (baseStat) {
        case "games_played":
        case "games_started":
        case "two_pointers_percentage":
        case "three_pointers_percentage":
        case "free_throws_percentage":
          return baseStat // These don't have per40 versions
        case "minutes_played":
          return "minutes_played" // Minutes don't have per40 version
        case "total_rebounds":
          return "total_rebounds_per_40"
        case "offensive_rebounds":
          return "offensive_rebounds_per_40"
        case "defensive_rebounds":
          return "defensive_rebounds_per_40"
        default:
          return `${baseStat}_per_40`
      }
    } else if (playerStatsMode === "totals") {
      // Handle special cases for total columns
      switch (baseStat) {
        case "games_played":
        case "games_started":
        case "two_pointers_percentage":
        case "three_pointers_percentage":
        case "free_throws_percentage":
          return baseStat // These don't have total versions
        case "minutes_played":
          return "total_minutes"
        case "points_scored":
          return "total_points"
        case "two_pointers_made":
          return "total_two_pointers_made"
        case "two_pointers_attempted":
          return "total_two_pointers_attempted"
        case "three_pointers_made":
          return "total_three_pointers_made"
        case "three_pointers_attempted":
          return "total_three_pointers_attempted"
        case "free_throws_made":
          return "total_free_throws_made"
        case "free_throws_attempted":
          return "total_free_throws_attempted"
        case "offensive_rebounds":
          return "total_offensive_rebounds"
        case "defensive_rebounds":
          return "total_defensive_rebounds"
        case "total_rebounds":
          return "total_total_rebounds"
        case "assists":
          return "total_assists"
        case "steals":
          return "total_steals"
        case "turnovers":
          return "total_turnovers"
        case "blocks":
          return "total_blocks"
        case "blocks_against":
          return "total_blocks_against"
        case "fouls_commited":
          return "total_fouls_commited"
        case "fouls_drawn":
          return "total_fouls_drawn"
        case "pir":
          return "total_pir"
        default:
          return baseStat
      }
    }
    return baseStat // Default to averages (original column names)
  }

  // Fetch pre-calculated player stats for the team
  useEffect(() => {
    const loadTeamPlayerStats = async () => {
      if (selectedTeam && selectedSeason) {
        setIsTeamPlayerStatsLoading(true)
        try {
          const teamCode = getTeamCodeForSeason(selectedTeam, selectedSeason)

          if (teamCode) {
            // Convert phase selection to database phase format
            let dbPhase = "Regular Season"
            if (selectedGameLogPhase === "Regular") {
              dbPhase = "Regular Season"
            } else if (selectedGameLogPhase === "Playoffs") {
              dbPhase = "Playoffs"
            }

            // Fetch all player stats for this season/phase/league
            const allPlayerStats = await fetchPlayerStatsFromGameLogs(selectedSeason, dbPhase, league)

            // Filter to only players from the selected team
            const teamPlayersOnly = allPlayerStats.filter((player) => player.player_team_code === teamCode)

            console.log("Team player stats loaded:", teamPlayersOnly.length, "players")
            setTeamPlayerStats(teamPlayersOnly)
          } else {
            console.warn("No team code found for:", selectedTeam)
            setTeamPlayerStats([])
          }
        } catch (error) {
          console.error("Error fetching team player stats:", error)
          setTeamPlayerStats([])
        } finally {
          setIsTeamPlayerStatsLoading(false)
        }
      }
    }

    loadTeamPlayerStats()
  }, [selectedTeam, selectedSeason, selectedGameLogPhase, league])

  // Update the team color usage throughout the component
  const selectedTeamColor = (() => {
    const teamCode = getSelectedTeamCode()
    const teamColorStyles = getTeamColorStyles(selectedTeam, teamCode)
    return teamColorStyles.backgroundColor
  })()

  const getBackgroundColorClass = (rank, phase, total = allTeamsAdvancedStats.length || 18) => {
    // If the phase is 'Playoffs', set total teams to 10
    const effectiveTotal = phase === "Playoffs" ? 10 : total || 18

    if (!rank || rank <= 0) return "text-black-500"

    // Calculate the percentile based on rank (1 is best, total is worst)
    const percentile = 1 - (rank - 1) / Math.max(1, effectiveTotal - 1)

    // Green to gray to red color scale with mobile-responsive padding
    if (rank === 1) return "bg-green-600 text-black font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // Best - dark green
    if (rank === 2) return "bg-green-500 text-black font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // 2nd best
    if (rank === 3) return "bg-green-400 text-black font-medium rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // 3rd best
    if (percentile >= 0.75) return "bg-green-200 text-black font-medium rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // Top quartile
    if (percentile >= 0.6) return "bg-green-100 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // Above average
    if (percentile >= 0.4) return "bg-gray-200 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // Average
    if (percentile >= 0.25) return "bg-red-100 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // Below average
    if (rank === effectiveTotal - 2) return "bg-red-300 text-black font-medium rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // 3rd worst
    if (rank === effectiveTotal - 1) return "bg-red-400 text-white font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // 2nd worst
    if (rank === effectiveTotal) return "bg-red-500 text-white font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block" // Worst

    return "bg-red-200 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 w-full inline-block"
}

  return (
    <>
      {isAnyDataLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            {selectedTeam && teamStats.length > 0 && (
              <div className="mb-6">
                {(() => {
                  // First check if we have a direct logo URL from the database
                  const teamData = teamStats.find((team) => team.name === selectedTeam)

                  // Only render logo if we actually found the team data
                  if (!teamData) return null

                  if (teamData?.teamlogo) {
                    return (
                      <img
                        src={teamData.teamlogo || "/placeholder.svg"}
                        alt={`${selectedTeam} logo`}
                        className="w-16 h-16 mx-auto mb-3"
                      />
                    )
                  }

                  // Fallback to the mapping using teamcode
                  const teamCode = teamData?.teamcode
                  const currentTeamLogoMapping = team_logo_mapping
                  if (teamCode && currentTeamLogoMapping[teamCode]) {
                    return (
                      <img
                        src={currentTeamLogoMapping[teamCode] || "/placeholder.svg"}
                        alt={`${selectedTeam} logo`}
                        className="w-16 h-16 mx-auto mb-3"
                      />
                    )
                  }

                  // Final fallback to colored circle with initials
                  const initials = selectedTeam
                    .split(" ")
                    .map((word) => word[0])
                    .join("")

                  const euroleague_team_colors = {
                    BAR: "#1e3a8a",
                    EFE: "#ba000d",
                    FNB: "#004699",
                    MUN: "#ba000d",
                    OLY: "#bb0000",
                    Pan: "#00a1cb",
                    VIR: "#ed1c24",
                    ZAL: "#1e3a8a",
                    ASV: "#002d5e",
                    BOL: "#002d5e",
                    MTA: "#005eb8",
                    Mon: "#d90007",
                    PAR: "#002d5e",
                    VAL: "#ff6600",
                    ALB: "#002d5e",
                    EA7: "#e60026",
                    VIL: "#005eb8",
                  }

                  const bgColor =
                    teamCode && euroleague_team_colors[teamCode] ? euroleague_team_colors[teamCode] : "#4b5563"

                  return (
                    <div
                      className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: bgColor }}
                    >
                      {initials}
                    </div>
                  )
                })()}
                <h2 className="text-md font-semibold text-gray-800 mb-2">{selectedTeam}</h2>
              </div>
            )}
            <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 ">
          {/* Team header row - containing both team info and logos grid */}
          <div className="flex flex-col gap-4 w-full -mt-5">
            {/* Desktop: Team logos container */}
            <div className="hidden sm:flex flex-col w-full gap-0.5 ">
              {/* Position numbers row */}
              <div className="flex w-full gap-3.5">
                {/* Empty space for season display */}
                

                {availableTeams.map((teamName, index) => {
                  const teamData = teamStats.find((team) => team.name === teamName)
                  const position = teamData?.position || index + 1

                  return (
                    <div key={`pos-${teamName}`} className="flex-1 flex justify-center items-center">
                      <span className="text-xs font-medium text-black-400 w-5 h-5 flex items-center justify-center">
                        {position}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Team logos row */}
              <div className="flex w-full gap-3 overflow-x-auto">
                

                {availableTeams.map((teamName) => {
                  const teamCode = teamNameToCode[teamName]
                  const teamData = teamStats.find((team) => team.name === teamName)
                  const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""
                  const isSelected = teamName === selectedTeam
                  const actualTeamCode = teamData?.teamcode || teamCode
                  const teamColor = getTeamColorStyles(teamName, actualTeamCode).backgroundColor

                  return (
                    <button
                      key={teamName}
                      onClick={() => setSelectedTeam(teamName)}
                      className="flex-1"
                      title={teamName}
                    >
                      <div
                        className={`w-full aspect-square flex items-center justify-center rounded-lg
                    ${isSelected ? "shadow-md" : "hover:shadow-sm"}
                    transition-all p-1`}
                        style={{
                          backgroundColor: isSelected ? teamColor : "light-beige",
                          border: isSelected ? `1px solid black` : "1px solid #4b5563",
                        }}
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl || "/placeholder.svg"}
                            alt={`${teamName} logo`}
                            className={`max-w-full max-h-full object-contain transition-all duration-200 ${isSelected ? "" : "opacity-50"}`}
                          />
                        ) : (
                          <div
                            className={`w-full h-full rounded-sm flex items-center justify-center text-white font-bold text-xs ${isSelected ? "bg-gray-600" : "bg-gray-400 opacity-40"}`}
                          >
                            {teamName
                              .split(" ")
                              .map((word) => word[0])
                              .join("")}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Compact team header container with border around entire box - now clickable on mobile - MAKE THIS STICKY */}

            <div className="bg-black shadow-md rounded-xl relative mt-2 -mb-3">
              <button className="w-full text-left" onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}>
                <div
                  className="rounded-xl overflow-hidden shadow-xl w-full cursor-pointer hover:shadow-xl transition-shadow"
                  style={{
                    border: `1px solid black`,
                    backgroundColor: selectedTeamColor, // Applied selectedTeamColor as background
                  }}
                >
                  {/* Reduced vertical padding */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-1.5 gap-1.5 sm:gap-0">
                    {/* Team Logo and Name section */}
                    <div className="flex items-center w-full sm:w-[45%] flex-shrink-0 sm:border-r border-gray-200 sm:pr-2">
                      {/* Team Logo - smaller size with team color border */}
                      <div className="flex-shrink-0 mr-2">
                        {(() => {
                          const teamCode = teamNameToCode[selectedTeam]
                          const teamData = teamStats.find((team) => team.name === selectedTeam)
                          const selectedLogoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""
                          const teamColor = getTeamColorStyles(selectedTeam).backgroundColor

                          return selectedLogoUrl ? (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg shadow-sm">
                              <div
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-light-beige rounded-lg flex items-center justify-center p-0.5" /* Smaller padding */
                                style={{
                                  border: "1px solid black", // Black border
                                  backgroundColor: "white", // White background
                                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                                }}
                              >
                                <img
                                  src={selectedLogoUrl || "/placeholder.svg"}
                                  alt={`${selectedTeam} logo`}
                                  className="w-5 h-5 sm:w-7 sm:h-7 object-contain" /* Smaller image */
                                />
                              </div>
                            </div>
                          ) : (
                            <div
                              className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm" /* Smaller size and font */
                              style={{
                                backgroundColor: "white", // White background for fallback
                                color: teamColor, // Use team color for text for contrast
                                border: `1px solid black`, // Black border for fallback
                              }}
                            >
                              {selectedTeam
                                .split(" ")
                                .map((word) => word[0])
                                .join("")}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Team Name - in larger container */}
                      <div className="overflow-hidden flex-grow">
                        <h2
                          className="text-base sm:text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis text-white"
                          style={{
                            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // Black border effect for text
                          }}
                        >
                          {selectedTeam}
                        </h2>
                      </div>

                      {/* Dropdown arrow */}
                      <div className="ml-1">
                        <ChevronDown
                          className={`h-4 w-4 text-white transition-transform ${isTeamDropdownOpen ? "rotate-180" : ""}`} /* Smaller icon, color set to white */
                        />
                      </div>
                    </div>

                    {/* Stats in a responsive grid - Hide on mobile */}
                    <div className="hidden sm:flex sm:items-center w-full sm:w-[55%] text-xs sm:pl-2 gap-1.5 sm:gap-1.5 sm:justify-start">
                      {/* Position - Always show */}
                      <div className="flex items-center whitespace-nowrap">
                        <span
                          className="font-medium mr-1"
                          style={{
                            color: "white", // Ensure label text is white
                            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // Black border for text
                          }}
                        >
                          Pos:
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-lg font-bold border" /* Smaller padding */
                          style={{
                            backgroundColor: "white", // White background
                            color: "black", // Changed to black
                            borderColor: "black", // Black border for the circle/rectangle
                          }}
                        >
                          {teamStats.find((team) => team.name === selectedTeam)?.position || "-"}
                        </span>
                      </div>

                      {/* Record - Always show */}
                      <div className="flex items-center whitespace-nowrap ml-1.5">
                        <span
                          className="font-medium mr-1"
                          style={{
                            color: "white", // Ensure label text is white
                            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // Black border for text
                          }}
                        >
                          Rec:
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-lg font-bold font-mono border" /* Smaller padding */
                          style={{
                            backgroundColor: "white", // White background
                            color: "black", // Changed to black
                            borderColor: "black", // Black border for the rectangle
                          }}
                        >
                          {teamStats.find((team) => team.name === selectedTeam)?.w || 0}-
                          {teamStats.find((team) => team.name === selectedTeam)?.l || 0}
                        </span>
                      </div>

                      {/* Home Record - Hide on medium, show on large */}
                      <div className="hidden lg:flex items-center whitespace-nowrap ml-1.5">
                        <span
                          className="font-medium mr-1"
                          style={{
                            color: "white", // Ensure label text is white
                            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // Black border for text
                          }}
                        >
                          H:
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-lg font-bold font-mono border" /* Smaller padding */
                          style={{
                            backgroundColor: "white", // White background
                            color: "black", // Changed to black
                            borderColor: "black", // Black border for the rectangle
                          }}
                        >
                          {teamStats.find((team) => team.name === selectedTeam)?.home || "-"}
                        </span>
                      </div>

                      {/* Away Record - Hide on medium, show on xl */}
                      <div className="hidden xl:flex items-center whitespace-nowrap ml-1.5">
                        <span
                          className="font-medium mr-1"
                          style={{
                            color: "white", // Ensure label text is white
                            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // Black border for text
                          }}
                        >
                          A:
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-lg font-bold font-mono border" /* Smaller padding */
                          style={{
                            backgroundColor: "white", // White background
                            color: "black", // Changed to black
                            borderColor: "black", // Black border for the rectangle
                          }}
                        >
                          {teamStats.find((team) => team.name === selectedTeam)?.away || "-"}
                        </span>
                      </div>

                      {/* Streak - Hide on medium, show on xl */}
                      <div className="hidden xl:flex items-center whitespace-nowrap ml-1.5">
                        <span
                          className="font-medium mr-1"
                          style={{
                            color: "white", // Ensure label text is white
                            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000", // Black border for text
                          }}
                        >
                          Streak:
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-lg font-bold border ${
                            (teamStats.find((team) => team.name === selectedTeam)?.streak || "").startsWith("W")
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`} /* Smaller padding */
                          style={{
                            borderColor: "black", 
                          }}
                        >
                          {teamStats.find((team) => team.name === selectedTeam)?.streak || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div /> {/* Re-added this div */}
                </div>
              </button>

              {/* Team dropdown menu */}
              {isTeamDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {availableTeams.map((teamName) => {
                    const teamCode = teamNameToCode[teamName]
                    const teamData = teamStats.find((team) => team.name === teamName)
                    const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""
                    const isSelected = teamName === selectedTeam

                    return (
                      <button
                        key={teamName}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTeam(teamName)
                          setIsTeamDropdownOpen(false)
                        }}
                        className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                          isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                        }`} /* Reduced padding */
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl || "/placeholder.svg"}
                            alt={`${teamName} logo`}
                            className="w-5 h-5 mr-2 object-contain" /* Smaller image and margin */
                          />
                        ) : (
                          <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-xs mr-2">
                            {teamName
                              .split(" ")
                              .map((word) => word[0])
                              .join("")}
                          </div>
                        )}
                        <span className={`font-medium text-sm ${isSelected ? "text-gray-900" : "text-black-900"}`}>
                          {teamName}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Team Stats and Schedule */}
          <div className="flex flex-col lg:flex-row gap-6 min-h-0  ">
            {/* Left side - Team Stats */}
            <div className="lg:w-4/12 flex flex-col">
              <div className="bg-light-beige rounded-lg border-r border-l border-b border-gray-500 shadow-lg flex flex-col h-[550] md:h-[820px]">
                {/* Team color header strip */}
                <div
                  className="w-full h-2 border border-black rounded-t-lg -mb-1 "
                  style={{
                    backgroundColor: selectedTeamColor,
                  }}
                />
                <div className="p-3 pb-1 flex-1 flex flex-col">
                  <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2 sticky top-0 z-10 bg-light-beige">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const teamCode = getSelectedTeamCode()
                        const teamData = teamStats.find((team) => team.name === selectedTeam)
                        const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""

                        return logoUrl ? (
                          <img
                            src={logoUrl || "/placeholder.svg"}
                            alt={`${selectedTeam} logo`}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[8px]">
                            {selectedTeam
                              .split(" ")
                              .map((word) => word[0])
                              .join("")}
                          </div>
                        )
                      })()}
                      <h3 className="text-md font-semibold flex items-center">Team Report</h3>
                    </div>
                    <div className="flex items-center">
                      <select
                        value={selectedTeamReportPhase}
                        onChange={(e) => setSelectedTeamReportPhase(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-light-beige focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="RS">Regular Season</option>
                        <option value="Playoffs">Playoffs</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col h-full">
                    {/* Main Stats Section - Takes up 1/5 of available space */}
                    <div className="flex-.85 flex flex-col">
                      <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs border-collapse mb-1 table-fixed">
                          <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[27%]" />
                            <col className="w-[27%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <thead className="sticky top-0 z-10 bg-light-beige">
                            <tr className="border-b-2 border-gray-700  h-8">
                              <th className="text-center py-1.5 px-2 font-medium">Category</th>
                              <th className="text-center py-1.5 px-2 font-medium text-blue-700 border-l border-gray-300">
                                Offense
                              </th>
                              <th className="text-center py-1.5 px-2 font-medium text-red-700 border-l border-gray-300">
                                Defense
                              </th>
                              <th className="text-center py-1.5 px-2 font-medium border-l border-gray-300">Lg</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Net Rating (new row) */}
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase whitespace-nowrap">
                                NET RATING
                              </td>
                              <td colSpan={2} className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_net_rating, selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatStatValue(getNetRating())}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_net_rating}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.net_rating, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">EFFICIENCY</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_efficiency_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatStatValue(teamAdvancedStats?.efficiency_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_efficiency_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_efficiency_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatStatValue(teamAdvancedStats?.efficiency_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_efficiency_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.efficiency_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">PACE</td>
                              <td colSpan={2} className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_pace, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatStatValue(getAveragePace())}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_pace}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.pace, 1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Four Factors Section - Takes up 1/5 of available space */}
                    <div className="flex-1 flex flex-col">
                      <div className="py-2">
                        <div className="text-black font-medium uppercase text-center text-sm">FOUR FACTORS</div>
                        <div className="h-px w-full bg-slate-700 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <table className="w-full text-xs border-collapse table-fixed h-full">
                          <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[27%]" />
                            <col className="w-[27%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <tbody>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">eFG%</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_efgperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.efgperc_o)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_efgperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_efgperc_d,selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.efgperc_d)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_efgperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.efgperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">Turnover %</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_toratio_o, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.toratio_o)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_toratio_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_toratio_d, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.toratio_d)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_toratio_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.toratio_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">OFF. REB %</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_orebperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.orebperc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_orebperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_orebperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.orebperc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_orebperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.orebperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">FTA/FGA</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_ftrate_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.ftrate_o)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_ftrate_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_ftrate_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.ftrate_d)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_ftrate_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.ftrate_o, 1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Shooting Section - Takes up 1/5 of available space */}
                    <div className="flex-1 flex flex-col">
                      <div className="py-2">
                        <div className="text-black font-medium uppercase text-center text-sm">SHOOTING</div>
                        <div className="h-px w-full bg-slate-700 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <table className="w-full text-xs border-collapse table-fixed h-full">
                          <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[27%]" />
                            <col className="w-[27%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <tbody>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">3PT%</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_threeperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.threeperc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_threeperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_threeperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.threeperc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_threeperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.threeperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">2PT%</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_twoperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.twoperc_o)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_twoperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_twoperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.twoperc_d)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_twoperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.twoperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">FT%</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_ftperc_o, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.ftperc_o)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_ftperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_ftperc_d, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">{formatRateValue(teamAdvancedStats?.ftperc_d)}</span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_ftperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.ftperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">3PA RATE</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_threeattmprate_o, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.threeattmprate_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_threeattmprate_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_threeattmprate_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.threeattmprate_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_threeattmprate_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.threeattmprate_o, 1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Point Distribution Section - Takes up 1/5 of available space */}
                    <div className="flex-.75 flex flex-col sm:block hidden">
                      <div className="py-2">
                        <div className="text-black font-medium uppercase text-center text-sm">POINT DISTRIBUTION</div>
                        <div className="h-px w-full bg-slate-700 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <table className="w-full text-xs border-collapse table-fixed h-full">
                          <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[27%]" />
                            <col className="w-[27%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <tbody>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase whitespace-nowrap">
                                2PT PTS
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_points2perc_o, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.points2perc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_points2perc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_points2perc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.points2perc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_points2perc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.points2perc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase whitespace-nowrap">
                                3PT PTS
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_points3perc_o, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.points3perc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_points3perc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_points3perc_d, selectedTeamReportPhase,teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.points3perc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_points3perc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.points3perc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase whitespace-nowrap">
                                FT PTS
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_pointsftperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.pointsftperc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_pointsftperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_pointsftperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.pointsftperc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_pointsftperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.pointsftperc_o, 1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Miscellaneous Section - Takes up 1/5 of available space */}
                    <div className="flex-.75 flex flex-col">
                      <div className="py-2">
                        <div className="text-black font-medium uppercase text-center text-sm">MISCELLANEOUS</div>
                        <div className="h-px w-full bg-slate-700 mt-1"></div>
                      </div>
                      <div className="flex-1">
                        <table className="w-full text-xs border-collapse table-fixed h-full">
                          <colgroup>
                            <col className="w-[30%]" />
                            <col className="w-[27%]" />
                            <col className="w-[27%]" />
                            <col className="w-[16%]" />
                          </colgroup>
                          <tbody>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">ASSIST %</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_assistperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.assistperc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_assistperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_assistperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.assistperc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_assistperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.assistperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px]">
                              <td className="text-center px-2 text-black font-medium uppercase">STEAL %</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_stealperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.stealperc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_stealperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_stealperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.stealperc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_stealperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.stealperc_o, 1)}
                              </td>
                            </tr>
                            <tr className="border-b-2 border-gray-300 text-[10px] md:text-[11px] ">
                              <td className="text-center px-2 text-black font-medium uppercase">BLOCK %</td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_blockperc_o,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.blockperc_o)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_blockperc_o}</span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center border-l border-gray-300 font-mono">
                                <div
                                  className={`${getBackgroundColorClass(teamAdvancedStats?.rank_blockperc_d,selectedTeamReportPhase, teamStats.length)} border border-gray-400 px-2 whitespace-nowrap`}
                                >
                                  <span className="font-semibold">
                                    {formatRateValue(teamAdvancedStats?.blockperc_d)}
                                  </span>{" "}
                                  <span className="opacity-75">{teamAdvancedStats?.rank_blockperc_d}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 text-center border-l border-gray-300 font-mono">
                                {formatStatValue(leagueAverages?.blockperc_o, 1)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Right side - Schedule */}
            <div className="lg:w-8/12 flex flex-col">
              <div className="bg-light-beige rounded-lg border-r border-l border-b border-gray-500 shadow-lg flex flex-col lg:h-[820px]">
                {/* Team color header strip */}
                <div
                  className="w-full h-2 border border-black rounded-t-lg -mb-1"
                  style={{
                    backgroundColor: selectedTeamColor,
                  }}
                />
                <div className="p-3 flex flex-col flex-1 min-h-0">
                  <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2 sticky top-0 z-10 bg-light-beige">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const teamCode = getSelectedTeamCode()
                        const teamData = teamStats.find((team) => team.name === selectedTeam)
                        const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""

                        return logoUrl ? (
                          <img
                            src={logoUrl || "/placeholder.svg"}
                            alt={`${selectedTeam} logo`}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[8px]">
                            {selectedTeam
                              .split(" ")
                              .map((word) => word[0])
                              .join("")}
                          </div>
                        )
                      })()}
                      <h3 className="text-sm md:text-md font-semibold flex items-center">Schedule & Results</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedScheduleFilter}
                        onChange={(e) => setSelectedScheduleFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-light-beige focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="regular">Regular Season</option>
                        <option value="playoffs">Playoffs</option>
                      </select>
                      <div className="hidden sm:block text-sm text-gray-600 font-medium">
                        {(() => {
                          const filteredGames = getFilteredScheduleData()
                          return filteredGames.length > 0 ? `${filteredGames.length} games` : "No games"
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    {isScheduleLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="text-black-500">Loading schedule...</div>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0">
                        <table className="w-full text-xs border-collapse table-fixed">
                          <colgroup>
                            {/* Mobile-first responsive column widths */}
                            <col className="w-[12%] md:w-[8%]" />
                            <col className="w-[20%] md:w-[12%]" />
                            <col className="w-[18%] md:w-[40%]" />
                            <col className="w-[18%] md:w-[13%]" />
                            <col className="w-[17%] md:w-[13%]" />
                            <col className="w-[15%] md:w-[14%]" />
                          </colgroup>
                          <thead className="sticky top-0 z-10 bg-light-beige">
                            <tr className="border-b-2 border-gray-700 h-8">
                              <th className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-200 text-[10px] md:text-xs">
                                <span className="hidden sm:inline">Round</span>
                                <span className="sm:hidden">R</span>
                              </th>
                              <th className="text-center py-0.5 px-1 font-medium border-r border-gray-200 text-[10px] md:text-xs">
                                Date
                              </th>
                              <th className="text-center py-0.5 px-1 font-medium border-r border-gray-200 text-[10px] md:text-xs">
                                <span className="hidden sm:inline">Opponent</span>
                                <span className="sm:hidden">Opp</span>
                              </th>
                              <th className="text-center py-0.5 px-1 font-medium border-r border-gray-200 text-[10px] md:text-xs">
                                Result
                              </th>
                              <th className="text-center py-0.5 px-1 font-medium border-r border-gray-200 text-[10px] md:text-xs">
                                <span className="hidden sm:inline">Location</span>
                                <span className="sm:hidden">Loc</span>
                              </th>
                              <th className="text-center py-0.5 px-1 font-medium border-r border-gray-200 text-[10px] md:text-xs">
                                Record
                              </th>
                            </tr>
                          </thead>
                          <tbody>{renderFilteredScheduleWithPhaseHeaders()}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-col lg:flex-row lg:gap-1">
  {/* The main container for the side-by-side layout on larger screens. */}
  <div className="w-full">
    <div className="bg-light-beige rounded-lg border border-black hidden md:block">
      <div
        className="w-full h-2 rounded-t-md border-b border-black -mb-1"
        style={{
          backgroundColor: selectedTeamColor,
        }}
      />
      
      {/* Header Container */}
      <div className="p-3 flex justify-between items-center border-b border-gray-300">
        <div className="flex items-center gap-2">
          {(() => {
            const teamCode = getSelectedTeamCode()
            const teamData = teamStats.find((team) => team.name === selectedTeam)
            const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""
            return logoUrl ? (
              <img
                src={logoUrl || "/placeholder.svg"}
                alt={`${selectedTeam} logo`}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[8px]">
                {selectedTeam.split(" ").map((word) => word[0]).join("")}
              </div>
            )
          })()}
          <h3 className="text-md font-semibold">Shooting Profile</h3>
        </div>
        <div className="text-sm text-gray-400 font-semibold px-4 py-1">
          {teamShotData.length > 0 ? `${teamShotData.length} shots` : "No shot data"}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 flex items-start">
        <div className="w-full lg:w-3/5">
          <div className="rounded-lg overflow-hidden">
            {isTeamShotDataLoading ? (
              <div className="flex justify-center items-center h-[428px]">
                <div className="text-gray-500">Loading shot chart...</div>
              </div>
            ) : teamShotData.length > 0 ? (
              <div className="w-full h-[425px]">
                <BasketballShotChart
                  shotData={teamShotData}
                  leagueAveragesData={leagueAveragesData}
                  playerId={getSelectedTeamCode()}
                  season={selectedSeason.toString()}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-[425px]">
                <div className="text-gray-500">
                  No shot data available for {selectedTeam} in {selectedSeason}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full lg:w-2/5 p-3 ">
          <div className="w-full">
            <ShootingProfileTable
              teamShotData={teamShotData}
              leagueAveragesData={leagueAveragesData}
              teamName={selectedTeam}
              isLoading={isTeamShotDataLoading}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div className="w-full md:hidden">
    <div className="bg-light-beige rounded-lg border-r border-l border-b border-gray-700 shadow-lg">
      <div
                  className="w-full h-2 border border-black rounded-t-lg -mb-1 "
                  style={{
                    backgroundColor: selectedTeamColor,
                  }}
                />
      <div className="p-3">
        <div className="flex justify-between items-center pb-2 sticky top-0 z-10 bg-light-beige">
          <div className="flex items-center gap-2">
            {(() => {
              const teamCode = getSelectedTeamCode()
              const teamData = teamStats.find((team) => team.name === selectedTeam)
              const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""
              return logoUrl ? (
                <img
                  src={logoUrl || "/placeholder.svg"}
                  alt={`${selectedTeam} logo`}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[8px]">
                  {selectedTeam.split(" ").map((word) => word[0]).join("")}
                </div>
              )
            })()}
            <h3 className="text-md font-semibold">Shooting Profile</h3>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {teamShotData.length > 0 ? `${teamShotData.length} shots` : "No shot data"}
          </div>
        </div>
        
        <div className="rounded-lg overflow-hidden">
          {isTeamShotDataLoading ? (
            <div className="flex justify-center items-center h-[215px]">
              <div className="text-gray-500">Loading shot chart...</div>
            </div>
          ) : teamShotData.length > 0 ? (
            <div className="w-full h-[215px]">
              <BasketballShotChart
                shotData={teamShotData}
                leagueAveragesData={leagueAveragesData}
                playerId={getSelectedTeamCode()}
                season={selectedSeason.toString()}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-[212.5px]">
              <div className="text-gray-500">
                No shot data available for {selectedTeam} in {selectedSeason}
              </div>
            </div>
          )}
        </div>

        <div className="">
          <ShootingProfileTable
            teamShotData={teamShotData}
            leagueAveragesData={leagueAveragesData}
            teamName={selectedTeam}
            isLoading={isTeamShotDataLoading}
          />
        </div>
      </div>
    </div>
  </div>
</div>

          {/* Player Stats Section */}
          <div className="mt-1">
            <div className="bg-light-beige rounded-lg border-r border-l border-b border-gray-500 shadow-lg">
              {/* Team color header strip */}
                <div
                  className="w-full h-2 border border-black rounded-t-lg -mb-1 "
                  style={{
                    backgroundColor: selectedTeamColor,
                  }}
                />
              <div className="p-3">
                <div className="flex justify-between items-center  pb-2 sticky top-0 z-10 bg-light-beige">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const teamCode = getSelectedTeamCode()
                      const teamData = teamStats.find((team) => team.name === selectedTeam)
                      const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""

                      return logoUrl ? (
                        <img
                          src={logoUrl || "/placeholder.svg"}
                          alt={`${selectedTeam} logo`}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[8px]">
                          {selectedTeam
                            .split(" ")
                            .map((word) => word[0])
                            .join("")}
                        </div>
                      )
                    })()}
                    <h3 className="text-md font-semibold ">
  <span className="hidden md:inline">Player Statistics</span>
  <span className="inline md:hidden">Players</span>
</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Phase selector for game logs */}
                    <select
                      value={selectedGameLogPhase}
                      onChange={(e) => setSelectedGameLogPhase(e.target.value)}
                      className="px-3 py-1 text-xs md:text-md border border-gray-300 rounded-md bg-light-beige focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    >
                      <option value="Regular">Regular Season</option>
                      <option value="Playoffs">Playoffs</option>
                    </select>

                    {/* Stats mode selector */}
                    <select
                      value={playerStatsMode}
                      onChange={(e) => setPlayerStatsMode(e.target.value)}
                      className="px-3 py-1 text-xs md:text-md border border-gray-300 rounded-md bg-light-beige focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    >
                      <option value="per_game">Per Game</option>
                      <option value="totals">Totals</option>
                      <option value="per_40">Per 40</option>
                    </select>
                  </div>
                </div>

                {/* Player stats table */}
                <div className="overflow-x-auto relative border border-gray-200 border-t-2 border-t-gray-700">
                  <table className="min-w-full text-[9px] md:text-[11px] border-collapse md:min-w-[1400px]">
                    {/* Table header - remove team column */}
                    <thead className="sticky top-0 z-50 bg-gray-50 shadow-md">
                      <tr className="bg-gray-50 h-6 border-b-2 border-gray-700">
                        <th
                          className={`bg-gray-50 text-left py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300 md:min-w-[160px] shadow-lg border-b-2 border-gray-700 sticky left-0 z-20`}
                          onClick={() => handlePlayerColumnSort("player_name")}
                        >
                          <div className="flex items-center text-[9px] md:text-[11px]">
                            Player {renderSortIndicator("player_name")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("games_played")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            GP {renderSortIndicator("games_played")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("games_started")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            GS {renderSortIndicator("games_started")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("minutes_played")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            MIN {renderSortIndicator("minutes_played")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("points_scored")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            PTS {renderSortIndicator("points_scored")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("two_pointers_made")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            2PM {renderSortIndicator("two_pointers_made")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("two_pointers_attempted")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            2PA {renderSortIndicator("two_pointers_attempted")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("two_pointers_percentage")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            2P% {renderSortIndicator("two_pointers_percentage")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("three_pointers_made")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            3PM {renderSortIndicator("three_pointers_made")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("three_pointers_attempted")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            3PA {renderSortIndicator("three_pointers_attempted")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("three_pointers_percentage")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            3P% {renderSortIndicator("three_pointers_percentage")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("free_throws_made")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            FTM {renderSortIndicator("free_throws_made")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("free_throws_attempted")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            FTA {renderSortIndicator("free_throws_attempted")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("free_throws_percentage")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            FT% {renderSortIndicator("free_throws_percentage")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("offensive_rebounds")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            OR {renderSortIndicator("offensive_rebounds")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("defensive_rebounds")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            DR {renderSortIndicator("defensive_rebounds")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("total_rebounds")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            TR {renderSortIndicator("total_rebounds")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("assists")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            AST {renderSortIndicator("assists")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("steals")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            STL {renderSortIndicator("steals")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("turnovers")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            TO {renderSortIndicator("turnovers")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("blocks")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            BLK {renderSortIndicator("blocks")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("blocks_against")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            BLKA {renderSortIndicator("blocks_against")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("fouls_commited")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            FC {renderSortIndicator("fouls_commited")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                          onClick={() => handlePlayerColumnSort("fouls_drawn")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            FD {renderSortIndicator("fouls_drawn")}
                          </div>
                        </th>
                        <th
                          className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handlePlayerColumnSort("pir")}
                        >
                          <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                            PIR {renderSortIndicator("pir")}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Individual player rows */}
                      {(() => {
                        // Use pre-calculated player stats instead of calculating from game logs
                        const teamPlayerStatsFiltered = teamPlayerStats.filter(
                          (player) => player.player_name !== "Total" && player.player_name !== "TOTAL",
                        )

                        const teamStatValues = {
                          games_played: teamPlayerStatsFiltered.map((p) => p[getColumnName("games_played")] || 0),
                          games_started: teamPlayerStatsFiltered.map((p) => p[getColumnName("games_started")] || 0),
                          minutes_played: teamPlayerStatsFiltered.map((p) => p[getColumnName("minutes_played")] || 0),
                          points_scored: teamPlayerStatsFiltered.map((p) => p[getColumnName("points_scored")] || 0),
                          two_pointers_made: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("two_pointers_made")] || 0,
                          ),
                          two_pointers_attempted: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("two_pointers_attempted")] || 0,
                          ),
                          two_pointers_percentage: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("two_pointers_percentage")] || 0,
                          ),
                          three_pointers_made: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("three_pointers_made")] || 0,
                          ),
                          three_pointers_attempted: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("three_pointers_attempted")] || 0,
                          ),
                          three_pointers_percentage: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("three_pointers_percentage")] || 0,
                          ),
                          free_throws_made: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("free_throws_made")] || 0,
                          ),
                          free_throws_attempted: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("free_throws_attempted")] || 0,
                          ),
                          free_throws_percentage: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("free_throws_percentage")] || 0,
                          ),
                          offensive_rebounds: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("offensive_rebounds")] || 0,
                          ),
                          defensive_rebounds: teamPlayerStatsFiltered.map(
                            (p) => p[getColumnName("defensive_rebounds")] || 0,
                          ),
                          total_rebounds: teamPlayerStatsFiltered.map((p) => p[getColumnName("total_rebounds")] || 0),
                          assists: teamPlayerStatsFiltered.map((p) => p[getColumnName("assists")] || 0),
                          steals: teamPlayerStatsFiltered.map((p) => p[getColumnName("steals")] || 0),
                          turnovers: teamPlayerStatsFiltered.map((p) => p[getColumnName("turnovers")] || 0),
                          blocks: teamPlayerStatsFiltered.map((p) => p[getColumnName("blocks")] || 0),
                          blocks_against: teamPlayerStatsFiltered.map((p) => p[getColumnName("blocks_against")] || 0),
                          fouls_commited: teamPlayerStatsFiltered.map((p) => p[getColumnName("fouls_commited")] || 0),
                          fouls_drawn: teamPlayerStatsFiltered.map((p) => p[getColumnName("fouls_drawn")] || 0),
                          pir: teamPlayerStatsFiltered.map((p) => p[getColumnName("pir")] || 0),
                        }

                        return teamPlayerStatsFiltered
                          .sort((a, b) => {
                            const column = getColumnName(playerSortColumnLocal)
                            const direction = playerSortDirectionLocal

                            if (direction === "asc") {
                              return (a[column] || 0) - (b[column] || 0)
                            } else {
                              return (b[column] || 0) - (a[column] || 0)
                            }
                          })
                          .map((player, index) => {
                            // Helper function to safely format numeric values
                            const formatStat = (value: any, decimals = 1) => {
                              const numValue =
                                typeof value === "string"
                                  ? Number.parseFloat(value)
                                  : typeof value === "number"
                                    ? value
                                    : 0
                              if (isNaN(numValue)) return "0.0"

                              // For totals mode, show whole numbers for most stats except percentages
                              if (playerStatsMode === "totals" && decimals === 1) {
                                return Math.round(numValue).toString()
                              }

                              return numValue.toFixed(decimals)
                            }

                            return (
                              <tr
                                key={`${player.player_id || player.player_name}-${player.player_team_code}-${index}`}
                                className="h-5 border-b border-gray-200 hover:bg-blue-50 hover:shadow-sm transition-all duration-150 group"
                              >
                                <td className="text-left py-0.5 px-1 font-medium border-r border-gray-300 min-w-[160px] sticky left-0 bg-light-beige z-10 group-hover:bg-blue-50 transition-colors duration-150 shadow-sm">
                                  <div className="flex items-center">
                                    {player.teamlogo ? (
                                      <img
                                        src={player.teamlogo || "/placeholder.svg"}
                                        alt={`${selectedTeam} logo`}
                                        className="w-4 h-4 mr-1 object-contain"
                                      />
                                    ) : (
                                      <div className="w-4 h-4 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[9px] mr-1">
                                        {selectedTeam
                                          .split(" ")
                                          .map((word) => word[0])
                                          .join("")}
                                      </div>
                                    )}
                                    <span className="text-[9px] md:text-[11px]">{player.player_name}</span>
                                  </div>
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("games_played")] || 0,
                                    teamStatValues.games_played,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("games_played")], 0)}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("games_started")] || 0,
                                    teamStatValues.games_started,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("games_started")], 0)}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("minutes_played")] || 0,
                                    teamStatValues.minutes_played,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("minutes_played")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("points_scored")] || 0,
                                    teamStatValues.points_scored,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("points_scored")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("two_pointers_made")] || 0,
                                    teamStatValues.two_pointers_made,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("two_pointers_made")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("two_pointers_attempted")] || 0,
                                    teamStatValues.two_pointers_attempted,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("two_pointers_attempted")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("two_pointers_percentage")] || 0,
                                    teamStatValues.two_pointers_percentage,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("two_pointers_percentage")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("three_pointers_made")] || 0,
                                    teamStatValues.three_pointers_made,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("three_pointers_made")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("three_pointers_attempted")] || 0,
                                    teamStatValues.three_pointers_attempted,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("three_pointers_attempted")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("three_pointers_percentage")] || 0,
                                    teamStatValues.three_pointers_percentage,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("three_pointers_percentage")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("free_throws_made")] || 0,
                                    teamStatValues.free_throws_made,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("free_throws_made")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("free_throws_attempted")] || 0,
                                    teamStatValues.free_throws_attempted,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("free_throws_attempted")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("free_throws_percentage")] || 0,
                                    teamStatValues.free_throws_percentage,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("free_throws_percentage")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("offensive_rebounds")] || 0,
                                    teamStatValues.offensive_rebounds,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("offensive_rebounds")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("defensive_rebounds")] || 0,
                                    teamStatValues.defensive_rebounds,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("defensive_rebounds")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("total_rebounds")] || 0,
                                    teamStatValues.total_rebounds,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("total_rebounds")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("assists")] || 0,
                                    teamStatValues.assists,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("assists")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("steals")] || 0,
                                    teamStatValues.steals,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("steals")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("turnovers")] || 0,
                                    teamStatValues.turnovers,
                                    false,
                                  )}
                                >
                                  {formatStat(player[getColumnName("turnovers")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("blocks")] || 0,
                                    teamStatValues.blocks,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("blocks")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("blocks_against")] || 0,
                                    teamStatValues.blocks_against,
                                    false,
                                  )}
                                >
                                  {formatStat(player[getColumnName("blocks_against")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("fouls_commited")] || 0,
                                    teamStatValues.fouls_commited,
                                    false,
                                  )}
                                >
                                  {formatStat(player[getColumnName("fouls_commited")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium border-r border-gray-300"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("fouls_drawn")] || 0,
                                    teamStatValues.fouls_drawn,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("fouls_drawn")])}
                                </td>
                                <td
                                  className="text-center py-0.5 px-0.5 md: py-1 px-1 font-medium"
                                  style={getSubtleConditionalStyle(
                                    player[getColumnName("pir")] || 0,
                                    teamStatValues.pir,
                                    true,
                                  )}
                                >
                                  {formatStat(player[getColumnName("pir")])}
                                </td>
                              </tr>
                            )
                          })
                      })()}

                      {/* Team Total row with thick separator - use existing Total player */}
                      {(() => {
                        // Find the existing "Total" player in the data
                        const totalPlayer = teamPlayerStats.find(
                          (player) => player.player_name === "Total" || player.player_name === "TOTAL",
                        )

                        if (!totalPlayer) return null

                        // Helper function to safely format numeric values
                        const formatStat = (value: any, decimals = 1) => {
                          const numValue =
                            typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : 0
                          if (isNaN(numValue)) return "0.0"
                          return numValue.toFixed()
                        }

                        // Get team logo
                        const teamCode = getSelectedTeamCode()
                        const teamData = teamStats.find((team) => team.name === selectedTeam)
                        const logoUrl = teamData?.teamlogo || team_logo_mapping[teamCode] || ""

                        return (
                          <tr className="h-5 border-t-4 border-gray-800 bg-gray-50 font-bold hover:bg-gray-100 transition-all duration-150">
                            <td className="text-left py-0.5 px-1 font-bold border-r border-gray-300 min-w-[160px] sticky left-0 bg-gray-50 z-10 hover:bg-gray-100 transition-colors duration-150 shadow-sm">
                              <div className="flex items-center">
                                {logoUrl ? (
                                  <img
                                    src={logoUrl || "/placeholder.svg"}
                                    alt={`${selectedTeam} logo`}
                                    className="w-3 h-3 mr-1 object-contain"
                                  />
                                ) : (
                                  <div className="w-3 h-3 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[8px] mr-1">
                                    {selectedTeam
                                      .split(" ")
                                      .map((word) => word[0])
                                      .join("")}
                                  </div>
                                )}
                                <span className="text-[8px] md:text-[10px]">TOTAL</span>
                              </div>
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.games_played, 0)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.games_started, 0)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.minutes_played)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.points_scored)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.two_pointers_made)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.two_pointers_attempted)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.two_pointers_percentage)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.three_pointers_made)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.three_pointers_attempted)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.three_pointers_percentage)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.free_throws_made)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.free_throws_attempted)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.free_throws_percentage)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.offensive_rebounds)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.defensive_rebounds)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.total_rebounds)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.assists)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.steals)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.turnovers)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.blocks)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.blocks_against)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.fouls_commited)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold border-r border-gray-300">
                              {formatStat(totalPlayer.fouls_drawn)}
                            </td>
                            <td className="text-center py-0.5 px-1 font-bold">{formatStat(totalPlayer.pir)}</td>
                          </tr>
                        )
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
