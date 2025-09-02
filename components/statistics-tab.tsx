"use client"
import { useState, useEffect, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchPlayerStatsFromGameLogs } from "@/app/actions/standings"
import type { PlayerStatsFromGameLogs } from "@/lib/db"
import Image from "next/image"

interface StatisticsTabProps {
  playerSearch: string
  onPlayerSearchChange: (value: string) => void
  season: number
  phase?: string
  teamStats?: any[]
  league?: string
}

function StatisticsTab({
  playerSearch,
  onPlayerSearchChange,
  season,
  phase = "RS",
  teamStats = [],
  league = "euroleague",
}: StatisticsTabProps) {
  console.log("=== StatisticsTab RENDER ===")
  console.log("Season prop:", season, "Type:", typeof season)
  console.log("League prop:", league)
  console.log("Phase prop:", phase)
  console.log("TeamStats received:", teamStats.length, "teams")

  // State - simplified since we're using pre-calculated data
  const [playerStatsData, setPlayerStatsData] = useState<PlayerStatsFromGameLogs[]>([])
  const [isPlayerStatsLoading, setIsPlayerStatsLoading] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<string>("Regular")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const playersPerPage = 80
  const [statDisplayMode, setStatDisplayMode] = useState<"averages" | "per40" | "total">("averages")

  // Sorting state
  const [playerSortColumnLocal, setPlayerSortColumn] = useState<string>("points_scored")
  const [playerSortDirectionLocal, setPlayerSortDirection] = useState<"asc" | "desc">("desc")

  // Function to handle column sorting
  const handlePlayerColumnSort = (column: string) => {
    if (playerSortColumnLocal === column) {
      setPlayerSortDirection(playerSortDirectionLocal === "asc" ? "desc" : "asc")
    } else {
      setPlayerSortColumn(column)
      setPlayerSortDirection("desc")
    }
    setCurrentPage(1)
  }

  // Function to render sort indicator
  const renderSortIndicator = (column: string) => {
    const isActive = playerSortColumnLocal === column
    return (
      <span className="ml-1 md:ml-3 inline-flex flex-col">
        <span
          className={`text-[10px] leading-none ${isActive && playerSortDirectionLocal === "asc" ? "text-blue-600" : "text-gray-400"}`}
        >
          ▲
        </span>
        <span
          className={`text-[10px] leading-none ${isActive && playerSortDirectionLocal === "desc" ? "text-blue-600" : "text-gray-400"}`}
        >
          ▼
        </span>
      </span>
    )
  }

  // Team colors mapping
  const getTeamColor = (teamCode: string) => {
    const teamColors = {
      BER: "#ffe14d", // ALBA Berlin - Softer yellow
      IST: "#3379bd", // Anadolu Efes - Softer royal blue
      MCO: "#d44150", // Monaco - Softer red
      BAS: "#3773b3", // Baskonia - Softer navy blue
      RED: "#e75a6b", // Crvena Zvezda - Softer red
      MIL: "#ff5e75", // Milan - Softer red with pink tone
      BAR: "#3674b5", // Barcelona - Softer deep blue
      MUN: "#c54960", // Bayern - Softer burgundy
      ULK: "#ffd54d", // Fenerbahce - Softer golden yellow
      ASV: "#a3a6a9", // ASVEL - Softer gray
      TEL: "#ffc966", // Maccabi - Softer golden orange
      OLY: "#e66464", // Olympiacos - Softer red
      PAN: "#338855", // Panathinaikos - Softer dark green
      PRS: "#5d6772", // Paris - Softer slate
      PAR: "#4f4d48", // Partizan - Softer black-gray
      MAD: "#c0c0c0", // Real Madrid - Silver instead of white
      VIR: "#454545", // Virtus - Softer black
      ZAL: "#339966", // Zalgiris - Softer kelly green
      PAM: "#ff8c00", // Valencia Basket - Orange (already present, common to both competitions)

      // EuroCup Teams
      "7BET": "#a63d57", // 7bet-Lietkabelis Panevezys - Muted maroon/red
      ARI: "#fdd835", // Aris Midea Thessaloniki - Muted gold/yellow
      BAH: "#2c3e50", // Bahcesehir College Istanbul - Dark blue/charcoal
      BES: "#424242", // Besiktas Fibabanka Istanbul - Dark grey/black
      BUD: "#3498db", // Buducnost VOLI Podgorica - Muted light blue
      CED: "#f8b400", // Cedevita Olimpija Ljubljana - Muted orange/gold
      BOU: "#e74c3c", // Cosea JL Bourg-en-Bresse - Muted red
      TRE: "#607d8b", // Dolomiti Energia Trento - Slate gray
      GRA: "#fbc02d", // Dreamland Gran Canaria - Muted gold/orange
      HAP: "#d32f2f", // Hapoel Bank Yahav Jerusalem - Muted deep red (main color)
      HTA: "#f44336", // Hapoel Shlomo Tel Aviv - Muted red (lighter)
      JOV: "#4caf50", // Joventut Badalona - Muted green
      ULM: "#e65100", // ratiopharm Ulm - Muted bright orange
      TREF: "#fbc02d", // Trefl Sopot - Muted gold/orange
      TTK: "#4dd0e1", // Turk Telekom Ankara - Muted light blue/turquoise
      UBT: "#9e9e9e", // U-BT Cluj-Napoca - Muted grey
      UMV: "#8d0c2e", // Umana Reyer Venice - Deep maroon/red
      HAM: "#2c3e50", // Veolia Towers Hamburg - Dark blue/charcoal
      WOL: "#69f0ae", // Wolves Twinsbet Vilnius - Muted lime green
    }
    return teamColors[teamCode] || "#6B7280"
  }

  // Helper function to get the appropriate column name based on display mode
  const getColumnName = (baseStat: string) => {
    if (statDisplayMode === "per40") {
      // Handle special cases for per40 columns
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
    } else if (statDisplayMode === "total") {
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

  // Helper function for very subtle conditional formatting - all stats are "higher is better"
  const getSubtleConditionalStyle = (value, allValues) => {
    if (!value || !allValues || allValues.length === 0) return {}

    // Filter out invalid values and convert to numbers
    const validValues = allValues
      .map((v) => (typeof v === "string" ? Number.parseFloat(v) : v))
      .filter((v) => !isNaN(v) && v !== null && v !== undefined)

    if (validValues.length === 0) return {}

    // Sort values in descending order (highest first)
    const sortedValues = [...validValues].sort((a, b) => b - a)
    const currentValue = typeof value === "string" ? Number.parseFloat(value) : value

    if (isNaN(currentValue)) return {}

    // Find how many values are greater than current value
    let rank = 0
    for (let i = 0; i < sortedValues.length; i++) {
      if (sortedValues[i] > currentValue) {
        rank++
      } else {
        break
      }
    }

    // Calculate percentile (what percentage of players this player beats)
    const percentile = (sortedValues.length - rank) / sortedValues.length

    let backgroundColor = "transparent"

    // All stats are "higher is better" now
    if (percentile >= 0.99) {
      backgroundColor = "#2dd4bf" // Top 1% - more saturated teal
    } else if (percentile >= 0.97) {
      backgroundColor = "#5eead4" // Top 3% - medium-light teal
    } else if (percentile >= 0.95) {
      backgroundColor = "#99f6e4" // Top 5% - light teal
    } else if (percentile >= 0.9) {
      backgroundColor = "#ccfbf1" // Top 10% - very light teal
    } else if (percentile >= 0.8) {
      backgroundColor = "#f0fdfa" // Top 20% - barely visible teal
    }

    return { backgroundColor }
  }

  // Fetch pre-calculated player stats - THIS IS WHERE THE DATA LOADING HAPPENS
  useEffect(() => {
    const loadPlayerStatsData = async () => {
      console.log("=== USEEFFECT TRIGGERED ===")
      console.log("Season:", season, "Type:", typeof season)
      console.log("SelectedPhase:", selectedPhase)
      console.log("League:", league)

      if (!season) {
        console.warn("No season provided, skipping data load")
        return
      }

      setIsPlayerStatsLoading(true)
      try {
        console.log("=== STARTING DATA FETCH ===")
        console.log("Season:", season, "Phase:", selectedPhase, "League:", league)

        // Convert phase selection to database phase format
        let dbPhase = "Regular Season" // Default to Regular Season
        if (selectedPhase === "All") {
          dbPhase = "Regular Season"
        } else if (selectedPhase === "Regular") {
          dbPhase = "Regular Season"
        } else if (selectedPhase === "Playoffs") {
          dbPhase = "Playoffs"
        }

        console.log("Final dbPhase to use:", dbPhase)
        console.log("About to call fetchPlayerStatsFromGameLogs with:", { season, dbPhase, league })

        const playerStats = await fetchPlayerStatsFromGameLogs(season, dbPhase, league)

        console.log("=== DATA FETCH COMPLETED ===")
        console.log("Raw result type:", typeof playerStats)
        console.log("Raw result length:", Array.isArray(playerStats) ? playerStats.length : "Not an array")
        console.log("Raw result:", playerStats)

        if (Array.isArray(playerStats) && playerStats.length > 0) {
          console.log("First player sample:", playerStats[0])
          console.log("Sample player keys:", Object.keys(playerStats[0]))
        }

        setPlayerStatsData(playerStats || [])
      } catch (error) {
        console.error("=== ERROR IN DATA FETCH ===")
        console.error("Error fetching pre-calculated player stats:", error)
        console.error("Error details:", {
          name: error?.name,
          message: error?.message,
          stack: error?.stack?.substring(0, 500),
        })
        setPlayerStatsData([])
      } finally {
        setIsPlayerStatsLoading(false)
        console.log("=== DATA FETCH FINISHED (finally block) ===")
      }
    }

    loadPlayerStatsData()
  }, [season, selectedPhase, league])

  // Filter and sort players - now using pre-calculated data
  const filteredAndSortedPlayers = useMemo(() => {
    console.log("=== FILTERING AND SORTING ===")
    console.log("isPlayerStatsLoading:", isPlayerStatsLoading)
    console.log("playerStatsData.length:", playerStatsData.length)
    console.log("searchQuery:", searchQuery)

    if (isPlayerStatsLoading || playerStatsData.length === 0) {
      console.log("Returning empty array - loading or no data")
      return []
    }

    // First, let's check for duplicates in the raw data
    const playerNames = playerStatsData.map((p) => p.player_name)
    const duplicateNames = playerNames.filter((name, index) => playerNames.indexOf(name) !== index)
    if (duplicateNames.length > 0) {
      console.warn("Duplicate player names found:", [...new Set(duplicateNames)])
    }

    // Filter by search query
    const filtered = playerStatsData.filter((player) => {
      if (!searchQuery.trim()) {
        return true // Show all players when search is empty
      }

      const searchLower = searchQuery.toLowerCase().trim()
      const matchesSearch =
        player.player_name?.toLowerCase().includes(searchLower) ||
        player.player_team_code?.toLowerCase().includes(searchLower) ||
        player.player_team_name?.toLowerCase().includes(searchLower)

      return matchesSearch
    })

    console.log("After filtering:", filtered.length, "players")
    console.log("Search query:", searchQuery)

    // Sort the filtered results
    const sorted = filtered.sort((a, b) => {
      const currentSortColumn = getColumnName(playerSortColumnLocal)

      const aValue =
        typeof a[currentSortColumn] === "string" ? Number.parseFloat(a[currentSortColumn]) : a[currentSortColumn] || 0
      const bValue =
        typeof b[currentSortColumn] === "string" ? Number.parseFloat(b[currentSortColumn]) : b[currentSortColumn] || 0

      if (playerSortColumnLocal === "player_name") {
        const aName = a.player_name || ""
        const bName = b.player_name || ""
        return playerSortDirectionLocal === "asc" ? aName.localeCompare(bName) : bName.localeCompare(aName)
      }

      return playerSortDirectionLocal === "asc" ? aValue - bValue : bValue - aValue
    })

    console.log("After sorting:", sorted.length, "players")
    return sorted
  }, [
    playerStatsData,
    searchQuery,
    playerSortColumnLocal,
    playerSortDirectionLocal,
    isPlayerStatsLoading,
    statDisplayMode,
  ])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPlayers.length / playersPerPage)
  const startIndex = (currentPage - 1) * playersPerPage
  const endIndex = startIndex + playersPerPage
  const currentPlayers = filteredAndSortedPlayers.slice(startIndex, endIndex)

  const createPlayersWithHeaders = (players) => {
    const result = []
    players.forEach((player, index) => {
      // Add header row every 18 players (but not at the very beginning since we have sticky header)
      if (index > 0 && index % 20 === 0) {
        result.push({ type: "header", id: `header-${index}` })
      }
      result.push({ type: "player", data: player, originalIndex: index })
    })
    return result
  }

  const playersWithHeaders = createPlayersWithHeaders(currentPlayers)

  const HeaderRow = ({ isSticky = false }) => (
    <tr
      className={`${isSticky ? "sticky top-0 z-50 bg-gray-50 shadow-sm" : "bg-gray-100"} h-6 md:h-8 border-b-2 border-black ${!isSticky ? "border-t-2 border-t-black" : ""}`}
    >
      <th
        className={`${isSticky ? "sticky left-0 z-[60] bg-gray-50 shadow-lg" : "sticky left-0 z-[30] bg-gray-100"} text-left py-0.5 md:py-2 px-1 md:px-2 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300 min-w-[180px] md:min-w-[220px]`}
        onClick={() => handlePlayerColumnSort("player_name")}
      >
        <div className="flex items-center text-[8px] md:text-sm">Player {renderSortIndicator("player_name")}</div>
      </th>
      <th
        className="text-center py-0.5 md:py-1 px-0.5 md:px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border border-gray-300"
        onClick={() => handlePlayerColumnSort("games_played")}
      >
        <div className="flex items-center justify-center text-[8px] md:text-sm">GP {renderSortIndicator("games_played")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("games_started")}
      >
        <div className="flex items-center justify-center">GS {renderSortIndicator("games_started")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("minutes_played")}
      >
        <div className="flex items-center justify-center">MIN {renderSortIndicator("minutes_played")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("points_scored")}
      >
        <div className="flex items-center justify-center">PTS {renderSortIndicator("points_scored")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("two_pointers_made")}
      >
        <div className="flex items-center justify-center">2PM {renderSortIndicator("two_pointers_made")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("two_pointers_attempted")}
      >
        <div className="flex items-center justify-center">2PA {renderSortIndicator("two_pointers_attempted")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("two_pointers_percentage")}
      >
        <div className="flex items-center justify-center">2P% {renderSortIndicator("two_pointers_percentage")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("three_pointers_made")}
      >
        <div className="flex items-center justify-center">3PM {renderSortIndicator("three_pointers_made")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("three_pointers_attempted")}
      >
        <div className="flex items-center justify-center">3PA {renderSortIndicator("three_pointers_attempted")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("three_pointers_percentage")}
      >
        <div className="flex items-center justify-center">3P% {renderSortIndicator("three_pointers_percentage")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("free_throws_made")}
      >
        <div className="flex items-center justify-center">FTM {renderSortIndicator("free_throws_made")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("free_throws_attempted")}
      >
        <div className="flex items-center justify-center">FTA {renderSortIndicator("free_throws_attempted")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("free_throws_percentage")}
      >
        <div className="flex items-center justify-center">FT% {renderSortIndicator("free_throws_percentage")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("offensive_rebounds")}
      >
        <div className="flex items-center justify-center">OR {renderSortIndicator("offensive_rebounds")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("defensive_rebounds")}
      >
        <div className="flex items-center justify-center">DR {renderSortIndicator("defensive_rebounds")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("total_rebounds")}
      >
        <div className="flex items-center justify-center">TR {renderSortIndicator("total_rebounds")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("assists")}
      >
        <div className="flex items-center justify-center">AST {renderSortIndicator("assists")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("steals")}
      >
        <div className="flex items-center justify-center">STL {renderSortIndicator("steals")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("turnovers")}
      >
        <div className="flex items-center justify-center">TO {renderSortIndicator("turnovers")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("blocks")}
      >
        <div className="flex items-center justify-center">BLK {renderSortIndicator("blocks")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("blocks_against")}
      >
        <div className="flex items-center justify-center">BLKA {renderSortIndicator("blocks_against")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("fouls_commited")}
      >
        <div className="flex items-center justify-center">FC {renderSortIndicator("fouls_commited")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors border-r border-gray-300"
        onClick={() => handlePlayerColumnSort("fouls_drawn")}
      >
        <div className="flex items-center justify-center">FD {renderSortIndicator("fouls_drawn")}</div>
      </th>
      <th
        className="text-center py-1 px-1.5 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={() => handlePlayerColumnSort("pir")}
      >
        <div className="flex items-center justify-center">PIR {renderSortIndicator("pir")}</div>
      </th>
    </tr>
  )

  // Format season display
  const formatSeasonDisplay = (seasonValue: number) => {
    if (!seasonValue || isNaN(seasonValue)) return "2024-25"
    return `${seasonValue}-${(seasonValue + 1).toString().slice(-2)}`
  }

  console.log("=== FINAL RENDER STATE ===")
  console.log("Season:", season)
  console.log("Pre-calculated player stats:", playerStatsData.length)
  console.log("Filtered players:", filteredAndSortedPlayers.length)
  console.log("Current players:", currentPlayers.length)
  console.log("Is loading:", isPlayerStatsLoading)

  if (isPlayerStatsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading Player Statistics...</p>
          </div>
        </div>
    )
  }

  return (
    <div className="bg-white rounded-md border border-black shadow-sm max-w-[calc(100vw-32px)]">
      {/* Team color header strip */}
      <div
        className="w-full h-2 border-b border-black rounded-t-md -mb-1"
        style={{
          backgroundColor: "#9ca3af", // gray-400
        }}
      />
      <div className="py-4 px-4">
        <div className="flex justify-between items-center pb-3 ">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 md:w-8 md:h-8 relative">
            <Image
              src={league === "eurocup" ? "/eurocup-logo.png" : "/euroleague-logo.png"}
              alt={`${league === "eurocup" ? "EuroCup" : "Euroleague"} logo`}
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-md font-semibold">Statistics</h3>
        </div>
        <div className="flex items-center gap-1 md:gap-4 flex-wrap justify-end">
          {/* Search */}
          <div className="relative w-24 md:w-80">
            <Search className="absolute left-1 md:left-3 top-1/2 transform -translate-y-1/2 h-2.5 md:h-4 w-2.5 md:w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-4 md:pl-10 pr-1 md:pr-3 py-0 md:py-1 text-[9px] md:text-sm rounded-md border border-gray-300 focus:outline-none w-full h-6 md:h-auto"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page when searching
              }}
            />
          </div>

          {/* Stat Display Mode Toggle */}
          <div className="flex rounded-full border bg-[#f1f5f9] p-0.5">
            <button
              onClick={() => setStatDisplayMode("averages")}
              className={`rounded-full px-1 md:px-1 py-0.5 text-[8px] md:text-xs font-medium ${
                statDisplayMode === "averages" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              Avg
            </button>
            <button
              onClick={() => setStatDisplayMode("per40")}
              className={`rounded-full px-1 md:px-1 py-0.5 text-[8px] md:text-xs font-medium ${
                statDisplayMode === "per40" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              P40
            </button>
            <button
              onClick={() => setStatDisplayMode("total")}
              className={`rounded-full px-1 md:px-1 py-0.5 text-[8px] md:text-xs font-medium ${
                statDisplayMode === "total" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              Tot
            </button>
          </div>

          {/* Phase Toggle */}
          <div className="flex rounded-full bg-[#f1f5f9] p-0.5 border">
            <button
              onClick={() => setSelectedPhase("Regular")}
              className={`rounded-full px-1 md:px-1 py-0.5 text-[8px] md:text-xs font-medium ${
                selectedPhase === "Regular" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              RS
            </button>
            <button
              onClick={() => setSelectedPhase("Playoffs")}
              className={`rounded-full px-1 md:px-1 py-0.5 text-[8px] md:text-xs font-medium ${
                selectedPhase === "Playoffs" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              PO
            </button>
          </div>
        </div>
      </div>

      <div className="relative  -ml-2 -mr-2 border-t-2 border-black border-b-2 border-black">
        <div className="overflow-auto max-h-[500px] md:max-h-[600px]">
          <table className="w-full text-[8px] md:text-xs border-collapse">
            {/* Fixed sticky table header */}
            <thead>
              <HeaderRow isSticky={true} />
            </thead>
            <tbody>
              {playersWithHeaders.length > 0 ? (
                playersWithHeaders.map((item) => {
                  if (item.type === "header") {
                    return <HeaderRow key={item.id} isSticky={false} />
                  }

                  const player = item.data
                  const index = item.originalIndex

                  // Helper function to safely format numeric values
                  const formatStat = (value: any, decimals = 1) => {
                    const numValue =
                      typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : 0
                    if (isNaN(numValue)) return "0.0"

                    // For total mode, show whole numbers for most stats except percentages
                    if (statDisplayMode === "total" && decimals === 1) {
                      return Math.round(numValue).toString()
                    }

                    return numValue.toFixed(decimals)
                  }

                  // Collect all values for conditional formatting - Use all players, not just current page
                  const allValues = {
                    games_played: filteredAndSortedPlayers.map((p) => p[getColumnName("games_played")]),
                    games_started: filteredAndSortedPlayers.map((p) => p[getColumnName("games_started")]),
                    minutes_played: filteredAndSortedPlayers.map((p) => p[getColumnName("minutes_played")]),
                    points_scored: filteredAndSortedPlayers.map((p) => p[getColumnName("points_scored")]),
                    two_pointers_made: filteredAndSortedPlayers.map((p) => p[getColumnName("two_pointers_made")]),
                    two_pointers_attempted: filteredAndSortedPlayers.map(
                      (p) => p[getColumnName("two_pointers_attempted")],
                    ),
                    two_pointers_percentage: filteredAndSortedPlayers.map(
                      (p) => p[getColumnName("two_pointers_percentage")],
                    ),
                    three_pointers_made: filteredAndSortedPlayers.map((p) => p[getColumnName("three_pointers_made")]),
                    three_pointers_attempted: filteredAndSortedPlayers.map(
                      (p) => p[getColumnName("three_pointers_attempted")],
                    ),
                    three_pointers_percentage: filteredAndSortedPlayers.map(
                      (p) => p[getColumnName("three_pointers_percentage")],
                    ),
                    free_throws_made: filteredAndSortedPlayers.map((p) => p[getColumnName("free_throws_made")]),
                    free_throws_attempted: filteredAndSortedPlayers.map(
                      (p) => p[getColumnName("free_throws_attempted")],
                    ),
                    free_throws_percentage: filteredAndSortedPlayers.map(
                      (p) => p[getColumnName("free_throws_percentage")],
                    ),
                    offensive_rebounds: filteredAndSortedPlayers.map((p) => p[getColumnName("offensive_rebounds")]),
                    defensive_rebounds: filteredAndSortedPlayers.map((p) => p[getColumnName("defensive_rebounds")]),
                    total_rebounds: filteredAndSortedPlayers.map((p) => p[getColumnName("total_rebounds")]),
                    assists: filteredAndSortedPlayers.map((p) => p[getColumnName("assists")]),
                    steals: filteredAndSortedPlayers.map((p) => p[getColumnName("steals")]),
                    turnovers: filteredAndSortedPlayers.map((p) => p[getColumnName("turnovers")]),
                    blocks: filteredAndSortedPlayers.map((p) => p[getColumnName("blocks")]),
                    blocks_against: filteredAndSortedPlayers.map((p) => p[getColumnName("blocks_against")]),
                    fouls_commited: filteredAndSortedPlayers.map((p) => p[getColumnName("fouls_commited")]),
                    fouls_drawn: filteredAndSortedPlayers.map((p) => p[getColumnName("fouls_drawn")]),
                    pir: filteredAndSortedPlayers.map((p) => p[getColumnName("pir")]),
                  }

                  return (
                    <tr
                      key={`${player.player_id || player.player_name}-${player.player_team_code}-${selectedPhase}-${index}`}
                      className={`border-b bg-white hover:bg-gray-100 transition-colors group`}
                    >
                      <td className="sticky left-0 z-[30] py-0.5 md:py-1 px-1 md:px-2 font-medium border-r border-gray-200 bg-white group-hover:bg-gray-100 min-w-[180px] md:min-w-[220px] shadow-lg transition-colors">
                        <div className="flex items-center gap-1 md:gap-2">
                          {(() => {
                            const teamCode = player.player_team_code
                            const teamColors = getTeamColor(teamCode)
                            const teamLogo = player.teamlogo

                            return (
                              <>
                                <div className="w-4 md:w-5 h-4 md:h-5 flex items-center justify-center flex-shrink-0">
                                  {teamLogo ? (
                                    <img
                                      src={teamLogo || "/placeholder.svg"}
                                      alt={`${teamCode} logo`}
                                      className="w-3 md:w-4 h-3 md:h-4 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.src = "/placeholder.svg?height=20&width=20"
                                      }}
                                    />
                                  ) : (
                                    <div className="w-3 h-3 flex items-center justify-center text-gray-600 font-bold text-[8px] md:text-xs">
                                      {teamCode}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] md:text-xs font-medium text-black leading-tight">
                                    {player.player_name}
                                  </span>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </td>

                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("games_played")],
                            allValues.games_played,
                          )}
                        >
                          {formatStat(player[getColumnName("games_played")], 0)}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("games_started")],
                            allValues.games_started,
                          )}
                        >
                          {formatStat(player[getColumnName("games_started")], 0)}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("minutes_played")],
                            allValues.minutes_played,
                          )}
                        >
                          {formatStat(player[getColumnName("minutes_played")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("points_scored")],
                            allValues.points_scored,
                          )}
                        >
                          {formatStat(player[getColumnName("points_scored")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("two_pointers_made")],
                            allValues.two_pointers_made,
                          )}
                        >
                          {formatStat(player[getColumnName("two_pointers_made")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("two_pointers_attempted")],
                            allValues.two_pointers_attempted,
                          )}
                        >
                          {formatStat(player[getColumnName("two_pointers_attempted")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("two_pointers_percentage")],
                            allValues.two_pointers_percentage,
                          )}
                        >
                          {formatStat(player[getColumnName("two_pointers_percentage")])}%
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("three_pointers_made")],
                            allValues.three_pointers_made,
                          )}
                        >
                          {formatStat(player[getColumnName("three_pointers_made")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("three_pointers_attempted")],
                            allValues.three_pointers_attempted,
                          )}
                        >
                          {formatStat(player[getColumnName("three_pointers_attempted")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("three_pointers_percentage")],
                            allValues.three_pointers_percentage,
                          )}
                        >
                          {formatStat(player[getColumnName("three_pointers_percentage")])}%
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("free_throws_made")],
                            allValues.free_throws_made,
                          )}
                        >
                          {formatStat(player[getColumnName("free_throws_made")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("free_throws_attempted")],
                            allValues.free_throws_attempted,
                          )}
                        >
                          {formatStat(player[getColumnName("free_throws_attempted")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("free_throws_percentage")],
                            allValues.free_throws_percentage,
                          )}
                        >
                          {formatStat(player[getColumnName("free_throws_percentage")])}%
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("offensive_rebounds")],
                            allValues.offensive_rebounds,
                          )}
                        >
                          {formatStat(player[getColumnName("offensive_rebounds")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("defensive_rebounds")],
                            allValues.defensive_rebounds,
                          )}
                        >
                          {formatStat(player[getColumnName("defensive_rebounds")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("total_rebounds")],
                            allValues.total_rebounds,
                          )}
                        >
                          {formatStat(player[getColumnName("total_rebounds")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(player[getColumnName("assists")], allValues.assists)}
                        >
                          {formatStat(player[getColumnName("assists")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(player[getColumnName("steals")], allValues.steals)}
                        >
                          {formatStat(player[getColumnName("steals")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(player[getColumnName("turnovers")], allValues.turnovers)}
                        >
                          {formatStat(player[getColumnName("turnovers")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(player[getColumnName("blocks")], allValues.blocks)}
                        >
                          {formatStat(player[getColumnName("blocks")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("blocks_against")],
                            allValues.blocks_against,
                          )}
                        >
                          {formatStat(player[getColumnName("blocks_against")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(
                            player[getColumnName("fouls_commited")],
                            allValues.fouls_commited,
                          )}
                        >
                          {formatStat(player[getColumnName("fouls_commited")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(player[getColumnName("fouls_drawn")], allValues.fouls_drawn)}
                        >
                          {formatStat(player[getColumnName("fouls_drawn")])}
                        </span>
                      </td>
                      <td className="py-0 md:py-1 px-0 md:px-1 text-center border-r border-gray-200 font-mono text-[7px] md:text-[11px]">
                        <span
                          className="px-1 py-0.5 rounded text-black"
                          style={getSubtleConditionalStyle(player[getColumnName("pir")], allValues.pir)}
                        >
                          {formatStat(player[getColumnName("pir")])}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={26} className="py-8 text-center text-gray-500">
                    {isPlayerStatsLoading
                      ? "Loading..."
                      : `No player stats data available for ${formatSeasonDisplay(season)} - ${selectedPhase}`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-2 md:mt-4 gap-2 sm:gap-0">
        <div className="text-xs md:text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPlayers.length)} of{" "}
          {filteredAndSortedPlayers.length} players
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 md:px-3 md:py-2 text-xs"
          >
            <ChevronLeft className="h-3 md:h-4 w-3 md:w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <span className="text-xs md:text-sm text-gray-600">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-2 py-1 md:px-3 md:py-2 text-xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 md:h-4 w-3 md:w-4" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  )
}

export default StatisticsTab
export { StatisticsTab }
