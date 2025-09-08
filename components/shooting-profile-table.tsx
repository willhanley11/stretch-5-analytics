"use client"

interface ZoneStats {
  attempts: number
  makes: number
  percentage: number
  leagueAvg: number
  diff: number
  hasLeagueData: boolean
}

interface ShootingProfileTableProps {
  teamShotData: any[]
  leagueAveragesData: any[]
  teamName: string
  isLoading?: boolean
}

export function ShootingProfileTable({
  teamShotData,
  leagueAveragesData,
  teamName,
  isLoading = false,
}: ShootingProfileTableProps) {
  // Exact same court parameters as basketball-shot-chart-team
  const getCourtParameters = () => {
    return {
      basket_x: 0,
      basket_y: 0,
      three_point_radius: 675,
      corner_line_x: 660,
      baseline_y: -100,
      corner_intersection_y: 157.5,
      paint_width: 490,
      paint_height: 580,
      free_throw_distance: 580,
      free_throw_circle_radius: 180,
      restricted_area_radius: 125,
      court_min_x: -750,
      court_max_x: 750,
      court_min_y: -100,
      court_max_y: 850,
    }
  }

  // Exact same bin calculation as basketball-shot-chart-team
  const getBinForCoordinate = (x: number, y: number, courtParameters: any) => {
    const { basket_x, basket_y, three_point_radius, corner_line_x, corner_intersection_y, restricted_area_radius } =
      courtParameters
    const distance = Math.sqrt(Math.pow(x - basket_x, 2) + Math.pow(y - basket_y, 2))
    const angle = Math.atan2(x - basket_x, y - basket_y) * (180 / Math.PI)

    const isInCorner3Zone = Math.abs(x) >= corner_line_x && y <= corner_intersection_y
    const isInArc3Zone = distance >= three_point_radius && y > corner_intersection_y
    const isActually3PT = isInCorner3Zone || isInArc3Zone

    let bin_name = "Unknown" // Default bin name

    if (isActually3PT) {
      // Logic for 3-point zones
      if (isInCorner3Zone) {
        bin_name = x < 0 ? "corner 3 left" : "right corner 3"
      } else {
        if (angle < -30) bin_name = "right side 3"
        else if (angle > 30) bin_name = "left side 3"
        else bin_name = "top 3"
      }
    } else {
      // Logic for 2-point zones
      if (distance <= restricted_area_radius) bin_name = "at the rim"
      else if (distance <= 300) {
        if (x < -50) bin_name = "short 2pt left"
        else if (x > 50) bin_name = "short 2pt right"
        else bin_name = "short 2pt center"
      } else {
        if (x < -50) bin_name = "mid 2pt left"
        else if (x > 50) bin_name = "mid 2pt right"
        else bin_name = "mid 2pt center"
      }
    }
    return bin_name.trim() // Return trimmed bin name
  }

  // Exact same shot classification as basketball-shot-chart-team
  const classifyShots = (data: any[], courtParameters: any) => {
    return data
      .filter((shot) => {
        // Filter out free throws based on action ID or description
        const isFreeThrow =
          shot.id_action?.toLowerCase().includes("ft") ||
          shot.id_action?.toLowerCase().includes("free") ||
          shot.action?.toLowerCase().includes("free throw") ||
          shot.action?.toLowerCase().includes("ft")

        return !isFreeThrow
      })
      .map((shot) => {
        let binName = shot.bin?.trim() || ""
        // If bin is not provided in data, calculate it from coordinates
        if (!binName && !isNaN(shot.coord_x) && !isNaN(shot.coord_y)) {
          binName = getBinForCoordinate(shot.coord_x, shot.coord_y, courtParameters)
        }

        return {
          ...shot,
          bin: binName, // Ensure bin is set
          // Determine shot type (2PT or 3PT) based on action ID
          shot_type:
            shot.id_action?.toUpperCase().includes("3FG") || shot.id_action?.toUpperCase().includes("3PT")
              ? "3PT"
              : "2PT",
          made: shot.points > 0 ? 1 : 0, // 1 if made, 0 if missed
        }
      })
  }

  const calculateZoneStats = () => {
    console.log("=== SHOOTING PROFILE TABLE: CALCULATING ZONE STATS ===")
    console.log("Team shot data length:", teamShotData?.length || 0)
    console.log("League averages data length:", leagueAveragesData?.length || 0)

    if (!teamShotData || teamShotData.length === 0) {
      console.log("No team shot data available")
      return {
        totalTwoPointStats: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        atTheRim: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        shortTwoPoint: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        midTwoPoint: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        totalThreePointStats: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        cornerThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        leftSideThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        rightSideThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        topThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
      }
    }

    const courtParams = getCourtParameters()
    const teamFieldGoals = classifyShots(teamShotData, courtParams)

    if (teamFieldGoals.length === 0) {
      console.log("No team field goals found after filtering")
      return {
        totalTwoPointStats: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        atTheRim: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        shortTwoPoint: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        midTwoPoint: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        totalThreePointStats: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        cornerThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        leftSideThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        rightSideThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
        topThree: { attempts: 0, makes: 0, percentage: 0, leagueAvg: 0, diff: 0, hasLeagueData: false },
      }
    }

    const teamBinGroups: { [key: string]: { attempts: number; makes: number } } = {}
    teamFieldGoals.forEach((shot) => {
      if (!shot.bin?.trim()) {
        return
      }
      const cleanedBin = shot.bin.trim()
      if (!teamBinGroups[cleanedBin]) {
        teamBinGroups[cleanedBin] = { attempts: 0, makes: 0 }
      }
      teamBinGroups[cleanedBin].attempts++
      teamBinGroups[cleanedBin].makes += shot.made
    })

    const minAttemptsForLeagueAverage = 10
    const leagueAverages: { [key: string]: { percentage: number; attempts: number } } = {}

    if (leagueAveragesData && leagueAveragesData.length > 0) {
      leagueAveragesData.forEach((avg) => {
        const cleanedBin = avg.bin?.trim()
        if (!cleanedBin) {
          return
        }
        if (avg.total_shots >= minAttemptsForLeagueAverage) {
          leagueAverages[cleanedBin] = {
            percentage: avg.shot_percentage,
            attempts: avg.total_shots,
          }
        }
      })
    }

    const calculateStatsForGroup = (zoneNames: string[]) => {
      let totalAttempts = 0
      let totalMakes = 0
      let totalLeagueAvg = 0
      let leagueAvgAttempts = 0
      let hasLeagueData = false

      zoneNames.forEach((zone) => {
        const teamStats = teamBinGroups[zone] || { attempts: 0, makes: 0 }
        totalAttempts += teamStats.attempts
        totalMakes += teamStats.makes

        if (leagueAverages[zone] && leagueAverages[zone].attempts >= minAttemptsForLeagueAverage) {
          totalLeagueAvg += leagueAverages[zone].percentage * leagueAverages[zone].attempts
          leagueAvgAttempts += leagueAverages[zone].attempts
          hasLeagueData = true // At least one sub-zone has league data
        }
      })

      const percentage = totalAttempts > 0 ? (totalMakes / totalAttempts) * 100 : 0
      const effectiveLeagueAvg = leagueAvgAttempts > 0 ? (totalLeagueAvg / leagueAvgAttempts) * 100 : 0
      const diff = percentage - effectiveLeagueAvg

      return {
        attempts: totalAttempts,
        makes: totalMakes,
        percentage: percentage,
        leagueAvg: effectiveLeagueAvg,
        diff: diff,
        hasLeagueData: hasLeagueData,
      }
    }

    // Individual zone stats (same as before, but ensure all exist)
    const teamBinStats: { [key: string]: ZoneStats } = {}
    const allExpectedZones = [
      "at the rim", "short 2pt center", "short 2pt left", "short 2pt right",
      "mid 2pt center", "mid 2pt left", "mid 2pt right",
      "corner 3 left", "right corner 3", "left side 3", "right side 3", "top 3",
    ]

    allExpectedZones.forEach(zone => {
        const teamStats = teamBinGroups[zone] || { attempts: 0, makes: 0 };
        const teamPercentage = teamStats.attempts > 0 ? teamStats.makes / teamStats.attempts : 0;
        const leaguePercentage = leagueAverages[zone]?.percentage || 0;

        teamBinStats[zone] = {
            attempts: teamStats.attempts,
            makes: teamStats.makes,
            percentage: teamPercentage * 100,
            leagueAvg: leaguePercentage * 100,
            diff: (teamPercentage - leaguePercentage) * 100,
            hasLeagueData: leagueAverages[zone] !== undefined && leagueAverages[zone].attempts >= minAttemptsForLeagueAverage,
        };
    });

    // Grouped 2-point zones
    const totalTwoPointStats = calculateStatsForGroup([
      "at the rim",
      "short 2pt center",
      "short 2pt left",
      "short 2pt right",
      "mid 2pt center",
      "mid 2pt left",
      "mid 2pt right",
    ])
    const atTheRim = teamBinStats["at the rim"]
    const shortTwoPoint = calculateStatsForGroup(["short 2pt center", "short 2pt left", "short 2pt right"])
    const midTwoPoint = calculateStatsForGroup(["mid 2pt center", "mid 2pt left", "mid 2pt right"])

    // Grouped 3-point zones
    const totalThreePointStats = calculateStatsForGroup([
      "corner 3 left",
      "right corner 3",
      "left side 3",
      "right side 3",
      "top 3",
    ])
    const cornerThree = calculateStatsForGroup(["corner 3 left", "right corner 3"])
    const leftSideThree = teamBinStats["left side 3"]
    const rightSideThree = teamBinStats["right side 3"]
    const topThree = teamBinStats["top 3"]


    return {
      totalTwoPointStats,
      atTheRim,
      shortTwoPoint,
      midTwoPoint,
      totalThreePointStats,
      cornerThree,
      leftSideThree,
      rightSideThree,
      topThree,
    }
  }

  const {
    totalTwoPointStats,
    atTheRim,
    shortTwoPoint,
    midTwoPoint,
    totalThreePointStats,
    cornerThree,
    leftSideThree,
    rightSideThree,
    topThree,
  } = calculateZoneStats()

  // Helper function to capitalize zone names
  const capitalizeZone = (zoneName: string) => {
    return zoneName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatPercentage = (value: number) => {
    return isNaN(value) ? "0.0%" : `${value.toFixed(1)}%`
  }

  const formatDifference = (diff: number) => {
    if (isNaN(diff)) return "N/A"
    const sign = diff > 0 ? "+" : ""
    return `${sign}${diff.toFixed(1)}%`
  }

  const getDifferenceColor = (diff: number, hasLeagueData: boolean) => {
    if (!hasLeagueData || isNaN(diff)) return "#9CA3AF" // Grey for no data
    
    const performanceDiff = diff / 100 // Convert percentage points to decimal
    
    if (performanceDiff >= 0.12) {
      return "#7F1D1D" // Very dark red - significantly above average
    } else if (performanceDiff >= 0.09) {
      return "#991B1B" // Dark red - well above average
    } else if (performanceDiff >= 0.06) {
      return "#DC2626" // Red - above average
    } else if (performanceDiff >= 0.04) {
      return "#EF4444" // Light red - slightly above average
    } else if (performanceDiff >= 0.02) {
      return "#F87171" // Very light red - just above average
    }
    // GREY = NEAR LEAGUE AVERAGE
    else if (performanceDiff >= -0.02) {
      return "#9CA3AF" // Grey - at league average
    }
    // BLUE = BELOW LEAGUE AVERAGE (BAD/COLD)
    else if (performanceDiff >= -0.04) {
      return "#60A5FA" // Very light blue - just below average
    } else if (performanceDiff >= -0.06) {
      return "#3B82F6" // Light blue - slightly below average
    } else if (performanceDiff >= -0.09) {
      return "#1D4ED8" // Blue - below average
    } else if (performanceDiff >= -0.12) {
      return "#1E40AF" // Dark blue - well below average
    } else {
      return "#1E3A8A" // Very dark blue - significantly below average
    }
  }

  const renderZoneRow = (zoneName: string, stats: ZoneStats, isGroupHeader: boolean = false) => {
    const diffColor = getDifferenceColor(stats.diff, stats.hasLeagueData)
    const textColor = stats.diff > 0 ? "#FFFFFF" : "#FFFFFF" // White text for better contrast
    const rowClass = isGroupHeader ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"

    return (
      <tr key={zoneName} className={`border-b border-gray-200 ${rowClass}`}>
  <td className="py-0.5 md:py-2 px-2 text-center text-[10px] md:text-xs font-semibold">
    {capitalizeZone(zoneName)}
  </td>
  <td className="py-0.5 md:py-2 px-2 text-center text-[10px] md:text-xs">
    {stats.makes}
  </td>
  <td className="py-0.5 md:py-2 px-2 text-center text-[10px] md:text-xs">
    {stats.attempts}
  </td>
  <td className="py-0.5 md:py-2 px-2 text-center text-[10px] md:text-xs font-mono">
    {formatPercentage(stats.percentage)}
  </td>
  <td className="py-0.5 md:py-2 px-2 text-center">
    <span
      className="inline-block px-1 py-0 md:py-0.5 rounded-md text-[9px] md:text-xs font-medium"
      style={{ 
        backgroundColor: diffColor,
        color: textColor
      }}
    >
      {formatDifference(stats.diff)}
    </span>
  </td>
</tr>

    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Loading shooting data...</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto ">
      {/* 2-Point Zones Section */}
      <div className="mb-1 lg:mb-3 mt-1 lg:mt-0 ">
        <div className="bg-warm-beige border-t border-l border-r border-gray-400 text-black px-2 py-2 rounded-t-md  ">
          <h4 className="font-semibold text-sm text-center">2-Point Field Goals</h4>
        </div>
        <div className="border border-gray-400 rounded-b-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-400">
              <tr>
                <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">Zone</th>
                <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">Makes</th>
                <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">Attempts</th>
                <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">FG%</th>
                <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">vs League</th>
              </tr>
            </thead>
            <tbody>
              {renderZoneRow("At The Rim", atTheRim)}
              {renderZoneRow("Short", shortTwoPoint)}
              {renderZoneRow("Mid", midTwoPoint)}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Point Zones Section */}
      <div className="mt-0 md:mt-0">
  <div className="bg-warm-beige border-t border-l border-r border-gray-400 text-black px-2 py-2 rounded-t-md ">
          <h4 className="font-semibold text-sm text-center">3-Point Field Goals</h4>
        </div>
        <div className="border border-gray-400 rounded-b-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-warm-beige border-b border-gray-400">
        <tr>
          <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">Zone</th>
          <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">Makes</th>
          <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">Attempts</th>
          <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">FG%</th>
          <th className="py-1 px-2 text-center font-sm text-gray-700 text-xs">vs League</th>
        </tr>
      </thead>
      <tbody>
        {renderZoneRow("Corners", cornerThree)}
        {renderZoneRow("Left Side", leftSideThree)}
        {renderZoneRow("Right Side", rightSideThree)}
        {renderZoneRow("Top", topThree)}
      </tbody>
    </table>
  </div>
</div>
    </div>
  )
}
