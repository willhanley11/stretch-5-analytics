"use client"
import { useState, useMemo, useEffect } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
  fetchTeamStats,
  fetchSeasons,
  fetchPhases,
  fetchTeamAdvancedStatsByTeamCode, // Updated import
  fetchTeamPlayersDirectly,
  fetchDebugPlayerData,
} from "@/app/actions/standings"
import type { EuroleagueTeamStats, EuroleagueTeamAdvanced, EuroleaguePlayerStats } from "@/lib/db"
import { LeagueStandingsTab } from "./league-standings-tab"
import { TeamDetailsTab } from "./team-details-tab"
import StatisticsTab from "./statistics-tab"

// Define team logo mappings by season
const team_logo_mappings = {
  // 2024-2025 season
  2024: {
    ZAL: "https://media-cdn.incrowdsports.com/0aa09358-3847-4c4e-b228-3582ee4e536d.png?width=180&height=180&resizeType=fill&format=webp",
    MAD: "https://media-cdn.incrowdsports.com/601c92bf-90e4-4b43-9023-bd6946e34143.png?crop=244:244:nowe:0:0",
    BAR: "https://media-cdn.incrowdsports.com/35dfa503-e417-481f-963a-bdf6f013763e.png?crop=511%3A511%3Anowe%3A1%3A0",
    OLY: "https://media-cdn.incrowdsports.com/789423ac-3cdf-4b89-b11c-b458aa5f59a6.png?crop=512:512:nowe:0:0",
    PAN: "https://media-cdn.incrowdsports.com/e3dff28a-9ec6-4faf-9d96-ecbc68f75780.png?crop=512%3A512%3Anowe%3A0%3A0",
    ULK: "https://media-cdn.incrowdsports.com/f7699069-e207-43b7-8c8e-f61e39cb0141.png?crop=512:512:nowe:0:0",
    IST: "https://media-cdn.incrowdsports.com/8ea8cec7-d8f7-45f4-a956-d976b5867610.png?crop=463:463:nowe:22:25",
    TEL: "https://media-cdn.incrowdsports.com/5c55ef14-29df-4328-bd52-a7a64c432350.png?width=180&height=180&resizeType=fill&format=webp",
    MIL: "https://media-cdn.incrowdsports.com/8154f184-c61a-4e7f-b14d-9d802e35cb95.png?width=180&height=180&resizeType=fill&format=webp",
    MUN: "https://media-cdn.incrowdsports.com/817b0e58-d595-4b09-ab0b-1e7cc26249ff.png?crop=192%3A192%3Anowe%3A0%3A0",
    ASV: "https://media-cdn.incrowdsports.com/e33c6d1a-95ca-4dbc-b8cb-0201812104cc.png?width=180&height=180&resizeType=fill&format=webp",
    BER: "https://media-cdn.incrowdsports.com/ccc34858-22b0-47dc-904c-9940b0a16ff3.png?width=180&height=180&resizeType=fill&format=webp",
    RED: "https://media-cdn.incrowdsports.com/26b7b829-6e40-4da9-a297-abeedb6441df.svg",
    BAS: "https://media-cdn.incrowdsports.com/e324a6af-2a72-443e-9813-8bf2d364ddab.png",
    VIR: "https://media-cdn.incrowdsports.com/4af5e83b-f2b5-4fba-a87c-1f85837a508a.png?crop=512%3A512%3Anowe%3A0%3A0",
    PAR: "https://media-cdn.incrowdsports.com/ead471d0-93d8-4fb9-bfec-41bb767c828d.png",
    PRS: "https://media-cdn.incrowdsports.com/a033e5b3-0de7-48a3-98d9-d9a4b9df1f39.png?width=180&height=180&resizeType=fill&format=webp",
    MCO: "https://media-cdn.incrowdsports.com/89ed276a-2ba3-413f-8ea2-b3be209ca129.png?crop=512:512:nowe:0:0",
    VBC: "https://media-cdn.incrowdsports.com/valencia-basket-logo.png", // Add Valencia Basket
  },
  // 2023-2024 season
  2023: {
    ZAL: "https://media-cdn.incrowdsports.com/0aa09358-3847-4c4e-b228-3582ee4e536d.png?width=180&height=180&resizeType=fill&format=webp",
    MAD: "https://media-cdn.incrowdsports.com/601c92bf-90e4-4b43-9023-bd6946e34143.png?crop=244:244:nowe:0:0",
    BAR: "https://media-cdn.incrowdsports.com/35dfa503-e417-481f-963a-bdf6f013763e.png?crop=511%3A511%3Anowe%3A1%3A0",
    OLY: "https://media-cdn.incrowdsports.com/789423ac-3cdf-4b89-b11c-b458aa5f59a6.png?crop=512:512:nowe:0:0",
    PAN: "https://media-cdn.incrowdsports.com/e3dff28a-9ec6-4faf-9d96-ecbc68f75780.png?crop=512%3A512%3Anowe%3A0%3A0",
    ULK: "https://media-cdn.incrowdsports.com/f7699069-e207-43b7-8c8e-f61e39cb0141.png?crop=512:512:nowe:0:0",
    IST: "https://media-cdn.incrowdsports.com/8ea8cec7-d8f7-45f4-a956-d976b5867610.png?crop=463:463:nowe:22:25",
    TEL: "https://media-cdn.incrowdsports.com/5c55ef14-29df-4328-bd52-a7a64c432350.png?width=180&height=180&resizeType=fill&format=webp",
    MIL: "https://media-cdn.incrowdsports.com/8154f184-c61a-4e7f-b14d-9d802e35cb95.png?width=180&height=180&resizeType=fill&format=webp",
    MUN: "https://media-cdn.incrowdsports.com/817b0e58-d595-4b09-ab0b-1e7cc26249ff.png?crop=192%3A192%3Anowe%3A0%3A0",
    ASV: "https://media-cdn.incrowdsports.com/e33c6d1a-95ca-4dbc-b8cb-0201812104cc.png?width=180&height=180&resizeType=fill&format=webp",
    BER: "https://media-cdn.incrowdsports.com/ccc34858-22b0-47dc-904c-9940b0a16ff3.png?width=180&height=180&resizeType=fill&format=webp",
    RED: "https://media-cdn.incrowdsports.com/26b7b829-6e40-4da9-a297-abeedb6441df.svg",
    BAS: "https://media-cdn.incrowdsports.com/e324a6af-2a72-443e-9813-8bf2d364ddab.png",
    VIR: "https://media-cdn.incrowdsports.com/4af5e83b-f2b5-4fba-a87c-1f85837a508a.png?crop=512%3A512%3Anowe%3A0%3A0",
    PAR: "https://media-cdn.incrowdsports.com/ead471d0-93d8-4fb9-bfec-41bb767c828d.png",
    MCO: "https://media-cdn.incrowdsports.com/89ed276a-2ba3-413f-8ea2-b3be209ca129.png?crop=512:512:nowe:0:0",
    VBC: "https://media-cdn.incrowdsports.com/valencia-basket-logo.png", // Add Valencia Basket
  },
  // Add more seasons as needed
}

