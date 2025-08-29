"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, ArrowDown, ArrowUp, HelpCircle, Flame } from "lucide-react"
import { fetchPlayerGameLogs } from "@/app/actions/standings"
import type { EuroleagueGameLog } from "@/lib/db"
import BasketballShotChart from "@/components/basketball-shot-chart-player"
import { PlayerShootingProfileTable } from "@/components/player-shooting-profile-table"
import { fetchAllPlayerStatsFromGameLogs } from "@/app/actions/player-stats"
import type { PlayerStatsFromGameLogs } from "@/lib/types"
import { ChevronDown } from 'lucide-react'

// Team background colors (same as in StatisticsTab)
const teamColors = {
  BER: "#d6c042", // ALBA Berlin - Darker yellow
  IST: "#2a619c", // Anadolu Efes - Darker blue
  MCO: "#b03340", // Monaco - Darker red
  BAS: "#2c5f94", // Baskonia - Darker navy blue
  RED: "#c24b5a", // Crvena Zvezda - Darker red
  MIL: "#d44c60", // Milan - Darker red with pink tone
  BAR: "#2b5c94", // Barcelona - Darker deep blue
  MUN: "#9e3b4d", // Bayern - Darker burgundy
  ULK: "#d4b041", // Fenerbahce - Darker golden yellow
  ASV: "#8a8d90", // ASVEL - Darker gray
  TEL: "#d4a355", // Maccabi - Darker golden orange
  OLY: "#bf5050", // Olympiacos - Darker red
  PAN: "#2a7046", // Panathinaikos - Darker dark green
  PRS: "#4e565f", // Paris - Darker slate
  PAR: "#3a3834", // Partizan - Darker black-gray
  MAD: "#999999", // Real Madrid - Darker silver
  VIR: "#2f2f2f", // Virtus - Darker black
  ZAL: "#2a7a51", // Zalgiris - Darker kelly green
  PAM: "#d47800", // Valencia Basket - Darker orange

  // EuroCup Teams (Darker shades for better contrast with white text)
  "7BET": "#893247", // 7bet-Lietkabelis Panevezys - Darker maroon/red
  ARI: "#d6b52c", // Aris Midea Thessaloniki - Darker gold/yellow
  BAH: "#213243", // Bahcesehir College Istanbul - Darker dark blue/charcoal
  BES: "#363636", // Besiktas Fibabanka Istanbul - Darker dark grey/black
  BUD: "#2a72b5", // Buducnost VOLI Podgorica - Darker light blue
  CED: "#d39800", // Cedevita Olimpija Ljubljana - Darker orange/gold
  BOU: "#c24033", // Cosea JL Bourg-en-Bresse - Darker red
  TRE: "#4e6571", // Dolomiti Energia Trento - Darker slate gray
  CAN: "#d3a127", // Dreamland Gran Canaria - Darker gold/orange
  HAP: "#b02727", // Hapoel Bank Yahav Jerusalem - Darker deep red
  HTA: "#d0392e", // Hapoel Shlomo Tel Aviv - Darker red
  JOV: "#409944", // Joventut Badalona - Darker green
  ULM: "#c24400", // ratiopharm Ulm - Darker bright orange
  TREF: "#d3a127", // Trefl Sopot - Darker gold/orange
  TTK: "#42b4c5", // Turk Telekom Ankara - Darker light blue/turquoise
  UBT: "#858585", // U-BT Cluj-Napoca - Darker grey
  UMV: "#6c0924", // Umana Reyer Venice - Darker deep maroon/red
  HAM: "#213243", // Veolia Towers Hamburg - Darker dark blue/charcoal
  WOL: "#5ac591", // Wolves Twinsbet Vilnius - Darker lime green
}

// Helper function to get team border color
const getTeamBorderColor = (teamAbbr: string) => {
  
  const bgColor = teamColors[teamAbbr] || "bg-gray-600"
  return bgColor || "#6b7280"
}

type StatType = "points" | "rebounds" | "assists" | "threePointers" | "steals" | "blocks"
type TimeRange = "lastGame" | "last5" | "last10" | "last15" | "season"
type DisplayMode = "average"
type PercentileMode = "average"
type TrendCategory = "shotSelection" | "shootingPct" | "playmaking" | "rebounding" | "defense"

// Player data - to be replaced with props/API data
const playerData = {
  name: "",
  team: "",
  teamAbbr: "",
  position: "",
  number: "",
  height: "",
  weight: "",
  imageUrl: "",
  teamLogoUrl: "",
  primaryColor: "bg-purple-700",
  secondaryColor: "bg-yellow-400",
  gamesPlayed: 0,
  gamesStarted: 0,
}

// Helper function to safely format numbers and handle NaN - IMPROVED VERSION
const safeFormat = (value: number | string | undefined | null, decimals = 1): string => {
  if (value === null || value === undefined) {
    return "0.0"
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  if (isNaN(numValue)) {
    return "0.0"
  }

  return numValue.toFixed(decimals)
}

// New helper function for safe numeric conversion
const safeNumber = (value: number | string | undefined | null): number => {
  if (value === null || value === undefined) {
    return 0
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  if (isNaN(numValue)) {
    return 0
  }

  return numValue
}

// Function to determine background color for game log cells based on percentile ranking
const getGameLogCellColor = (value: number, allValues: number[], higherIsBetter = true) => {
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
      backgroundColor = "#6b7280" // Top 1% - darker grey (gray-500)
    } else if (percentile > 0.97) {
      backgroundColor = "#9ca3af" // Top 3% - medium-dark grey (gray-400)
    } else if (percentile > 0.95) {
      backgroundColor = "#d1d5db" // Top 5% - medium grey (gray-300)
    } else if (percentile > 0.9) {
      backgroundColor = "#e5e7eb" // Top 10% - light grey (gray-200)
    } else if (percentile > 0.8) {
      backgroundColor = "#f3f4f6" // Top 20% - very light grey (gray-100)
    } else {
      backgroundColor = "transparent" // Bottom 80% - no background
    }
  } else {
    // For stats where lower is better (like turnovers)
    if (percentile < 0.01) {
      backgroundColor = "#6b7280" // Bottom 1% - darker grey (gray-500)
    } else if (percentile < 0.03) {
      backgroundColor = "#9ca3af" // Bottom 3% - medium-dark grey (gray-400)
    } else if (percentile < 0.05) {
      backgroundColor = "#d1d5db" // Bottom 5% - medium grey (gray-300)
    } else if (percentile < 0.1) {
      backgroundColor = "#e5e7eb" // Top 10% - light grey (gray-200)
    } else if (percentile < 0.2) {
      backgroundColor = "#f3f4f6" // Top 20% - very light grey (gray-100)
    } else {
      backgroundColor = "transparent" // Top 80% - no background
    }
  }

  return { backgroundColor }
}

interface OffenseTabProps {
  selectedSeason?: number
  league?: string
}

