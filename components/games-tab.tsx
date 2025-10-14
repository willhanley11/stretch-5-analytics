"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchGameLogsByGamecode, fetchStandingsFromGameLogs } from "@/app/actions/standings"
import { euroleague_team_colors } from "./yamagata-team-stats"
import { LeagueLoadingScreen } from "./ui/league-spinner"

interface GamesTabProps {
  selectedSeason: number
  selectedLeague: string
}

interface GameMatchup {
  round: number
  game_date: string
  game_time?: string
  home_team: string
  home_teamcode: string
  home_teamlogo: string
  away_team: string
  away_teamcode: string
  away_teamlogo: string
  home_score?: number | null
  away_score?: number | null
  is_played: boolean
  gamecode?: string
  time?: string
}

interface EuroleagueGameLog {
  player_id: number
  player: string
  team: string
  minutes: string
  points: number
  field_goals_made_2?: number // Adjusted from field_goals_made for 2-pointers
  field_goals_attempted_2?: number // Adjusted from field_goals_attempted for 2-pointers
  field_goals_made_3?: number // Added for 3-pointers
  field_goals_attempted_3?: number // Added for 3-pointers
  free_throws_made: number
  free_throws_attempted: number
  offensive_rebounds: number
  defensive_rebounds: number
  total_rebounds: number
  assists: number
  steals: number
  turnovers: number
  blocks_favour: number // Renamed from blocks
  blocks_against: number
  fouls_commited: number
  fouls_drawn: number
  valuation: number // Renamed from pir
  phase: string
  is_starter: boolean
  assistances?: number // Renamed from assists for consistency with new API data
}