// Add the Euroleague team colors mapping
export const euroleague_team_colors = {
  // EuroLeague Teams (Darker shades for better contrast with white text)
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
};
// Remove the hardcoded teamNameToCode mapping since we'll use database teamcode directly
export const teamNameToCode = {} // Empty object - we'll get teamcode from database

// Player images data - empty array to be filled from database later
export const playerImages = []

// Player statistics data - empty array to be filled from database later
const playerStats = []

// Sample box score data structure (empty)
const mockBoxScoreData = {}

// Function to get team color and determine text color based on background brightness
const getTeamColorStyles = (teamName: string, teamCode?: string) => {
  // Use teamCode if provided, otherwise try to get it from teamStats
  const code = teamCode || ""
  const bgColor = euroleague_team_colors[code] || "#4b5563" // Default to a blue if not found

  // Function to determine if text should be white or black based on background color brightness
  const getTextColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = Number.parseInt(hexColor.slice(1, 3), 16)
    const g = Number.parseInt(hexColor.slice(3, 5), 16)
    const b = Number.parseInt(hexColor.slice(5, 7), 16)

    // Calculate brightness (perceived luminance)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000

    // Return white for dark backgrounds, black for light backgrounds
    return brightness > 128 ? "text-gray-900" : "text-white"
  }

  return {
    backgroundColor: bgColor,
    textColorClass: getTextColor(bgColor),
  }
}

// Update the interface to include the hideNav prop and selectedLeague
interface YamagataTeamStatsProps {
  initialTab?: string
  hideNav?: boolean
  selectedSeason?: number
  selectedLeague?: string // Add this prop
}

