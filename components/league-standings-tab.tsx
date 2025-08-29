"use client"

import React from "react"
import type { ReactNode } from "react"
import { useState, useEffect, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { fetchAllTeamAdvancedStatsCalculated, fetchLeagueAveragesPrecalculated } from "@/app/actions/standings"
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

type ViewMode = "offense" | "defense" | "fourfactors"
type DisplayMode = "rank" | "value"

const formatStatValue = (value: number | undefined | null, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return "-"
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
  const [leagueAverages, setLeagueAverages] = useState<any>(null)
  const [isAdvancedStatsLoading, setIsAdvancedStatsLoading] = useState(false)
  const [sortColumn, setSortColumn] = useState<string>("net_rating")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("fourfactors")
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
        } catch (error) {
          console.error("Error fetching advanced stats:", error)
          setAllTeamsAdvancedStats([])
          setLeagueAverages(null)
        } finally {
          setIsAdvancedStatsLoading(false)
        }
      }
    }

    loadAdvancedStats()
  }, [selectedSeason, league])

  const getColumnGroups = () => {
    const allGroupsDefinition = [
      {
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
        alwaysShow: true,
      },
      {
        title: "PACE",
        columns: [{ key: "pace", label: "Pace", tooltip: "Pace (possessions per 40 minutes)" }],
        alwaysShow: true,
      },
      {
        title: "FOUR FACTORS",
        columns: [
          { key: "efgperc_o", label: "eFG%", tooltip: "Effective Field Goal Percentage" },
          { key: "efgperc_d", label: "Opp eFG%", tooltip: "Opponent Effective Field Goal Percentage" },
          { key: "toratio_o", label: "TO%", tooltip: "Turnover Percentage" },
          { key: "toratio_d", label: "Opp TO%", tooltip: "Opponent Turnover Percentage" },
          { key: "orebperc_o", label: "OREB%", tooltip: "Offensive Rebound Percentage" },
          { key: "orebperc_d", label: "Opp OREB%", tooltip: "Opponent Offensive Rebound Percentage" },
          { key: "ftrate_o", label: "FTA/FGA", tooltip: "Free Throw Rate" },
          { key: "ftrate_d", label: "Opp FTA/FGA", tooltip: "Opponent Free Throw Rate" },
        ],
      },
      {
        title: "SHOOTING",
        columns: [
          { key: "threeperc_o", label: "3P%", tooltip: "3-Point Percentage" },
          { key: "threeperc_d", label: "Opp 3P%", tooltip: "Opponent 3-Point Percentage" },
          { key: "twoperc_o", label: "2P%", tooltip: "2-Point Percentage" },
          { key: "twoperc_d", label: "Opp 2P%", tooltip: "Opponent 2-Point Percentage" },
          { key: "ftperc_o", label: "FT%", tooltip: "Free Throw Percentage" },
          { key: "ftperc_d", label: "Opp FT%", tooltip: "Opponent Free Throw Percentage" },
          { key: "threeattmprate_o", label: "3PA R", tooltip: "3-Point Attempt Rate" },
          { key: "threeattmprate_d", label: "Opp 3PA R", tooltip: "Opponent 3-Point Attempt Rate" },
        ],
      },
      {
        title: "POINT DISTRIBUTION",
        columns: [
          { key: "points2perc_o", label: "2PT %", tooltip: "2-Point Points Percentage" },
          { key: "points2perc_d", label: "Opp 2PT %", tooltip: "Opponent 2-Point Points Percentage" },
          { key: "points3perc_o", label: "3PT %", tooltip: "3-Point Points Percentage" },
          { key: "points3perc_d", label: "Opp 3PT %" },
          { key: "pointsftperc_o", label: "FT %", tooltip: "Free Throw Points Percentage" },
          { key: "pointsftperc_d", label: "Opp FT %", tooltip: "Opponent Free Throw Points Percentage" },
        ],
      },
      {
        title: "MISCELLANEOUS",
        columns: [
          { key: "assistperc_o", label: "AST%", tooltip: "Assist Percentage" },
          { key: "assistperc_d", label: "Opp AST%", tooltip: "Opponent Assist Percentage" },
          { key: "stealperc_o", label: "STL%", tooltip: "Steal Percentage" },
          { key: "stealperc_d", label: "Opp STL%", tooltip: "Opponent Steal Percentage" },
          { key: "blockperc_o", label: "BLK%", tooltip: "Block Percentage" },
          { key: "blockperc_d", label: "Opp BLK%", tooltip: "Opponent Block Percentage" },
        ],
      },
    ]

    let filteredAndModifiedGroups: any[] = []

    if (viewMode === "fourfactors") {
      allGroupsDefinition.forEach((group) => {
        if (group.alwaysShow) {
          filteredAndModifiedGroups.push(group)
        } else if (group.title === "FOUR FACTORS") {
          filteredAndModifiedGroups.push({
            title: "OFFENSE",
            columns: group.columns.filter((col) => col.key.endsWith("_o")),
          })
          filteredAndModifiedGroups.push({
            title: "DEFENSE",
            columns: group.columns
              .filter((col) => col.key.endsWith("_d"))
              .map((col) => ({
                ...col,
                label: col.label.startsWith("Opp ") ? col.label.substring(4) : col.label,
              })),
          })
        }
      })
    } else {
      filteredAndModifiedGroups = allGroupsDefinition.map((group) => {
        if (group.alwaysShow) {
          return group
        } else if (viewMode === "offense") {
          return {
            ...group,
            columns: group.columns.filter((col) => col.key.endsWith("_o")),
          }
        } else if (viewMode === "defense") {
          return {
            ...group,
            columns: group.columns
              .filter((col) => col.key.endsWith("_d"))
              .map((col) => {
                const newLabel = col.label.startsWith("Opp ") ? col.label.substring(4) : col.label
                return {
                  ...col,
                  label: newLabel,
                }
              }),
          }
        }
        return group
      })
    }

    return filteredAndModifiedGroups.filter((group) => group.columns.length > 0)
  }

  const getRank = (teamCode: string, statKey: string) => {
    if (!allTeamsAdvancedStats.length || !teamCode || !statKey) return 0

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
      bgColor = "bg-teal-500"
      textColor = "text-black"
    } else if (rank === 2) {
      bgColor = "bg-teal-400"
      textColor = "text-black"
    } else if (rank === 3) {
      bgColor = "bg-teal-300"
      textColor = "text-black"
    } else if (percentile >= 0.75) {
      bgColor = "bg-teal-200"
      textColor = "text-black"
    } else if (percentile >= 0.6) {
      bgColor = "bg-teal-100"
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
      if (lowerIsBetterStats.includes(column)) {
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

    const combinedData = filteredTeams.map((team) => ({
      id: team.id,
      season: team.season,
      phase: team.phase,
      position: 0,
      teamcode: team.teamcode,
      name: team.teamname || team.teamcode,
      teamlogo: team.teamlogo || "",
      w: 0,
      l: 0,
      win_percent: 0,
      diff: 0,
      home: "0-0",
      away: "0-0",
      l10: "0-0",
      streak: "",
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
    }))

    const sorted = combinedData.sort((a, b) => {
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
  }, [allTeamsAdvancedStats, sortColumn, sortDirection, selectedSeason])

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
  const statColumnWidth = "w-[60px]"

  return (
    <div className="bg-white rounded-md p-4 border border-black shadow-sm max-w-[calc(100vw-32px)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center mt-1 mb-1">Regular Season Table</h3>
        <div className="flex items-center gap-4">
          {/* View Mode Dropdown */}
          <div className="flex items-center gap-1">
            <label htmlFor="view-mode-filter" className="text-xs text-gray-600 sr-only">
              View:
            </label>
            <select
              id="view-mode-filter"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="fourfactors">4 Factors</option>
              <option value="offense">Offense</option>
              <option value="defense">Defense</option>
            </select>
          </div>

          {/* Display Mode Toggle */}
          <div className="flex rounded-full bg-[#f1f5f9] p-0.5">
            <button
              onClick={() => setDisplayMode("value")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                displayMode === "value" ? "bg-[#475569] text-white" : "text-[#475569]"
              }`}
            >
              Value
            </button>
            <button
              onClick={() => setDisplayMode("rank")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
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
          <table className="w-full text-[0.6rem] border-collapse relative table-fixed rounded-none ">
            <thead>
              <tr className="border-b-2 bg-white border-t-2 border-black ">
                <th className="sticky left-0 bg-gray-100 text-center py-1 px-1 font-semibold border-r-2 border-gray-800 min-w-[300px] w-[300px]">
                  <div className="text-xs font-semibold text-gray-700">TEAM</div>
                </th>
                {columnGroups.map((group, groupIndex) => (
                  <th
                    key={group.title}
                    className={`text-center py-1 px-1 font-semibold bg-gray-100 ${
                      groupIndex < columnGroups.length - 1 ? "border-r-2 border-gray-800" : ""
                    }`}
                    colSpan={group.columns.length}
                  >
                    <div className="text-xs font-semibold text-gray-700">{group.title}</div>
                  </th>
                ))}
              </tr>

              <tr className="border-b-2 border-gray-800 bg-gray-50 h-6">
                <th
                  className="sticky left-0 bg-gray-50 text-left py-1 px-1 font-semibold cursor-pointer hover:bg-gray-100 transition-colors border-r-2 border-gray-800 min-w-[300px] w-[300px]"
                  onClick={() => handleColumnSort("team")}
                >
                  <div className="flex items-center justify-start text-[0.7rem]">
                    Name {renderSortIndicator("team")}
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
                        <div className="flex items-center justify-center text-[0.6rem]">
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
                    className={`border-b border-gray-200 hover:bg-gray-100 transition-colors ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="sticky left-0 bg-white py-1 px-1 font-medium border-r-2 border-gray-800 min-w-[300px] w-[300px]">
                      <button
                        onClick={() => {
                          setActiveTab("teams")
                          setSelectedTeam(team.name)
                          setShouldScrollTop(true)
                        }}
                        className="hover:underline focus:outline-none focus:ring-1 focus:ring-blue-300 px-1 flex items-center w-full"
                      >
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center mr-2 border border-black"
                          style={{ backgroundColor: getTeamColorStyles(team.name, teamCode).backgroundColor }}
                        >
                          {getTeamLogo(team.name, teamCode)}
                        </div>
                        <span className="truncate text-[0.7rem] font-medium uppercase">{team.name}</span>
                      </button>
                    </td>

                    {columnGroups.map((group, groupIndex) => (
                      <React.Fragment key={group.title}>
                        {group.columns.map((column, colIndex) => {
                          const statValue = getStatValue(teamCode, column.key)
                          const rank = getRank(teamCode, column.key)
                          const cellBgClass = getRankBackgroundColorClass(rank, validTeamsCount)

                          return (
                            <td
                              key={column.key}
                              className={`py-1 px-2 text-center font-mono text-[0.7rem] ${statColumnWidth} ${
                                colIndex === group.columns.length - 1 && groupIndex < columnGroups.length - 1
                                  ? "border-r-2 border-gray-800"
                                  : ""
                              }`}
                            >
                              <div
                                className={`flex items-center justify-center ${
                                  displayMode === "value" ? "w-[calc(100%-4px)] mx-0.5" : "w-[calc(100%-12px)] mx-1"
                                } h-full p-1 rounded-sm border border-gray-400 ${cellBgClass}`}
                              >
                                {displayMode === "value" ? (
                                  <span className="font-semibold">{formatStatValue(statValue)}</span>
                                ) : (
                                  <span className="font-bold">{rank}</span>
                                )}
                              </div>
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