export default function GamesTab({ selectedSeason, selectedLeague }: GamesTabProps) {
  const [games, setGames] = useState<GameMatchup[]>([])
  const [selectedRound, setSelectedRound] = useState<number>(1)
  const [availableRounds, setAvailableRounds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRoundDropdownOpen, setIsRoundDropdownOpen] = useState(false)

  // Game log expansion state
  const [expandedGameForLogs, setExpandedGameForLogs] = useState<GameMatchup | null>(null)
  const [expandedGameLogsData, setExpandedGameLogsData] = useState<EuroleagueGameLog[]>([])
  const [isExpandedGameLogsLoading, setIsExpandedGameLogsLoading] = useState(false)
  const [selectedGameTeam, setSelectedGameTeam] = useState<string>("")

  // Game preview expansion state
  const [expandedGameForPreview, setExpandedGameForPreview] = useState<GameMatchup | null>(null)
  const [homeTeamStats, setHomeTeamStats] = useState<any>(null)
  const [awayTeamStats, setAwayTeamStats] = useState<any>(null)
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<any[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<any[]>([])
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [teamStandings, setTeamStandings] = useState<any[]>([])

  // Get league name for API calls
  const league = selectedLeague === "international-euroleague" ? "euroleague" : "eurocup"

  // Fetch games data
  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/games?season=${selectedSeason}&league=${league}`)
        const data = await response.json()

        if (data && data.length > 0) {
          setGames(data)

          // Get unique rounds and sort them
          const rounds = [...new Set(data.map((game: GameMatchup) => game.round))].sort((a, b) => a - b)
          setAvailableRounds(rounds)

          // Set initial round based on current season vs completed seasons
          if (selectedSeason === 2025) {
            // For current season (2025), find the first round with unplayed games
            // This will be the "next" round to be played
            const nextRound = rounds.find((round) => {
              const roundGames = data.filter((game: GameMatchup) => game.round === round)
              return roundGames.some((game: GameMatchup) => !game.is_played)
            })

            // If we find a round with unplayed games, use it. Otherwise default to round 3 as mentioned
            setSelectedRound(nextRound || 3)
          } else {
            // For completed seasons, start at round 1
            setSelectedRound(rounds[0] || 1)
          }
        } else {
          // If no games found, set empty state
          setGames([])
          setAvailableRounds([])
          setSelectedRound(1)
        }
      } catch (error) {
        console.error("Error fetching games:", error)
        setGames([])
        setAvailableRounds([])
        setSelectedRound(1)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [selectedSeason, league])

  // Fetch team standings data
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const standings = await fetchStandingsFromGameLogs(selectedSeason, "RS", league)
        setTeamStandings(standings || [])
      } catch (error) {
        console.error("Error fetching standings:", error)
        setTeamStandings([])
      }
    }

    fetchStandings()
  }, [selectedSeason, league])

  // Helper function to get team record
  const getTeamRecord = (teamCode: string) => {
    const team = teamStandings.find(t => t.teamcode === teamCode)
    if (team && team.w !== undefined && team.l !== undefined) {
      return `${team.w}-${team.l}`
    }
    return null
  }

  // Filter games by selected round
  const roundGames = games.filter((game) => game.round === selectedRound)

  const sortedRoundGames = [...roundGames].sort((a, b) => {
    // Create full datetime for each game
    const getGameDateTime = (game: GameMatchup) => {
      const gameDateStr = game.game_date.split("T")[0] // Get YYYY-MM-DD
      const timeStr = game.time || game.game_time || "00:00:00"
      
      if (timeStr && timeStr !== "00:00:00") {
        const [hours, minutes] = timeStr.split(":")
        // Create ISO string in UTC to avoid timezone issues
        const isoString = `${gameDateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`
        return new Date(isoString).getTime()
      } else {
        // For games without time, use just the date
        return new Date(`${gameDateStr}T00:00:00.000Z`).getTime()
      }
    }

    return getGameDateTime(a) - getGameDateTime(b)
  })

  const handleRoundChange = (round: number) => {
    setSelectedRound(round)
    setIsRoundDropdownOpen(false)
    // Close any open dropdowns when round changes
    setExpandedGameForLogs(null)
    setExpandedGameForPreview(null)
    setExpandedGameLogsData([])
    setSelectedGameTeam("")
  }

  const handlePreviousRound = () => {
    const currentIndex = availableRounds.indexOf(selectedRound)
    if (currentIndex > 0) {
      setSelectedRound(availableRounds[currentIndex - 1])
      // Close any open dropdowns when round changes
      setExpandedGameForLogs(null)
      setExpandedGameForPreview(null)
      setExpandedGameLogsData([])
      setSelectedGameTeam("")
    }
  }

  const handleNextRound = () => {
    const currentIndex = availableRounds.indexOf(selectedRound)
    if (currentIndex < availableRounds.length - 1) {
      setSelectedRound(availableRounds[currentIndex + 1])
      // Close any open dropdowns when round changes
      setExpandedGameForLogs(null)
      setExpandedGameForPreview(null)
      setExpandedGameLogsData([])
      setSelectedGameTeam("")
    }
  }

  // Game log expansion handlers
  const handleGameRowClick = async (game: GameMatchup) => {
    // Only allow expansion for played games with gamecode
    if (!game.is_played || !game.gamecode) return

    // If clicking the same game, collapse it
    if (expandedGameForLogs?.gamecode === game.gamecode) {
      setExpandedGameForLogs(null)
      setExpandedGameLogsData([])
      setSelectedGameTeam("")
      return
    }

    // Close any open preview dropdown
    setExpandedGameForPreview(null)
    setHomeTeamStats(null)
    setAwayTeamStats(null)
    setHomeTeamPlayers([])
    setAwayTeamPlayers([])

    // Expand new game
    setExpandedGameForLogs(game)
    setIsExpandedGameLogsLoading(true)
    setSelectedGameTeam(game.home_teamcode) // Default to home team

    try {
      const logs = await fetchGameLogsByGamecode(selectedSeason, game.gamecode, league)
      setExpandedGameLogsData(logs)

      // Set default team to the home team's code
      setSelectedGameTeam(game.home_teamcode)
    } catch (error) {
      console.error("Error fetching game logs:", error)
      setExpandedGameLogsData([])
    } finally {
      setIsExpandedGameLogsLoading(false)
    }
  }

  const handleGameTeamChange = (teamCode: string) => {
    setSelectedGameTeam(teamCode)
  }

  // Game preview expansion handlers
  const handleGamePreviewClick = async (game: GameMatchup) => {
    // If clicking the same game, collapse it
    if (
      expandedGameForPreview?.home_teamcode === game.home_teamcode &&
      expandedGameForPreview?.away_teamcode === game.away_teamcode &&
      expandedGameForPreview?.round === game.round
    ) {
      setExpandedGameForPreview(null)
      setHomeTeamStats(null)
      setAwayTeamStats(null)
      setHomeTeamPlayers([])
      setAwayTeamPlayers([])
      return
    }

    // Close any open logs dropdown
    setExpandedGameForLogs(null)
    setExpandedGameLogsData([])
    setSelectedGameTeam("")

    // Expand new game
    setExpandedGameForPreview(game)
    setIsPreviewLoading(true)
    setHomeTeamStats(null)
    setAwayTeamStats(null)
    setHomeTeamPlayers([])
    setAwayTeamPlayers([])

    try {
      // Fetch advanced stats and player stats for both teams
      const [homeStatsResponse, awayStatsResponse, homePlayersResponse, awayPlayersResponse] = await Promise.all([
        fetch(
          `/api/team-advanced-stats?teamCode=${game.home_teamcode}&season=${selectedSeason}&phase=RS&league=${league}`,
        ),
        fetch(
          `/api/team-advanced-stats?teamCode=${game.away_teamcode}&season=${selectedSeason}&phase=RS&league=${league}`,
        ),
        fetch(`/api/team-players?teamCode=${game.home_teamcode}&season=${selectedSeason}&phase=RS&league=${league}`),
        fetch(`/api/team-players?teamCode=${game.away_teamcode}&season=${selectedSeason}&phase=RS&league=${league}`),
      ])

      const homeStats = await homeStatsResponse.json()
      const awayStats = await awayStatsResponse.json()
      const homePlayers = await homePlayersResponse.json()
      const awayPlayers = await awayPlayersResponse.json()

      setHomeTeamStats(homeStats)
      setAwayTeamStats(awayStats)
      setHomeTeamPlayers(homePlayers)
      setAwayTeamPlayers(awayPlayers)
    } catch (error) {
      console.error("Error fetching team data:", error)
      setHomeTeamStats(null)
      setAwayTeamStats(null)
      setHomeTeamPlayers([])
      setAwayTeamPlayers([])
    } finally {
      setIsPreviewLoading(false)
    }
  }

  if (isLoading) {
    return (
      <LeagueLoadingScreen 
        league={selectedLeague === "international-euroleague" ? "euroleague" : "eurocup"}
        message="Loading games data..."
        fullScreen={true}
      />
    )
  }

  // Game preview expansion component
  const renderGamePreviewExpansion = (game: GameMatchup) => {
    if (
      !expandedGameForPreview ||
      expandedGameForPreview.home_teamcode !== game.home_teamcode ||
      expandedGameForPreview.away_teamcode !== game.away_teamcode ||
      expandedGameForPreview.round !== game.round
    )
      return null

    const formatStat = (value: number | null | undefined, decimals = 1) => {
      if (value === null || value === undefined || isNaN(value)) return "N/A"
      return Number(value).toFixed(decimals)
    }

    const formatRank = (rank: number | null | undefined) => {
      if (rank === null || rank === undefined || isNaN(rank)) return "N/A"
      return `${rank}`
    }

    const getConditionalColorClass = (homeRank: number, awayRank: number, isHome: boolean, total = 18) => {
      const rank = isHome ? homeRank : awayRank
      const otherRank = isHome ? awayRank : homeRank

      // Only apply color if this team is better (lower rank)
      if (!rank || rank <= 0 || rank >= otherRank) {
        return "text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      }

      // This team is better, apply color based on rank
      const percentile = 1 - (rank - 1) / Math.max(1, total - 1)

      if (rank === 1)
        return "bg-green-600 text-white font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (rank === 2)
        return "bg-green-500 text-white font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (rank === 3)
        return "bg-green-400 text-black font-medium rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (percentile >= 0.75)
        return "bg-green-200 text-black font-medium rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (percentile >= 0.6)
        return "bg-green-100 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (percentile >= 0.4)
        return "bg-gray-200 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (percentile >= 0.25)
        return "bg-red-100 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (rank === total - 2)
        return "bg-red-300 text-black font-medium rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (rank === total - 1)
        return "bg-red-400 text-white font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
      if (rank === total)
        return "bg-red-500 text-white font-bold rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"

      return "bg-red-200 text-black rounded px-0.5 md:px-1 py-0 md:py-0.5 inline-block border border-gray-400"
    }

    const homeTeamColor = euroleague_team_colors[game.home_teamcode] || "#4b5563"
    const awayTeamColor = euroleague_team_colors[game.away_teamcode] || "#4b5563"

    // Format game time
    let timeDisplay = ""
    let timezoneDisplay = ""
    try {
      let gameTime = null
      const gameDate = new Date(game.game_date)

      if (game.time && game.time !== "00:00:00") {
        const [hours, minutes] = game.time.split(":")
        const gameDateStr = game.game_date.split("T")[0]
        const cetHours = Number.parseInt(hours)
        const cetMinutes = Number.parseInt(minutes)
        const utcDateStr = `${gameDateStr}T${String(cetHours).padStart(2, "0")}:${String(cetMinutes).padStart(2, "0")}:00Z`
        gameTime = new Date(utcDateStr)
      } else if (game.game_time && game.game_time !== "00:00:00") {
        const [hours, minutes] = game.game_time.split(":")
        const gameDateStr = game.game_date.split("T")[0]
        const cetHours = Number.parseInt(hours)
        const cetMinutes = Number.parseInt(minutes)
        const utcDateStr = `${gameDateStr}T${String(cetHours).padStart(2, "0")}:${String(cetMinutes).padStart(2, "0")}:00Z`
        gameTime = new Date(utcDateStr)
      }

      if (gameTime) {
        timeDisplay = gameTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const tzShort =
          new Date()
            .toLocaleDateString("en-US", {
              timeZoneName: "short",
              timeZone: userTimezone,
            })
            .split(", ")[1] || userTimezone.split("/").pop()

        timezoneDisplay = tzShort
      }
    } catch (e) {
      console.error("[v0] Error parsing game time:", e)
    }

    return (
      <div className="bg-white overflow-hidden relative z-20">
        <div className="relative py-1 px-2 border-b border-gray-300 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
          <div className="text-center">
            <span className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-widest">Preview</span>
          </div>
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[8px] md:text-[9px] text-gray-400 italic">Click to Return</span>
        </div>
        <div className="p-1 md:p-1.5">
          {isPreviewLoading ? (
            <div className="text-center py-4">
              <div className="text-gray-500 text-sm">Loading team statistics...</div>
            </div>
          ) : homeTeamStats && awayTeamStats ? (
            <div className="space-y-1.5">
              {/* Container 1: Team Logos/Names/Date */}
              <div
                className="bg-white border border-gray-400 rounded-lg shadow-md overflow-hidden"
                style={{
                  background: `linear-gradient(to right, ${homeTeamColor}30, #ffffff, ${awayTeamColor}30)`,
                }}
              >
                <div className="flex items-center justify-between p-1.5 md:p-2">
                  {/* Home Team */}
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <span className="text-[8px] md:text-[9px] font-medium text-gray-500 uppercase tracking-wide">
                      Home
                    </span>
                    <div
                      className="p-1 rounded-lg shadow-sm border"
                      style={{
                        backgroundColor: `${homeTeamColor}20`,
                        borderColor: `${homeTeamColor}60`,
                      }}
                    >
                      <img
                        src={game.home_teamlogo || "/placeholder.svg"}
                        alt={`${game.home_team} logo`}
                        className="w-6 h-6 md:w-8 md:h-8 object-contain"
                      />
                    </div>
                    <span className="text-[9px] md:text-[10px] font-semibold text-gray-700 text-center">
                      {game.home_team}
                    </span>
                  </div>

                  {/* VS and Date/Time */}
                  <div className="flex flex-col items-center gap-0.5 px-2">
                    <span className="text-[9px] md:text-[10px] uppercase font-semibold text-gray-600">vs.</span>
                    {timeDisplay && (
                      <>
                        <span className="text-[11px] md:text-sm font-bold text-gray-900">{timeDisplay}</span>
                        {timezoneDisplay && (
                          <span className="text-[7px] md:text-[8px] text-gray-500 font-medium">{timezoneDisplay}</span>
                        )}
                      </>
                    )}
                    <span className="text-[8px] md:text-[9px] text-gray-500">
                      {new Date(game.game_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                    <span className="text-[8px] md:text-[9px] font-medium text-gray-500 uppercase tracking-wide">
                      Away
                    </span>
                    <div
                      className="p-1 rounded-lg shadow-sm border"
                      style={{
                        backgroundColor: `${awayTeamColor}20`,
                        borderColor: `${awayTeamColor}60`,
                      }}
                    >
                      <img
                        src={game.away_teamlogo || "/placeholder.svg"}
                        alt={`${game.away_team} logo`}
                        className="w-6 h-6 md:w-8 md:h-8 object-contain"
                      />
                    </div>
                    <span className="text-[9px] md:text-[10px] font-semibold text-gray-700 text-center">
                      {game.away_team}
                    </span>
                  </div>
                </div>
              </div>

              {/* Container 2: Offense Stats */}
              <div className="bg-white border border-gray-400 rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center py-1 bg-white border-b border-gray-300">
                  <div className="flex-grow h-px bg-gray-300"></div>
                  <div className="px-2 text-[10px] md:text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Offense
                  </div>
                  <div className="flex-grow h-px bg-gray-300"></div>
                </div>
                <table className="w-full text-[10px] md:text-xs border-collapse">
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "35%" }} />
                  </colgroup>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_efgperc_o, awayTeamStats.rank_efgperc_o, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.efgperc_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_efgperc_o)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        eFG%
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_efgperc_o, awayTeamStats.rank_efgperc_o, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.efgperc_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_efgperc_o)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_toratio_o, awayTeamStats.rank_toratio_o, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.toratio_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_toratio_o)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        TOV%
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_toratio_o, awayTeamStats.rank_toratio_o, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.toratio_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_toratio_o)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_orebperc_o, awayTeamStats.rank_orebperc_o, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.orebperc_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_orebperc_o)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        ORB%
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_orebperc_o, awayTeamStats.rank_orebperc_o, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.orebperc_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_orebperc_o)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1 pb-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_ftrate_o, awayTeamStats.rank_ftrate_o, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.ftrate_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_ftrate_o)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        FTR
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_ftrate_o, awayTeamStats.rank_ftrate_o, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.ftrate_o, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_ftrate_o)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Container 3: Defense Stats */}
              <div className="bg-white border border-gray-400 rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center py-1 bg-white border-b border-gray-300">
                  <div className="flex-grow h-px bg-gray-300"></div>
                  <div className="px-2 text-[10px] md:text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Defense
                  </div>
                  <div className="flex-grow h-px bg-gray-300"></div>
                </div>
                <table className="w-full text-[10px] md:text-xs border-collapse">
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "35%" }} />
                  </colgroup>
                  <tbody>
                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_efgperc_d, awayTeamStats.rank_efgperc_d, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.efgperc_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_efgperc_d)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        eFG%
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_efgperc_d, awayTeamStats.rank_efgperc_d, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.efgperc_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_efgperc_d)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_toratio_d, awayTeamStats.rank_toratio_d, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.toratio_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_toratio_d)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        TOV%
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_toratio_d, awayTeamStats.rank_toratio_d, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.toratio_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_toratio_d)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_orebperc_d, awayTeamStats.rank_orebperc_d, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.orebperc_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_orebperc_d)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        DRB%
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_orebperc_d, awayTeamStats.rank_orebperc_d, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.orebperc_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_orebperc_d)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="text-center py-0.5 px-1 pb-1">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_ftrate_d, awayTeamStats.rank_ftrate_d, true)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(homeTeamStats.ftrate_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(homeTeamStats.rank_ftrate_d)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-0.5 px-1 font-medium text-gray-600 uppercase text-[9px] md:text-[10px] border-l border-gray-200">
                        FTR
                      </td>
                      <td className="text-center py-0.5 px-1 border-l border-gray-200">
                        <div className="flex justify-center">
                          <div
                            className={`${getConditionalColorClass(homeTeamStats.rank_ftrate_d, awayTeamStats.rank_ftrate_d, false)} whitespace-nowrap text-[9px] md:text-[10px] w-[90%]`}
                          >
                            <span className="font-bold">{formatStat(awayTeamStats.ftrate_d, 1)}</span>
                            <span className="inline-block w-2"></span>
                            <span className="opacity-75">{formatRank(awayTeamStats.rank_ftrate_d)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Container 4: Season Leaders */}
              <div className="bg-white border border-gray-400 rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center py-1 bg-white border-b border-gray-300">
                  <div className="flex-grow h-px bg-gray-300"></div>
                  <div className="px-2 text-[10px] md:text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Season Leaders
                  </div>
                  <div className="flex-grow h-px bg-gray-300"></div>
                </div>
                <div className="p-1.5">
                  {(() => {
                    // Ensure we have player data
                    if (!homeTeamPlayers?.length || !awayTeamPlayers?.length) {
                      return <div className="text-[8px] text-gray-500 text-center">Loading player data...</div>
                    }

                    const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers]

                    // Helper function to safely parse numeric values
                    const parseStatValue = (value: any): number => {
                      if (value === null || value === undefined) return 0
                      const parsed = typeof value === "string" ? Number.parseFloat(value) : Number(value)
                      return isNaN(parsed) ? 0 : parsed
                    }

                    // Find actual leaders with proper number parsing
                    const leadingScorer = allPlayers.reduce((max, player) => {
                      const maxScore = parseStatValue(max?.points_scored)
                      const playerScore = parseStatValue(player?.points_scored)
                      return playerScore > maxScore ? player : max
                    }, allPlayers[0])

                    const leadingRebounder = allPlayers.reduce((max, player) => {
                      const maxRebs = parseStatValue(max?.total_rebounds)
                      const playerRebs = parseStatValue(player?.total_rebounds)
                      return playerRebs > maxRebs ? player : max
                    }, allPlayers[0])

                    const leadingAssister = allPlayers.reduce((max, player) => {
                      const maxAsts = parseStatValue(max?.assists)
                      const playerAsts = parseStatValue(player?.assists)
                      return playerAsts > maxAsts ? player : max
                    }, allPlayers[0])

                    const leading3pt = allPlayers.reduce((max, player) => {
                      const max3pt = parseStatValue(max?.three_pointers_made)
                      const player3pt = parseStatValue(player?.three_pointers_made)
                      return player3pt > max3pt ? player : max
                    }, allPlayers[0])

                    const getTeamLogo = (teamCode: string) => {
                      return teamCode === game.home_teamcode ? game.home_teamlogo : game.away_teamlogo
                    }

                    return (
                      <div className="space-y-1">
                        {/* Leading Scorer */}
                        {leadingScorer?.player_name && (
                          <div className="flex items-center justify-between text-[9px] md:text-[10px] p-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <img
                                src={getTeamLogo(leadingScorer.player_team_code) || "/placeholder.svg"}
                                alt="team logo"
                                className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-gray-800 truncate max-w-[140px] md:max-w-[200px]">
                                  {leadingScorer.player_name}
                                </span>
                                <span className="text-[8px] text-gray-500 uppercase">Points</span>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 text-[10px] md:text-xs flex-shrink-0">
                              {formatStat(parseStatValue(leadingScorer.points_scored), 1)}
                            </div>
                          </div>
                        )}

                        {/* Leading Rebounder */}
                        {leadingRebounder?.player_name && (
                          <div className="flex items-center justify-between text-[9px] md:text-[10px] p-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <img
                                src={getTeamLogo(leadingRebounder.player_team_code) || "/placeholder.svg"}
                                alt="team logo"
                                className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-gray-800 truncate max-w-[140px] md:max-w-[200px]">
                                  {leadingRebounder.player_name}
                                </span>
                                <span className="text-[8px] text-gray-500 uppercase">Rebounds</span>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 text-[10px] md:text-xs flex-shrink-0">
                              {formatStat(parseStatValue(leadingRebounder.total_rebounds), 1)}
                            </div>
                          </div>
                        )}

                        {/* Leading Assister */}
                        {leadingAssister?.player_name && (
                          <div className="flex items-center justify-between text-[9px] md:text-[10px] p-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <img
                                src={getTeamLogo(leadingAssister.player_team_code) || "/placeholder.svg"}
                                alt="team logo"
                                className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-gray-800 truncate max-w-[140px] md:max-w-[200px]">
                                  {leadingAssister.player_name}
                                </span>
                                <span className="text-[8px] text-gray-500 uppercase">Assists</span>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 text-[10px] md:text-xs flex-shrink-0">
                              {formatStat(parseStatValue(leadingAssister.assists), 1)}
                            </div>
                          </div>
                        )}

                        {/* Leading 3PT Maker */}
                        {leading3pt?.player_name && (
                          <div className="flex items-center justify-between text-[9px] md:text-[10px] p-1.5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <img
                                src={getTeamLogo(leading3pt.player_team_code) || "/placeholder.svg"}
                                alt="team logo"
                                className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-semibold text-gray-800 truncate max-w-[140px] md:max-w-[200px]">
                                  {leading3pt.player_name}
                                </span>
                                <span className="text-[8px] text-gray-500 uppercase">3-Pointers</span>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900 text-[10px] md:text-xs flex-shrink-0">
                              {formatStat(parseStatValue(leading3pt.three_pointers_made), 1)}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="text-gray-500 text-sm">Unable to load team statistics</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Game log expansion component (exact copy from team-details-tab.tsx)
  const renderGameLogExpansion = (game: GameMatchup) => {
    // Ensure the log is for the correct game before rendering anything
    if (!expandedGameForLogs || expandedGameForLogs.gamecode !== game.gamecode) return null

    // Get unique teams from the game logs with proper team names
    const teamCode1 = expandedGameForLogs.home_teamcode
    const teamCode2 = expandedGameForLogs.away_teamcode
    const availableTeamsInGame = [teamCode1, teamCode2]

    // Create team mapping for display names
    const getTeamDisplayName = (teamCode: string) => {
      if (teamCode === teamCode1) {
        return expandedGameForLogs.home_team
      } else if (teamCode === teamCode2) {
        return expandedGameForLogs.away_team
      }
      return teamCode // fallback
    }

    // 1. Filter the game logs for the selected team
    const teamLogs = expandedGameLogsData.filter((log) => log.team === selectedGameTeam)

    // 2. Separate Player Logs from Aggregate Logs and sort by points descending
    const filteredPlayerLogs = teamLogs
      .filter((log) => log.player !== "Team" && log.player !== "Total")
      .sort((a, b) => (b.points || 0) - (a.points || 0))
    const teamTotalsLog = teamLogs.find((log) => log.player === "Team")
    const gameTotalLog = teamLogs.find((log) => log.player === "Total")

    // 3. Combine them in the correct order: Players, Team, Total
    const finalLogs = [...filteredPlayerLogs]
    if (teamTotalsLog) finalLogs.push(teamTotalsLog)
    if (gameTotalLog) finalLogs.push(gameTotalLog)

    // Get team colors based on their actual positions, not selection
    const team1Color = euroleague_team_colors[teamCode1] || "#4b5563" // Home team color
    const team2Color = euroleague_team_colors[teamCode2] || "#4b5563" // Away team color

    // Determine the color for the starter row based on the selected team for a visual cue
    const teamColor = euroleague_team_colors[selectedGameTeam] || "#4b5563"
    const starterRowStyle = {
      backgroundColor: `${teamColor}1A`, // 10% opacity
    }
    const starterRowHoverStyle = {
      backgroundColor: `${teamColor}33`, // 20% opacity
    }

    // Helper function for the new table structure
    const formatStat = (value: number | string | undefined | null, decimals = 0) => {
      if (value === undefined || value === null) return "0"
      const numValue = Number(value)
      if (isNaN(numValue)) return "0"
      return numValue.toFixed(decimals)
    }

    // New constants for table styling based on your provided code
    const baseTableClasses = "w-full text-[9px] md:text-[11px] border-collapse rounded-none"
    const headerRowClasses = "bg-gray-50 h-10 md:h-10 border-t-2 border-gray-700"
    const bodyRowClasses = "h-7 border-b border-gray-200 hover:shadow-sm transition-all duration-200 ease-in-out group"

    return (
      <div className="bg-white overflow-hidden relative z-20">
        <div className="relative py-1 px-2 border-b border-gray-300 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
          <div className="text-center">
            <span className="text-[10px] md:text-xs font-semibold text-gray-600 uppercase tracking-widest">Game Details</span>
          </div>
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[8px] md:text-[9px] text-gray-400 italic">Click to Return</span>
        </div>
        <div
          className="p-4 pb-2 border-b-2 border-gray-300"
          style={{
            background: `linear-gradient(to right, ${team1Color}15, #f9fafb, ${team2Color}15)`,
          }}
        >
          {/* Game Matchup Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="p-1 bg-white rounded-full shadow-md">
                <img
                  src={expandedGameForLogs.home_teamlogo || "/placeholder.svg"}
                  alt={`${expandedGameForLogs.home_team} logo`}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-xs md:text-sm text-center">{expandedGameForLogs.home_team}</span>
                <span className="text-[10px] text-gray-600">Home</span>
              </div>
            </div>

            {/* Score & Details */}
            <div className="flex flex-col items-center px-4 min-w-[100px]">
              <div className="text-xl md:text-2xl font-bold font-mono bg-gray-100 px-4 py-2 rounded-lg border-2 border-gray-300 shadow-sm">
                {expandedGameForLogs.home_score} - {expandedGameForLogs.away_score}
              </div>
              <div className="text-[10px] text-gray-600 mt-1 bg-gray-50 px-1.5 py-0.5 rounded text-center">
                Round {expandedGameForLogs.round}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 text-center">
                {new Date(expandedGameForLogs.game_date).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="p-1 bg-white rounded-full shadow-md">
                <img
                  src={expandedGameForLogs.away_teamlogo || "/placeholder.svg"}
                  alt={`${expandedGameForLogs.away_team} logo`}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-semibold text-xs md:text-sm text-center">{expandedGameForLogs.away_team}</span>
                <span className="text-[10px] text-gray-600">Away</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-1 py-4 md:px-4 bg-white">
          {/* Team Toggle - full width above stats */}
          <div className="flex w-full border border-gray-300 rounded-lg overflow-hidden mb-4 shadow-sm">
            {availableTeamsInGame.map((teamCode) => (
              <div
                key={teamCode}
                onClick={(e) => {
                  e.stopPropagation()
                  handleGameTeamChange(teamCode)
                }}
                className={`
                          flex-1 text-center px-2 py-2 cursor-pointer transition-all duration-200 ease-in-out
                          font-semibold text-xs whitespace-nowrap overflow-hidden text-ellipsis
                          ${
                            selectedGameTeam === teamCode
                              ? "bg-gray-900 text-white shadow-inner"
                              : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md"
                          }
                      `}
              >
                {getTeamDisplayName(teamCode)}
              </div>
            ))}
          </div>

          {/* Game Log Table */}
          {isExpandedGameLogsLoading ? (
            <div className="text-center py-4">
              <div className="text-gray-500 text-sm">Loading game logs...</div>
            </div>
          ) : finalLogs.length > 0 ? (
            <div className="flex gap-0 border border-gray-300 overflow-hidden shadow-sm">
              {/* Player Names Column */}
              <div className="flex-shrink-0 border-r-2 border-gray-400">
                <table className={baseTableClasses} style={{ borderSpacing: 0 }}>
                  <thead className="sticky top-0 z-50 bg-gradient-to-r from-gray-100 to-gray-50 shadow-md border-t-2 border-gray-700">
                    <tr className={headerRowClasses}>
                      <th className="text-left py-1 px-1 font-semibold text-[11px] md:text-xs min-w-[120px] md:min-w-[160px]">
                        Player
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalLogs.map((log, index) => {
                      // Determine row styling
                      const isTotalRow = log.player === "Total"
                      const isTeamRow = log.player === "Team"
                      if (isTeamRow) return null

                      // Team and Total rows use a specific styling, others use starter/default
                      const rowStyling = isTotalRow ? "font-bold bg-gray-100 hover:bg-gray-200" : "bg-white"
                      const rowStyle = {}
                      const fontStyling = isTotalRow ? "font-bold" : "font-medium"

                      return (
                        <tr
                          key={`${log.player_id || log.player}-${index}`}
                          className={`${bodyRowClasses} ${rowStyling} ${isTotalRow ? "border-t-2 border-gray-400" : ""}`}
                          style={rowStyle}
                        >
                          <td className={`text-left py-0.5 px-1 ${fontStyling}`}>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] md:text-[11px]">{log.player}</span>
                              {log.is_starter === true && (
                                <span className="text-black text-[8px] md:text-[10px]">★</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Scrollable Stats Section */}
              <div className="overflow-x-auto">
                <table
                  className={baseTableClasses + " md:min-w-[1200px]"} // Ensure enough width for scrolling
                  style={{ borderSpacing: 0 }}
                >
                  <thead className="sticky top-0 z-50 bg-gradient-to-r from-gray-100 to-gray-50 shadow-md border-t-2 border-gray-700">
                    <tr className={headerRowClasses}>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        MIN
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        PTS
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[60px]">
                        2PM-A
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[60px]">
                        3PM-A
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[60px]">
                        FTM-A
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        REB
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        AST
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        STL
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        TO
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold border-r border-gray-300 text-[11px] md:text-xs min-w-[40px]">
                        BLK
                      </th>
                      <th className="text-center py-1 px-0.5 font-semibold text-[11px] md:text-xs min-w-[40px]">PIR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalLogs.map((log, index) => {
                      // Determine row styling
                      const isTotalRow = log.player === "Total"
                      const isTeamRow = log.player === "Team"
                      if (isTeamRow) return null

                      const rowStyling = isTotalRow ? "font-bold bg-gray-100 hover:bg-gray-200" : "bg-white"
                      const rowStyle = {}
                      const fontStyling = isTotalRow ? "font-bold" : "font-medium"

                      return (
                        <tr
                          key={`${log.player_id || log.player}-${index}`}
                          className={`${bodyRowClasses} ${rowStyling} ${isTotalRow ? "border-t-2 border-gray-400" : ""}`}
                          style={rowStyle}
                        >
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {log.minutes || "0:00"}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {formatStat(log.points, 0)}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {log.field_goals_made_2}-{log.field_goals_attempted_2}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {log.field_goals_made_3}-{log.field_goals_attempted_3}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {log.free_throws_made}-{log.free_throws_attempted}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {formatStat(log.total_rebounds, 0)}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {formatStat(log.assistances, 0)}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {formatStat(log.steals, 0)}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {formatStat(log.turnovers, 0)}
                          </td>
                          <td
                            className={`text-center py-0.5 px-0.5 ${fontStyling} border-r border-gray-300 text-[9px] md:text-[11px]`}
                          >
                            {formatStat(log.blocks_favour, 0)}
                          </td>
                          <td className={`text-center py-0.5 px-0.5 ${fontStyling} text-[9px] md:text-[11px]`}>
                            {formatStat(log.valuation, 0)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500 text-sm">No game logs available for this game.</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-0 py-2 md:p-6 relative">
      
      {/* Round Selector - Mobile Style */}
      <div className="md:hidden bg-black shadow-xl rounded-xl relative -mt-5 mb-3">
        <div className="rounded-xl overflow-hidden shadow-xl w-full" style={{ border: "1px solid black" }}>
          <div className="flex items-center h-full">
            <div className="flex-1" style={{ backgroundColor: "#D37000" }}>
              <button
                onClick={() => setIsRoundDropdownOpen(!isRoundDropdownOpen)}
                className="w-full h-full py-2 px-3 text-center flex items-center justify-center space-x-2"
              >
                <h2
                  className="text-md font-bold text-white"
                  style={{ textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000" }}
                >
                  Round {selectedRound}
                </h2>
                <ChevronDown
                  className={`h-4 w-4 text-white transition-transform ${isRoundDropdownOpen ? "rotate-180" : ""}`}
                  style={{
                    filter:
                      "drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)",
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isRoundDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-full rounded-lg overflow-hidden z-10 border border-gray-200 shadow-xl bg-white">
            <div className="py-2 max-h-60 overflow-y-auto">
              {availableRounds.map((round) => (
                <button
                  key={round}
                  onClick={() => handleRoundChange(round)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-sm transition-colors",
                    selectedRound === round
                      ? "bg-orange-50 text-orange-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  Round {round}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Round Selector - Desktop Style */}
      <div className="hidden md:block mb-4 -mt-3">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 shadow-sm p-1">
            {/* Previous Round Arrow */}
            <button
              onClick={handlePreviousRound}
              disabled={availableRounds.indexOf(selectedRound) === 0}
              className={cn(
                "p-1 rounded transition-colors",
                availableRounds.indexOf(selectedRound) === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Round Display with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoundDropdownOpen(!isRoundDropdownOpen)}
                className="flex items-center justify-center px-12 py-1 rounded-lg text-gray-900 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 shadow-sm min-w-[200px] text-sm font-semibold"
              >
                <span>Round {selectedRound}</span>
              </button>

              {isRoundDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-full rounded-lg overflow-hidden z-10 border border-gray-200 shadow-lg bg-white">
                  <div className="py-2 max-h-60 overflow-y-auto">
                    {availableRounds.map((round) => (
                      <button
                        key={round}
                        onClick={() => handleRoundChange(round)}
                        className={cn(
                          "flex items-center w-full px-3 py-2 text-sm transition-colors",
                          selectedRound === round
                            ? "bg-blue-50 text-blue-900 font-medium"
                            : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        Round {round}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Round Arrow */}
            <button
              onClick={handleNextRound}
              disabled={availableRounds.indexOf(selectedRound) === availableRounds.length - 1}
              className={cn(
                "p-1 rounded transition-colors",
                availableRounds.indexOf(selectedRound) === availableRounds.length - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {sortedRoundGames.length > 0 ? (
        <div className="px-0 md:px-0">
          <div className="grid gap-2 md:gap-3">
            {sortedRoundGames.map((game, index) => {
              const [year, month, day] = game.game_date.split("T")[0].split("-")
              const gameDate = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

              // const monthShort = gameDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
              // const dayNum = gameDate.getDate()

              const currentGameDateString = gameDate.toDateString()
              const previousGame = index > 0 ? sortedRoundGames[index - 1] : null
              let previousGameDateString = null
              if (previousGame) {
                const [prevYear, prevMonth, prevDay] = previousGame.game_date.split("T")[0].split("-")
                const prevGameDate = new Date(
                  Number.parseInt(prevYear),
                  Number.parseInt(prevMonth) - 1,
                  Number.parseInt(prevDay),
                )
                previousGameDateString = prevGameDate.toDateString()
              }
              const isNewDate = index === 0 || currentGameDateString !== previousGameDateString

              // Extract time from the game_time field or game_date and convert to user timezone
              let timeDisplay = ""
              let timezoneDisplay = ""
              try {
                let gameTime: Date | null = null

                // First try to use game_time if available
                if (game.time && game.time !== "00:00:00") {
                  // Parse the time string (HH:MM:SS format)
                  const [hours, minutes] = game.time.split(":")

                  // Create a date string in ISO format assuming CET timezone (simplified: treating it as UTC for browser conversion)
                  const gameDateStr = game.game_date.split("T")[0] // Get YYYY-MM-DD
                  
                  // Construct a datetime string
                  const cetHours = Number.parseInt(hours)
                  const cetMinutes = Number.parseInt(minutes)
                  
                  const utcDateStr = `${gameDateStr}T${String(cetHours).padStart(2, "0")}:${String(cetMinutes).padStart(2, "0")}:00Z`
                  gameTime = new Date(utcDateStr)

                } else if (game.game_time && game.game_time !== "00:00:00") {
                  const [hours, minutes] = game.game_time.split(":")

                  const gameDateStr = game.game_date.split("T")[0]
                  const cetHours = Number.parseInt(hours)
                  const cetMinutes = Number.parseInt(minutes)

                  const utcDateStr = `${gameDateStr}T${String(cetHours).padStart(2, "0")}:${String(cetMinutes).padStart(2, "0")}:00Z`
                  gameTime = new Date(utcDateStr)
                  
                } else {
                  // Try to extract time from the game_date if it includes time
                  const time = gameDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  // Only use if it's not midnight (indicating actual game time)
                  if (time !== "00:00") {
                    gameTime = gameDate
                  }
                }

                if (gameTime) {
                  // Format time in user's timezone
                  timeDisplay = gameTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })

                  // Get user's timezone abbreviation
                  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
                  const tzShort =
                    new Date()
                      .toLocaleDateString("en-US", {
                        timeZoneName: "short",
                        timeZone: userTimezone,
                      })
                      .split(", ")[1] || userTimezone.split("/").pop()

                  timezoneDisplay = tzShort
                }
              } catch (e) {
                console.error("[v0] Error parsing game time:", e)
                // If parsing fails, no time display
              }

              return (
                <React.Fragment key={`${game.round}-${game.home_teamcode}-${game.away_teamcode}`}>
                  {isNewDate && (
                    <div className="w-full flex items-center my-2">
                      <div className="flex-grow h-px bg-gray-300"></div>
                      <div className="px-4 py-1 mx-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg border border-gray-300 shadow-sm">
                        {gameDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex-grow h-px bg-gray-300"></div>
                    </div>
                  )}

                  {/* Game Card with integrated date */}
                  <div
                    className={`bg-white transition-all duration-200 w-full max-w-full overflow-hidden ${
                      (() => {
                        // Check if this specific game is the one that's expanded
                        const isThisGameExpandedForLogs = 
                          expandedGameForLogs && 
                          expandedGameForLogs.gamecode === game.gamecode && 
                          game.is_played;
                        
                        const isThisGameExpandedForPreview = 
                          expandedGameForPreview &&
                          expandedGameForPreview.home_teamcode === game.home_teamcode &&
                          expandedGameForPreview.away_teamcode === game.away_teamcode &&
                          expandedGameForPreview.round === game.round &&
                          !game.is_played;
                        
                        // If this game is expanded, style it differently
                        if (isThisGameExpandedForLogs || isThisGameExpandedForPreview) {
                          return "rounded-lg border-2 border-gray-300";
                        }
                        
                        // If any dropdown is open and this is NOT the expanded game, dim it
                        const anyDropdownOpen = expandedGameForLogs || expandedGameForPreview;
                        if (anyDropdownOpen && !isThisGameExpandedForLogs && !isThisGameExpandedForPreview) {
                          return "rounded-lg border border-gray-200 shadow-md opacity-30";
                        }
                        
                        // Default state
                        return "rounded-lg border border-gray-200 shadow-md hover:shadow-lg";
                      })()
                    }`}
                  >
                    {/* Original game content - shown when NOT expanded */}
                    {!(
                      (expandedGameForLogs?.gamecode === game.gamecode && game.is_played) ||
                      (expandedGameForPreview?.home_teamcode === game.home_teamcode &&
                       expandedGameForPreview?.away_teamcode === game.away_teamcode &&
                       expandedGameForPreview?.round === game.round &&
                       !game.is_played)
                    ) && (
                      <div
                        onClick={() => {
                          if (game.is_played && game.gamecode) {
                            handleGameRowClick(game)
                          } else {
                            handleGamePreviewClick(game)
                          }
                        }}
                        className="flex w-full cursor-pointer hover:bg-gray-50" 
                      >
                        
                        {/* 1. TIME/SCORE STATUS COLUMN (Left Side with Divider) */}
                        <div className="flex-shrink-0 w-20 md:w-28 flex flex-col items-center justify-center p-1.5 md:p-2 border-r border-gray-200">
                           {game.is_played && game.home_score !== null && game.away_score !== null ? (
                              <div className="text-center">
                                {/* Only display FINAL status here */}
                                <div className="text-[10px] md:text-sm font-bold text-gray-700">
                                  FINAL
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                {timeDisplay ? (
                                  <>
                                    {/* Stack the time and timezone vertically */}
                                    <div className="text-xs md:text-base text-gray-900 font-bold">{timeDisplay}</div>
                                    {timezoneDisplay && (
                                      <div className="text-[8px] md:text-[10px] text-gray-500 font-medium">
                                        {timezoneDisplay}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-[8px] md:text-xs font-medium text-gray-500">TBD</div>
                                )}
                              </div>
                            )}
                        </div>

                        {/* 2. TEAM & SCORE COLUMN (Main Content) */}
                        <div className="flex-1 min-w-0 p-1.5 md:p-2">
                            <div className="flex flex-col space-y-2">
                                
                                {/* Row 1: Home Team */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <img
                                            src={game.home_teamlogo || "/placeholder.svg"}
                                            alt={`${game.home_team} logo`}
                                            className="w-5 h-5 md:w-7 md:h-7 object-contain flex-shrink-0"
                                        />
                                        <span className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                            {game.home_team}
                                            {!game.is_played && getTeamRecord(game.home_teamcode) && (
                                                <span className="text-[10px] md:text-xs text-gray-500 font-normal ml-1">
                                                    ({getTeamRecord(game.home_teamcode)})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {/* **FIX: Display HOME score next to the home team if played** */}
                                    {game.is_played && game.home_score !== null && (
                                        <span className={`text-sm md:text-lg font-bold ${
                                            // Highlight winner's score
                                            game.home_score > (game.away_score || 0) 
                                                ? 'text-green-700' 
                                                : 'text-gray-700'
                                        }`}>
                                            {game.home_score}
                                        </span>
                                    )}
                                </div>

                                {/* Row 2: Away Team */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <img
                                            src={game.away_teamlogo || "/placeholder.svg"}
                                            alt={`${game.away_team} logo`}
                                            className="w-5 h-5 md:w-7 md:h-7 object-contain flex-shrink-0"
                                        />
                                        <span className="text-xs md:text-sm font-medium text-gray-900 truncate">
                                            {game.away_team}
                                            {!game.is_played && getTeamRecord(game.away_teamcode) && (
                                                <span className="text-[10px] md:text-xs text-gray-500 font-normal ml-1">
                                                    ({getTeamRecord(game.away_teamcode)})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {/* **FIX: Display AWAY score next to the away team if played** */}
                                    {game.is_played && game.away_score !== null && (
                                        <span className={`text-sm md:text-lg font-bold ${
                                            // Highlight winner's score
                                            game.away_score > (game.home_score || 0) 
                                                ? 'text-green-700' 
                                                : 'text-gray-700'
                                        }`}>
                                            {game.away_score}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. ARROW COLUMN (Right Side) */}
                        <div className="flex items-center ml-1 w-6 md:w-8 justify-center flex-shrink-0">
                            <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-gray-400" /> 
                        </div>
                      </div>
                    )}

                    {/* Expanded content - shown when expanded (logic remains the same) */}
                    {(expandedGameForLogs?.gamecode === game.gamecode && game.is_played) && (
                      <div 
                        className="relative z-20 cursor-pointer"
                        onClick={() => {
                          setExpandedGameForLogs(null)
                          setExpandedGameLogsData([])
                          setSelectedGameTeam("")
                        }}
                      >
                        {renderGameLogExpansion(game)}
                      </div>
                    )}
                    
                    {(expandedGameForPreview?.home_teamcode === game.home_teamcode &&
                      expandedGameForPreview?.away_teamcode === game.away_teamcode &&
                      expandedGameForPreview?.round === game.round &&
                      !game.is_played) && (
                      <div 
                        className="relative z-20 cursor-pointer"
                        onClick={() => {
                          setExpandedGameForPreview(null)
                          setHomeTeamStats(null)
                          setAwayTeamStats(null)
                          setHomeTeamPlayers([])
                          setAwayTeamPlayers([])
                        }}
                      >
                        {renderGamePreviewExpansion(game)}
                      </div>
                    )}
                  </div>

                </React.Fragment>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="px-1 md:px-0">
          <div className="text-center py-8">
            <div className="text-gray-500">No games found for Round {selectedRound}</div>
          </div>
        </div>
      )}
    </div>
  )
}