type StatType = "points" | "rebounds" | "assists" | "threePointers" | "steals" | "blocks"

// Helper function to convert league ID to database league name
const getLeagueFromId = (leagueId: string): string => {
  if (leagueId === "international-eurocup") return "eurocup"
  if (leagueId === "international-euroleague") return "euroleague" // default
}

// Update the function signature to include the selectedLeague prop
function YamagataTeamStats({
  initialTab = "league",
  hideNav = false,
  selectedSeason: propSelectedSeason,
  selectedLeague: propSelectedLeague = "international-euroleague", // Add default value
}: YamagataTeamStatsProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) => (prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]))
  }
  // Find the useState for activeTab and add a new state for tracking when to scroll
  const [activeTab, setActiveTab] = useState(initialTab)
  // Add a new state for progressive loading
  const [isLoading, setIsLoading] = useState(true)
  // Add this state to control lazy loading of the players table
  const [playersTableVisible, setPlayersTableVisible] = useState(false)
  const [shouldScrollTop, setShouldScrollTop] = useState(false)
  const [sortColumn, setSortColumn] = useState("win_percent")
  const [sortDirection, setSortDirection] = useState("desc")
  const [playerSortColumn, setPlayerSortColumn] = useState("pts")
  const [playerSortDirection, setPlayerSortDirection] = useState("desc")
  const [playerSearchQuery, setPlayerSearchQuery] = useState("")
  // Update the default selected team:
  const [selectedTeam, setSelectedTeam] = useState("Olympiacos")
  // Add this new state for the player stats view mode
  const [playerStatsMode, setPlayerStatsMode] = useState("pergame") // "pergame", "per100", "total"
  const [selectedStat, setSelectedStat] = useState<StatType>("points")
  const [viewMode, setViewMode] = useState<"total" | "per40">("total")
  const [trendCategory, setTrendCategory] = useState<
    "shotSelection" | "shootingPct" | "playmaking" | "rebounding" | "defense"
  >("shotSelection")
  const [playerNameSearch, setPlayerNameSearch] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  // Add state for player phase selection
  const [selectedPlayerPhase, setSelectedPlayerPhase] = useState("RS")

  // Add state for seasons and phases
  const [seasons, setSeasons] = useState<number[]>([2024, 2023]) // Default seasons
  const [phases, setPhases] = useState<string[]>(["RS"]) // Default phase
  const [selectedSeason, setSelectedSeason] = useState<number>(propSelectedSeason || 2024)
  const [selectedPhase, setSelectedPhase] = useState<string>("RS")
  const [teamStats, setTeamStats] = useState<EuroleagueTeamStats[]>([])
  const [teamAdvancedStats, setTeamAdvancedStats] = useState<EuroleagueTeamAdvanced | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<EuroleaguePlayerStats[]>([])

  // Add state to track the current league
  const [currentLeague, setCurrentLeague] = useState<string>(getLeagueFromId(propSelectedLeague))

  // Get the current team logo mapping based on selected season
  const currentTeamLogoMapping = useMemo(() => {
    return team_logo_mappings[selectedSeason] || team_logo_mappings[2024] // Default to 2024 if not found
  }, [selectedSeason])

  // Add debug effect to check data structure
  useEffect(() => {
    const debugData = async () => {
      if (selectedSeason) {
        const debugInfo = await fetchDebugPlayerData(selectedSeason)
        console.log("=== DEBUG INFO ===")
        console.log("Season:", selectedSeason)
        console.log("Debug data:", debugInfo)
      }
    }

    debugData()
  }, [selectedSeason])

  // Update currentLeague when propSelectedLeague changes
  useEffect(() => {
    const newLeague = getLeagueFromId(propSelectedLeague)
    console.log("=== LEAGUE CHANGE DETECTED ===")
    console.log("Previous league:", currentLeague)
    console.log("New league ID:", propSelectedLeague)
    console.log("New league:", newLeague)

    if (newLeague !== currentLeague) {
      setCurrentLeague(newLeague)
      // Clear existing data when league changes
      setTeamStats([])
      setTeamAdvancedStats(null)
      setTeamPlayers([])
      setSelectedTeam("") // Reset selected team
    }
  }, [propSelectedLeague, currentLeague])

  // Fetch seasons on component mount
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        console.log("Fetching seasons...")
        const seasonsData = await fetchSeasons()
        console.log("Seasons fetched:", seasonsData)

        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData)
          setSelectedSeason(seasonsData[0]) // Set the most recent season
        }
      } catch (error) {
        console.error("Error fetching seasons:", error)
      }
    }

    loadSeasons()
  }, [])

  // Fetch phases when selected season changes
  useEffect(() => {
    const loadPhases = async () => {
      if (selectedSeason) {
        try {
          console.log("Fetching phases for season:", selectedSeason)
          const phasesData = await fetchPhases(selectedSeason)
          console.log("Phases fetched:", phasesData)

          if (phasesData && phasesData.length > 0) {
            setPhases(phasesData)
            setSelectedPhase(phasesData[0])
          }
        } catch (error) {
          console.error("Error fetching phases:", error)
        }
      }
    }

    loadPhases()
  }, [selectedSeason])

  // Fetch team stats when season, phase, or league changes
  useEffect(() => {
    const loadTeamStats = async () => {
      if (selectedSeason && selectedPhase && currentLeague) {
        setIsLoading(true)
        try {
          console.log("=== FETCHING TEAM STATS ===")
          console.log("Season:", selectedSeason, "Phase:", selectedPhase, "League:", currentLeague)

          const stats = await fetchTeamStats(selectedSeason, selectedPhase, currentLeague)
          console.log("Team stats fetched:", stats.length, "teams for league:", currentLeague)
          setTeamStats(stats)

          // Auto-select the first team if no team is selected or if selected team doesn't exist
          if (stats.length > 0) {
            const teamExists = stats.some((team) => team.name === selectedTeam)
            if (!teamExists || !selectedTeam) {
              console.log("Auto-selecting first team:", stats[0].name)
              setSelectedTeam(stats[0].name)
            }
          }
        } catch (error) {
          console.error("Error fetching team stats:", error)
          setTeamStats([])
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadTeamStats()
  }, [selectedSeason, selectedPhase, currentLeague]) // Add currentLeague to dependencies

  // Add a delay before loading advanced stats to avoid rate limiting
  useEffect(() => {
    const loadTeamAdvancedStats = async () => {
      if (selectedTeam && selectedSeason && selectedPhase && teamStats.length > 0) {
        try {
          console.log("Fetching advanced stats for team:", selectedTeam)

          // Get teamcode from the current team stats
          const selectedTeamData = teamStats.find((team) => team.name === selectedTeam)
          const teamCode = selectedTeamData?.teamcode

          if (!teamCode) {
            console.error("No teamcode found for selected team:", selectedTeam)
            setTeamAdvancedStats(null)
            return
          }

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300))

          console.log("Using teamcode for advanced stats:", teamCode)
          const advancedStats = await fetchTeamAdvancedStatsByTeamCode(teamCode, selectedSeason, selectedPhase)
          console.log("Advanced stats fetched:", advancedStats ? "success" : "not found")
          setTeamAdvancedStats(advancedStats)
        } catch (error) {
          console.error("Error fetching team advanced stats:", error)
          setTeamAdvancedStats(null)
        }
      }
    }

    loadTeamAdvancedStats()
  }, [selectedTeam, selectedSeason, selectedPhase, teamStats])

  // Add a delay before loading team players to avoid rate limiting
  useEffect(() => {
    const loadTeamPlayers = async () => {
      // Wait for teamStats to be loaded before proceeding
      if (selectedTeam && selectedSeason && selectedPhase && teamStats.length > 0) {
        try {
          console.log("=== LOADING TEAM PLAYERS ===")
          console.log("Team:", selectedTeam, "Season:", selectedSeason, "Phase:", selectedPhase)

          // Get teamcode from the current team stats instead of hardcoded mapping
          const selectedTeamData = teamStats.find((team) => team.name === selectedTeam)
          const teamCode = selectedTeamData?.teamcode

          if (!teamCode) {
            console.error("No teamcode found for selected team:", selectedTeam)
            console.log(
              "Available teams in teamStats:",
              teamStats.map((t) => `${t.name} (${t.teamcode})`),
            )
            setTeamPlayers([])
            return
          }

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500))

          console.log("Using teamcode from database:", teamCode)

          // Call the updated function that can handle both team names and codes
          const players = await fetchTeamPlayersDirectly(teamCode, selectedSeason, selectedPhase)
          console.log("Players fetched:", players ? players.length : 0)
          if (players && players.length > 0) {
            console.log("Sample player data:", players[0])
            // Get unique phases from player data and set default to RS if available
            const playerPhases = [...new Set(players.map((p) => p.phase))].filter(Boolean)
            if (playerPhases.length > 0) {
              // Always prefer RS (Regular Season) first
              if (playerPhases.includes("RS")) {
                setSelectedPlayerPhase("RS")
              } else if (playerPhases.includes("Regular Season")) {
                setSelectedPlayerPhase("Regular Season") 
              } else {
                setSelectedPlayerPhase(playerPhases[0])
              }
            }
          }
          setTeamPlayers(players || [])
        } catch (error) {
          console.error("Error fetching team players:", error)
          setTeamPlayers([])
        }
      } else {
        // Clear players if conditions aren't met
        setTeamPlayers([])
      }
    }

    loadTeamPlayers()
  }, [selectedTeam, selectedSeason, selectedPhase, teamStats, selectedPlayerPhase]) // Keep teamStats in dependencies

  // Filter players by selected phase
  const filteredTeamPlayers = useMemo(() => {
    return teamPlayers.filter((player) => player.phase === selectedPlayerPhase)
  }, [teamPlayers, selectedPlayerPhase])

  // Get available player phases
  const availablePlayerPhases = useMemo(() => {
    return [...new Set(teamPlayers.map((p) => p.phase))].filter(Boolean)
  }, [teamPlayers])

  // Add this useEffect hook after all the useState declarations
  // Add this right before or after other useEffect hooks if they exist
  useEffect(() => {
    if (shouldScrollTop) {
      // Use setTimeout to ensure this runs after state updates and DOM changes
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "instant", // Use 'instant' instead of 'smooth' to ensure immediate scrolling
        })
        setShouldScrollTop(false)
      }, 0)
    }
  }, [shouldScrollTop])

  // Find the useEffect hook that should update the activeTab when initialTab changes
  // It's likely missing or not working correctly

  // Add this useEffect hook after the other useEffect declarations
  // This will ensure the component updates when the initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
      setShouldScrollTop(true)
    }
  }, [initialTab]) // Add initialTab to the dependency array

  // Update selectedSeason when the prop changes
  useEffect(() => {
    if (propSelectedSeason && propSelectedSeason !== selectedSeason) {
      setSelectedSeason(propSelectedSeason)
    }
  }, [propSelectedSeason, selectedSeason])

  // Update the handleTabChange function
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setShouldScrollTop(true)
  }

  // Add this useEffect to simulate progressive loading
  useEffect(() => {
    if (activeTab === "league" || activeTab === "teams") {
      setIsLoading(true)
      // Use a short timeout to allow the UI to show a loading state first
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  // Add this useEffect to delay loading the players table
  useEffect(() => {
    if (activeTab === "players") {
      // Delay loading the players table until after the tab animation completes
      const timer = setTimeout(() => {
        setPlayersTableVisible(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setPlayersTableVisible(false)
    }
  }, [activeTab])

  // Add this function to calculate stats based on the selected mode
  const calculatePlayerStats = (player, mode) => {
    if (mode === "avg") {
      return player // Current stats are already averages
    } else if (mode === "per40") {
      // Extract minutes as a number (format is "MM:SS")
      const minutesParts = player.min?.split(":") || ["0", "0"]
      const minutes = Number.parseFloat(minutesParts[0]) + Number.parseFloat(minutesParts[1]) / 60
      const factor = 40 / (minutes || 1)

      return {
        ...player,
        pts: +(player.pts * factor).toFixed(1),
        twopm: +(player.twopm * factor).toFixed(1),
        twopa: +(player.twopa * factor).toFixed(1),
        threepm: +(player.threepm * factor).toFixed(1),
        threepa: +(player.threepa * factor).toFixed(1),
        ftm: +(player.ftm * factor).toFixed(1),
        fta: +(player.fta * factor).toFixed(1),
        or: +(player.or * factor).toFixed(1),
        dr: +(player.dr * factor).toFixed(1),
        tr: +(player.tr * factor).toFixed(1),
        ast: +(player.ast * factor).toFixed(1),
        stl: +(player.stl * factor).toFixed(1),
        to: +(player.to * factor).toFixed(1),
        blk: +(player.blk * factor).toFixed(1),
        blka: +(player.blka * factor).toFixed(1),
        fc: +(player.fc * factor).toFixed(1),
        fd: +(player.fd * factor).toFixed(1),
        pir: +(player.pir * factor).toFixed(1),
      }
    } else if (mode === "total") {
      const minutesParts = player.min?.split(":") || ["0", "0"]
      const minutes = Number.parseFloat(minutesParts[0]) + Number.parseFloat(minutesParts[1]) / 60
      const factor = 40 / (minutes || 1)
      return {
        ...player,
        pts: +(player.pts * player.gp).toFixed(0),
        twopm: +(player.twopm * player.gp).toFixed(0),
        twopa: +(player.twopa * player.gp).toFixed(0),
        threepm: +(player.threepm * player.gp).toFixed(0),
        threepa: +(player.threepa * player.gp).toFixed(0),
        ftm: +(player.ftm * player.gp).toFixed(0),
        fta: +(player.fta * player.gp).toFixed(0),
        or: +(player.or * player.gp).toFixed(0),
        dr: +(player.dr * player.gp).toFixed(0),
        tr: +(player.tr * player.gp).toFixed(0),
        ast: +(player.ast * player.gp).toFixed(0),
        stl: +(player.stl * player.gp).toFixed(0),
        to: +(player.to * player.gp).toFixed(0),
        blk: +(player.blk * player.gp).toFixed(0),
        blka: +(player.blka * player.gp).toFixed(0),
        fc: +(player.fc * player.gp).toFixed(0),
        fd: +(player.fd * factor).toFixed(0),
        pir: +(player.pir * player.gp).toFixed(0),
      }
    }
    return player
  }

  // Calculate stat values based on the current mode
  const statValues = useMemo(() => {
    // Transform all players according to the current mode
    const transformedStats = playerStats.map((player) => calculatePlayerStats(player, playerStatsMode))

    return {
      pts: transformedStats.map((p) => p.pts),
      twopm: transformedStats.map((p) => p.twopm),
      twopa: transformedStats.map((p) => p.twopa),
      twop: transformedStats.map((p) => p.twop),
      threepm: transformedStats.map((p) => p.threepm),
      threepa: transformedStats.map((p) => p.threepa),
      threep: transformedStats.map((p) => p.threep),
      ftm: transformedStats.map((p) => p.ftm),
      fta: transformedStats.map((p) => p.fta),
      ft: transformedStats.map((p) => p.ft),
      or: transformedStats.map((p) => p.or),
      dr: transformedStats.map((p) => p.dr),
      tr: transformedStats.map((p) => p.tr),
      ast: transformedStats.map((p) => p.ast),
      stl: transformedStats.map((p) => p.stl),
      to: transformedStats.map((p) => p.to),
      blk: transformedStats.map((p) => p.blk),
      blka: transformedStats.map((p) => p.blka),
      fc: transformedStats.map((p) => p.fc),
      fd: transformedStats.map((p) => p.fd),
      pir: transformedStats.map((p) => p.pir),
    }
  }, [playerStatsMode, playerStats])

  // League standings data with added Win%, SOS, and SOSu
  // Pre-calculate positions based on win percentage
  const standingsWithPositions = []

  // Replace the direct calculation of sortedStandings with this memoized version
  const sortedStandings = useMemo(() => {
    if (!teamStats.length) return []

    return [...teamStats].sort((a, b) => {
      let aValue = a[sortColumn]
      let bValue = b[sortColumn]

      // Handle special cases for sorting
      if (
        sortColumn === "name" ||
        sortColumn === "teamcode" ||
        sortColumn === "home" ||
        sortColumn === "away" ||
        sortColumn === "l10" ||
        sortColumn === "streak"
      ) {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      // For numeric values
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    })
  }, [teamStats, sortColumn, sortDirection])

  // Replace the direct calculation with this memoized version
  const filteredPlayers = useMemo(() => {
    return []
  }, [playerStats, playerSearchQuery])

  // Function to filter players based on search input
  const filteredPlayerImages = useMemo(() => {
    return []
  }, [playerNameSearch])

  // Replace the direct calculation with this memoized version
  const sortedPlayers = useMemo(() => {
    return []
  }, [filteredPlayers, playerSortColumn, playerSortDirection, playerStatsMode])

  const selectedTeamData = useMemo(() => {
    return teamStats.find((team) => team.name === selectedTeam) || null
  }, [selectedTeam, teamStats])

  // Add this new function to get team logos from the mapping
  const getTeamLogo = (teamName) => {
    // First check if we have a direct logo URL from the database
    const teamData = teamStats.find((team) => team.name === teamName)
    if (teamData?.teamlogo) {
      return (
        <img
          src={teamData.teamlogo || "/placeholder.svg"}
          alt={`${teamName} logo`}
          className="w-6 h-6"
        />
      )
    }

    // Fallback to the mapping using teamcode
    const teamCode = teamData?.teamcode
    if (teamCode && currentTeamLogoMapping[teamCode]) {
      return (
        <img
          src={currentTeamLogoMapping[teamCode] || "/placeholder.svg"}
          alt={`${teamName} logo`}
          className="w-6 h-6"
        />
      )
    }

    // Fallback to the colored circle with initials if no logo is found
    const initials = teamName
      .split(" ")
      .map((word) => word[0])
      .join("")

    // Use teamcode for color if available
    const bgColor =
      teamCode && euroleague_team_colors[teamCode] ? `bg-[${euroleague_team_colors[teamCode]}]` : "bg-gray-600"

    return (
      <div
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${bgColor} text-white font-bold text-xs mr-2`}
      >
        {initials}
      </div>
    )
  }

  const getStreakColorClass = (streak: string) => {
    if (!streak) return ""

    if (streak.startsWith("W")) {
      return "text-emerald-600 font-semibold"
    } else if (streak.startsWith("L")) {
      return "text-red-600 font-semibold"
    }

    return ""
  }

  const handlePlayerSort = (column) => {
    if (playerSortColumn === column) {
      setPlayerSortDirection(playerSortDirection === "asc" ? "desc" : "asc")
    } else {
      setPlayerSortColumn(column)
      setPlayerSortDirection("desc")
    }
  }

  const renderPlayerSortIndicator = (column) => {
    if (playerSortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline-block text-gray-400" />
    }

    return playerSortDirection === "desc" ? (
      <ArrowDown className="h-4 w-4 ml-1 inline-block text-blue-600" />
    ) : (
      <ArrowUp className="h-4 w-4 ml-1 inline-block text-blue-600" />
    )
  }

  // Add this function before the return statement
  // Calculate ranks for each stat
  const calculateRanks = useMemo(() => {
    if (!teamStats.length) return {}

    const stats = [
      "efgperc_o",
      "efgperc_d",
      "toratio_o",
      "toratio_d",
      "orebperc_o",
      "orebperc_d",
      "ftrate_o",
      "ftrate_d",
      "efg",
      "to_percent",
      "oreb_percent",
      "ftrate",
      "efg_opp",
      "to_percent_opp",
      "oreb_percent_opp",
      "ftrate_opp",
    ]

    const ranks = {}

    stats.forEach((stat) => {
      // For turnover percentage, lower is better for offense, higher is better for defense
      const isAscending =
        stat === "to_percent" ||
        stat === "toratio_o" ||
        stat === "efgperc_d" ||
        stat === "efg_opp" ||
        stat === "orebperc_d" ||
        stat === "oreb_percent_opp" ||
        stat === "ftrate_d" ||
        stat === "ftrate_opp"

      // Sort teams by the stat
      const sorted = [...teamStats].sort((a, b) => {
        // Skip if the stat doesn't exist in the data
        if (a[stat] === undefined || b[stat] === undefined) return 0
        return isAscending ? a[stat] - b[stat] : b[stat] - a[stat]
      })

      // Assign ranks
      sorted.forEach((team, index) => {
        if (!ranks[team.name]) ranks[team.name] = {}
        ranks[team.name][stat] = index + 1
      })
    })

    return ranks
  }, [teamStats])

  const getValueBgClass = (rank, total = 18) => {
    if (!rank || rank <= 0) return "text-gray-500"

    // Calculate the percentile based on rank (1 is best, totalRanks is worst)
    const percentile = 1 - (rank - 1) / Math.max(1, total - 1)

    // Create a more distinct green-to-red color scale with clearer differentiation between ranks
    if (rank === 1) return "bg-green-600 text-gray-900 font-bold rounded px-2 py-0.5 w-full inline-block" // Best
    if (rank === 2) return "bg-green-500 text-gray-900 font-bold rounded px-2 py-0.5 w-full inline-block" // 2nd best
    if (rank === 3) return "bg-green-400 text-gray-900 font-medium rounded px-2 py-0.5 w-full inline-block" // 3rd best
    if (percentile >= 0.75) return "bg-green-300 text-gray-900 font-medium rounded px-2 py-0.5 w-full inline-block"
    if (percentile >= 0.5) return "bg-green-200 text-gray-900 rounded px-2 py-0.5 w-full inline-block"
    if (percentile >= 0.25) return "bg-red-200 text-gray-900 rounded px-2 py-0.5 w-full inline-block"
    if (rank === total - 2) return "bg-red-400 text-gray-900 font-medium rounded px-2 py-0.5 w-full inline-block" // 3rd worst
    if (rank === total - 1) return "bg-red-500 text-gray-900 font-bold rounded px-2 py-0.5 w-full inline-block" // 2nd worst
    if (rank === total) return "bg-red-600 text-gray-900 font-bold rounded px-2 py-0.5 w-full inline-block" // Worst

    return "bg-red-300 text-gray-900 rounded px-2 py-0.5 w-full inline-block"
  }

  // Add this right before the return statement
  console.log("YamagataTeamStats state:", {
    seasons,
    selectedSeason,
    phases,
    selectedPhase,
    isLoading,
    teamPlayers: teamPlayers.length,
    filteredTeamPlayers: filteredTeamPlayers.length,
    availablePlayerPhases,
    selectedPlayerPhase,
    currentLeague,
    propSelectedLeague,
    teamStatsCount: teamStats.length,
  })
  console.log("=== YAMAGATA TEAM STATS DEBUG ===", {
    currentLeague,
    propSelectedLeague,
    selectedSeason,
    selectedTeam,
  })

  return (
    <div className="w-full">
      {/* Only show navigation if hideNav is false */}
      

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
          setShouldScrollTop(true)
        }}
        className="w-full"
      >
        <TabsContent value="league" className="space-y-2">
          <LeagueStandingsTab
            isLoading={isLoading}
            teamStats={teamStats}
            seasons={seasons}
            phases={phases}
            selectedSeason={selectedSeason}
            setSelectedSeason={setSelectedSeason}
            selectedPhase={selectedPhase}
            setSelectedPhase={setSelectedPhase}
            getTeamLogo={getTeamLogo}
            setActiveTab={setActiveTab}
            setSelectedTeam={setSelectedTeam}
            setShouldScrollTop={setShouldScrollTop}
            league={currentLeague}
            teamNameToCode={teamNameToCode}
            team_logo_mapping={currentTeamLogoMapping}
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-2">
          <TeamDetailsTab
            isLoading={isLoading}
            teamStats={teamStats}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            teamNameToCode={teamNameToCode}
            team_logo_mapping={currentTeamLogoMapping}
            getTeamLogo={getTeamLogo}
            getTeamColorStyles={getTeamColorStyles}
            teamAdvancedStats={teamAdvancedStats}
            selectedTeamData={selectedTeamData}
            playerStats={playerStats}
            playerStatsMode={playerStatsMode}
            setPlayerStatsMode={setPlayerStatsMode}
            calculatePlayerStats={calculatePlayerStats}
            handlePlayerSort={handlePlayerSort}
            renderPlayerSortIndicator={renderPlayerSortIndicator}
            playerSortColumn={playerSortColumn}
            playerSortDirection={playerSortDirection}
            getValueBgClass={getValueBgClass}
            selectedSeason={selectedSeason}
            teamPlayers={filteredTeamPlayers}
            selectedPhase={selectedPlayerPhase}
            setSelectedPhase={setSelectedPlayerPhase}
            phases={availablePlayerPhases}
            seasons={seasons}
            setSelectedSeason={setSelectedSeason}
            league={currentLeague}
          />
        </TabsContent>
        <TabsContent value="statistics" className="space-y-2">
          <StatisticsTab
            playerSearch={playerSearchQuery}
            onPlayerSearchChange={setPlayerSearchQuery}
            season={selectedSeason}
            phase={selectedPhase}
            teamStats={teamStats}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Export the team logo mapping for 2024-2025 season
export const team_logo_mapping_2024_2025 = team_logo_mappings[2024] || {}

export default YamagataTeamStats
export { YamagataTeamStats }
