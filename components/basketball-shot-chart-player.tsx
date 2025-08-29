"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import * as d3 from "d3"

// Interface for individual shot data
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
  bin: string // The custom shot bin/zone
  fastbreak: number
  second_chance: number
  points_off_turnover: number
  minute: number
  console: string
  points_a: number
  points_b: number
  utc: string
}

// Interface for the pre-calculated league average data per bin and season
interface LeagueAverageData {
  id: number
  season: number
  bin: string
  total_shots: number
  made_shots: number
  shot_percentage: number
}

// Props for the BasketballShotChart component
interface BasketballShotChartProps {
  shotData: ShotData[] // Player's shot data
  leagueAveragesData: LeagueAverageData[] // Pre-calculated league averages from DB
  playerId: string // Player ID (not directly used in rendering but good for context)
  season: string // Season (not directly used in rendering but good for context)
}

// --- NEW INTERFACES FOR STATS SUMMARY ---
interface ZoneStat {
  attempts: number
  makes: number
  percentage: number
  leagueAvg: number
  diff: number
  hasLeagueData: boolean
}

interface OverallStat {
  makes: number
  attempts: number
  percentage: number
  leagueAvg: number
  diff: number
}

interface CategorizedZoneStats {
  twoPointZones: { [key: string]: ZoneStat }
  threePointZones: { [key: string]: ZoneStat }
}
// --- END NEW INTERFACES ---