const OffenseTab = ({ selectedSeason = 2024, league = "euroleague" }: OffenseTabProps) => {
  const [selectedStat, setSelectedStat] = useState<StatType>("points")
  const [timeRange, setTimeRange] = useState<TimeRange>("season")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("average")
  const [percentileMode, setPercentileMode] = useState<PercentileMode>("average")
  const [trendCategory, setTrendCategory] = useState<TrendCategory>("shotSelection")
  const [playerDataUpdated, setPlayerDataUpdated] = useState(0)
  const [gameData, setGameData] = useState<EuroleagueGameLog[]>([])
  const [selectedPhase, setSelectedPhase] = useState<string>("All")
  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(3)
  const [hoveredGame, setHoveredGame] = useState<{ game: EuroleagueGameLog; index: number } | null>(null)
  const [referenceLineType, setReferenceLineType] = useState<"best" | "playerAvg" | "leagueAvg">("playerAvg")
  const [shotData, setShotData] = useState<any[]>([])
  const [shotDataLoading, setShotDataLoading] = useState<boolean>(false)
  const [selectedCustomReferenceLine, setSelectedCustomReferenceLine] = useState(null)
  const [selectedPhaseToggle, setSelectedPhaseToggle] = useState<"Regular Season" | "Playoffs">("Regular Season")
  const [statDisplayMode, setStatDisplayMode] = useState<"per_game" | "per_40">("per_game")
  const [yearOverYearStats, setYearOverYearStats] = useState<PlayerStatsFromGameLogs[]>([])
  const [yearOverYearLoading, setYearOverYearLoading] = useState<boolean>(false)

  const [availableTeams, setAvailableTeams] = useState<
    {
      player_team_name: string
      player_team_code: string
      season: number
      phase: string
      teamlogo?: string
    }[]
  >([])
const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false)
  const [leagueAveragesData, setLeagueAveragesData] = useState([])

  // Move this function inside the OffenseTab component, after the state declarations
  const getTeamLogo = (teamCode: string, teamLogo?: string) => {
    const bgColor = teamColors[teamCode] || "bg-gray-600"

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
          className={`inline-flex items-center justify-center w-4 h-4 rounded-lg ${bgColor} text-white font-bold text-xs`}
        >
          {teamCode}
        </div>
      )
    }
  }
  const getTeamColorStyles = (teamCode: string) => {
  const bgColor = teamColors[teamCode] || "bg-gray-600"
  
  return { backgroundColor: bgColor || "#6b7280" }
}

  const chartRef = useRef<HTMLDivElement>(null)

  // Get the display name for the selected stat
  const getStatDisplayName = (stat: StatType): string => {
    const displayNames = {
      points: "Points",
      rebounds: "Rebounds",
      assists: "Assists",
      threePointers: "3PT FG",
      steals: "Steals",
      blocks: "Blocks",
    }
    return displayNames[stat]
  }

  // Calculate values for the chart
  const getStatValue = (game: EuroleagueGameLog, stat: StatType): number => {
    switch (stat) {
      case "points":
        return game.points || 0
      case "rebounds":
        return game.total_rebounds || 0
      case "assists":
        return game.assistances || 0 // Using assistances from the database
      case "threePointers":
        return game.field_goals_made_3 || 0 // Using field_goals_made_3 from the database
      case "steals":
        return game.steals || 0
      case "blocks":
        return game.blocks_favour || 0 // Using blocks_favour from the database
      default:
        return 0
    }
  }

  // Calculate rolling average for the selected stat
  const calculateRollingAverage = (data: EuroleagueGameLog[], stat: StatType, windowSize = 5) => {
    return data.map((_, index, array) => {
      // For the first few elements where we don't have enough previous data
      if (index < windowSize - 1) {
        const slice = array.slice(0, index + 1)
        const values = slice.map((game) => getStatValue(game, stat))
        return {
          game: array[index],
          value: values.reduce((sum, val) => sum + val, 0) / slice.length,
        }
      }

      // Normal case - take windowSize previous elements
      const slice = array.slice(index - windowSize + 1, index + 1)
      const values = slice.map((game) => getStatValue(game, stat))
      return {
        game: array[index],
        value: values.reduce((sum, val) => sum + val, 0) / windowSize,
      }
    })
  }

  // Calculate max values for scaling
  const maxStatValue = gameData.length > 0 ? Math.max(...gameData.map((game) => getStatValue(game, selectedStat))) : 10

  // Round up to nearest 5 for better scaling
  const chartMaxStat = Math.max(5, Math.ceil((maxStatValue * 1.25) / 5) * 5)

  // Add this new state for game log sorting
  const [gameLogSortColumn, setGameLogSortColumn] = useState("round")
  const [gameLogSortDirection, setGameLogSortDirection] = useState("desc")

  // Add this function to handle game log sorting
  const handleGameLogSort = (column: string) => {
    if (gameLogSortColumn === column) {
      // Toggle direction if clicking the same column
      setGameLogSortDirection(gameLogSortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default to descending
      setGameLogSortColumn(column)
      setGameLogSortDirection("desc")
    }
  }

  // Add this function to render game log sort indicator
  const renderGameLogSortIndicator = (column: string) => {
    if (gameLogSortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4  inline-block text-gray-400" />
    }

    return gameLogSortDirection === "desc" ? (
      <ArrowDown className="h-4 w-4  inline-block text-[#1a365d]" />
    ) : (
      <ArrowUp className="h-4 w-4 inline-block text-[#1a365d]" />
    )
  }

  // Collect all values for each stat column for conditional formatting
  const gameLogStatValues = useMemo(() => {
    return {
      minutes: gameData.map((game) => {
        // Parse MM:SS format to decimal minutes
        if (typeof game.minutes === "string" && game.minutes.includes(":")) {
          const [mins, secs] = game.minutes.split(":").map(Number)
          return mins + (secs || 0) / 60
        } else {
          // Fallback for numeric format
          const minutes =
            typeof game.minutes === "string"
              ? Number.parseFloat(game.minutes.replace(/[^\d.]/g, "")) || 0
              : Number(game.minutes) || 0
          return minutes
        }
      }),
      points: gameData.map((game) => game.points || 0),
      rebounds: gameData.map((game) => game.total_rebounds || 0),
      assists: gameData.map((game) => game.assistances || 0),
      steals: gameData.map((game) => game.steals || 0),
      blocks: gameData.map((game) => game.blocks_favour || 0),
      turnovers: gameData.map((game) => game.turnovers || 0),
      fieldGoalsMade: gameData.map((game) => (game.field_goals_made_2 || 0) + (game.field_goals_made_3 || 0)),
      fieldGoalsAttempted: gameData.map(
        (game) => (game.field_goals_attempted_2 || 0) + (game.field_goals_attempted_3 || 0),
      ),
      fieldGoalPct: gameData.map((game) => {
        const attempted = (game.field_goals_attempted_2 || 0) + (game.field_goals_attempted_3 || 0)
        const made = (game.field_goals_made_2 || 0) + (game.field_goals_made_3 || 0)
        return attempted > 0 ? (made / attempted) * 100 : 0
      }),
      twoPointsMade: gameData.map((game) => game.field_goals_made_2 || 0),
      twoPointsAttempted: gameData.map((game) => game.field_goals_attempted_2 || 0),
      twoPointPct: gameData.map((game) =>
        (game.field_goals_attempted_2 || 0) > 0
          ? ((game.field_goals_made_2 || 0) / (game.field_goals_attempted_2 || 1)) * 100
          : 0,
      ),
      threePointsMade: gameData.map((game) => game.field_goals_made_3 || 0),
      threePointsAttempted: gameData.map((game) => game.field_goals_attempted_3 || 0),
      threePointPct: gameData.map((game) =>
        (game.field_goals_attempted_3 || 0) > 0
          ? ((game.field_goals_made_3 || 0) / (game.field_goals_attempted_3 || 1)) * 100
          : 0,
      ),
      freeThrowsMade: gameData.map((game) => game.free_throws_made || 0),
      freeThrowsAttempted: gameData.map((game) => game.free_throws_attempted || 0),
      freeThrowPct: gameData.map((game) =>
        (game.free_throws_attempted || 0) > 0
          ? ((game.free_throws_made || 0) / (game.free_throws_attempted || 1)) * 100
          : 0,
      ),
      offensiveRebounds: gameData.map((game) => game.offensive_rebounds || 0),
      defensiveRebounds: gameData.map((game) => game.defensive_rebounds || 0),
      foulsCommited: gameData.map((game) => game.fouls_commited || 0),
      foulsReceived: gameData.map((game) => game.fouls_received || 0),
      valuation: gameData.map((game) => game.valuation || 0),
      plusminus: gameData.map((game) => game.plusminus || 0),
    }
  }, [gameData])

  // Sort the game data based on current sort column and direction
  const sortedGameData = useMemo(() => {
    return [...gameData].sort((a, b) => {
      let aValue, bValue

      // Special handling for round column
      if (gameLogSortColumn === "round") {
        aValue = a.round || 0
        bValue = b.round || 0
      } else if (gameLogSortColumn === "date") {
        // Convert date strings to comparable values (assuming format is "M/D")
        const [aMonth, aDay] = (a.date || "0/0").split("/").map(Number)
        const [bMonth, bDay] = (b.date || "0/0").split("/").map(Number)

        aValue = aMonth * 100 + aDay
        bValue = bMonth * 100 + bDay
      } else {
        aValue = a[gameLogSortColumn] || 0
        bValue = b[gameLogSortColumn] || 0
      }

      if (gameLogSortDirection === "desc") {
        return bValue - aValue
      } else {
        return aValue - bValue
      }
    })
  }, [gameData, gameLogSortColumn, gameLogSortDirection])

  // Updated state to use pre-calculated player stats
  const [currentPhase, setCurrentPhase] = useState<string>("RS")
  const currentSeason = selectedSeason
  const [selectedTeam, setSelectedTeam] = useState<{
    player_team_name: string
    player_team_code: string
    season: number
    phase: string
  } | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<PlayerStatsFromGameLogs[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStatsFromGameLogs | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [allPlayers, setAllPlayers] = useState<PlayerStatsFromGameLogs[]>([])

  // Function to get position from player code (mock implementation)
  const getPositionFromCode = (code: string): string => {
    // This would be replaced with actual logic based on your data
    const positions = ["PG", "SG", "SF", "PF", "C"]
    return positions[Math.floor(Math.random() * positions.length)]
  }

  // Load teams for the current season using pre-calculated stats
  useEffect(() => {
    const loadTeams = async () => {
      console.log(`=== LOADING TEAMS FOR SEASON: ${currentSeason}, LEAGUE: ${league} ===`)
      setIsLoading(true)
      try {
        // Load pre-calculated player stats for both regular season and playoffs
        console.log("Fetching RS players...")
        const rsPlayers = await fetchAllPlayerStatsFromGameLogs(currentSeason, "Regular Season", league)
        console.log(`Loaded ${rsPlayers.length} RS players`)

        console.log("Fetching PO players...")
        const poPlayers = await fetchAllPlayerStatsFromGameLogs(currentSeason, "Playoffs", league)
        console.log(`Loaded ${poPlayers.length} PO players`)

        // Combine all players for ranking calculations
        const allPlayersData = [...rsPlayers, ...poPlayers]
        console.log(`Total players loaded: ${allPlayersData.length}`)
        setAllPlayers(allPlayersData)

        // Extract unique teams from regular season players (for team selection)
        const teams = rsPlayers.reduce(
          (acc, player) => {
            const existingTeam = acc.find((t) => t.player_team_code === player.player_team_code)
            if (!existingTeam) {
              acc.push({
                player_team_name: player.player_team_name,
                player_team_code: player.player_team_code,
                season: currentSeason,
                phase: "RS",
                teamlogo: player.teamlogo || "",
              })
            }
            return acc
          },
          [] as {
            player_team_name: string
            player_team_code: string
            season: number
            phase: string
            teamlogo?: string
          }[],
        )

        console.log(`Extracted ${teams.length} unique teams:`)
        teams.forEach((team) => {
          console.log(`- ${team.player_team_name} (${team.player_team_code})`)
        })
        setAvailableTeams(teams)

        // Auto-select first team if no team is selected
        if (teams.length > 0 && !selectedTeam) {
          const firstTeam = teams[0]
          console.log(`Auto-selecting first team: ${firstTeam.player_team_name}`)
          setSelectedTeam(firstTeam)

          // Auto-select first player from first team (from regular season)
          const firstTeamPlayers = rsPlayers.filter((player) => player.player_team_code === firstTeam.player_team_code)
          console.log(`Found ${firstTeamPlayers.length} players for first team`)

          if (firstTeamPlayers.length > 0) {
            const firstPlayer = firstTeamPlayers[0]
            console.log(`Auto-selecting first player: ${firstPlayer.player_name}`)
            setSelectedPlayer(firstPlayer)
            loadPlayerData(firstPlayer)
          }
        }
      } catch (error) {
        console.error("Error loading teams:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, [currentSeason, league]) // Remove selectedTeam from dependencies to avoid infinite loop

  useEffect(() => {
    const loadLeagueAverages = async () => {
      const response = await fetch(`/api/shot-averages?season=${selectedSeason}&league=${league}`)
      const data = await response.json()
      setLeagueAveragesData(data.data || [])
    }
    loadLeagueAverages()
  }, [selectedSeason, league])

  // Load players when team is selected
  useEffect(() => {
    const loadPlayers = async () => {
      if (!selectedTeam) {
        console.log("No team selected, clearing players")
        setTeamPlayers([])
        return
      }

      console.log(`=== LOADING PLAYERS FOR TEAM: ${selectedTeam.player_team_name} ===`)
      setIsLoading(true)
      try {
        // Filter from all players (both RS and PO) for the selected team
        const filteredPlayers = allPlayers.filter(
          (player) => player.player_team_code === selectedTeam.player_team_code && player.phase === "Regular Season", // Show regular season players in team selection
        )
        console.log(`Found ${filteredPlayers.length} players for team ${selectedTeam.player_team_name}`)

        if (filteredPlayers.length > 0) {
          console.log("Sample players:")
          filteredPlayers.slice(0, 3).forEach((player) => {
            console.log(`- ${player.player_name} (${player.points_scored} PPG)`)
          })
        }

        setTeamPlayers(filteredPlayers)

        // Auto-select first player if no player is selected and we have players
        if (filteredPlayers.length > 0 && !selectedPlayer) {
          const firstPlayer = filteredPlayers[0]
          console.log(`Auto-selecting player: ${firstPlayer.player_name}`)
          setSelectedPlayer(firstPlayer)
          loadPlayerData(firstPlayer)
        }
      } catch (error) {
        console.error("Error loading players:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPlayers()
  }, [selectedTeam, allPlayers])

  // Function to load player data when a player is selected
  const loadPlayerData = (player: PlayerStatsFromGameLogs) => {
    console.log("=== LOADING PLAYER DATA ===")
    console.log("Player:", player.player_name)
    console.log("Team:", player.player_team_name)
    console.log("Points:", player.points_scored)
    console.log("Games:", player.games_played)

    // Update playerData with the selected player's information
    Object.assign(playerData, {
      name: player.player_name,
      team: player.player_team_name,
      teamAbbr: player.player_team_code,
      position: getPositionFromCode(player.player_id),
      number: "",
      height: "",
      weight: "",
      imageUrl: "", // Not available in pre-calculated stats
      teamLogoUrl:
        player.teamlogo || `/placeholder.svg?height=48&width=48&query=${player.player_team_name} basketball logo`,
      gamesPlayed: player.games_played,
      gamesStarted: player.games_started,
    })

    // Load year-over-year stats
    loadYearOverYearStats(player)

    // Trigger re-render
    setPlayerDataUpdated((prev) => prev + 1)
  }

  // Function to load year-over-year stats for the selected player
  const loadYearOverYearStats = async (player: PlayerStatsFromGameLogs) => {
    if (!player) return

    setYearOverYearLoading(true)
    try {
      console.log(`Loading year-over-year stats for player: ${player.player_name}`)

      // Fetch stats for all available seasons (2023, 2024, etc.)
      const seasons = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] // Add more seasons as needed
      const allSeasonStats: PlayerStatsFromGameLogs[] = []

      for (const season of seasons) {
        try {
          // Fetch regular season stats for each season
          const seasonStats = await fetchAllPlayerStatsFromGameLogs(season, "Regular Season", league)
          const playerSeasonStats = seasonStats.find((p) => p.player_name === player.player_name)

          if (playerSeasonStats) {
            allSeasonStats.push({
              ...playerSeasonStats,
              season: season, // Ensure season is included
            })
          }
        } catch (error) {
          console.log(`No data found for ${player.player_name} in ${season} season`)
        }
      }

      // Sort by season (most recent first)
      allSeasonStats.sort((a, b) => (b.season || 0) - (a.season || 0))

      console.log(`Found stats for ${allSeasonStats.length} seasons for ${player.player_name}`)
      setYearOverYearStats(allSeasonStats)
    } catch (error) {
      console.error("Error loading year-over-year stats:", error)
      setYearOverYearStats([])
    } finally {
      setYearOverYearLoading(false)
    }
  }
useEffect(() => {
  const handleClickOutside = (event) => {
    // Check if click is outside both dropdowns
    if (!event.target.closest('.team-dropdown-container')) {
      setIsTeamDropdownOpen(false)
      setIsPlayerDropdownOpen(false)
    }
  }

  // Add event listener when either dropdown is open
  if (isTeamDropdownOpen || isPlayerDropdownOpen) {
    document.addEventListener('mousedown', handleClickOutside)
  }

  // Cleanup
  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [isTeamDropdownOpen, isPlayerDropdownOpen])
  // Reset selections when season changes
  useEffect(() => {
    console.log("Season changed, resetting selections")
    setSelectedTeam(null)
    setSelectedPlayer(null)
    setTeamPlayers([])
  }, [selectedSeason])

  // Reset selections when league changes
  useEffect(() => {
    console.log("League changed, resetting selections")
    setSelectedTeam(null)
    setSelectedPlayer(null)
    setTeamPlayers([])
    setGameData([])

    // Auto-select first team and player for the new league
    const autoSelectFirstTeamAndPlayer = async () => {
      try {
        // Load teams for the new league
        const rsPlayers = await fetchAllPlayerStatsFromGameLogs(selectedSeason, "Regular Season", league)

        if (rsPlayers.length > 0) {
          // Extract unique teams
          const teams = rsPlayers.reduce(
            (acc, player) => {
              const existingTeam = acc.find((t) => t.player_team_code === player.player_team_code)
              if (!existingTeam) {
                acc.push({
                  player_team_name: player.player_team_name,
                  player_team_code: player.player_team_code,
                  season: selectedSeason,
                  phase: "RS",
                  teamlogo: player.teamlogo || "",
                })
              }
              return acc
            },
            [] as {
              player_team_name: string
              player_team_code: string
              season: number
              phase: string
              teamlogo?: string
            }[],
          )

          if (teams.length > 0) {
            const firstTeam = teams[0]
            console.log(`Auto-selecting first team for ${league}: ${firstTeam.player_team_name}`)
            setSelectedTeam(firstTeam)

            // Auto-select first player from first team
            const firstTeamPlayers = rsPlayers.filter(
              (player) => player.player_team_code === firstTeam.player_team_code,
            )

            if (firstTeamPlayers.length > 0) {
              const firstPlayer = firstTeamPlayers[0]
              console.log(`Auto-selecting first player for ${league}: ${firstPlayer.player_name}`)
              setSelectedPlayer(firstPlayer)
              loadPlayerData(firstPlayer)
            }
          }
        }
      } catch (error) {
        console.error("Error auto-selecting team and player for league change:", error)
      }
    }

    // Add a small delay to ensure state is reset before auto-selecting
    setTimeout(autoSelectFirstTeamAndPlayer, 100)
  }, [league, selectedSeason])

  // Load game logs for selected player
  useEffect(() => {
    const loadGameLogs = async () => {
      if (!selectedPlayer) {
        setGameData([])
        return
      }

      try {
        console.log("Loading game logs for:", selectedPlayer.player_name, "season:", selectedSeason)
        const logs = await fetchPlayerGameLogs(selectedPlayer.player_name, selectedSeason, league)
        console.log("Received game logs:", logs.length)

        setGameData(logs)
      } catch (error) {
        console.error("Error loading game logs:", error)
        setGameData([])
      }
    }

    loadGameLogs()
  }, [selectedPlayer, selectedSeason, league])

  // Filter game logs by selected phase
  const getFilteredGameLogs = useMemo(() => {
    if (selectedPhase === "All") {
      return gameData
    }
    return gameData.filter((game) => game.phase === selectedPhase)
  }, [gameData, selectedPhase])

  // Use pre-calculated player stats instead of calculating from game logs
  const getPlayersForRanking = () => {
    return allPlayers.filter((player) => player.phase === selectedPhaseToggle)
  }
  const calculatedPlayerStats = useMemo(() => {
    if (!selectedPlayer) {
      return {
        points_scored: 0,
        total_rebounds: 0,
        assists: 0,
        three_pointers_made: 0,
        steals: 0,
        blocks: 0,
        minutes_played: 0,
        two_pointers_made: 0,
        two_pointers_attempted: 0,
        three_pointers_attempted: 0,
        free_throws_made: 0,
        free_throws_attempted: 0,
        two_pointers_percentage: 0,
        three_pointers_percentage: 0,
        free_throws_percentage: 0,
        effective_field_goal_percentage: 0,
        pir: 0,
        assists_to_turnovers_ratio: 0,
        games_played: 0,
      }
    }

    // Find the player's stats for the selected phase
    const phaseSpecificStats = allPlayers.find(
      (player) => player.player_id === selectedPlayer.player_id && player.phase === selectedPhaseToggle,
    )

    const statsToUse = phaseSpecificStats || selectedPlayer

    // Use per-40 or per-game stats based on toggle
    const getStatValue = (perGameField: string, per40Field: string) => {
      if (statDisplayMode === "per_40") {
        return statsToUse[per40Field] || 0
      }
      return statsToUse[perGameField] || 0
    }

    // Calculate effective field goal percentage
    const totalFGA =
      getStatValue("two_pointers_attempted", "two_pointers_attempted_per_40") +
      getStatValue("three_pointers_attempted", "three_pointers_attempted_per_40")
    const totalFGM =
      getStatValue("two_pointers_made", "two_pointers_made_per_40") +
      getStatValue("three_pointers_made", "three_pointers_made_per_40")
    const effective_field_goal_percentage =
      totalFGA > 0
        ? ((totalFGM + 0.5 * getStatValue("three_pointers_made", "three_pointers_made_per_40")) / totalFGA) * 100
        : 0

    // Calculate assists to turnovers ratio
    const assists_to_turnovers_ratio =
      getStatValue("turnovers", "turnovers_per_40") > 0
        ? getStatValue("assists", "assists_per_40") / getStatValue("turnovers", "turnovers_per_40")
        : getStatValue("assists", "assists_per_40")

    return {
      points_scored: getStatValue("points_scored", "points_scored_per_40"),
      total_rebounds: getStatValue("total_rebounds", "total_rebounds_per_40"),
      assists: getStatValue("assists", "assists_per_40"),
      three_pointers_made: getStatValue("three_pointers_made", "three_pointers_made_per_40"),
      steals: getStatValue("steals", "steals_per_40"),
      blocks: getStatValue("blocks", "blocks_per_40"),
      minutes_played: statsToUse.minutes_played, // Always per game
      two_pointers_made: getStatValue("two_pointers_made", "two_pointers_made_per_40"),
      two_pointers_attempted: getStatValue("two_pointers_attempted", "two_pointers_attempted_per_40"),
      three_pointers_attempted: getStatValue("three_pointers_attempted", "three_pointers_attempted_per_40"),
      free_throws_made: getStatValue("free_throws_made", "free_throws_made_per_40"),
      free_throws_attempted: getStatValue("free_throws_attempted", "free_throws_attempted_per_40"),
      two_pointers_percentage: statsToUse.two_pointers_percentage,
      three_pointers_percentage: statsToUse.three_pointers_percentage,
      free_throws_percentage: statsToUse.free_throws_percentage,
      effective_field_goal_percentage,
      pir: getStatValue("pir", "pir_per_40"),
      assists_to_turnovers_ratio,
      games_played: statsToUse.games_played,
    }
  }, [selectedPlayer, selectedPhaseToggle, statDisplayMode, allPlayers])

  // Helper function to get stat value for a player from pre-calculated stats
  const getStatValueForPlayer = (player: PlayerStatsFromGameLogs, stat: StatType): number => {
    const getStatValue = (perGameField: string, per40Field: string) => {
      if (statDisplayMode === "per_40") {
        return Number(player[per40Field]) || 0
      }
      return Number(player[perGameField]) || 0
    }

    switch (stat) {
      case "points":
        return getStatValue("points_scored", "points_scored_per_40")
      case "rebounds":
        return getStatValue("total_rebounds", "total_rebounds_per_40")
      case "assists":
        return getStatValue("assists", "assists_per_40")
      case "threePointers":
        return getStatValue("three_pointers_made", "three_pointers_made_per_40")
      case "steals":
        return getStatValue("steals", "steals_per_40")
      case "blocks":
        return getStatValue("blocks", "blocks_per_40")
      default:
        return 0
    }
  }

  // Calculate the reference line value based on selected type
  const referenceLineValue = useMemo(() => {
    const filteredGames = getFilteredGameLogs

    switch (referenceLineType) {
      case "playerAvg":
        // Player average (existing logic)
        if (filteredGames.length === 0) return 0
        return filteredGames.reduce((sum, game) => sum + getStatValue(game, selectedStat), 0) / filteredGames.length

      case "best":
        // League leader (best average for the selected stat)
        if (!allPlayers.length) return 0
        const validPlayersForBest = allPlayers.filter((player) => {
          const value = getStatValueForPlayer(player, selectedStat)
          return !isNaN(value) && value >= 0 && Number(player.games_played) > 0
        })
        if (validPlayersForBest.length === 0) return 0
        return Math.max(...validPlayersForBest.map((player) => getStatValueForPlayer(player, selectedStat)))

      case "leagueAvg":
        // League average for the selected stat
        if (!allPlayers.length) return 0
        const validPlayersForAvg = allPlayers.filter((player) => {
          const value = getStatValueForPlayer(player, selectedStat)
          return !isNaN(value) && value >= 0 && Number(player.games_played) > 0
        })
        if (validPlayersForAvg.length === 0) return 0
        const total = validPlayersForAvg.reduce((sum, player) => sum + getStatValueForPlayer(player, selectedStat), 0)
        return total / validPlayersForAvg.length

      default:
        return 0
    }
  }, [getFilteredGameLogs, selectedStat, referenceLineType, allPlayers, statDisplayMode])

  // Get the reference line label
  const getReferenceLineLabel = () => {
    switch (referenceLineType) {
      case "best":
        return "Best"
      case "playerAvg":
        return "Avg"
      case "leagueAvg":
        return "League"
      default:
        return "Avg"
    }
  }

  // Calculate ranks for the selected player using pre-calculated stats
  const playerRanks = useMemo(() => {
    console.log("=== CALCULATING PLAYER RANKS ===")
    console.log("Selected player:", selectedPlayer?.player_name)
    console.log("Selected phase:", selectedPhase)
    console.log("Players for ranking:", getPlayersForRanking().length)

    if (!selectedPlayer || !getPlayersForRanking().length) return {}

    const calculatePercentileRank = (statKey: keyof PlayerStatsFromGameLogs, higherIsBetter = true) => {
      const validPlayers = getPlayersForRanking().filter((player) => {
        const value = safeNumber(player[statKey])
        // For percentage stats, require value > 0, for counting stats, allow 0
        if (
          statKey.includes("percentage") ||
          statKey === "effective_field_goal_percentage" ||
          statKey === "assists_to_turnovers_ratio"
        ) {
          return value > 0 && !isNaN(value)
        }
        return !isNaN(value) && value >= 0
      })

      if (validPlayers.length === 0) return null

      // Sort players by the stat value
      const sortedPlayers = validPlayers.sort((a, b) => {
        const aValue = safeNumber(a[statKey])
        const bValue = safeNumber(b[statKey])
        return higherIsBetter ? bValue - aValue : aValue - bValue
      })

      // Find the current player's rank (1-based)
      const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1

      return {
        rank: playerRank > 0 ? playerRank : sortedPlayers.length,
        total: sortedPlayers.length,
        isTopTier: playerRank <= Math.ceil(sortedPlayers.length * 0.10) && playerRank > 0,
        percentile:
          playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0,
      }
    }

    return {
      points: calculatePercentileRank("points_scored_per_40"),
      rebounds: calculatePercentileRank("total_rebounds_per_40"),
      assists: calculatePercentileRank("assists_per_40"),
      threePointers: calculatePercentileRank("three_pointers_made_per_40"),
      steals: calculatePercentileRank("steals_per_40"),
      blocks: calculatePercentileRank("blocks_per_40"),
      effectiveFieldGoal: calculatePercentileRank("three_pointers_percentage"), // Using 3P% as proxy
      pir: calculatePercentileRank("pir_per_40"),
      assistToTurnover: calculatePercentileRank("assists_per_40"), // Simplified since we don't have turnovers in pre-calc
      minutes: calculatePercentileRank("minutes_played"),
      twoPointPercentage: calculatePercentileRank("two_pointers_percentage"),
      threePointPercentage: calculatePercentileRank("three_pointers_percentage"),
      freeThrowPercentage: calculatePercentileRank("free_throws_percentage"),
      offensiveRebounds: calculatePercentileRank("offensive_rebounds_per_40"),
      defensiveRebounds: calculatePercentileRank("defensive_rebounds_per_40"),
    }
  }, [selectedPlayer, allPlayers, selectedPhase, selectedPhaseToggle])

  const loadShotData = async () => {
    if (!selectedPlayer) return

    setShotDataLoading(true)
    try {
      console.log(
        `Loading shot data for player: ${selectedPlayer.player_id}, name: ${selectedPlayer.player_name}, season: ${selectedSeason}`,
      )

      // Pass both player ID and name to increase chances of finding data
      const response = await fetch(
        `/api/shot-data?playerId=${selectedPlayer.player_id}&playerName=${encodeURIComponent(selectedPlayer.player_name)}&season=${selectedSeason}&league=${league}`,
      )

      if (response.ok) {
        const data = await response.json()
        console.log("Shot data response:", data)
        console.log("Debug info:", data.debug)
        setShotData(data.data || [])
      } else {
        console.error("Failed to load shot data")
        setShotData([])
      }
    } catch (error) {
      console.error("Error loading shot data:", error)
      setShotData([])
    } finally {
      setShotDataLoading(false)
    }
  }

  const getReferenceLines = (selectedStat) => {
    const referenceLines = {
      points: {
        points10: 10,
        points15: 15,
        points20: 20,
        points25: 25,
      },
      assists: {
        ast4: 4,
        ast6: 6,
        ast8: 8,
        ast10: 10,
      },
      rebounds: {
        reb4: 4,
        reb6: 6,
        reb8: 8,
        reb10: 10,
      },
      threePointers: {
        "3pt1": 1,
        "3pt2": 2,
        "3pt3": 3,
        "3pt4": 4,
      },
      blocks: {
        blk1: 1,
        blk2: 2,
        blk3: 3,
        blk4: 4,
      },
      steals: {
        stl1: 1,
        stl2: 2,
        stl3: 3,
        stl4: 4,
      },
    }
    return referenceLines[selectedStat] || {}
  }

  const getCustomReferenceLineValue = (selectedStat, selectedCustomReferenceLine) => {
    const lines = getReferenceLines(selectedStat)
    return lines[selectedCustomReferenceLine] || 0
  }

  useEffect(() => {
    if (selectedPlayer) {
      loadShotData()
    }
  }, [selectedPlayer, selectedSeason, league])

  // Calculate zone statistics from shot data
  const zoneStatistics = useMemo(() => {
    if (!shotData.length) return []

    // Group shots by zone
    const zoneGroups = shotData.reduce((acc, shot) => {
      const zone = shot.zone || "Unknown"
      if (!acc[zone]) {
        acc[zone] = { made: 0, attempted: 0, zone }
      }
      acc[zone].attempted++
      if (shot.points > 0) {
        acc[zone].made++
      }
      return acc
    }, {})

    // Convert to array and calculate percentages
    return Object.values(zoneGroups)
      .map((zone: any) => ({
        ...zone,
        percentage: zone.attempted > 0 ? (zone.made / zone.attempted) * 100 : 0,
      }))
      .sort((a, b) => b.attempted - a.attempted) // Sort by most attempts
  }, [shotData])

// Spider Chart Component
const PlayerSpiderChart = ({ className }) => {
  const chartId = Math.random().toString(36).substr(2, 9) // Generate unique ID for gradients
  if (!selectedPlayer || !playerRanks) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500 text-sm">
          <div className="mb-2">📊</div>
          <div>Select a player to view</div>
          <div className="text-xs mt-1">performance radar</div>
        </div>
      </div>
    )
  }

  // Calculate percentiles for per-40 stats
  const calculatePercentileForStat = (statKey: keyof PlayerStatsFromGameLogs, higherIsBetter = true) => {
    const validPlayers = getPlayersForRanking().filter((player) => {
      const value = safeNumber(player[statKey])
      // For percentage stats, require value > 0, for counting stats, allow 0
      if (statKey.includes("percentage")) {
        return value > 0 && !isNaN(value)
      }
      return !isNaN(value) && value >= 0
    })

    if (validPlayers.length === 0) return 50

    // Sort players by the stat value
    const sortedPlayers = validPlayers.sort((a, b) => {
      const aValue = safeNumber(a[statKey])
      const bValue = safeNumber(b[statKey])
      return higherIsBetter ? bValue - aValue : aValue - bValue
    })

    // Find the current player's rank (1-based)
    const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1

    const percentile =
      playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0
    return Math.max(1, percentile) // Ensure minimum of 1% for visibility
  }

  // Calculate turnovers per 40 percentile (lower is better)
  const calculateTurnoversPercentile = () => {
    const validPlayers = getPlayersForRanking().filter((player) => {
      const value = safeNumber(player.turnovers_per_40)
      return !isNaN(value) && value >= 0
    })

    if (validPlayers.length === 0) return 50

    const sortedPlayers = validPlayers.sort((a, b) => {
      const aValue = safeNumber(a.turnovers_per_40)
      const bValue = safeNumber(b.turnovers_per_40)
      return aValue - bValue // Lower is better for turnovers
    })

    const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1
    const percentile =
      playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0
    return Math.max(1, percentile)
  }

  // Calculate eFG% percentile using proper formula
  const calculateEFGPercentile = () => {
    const validPlayers = getPlayersForRanking().filter((player) => {
      const twoPtA = safeNumber(player.two_pointers_attempted_per_40)
      const threePtA = safeNumber(player.three_pointers_attempted_per_40)
      const fga = twoPtA + threePtA
      const twoPtM = safeNumber(player.two_pointers_made_per_40)
      const threePtM = safeNumber(player.three_pointers_made_per_40)
      return !isNaN(fga) && !isNaN(twoPtM) && !isNaN(threePtM) && fga > 0
    })

    if (validPlayers.length === 0) return 50

    const sortedPlayers = validPlayers.sort((a, b) => {
      // Calculate FGM = 2PM + 3PM
      const aFGM = safeNumber(a.two_pointers_made_per_40) + safeNumber(a.three_pointers_made_per_40)
      const bFGM = safeNumber(b.two_pointers_made_per_40) + safeNumber(b.three_pointers_made_per_40)

      // Calculate FGA = 2PA + 3PA
      const aFGA = safeNumber(a.two_pointers_attempted_per_40) + safeNumber(a.three_pointers_attempted_per_40)
      const bFGA = safeNumber(b.two_pointers_attempted_per_40) + safeNumber(b.three_pointers_attempted_per_40)

      // Calculate eFG% = (FGM + 0.5 * 3PM) / FGA
      const aEFG = (aFGM + 0.5 * safeNumber(a.three_pointers_made_per_40)) / aFGA
      const bEFG = (bFGM + 0.5 * safeNumber(b.three_pointers_made_per_40)) / bFGA

      return bEFG - aEFG // Higher eFG% is better
    })

    const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1
    const percentile = playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0
    return Math.max(1, percentile)
  }
  const calculateAstToRatioPercentile = () => {
    const validPlayers = getPlayersForRanking().filter((player) => {
      const assists = safeNumber(player.assists_per_40)
      const turnovers = safeNumber(player.turnovers_per_40)
      return !isNaN(assists) && !isNaN(turnovers) && assists >= 0 && turnovers > 0
    })

    if (validPlayers.length === 0) return 50

    const sortedPlayers = validPlayers.sort((a, b) => {
      const aRatio = safeNumber(a.assists_per_40) / safeNumber(a.turnovers_per_40)
      const bRatio = safeNumber(b.assists_per_40) / safeNumber(b.turnovers_per_40)
      return bRatio - aRatio // Higher ratio is better
    })

    const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1
    const percentile = playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0
    return Math.max(1, percentile)
  }

  // Calculate combined stats
  const calculateStocksPercentile = () => {
    const validPlayers = getPlayersForRanking().filter((player) => {
      const steals = safeNumber(player.steals_per_40)
      const blocks = safeNumber(player.blocks_per_40)
      return !isNaN(steals) && !isNaN(blocks) && steals >= 0 && blocks >= 0
    })

    if (validPlayers.length === 0) return 50

    const sortedPlayers = validPlayers.sort((a, b) => {
      const aStocks = safeNumber(a.steals_per_40) + safeNumber(a.blocks_per_40)
      const bStocks = safeNumber(b.steals_per_40) + safeNumber(b.blocks_per_40)
      return bStocks - aStocks
    })

    const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1
    const percentile = playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0
    return Math.max(1, percentile)
  }

  const calculateReboundsPercentile = () => {
    const validPlayers = getPlayersForRanking().filter((player) => {
      const oReb = safeNumber(player.offensive_rebounds_per_40)
      const dReb = safeNumber(player.defensive_rebounds_per_40)
      return !isNaN(oReb) && !isNaN(dReb) && oReb >= 0 && dReb >= 0
    })

    if (validPlayers.length === 0) return 50

    const sortedPlayers = validPlayers.sort((a, b) => {
      const aRebs = safeNumber(a.offensive_rebounds_per_40) + safeNumber(a.defensive_rebounds_per_40)
      const bRebs = safeNumber(b.offensive_rebounds_per_40) + safeNumber(b.defensive_rebounds_per_40)
      return bRebs - aRebs
    })

    const playerRank = sortedPlayers.findIndex((player) => player.player_id === selectedPlayer.player_id) + 1
    const percentile = playerRank > 0 ? Math.round(((sortedPlayers.length - playerRank + 1) / sortedPlayers.length) * 100) : 0
    return Math.max(1, percentile)
  }

  const playerSpiderData = {
    stats: {
      points: playerRanks.points?.percentile || calculatePercentileForStat("points_scored_per_40"),
      eFG: playerRanks.threePointPercentage?.percentile || calculateEFGPercentile(),
      pir: playerRanks.pir?.percentile || calculatePercentileForStat("pir_per_40"),
      astToRatio: playerRanks.assistToTurnover?.percentile || calculateAstToRatioPercentile(),
      stocks: ((playerRanks.steals?.percentile || 0) + (playerRanks.blocks?.percentile || 0)) / 2 || calculateStocksPercentile(),
      rebounds: playerRanks.rebounds?.percentile || calculateReboundsPercentile(),
    },
  }

  const categories = [
    { key: "points", label: "PTS", angle: 0 },
    { key: "eFG", label: "eFG%", angle: 60 },
    { key: "pir", label: "PIR", angle: 120 },
    { key: "rebounds", label: "REB", angle: 180 },
    { key: "stocks", label: "STOCK", angle: 240 },
    { key: "astToRatio", label: "AST/TO", angle: 300 },
  ]

  const center = 210
  const maxRadius = 140
  const labelRadius = maxRadius + 15

  // Calculate points for the polygon
  const points = categories
    .map((category) => {
      const value = playerSpiderData.stats[category.key]
      const radius = (value / 100) * maxRadius
      const angleRad = (category.angle * Math.PI) / 180
      const x = center + radius * Math.cos(angleRad - Math.PI / 2)
      const y = center + radius * Math.sin(angleRad - Math.PI / 2)
      return `${x},${y}`
    })
    .join(" ")

  const teamColor = getTeamBorderColor(playerData.teamAbbr) || '#bf5050'

  return (
    <div className={`flex items-start justify-center h-full w-full pt-4 ${className}`}>
      <div className="bg-light-beige rounded-lg" style={{ width: "100%", height: "100%" }}>
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          <svg viewBox="0 0 420 420" className="absolute inset-0 w-full h-full rounded-lg">
            {/* Gradient Definitions */}
            <defs>
              <radialGradient id={`backgroundGradient-${chartId}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8fafc" stopOpacity="1" />
                <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
              </radialGradient>
              <linearGradient id={`dataFill-${chartId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={teamColor} stopOpacity="0.1" />
                <stop offset="50%" stopColor={teamColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={teamColor} stopOpacity="0.15" />
              </linearGradient>
              <filter id={`softGlow-${chartId}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={`shadow-${chartId}`}>
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={maxRadius}
              fill={`url(#backgroundGradient-${chartId})`}
              stroke="none"
            />

            {/* Grid circles with better styling */}
            {[20, 40, 60, 80, 100].map((percent, index) => (
              <circle
                key={percent}
                cx={center}
                cy={center}
                r={(percent / 100) * maxRadius}
                fill="none"
                stroke={percent === 100 ? "#cbd5e1" : "#e2e8f0"}
                strokeWidth={percent === 100 ? "2.5" : "1.5"}
                strokeDasharray={percent === 100 ? "none" : "4,4"}
                opacity={percent === 100 ? 1 : 0.6}
              />
            ))}

            {/* Percentage labels on grid */}
            {[20, 40, 60, 80].map((percent) => (
              <text
                key={`grid-${percent}`}
                x={center}
                y={center - (percent / 100) * maxRadius - 8}
                textAnchor="center"
                className="text-[10px] font-medium fill-gray-400"
              >
                {percent}
              </text>
            ))}

            {/* Grid lines with softer appearance */}
            {categories.map((category) => {
              const angleRad = (category.angle * Math.PI) / 180
              const x2 = center + maxRadius * Math.cos(angleRad - Math.PI / 2)
              const y2 = center + maxRadius * Math.sin(angleRad - Math.PI / 2)
              return (
                <line
                  key={category.key}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              )
            })}

            {/* Player data polygon with enhanced styling */}
            <polygon
              points={points}
              fill={`url(#dataFill-${chartId})`}
              stroke={teamColor}
              strokeWidth="4"
              strokeOpacity="0.9"
              filter={`url(#softGlow-${chartId})`}
              style={{ filter: `url(#shadow-${chartId})` }}
            />

            {/* Data points with percentile labels directly on them */}
            {categories.map((category) => {
              const value = playerSpiderData.stats[category.key]
              const radius = (value / 100) * maxRadius
              const angleRad = (category.angle * Math.PI) / 180
              const x = center + radius * Math.cos(angleRad - Math.PI / 2)
              const y = center + radius * Math.sin(angleRad - Math.PI / 2)
              return (
                <g key={category.key}>
                  {/* Data point circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="9"
                    fill={teamColor}
                    stroke="#000000"
                    strokeWidth="1.5"
                    filter="url(#shadow)"
                  />
                  {/* Percentile label on the data point */}
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-bold fill-white"
                    style={{ textShadow: "1px 1px 1px rgba(0,0,0,0.5)" }}
                  >
                    {value}
                  </text>
                </g>
              )
            })}

            {/* Category labels with better positioning */}
            {categories.map((category) => {
              const angleRad = (category.angle * Math.PI) / 180
              const x = center + labelRadius * Math.cos(angleRad - Math.PI / 2)
              const y = center + labelRadius * Math.sin(angleRad - Math.PI / 2)

              // Adjust text anchor based on position
              let textAnchor = "middle"
              if (x < center - 10) textAnchor = "end"
              else if (x > center + 10) textAnchor = "start"

              return (
                <text
                  key={category.key}
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  className="text-xs font-semibold fill-gray-700"
                >
                  {category.label}
                </text>
              )
            })}

            {/* Enhanced center point */}
            <circle
              cx={center}
              cy={center}
              r="12"
              fill={teamColor}
              opacity="0.2"
              filter="url(#softGlow)"
            />
            <circle
              cx={center}
              cy={center}
              r="6"
              fill={teamColor}
              opacity="0.9"
            />
          </svg>
        </div>
      </div>
    </div>
  )
} 
const PlayerTeamSelector = () => {
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false)

  const getTeamColorStyles = (teamCode: string) => {
    const bgColor = teamColors[teamCode] || "bg-gray-600"
    
    return { backgroundColor: bgColor || "#6b7280" }
  }

  const selectedTeamColor = selectedTeam ? getTeamColorStyles(selectedTeam.player_team_code).backgroundColor : "#6b7280"

  return (
    <div className="bg-black shadow-md rounded-xl relative mt-1 -mb-3 team-dropdown-container">
      <div className="w-full text-left">
        <div
          className="rounded-xl overflow-hidden shadow-xl w-full hover:shadow-xl transition-shadow"
          style={{
            border: `1px solid black`,
            backgroundColor: selectedTeamColor,
          }}
        >
          <div className="flex flex-row items-center p-1.5">
            {/* Team Logo Section - Clickable */}
            <button 
              onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
              className="flex items-center flex-shrink-0 border-r border-gray-200 pr-2 cursor-pointer"
            >
              {/* Team Logo */}
              <div className="flex-shrink-0 mr-2">
                {(() => {
                  const selectedLogoUrl = selectedTeam?.teamlogo || ""

                  return selectedLogoUrl ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg shadow-sm">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-light-beige rounded-lg flex items-center justify-center p-0.5"
                        style={{
                          border: "1px solid black",
                          backgroundColor: "white",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <img
                          src={selectedLogoUrl || "/placeholder.svg"}
                          alt={`${selectedTeam?.player_team_name} logo`}
                          className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm"
                      style={{
                        backgroundColor: "white",
                        color: selectedTeamColor,
                        border: `1px solid black`,
                      }}
                    >
                      {selectedTeam?.player_team_name
                        ?.split(" ")
                        .map((word) => word[0])
                        .join("") || "?"}
                    </div>
                  )
                })()}
              </div>

              {/* Team Dropdown arrow */}
              <div className="ml-1">
                <ChevronDown
                  className={`h-4 w-4 text-white transition-transform ${isTeamDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Player Name Section - Clickable */}
            <button 
              onClick={() => setIsPlayerDropdownOpen(!isPlayerDropdownOpen)}
              className="flex items-center flex-grow pl-2 cursor-pointer min-w-0"
            >
              {/* Player Name - starts immediately after separator */}
              <div className="flex items-center whitespace-nowrap flex-grow min-w-0">
                <span
                  className="text-sm sm:text-base md:text-lg font-bold whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{
                    color: "white",
                    textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                  }}
                >
                  {selectedPlayer?.player_name || "Select Player"}
                </span>
              </div>

              {/* Player Dropdown arrow */}
              <div className="ml-1 flex-shrink-0">
                <ChevronDown
                  className={`h-4 w-4 text-white transition-transform ${isPlayerDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Team dropdown menu */}
      {isTeamDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {availableTeams.map((team) => {
            const logoUrl = team.teamlogo || ""
            const isSelected = team.player_team_code === selectedTeam?.player_team_code

            return (
              <button
                key={team.player_team_code}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTeam(team)
                  setSelectedPlayer(null)
                  setIsTeamDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                }`}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl || "/placeholder.svg"}
                    alt={`${team.player_team_name} logo`}
                    className="w-5 h-5 mr-2 object-contain"
                  />
                ) : (
                  <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-xs mr-2">
                    {team.player_team_name
                      ?.split(" ")
                      .map((word) => word[0])
                      .join("") || "?"}
                  </div>
                )}
                <span className={`font-medium text-sm ${isSelected ? "text-gray-900" : "text-black-900"}`}>
                  {team.player_team_name}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Player dropdown menu */}
      {isPlayerDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
          {teamPlayers.map((player) => {
            const isSelected = player.player_id === selectedPlayer?.player_id

            return (
              <button
                key={player.player_id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlayer(player)
                  loadPlayerData(player)
                  setIsPlayerDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                }`}
              >
                <span className={`font-medium text-sm ${isSelected ? "text-gray-900" : "text-black-900"}`}>
                  {player.player_name}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

  const FilterPlayerHeader = () => {
    return (
      <div className="flex flex-col lg:flex-row gap-4 w-full bg-light-beige">
        {/* Main Content Container - 75% width */}
       
        <Card className="overflow-hidden bg-green-500 flex-[3] mb-2">
          {/* Team color accent stripe at top for player header part - This remains the ONLY top stripe */}
          <div
                className="w-full h-2 rounded-t-lg border-b border-black -mb-1"
                style={{
                  backgroundColor: getTeamBorderColor(playerData.teamAbbr),
                }}
              />

          <div className="px-2 pb-2 pt-1">
  {/* Filter Bar - Team, Player, Phase, and Stat Mode - Hidden on mobile */}
  <div className="hidden md:block">
    <div className="flex items-center gap-1 md:gap-4 mb-1 w-full">
      <div className="flex items-center gap-4 mb-4 w-full">
        {/* Team Selection */}
        <div className="flex-1">
          <Select
            value={selectedTeam?.player_team_code || ""}
            onValueChange={(value) => {
              console.log("Team selection changed to:", value)
              const team = availableTeams.find((t) => t.player_team_code === value)
              console.log("Found team:", team)
              setSelectedTeam(team || null)
              setSelectedPlayer(null)
            }}
          >
            <SelectTrigger className="w-full h-7 text-sm border-2 border-gray-300 bg-gray-100 shadow-sm rounded-md">
              <SelectValue placeholder="Select Team">
                {selectedTeam && (
                  <div className="flex items-center gap-2">
                    {/* Team Logo in SelectTrigger */}
                    {selectedTeam.player_team_code && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-light-beige rounded-md border border-gray-300 shadow-sm">
                          {getTeamLogo(selectedTeam.player_team_code, selectedTeam.player_team_logo_url, "w-full h-full")}
                        </div>
                      </div>
                    )}
                    <span className="text-[9px] md:text-xs font-medium">{selectedTeam.player_team_name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map((team) => (
                <SelectItem key={team.player_team_code} value={team.player_team_code}>
                  <div className="flex items-center gap-2">
                    {/* Team Logo in SelectItem */}
                    {team.player_team_code && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-light-beige rounded-md border border-gray-300 shadow-sm">
                          {getTeamLogo(team.player_team_code, team.player_team_logo_url, "w-full h-full")}
                        </div>
                      </div>
                    )}
                    <span className="text-[9px] md:text-xs">{team.player_team_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player Selection */}
        <div className="flex-1">
          <Select
            value={selectedPlayer?.player_id || ""}
            onValueChange={(value) => {
              console.log("Player selection changed to:", value)
              const player = teamPlayers.find((p) => p.player_id === value)
              console.log("Found player:", player)
              if (player) {
                setSelectedPlayer(player)
                loadPlayerData(player)
              }
            }}
            disabled={!selectedTeam}
          >
            <SelectTrigger
              className={`w-full h-7 text-sm border-2 border-gray-300 bg-gray-100 shadow-sm rounded-md ${
                !selectedTeam ? "opacity-50" : ""
              }`}
            >
              <SelectValue placeholder="Select Player">
                {selectedPlayer && (
                  <div className="">
                    <span className="text-[9px] md:text-xs font-medium">{selectedPlayer.player_name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {teamPlayers.map((player) => (
                <SelectItem key={player.player_id} value={player.player_id}>
                  <div className="">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[9px] md:text-xs font-medium">{player.player_name}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Phase Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 border-2 border-gray-300 rounded-lg p-1">
        <button
          onClick={() => setSelectedPhaseToggle("Regular Season")}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedPhaseToggle === "Regular Season"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          RS
        </button>
        <button
          onClick={() => setSelectedPhaseToggle("Playoffs")}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            selectedPhaseToggle === "Playoffs" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          PO
        </button>
      </div>
    </div>

    {/* Divider Line */}
    <div className="w-full h-px bg-gray-300 mb-4"></div>
  </div>
            {/* Player Header - Full width */}
            <div className="w-full">
      {/* Main section for Player Image, Name, Team, and Basic Stats */}
      <div className="flex items-start w-full">
        {/* Player Name, Team Name, and Basic Stats - No Image */}
        <div className="flex flex-col flex-grow">
          <div className="flex flex-col w-full relative">
            {/* Logo and Name Row */}
            <div className="flex items-start gap-2 sm:gap-3 pb-2 ml-1 md:ml-0 mt-2">
              {/* Team Logo - positioned to the left of player/team name */}
              {playerData.teamAbbr && (
                <div className="flex-shrink-0 ">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-12 xl:h-12 bg-light-beige">
                    {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <h2 className="text-md md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 leading-tight truncate">
                  {playerData.name || "Select Player"}
                </h2>
                {/* Team Name */}
                {playerData.teamAbbr && (
                  <span className="text-[10px] md:text-md lg:text-lg xl:text-xl font-semibold text-gray-700 truncate mb-1 md:mb-0">
                    {playerData.team}
                  </span>
                )}
              </div>
            </div>

            {/* Basic Stats Row - Mobile: show below name, all stats compact */}
            <div className="flex md:hidden items-center gap-0.5 flex-wrap justify-start ">
              <div className="border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">GP</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {calculatedPlayerStats ? calculatedPlayerStats.games_played : 0}
                </div>
              </div>
              <div className="border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">GS</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {
                    getFilteredGameLogs.filter(
                      (game) => game.is_starter === 1 || game.is_starter === true || game.is_starter === "1",
                    ).length
                  }
                </div>
              </div>
              <div className="border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">MIN</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.minutes_played) : "0.0"}
                </div>
              </div>
              <div className="border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">TO</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {selectedPlayer ? safeFormat(selectedPlayer.turnovers) : "0.0"}
                </div>
              </div>
              <div className=" border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">2P%</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.two_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">3P%</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.three_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[7px] font-bold text-gray-600 uppercase tracking-wide">FT%</div>
                <div className="text-[9px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.free_throws_percentage) : "0.0"}
                </div>
              </div>
            </div>

            {/* Desktop Basic Stats - Keep original position and styling */}
            <div className="hidden md:flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 flex-wrap justify-end flex-shrink-0 absolute top-0 right-0">
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  GP
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? calculatedPlayerStats.games_played : 0}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  GS
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {
                    getFilteredGameLogs.filter(
                      (game) => game.is_starter === 1 || game.is_starter === true || game.is_starter === "1",
                    ).length
                  }
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  MIN
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.minutes_played) : "0.0"}
                </div>
              </div>

              {/* Additional stats - Hidden until medium screens */}
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  TO
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {selectedPlayer ? safeFormat(selectedPlayer.turnovers) : "0.0"}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  2P%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.two_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  3P%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.three_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  FT%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.free_throws_percentage) : "0.0"}
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Grid - Mobile: 6 columns with STL/BLK, Desktop: original responsive sizing */}
          <div className="grid grid-cols-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 w-full mt-2 sm:mt-2">
            {/* Points */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl py-2 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-center sm:min-h-auto md:min-h-[60px] ${
                selectedStat === "points"
                  ? `border-2 ${playerRanks?.points?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
                  : `border-gray-300 ${playerRanks?.points?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
              }`}
              style={selectedStat === "points" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("points")}
            >
              <div className="text-[10px] sm:text-[10px] md:text-[10px] font-bold text-gray-700 mb-1 sm:mb-0.5">PTS</div>
              <div className="flex items-center justify-center text-sm sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.points_scored) : "0.0"}
                {playerRanks?.points?.isTopTier && (
                  <Flame className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 md:ml-1" />
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                  {playerRanks?.points ? `#${playerRanks.points.rank} of ${playerRanks.points.total} ` : "N/A"}
                </span>
              </div>
            </div>

            {/* Rebounds */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl py-2 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-center sm:min-h-auto md:min-h-[60px] ${
                selectedStat === "rebounds"
                  ? `border-2 ${playerRanks?.rebounds?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
                  : `border-gray-300 ${playerRanks?.rebounds?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
              }`}
              style={selectedStat === "rebounds" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("rebounds")}
            >
              <div className="text-[10px] sm:text-[10px] md:text-[10px] font-bold text-gray-700 mb-1 sm:mb-0.5">REB</div>
              <div className="flex items-center justify-center text-sm sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.total_rebounds) : "0.0"}
                {playerRanks?.rebounds?.isTopTier && (
                  <Flame className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 md:ml-1" />
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5  md:px-1.5 py-0 sm:py-0.5 rounded-full">
                  {playerRanks?.rebounds ? `#${playerRanks.rebounds.rank} of ${playerRanks.rebounds.total} ` : "N/A"}
                </span>
              </div>
            </div>

            {/* Assists */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl py-2 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-auto ${
                selectedStat === "assists"
                  ? `border-2 ${playerRanks?.assists?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
                  : `border-gray-300 ${playerRanks?.assists?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
              }`}
              style={selectedStat === "assists" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("assists")}
            >
              <div className="text-[10px] sm:text-[10px] md:text-[10px] font-bold text-gray-700 mb-1 sm:mb-0.5">AST</div>
              <div className="flex items-center justify-center text-sm sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.assists) : "0.0"}
                {playerRanks?.assists?.isTopTier && (
                  <Flame className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 md:ml-1" />
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                  {playerRanks?.assists ? `#${playerRanks.assists.rank} of ${playerRanks.assists.total} ` : "N/A"}
                </span>
              </div>
            </div>

            {/* 3PM */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl py-2 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-auto ${
                selectedStat === "threePointers"
                  ? `border-2 ${playerRanks?.threePointers?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
                  : `border-gray-300 ${playerRanks?.threePointers?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
              }`}
              style={selectedStat === "threePointers" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("threePointers")}
            >
              <div className="text-[10px] sm:text-[10px] md:text-[10px] font-bold text-gray-700 mb-1 sm:mb-0.5">3PM</div>
              <div className="flex items-center justify-center text-sm sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.three_pointers_made) : "0.0"}
                {playerRanks?.threePointers?.isTopTier && (
                  <Flame className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 md:ml-1" />
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                  {playerRanks?.threePointers
                    ? `#${playerRanks.threePointers.rank} of ${playerRanks.threePointers.total} `
                    : "N/A"}
                </span>
              </div>
            </div>

            {/* Steals - Now visible on mobile */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl py-2 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-auto ${
                selectedStat === "steals"
                  ? `border-2 ${playerRanks?.steals?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
                  : `border-gray-300 ${playerRanks?.steals?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
              }`}
              style={selectedStat === "steals" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("steals")}
            >
              <div className="text-[10px] sm:text-[10px] md:text-[10px] font-bold text-gray-700 mb-1 sm:mb-0.5">STL</div>
              <div className="flex items-center justify-center text-sm sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.steals) : "0.0"}
                {playerRanks?.steals?.isTopTier && (
                  <Flame className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 md:ml-1" />
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5  md:px-1.5 py-0 sm:py-0.5 rounded-full">
                  {playerRanks?.steals ? `#${playerRanks.steals.rank} of ${playerRanks.steals.total} ` : "N/A"}
                </span>
              </div>
            </div>

            {/* Blocks - Now visible on mobile */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl py-2 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer flex flex-col justify-center min-h-[60px] sm:min-h-auto ${
                selectedStat === "blocks"
                  ? `border-2 ${playerRanks?.blocks?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
                  : `border-gray-300 ${playerRanks?.blocks?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`
              }`}
              style={selectedStat === "blocks" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("blocks")}
            >
              <div className="text-[10px] sm:text-[10px] md:text-[10px] font-bold text-gray-700 mb-1 sm:mb-0.5">BLK</div>
              <div className="flex items-center justify-center text-sm sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-1 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.blocks) : "0.0"}
                {playerRanks?.blocks?.isTopTier && (
                  <Flame className="h-3 w-3 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 md:ml-1" />
                )}
              </div>
              <div className="flex justify-center">
                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5  md:px-1.5 py-0 sm:py-0.5 rounded-full">
                  {playerRanks?.blocks ? `#${playerRanks.blocks.rank} of ${playerRanks.blocks.total}` : "N/A"}
                </span>
              </div>
            </div>

            {/* PIR (Player Index Rating) - Hidden on mobile, visible on sm+ */}
            <div
              className={`hidden sm:block border-2 border-gray-300 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5 sm:px-1 text-center shadow-lg hover:shadow-xl transition-shadow ${playerRanks?.pir?.isTopTier ? "bg-orange-100" : "bg-light-beige"}`}
            >
              <div className="text-[8px] md:text-[10px] font-bold text-gray-700 mb-0.5">PIR</div>
              <div className="flex items-center justify-center text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.pir) : "0.0"}
                {playerRanks?.pir?.isTopTier && (
                  <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0.5" />
                )}
              </div>
              <span className="text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-1 md:px-1.5 py-0.5 rounded-full">
                {playerRanks?.pir ? `#${playerRanks.pir.rank} of ${playerRanks.pir.total} ` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
            {/* Divider before Rolling Stats (optional, but good for visual separation) */}
<div className="w-full h-px bg-gray-200 my-2"></div>

<div className="">
  <div
    className="relative bg-white rounded-lg border shadow-md p-3 h-54"
    style={{ borderColor: getTeamBorderColor(playerData.teamAbbr), borderWidth: '2px' }}
  >
    {/* Controls Container - Single Row on Desktop, Stacked on Mobile */}
    <div className="flex flex-row items-center justify-between gap-2 mb-3">
      {/* Moving Average Controls */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700">Moving Avg:</span>
        <div className="flex gap-1">
          {[3, 5, 10].map((window) => (
            <button
              key={window}
              onClick={() => setMovingAverageWindow(window)}
              className={`px-2 py-1 text-xs rounded-md border transition-all duration-200 ${
                movingAverageWindow === window
                  ? 'text-white shadow-sm font-medium'
                  : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
              style={
                movingAverageWindow === window
                  ? {
                      backgroundColor: getTeamBorderColor(playerData.teamAbbr),
                      borderColor: getTeamBorderColor(playerData.teamAbbr),
                    }
                  : {}
              }
            >
              {window}G
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Rolling Average Title */}
      <div className="flex sm:hidden items-center gap-2 bg-light-beige">
        <span className="text-xs font-semibold text-black -mt-0.5 md:mt-0">Moving Average</span>
      </div>

      {/* Reference Line Controls - Removed playerAvg option */}
      <div className="flex items-center gap-0.5 md:gap-2 flex-nowrap">
        <span className="text-[10px] md:text-xs font-medium text-gray-700">Milestone:</span>
        <div className="flex gap-1 flex-nowrap">
          {Object.entries(getReferenceLines(selectedStat)).map(([key, value]) => ({
            key: key,
            label: `${value}+`,
          })).map((option) => (
            <button
              key={option.key}
              onClick={() => {
                // Toggle off if already selected
                if (referenceLineType === "custom" && selectedCustomReferenceLine === option.key) {
                  setReferenceLineType(null)
                  setSelectedCustomReferenceLine(null)
                } else {
                  setReferenceLineType("custom")
                  setSelectedCustomReferenceLine(option.key)
                }
              }}
              className={`px-1 md:px-2 py-1 text-[9px] md:text-xs rounded-md border transition-all duration-200 ${
                referenceLineType === "custom" && selectedCustomReferenceLine === option.key
                  ? "text-white shadow-sm font-medium"
                  : "bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
              style={
                referenceLineType === "custom" && selectedCustomReferenceLine === option.key
                  ? {
                      backgroundColor: getTeamBorderColor(playerData.teamAbbr),
                      borderColor: getTeamBorderColor(playerData.teamAbbr),
                    }
                  : {}
              }
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Chart container - condensed height */}
    <div className="px-1 relative min-h-32 h-40 max-h-48 w-full">
      {/* Y-axis labels with ticks */}
      <div
        className="absolute left-0 w-10 flex flex-col justify-between text-[8px] md:text-xs font-medium text-gray-600 pointer-events-none"
        style={{
          top: "0px",
          height: "calc(100% - 20px)",
        }}
      >
        {Array.from({ length: 6 }, (_, i) => {
          const value = chartMaxStat - (i * chartMaxStat) / 5
          return (
            <div key={i} className="relative text-right pr-2 flex items-center h-0">
              <span className="mr-1">{Math.round(value)}</span>
              <div className="w-2 h-px bg-gray-400"></div>
            </div>
          )
        })}
      </div>

      {/* Single scrollable container for both chart and x-axis labels */}
      <div className="absolute left-5 right-0 top-0 h-full">
        <div className="relative h-full w-full">
          {/* Chart area - takes up upper portion */}
          <div className="absolute inset-0" style={{ height: "calc(100% - 20px)" }}>
            {/* Horizontal grid lines - more subtle */}
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="absolute border-t border-gray-200"
                style={{
                  top: `${(i * 100) / 5}%`,
                  left: "-10px",
                  right: "0",
                }}
              />
            ))}

            {/* Reference Line - Behind rolling average line with no label */}
            {(() => {
              let displayReferenceLine = false
              let currentReferenceValue = 0

              if (referenceLineType === "custom" && selectedCustomReferenceLine) {
                currentReferenceValue = getCustomReferenceLineValue(
                  selectedStat,
                  selectedCustomReferenceLine,
                )
                displayReferenceLine = currentReferenceValue <= chartMaxStat
              }

              if (displayReferenceLine) {
                return (
                  <div
                    className="absolute left-0 right-0 z-10 border-t-2 border-dashed"
                    style={{
                      top: `${((chartMaxStat - currentReferenceValue) / chartMaxStat) * 100}%`,
                      borderColor: "#000000",
                    }}
                  />
                )
              }
              return null
            })()}

            {/* Rolling Average Line - Now visible on mobile too */}
            <svg
              className="absolute inset-0 pointer-events-none z-15"
              style={{
                width: "100%",
                height: "100%",
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {calculateRollingAverage(getFilteredGameLogs, selectedStat, movingAverageWindow).map(
                (point, index, array) => {
                  if (index === 0) return null
                  const prevPoint = array[index - 1]
                  const totalGames = array.length

                  const x1 = totalGames > 1 ? ((index - 1) * 100) / (totalGames - 1) : 0
                  const x2 = totalGames > 1 ? (index * 100) / (totalGames - 1) : 100

                  const y1 = Math.max(
                    0,
                    Math.min(100, ((chartMaxStat - prevPoint.value) / chartMaxStat) * 100),
                  )
                  const y2 = Math.max(
                    0,
                    Math.min(100, ((chartMaxStat - point.value) / chartMaxStat) * 100),
                  )

                  return (
                    <line
                      key={`rolling-${index}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#1f2937"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  )
                },
              )}
            </svg>

            {/* Bars and value labels - Narrower bars for mobile */}
            {getFilteredGameLogs.map((game, index) => {
              const statValue = getStatValue(game, selectedStat)
              const barHeight = (statValue / chartMaxStat) * 100
              const isHighlighted = hoveredGame?.index === index
              const totalGames = getFilteredGameLogs.length

              // Make bars narrower - reduced spacing
              const barWidth = `calc(${100 / totalGames}% - 4px)`
              const leftPosition = totalGames > 0 ? `${(index * 100) / totalGames}%` : `${index * 8 + 2}px`

              const exceedsReference =
                referenceLineType === "custom" &&
                selectedCustomReferenceLine &&
                statValue >= getCustomReferenceLineValue(selectedStat, selectedCustomReferenceLine)

              // Light, subtle bars like the reference image
              let backgroundColor, borderStyle
              
              if (isHighlighted) {
                backgroundColor = getTeamBorderColor(playerData.teamAbbr)
                borderStyle = `2px solid ${getTeamBorderColor(playerData.teamAbbr)}`
              } else if (exceedsReference) {
                backgroundColor = "rgba(34, 197, 94, 0.2)" // Very light green
                borderStyle = "2px solid #059669" // Dark green border for emphasis
              } else {
                backgroundColor = "rgba(156, 163, 175, 0.15)" // Very light gray
                borderStyle = "1px solid rgba(156, 163, 175, 0.25)"
              }

              return (
                <div
                  key={index}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: leftPosition,
                    bottom: "0px",
                    width: barWidth,
                    height: "100%",
                  }}
                  onMouseEnter={() => setHoveredGame({ game, index })}
                  onMouseLeave={() => setHoveredGame(null)}
                >
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full mx-auto relative cursor-pointer transition-all duration-200"
                      style={{
                        height: `${Math.max(barHeight, 2)}%`,
                        width: "100%",
                        minWidth: "4px", // Reduced minimum width for mobile
                        backgroundColor: backgroundColor,
                        border: borderStyle,
                        borderTopLeftRadius: "2px",
                        borderTopRightRadius: "2px",
                      }}
                    ></div>
                  </div>
                </div>
              )
            })}

            {/* Hover tooltip - Enhanced styling */}
            {hoveredGame && (
              <div
                className="absolute bg-white border-2 shadow-xl rounded-lg p-3 z-40 pointer-events-none"
                style={{
                  left: hoveredGame.index < getFilteredGameLogs.length / 2 ? "10px" : "auto",
                  right: hoveredGame.index >= getFilteredGameLogs.length / 2 ? "10px" : "auto",
                  top: "10px",
                  minWidth: "200px",
                  borderColor: getTeamBorderColor(playerData.teamAbbr),
                }}
              >
                <div className="text-sm font-bold text-gray-900 mb-1">
                  R{hoveredGame.game.round} — {hoveredGame.game.is_home ? "vs" : "@"}{" "}
                  {hoveredGame.game.opponent}
                </div>
                <div className="text-sm text-gray-600 mb-1">{hoveredGame.game.minutes} min</div>
                <div className="text-sm font-medium" style={{ color: getTeamBorderColor(playerData.teamAbbr) }}>
                  {getStatDisplayName(selectedStat)}: {getStatValue(hoveredGame.game, selectedStat)}
                </div>
              </div>
            )}
          </div>

          {/* X-AXIS LABELS - Show every other label starting with 1, aligned with bars */}
          <div className="absolute -left-0.5 right-0 bottom-0 h-5 flex flex-col">
            {/* Round numbers */}
            <div className="relative flex-1">
              {getFilteredGameLogs.map((game, index) => {
                const totalGames = getFilteredGameLogs.length
                const leftPosition = totalGames > 0 ? `${(index * 100) / totalGames}%` : `${index * 8 + 2}px`
                
                // Show every other label starting with round 1 (index 0)
                const shouldShowLabel = index % 2 === 0

                if (!shouldShowLabel) return null

                return (
                  <div
                    key={`x-label-${index}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: leftPosition,
                      top: "0px",
                      width: totalGames > 0 ? `${100 / totalGames}%` : "6px",
                      height: "12px",
                    }}
                  >
                    <div className="text-[6px] sm:text-[8px] text-gray-500 text-center font-medium">{game.round}</div>
                  </div>
                )
              })}
            </div>
            
            {/* "Round" label - overarching label below the numbers */}
            <div className="flex justify-center -mb-1">
              <div className="text-[7px] sm:text-[9px] text-gray-400 font-medium">
                Round
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
          </div>
        </Card>

        {/* Right Side Container - 25% width */}
{/* Right Side Container - 25% width */}
<Card className="overflow-hidden lg:flex-[1.25] relative  hidden lg:block" style={{ minHeight: "400px" }}>
  {/* Team color accent stripe at top - matches main container */}
  <div
          className="w-full h-2 rounded-t-lg border-b border-black -mb-1 relative z-20"
          style={{
            backgroundColor: getTeamBorderColor(playerData.teamAbbr) || '#bf5050',
          }}
        />

  {/* Place the SpiderChart as an absolutely positioned background element */}
  <PlayerSpiderChart
    key={`desktop-${selectedPlayer?.player_id}-${selectedPhaseToggle}`}
    className="absolute inset-0 z-0 bg-light-beige"
  />

  <div className="relative z-10 p-3 md:p-4 "> 

    {/* Spider Chart Header */}
    <div className="flex justify-between items-center mb-2">
      {/* Container for logo and title */}
      <div className="flex items-center gap-2">
        {/* Team Logo */}
        {playerData.teamAbbr && (
          <div className="w-8 h-8 bg-light-beige ">
            {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
          </div>
        )}
        {/* Title */}
        <h3 className="text-md font-semibold flex-nowrap bg-light-beige">Per-40 Radar</h3>
        
      </div>
      
      
      {/* League Percentiles Label */}
      <div className="text-xs text-gray-600 flex-nowrap">Percentile in League</div>
    </div>

{/* Divider Line */}
<div className="w-full h-px bg-gray-300 mt-2"></div>

    {/* Spider Chart Content - This div can now contain other information on top of the chart */}
    <div className="bg-light-beige">
      {/* The spider chart will render in the background of this container */}
    </div>
  </div>
</Card>
      </div>
    )
  }

  const renderMainContent = () => {
    return (
      <div className="flex flex-col gap-5 mt-2 bg-light-beige">
        {/* MOBILE: Stack cards vertically, DESKTOP: Side by side */}
        {/* Desktop and Mobile Layout */}
<div className="flex flex-col md:flex-col lg:flex-row gap-4 -mt-2 bg-light-beige">
  {/* Mobile View - Single Column Layout */}
  <div className="w-full md:hidden flex flex-col gap-4">
    {/* Mobile Shooting Profile - First */}
    <div className="bg-light-beige rounded-lg border border-black shadow-lg">
      <div
        className="w-full h-2 border border-black rounded-t-lg -mb-1"
        style={{
          backgroundColor: getTeamBorderColor(playerData.teamAbbr),
        }}
      />
      <div className="p-3">
        <div className="flex justify-between items-center pb-2 sticky top-0 z-10 bg-light-beige">
          <div className="flex items-center gap-2">
            {playerData.teamAbbr && (
              <div className="w-8 h-8 bg-light-beige">
                {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
              </div>
            )}
            <h3 className="text-md font-semibold">Shooting Profile</h3>
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {shotData.length > 0 ? `${shotData.length} shots` : "No shot data"}
          </div>
        </div>
        
        <div className="rounded-lg overflow-hidden">
          {shotDataLoading ? (
            <div className="flex justify-center items-center h-[215px]">
              <div className="text-gray-500">Loading shot chart...</div>
            </div>
          ) : shotData.length > 0 ? (
            <div className="w-full h-[215px]">
              <BasketballShotChart
                shotData={shotData}
                leagueAveragesData={leagueAveragesData}
                playerId={selectedPlayer?.player_id || ""}
                season={selectedSeason.toString()}
              />
            </div>
          ) : (
            <div className="flex justify-center items-center h-[215px]">
              <div className="text-gray-500">
                {selectedPlayer
                  ? `No shot data available for ${selectedPlayer.player_name}`
                  : "Select a player to view shot chart"}
              </div>
            </div>
          )}
        </div>

        <div className="">
          <PlayerShootingProfileTable
            playerShotData={shotData}
            leagueAveragesData={leagueAveragesData}
            playerName={selectedPlayer?.player_name || "Unknown Player"}
            isLoading={shotDataLoading}
          />
        </div>
      </div>
    </div>

    {/* Mobile Per-40 Radar - Second */}
    <div className="bg-light-beige rounded-lg border border-black shadow-lg relative mt-2" >
      <div
        className="w-full h-2 rounded-t-lg border-b border-black -mb-1 relative z-20"
        style={{
          backgroundColor: getTeamBorderColor(playerData.teamAbbr) || '#bf5050',
        }}
      />
      
      <PlayerSpiderChart key={`mobile-${selectedPlayer?.player_id}-${selectedPhaseToggle}`} className="absolute  top-0 left-0 right-0 bottom-0 z-0 bg-light-beige rounded-lg" />
      
      <div className="relative z-10 p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {playerData.teamAbbr && (
              <div className="w-8 h-8 bg-light-beige">
                {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
              </div>
            )}
            <h3 className="text-md font-semibold flex-nowrap bg-light-beige">Per-40 Radar</h3>
          </div>
          <div className="text-xs text-gray-600 flex-nowrap">Percentile in League</div>
        </div>
        
        <div className="w-full h-px bg-gray-300 mt-2"></div>
        
        <div className="bg-light-beige">
          {/* The spider chart will render in the background of this container */}
        </div>
      </div>
    </div>
  </div>

  {/* Desktop View - Two Column Layout */}
  <div className="hidden md:flex md:flex-col lg:flex-row gap-4 w-full">
    {/* Player Shot Chart Section */}
    <div className="w-full lg:w-3/5">
      <div className="bg-light-beige rounded-lg border border-black ">
        {/* Team color header strip */}
        <div
          className="w-full h-2 rounded-t-lg border-b border-black -mb-1"
          style={{
            backgroundColor: getTeamBorderColor(playerData.teamAbbr),
          }}
        />
        <div className="p-3">
          <div className="flex justify-between items-center pb-2 sticky top-0 z-10 bg-light-beige">
            <div className="flex items-center gap-2">
              {playerData.teamAbbr && (
                <div className="w-8 h-8 bg-light-beige rounded-lg border border-black shadow-lg">
                  {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
                </div>
              )}
              <h3 className="text-md font-semibold">Player Shot Chart</h3>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {shotData.length > 0 ? `${shotData.length} shots` : "No shot data"}
            </div>
          </div>
          {/* Shot Chart Container */}
          <div className="rounded-lg overflow-hidden">
            {shotDataLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading shot chart...</div>
              </div>
            ) : shotData.length > 0 ? (
              <div className="w-full" style={{ height: "430px" }}>
                <BasketballShotChart
                  shotData={shotData}
                  leagueAveragesData={leagueAveragesData}
                  playerId={selectedPlayer?.player_id || ""}
                  season={selectedSeason.toString()}
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">
                  {selectedPlayer
                    ? `No shot data available for ${selectedPlayer.player_name}`
                    : "Select a player to view shot chart"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {/* Shooting Profile Section */}
    <div className="w-full lg:w-2/5">
      <div className="bg-light-beige rounded-lg border border-black">
        {/* Team color header strip - same style as shot chart */}
        <div
          className="w-full h-2 rounded-t-md border-b border-black -mb-1"
          style={{
            backgroundColor: getTeamBorderColor(playerData.teamAbbr),
          }}
        />
        <div className="p-3">
          <div className="flex justify-between items-center pb-2 sticky top-0 z-10 bg-light-beige">
            <div className="flex items-center gap-2">
              {playerData.teamAbbr && (
                <div className="w-8 h-8 bg-light-beige rounded-lg border border-black shadow-lg">
                  {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
                </div>
              )}
              <h3 className="text-md font-semibold">Shooting Profile</h3>
            </div>
            <div className="text-sm text-gray-600 font-medium">
              {shotData.length > 0 ? `${shotData.length} shots` : "No shot data"}
            </div>
          </div>
          {/* Shooting Profile Content Container */}
          <div className="rounded-lg h-[430px]">
            <PlayerShootingProfileTable
              playerShotData={shotData}
              leagueAveragesData={leagueAveragesData}
              playerName={selectedPlayer?.player_name || "Unknown Player"}
              isLoading={shotDataLoading}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

        <Card className="overflow-hidden bg-light-beige ">
  {/* Team color accent stripe at top */}
  <div
    className="w-full h-2 rounded-t-lg border-b border-black -mb-1 relative z-20"
    style={{
      backgroundColor: getTeamBorderColor(playerData.teamAbbr) || '#bf5050',
    }}
  />

  {/* Header */}
  <div className="p-3 bg-light-beige">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
            {playerData.teamAbbr && (
              <div className="w-8 h-8 bg-light-beige">
                {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
              </div>
            )}
            <h3 className="text-md font-semibold">Game Logs</h3>
          </div>
      <div className="text-xs md:text-sm text-muted-foreground"></div>
    </div>
  </div>

  {/* Game Logs Table Container */}
  <div className="px-2 pb-1 md:px-3 md:pb-3 bg-light-beige">
    <div className="">
      <div className="overflow-x-auto relative border border-gray-200 border-t-2 border-t-gray-700">
        <table className="min-w-full text-[9px] md:text-[11px] border-collapse">
          <thead className="sticky top-0 z-50 bg-gray-50 shadow-md">
            <tr className="bg-gray-50 h-4 md:h-6 border-b-2 border-gray-700">
              <th
                className="bg-gray-50 text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300 md:min-w-[60px] shadow-lg border-b-2 border-gray-700 sticky left-0 z-20"
                onClick={() => handleGameLogSort("round")}
              >
                <div className="flex items-center text-[8px] md:text-[10px]">
                  Round
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("round")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300 hidden md:table-cell"
                onClick={() => handleGameLogSort("phase")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  Phase
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("phase")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("opponent")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  Opp
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("opponent")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300 hidden md:table-cell"
                onClick={() => handleGameLogSort("location")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  Location
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("location")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("minutes")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  MIN
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("minutes")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("points")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  PTS
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("points")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("total_rebounds")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  REB
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("total_rebounds")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("assistances")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  AST
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("assistances")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("steals")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  STL
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("steals")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("blocks_favour")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  BLK
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("blocks_favour")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("turnovers")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  TO
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("turnovers")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("field_goals_made_2")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  2PM
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("field_goals_made_2")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("field_goals_attempted_2")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  2PA
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("field_goals_attempted_2")}</span>
                </div>
              </th>
              <th className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300">
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">2P%</div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("field_goals_made_3")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  3PM
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("field_goals_made_3")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("field_goals_attempted_3")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  3PA
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("field_goals_attempted_3")}</span>
                </div>
              </th>
              <th className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300">
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">3P%</div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("free_throws_made")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  FTM
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("free_throws_made")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("free_throws_attempted")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  FTA
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("free_throws_attempted")}</span>
                </div>
              </th>
              <th className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300">
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">FT%</div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("offensive_rebounds")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  OR
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("offensive_rebounds")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("defensive_rebounds")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  DR
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("defensive_rebounds")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("fouls_commited")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  FC
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("fouls_commited")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("fouls_received")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  FD
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("fouls_received")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-300"
                onClick={() => handleGameLogSort("valuation")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  PIR
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("valuation")}</span>
                </div>
              </th>
              <th
                className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleGameLogSort("plusminus")}
              >
                <div className="flex items-center justify-center text-[8px] md:text-[10px]">
                  +/-
                  <span className="text-[4px] md:text-[6px]">{renderGameLogSortIndicator("plusminus")}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedGameData
              .filter((game) => selectedPhase === "All" || game.phase === selectedPhase)
              .map((game, index) => {
                // Calculate percentages
                const twoPct =
                  (game.field_goals_attempted_2 || 0) > 0
                    ? (((game.field_goals_made_2 || 0) / (game.field_goals_attempted_2 || 1)) * 100).toFixed(1)
                    : "0.0"
                const threePct =
                  (game.field_goals_attempted_3 || 0) > 0
                    ? (((game.field_goals_made_3 || 0) / (game.field_goals_attempted_3 || 1)) * 100).toFixed(1)
                    : "0.0"
                const ftPct =
                  (game.free_throws_attempted || 0) > 0
                    ? (((game.free_throws_made || 0) / (game.free_throws_attempted || 1)) * 100).toFixed(1)
                    : "0.0"

                // Calculate numeric values for percentages for styling
                const twoPctNum =
                  (game.field_goals_attempted_2 || 0) > 0
                    ? ((game.field_goals_made_2 || 0) / (game.field_goals_attempted_2 || 1)) * 100
                    : 0
                const threePctNum =
                  (game.field_goals_attempted_3 || 0) > 0
                    ? ((game.field_goals_made_3 || 0) / (game.field_goals_attempted_3 || 1)) * 100
                    : 0
                const ftPctNum =
                  (game.free_throws_attempted || 0) > 0
                    ? ((game.free_throws_made || 0) / (game.free_throws_attempted || 1)) * 100
                    : 0

                return (
                  <tr
                    key={`${game.gamecode}-${game.round}`}
                    className="h-3.5 md:h-5 border-b border-gray-200 hover:bg-blue-50 hover:shadow-sm transition-all duration-150 group"
                  >
                    <td className="text-left py-0.5 px-0.5 md:py-0.5 md:px-1 font-medium border-r border-gray-300 min-w-[45px] md:min-w-[60px] sticky left-0  z-10 group-hover:bg-blue-50 transition-colors duration-150 shadow-sm text-center">
                      R{game.round}
                    </td>
                    <td className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 hidden md:table-cell">
                      {game.phase || "RS"}
                    </td>
                    <td className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>{game.opponent || "OPP"}</span>
                      </div>
                    </td>
                    <td className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 hidden md:table-cell">
                      {game.location || (game.home === 1 ? "H" : "A")}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(
                        typeof game.minutes === "string"
                          ? Number.parseFloat(game.minutes.replace(/[^\d.]/g, "")) || 0
                          : Number(game.minutes) || 0,
                        gameLogStatValues.minutes,
                      )}
                    >
                      {game.minutes}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.points, gameLogStatValues.points, true)}
                    >
                      {game.points || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.total_rebounds, gameLogStatValues.rebounds, true)}
                    >
                      {game.total_rebounds || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.assistances, gameLogStatValues.assists, true)}
                    >
                      {game.assistances || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.steals, gameLogStatValues.steals, true)}
                    >
                      {game.steals || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.blocks_favour, gameLogStatValues.blocks, true)}
                    >
                      {game.blocks_favour || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.turnovers, gameLogStatValues.turnovers, false)}
                    >
                      {game.turnovers || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(
                        game.field_goals_made_2,
                        gameLogStatValues.fieldGoalsMade,
                        true,
                      )}
                    >
                      {game.field_goals_made_2 || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(
                        game.field_goals_attempted_2,
                        gameLogStatValues.fieldGoalsAttempted,
                        true,
                      )}
                    >
                      {game.field_goals_attempted_2 || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(twoPctNum, gameLogStatValues.fieldGoalPct, true)}
                    >
                      {twoPct}%
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(
                        game.field_goals_made_3,
                        gameLogStatValues.threePointsMade,
                        true,
                      )}
                    >
                      {game.field_goals_made_3 || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(
                        game.field_goals_attempted_3,
                        gameLogStatValues.threePointsAttempted,
                        true,
                      )}
                    >
                      {game.field_goals_attempted_3 || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(threePctNum, gameLogStatValues.threePointPct, true)}
                    >
                      {threePct}%
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.free_throws_made, gameLogStatValues.freeThrowsMade, true)}
                    >
                      {game.free_throws_made || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(
                        game.free_throws_attempted,
                        gameLogStatValues.freeThrowsAttempted,
                        true,
                      )}
                    >
                      {game.free_throws_attempted || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(ftPctNum, gameLogStatValues.freeThrowPct, true)}
                    >
                      {ftPct}%
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.offensive_rebounds, gameLogStatValues.rebounds, true)}
                    >
                      {game.offensive_rebounds || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.defensive_rebounds, gameLogStatValues.rebounds, true)}
                    >
                      {game.defensive_rebounds || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.fouls_commited, gameLogStatValues.turnovers, false)}
                    >
                      {game.fouls_commited || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.fouls_received, gameLogStatValues.steals, true)}
                    >
                      {game.fouls_received || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-medium border-r border-gray-300 font-mono"
                      style={getGameLogCellColor(game.valuation, gameLogStatValues.points, true)}
                    >
                      {game.valuation || 0}
                    </td>
                    <td
                      className="text-center py-0.5 px-0.5 md:py-1 md:px-1 font-mono"
                      style={getGameLogCellColor(game.plusminus, gameLogStatValues.points, true)}
                    >
                      {game.plusminus > 0 ? `+${game.plusminus}` : game.plusminus || 0}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</Card>
      </div>
    )
  }

  // Main render function that calls all the smaller rendering functions
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading player data...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
  {/* Main Layout - New Structure */}
  <div className="flex flex-col gap-2 -mt-2 sm:-mt-4">
    {/* Filter Bar - Non-sticky */}
    <div className="-mt-2 mb-4 md:mb-0 md:mt-0 md:hidden">
      <PlayerTeamSelector />
    </div>
    {FilterPlayerHeader()}

    {/* Player Info and Season Statistics - Sticky */}
    {renderMainContent()}
  </div>
</div>
    )
  }

  return renderContent()
}

export default OffenseTab
