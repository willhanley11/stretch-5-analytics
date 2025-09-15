"use client"

import { useState, useEffect, useRef } from "react"
import { Users, BarChart3, Target, ChevronDown } from "lucide-react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { fetchPlayerStatsFromGameLogs } from "@/app/actions/standings"
import type { PlayerStatsFromGameLogs } from "@/lib/db"
import { LeagueLoadingScreen } from "@/components/ui/league-spinner"

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
  initialPlayers, // Add initialPlayers prop from landing page
}: { selectedSeason?: number; selectedLeague?: string; initialPlayers?: PlayerStatsFromGameLogs[] }) => {
  // Debug logging
  console.log("=== COMPARISON TAB DEBUG ===", {
    selectedSeason,
    selectedLeague,
    initialPlayers: initialPlayers?.map(p => p.player_name),
    initialPlayersLength: initialPlayers?.length
  })
  
  // Updated interface to use 'selectedLeague'
  const [currentPhase, setCurrentPhase] = useState<string>("Regular Season")
  const [allPlayers, setAllPlayers] = useState<PlayerStatsFromGameLogs[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [comparisonMode, setComparisonMode] = useState<"average" | "per40">("average")
  
  // Dropdown states for all players
  const [isPlayer1TeamDropdownOpen, setIsPlayer1TeamDropdownOpen] = useState(false)
  const [isPlayer1PlayerDropdownOpen, setIsPlayer1PlayerDropdownOpen] = useState(false)
  const [isPlayer2TeamDropdownOpen, setIsPlayer2TeamDropdownOpen] = useState(false)
  const [isPlayer2PlayerDropdownOpen, setIsPlayer2PlayerDropdownOpen] = useState(false)
  const [isPlayer3TeamDropdownOpen, setIsPlayer3TeamDropdownOpen] = useState(false)
  const [isPlayer3PlayerDropdownOpen, setIsPlayer3PlayerDropdownOpen] = useState(false)
  const [isPlayer4TeamDropdownOpen, setIsPlayer4TeamDropdownOpen] = useState(false)
  const [isPlayer4PlayerDropdownOpen, setIsPlayer4PlayerDropdownOpen] = useState(false)
  
  // Page height management for dropdown visibility
  const [extraHeight, setExtraHeight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsPlayer1TeamDropdownOpen(false)
    setIsPlayer1PlayerDropdownOpen(false)
    setIsPlayer2TeamDropdownOpen(false)
    setIsPlayer2PlayerDropdownOpen(false)
    setIsPlayer3TeamDropdownOpen(false)
    setIsPlayer3PlayerDropdownOpen(false)
    setIsPlayer4TeamDropdownOpen(false)
    setIsPlayer4PlayerDropdownOpen(false)
    setExtraHeight(0)
  }
  
  // Function to handle dropdown opening with height management
  const openDropdownWithHeight = (dropdownSetter: (open: boolean) => void, dropdownHeight = 240) => {
    closeAllDropdowns()
    dropdownSetter(true)
    
    // Calculate if we need extra height
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const containerBottom = containerRect.bottom
      const spaceBelow = viewportHeight - containerBottom
      
      if (spaceBelow < dropdownHeight + 20) {
        const neededHeight = dropdownHeight + 20 - spaceBelow
        setExtraHeight(neededHeight)
        
        // Scroll to show the dropdown
        setTimeout(() => {
          const scrollAmount = window.scrollY + neededHeight
          window.scrollTo({ top: scrollAmount, behavior: 'smooth' })
        }, 100)
      }
    }
  }

  // State for team and player selection - 4 players for large screens, 2 for mobile
  const [selectedTeams, setSelectedTeams] = useState<(string | null)[]>(() => {
    if (initialPlayers && initialPlayers.length >= 2) {
      return [
        initialPlayers[0]?.player_team_code || null,
        initialPlayers[1]?.player_team_code || null,
        null,
        null
      ]
    }
    return [null, null, null, null]
  })
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<(string | null)[]>(() => {
    if (initialPlayers && initialPlayers.length >= 2) {
      return [
        initialPlayers[0]?.player_id || null,
        initialPlayers[1]?.player_id || null,
        null,
        null
      ]
    }
    return [null, null, null, null]
  })
  
  // Track screen size for responsive comparison logic
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  // Organize players by team for selection
  const [teamsList, setTeamsList] = useState<{ id: string; name: string }[]>([])
  const [playersByTeam, setPlayersByTeam] = useState<{ [key: string]: PlayerStatsFromGameLogs[] }>({})

  // Track screen size for responsive comparison logic
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // lg breakpoint is 1024px
    }
    
    // Check on mount
    checkScreenSize()
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Handle initialPlayers prop from landing page
  useEffect(() => {
    if (initialPlayers && initialPlayers.length >= 2) {
      console.log("Setting initial players from landing page:", initialPlayers[0]?.player_name, "vs", initialPlayers[1]?.player_name)
      setSelectedTeams([
        initialPlayers[0]?.player_team_code || null,
        initialPlayers[1]?.player_team_code || null,
        null,
        null
      ])
      setSelectedPlayerIds([
        initialPlayers[0]?.player_id || null,
        initialPlayers[1]?.player_id || null,
        null,
        null
      ])
    }
  }, [initialPlayers])

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
        
        // Set default players from different teams - 4 players for large screens
        // Only auto-select if we don't have initial players from landing page
        if (!initialPlayers || initialPlayers.length < 2) {
          console.log("Auto-selecting default players")
          if (teamsMap.size >= 4) {
            const teamCodes = Array.from(teamsMap.keys())
            const firstTeam = teamCodes[0]
            const secondTeam = teamCodes[1]
            const thirdTeam = teamCodes[2]
            const fourthTeam = teamCodes[3]
            
            // Get first player from each team
            const firstTeamPlayer = playersByTeamMap[firstTeam]?.[0]
            const secondTeamPlayer = playersByTeamMap[secondTeam]?.[0]
            const thirdTeamPlayer = playersByTeamMap[thirdTeam]?.[0]
            const fourthTeamPlayer = playersByTeamMap[fourthTeam]?.[0]
            
            if (firstTeamPlayer && secondTeamPlayer && thirdTeamPlayer && fourthTeamPlayer) {
              setSelectedTeams([firstTeam, secondTeam, thirdTeam, fourthTeam])
              setSelectedPlayerIds([firstTeamPlayer.player_id, secondTeamPlayer.player_id, thirdTeamPlayer.player_id, fourthTeamPlayer.player_id])
            }
          } else if (teamsMap.size >= 2) {
            // Fallback to 2 players if less than 4 teams available
            const teamCodes = Array.from(teamsMap.keys())
            const firstTeam = teamCodes[0]
            const secondTeam = teamCodes[1]
            
            // Get first player from each team
            const firstTeamPlayer = playersByTeamMap[firstTeam]?.[0]
            const secondTeamPlayer = playersByTeamMap[secondTeam]?.[0]
            
            if (firstTeamPlayer && secondTeamPlayer) {
              setSelectedTeams([firstTeam, secondTeam, null, null])
              setSelectedPlayerIds([firstTeamPlayer.player_id, secondTeamPlayer.player_id, null, null])
            }
          }
        } else {
          console.log("Skipping auto-selection - using initial players from landing page")
        }
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
    if (!allPlayers.length || !player) return { percentile: 50, rank: 0, total: 0, value: 0 }

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
      value: selectedPlayerValue, // Include the actual stat value
    }
  }

  // Helper function to get the best performing player for a specific stat
  const getBestPerformerForStat = (statKey: keyof PlayerStatsFromGameLogs) => {
    // Only compare visible players: 2 on mobile, 4 on desktop
    const visiblePlayerCount = isLargeScreen ? 4 : 2
    const selectedPlayersData = selectedPlayerIds
      .slice(0, visiblePlayerCount) // Only consider visible players
      .map((playerId, index) => {
        if (!playerId) return null
        const teamId = selectedTeams[index]
        const playerData = teamId ? playersByTeam[teamId]?.find((p) => p.player_id === playerId) : null
        if (!playerData) return null

        const rankData = getPlayerRank(playerData, statKey)
        return {
          playerId,
          value: rankData.value,
          percentile: rankData.percentile,
        }
      })
      .filter(Boolean)

    if (selectedPlayersData.length < 2) return null

    // Determine if higher values are better for this stat
    const lowerIsBetterStats = ["turnovers", "fouls_commited", "blocks_against"]
    const higherIsBetter = !lowerIsBetterStats.includes(statKey)

    // Get the best value (not percentile)
    const bestValue = higherIsBetter 
      ? Math.max(...selectedPlayersData.map((p) => p.value))
      : Math.min(...selectedPlayersData.map((p) => p.value))
    
    const bestPerformers = selectedPlayersData.filter((p) => p.value === bestValue)

    return bestPerformers.map((p) => p.playerId)
  }

  // Helper function to format percentage values with 2 decimal places
  const formatPercentage = (value: number): string => {
    return value.toFixed(2)
  }

  // Team colors mapping (simplified version from offense tab)
  const teamColors = {
    // Your existing colors (unchanged)
    VIR: "#2f2f2f", // Virtus Segafredo Bologna - Darker black
    BAS: "#2c5f94", // Baskonia Vitoria-Gasteiz - Darker navy blue
    OLY: "#bf5050", // Olympiacos Piraeus - Darker red
    MCO: "#b03340", // AS Monaco - Darker red
    ASV: "#8a8d90", // LDLC ASVEL Villeurbanne - Darker gray
    PRS: "#4e565f", // Paris Basketball - Darker slate
    TEL: "#d4a355", // Maccabi Playtika Tel Aviv - Darker golden orange
    ZAL: "#2a7a51", // Zalgiris Kaunas - Darker kelly green
    MIL: "#d44c60", // EA7 Emporio Armani Milan - Darker red with pink tone
    RED: "#c24b5a", // Crvena Zvezda Meridianbet Belgrade - Darker red
    MAD: "#999999", // Real Madrid - Darker silver
    BAR: "#2b5c94", // FC Barcelona - Darker deep blue
    IST: "#2a619c", // Anadolu Efes Istanbul - Darker blue
    ULK: "#d4b041", // Fenerbahce Beko Istanbul - Darker golden yellow
    BER: "#d6c042", // ALBA Berlin - Darker yellow
    PAR: "#3a3834", // Partizan Mozzart Bet Belgrade - Darker black-gray
    MUN: "#9e3b4d", // FC Bayern Munich - Darker burgundy
    PAN: "#2a7046", // Panathinaikos AKTOR Athens - Darker dark green
    HTA: "#d0392e", // Hapoel Shlomo Tel Aviv - Darker red
    HAM: "#213243", // Veolia Towers Hamburg - Darker dark blue/charcoal
    PAM: "#d47800", // Valencia Basket - Darker orange
    VNC: "#6c0924", // Umana Reyer Venice - Darker deep maroon/red
    TSO: "#d3a127", // Trefl Sopot - Darker gold/orange
    LKB: "#893247", // 7Bet-Lietkabelis Panevezys - Darker maroon/red
    LJU: "#d39800", // Cedevita Olimpija Ljubljana - Darker orange/gold
    CAN: "#d3a127", // Dreamland Gran Canaria - Darker gold/orange
    BAH: "#213243", // Bahcesehir College Istanbul - Darker dark blue/charcoal
    TRN: "#4e6571", // Dolomiti Energia Trento - Darker slate gray
    TTK: "#42b4c5", // Turk Telekom Ankara - Darker light blue/turquoise
    CLU: "#858585", // U-BT Cluj-Napoca - Darker grey
    ULM: "#c24400", // ratiopharm Ulm - Darker bright orange
    BOU: "#c24033", // Cosea JL Bourg-en-Bresse - Darker red
    BUD: "#2a72b5", // Buducnost VOLI Podgorica - Darker light blue
    BES: "#363636", // Besiktas Fibabanka Istanbul - Darker dark grey/black
    JOV: "#409944", // Joventut Badalona - Darker green
    WOL: "#5ac591", // Wolves Twinsbet Vilnius - Darker lime green
    JER: "#b02727", // Hapoel Bank Yahav Jerusalem - Darker deep red
    ARI: "#d6b52c", // Aris Midea Thessaloniki - Darker gold/yellow
    LLI: "#2f2f2f", // London Lions - Darker black
    BRE: "#2c5f94", // Germani Brescia - Darker blue
    WRO: "#2a7a51", // Slask Wroclaw - Darker green
    BBU: "#2a7a51", // Frutti Extra Bursaspor - Darker green
    PMT: "#2c5f94", // Prometey Slobozhanske - Darker blue
    PAT: "#c24400", // Promitheas Patras - Darker orange
    NOV: "#2f2f2f",
    KSK: "#b03340",
    DAR: "#2a7a51",
    CSK: "#b03340",
    CHL: "#b03340",
    UNK: "#2a7a51",
    GAL: "#b03340",
    SIE: "#2a7a51",
    KHI: "#2c5f94", // Khimki Moscow Region - Darker blue
    CED: "#c24400", // Cedevita Zagreb - Darker orange
    BAM: "#b03340", // Brose Bamberg - Darker red
    NTR: "#2a7a51", // JSF Nanterre - Darker green
    SOP: "#2c5f94", // Asseco Prokom Gdynia - Darker blue
    MAL: "#2a7a51", // Unicaja Malaga - Darker green
    SAS: "#2c5f94", // Dinamo Banco di Sardegna Sassari - Darker blue
    STR: "#b03340", // Strasbourg - Darker red
    TIV: "#b03340", // Lokomotiv Kuban Krasnodar - Darker red
    ZGO: "#2f2f2f", // PGE Turow Zgorzelec - Darker black
    NIK: "#1e4a82", // Budivelnik Kiev - Dark blue/royal blue (from "bluedark, goldold and blueroyal")
    LIE: "#1a1a1a", // Lietuvos Rytas Vilnius - Black (from "black, red and white" scheme)
    LMG: "#2e7d32", // Limoges CSP - Forest green (from "green, white and yellow" scheme)
    CTU: "#1976d2", // Mapooro Cantu - Blue (from "blue and white" / "white/blue/sky blue")
    DYR: "#00aeef", // Zenit St Petersburg - Sky blue (verified hex code #00AEEF)
    GSS: "#2e7d32", // Stelmet Zielona Gora - Green (from "green and white")
    PAO: "#1a1a1a", // PAOK Thessaloniki - Black (from "black and white")
    AEK: "#fbc02d", // AEK Athens - Yellow/Gold (from "black and yellow")
    ROM: "#8b1538", // Virtus Rome - Maroon (from "maroon and gold")
    
    // Newly verified teams
    KLA: "#1565c0", // Neptunas Klaipeda - Blue (from "blue and white")
    PAI: "#1c5aa0", // Levallois Metropolitans - Navy blue (from "navy and gold" / "blue and yellow")
    OLD: "#fdd835", // EWE Baskets Oldenburg - Yellow (from "yellow and blue" traditional colors)
    CHA: "#d32f2f", // Proximus Spirou Charleroi - Red (from "red and white")
    REG: "#d32f2f", // Grissin Bon Reggio Emilia - Red (from "red and white")
    RIS: "#ff6f00", // Maccabi Rishon LeZion - Orange (from "orange and white")
    BAN: "#ff6f00", // Banvit Bandirma - Orange (from "orange, green and white")
    CHO: "#d32f2f", // Cholet Basket - Red (from "red and white")
    ANT: "#d32f2f", // Telenet Giants Antwerp - Red (from "red and white")
    SZO: "#1a1a1a", // Szolnoki Olaj - Black (from "black and red")
    
      // Updated with verified authentic colors
    GRA: "#1565c0", // BCM Gravelines Dunkerque - Dark blue (from "bluedark and orange")
    AZO: "#1976d2", // Azovmash Mariupol - Blue (from "blue and orange")  
    SOF: "#1976d2", // Lukoil Academic Sofia - Blue (from "blue and white")
    ROM: "#8b1538", // Virtus Rome - Maroon (from "maroon and gold")
    RIS: "#ff6f00", // Maccabi Rishon LeZion - Orange (from "orange and white")
    ANR: "#1976d2", // MoraBanc Andorra - Blue (from "blue, yellow and red")
    TOR: "#8b1538", // Fiat Turin - Maroon (traditional Turin maroon color)
    BAN: "#ff6f00", // Banvit Bandirma - Orange (from "orange, green and white")
    VAR: "#d32f2f", // Cimberio Varese - Red (from "red and white" traditional colors)
      // Updated with verified authentic colors
    CAI: "#d32f2f", // CAI Zaragoza - Red (from "red and white")
    OOS: "#1976d2", // Telenet Ostend - Blue (originally "blue and yellow", currently "red and yellow" but traditionally blue)
    RDN: "#d32f2f", // Radnicki Kragujevac - Red (from "red and white" / "reddark and red")
    LUD: "#1a1a1a", // MHP RIESEN Ludwigsburg - Black (from "black and yellow")
    WUE: "#b03340", // s.Oliver Baskets Wurzburg - Darker blue (keeping original estimate as no specific info found)
    ANT: "#d32f2f", // Telenet Giants Antwerp - Red (already verified as "red and white")
    FUE: "#d47800", // Montakit Fuenlabrada - Darker blue (keeping original estimate as no specific info found)
    BUR: "#1a3a5c", /* Deep navy blue */
      
    /* Ventspils - Blue and yellow (using blue as primary) */
    VEN: "#1e4a72", /* Deep blue */
    MHB: "#1b5e20", /* Deep forest green */
    SAR: "#212121",/* Deep charcoal black */
    DIJ: "#212121",/* Deep charcoal black */
    BON: "#8b1538", /* Deep cardinal red */
    PLO: "#1e4a72", // CSU Asesoft Ploiesti - Deep blue (team colors: blue and white)
    BUC: "#8b1538", // Steaua CSM EximBank Bucharest - Deep red (team colors: blue and red - using red as primary)
    PAO: "#1a1a1a", // PAOK Thessaloniki - Deep black (team colors: black and white)
    AEK: "#b8860b", // AEK Athens - Dark gold/yellow (team colors: black and yellow - using darker yellow)
    MBA: "#1e4a72", // Mornar Bar - Deep blue (team colors: blue and white)
    LOI: "#8b0000", // Bisons Loimaa - Dark red (team colors: black, white and red - using red as primary)
    ART: "#212121", // Artland Dragons Quakenbrueck - Deep black (team colors: black and white)
    NAN: "#8b0000", // SLUC Nancy - Dark red (team colors: red, gray and black - using red as primary)
    BIL: "#1a1a1a", // RETAbet Bilbao Basket - Dark red (team colors: black and red - using red as primary)
    SZO: "#8b0000", // Szolnoki Olaj - Dark red (team colors: black and red - using red as primary)
    ORL: "#d2691e", // Orleans Loiret Basket - Dark brown (team colors: brown and white)
    YUZ: "#1b5e20", // Khimik Yuzhne - Deep green (team colors: green and white)
    DON: "#cc5500", // Donetsk - Dark orange (team colors: black and orange - using orange as primary)
    AYK: "#8b1538", // Aykon TED Ankara Kolejliler - Deep red (team colors: navy and red - using red as primary)
    RUD: "#1e4a72", // Prienai Rudupis - Deep blue (team colors: blue, white and red - using blue as primary)
    KAL: "#1e4a72", // Kalev Cramo Tallinn - Deep blue (team colors: blue and white)
    NIO: "#8b1538", // Panionios Athens - Deep red (team colors: blue and red - using red as primary)
    LEM: "#cc5500", // Le Mans Sarthe Basket - Dark orange (team colors: blue and orange - using orange as primary)
    CIB: "#8b1538", // Cibona Zagreb - Deep red (team colors: red, blue and white - using red as primary)
    MUR: "#8b1538", // UCAM Murcia - Deep red (team colors: red and white)
    BDS: "#1e3a5f", // Enel Basket Brindisi - Deep royal blue (team colors: royal blue, white and orange - using blue as primary)
    NYM: "#8b1538", // CEZ Basketball Nymburk - Deep red (team colors: red and white)
    SSP: "#8b1538", // Spartak Saint Petersburg - Deep red (team colors: red and white)
    VEF: "#1a1a1a", // VEF Riga - Deep black (team colors: black and white)
    HAI: "#1e4a72", // Belfius Mons Hainaut - Deep blue (team colors: blue and white)
    VSZ: "#1e4a72", // Alba Fehervar - Deep blue (team colors: blue and white)
    TRB: "#8b1538", // Trabzonspor Medical Park - Deep red (team colors: light blue, white and dark red - using red as primary)
    OKT: "#8b1538", // Krasny Oktyabr Volgograd - Darker red
    FRA: "#1e4a72" // Fraport Skyliners Frankfurt - Darker blue
  };
  
  const getTeamColorStyles = (teamCode: string) => {
    return { backgroundColor: teamColors[teamCode] || "#6b7280" }
  }
  
  // Mobile Player Selector Components - Left side (rounded left only)
