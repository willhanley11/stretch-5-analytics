"use client"

import React from "react"
import type { ReactNode } from "react"
import { useState, useEffect, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Image from "next/image"
import { fetchAllTeamAdvancedStatsCalculated, fetchLeagueAveragesPrecalculated, fetchStandingsFromGameLogs } from "@/app/actions/standings"
import { euroleague_team_colors } from "./yamagata-team-stats"

interface LeagueStandingsTabProps {
  isLoading: boolean
  teamStats: any[]
  seasons: number[]
  phases: string[]
  selectedSeason: number
  setSelectedSeason: (season: number) => void
  selectedPhase: string
  setSelectedPhase: (phase: string) => void
  getTeamLogo: (teamName: string, teamCode?: string) => ReactNode
  setActiveTab: (tab: string) => void
  setSelectedTeam: (team: string) => void
  setShouldScrollTop: (value: boolean) => void
  league: string
  teamNameToCode: Record<string, string>
  team_logo_mapping: Record<string, string>
}

type ViewMode = "team" | "off-4factors" | "off-shooting" | "off-ptdist" | "off-misc" | "def-4factors" | "def-shooting" | "def-ptdist" | "def-misc"
type DisplayMode = "rank" | "value"

const formatStatValue = (value: number | undefined | null, decimals = 1, statKey?: string) => {
  if (value === null || value === undefined || isNaN(value)) return "-"
  
  // Integer stats don't need decimal places
  if (["w", "l", "diff"].includes(statKey || "")) {
    return Math.round(Number(value)).toString()
  }
  
  return Number(value).toFixed(decimals)
}

export function LeagueStandingsTab({
  seasons,
  selectedSeason,
  setSelectedSeason,
  selectedPhase,
  setSelectedPhase,
  getTeamLogo,
  setActiveTab,
  setSelectedTeam,
  setShouldScrollTop,
  league,
  teamNameToCode,
  team_logo_mapping,
}: LeagueStandingsTabProps) {
  const [allTeamsAdvancedStats, setAllTeamsAdvancedStats] = useState<any[]>([])
  const [standingsData, setStandingsData] = useState<any[]>([])
  const [leagueAverages, setLeagueAverages] = useState<any>(null)
  const [isAdvancedStatsLoading, setIsAdvancedStatsLoading] = useState(false)
  const [sortColumn, setSortColumn] = useState<string>("w")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("team")
  const [displayMode, setDisplayMode] = useState<DisplayMode>("rank")

  const getTeamColorStyles = (teamName: string, teamCode?: string) => {
    const code = teamCode || ""
    const bgColor = euroleague_team_colors[code] || "#1e3a8a"

    const getTextColor = (hexColor: string) => {
      const r = Number.parseInt(hexColor.slice(1, 3), 16)
      const g = Number.parseInt(hexColor.slice(3, 5), 16)
      const b = Number.parseInt(hexColor.slice(5, 7), 16)

      const brightness = (r * 299 + g * 587 + b * 114) / 1000

      return brightness > 128 ? "text-gray-900" : "text-white"
    }

    return {
      backgroundColor: bgColor,
      textColorClass: getTextColor(bgColor),
    }
  }

  useEffect(() => {
    const loadAdvancedStats = async () => {
      if (selectedSeason && league) {
        setIsAdvancedStatsLoading(true)
        try {
          console.log("Fetching advanced stats for:", { selectedSeason, league })
          const phaseParam = "RS"
          const allStats = await fetchAllTeamAdvancedStatsCalculated(selectedSeason, phaseParam, league)
          console.log("Advanced stats fetched:", allStats?.length || 0, "teams for league:", league)

          const validStats = Array.isArray(allStats)
            ? allStats.filter((stat) => stat && typeof stat === "object" && stat.teamcode)
            : []
          setAllTeamsAdvancedStats(validStats)

          const averages = await fetchLeagueAveragesPrecalculated(selectedSeason, phaseParam, league)
          console.log("League averages fetched:", averages)
          setLeagueAverages(averages || null)

          // Fetch standings data (wins, losses, point differential)
          const standings = await fetchStandingsFromGameLogs(selectedSeason, phaseParam, league)
          console.log("Standings data fetched:", standings?.length || 0, "teams")
          setStandingsData(standings || [])
        } catch (error) {
          console.error("Error fetching advanced stats:", error)
          setAllTeamsAdvancedStats([])
          setLeagueAverages(null)
          setStandingsData([])
        } finally {
          setIsAdvancedStatsLoading(false)
        }
      }
    }

    loadAdvancedStats()
  }, [selectedSeason, league])

  const getColumnGroups = () => {
    // Record group - always shown
    const recordGroup = {
      title: "RECORD",
      columns: [
        { key: "w", label: "W", tooltip: "Wins" },
        { key: "l", label: "L", tooltip: "Losses" },
        { key: "diff", label: "Diff", tooltip: "Point Differential" },
      ],
    }

    // Define all possible groups
    const ratingGroup = {
      title: "RATING",
      columns: [
        { key: "net_rating", label: "Net", tooltip: "Net Rating (Offensive - Defensive Efficiency)" },
        { key: "efficiency_o", label: "Off", tooltip: "Offensive Efficiency (points per 100 possessions)" },
        {
          key: "efficiency_d",
          label: "Def",
          tooltip: "Defensive Efficiency (points allowed per 100 possessions)",
        },
      ],
    }

    const paceGroup = {
      title: "PACE",
      columns: [{ key: "pace", label: "Pace", tooltip: "Pace (possessions per 40 minutes)" }],
    }

    const fourFactorsOffense = {
      title: "4 FACTORS",
      columns: [
        { key: "efgperc_o", label: "eFG%", tooltip: "Effective Field Goal Percentage" },
        { key: "toratio_o", label: "TO%", tooltip: "Turnover Percentage" },
        { key: "orebperc_o", label: "OREB%", tooltip: "Offensive Rebound Percentage" },
        { key: "ftrate_o", label: "FTA/FGA", tooltip: "Free Throw Rate" },
      ],
    }

    const fourFactorsDefense = {
      title: "4 FACTORS",
      columns: [
        { key: "efgperc_d", label: "eFG%", tooltip: "Opponent Effective Field Goal Percentage" },
        { key: "toratio_d", label: "TO%", tooltip: "Opponent Turnover Percentage" },
        { key: "orebperc_d", label: "OREB%", tooltip: "Opponent Offensive Rebound Percentage" },
        { key: "ftrate_d", label: "FTA/FGA", tooltip: "Opponent Free Throw Rate" },
      ],
    }

    const shootingOffense = {
      title: "SHOOTING",
      columns: [
        { key: "threeperc_o", label: "3P%", tooltip: "3-Point Percentage" },
        { key: "twoperc_o", label: "2P%", tooltip: "2-Point Percentage" },
        { key: "ftperc_o", label: "FT%", tooltip: "Free Throw Percentage" },
        { key: "threeattmprate_o", label: "3PA R", tooltip: "3-Point Attempt Rate" },
      ],
    }

    const shootingDefense = {
      title: "SHOOTING",
      columns: [
        { key: "threeperc_d", label: "3P%", tooltip: "Opponent 3-Point Percentage" },
        { key: "twoperc_d", label: "2P%", tooltip: "Opponent 2-Point Percentage" },
        { key: "ftperc_d", label: "FT%", tooltip: "Opponent Free Throw Percentage" },
        { key: "threeattmprate_d", label: "3PA R", tooltip: "Opponent 3-Point Attempt Rate" },
      ],
    }

    const ptDistOffense = {
      title: "PT DIST",
      columns: [
        { key: "points2perc_o", label: "2PT %", tooltip: "2-Point Points Percentage" },
        { key: "points3perc_o", label: "3PT %", tooltip: "3-Point Points Percentage" },
        { key: "pointsftperc_o", label: "FT %", tooltip: "Free Throw Points Percentage" },
      ],
    }

    const ptDistDefense = {
      title: "PT DIST",
      columns: [
        { key: "points2perc_d", label: "2PT %", tooltip: "Opponent 2-Point Points Percentage" },
        { key: "points3perc_d", label: "3PT %", tooltip: "Opponent 3-Point Points Percentage" },
        { key: "pointsftperc_d", label: "FT %", tooltip: "Opponent Free Throw Points Percentage" },
      ],
    }

    const miscOffense = {
      title: "MISC",
      columns: [
        { key: "assistperc_o", label: "AST%", tooltip: "Assist Percentage" },
        { key: "stealperc_o", label: "STL%", tooltip: "Steal Percentage" },
        { key: "blockperc_o", label: "BLK%", tooltip: "Block Percentage" },
      ],
    }

    const miscDefense = {
      title: "MISC",
      columns: [
        { key: "assistperc_d", label: "AST%", tooltip: "Opponent Assist Percentage" },
        { key: "stealperc_d", label: "STL%", tooltip: "Opponent Steal Percentage" },
        { key: "blockperc_d", label: "BLK%", tooltip: "Opponent Block Percentage" },
      ],
    }

    // Return groups based on view mode
    switch (viewMode) {
      case "team":
        return [recordGroup, paceGroup, ratingGroup]
      case "off-4factors":
        return [recordGroup, fourFactorsOffense]
      case "off-shooting":
        return [recordGroup, shootingOffense]
      case "off-ptdist":
        return [recordGroup, ptDistOffense]
      case "off-misc":
        return [recordGroup, miscOffense]
      case "def-4factors":
        return [recordGroup, fourFactorsDefense]
      case "def-shooting":
        return [recordGroup, shootingDefense]
      case "def-ptdist":
        return [recordGroup, ptDistDefense]
      case "def-misc":
        return [recordGroup, miscDefense]
      default:
        return [recordGroup, ratingGroup, paceGroup]
    }
  }

  const getRank = (teamCode: string, statKey: string) => {
    if (!teamCode || !statKey) return 0

    // Handle rankings for diff stat from standings data
    if (statKey === "diff") {
      if (!standingsData.length) return 0

      const teamStandings = standingsData.find((team) => team && team.teamcode === teamCode)
      if (!teamStandings) return 0

      const teamValue = teamStandings[statKey]
      if (teamValue === null || teamValue === undefined || isNaN(Number(teamValue))) return 0

      const validTeams = standingsData.filter(
        (team) => team && team[statKey] !== null && team[statKey] !== undefined && !isNaN(Number(team[statKey])),
      )

      if (validTeams.length === 0) return 0

      // For diff, higher is better
      const sorted = [...validTeams].sort((a, b) => {
        const aVal = Number(a[statKey])
        const bVal = Number(b[statKey])
        return bVal - aVal // Higher first
      })

      const rank = sorted.findIndex((team) => team && team.teamcode === teamCode) + 1
      return rank || 0
    }

    // Record stats (W/L) don't have rankings - return 0
    if (["w", "l"].includes(statKey)) {
      return 0
    }

    // Handle rankings for advanced stats
    if (!allTeamsAdvancedStats.length) return 0

    const teamAdvancedStats = allTeamsAdvancedStats.find((team) => team && team.teamcode === teamCode)
    if (!teamAdvancedStats) return 0

    const teamValue = teamAdvancedStats[statKey]
    if (teamValue === null || teamValue === undefined || isNaN(Number(teamValue))) return 0

    const validTeams = allTeamsAdvancedStats.filter(
      (team) => team && team[statKey] !== null && team[statKey] !== undefined && !isNaN(Number(team[statKey])),
    )

    if (validTeams.length === 0) return 0

    const lowerIsBetterStats = [
      "efficiency_d",
      "efgperc_d",
      "toratio_o",
      "orebperc_d",
      "ftrate_d",
      "threeperc_d",
      "twoperc_d",
      "ftperc_d",
      "threeattmprate_d",
      "points2perc_d",
      "points3perc_d",
      "pointsftperc_d",
      "assistperc_d",
      "stealperc_d",
      "blockperc_d",
    ]
    const higherIsBetter = !lowerIsBetterStats.includes(statKey)

    const sorted = [...validTeams].sort((a, b) => {
      const aVal = Number(a[statKey])
      const bVal = Number(b[statKey])
      return higherIsBetter ? bVal - aVal : aVal - bVal
    })

    const rank = sorted.findIndex((team) => team && team.teamcode === teamCode) + 1
    return rank || 0
  }

  const getStatValue = (teamCode: string, statKey: string) => {
    if (!teamCode || !statKey) return null

    // First check standings data for wins, losses, diff
    if (["w", "l", "diff"].includes(statKey)) {
      const teamStandings = standingsData.find((team) => team && team.teamcode === teamCode)
      if (teamStandings) {
        const value = teamStandings[statKey]
        return value !== undefined ? value : null
      }
    }

    // Fall back to advanced stats for other metrics
    const teamAdvancedStats = allTeamsAdvancedStats.find((team) => team && team.teamcode === teamCode)
    if (!teamAdvancedStats) return null

    const value = teamAdvancedStats[statKey]
    return value !== undefined ? value : null
  }

  const getRankBackgroundColorClass = (rank: number, total: number) => {
    if (!rank || rank <= 0 || total <= 0) {
      return `text-gray-500`
    }

    const percentile = 1 - (rank - 1) / Math.max(1, total - 1)

    let bgColor = ""
    let textColor = ""

    if (rank === 1) {
      bgColor = "bg-green-500"
      textColor = "text-white"
    } else if (rank === 2) {
      bgColor = "bg-green-400"
      textColor = "text-black"
    } else if (rank === 3) {
      bgColor = "bg-green-300"
      textColor = "text-black"
    } else if (percentile >= 0.75) {
      bgColor = "bg-green-200"
      textColor = "text-black"
    } else if (percentile >= 0.6) {
      bgColor = "bg-green-100"
      textColor = "text-black"
    } else if (percentile >= 0.4) {
      bgColor = "bg-gray-200"
      textColor = "text-black"
    } else if (percentile >= 0.25) {
      bgColor = "bg-red-100"
      textColor = "text-black"
    } else if (rank === total - 2) {
      bgColor = "bg-red-300"
      textColor = "text-black"
    } else if (rank === total - 1) {
      bgColor = "bg-red-400"
      textColor = "text-white"
    } else if (rank === total) {
      bgColor = "bg-red-500"
      textColor = "text-white"
    } else {
      bgColor = "bg-red-200"
      textColor = "text-black"
    }

    return `${bgColor} ${textColor}`
  }

  const getPaceBackgroundColorClass = (rank: number, total: number) => {
    if (!rank || rank <= 0 || total <= 0) {
      return `text-gray-500`
    }

    const percentile = 1 - (rank - 1) / Math.max(1, total - 1)

    let bgColor = ""
    let textColor = ""

    // For pace, higher is faster (good), lower is slower
    if (rank === 1) {
      bgColor = "bg-orange-500"
      textColor = "text-white"
    } else if (rank === 2) {
      bgColor = "bg-orange-400"
      textColor = "text-black"
    } else if (rank === 3) {
      bgColor = "bg-orange-300"
      textColor = "text-black"
    } else if (percentile >= 0.75) {
      bgColor = "bg-orange-200"
      textColor = "text-black"
    } else if (percentile >= 0.6) {
      bgColor = "bg-orange-100"
      textColor = "text-black"
    } else if (percentile >= 0.4) {
      bgColor = "bg-gray-200"
      textColor = "text-black"
    } else if (percentile >= 0.25) {
      bgColor = "bg-blue-100"
      textColor = "text-black"
    } else if (rank === total - 2) {
      bgColor = "bg-blue-300"
      textColor = "text-black"
    } else if (rank === total - 1) {
      bgColor = "bg-blue-400"
      textColor = "text-white"
    } else if (rank === total) {
      bgColor = "bg-blue-500"
      textColor = "text-white"
    } else {
      bgColor = "bg-blue-200"
      textColor = "text-black"
    }

    return `${bgColor} ${textColor}`
  }

  const getDiffBackgroundColorClass = (rank: number, total: number) => {
    if (!rank || rank <= 0 || total <= 0) {
      return `text-gray-500`
    }

    const percentile = 1 - (rank - 1) / Math.max(1, total - 1)

    let bgColor = ""
    let textColor = "text-black"

    // Very faint colors for point differential (higher is better)
    if (rank === 1) {
      bgColor = "bg-green-200"
    } else if (rank === 2) {
      bgColor = "bg-green-100"
    } else if (rank === 3) {
      bgColor = "bg-green-50"
    } else if (percentile >= 0.75) {
      bgColor = "bg-green-50"
    } else if (percentile >= 0.6) {
      bgColor = "bg-gray-50"
    } else if (percentile >= 0.4) {
      bgColor = "bg-gray-50"
    } else if (percentile >= 0.25) {
      bgColor = "bg-red-50"
    } else if (rank === total - 2) {
      bgColor = "bg-red-50"
    } else if (rank === total - 1) {
      bgColor = "bg-red-100"
    } else if (rank === total) {
      bgColor = "bg-red-200"
    } else {
      bgColor = "bg-red-50"
    }

    return `${bgColor} ${textColor}`
  }

  const handleColumnSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      const lowerIsBetterStats = [
        "efficiency_d",
        "efgperc_d",
        "toratio_o",
        "orebperc_d",
        "ftrate_d",
        "threeperc_d",
        "twoperc_d",
        "ftperc_d",
        "threeattmprate_d",
        "points2perc_d",
        "points3perc_d",
        "pointsftperc_d",
        "assistperc_d",
        "stealperc_d",
        "blockperc_d",
      ]
      // Losses is also lower is better
      const isLowerBetter = lowerIsBetterStats.includes(column) || column === "l"
      if (isLowerBetter) {
        setSortDirection("asc")
      } else {
        setSortDirection("desc")
      }
    }
  }

  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-2 w-2 ml-1 inline-block text-gray-400" />
    }

    return sortDirection === "desc" ? (
      <ArrowDown className="h-2 w-2 ml-1 inline-block text-[#1a365d]" />
    ) : (
      <ArrowUp className="h-2 w-2 ml-1 inline-block text-[#1a365d]" />
    )
  }

  const sortedTeams = useMemo(() => {
    console.log("Processing teams:", {
      advancedStatsLength: allTeamsAdvancedStats.length,
    })

    if (!allTeamsAdvancedStats.length) return []

    const filteredTeams = allTeamsAdvancedStats.filter((team) => {
      return (
        team &&
        team.season === selectedSeason &&
        team.teamcode &&
        team.teamcode !== "League" &&
        (team.phase === "RS" || team.phase === "Regular Season" || !team.phase)
      )
    })

    console.log(`Filtered teams for season ${selectedSeason}:`, filteredTeams.length)

    const combinedData = filteredTeams.map((team) => {
      // Find matching standings data for this team
      const standingsTeam = standingsData.find((s) => s.teamcode === team.teamcode) || {}
      
      return {
        id: team.id,
        season: team.season,
        phase: team.phase,
        position: 0,
        teamcode: team.teamcode,
        name: team.teamname || standingsTeam.name || team.teamcode,
        teamlogo: team.teamlogo || standingsTeam.teamlogo || "",
        w: standingsTeam.w || 0,
        l: standingsTeam.l || 0,
        win_percent: standingsTeam.win_percent || 0,
        diff: standingsTeam.diff || 0,
        home: standingsTeam.home || "0-0",
        away: standingsTeam.away || "0-0",
        l10: standingsTeam.l10 || "0-0",
        streak: standingsTeam.streak || "",
        net_rating: team.net_rating || null,
        efficiency_o: team.efficiency_o || null,
        efficiency_d: team.efficiency_d || null,
        pace: team.pace || null,
        efgperc_o: team.efgperc_o || null,
        efgperc_d: team.efgperc_d || null,
        toratio_o: team.toratio_o || null,
        toratio_d: team.toratio_d || null,
        orebperc_o: team.orebperc_o || null,
        orebperc_d: team.orebperc_d || null,
        ftrate_o: team.ftrate_o || null,
        ftrate_d: team.ftrate_d || null,
        threeperc_o: team.threeperc_o || null,
        threeperc_d: team.threeperc_d || null,
        twoperc_o: team.twoperc_o || null,
        twoperc_d: team.twoperc_d || null,
        ftperc_o: team.ftperc_o || null,
        ftperc_d: team.ftperc_d || null,
        threeattmprate_o: team.threeattmprate_o || null,
        threeattmprate_d: team.threeattmprate_d || null,
        points2perc_o: team.points2perc_o || null,
        points2perc_d: team.points2perc_d || null,
        points3perc_o: team.points3perc_o || null,
        points3perc_d: team.points3perc_d || null,
        pointsftperc_o: team.pointsftperc_o || null,
        pointsftperc_d: team.pointsftperc_d || null,
        assistperc_o: team.assistperc_o || null,
        assistperc_d: team.assistperc_d || null,
        stealperc_o: team.stealperc_o || null,
        stealperc_d: team.stealperc_d || null,
        blockperc_o: team.blockperc_o || null,
        blockperc_d: team.blockperc_d || null,
      }
    })

    const sorted = combinedData.sort((a, b) => {
      // Handle sorting for record columns properly
      if (sortColumn === "w") {
        const winsA = Number(a.w) || 0
        const winsB = Number(b.w) || 0
        return sortDirection === "desc" ? winsB - winsA : winsA - winsB
      }
      
      if (sortColumn === "l") {
        const lossesA = Number(a.l) || 0
        const lossesB = Number(b.l) || 0
        return sortDirection === "desc" ? lossesB - lossesA : lossesA - lossesB
      }
      
      if (sortColumn === "diff") {
        const diffA = Number(a.diff) || 0
        const diffB = Number(b.diff) || 0
        return sortDirection === "desc" ? diffB - diffA : diffA - diffB
      }
      
      // For other columns, use normal sorting
      let aValue, bValue

      switch (sortColumn) {
        case "team":
          aValue = a.name || ""
          bValue = b.name || ""
          break
        default:
          aValue = a[sortColumn]
          bValue = b[sortColumn]

          if (aValue === null || aValue === undefined || isNaN(Number(aValue))) {
            aValue = sortDirection === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
          } else {
            aValue = Number(aValue)
          }

          if (bValue === null || bValue === undefined || isNaN(Number(bValue))) {
            bValue = sortDirection === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
          } else {
            bValue = Number(bValue)
          }
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    })

    console.log("Final sorted teams:", sorted.length)
    return sorted
  }, [allTeamsAdvancedStats, standingsData, sortColumn, sortDirection, selectedSeason])

  const validTeamsCount = useMemo(() => {
    return allTeamsAdvancedStats.filter((team) => team && typeof team === "object" && team.teamcode).length
  }, [allTeamsAdvancedStats])

  if (isAdvancedStatsLoading) {
    return (
      <div className="bg-white rounded-md p-2 animate-pulse">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="space-y-1">
          {Array(10)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 "></div>
            ))}
        </div>
      </div>
    )
  }

  const columnGroups = getColumnGroups()
  const allColumns = columnGroups.flatMap((group) => group.columns)
  const totalColumns = allColumns.length
  // Calculate a fixed width for the stat columns to ensure they are uniform
  const statColumnWidth = "w-[45px] md:w-[60px]"

  return (
    <div className="bg-light-beige rounded-md p-4 border border-black shadow-sm max-w-[calc(100vw-32px)]">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 md:w-8 md:h-8 relative">
            <Image
              src={league === "eurocup" ? "/eurocup-logo.png" : "/euroleague-logo.png"}
              alt={`${league === "eurocup" ? "EuroCup" : "Euroleague"} logo`}
              fill
              className="object-contain"
            />
          </div>
          <h3 className="text-lg font-semibold">League Table</h3>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* View Mode Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="view-mode-filter" className="text-xs text-gray-600 sr-only">
              View:
            </label>
            <select
              id="view-mode-filter"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="text-[0.6rem] md:text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 md:w-auto"
            >
              <option value="team">Team</option>
              <option value="off-4factors">Off - 4 Factors</option>
              <option value="off-shooting">Off - Shooting</option>
              <option value="off-ptdist">Off - Pt Dist</option>
              <option value="off-misc">Off - Misc</option>
              <option value="def-4factors">Def - 4 Factors</option>
              <option value="def-shooting">Def - Shooting</option>
              <option value="def-ptdist">Def - Pt Dist</option>
              <option value="def-misc">Def - Misc</option>
            </select>
          </div>

          {/* Display Mode Toggle */}
          <div className="flex rounded-full bg-[#f1f5f9] p-0.5">
            <button
              onClick={() => setDisplayMode("value")}
              className={`rounded-full px-2 md:px-3 py-1 text-[0.6rem] md:text-xs font-medium ${
                displayMode === "value" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              Value
            </button>
            <button
              onClick={() => setDisplayMode("rank")}
              className={`rounded-full px-2 md:px-3 py-1 text-[0.6rem] md:text-xs font-medium ${
                displayMode === "rank" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              Rank
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full ">
          <table className="w-full text-[0.5rem] md:text-[0.6rem] border-collapse relative table-fixed rounded-none bg-light-beige">
            <thead>
              <tr className="border-b-2 bg-light-beige border-t-2 border-black ">
                <th className="bg-gray-100 text-center py-1 px-0.5 font-semibold border-r border-gray-400 w-[25px] min-w-[25px]">
                  <div className="text-[0.6rem] md:text-xs font-semibold text-gray-700"></div>
                </th>
                <th className="sticky left-[25px] bg-gray-100 text-center py-1 px-1 font-semibold border-r-2 border-gray-800 min-w-[60px] w-[60px] md:min-w-[300px] md:w-[300px]">
                  <div className="text-[0.6rem] md:text-xs font-semibold text-gray-700">TEAM</div>
                </th>
                {columnGroups.map((group, groupIndex) => (
                  <th
                    key={group.title}
                    className={`text-center py-1 px-1 font-semibold bg-gray-100 ${
                      groupIndex < columnGroups.length - 1 ? "border-r-2 border-gray-800" : ""
                    }`}
                    colSpan={group.columns.length}
                  >
                    <div className="text-[0.6rem] md:text-xs font-semibold text-gray-700">{group.title}</div>
                  </th>
                ))}
              </tr>

              <tr className="border-b-2 border-gray-800 bg-gray-50 h-5 md:h-6">
                <th className="bg-gray-50 text-center py-1 px-0.5 font-semibold border-r border-gray-400 w-[25px] min-w-[25px]">
                  <div className="text-[0.5rem] md:text-[0.7rem]"></div>
                </th>
                <th
                  className="sticky left-[25px] bg-gray-50 text-center py-1 px-1 font-semibold cursor-pointer hover:bg-gray-100 transition-colors border-r-2 border-gray-800 min-w-[60px] w-[60px] md:min-w-[300px] md:w-[300px]"
                  onClick={() => handleColumnSort("team")}
                >
                  <div className="flex items-center justify-center text-[0.5rem] md:text-[0.7rem]">
                    <span className="hidden md:inline">Name</span>
                    <span className="md:hidden">Team</span>
                    {renderSortIndicator("team")}
                  </div>
                </th>
                {columnGroups.map((group, groupIndex) => (
                  <React.Fragment key={group.title}>
                    {group.columns.map((column, colIndex) => (
                      <th
                        key={column.key}
                        className={`text-center py-1 px-1 font-medium cursor-pointer hover:bg-gray-100 transition-colors ${statColumnWidth} ${
                          colIndex === group.columns.length - 1 && groupIndex < columnGroups.length - 1
                            ? "border-r-2 border-gray-800"
                            : ""
                        }`}
                        onClick={() => handleColumnSort(column.key)}
                        title={column.tooltip}
                      >
                        <div className="flex items-center justify-center text-[0.5rem] md:text-[0.6rem]">
                          {column.label} {renderSortIndicator(column.key)}
                        </div>
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, rowIndex) => {
                const teamCode = team.teamcode
                return (
                  <tr
                    key={team.id || rowIndex}
                    className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${rowIndex % 2 === 0 ? "bg-light-beige" : "bg-gray-50"}`}
                  >
                    {/* Rank Column */}
                    <td className="bg-light-beige text-center py-1 px-0.5 font-medium border-r border-gray-400 w-[25px] min-w-[25px]">
                      <span className="text-[0.6rem] md:text-[0.7rem] font-bold text-gray-700">{rowIndex + 1}</span>
                    </td>
                    
                    {/* Team Column */}
                    <td className="sticky left-[25px] bg-light-beige py-1 px-1 font-medium border-r-2 border-gray-800 min-w-[60px] w-[60px] md:min-w-[300px] md:w-[300px]">
                      <button
                        onClick={() => {
                          setActiveTab("teams")
                          setSelectedTeam(team.name)
                          setShouldScrollTop(true)
                        }}
                        className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-300 px-1 flex items-center justify-center md:justify-start w-full group relative"
                      >
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-sm flex items-center justify-center md:mr-2 bg-white">
                          {getTeamLogo(team.name, teamCode)}
                        </div>
                        <span className="hidden md:block truncate text-[0.7rem] font-medium uppercase">{team.name}</span>
                        
                        {/* Hover tooltip - positioned to the right */}
                        <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap md:hidden pointer-events-none">
                          {team.name}
                        </div>
                      </button>
                    </td>

                    {columnGroups.map((group, groupIndex) => (
                      <React.Fragment key={group.title}>
                        {group.columns.map((column, colIndex) => {
                          const statValue = getStatValue(teamCode, column.key)
                          const rank = getRank(teamCode, column.key)
                          
                          // Handle conditional formatting for different column types
                          let cellBgClass = ""
                          if (["w", "l"].includes(column.key)) {
                            cellBgClass = "" // No background for W/L
                          } else if (column.key === "diff") {
                            cellBgClass = getDiffBackgroundColorClass(rank, validTeamsCount)
                          } else if (column.key === "pace") {
                            cellBgClass = getPaceBackgroundColorClass(rank, validTeamsCount)
                          } else {
                            cellBgClass = getRankBackgroundColorClass(rank, validTeamsCount)
                          }
                          
                          const isWinLossColumn = ["w", "l"].includes(column.key)
                          const isDiffColumn = column.key === "diff"

                          return (
                            <td
                              key={column.key}
                              className={`py-0.5 md:py-1 px-1 md:px-2 text-center font-mono text-[0.55rem] md:text-[0.7rem] ${statColumnWidth} ${
                                colIndex === group.columns.length - 1 && groupIndex < columnGroups.length - 1
                                  ? "border-r-2 border-gray-800"
                                  : ""
                              }`}
                            >
                              {isWinLossColumn ? (
                                // Win/Loss columns: no border, no background, always show values, no rank/value toggle
                                <div className="flex items-center justify-center w-full h-full p-0.5 md:p-1">
                                  <span className="font-semibold text-black">{formatStatValue(statValue, 1, column.key)}</span>
                                </div>
                              ) : isDiffColumn ? (
                                // Diff column: with faint conditional formatting, always show values, no rank/value toggle
                                <div className={`flex items-center justify-center w-full h-full p-0.5 md:p-1 ${cellBgClass}`}>
                                  <span className="font-semibold text-black">{formatStatValue(statValue, 1, column.key)}</span>
                                </div>
                              ) : (
                                // Regular columns: with border and rank/value toggle
                                <div
                                  className={`flex items-center justify-center ${
                                    displayMode === "value" ? "w-[calc(100%-4px)] mx-0.5" : "w-[calc(100%-8px)] md:w-[calc(100%-12px)] mx-1"
                                  } h-full p-0.5 md:p-1 rounded-sm border border-gray-400 ${cellBgClass}`}
                                >
                                  {displayMode === "value" ? (
                                    <span className="font-semibold text-[0.45rem] md:text-[0.6rem]">{formatStatValue(statValue, 1, column.key)}</span>
                                  ) : (
                                    <span className="font-bold">{rank}</span>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {sortedTeams.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              <p>No teams found for Regular Season {selectedSeason}</p>
              <p className="text-xs mt-1">Advanced Stats: {allTeamsAdvancedStats.length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