const BasketballShotChart: React.FC<BasketballShotChartProps> = ({
  shotData,
  leagueAveragesData, // Now receiving pre-calculated averages
  playerId,
  season,
}) => {
  // Constants for thresholds and styling
  const minAttemptsForColor = 2 // Minimum attempts for a hexbin to show performance color (otherwise grey)
  const minAttemptsForHexbinDisplay = 2 // Minimum attempts for a hexbin to be rendered on the chart
  const minAttemptsForLeagueAverage = 10 // Minimum attempts for a league average to be considered reliable
  const HEX_RADIUS_COURT_UNITS = 30 // Smaller radius for smaller hexagons

  const [zoneStats, setZoneStats] = useState<any>(null) // Player's zone statistics (for D3 coloring)
  const [overallStats, setOverallStats] = useState<any>(null) // New state for overall 2PT, 3PT, FT stats
  const [categorizedZoneStats, setCategorizedZoneStats] = useState<CategorizedZoneStats | null>(null) // New state for categorized zone stats (for display)
  const [isLoading, setIsLoading] = useState(false) // Loading state for chart generation

  const svgRef = useRef<SVGSVGElement>(null) // Ref for the SVG element

  // Defines standard FIBA court dimensions and scales for rendering
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

  // Determines the custom shot 'Bin' based on court coordinates
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

  // Filters out free throws and assigns 'made' status and 'bin' to each shot
  const classifyShots = (data: ShotData[], courtParameters: any) => {
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

  // Transforms the fetched LeagueAverageData into a more accessible object format
  const calculateLeagueAverages = (fetchedLeagueAverages: LeagueAverageData[]) => {
    console.log("=== PROCESSING LEAGUE AVERAGES ===")
    console.log("Processing fetched league averages:", fetchedLeagueAverages.length, "entries")

    if (!fetchedLeagueAverages || fetchedLeagueAverages.length === 0) {
      console.log("No fetched league average data available")
      return {}
    }

    const leagueAverages: { [key: string]: { percentage: number; attempts: number } } = {}

    // Iterate through fetched averages and populate the dictionary
    fetchedLeagueAverages.forEach((avg) => {
      const cleanedBin = avg.bin?.trim()
      if (!cleanedBin) {
        console.log("Skipping entry with invalid bin name:", avg)
        return // Skip if bin name is invalid
      }

      // Apply a minimum attempts threshold for league averages to ensure reliability
      if (avg.total_shots >= minAttemptsForLeagueAverage) {
        leagueAverages[cleanedBin] = {
          percentage: avg.shot_percentage,
          attempts: avg.total_shots,
        }
        console.log(
          `✓ League average for "${cleanedBin}": ${(avg.shot_percentage * 100).toFixed(1)}% (${avg.made_shots}/${avg.total_shots}) - Meets threshold`,
        )
      } else {
        console.log(
          `✗ League average for "${cleanedBin}": ${(avg.shot_percentage * 100).toFixed(1)}% (${avg.made_shots}/${avg.total_shots}) - Below threshold (${minAttemptsForLeagueAverage} attempts), not used.`,
        )
      }
    })

    console.log("Final league averages processed for", Object.keys(leagueAverages).length, "zones")
    console.log("Available zones:", Object.keys(leagueAverages))
    return leagueAverages
  }

  // Assigns a color based on player's performance relative to league average
  const getPerformanceColor = (
    playerPercentage: number,
    leaguePercentage: number,
    playerAttempts: number,
    minAttempts: number,
  ) => {
    // Return grey if player has insufficient attempts in this zone
    if (playerAttempts < minAttempts) {
      console.log(`Player attempts (${playerAttempts}) < minAttemptsForColor (${minAttempts}), returning grey.`)
      return "#9CA3AF" // Grey
    }

    // Return grey if no reliable league data is available for comparison
    if (leaguePercentage === 0 || isNaN(leaguePercentage)) {
      console.log(`League percentage is 0 or NaN (${leaguePercentage}), returning grey.`)
      return "#9CA3AF" // Grey
    }

    // Calculate the difference between player's percentage and league average
    const performanceDiff = playerPercentage - leaguePercentage

    console.log(
      `Performance comparison - Player: ${(playerPercentage * 100).toFixed(1)}%, League: ${(leaguePercentage * 100).toFixed(1)}%, Diff: ${(performanceDiff * 100).toFixed(1)}%`,
    )

    // Enhanced color scale with more granular differences
    // RED = ABOVE LEAGUE AVERAGE (GOOD/HOT)
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

  // Draws the basketball court lines and elements on the SVG
  const drawCourt = (svg: any, courtParams: any, width: number, height: number) => {
    const {
      basket_x,
      basket_y,
      three_point_radius,
      corner_line_x,
      corner_intersection_y,
      baseline_y,
      paint_width,
      paint_height,
      free_throw_distance,
      free_throw_circle_radius,
      restricted_area_radius,
      court_min_x,
      court_max_x,
      court_min_y,
      court_max_y,
    } = courtParams

    // Define scales to map court coordinates (cm-like units) to SVG pixel coordinates
    const xScale = d3.scaleLinear().domain([court_min_x, court_max_x]).range([0, width])
    const yScale = d3.scaleLinear().domain([court_min_y, court_max_y]).range([height, 0]) // Invert Y for SVG

    // Clear previous drawings
    svg.selectAll("*").remove()

    // Set the background color of the SVG
    svg.style("background-color", "#575757") // Dark grey background

    const g = svg.append("g") // Main group for court elements

    // Add clipping path to prevent elements from drawing outside court boundaries
    g.append("defs")
      .append("clipPath")
      .attr("id", "court-clip")
      .append("rect")
      .attr("x", xScale(court_min_x))
      .attr("y", yScale(court_max_y)) // Top-left Y for SVG rect
      .attr("width", xScale(court_max_x) - xScale(court_min_x))
      .attr("height", yScale(court_min_y) - yScale(court_max_y)) // Height for SVG rect

    // Apply clipping to the main group
    g.attr("clip-path", "url(#court-clip)")

    // Baseline
    g.append("line")
      .attr("x1", xScale(court_min_x))
      .attr("y1", yScale(baseline_y))
      .attr("x2", xScale(court_max_x))
      .attr("y2", yScale(baseline_y))
      .attr("stroke", "white")
      .attr("stroke-width", 3)

    // Basket
    g.append("circle")
      .attr("cx", xScale(basket_x))
      .attr("cy", yScale(basket_y))
      .attr("r", 8)
      .attr("fill", "orange")
      .attr("stroke", "white")
      .attr("stroke-width", 2)

    // Paint/Key (FIBA dimensions)
    g.append("rect")
      .attr("x", xScale(-paint_width / 2))
      .attr("y", yScale(baseline_y + paint_height)) // Y is baseline + height of paint
      .attr("width", xScale(paint_width / 2) - xScale(-paint_width / 2))
      .attr("height", yScale(baseline_y) - yScale(baseline_y + paint_height))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2)

    // Free throw line
    g.append("line")
      .attr("x1", xScale(-paint_width / 2))
      .attr("y1", yScale(baseline_y + free_throw_distance))
      .attr("x2", xScale(paint_width / 2))
      .attr("y2", yScale(baseline_y + free_throw_distance))
      .attr("stroke", "white")
      .attr("stroke-width", 2)

    // Free throw circle (semicircle) - upper part
    const ftCircleRadius_screen = xScale(free_throw_circle_radius) - xScale(0)
    g.append("path")
      .attr(
        "d",
        `M ${xScale(-free_throw_circle_radius)} ${yScale(baseline_y + free_throw_distance)}
         A ${ftCircleRadius_screen} ${ftCircleRadius_screen} 0 0 1 ${xScale(free_throw_circle_radius)} ${yScale(
           baseline_y + free_throw_distance,
         )}`,
      )
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2)

    // Free throw circle (dashed semicircle) - lower part (inside paint)
    g.append("path")
      .attr(
        "d",
        `M ${xScale(-free_throw_circle_radius)} ${yScale(baseline_y + free_throw_distance)}
         A ${ftCircleRadius_screen} ${ftCircleRadius_screen} 0 0 0 ${xScale(free_throw_circle_radius)} ${yScale(
           baseline_y + free_throw_distance,
         )}`,
      )
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")

    // 3-point arc (FIBA: 6.75m radius)
    const arcRadius_screen = xScale(three_point_radius) - xScale(0)

    g.append("path")
      .attr(
        "d",
        `M ${xScale(-corner_line_x)} ${yScale(corner_intersection_y)}
         A ${arcRadius_screen} ${arcRadius_screen} 0 0 1 ${xScale(corner_line_x)} ${yScale(corner_intersection_y)}`,
      )
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3)

    // Corner 3-point lines
    g.append("line")
      .attr("x1", xScale(-corner_line_x))
      .attr("y1", yScale(baseline_y))
      .attr("x2", xScale(-corner_line_x))
      .attr("y2", yScale(corner_intersection_y))
      .attr("stroke", "white")
      .attr("stroke-width", 3)

    g.append("line")
      .attr("x1", xScale(corner_line_x))
      .attr("y1", yScale(baseline_y))
      .attr("x2", xScale(corner_line_x))
      .attr("y2", yScale(corner_intersection_y))
      .attr("stroke", "white")
      .attr("stroke-width", 3)

    

    return { xScale, yScale, g } // Return scales and main group for further drawing
  }

  // Main function to generate and render the shot chart
  const generateShotChart = () => {
    console.log("=== GENERATING SHOT CHART ===")

    // Check if player shot data is available
    if (!shotData || shotData.length === 0) {
      console.log("No player shot data available")
      setIsLoading(false)
      return
    }

    setIsLoading(true) // Set loading state to true

    const courtParams = getCourtParameters() // Get court dimensions

    // Process player shots (filter free throws, assign 'made' status and 'bin')
    const playerFieldGoals = classifyShots(shotData, courtParams)
    console.log("Player field goals after filtering:", playerFieldGoals.length)

    if (playerFieldGoals.length === 0) {
      console.log("No player field goals found after filtering")
      setIsLoading(false)
      return
    }

    // Calculate league averages from the provided leagueAveragesData prop
    const leagueAverages = calculateLeagueAverages(leagueAveragesData || [])
    console.log("League averages calculated for zones:", Object.keys(leagueAverages))

    // Calculate player's shot statistics per bin
    const playerBinGroups: { [key: string]: { attempts: number; makes: number } } = {}
    playerFieldGoals.forEach((shot) => {
      if (!shot.bin?.trim()) {
        return // Skip if bin is not defined
      }
      const cleanedBin = shot.bin.trim()
      if (!playerBinGroups[cleanedBin]) {
        playerBinGroups[cleanedBin] = { attempts: 0, makes: 0 }
      }
      playerBinGroups[cleanedBin].attempts++
      playerBinGroups[cleanedBin].makes += shot.made
    })

    console.log("Player bin groups:", playerBinGroups)

    // Create player bin stats with league comparison for display
    const playerBinStats: { [key: string]: ZoneStat } = {} // Typed as ZoneStat
    Object.keys(playerBinGroups).forEach((bin) => {
      const playerStats = playerBinGroups[bin]
      const playerPercentage = playerStats.makes / playerStats.attempts
      const leaguePercentage = leagueAverages[bin]?.percentage || 0 // Get league avg for this bin

      playerBinStats[bin] = {
        attempts: playerStats.attempts,
        makes: playerStats.makes,
        percentage: playerPercentage,
        leagueAvg: leaguePercentage,
        diff: playerPercentage - leaguePercentage,
        // Check if league data exists AND meets the minimum threshold
        hasLeagueData: leagueAverages[bin] !== undefined && leagueAverages[bin].attempts >= minAttemptsForLeagueAverage,
      }

      console.log(
        `Zone "${bin}": Player ${(playerPercentage * 100).toFixed(1)}% (${playerStats.makes}/${playerStats.attempts}), League ${(leaguePercentage * 100).toFixed(1)}%, Diff ${((playerPercentage - leaguePercentage) * 100).toFixed(1)}%, Has League Data: ${playerBinStats[bin].hasLeagueData}`,
      )
    })

    setZoneStats(playerBinStats) // Update state for displaying zone statistics (for D3)

    // --- NEW: Calculate Overall Statistics ---
    const newOverallStats = {
      total2pt: { makes: 0, attempts: 0, percentage: 0, leagueAvg: 0, diff: 0 },
      total3pt: { makes: 0, attempts: 0, percentage: 0, leagueAvg: 0, diff: 0 },
      freeThrow: { makes: 0, attempts: 0, percentage: 0, leagueAvg: 0, diff: 0 },
    } as { [key: string]: OverallStat } // Type assertion

    playerFieldGoals.forEach((shot) => {
      if (shot.shot_type === "2PT") {
        newOverallStats.total2pt.attempts++
        newOverallStats.total2pt.makes += shot.made
      } else if (shot.shot_type === "3PT") {
        newOverallStats.total3pt.attempts++
        newOverallStats.total3pt.makes += shot.made
      }
    })

    // Handle Free Throws separately as they are filtered from playerFieldGoals
    shotData.forEach((shot) => {
      const isFreeThrow =
        shot.id_action?.toLowerCase().includes("ft") ||
        shot.id_action?.toLowerCase().includes("free") ||
        shot.action?.toLowerCase().includes("free throw") ||
        shot.action?.toLowerCase().includes("ft")

      if (isFreeThrow) {
        newOverallStats.freeThrow.attempts++
        newOverallStats.freeThrow.makes += shot.points > 0 ? 1 : 0
      }
    })

    // Calculate percentages for overall stats
    newOverallStats.total2pt.percentage =
      newOverallStats.total2pt.attempts > 0 ? newOverallStats.total2pt.makes / newOverallStats.total2pt.attempts : 0
    newOverallStats.total3pt.percentage =
      newOverallStats.total3pt.attempts > 0 ? newOverallStats.total3pt.makes / newOverallStats.total3pt.attempts : 0
    newOverallStats.freeThrow.percentage =
      newOverallStats.freeThrow.attempts > 0 ? newOverallStats.freeThrow.makes / newOverallStats.freeThrow.attempts : 0

    // --- IMPORTANT: Placeholder League Averages for Overall Stats ---
    // You'll need to fetch/calculate these from your data source or backend
    // For demonstration, I'm using static values.
    const overallLeagueAveragesPlaceholder = {
      total2pt: { percentage: 0.52, attempts: 50000 },
      total3pt: { percentage: 0.36, attempts: 30000 },
      freeThrow: { percentage: 0.78, attempts: 15000 },
    }

    newOverallStats.total2pt.leagueAvg = overallLeagueAveragesPlaceholder.total2pt.percentage
    newOverallStats.total2pt.diff = newOverallStats.total2pt.percentage - newOverallStats.total2pt.leagueAvg

    newOverallStats.total3pt.leagueAvg = overallLeagueAveragesPlaceholder.total3pt.percentage
    newOverallStats.total3pt.diff = newOverallStats.total3pt.percentage - newOverallStats.total3pt.leagueAvg

    newOverallStats.freeThrow.leagueAvg = overallLeagueAveragesPlaceholder.freeThrow.percentage
    newOverallStats.freeThrow.diff = newOverallStats.freeThrow.percentage - newOverallStats.freeThrow.leagueAvg

    setOverallStats(newOverallStats) // Update state

    // --- NEW: Categorize Zone Stats for display component ---
    const newCategorizedZoneStats: CategorizedZoneStats = {
      twoPointZones: {},
      threePointZones: {},
    }

    Object.entries(playerBinStats).forEach(([zoneName, stats]) => {
      // Logic to determine if a zone is 2PT or 3PT
      if (zoneName.includes("2pt") || zoneName === "at the rim") {
        newCategorizedZoneStats.twoPointZones[zoneName] = stats
      } else if (zoneName.includes("3") || zoneName.includes("corner")) {
        newCategorizedZoneStats.threePointZones[zoneName] = stats
      }
    })
    setCategorizedZoneStats(newCategorizedZoneStats) // Update state
    // --- END NEW STATS CALCULATION ---

    // D3.js drawing setup
    const svg = d3.select(svgRef.current)
    const svgElement = svgRef.current
    if (!svgElement) {
      setIsLoading(false)
      return
    }

    // Define SVG dimensions
    const width = 2118
    const height = 1360

    // Draw the court and get scales
    const { xScale, yScale, g } = drawCourt(svg, courtParams, width, height)

    // Hexbin parameters for grid generation
    const colSpacing_court_units = HEX_RADIUS_COURT_UNITS * Math.sqrt(3) * 1.05
    const rowSpacing_court_units = HEX_RADIUS_COURT_UNITS * 1.5 * 1.05
    const hexRadius_screen_units = xScale(HEX_RADIUS_COURT_UNITS) - xScale(0)

    // Generate hexbin centers across the court
    const hexCenters: Array<{ x: number; y: number; screenX: number; screenY: number; assignedBin: string }> = []
    const courtMinX = courtParams.court_min_x
    const courtMaxX = courtParams.court_max_x
    const courtMinY = courtParams.court_min_y
    const courtMaxY = courtParams.court_max_y

    for (let row = 0; row * rowSpacing_court_units < courtMaxY - courtMinY + rowSpacing_court_units * 2; row++) {
      const y = courtMinY + row * rowSpacing_court_units
      const xOffsetForRow_court = (row % 2) * (colSpacing_court_units / 2)

      for (let col = 0; col * colSpacing_court_units < courtMaxX - courtMinX + colSpacing_court_units * 2; col++) {
        const x = courtMinX + col * colSpacing_court_units + xOffsetForRow_court

        // Ensure hexbin centers are within a reasonable range of the court
        if (
          x >= courtMinX - HEX_RADIUS_COURT_UNITS * 2 &&
          x <= courtMaxX + HEX_RADIUS_COURT_UNITS * 2 &&
          y >= courtMinY - HEX_RADIUS_COURT_UNITS * 2 &&
          y <= courtMaxY + HEX_RADIUS_COURT_UNITS * 2
        ) {
          const assignedBin = getBinForCoordinate(x, y, courtParams)
          if (assignedBin !== "Other" && assignedBin !== "Unknown") {
            hexCenters.push({
              x: x,
              y: y,
              screenX: xScale(x),
              screenY: yScale(y),
              assignedBin: assignedBin,
            })
          }
        }
      }
    }

    // Initialize hexbin data structure
    const hexBins: any = {}
    hexCenters.forEach((center) => {
      hexBins[`${center.x},${center.y}`] = {
        center: center,
        shots: [],
        makes: 0,
        attempts: 0,
        bin: center.assignedBin,
      }
    })

    // Assign each player shot to its nearest hexbin
    playerFieldGoals.forEach((shot) => {
      if (isNaN(shot.coord_x) || isNaN(shot.coord_y) || !shot.bin?.trim()) {
        return
      }

      let nearestHexKey = ""
      let minDistance = Number.POSITIVE_INFINITY

      hexCenters.forEach((center) => {
        const distance = Math.sqrt(Math.pow(shot.coord_x - center.x, 2) + Math.pow(shot.coord_y - center.y, 2))
        if (distance < minDistance) {
          minDistance = distance
          nearestHexKey = `${center.x},${center.y}`
        }
      })

      if (nearestHexKey && hexBins[nearestHexKey]) {
        hexBins[nearestHexKey].shots.push(shot)
        hexBins[nearestHexKey].attempts++
        hexBins[nearestHexKey].makes += shot.made
      }
    })

    // Filter hexbins based on the minimum attempts for display
    const activeBins = Object.values(hexBins).filter((bin: any) => bin.attempts >= minAttemptsForHexbinDisplay)

    console.log(`Active hexbins for display: ${activeBins.length}`)

    if (activeBins.length === 0) {
      console.log("No active hexbins to display")
      setIsLoading(false)
      return
    }

    // Calculate min/max attempts for scaling hexbin size
    const maxAttempts = Math.max(...activeBins.map((bin: any) => bin.attempts))
    const minAttempts_forSize = Math.min(...activeBins.map((bin: any) => bin.attempts))

    // Function to scale hexbin size based on attempts
    const getSizeScale = (attempts: number) => {
      const minScale = 0.3 // Minimum visual scale for a hexbin
      const maxScale = 1.2 // Maximum visual scale for a hexbin

      // Normalize attempts between 0 and 1
      let normalizedAttempts = (attempts - minAttempts_forSize) / (maxAttempts - minAttempts_forSize)

      // Handle cases where all bins have the same number of attempts
      if (isNaN(normalizedAttempts) || maxAttempts - minAttempts_forSize === 0) {
        normalizedAttempts = 0.5 // Default to middle size if no variation
      }

      // Linear interpolation for scaling
      return minScale + (maxScale - minScale) * normalizedAttempts
    }

    // Draw hexbins with zone-based performance coloring
    activeBins.forEach((bin: any) => {
      const { center, attempts, makes, bin: hexBinName } = bin

      let fillColor = "#9CA3AF" // Default grey color

      // Get zone-level performance instead of hexbin-level performance
      const zoneStats = playerBinStats[hexBinName]

      if (zoneStats && zoneStats.hasLeagueData && zoneStats.attempts >= minAttemptsForColor) {
        // Use zone-level performance for coloring (all hexbins in same zone get same color)
        console.log(
          `Coloring zone "${hexBinName}": Player ${(zoneStats.percentage * 100).toFixed(1)}%, League ${(zoneStats.leagueAvg * 100).toFixed(1)}%`,
        )
        fillColor = getPerformanceColor(
          zoneStats.percentage,
          zoneStats.leagueAvg,
          zoneStats.attempts,
          minAttemptsForColor,
        )
      } else {
        const reason = !zoneStats
          ? "No player stats for this zone"
          : !zoneStats.hasLeagueData
            ? `Insufficient league data (< ${minAttemptsForLeagueAverage} attempts)`
            : `Zone attempts (${zoneStats?.attempts || 0}) < minimum (${minAttemptsForColor})`

        console.log(`Zone "${hexBinName}": Using grey color. Reason: ${reason}`)
        fillColor = "#9CA3AF" // Grey for insufficient data
      }

      const sizeScale = getSizeScale(attempts) // Keep individual hexbin size based on its attempts
      const scaledHexRadius = hexRadius_screen_units * sizeScale

      if (scaledHexRadius <= 0) {
        return
      }

      // Generate SVG path for a hexagon
      const hexPath = []
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6
        const x = center.screenX + scaledHexRadius * Math.cos(angle)
        const y = center.screenY + scaledHexRadius * Math.sin(angle)
        hexPath.push(`${i === 0 ? "M" : "L"} ${x} ${y}`)
      }
      hexPath.push("Z")

      // Append the hexagon to the SVG
      g.append("path")
        .attr("d", hexPath.join(" "))
        .attr("fill", fillColor) // Now uses zone-based color
        .attr("opacity", 0.8)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
    })

    // Define positions for zone labels on the court
    const zoneLabelPositions: { [key: string]: { x: number; y: number; anchor?: string } } = {
      "at the rim": { x: 0, y: 50 },
      "short 2pt center": { x: 0, y: 200 },
      "short 2pt left": { x: -150, y: 200, anchor: "end" },
      "short 2pt right": { x: 150, y: 200, anchor: "start" },
      "mid 2pt center": { x: 0, y: 400 },
      "mid 2pt left": { x: -300, y: 400, anchor: "end" },
      "mid 2pt right": { x: 300, y: 400, anchor: "start" },
      "top 3": { x: 0, y: 750 },
      // Corrected label positions for left/right side 3
      "left side 3": { x: 400, y: 650, anchor: "end" }, // Now on the visual right, text anchored to end
      "right side 3": { x: -400, y: 650, anchor: "start" }, // Now on the visual left, text anchored to start
      "corner 3 left": { x: -650, y: 100, anchor: "end" },
      "right corner 3": { x: 650, y: 100, anchor: "start" },
    }

    const fontSize = 50 // Font size for percentage labels
    const padding = 15 // Padding around the text for the background box

    // Draw percentage labels for each zone
    Object.entries(playerBinStats).forEach(([zoneName, stats]: [string, any]) => {
      // Only show label if the zone has sufficient attempts and a defined position
      if (zoneLabelPositions[zoneName] && stats.attempts >= minAttemptsForColor) {
        const labelX = xScale(zoneLabelPositions[zoneName].x)
        const labelY = yScale(zoneLabelPositions[zoneName].y)
        const percentageText = (stats.percentage * 100).toFixed(0) + "%"

        // Temporarily append text to measure its width for background box sizing
        const tempText = g
          .append("text")
          .attr("font-size", `${fontSize}px`)
          .attr("font-weight", "bold")
          .style("opacity", 0) // Hidden
          .text(percentageText)

        const bbox = tempText.node()?.getBBox() // Get bounding box
        tempText.remove() // Remove temporary text

        if (bbox) {
          const rectWidth = bbox.width + padding * 2
          const rectHeight = bbox.height + padding * 2

          let rectX = labelX - rectWidth / 2
          const rectY = labelY - rectHeight / 2
          let textAnchor: "start" | "middle" | "end" = "middle"

          // Adjust position based on anchor for corner/side labels
          if (zoneLabelPositions[zoneName].anchor === "start") {
            rectX = labelX - padding
            textAnchor = "start"
          } else if (zoneLabelPositions[zoneName].anchor === "end") {
            rectX = labelX - rectWidth + padding
            textAnchor = "end"
          }

          // Append rectangle for the background of the label
          g.append("rect")
            .attr("x", rectX)
            .attr("y", rectY)
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .attr("fill", "white")
            .attr("fill-opacity", 0.9) // Optional: slight transparency
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("rx", 12) // More rounded corners
            .attr("ry", 12)
            .style("pointer-events", "none")
            .style("filter", "drop-shadow(1px 1px 2px rgba(0,0,0,0.2))") // Soft shadow

          // Append the percentage text label
          g.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", textAnchor)
            .attr("dominant-baseline", "middle")
            .attr("fill", "black")
            .attr("font-size", `${fontSize}px`)
            .attr("font-weight", "bold")
            .style("pointer-events", "none")
            .text(percentageText)
        }
      }
    })

    console.log("Shot chart generation complete")
    setIsLoading(false) // Chart generation complete
  }

  // useEffect hook to re-run chart generation when relevant props change
  useEffect(() => {
    // Only generate chart if player shot data is available
    if (shotData && shotData.length > 0) {
      generateShotChart()
    }
  }, [shotData, leagueAveragesData, minAttemptsForColor, minAttemptsForHexbinDisplay]) // Dependencies: re-run if these change

  return (
    <div className="w-full">
      {/* Shot Chart Only - No Stats Panel */}
      <div className="flex flex-col items-center w-full">
        
        <div className="relative bg-gray-700 rounded-sm shadow-lg w-full h-[215px] md:h-[430px] border border-black"
    style={{ maxWidth: "100%" }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-3xl z-10 rounded-lg">
              Loading Shot Chart... 🏀
            </div>
          )}
          <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox="0 0 2118 1360"
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: "block",
              margin: 0,
              padding: 0,
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Export the stats data and component separately for external use
export const ShotStatsSummary: React.FC<{
  overallStats: {
    total2pt: OverallStat
    total3pt: OverallStat
    freeThrow: OverallStat
  }
  categorizedZoneStats: CategorizedZoneStats
}> = ({ overallStats, categorizedZoneStats }) => {
  const formatPercentage = (value: number) => (value * 100).toFixed(1) + "%"
  const formatDiff = (value: number) => (value > 0 ? "+" : "") + (value * 100).toFixed(1) + "%"

  const renderCompactStatRow = (label: string, stats: OverallStat | ZoneStat) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
      <span className="font-medium text-gray-300 text-sm">{label}</span>
      <div className="text-right">
        <div className="text-white font-semibold text-sm">
          {stats.makes}/{stats.attempts} ({formatPercentage(stats.percentage)})
        </div>
        <div className={`text-xs ${stats.diff >= 0 ? "text-green-400" : "text-red-400"}`}>
          {formatDiff(stats.diff)} vs League
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-xl text-white w-full h-full flex flex-col">
      <h2 className="text-xl font-bold text-center text-orange-400 mb-4">Team Shot Analysis</h2>

      {/* Overall Stats Section */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Overall Performance</h3>
        <div className="bg-gray-800 p-3 rounded-lg space-y-1">
          {renderCompactStatRow("2-Point Shots", overallStats.total2pt)}
          {renderCompactStatRow("3-Point Shots", overallStats.total3pt)}
          {renderCompactStatRow("Free Throws", overallStats.freeThrow)}
        </div>
      </div>

      {/* Top Performing Zones */}
      <div className="mb-4 flex-1">
        <h3 className="text-lg font-semibold text-white mb-2">Zone Performance</h3>
        <div className="bg-gray-800 p-3 rounded-lg max-h-64 overflow-y-auto">
          {/* Combine and sort all zones by performance */}
          {Object.entries({ ...categorizedZoneStats.twoPointZones, ...categorizedZoneStats.threePointZones })
            .filter(([_, stats]) => stats.attempts > 0)
            .sort(([_, a], [__, b]) => b.diff - a.diff) // Sort by performance difference
            .slice(0, 8) // Show top 8 zones
            .map(([zoneName, stats]) => (
              <div
                key={zoneName}
                className="flex justify-between items-center py-1 border-b border-gray-700 last:border-b-0"
              >
                <span className="font-medium text-gray-300 text-xs capitalize">{zoneName}</span>
                <div className="text-right">
                  <div className="text-white text-xs">
                    {stats.makes}/{stats.attempts} ({formatPercentage(stats.percentage)})
                  </div>
                  <div className={`text-xs ${stats.diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatDiff(stats.diff)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

    </div>
  )
}

export default BasketballShotChart

// Export the interfaces and types for external use
export type { OverallStat, CategorizedZoneStats, ZoneStat }