const PlayerSelectorLeft = ({ playerIndex }: { playerIndex: number }) => {
  const isTeamDropdownOpen = playerIndex === 0 ? isPlayer1TeamDropdownOpen : isPlayer2TeamDropdownOpen
  const setIsTeamDropdownOpen = playerIndex === 0 ? setIsPlayer1TeamDropdownOpen : setIsPlayer2TeamDropdownOpen
  const isPlayerDropdownOpen = playerIndex === 0 ? isPlayer1PlayerDropdownOpen : isPlayer2PlayerDropdownOpen
  const setIsPlayerDropdownOpen = playerIndex === 0 ? setIsPlayer1PlayerDropdownOpen : setIsPlayer2PlayerDropdownOpen
  
  const selectedTeamId = selectedTeams[playerIndex]
  const selectedPlayerId = selectedPlayerIds[playerIndex]
  const selectedTeam = selectedTeamId ? teamsList.find(t => t.id === selectedTeamId) : null
  const selectedPlayer = selectedTeamId && selectedPlayerId ? playersByTeam[selectedTeamId]?.find(p => p.player_id === selectedPlayerId) : null
  const selectedTeamColor = selectedPlayer ? getTeamColorStyles(selectedPlayer.player_team_code).backgroundColor : "#6b7280"
  
  return (
    <div className="bg-black shadow-md rounded-l-xl border-r border-black relative team-dropdown-container -mt-3 w-full">
      <div className="w-full text-left">
        <div
          className="rounded-l-xl overflow-hidden shadow-xl w-full hover:shadow-xl transition-shadow border-r-0"
          style={{
            border: '1px solid black',
            borderRight: 'none',
            backgroundColor: selectedTeamColor,
          }}
        >
          <div className="flex flex-row items-center p-2 w-full">
            {/* Team Logo Section - Clickable - Fixed width */}
            <button 
              onClick={() => {
                // Close all other dropdowns
                if (playerIndex === 0) {
                  setIsPlayer2TeamDropdownOpen(false)
                  setIsPlayer2PlayerDropdownOpen(false)
                  setIsPlayer1PlayerDropdownOpen(false)
                } else {
                  setIsPlayer1TeamDropdownOpen(false)
                  setIsPlayer1PlayerDropdownOpen(false)
                  setIsPlayer2PlayerDropdownOpen(false)
                }
                openDropdownWithHeight(() => setIsTeamDropdownOpen(true))
              }}
              className="flex items-center flex-shrink-0 border-r border-gray-200 pr-2 cursor-pointer w-10"
            >
              {/* Team Logo */}
              <div className="flex-shrink-0 mr-1">
                {selectedPlayer?.teamlogo ? (
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg shadow-sm">
                    <div
                      className="w-6 h-6 bg-light-beige rounded-lg flex items-center justify-center p-0.5"
                      style={{
                        border: "1px solid black",
                        backgroundColor: "white",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <img
                        src={selectedPlayer.teamlogo}
                        alt={`${selectedPlayer.player_team_name} logo`}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-sm"
                    style={{
                      backgroundColor: "white",
                      color: selectedTeamColor,
                      border: '1px solid black',
                    }}
                  >
                    {selectedTeam?.name?.split(" ").map(word => word[0]).join("") || "?"}
                  </div>
                )}
              </div>
              
              {/* Team Dropdown arrow */}
              <div className="-ml-0.5 mr-0.5">
                <ChevronDown
                  className={`h-3 w-3 text-white transition-transform ${isTeamDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
            
            {/* Player Name Section - Clickable - Takes remaining space */}
            <button 
              onClick={() => {
                // Close all other dropdowns
                if (playerIndex === 0) {
                  setIsPlayer2TeamDropdownOpen(false)
                  setIsPlayer2PlayerDropdownOpen(false)
                  setIsPlayer1TeamDropdownOpen(false)
                } else {
                  setIsPlayer1TeamDropdownOpen(false)
                  setIsPlayer1PlayerDropdownOpen(false)
                  setIsPlayer2TeamDropdownOpen(false)
                }
                openDropdownWithHeight(() => setIsPlayerDropdownOpen(true))
              }}
              className="flex items-center flex-1 pl-1 cursor-pointer min-w-0 overflow-hidden"
            >
              {/* Player Name - Fixed container */}
              <div className="flex items-left flex-1 min-w-0 overflow-hidden">
                <span
                  className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis block w-full text-left"
                  style={{
                    color: "white",
                    textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                  }}
                >
                  {selectedPlayer?.player_name || `Select Player ${playerIndex + 1}`}
                </span>
              </div>
              
              {/* Player Dropdown arrow */}
              <div className="-ml-0.5 flex-shrink-0">
                <ChevronDown
                  className={`h-3 w-3 text-white transition-transform ${isPlayerDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Team dropdown menu */}
      {isTeamDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-[1001] max-h-60 overflow-y-auto">
          {teamsList.map((team) => {
            const isSelected = team.id === selectedTeamId
            
            return (
              <button
                key={team.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTeamSelect(playerIndex, team.id)
                  // Auto-select first player from selected team
                  const firstPlayer = playersByTeam[team.id]?.[0]
                  if (firstPlayer) {
                    handlePlayerSelect(playerIndex, firstPlayer.player_id)
                  }
                  setIsTeamDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                }`}
              >
                <div className="w-5 h-5 mr-2 flex-shrink-0">
                  {/* Show team logo if available from playersByTeam */}
                  {playersByTeam[team.id]?.[0]?.teamlogo ? (
                    <img
                      src={playersByTeam[team.id][0].teamlogo}
                      alt={`${team.name} logo`}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[9px]">
                      {team.name.split(" ").map(word => word[0]).join("") || "?"}
                    </div>
                  )}
                </div>
                <span className={`font-medium text-[9px] truncate ${isSelected ? "text-gray-900" : "text-black-900"}`}>
                  {team.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
      
      {/* Player dropdown menu */}
      {isPlayerDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-[1001] max-h-60 overflow-y-auto">
          {selectedTeamId && playersByTeam[selectedTeamId]?.map((player) => {
            const isSelected = player.player_id === selectedPlayerId
            
            return (
              <button
                key={player.player_id}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayerSelect(playerIndex, player.player_id)
                  setIsPlayerDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                }`}
              >
                <span className={`font-medium text-[9px] truncate ${isSelected ? "text-gray-900" : "text-black-900"}`}>
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

// Mobile Player Selector Components - Right side (rounded right only)
const PlayerSelectorRight = ({ playerIndex }: { playerIndex: number }) => {
  const isTeamDropdownOpen = playerIndex === 0 ? isPlayer1TeamDropdownOpen : isPlayer2TeamDropdownOpen
  const setIsTeamDropdownOpen = playerIndex === 0 ? setIsPlayer1TeamDropdownOpen : setIsPlayer2TeamDropdownOpen
  const isPlayerDropdownOpen = playerIndex === 0 ? isPlayer1PlayerDropdownOpen : isPlayer2PlayerDropdownOpen
  const setIsPlayerDropdownOpen = playerIndex === 0 ? setIsPlayer1PlayerDropdownOpen : setIsPlayer2PlayerDropdownOpen
  
  const selectedTeamId = selectedTeams[playerIndex]
  const selectedPlayerId = selectedPlayerIds[playerIndex]
  const selectedTeam = selectedTeamId ? teamsList.find(t => t.id === selectedTeamId) : null
  const selectedPlayer = selectedTeamId && selectedPlayerId ? playersByTeam[selectedTeamId]?.find(p => p.player_id === selectedPlayerId) : null
  const selectedTeamColor = selectedPlayer ? getTeamColorStyles(selectedPlayer.player_team_code).backgroundColor : "#6b7280"
  
  return (
    <div className="bg-black shadow-md rounded-r-xl relative team-dropdown-container -mt-3 mr-1 w-full">
      <div className="w-full text-left">
        <div
          className="rounded-r-xl overflow-hidden shadow-xl w-full hover:shadow-xl transition-shadow border-l-0"
          style={{
            border: '1px solid black',
            borderLeft: 'none',
            backgroundColor: selectedTeamColor,
          }}
        >
          <div className="flex flex-row items-center p-2 w-full">
            {/* Team Logo Section - Clickable - Fixed width */}
            <button 
              onClick={() => {
                // Close all other dropdowns
                if (playerIndex === 0) {
                  setIsPlayer2TeamDropdownOpen(false)
                  setIsPlayer2PlayerDropdownOpen(false)
                  setIsPlayer1PlayerDropdownOpen(false)
                } else {
                  setIsPlayer1TeamDropdownOpen(false)
                  setIsPlayer1PlayerDropdownOpen(false)
                  setIsPlayer2PlayerDropdownOpen(false)
                }
                openDropdownWithHeight(() => setIsTeamDropdownOpen(true))
              }}
              className="flex items-center flex-shrink-0 border-r border-gray-200 pr-2 cursor-pointer w-10"
            >
              {/* Team Logo */}
              <div className="flex-shrink-0 mr-1">
                {selectedPlayer?.teamlogo ? (
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg shadow-sm">
                    <div
                      className="w-6 h-6 bg-light-beige rounded-lg flex items-center justify-center p-0.5"
                      style={{
                        border: "1px solid black",
                        backgroundColor: "white",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <img
                        src={selectedPlayer.teamlogo}
                        alt={`${selectedPlayer.player_team_name} logo`}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-sm"
                    style={{
                      backgroundColor: "white",
                      color: selectedTeamColor,
                      border: '1px solid black',
                    }}
                  >
                    {selectedTeam?.name?.split(" ").map(word => word[0]).join("") || "?"}
                  </div>
                )}
              </div>
              
              {/* Team Dropdown arrow */}
              <div className="-ml-0.5 mr-0.5">
                <ChevronDown
                  className={`h-3 w-3 text-white transition-transform ${isTeamDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
            
            {/* Player Name Section - Clickable - Takes remaining space */}
            <button 
              onClick={() => {
                // Close all other dropdowns
                if (playerIndex === 0) {
                  setIsPlayer2TeamDropdownOpen(false)
                  setIsPlayer2PlayerDropdownOpen(false)
                  setIsPlayer1TeamDropdownOpen(false)
                } else {
                  setIsPlayer1TeamDropdownOpen(false)
                  setIsPlayer1PlayerDropdownOpen(false)
                  setIsPlayer2TeamDropdownOpen(false)
                }
                openDropdownWithHeight(() => setIsPlayerDropdownOpen(true))
              }}
              className="flex items-left flex-1  pl-1 cursor-pointer min-w-0 overflow-hidden"
            >
              {/* Player Name - Fixed container */}
              <div className="flex items-left flex-1 min-w-0 overflow-hidden">
                <span
                  className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis block w-full text-left"
                  style={{
                    color: "white",
                    textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                  }}
                >
                  {selectedPlayer?.player_name || `Select Player ${playerIndex + 1}`}
                </span>
              </div>
              
              {/* Player Dropdown arrow */}
              <div className="-ml-0.5  flex-shrink-0">
                <ChevronDown
                  className={`h-3 w-3 text-white transition-transform ${isPlayerDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Team dropdown menu */}
      {isTeamDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-[1001] max-h-60 overflow-y-auto">
          {teamsList.map((team) => {
            const isSelected = team.id === selectedTeamId
            
            return (
              <button
                key={team.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleTeamSelect(playerIndex, team.id)
                  // Auto-select first player from selected team
                  const firstPlayer = playersByTeam[team.id]?.[0]
                  if (firstPlayer) {
                    handlePlayerSelect(playerIndex, firstPlayer.player_id)
                  }
                  setIsTeamDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                }`}
              >
                <div className="w-5 h-5 mr-2 flex-shrink-0">
                  {/* Show team logo if available from playersByTeam */}
                  {playersByTeam[team.id]?.[0]?.teamlogo ? (
                    <img
                      src={playersByTeam[team.id][0].teamlogo}
                      alt={`${team.name} logo`}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-gray-600 flex items-center justify-center text-white font-bold text-[9px]">
                      {team.name.split(" ").map(word => word[0]).join("") || "?"}
                    </div>
                  )}
                </div>
                <span className={`font-medium text-[9px] truncate ${isSelected ? "text-gray-900" : "text-black-900"}`}>
                  {team.name}
                </span>
              </button>
            )
          })}
        </div>
      )}
      
      {/* Player dropdown menu */}
      {isPlayerDropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-light-beige border border-gray-200 rounded-xl shadow-lg z-[1001] max-h-60 overflow-y-auto">
          {selectedTeamId && playersByTeam[selectedTeamId]?.map((player) => {
            const isSelected = player.player_id === selectedPlayerId
            
            return (
              <button
                key={player.player_id}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayerSelect(playerIndex, player.player_id)
                  setIsPlayerDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                }`}
              >
                <span className={`font-medium text-[9px] truncate ${isSelected ? "text-gray-900" : "text-black-900"}`}>
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

  if (isLoading) {
    return (
      <LeagueLoadingScreen 
        league={selectedLeague === "international-eurocup" ? "eurocup" : "euroleague"} 
        message="Loading player data..."
        className="h-64"
      />
    )
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Mobile Player Selectors - Only visible on mobile, only shows first 2 players */}
      <div className="md:hidden flex gap-0">
        <div className="flex-1 w-[35px]">
          <PlayerSelectorLeft playerIndex={0} />
        </div>
        <div className="flex-1 w-[35px]">
          <PlayerSelectorRight playerIndex={1} />
        </div>
      </div>

      {/* Player Selection Grid with Header */}
      {(
        <div className="rounded-md border border-black shadow-sm  bg-light-beige">
          {/* Team color header strip */}
          <div
            className="w-full h-2 border-b border-black rounded-t-md -mb-1"
            style={{
              backgroundColor: "#9ca3af", // gray-400
            }}
          />
          <div className="p-4 md:p-4 pb-6">
          {/* Header - matching standings tab format */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold whitespace-nowrap">Player Comparison</h3>
            </div>
            {/* Display Mode Toggle - Updated to match league standings tab */}
            <div className="flex rounded-full bg-[#f1f5f9] p-0.5 border">
              <button
                onClick={() => setComparisonMode("average")}
                className={`rounded-full px-1 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-medium whitespace-nowrap ${
                  comparisonMode === "average" ? "bg-[#475569] text-white" : "text-[#475569]"
                }`}
              >
                Per Game
              </button>
              <button
                onClick={() => setComparisonMode("per40")}
                className={`rounded-full px-1 md:px-3 py-0.5 md:py-1 text-[9px] md:text-xs font-medium whitespace-nowrap ${
                  comparisonMode === "per40" ? "bg-[#475569] text-white" : "text-[#475569]"
                }`}
              >
                Per 40
              </button>
            </div>
          </div>

          {/* Player Cards - 2 players on mobile/tablet, 4 players on large screens */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-2 -mr-2 -ml-2">
            {/* 2 players on mobile/tablet, 4 players on lg+ */}
            {[0, 1, 2, 3].map((slotIndex) => {
              // Hide players 3 & 4 on screens smaller than lg
              if (slotIndex >= 2) {
                return (
                  <div key={slotIndex} className="hidden lg:flex flex-col space-y-2">
                    {/* Desktop Player Selection - hidden on mobile */}
                    <div className="hidden md:block bg-white border border-gray-300 rounded-lg shadow-sm p-1.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-1">
                          <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800">
                            {slotIndex + 1}
                          </div>
                          <span className="text-[10px] font-semibold text-gray-700">Player Selection</span>
                        </div>
                        {(selectedTeams[slotIndex] || selectedPlayerIds[slotIndex]) && (
                          <button
                            onClick={() => {
                              const newSelectedTeams = [...selectedTeams]
                              const newSelectedPlayerIds = [...selectedPlayerIds]
                              newSelectedTeams[slotIndex] = null
                              newSelectedPlayerIds[slotIndex] = null
                              setSelectedTeams(newSelectedTeams)
                              setSelectedPlayerIds(newSelectedPlayerIds)
                            }}
                            className="w-4 h-4 rounded-md bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
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
                            value={selectedTeams[slotIndex] || ""}
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

                        {/* Player Selection */}
                        <div className="text-[8px] font-semibold text-gray-500 uppercase flex items-center">Player:</div>
                        <div>
                          <select
                            value={selectedPlayerIds[slotIndex] || ""}
                            onChange={(e) => handlePlayerSelect(slotIndex, e.target.value)}
                            disabled={!selectedTeams[slotIndex]}
                            className="w-full text-[10px] border border-gray-200 rounded py-0.5 px-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Select Player</option>
                            {selectedTeams[slotIndex] &&
                              playersByTeam[selectedTeams[slotIndex]]?.map((player) => (
                                <option key={player.player_id} value={player.player_id}>
                                  {player.player_name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Player Card for slots 3 & 4 - same structure as original */}
                    {(() => {
                      const selectedTeamId = selectedTeams[slotIndex]
                      const selectedPlayerId = selectedPlayerIds[slotIndex]

                      // Find the selected player data
                      const playerData =
                        selectedTeamId && selectedPlayerId
                          ? playersByTeam[selectedTeamId]?.find((p) => p.player_id === selectedPlayerId)
                          : null

                      return playerData ? (
                        <Card className="overflow-hidden border-0 shadow-xl rounded-xl flex-1 bg-light-beige">
                          <CardContent className="p-1">
                            {/* Player Info Header - using team logo from player data */}
                            <div 
                              className="relative p-2 md:p-3 border-b border-gray-200 rounded-t-lg"
                              style={getTeamColorStyles(playerData.player_team_code)}
                            >
                              <div className="flex flex-col items-left justify-left text-left">
                                {/* Player Name and Team Name - centered */}
                                <div className="flex flex-col items-center justify-center">
                                  <h3 className="text-white font-bold text-xs md:text-lg whitespace-nowrap text-center">
                                    {playerData.player_name}
                                  </h3>
                                  <div className="text-white text-[8px] md:text-sm whitespace-nowrap text-center">
                                    {playerData.player_team_name}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Compact Season Stats Row */}
                            <div className="px-3 py-1 border-b border-gray-100 bg-light-beige">
                              <div className="grid grid-cols-3 gap-1">
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
                              </div>
                            </div>

                            {/* Percentile Rankings Section - full sections for slots 3 & 4 */}
                            <div className="px-3 pt-2 pb-3 overflow-auto bg-light-beige">
                              {/* Traditional Stats Section */}
                              <div className="mb-5">
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
                                <div className="flex justify-between items-center text-[5px] font-medium px-8 pb-0.5">
                                  <span className="text-red-700">POOR</span>
                                  <span className="text-gray-400">AVG</span>
                                  <span className="text-teal-700">GREAT</span>
                                </div>

                                {/* Main Stats for slots 3 & 4 */}
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
                                      className={`flex items-center mb-1.5 relative transition-all duration-200 ${
                                        isWinner
                                          ? "bg-yellow-200 rounded-sm px-1.5 -mx-1 border-l border-black border-r border-black"
                                          : isLoser
                                            ? "opacity-80 grayscale"
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
                              <div className="mb-5">
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
                                      className={`flex items-center mb-1.5 relative transition-all duration-200 ${
                                        isWinner
                                          ? "bg-yellow-200 rounded-sm px-1.5 -mx-1 border-l border-black border-r border-black"
                                          : isLoser
                                            ? "opacity-80 grayscale"
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

                              {/* MISC Section */}
                              <div className="mb-2">
                                <div className="relative mb-2">
                                  <div className="flex items-center gap-1 mb-1">
                                    <BarChart3 className="h-3 w-3 text-blue-600" />
                                    <span className="text-[10px] font-semibold text-gray-800 uppercase tracking-wide">
                                      MISC
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
                                      className={`flex items-center mb-1.5 relative transition-all duration-200 ${
                                        isWinner
                                          ? "bg-yellow-200 rounded-sm px-1.5 -mx-1 border-l border-black border-r border-black"
                                          : isLoser
                                            ? "opacity-80 grayscale"
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
                        /* Empty slot placeholder for slots 3 & 4 */
                        <Card className="overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl flex-1 hover:border-gray-400 transition-colors">
                          <CardContent className="p-0 h-full">
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-gray-400 min-h-[300px]">
                              <Users className="h-6 w-6 mb-1" />
                              <span className="text-xs font-medium">Select Team & Player</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })()}
                  </div>
                )
              }
              
              // Original code for slots 0 & 1 - show on all screen sizes
              const selectedTeamId = selectedTeams[slotIndex]
              const selectedPlayerId = selectedPlayerIds[slotIndex]

              // Find the selected player data
              const playerData =
                selectedTeamId && selectedPlayerId
                  ? playersByTeam[selectedTeamId]?.find((p) => p.player_id === selectedPlayerId)
                  : null

              return (
                <div key={slotIndex} className="flex flex-col space-y-2">
                  {/* Desktop Player Selection - hidden on mobile */}
                  <div className="hidden md:block bg-white border border-gray-300 rounded-lg shadow-sm p-1.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1">
                        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800">
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
                          className="w-4 h-4 rounded-md bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
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

                  {/* Player Card */}
                  {playerData ? (
                    <Card className="overflow-hidden border-0 shadow-xl rounded-xl flex-1 bg-light-beige">
                      <CardContent className="p-1">
                        {/* Player Info Header - using team logo from player data */}
                        <div 
                          className="relative p-2 md:p-3 border-b border-gray-200 rounded-t-lg"
                          style={getTeamColorStyles(playerData.player_team_code)}
                        >
                          <div className="flex flex-col items-left justify-left text-left">
                            {/* Player Name and Team Name - centered */}
                            <div className="flex flex-col items-center justify-center">
                              <h3 className="text-white font-bold text-xs md:text-lg whitespace-nowrap text-center">
                                {playerData.player_name}
                              </h3>
                              <div className="text-white text-[8px] md:text-sm whitespace-nowrap text-center">
                                {playerData.player_team_name}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compact Season Stats Row */}
                        <div className="px-3 py-1 border-b border-gray-100 bg-light-beige">
                          <div className="grid grid-cols-3 gap-1">
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
                            
                          </div>
                        </div>

                        {/* Percentile Rankings Section */}
                        <div className="px-3 pt-2 pb-3 overflow-auto bg-light-beige">
                          {/* Traditional Stats Section */}
                          <div className="mb-5">
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
                            <div className="flex justify-between items-center text-[5px] font-medium px-8 pb-0.5">
                              <span className="text-red-700">POOR</span>
                              <span className="text-gray-400">AVG</span>
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
                                  className={`flex items-center mb-1.5 relative transition-all duration-200 ${
                                    isWinner
                                      ? "bg-yellow-200 rounded-sm px-1.5 -mx-1 border-l border-black border-r border-black"
                                      : isLoser
                                        ? "opacity-80 grayscale"
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
                          <div className="mb-5">
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
                                  className={`flex items-center mb-1.5 relative transition-all duration-200 ${
                                    isWinner
                                      ? "bg-yellow-200 rounded-sm px-1.5 -mx-1 border-l border-black border-r border-black"
                                      : isLoser
                                        ? "opacity-80 grayscale"
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
                                  MISC
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
                                  className={`flex items-center mb-1.5 relative transition-all duration-200 ${
                                    isWinner
                                      ? "bg-yellow-200 rounded-sm px-1.5 -mx-1 border-l border-black border-r border-black"
                                      : isLoser
                                        ? "opacity-80 grayscale"
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
        </div>
      )}
      
      {/* Extra height div for dropdown visibility */}
      {extraHeight > 0 && (
        <div style={{ height: extraHeight }} className="w-full" />
      )}
    </div>
  )
}

export default ComparisonTab
