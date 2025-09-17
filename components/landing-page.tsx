"use client"

import { useState, useEffect, useRef, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { Trophy, Users, BarChart, Scale, ArrowRight, ChevronDown } from "lucide-react"
import { fetchTeamStats } from "@/app/actions/standings"
import { fetchAllPlayerStatsFromGameLogs } from "@/app/actions/player-stats"
import type { PlayerStatsFromGameLogs } from "@/lib/types"
import Image from "next/image"
import { Footer } from "./footer"
import { LeagueSpinner } from "./ui/league-spinner" 

interface LandingPageProps {
  onNavigate: (tab: string, selections?: any) => void
  selectedSeason: number
  selectedLeague: string
  onSeasonChange: (season: number) => void
  onLeagueChange: (league: string) => void
}

const seasons = [
  { id: 2024, display: "2024-25" },
  { id: 2023, display: "2023-24" },
  { id: 2022, display: "2022-23" },
  { id: 2021, display: "2021-22" },
  { id: 2020, display: "2020-21" },
  { id: 2019, display: "2019-20" },
  { id: 2018, display: "2018-19" },
  { id: 2017, display: "2017-18" },
  { id: 2016, display: "2016-17" },
  { id: 2015, display: "2015-16" },
  { id: 2014, display: "2014-15" },
  { id: 2013, display: "2013-14" },
  { id: 2012, display: "2012-13" },
]

const leagues = [
  { id: "international-euroleague", name: "Euroleague", color: "#FF6600" },
  { id: "international-eurocup", name: "EuroCup", color: "#0066CC" },
]

// Team logo mappings by season (from yamagata-team-stats.tsx)
const team_logo_mappings = {
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
    VBC: "https://media-cdn.incrowdsports.com/valencia-basket-logo.png",
  },
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
    VBC: "https://media-cdn.incrowdsports.com/valencia-basket-logo.png",
  },
}

// Euroleague team colors - Comprehensive scheme for all teams
const euroleague_team_colors = {
  // Your existing colors (unchanged)
  VIR: "#2f2f2f", // Virtus Segafredo Bologna - Darker black a
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
  ANR: "#1976d2", // MoraBanc Andorra - Blue (from "blue, yellow and red")
  TOR: "#8b1538", // Fiat Turin - Maroon (traditional Turin maroon color)
  VAR: "#d32f2f", // Cimberio Varese - Red (from "red and white" traditional colors)
    // Updated with verified authentic colors
  CAI: "#d32f2f", // CAI Zaragoza - Red (from "red and white")
  OOS: "#1976d2", // Telenet Ostend - Blue (originally "blue and yellow", currently "red and yellow" but traditionally blue)
  RDN: "#d32f2f", // Radnicki Kragujevac - Red (from "red and white" / "reddark and red")
  LUD: "#1a1a1a", // MHP RIESEN Ludwigsburg - Black (from "black and yellow")
  WUE: "#b03340", // s.Oliver Baskets Wurzburg - Darker blue (keeping original estimate as no specific info found)
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
  MBA: "#1e4a72", // Mornar Bar - Deep blue (team colors: blue and white)
  LOI: "#8b0000", // Bisons Loimaa - Dark red (team colors: black, white and red - using red as primary)
  ART: "#212121", // Artland Dragons Quakenbrueck - Deep black (team colors: black and white)
  NAN: "#8b0000", // SLUC Nancy - Dark red (team colors: red, gray and black - using red as primary)
  BIL: "#1a1a1a", // RETAbet Bilbao Basket - Dark red (team colors: black and red - using red as primary)
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
  FRA: "#1e4a72", // Fraport Skyliners Frankfurt - Darker blue
  default: "#6b7280"
};

// Team color styles function (from yamagata-team-stats.tsx)
const getTeamColorStyles = (teamName: string, teamCode?: string) => {
  const code = teamCode || ""
  const bgColor = euroleague_team_colors[code] || "#4b5563"
  return {
    backgroundColor: bgColor,
    textColorClass: "text-white" // Always use white text
  }
}

// Team background colors - Using comprehensive euroleague_team_colors
const teamColors = euroleague_team_colors;

// Helper function to get team border color
const getTeamBorderColor = (teamAbbr: string) => {
  const bgColor = euroleague_team_colors[teamAbbr] || euroleague_team_colors.default
  return bgColor || euroleague_team_colors.default
}

const mockPlayers = [
  { id: "1", name: "Kendrick Nunn", team: "PAN", teamName: "Panathinaikos" },
  { id: "2", name: "Mathias Lessort", team: "PAN", teamName: "Panathinaikos" },
  { id: "3", name: "Nikola Mirotic", team: "MIL", teamName: "EA7 Emporio Armani Milan" },
  { id: "4", name: "Facundo Campazzo", team: "MAD", teamName: "Real Madrid" },
  { id: "5", name: "Willy Hernangomez", team: "BAR", teamName: "FC Barcelona" },
]

// Team logo function (from yamagata-team-stats.tsx and team-details-tab.tsx)
const getTeamLogo = (teamName: string, teamData?: any, season?: number) => {
  // First check if we have a direct logo URL from the database
  if (teamData?.teamlogo) {
    return (
      <img
        src={teamData.teamlogo}
        alt={`${teamName} logo`}
        className="w-full h-full object-contain rounded"
      />
    )
  }
  
  // Then check the season-based logo mapping
  const seasonLogos = team_logo_mappings[season] || team_logo_mappings[2024]
  const logoUrl = seasonLogos?.[teamData?.teamcode]
  
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        className="w-full h-full object-contain rounded"
      />
    )
  }
  
  // Fallback to team code
  const bgColor = euroleague_team_colors[teamData?.teamcode] || euroleague_team_colors.default
  return (
    <div className="w-full h-full rounded text-white text-xs font-bold flex items-center justify-center" style={{backgroundColor: bgColor}}>
      {teamData?.teamcode || teamName.substring(0, 3).toUpperCase()}
    </div>
  )
}

export default function LandingPage({ 
  onNavigate, 
  selectedSeason, 
  selectedLeague, 
  onSeasonChange, 
  onLeagueChange 
}: LandingPageProps) {

  // Welcome screen state
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true)

  // Real team data state
  const [teamStats, setTeamStats] = useState<any[]>([])
  const [isTeamDataLoading, setIsTeamDataLoading] = useState(true)

  // Teams section state
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)

  // Players section state  
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState<string>("")
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStatsFromGameLogs | null>(null)
  const [allPlayers, setAllPlayers] = useState<PlayerStatsFromGameLogs[]>([])
  const [teamPlayers, setTeamPlayers] = useState<PlayerStatsFromGameLogs[]>([])
  const [isPlayerTeamDropdownOpen, setIsPlayerTeamDropdownOpen] = useState(false)
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false)
  const [isPlayerDataLoading, setIsPlayerDataLoading] = useState(false)

  // League section state (for League/Players dropdown)
  const [selectedTableMode, setSelectedTableMode] = useState<"league" | "player">("league")
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false)
  const [isLeadersDataLoading, setIsLeadersDataLoading] = useState(true)

  // Landing page league/year dropdown state
  const [isLandingLeagueDropdownOpen, setIsLandingLeagueDropdownOpen] = useState(false)
  const [isLandingYearDropdownOpen, setIsLandingYearDropdownOpen] = useState(false)

  // Welcome screen dropdown state
  const [isWelcomeLeagueDropdownOpen, setIsWelcomeLeagueDropdownOpen] = useState(false)
  const [isWelcomeYearDropdownOpen, setIsWelcomeYearDropdownOpen] = useState(false)

  // Button refs for positioning portaled dropdowns
  const teamButtonRef = useRef<HTMLButtonElement>(null)
  const playerTeamButtonRef = useRef<HTMLButtonElement>(null)
  const playerButtonRef = useRef<HTMLButtonElement>(null)
  const leagueButtonRef = useRef<HTMLButtonElement>(null)
  const comp1TeamButtonRef = useRef<HTMLButtonElement>(null)
  const comp1PlayerButtonRef = useRef<HTMLButtonElement>(null)
  const comp2TeamButtonRef = useRef<HTMLButtonElement>(null)
  const comp2PlayerButtonRef = useRef<HTMLButtonElement>(null)

  // Dropdown positions
  const [dropdownPositions, setDropdownPositions] = useState<{[key: string]: {top: number, left: number, width: number}}>({})

  // Keep track of which dropdown is currently open and its button ref
  const [activeDropdown, setActiveDropdown] = useState<{id: string, buttonRef: React.RefObject<HTMLButtonElement>} | null>(null)

  // Function to calculate dropdown position
  const calculateDropdownPosition = (buttonRef: React.RefObject<HTMLButtonElement>, dropdownId: string) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const dropdownHeight = 200 // Estimated dropdown height
      
      // Use scroll-aware positioning for both mobile and desktop
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      let top: number
      let left: number
      
      // Calculate position relative to document (accounting for scroll)
      top = rect.bottom + scrollTop + 4 // 4px margin below button
      left = rect.left + scrollLeft
      
      // If dropdown would go off bottom of viewport, position above
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top + scrollTop - dropdownHeight - 4
      }
      
      // If dropdown would go off right edge, adjust left
      const dropdownWidth = Math.max(rect.width, 200)
      if (left + dropdownWidth - scrollLeft > viewportWidth) {
        left = viewportWidth + scrollLeft - dropdownWidth - 10
      }
      
      // Ensure dropdown doesn't go off left edge
      if (left < scrollLeft + 10) {
        left = scrollLeft + 10
      }
      
      console.log(`Positioning ${dropdownId} dropdown:`, {
        buttonRect: rect,
        scrollTop,
        scrollLeft,
        calculatedTop: top,
        calculatedLeft: left,
        viewportHeight,
        viewportWidth
      })
      
      setDropdownPositions(prev => ({
        ...prev,
        [dropdownId]: {
          top,
          left,
          width: Math.max(rect.width, 200) // Minimum width of 200px
        }
      }))
      
      // Track the active dropdown
      setActiveDropdown({ id: dropdownId, buttonRef })
    }
  }

  // Effect to handle repositioning on scroll/resize
  useEffect(() => {
    const handlePositionUpdate = () => {
      if (activeDropdown) {
        calculateDropdownPosition(activeDropdown.buttonRef, activeDropdown.id)
      }
    }

    const handleScroll = () => {
      handlePositionUpdate()
    }

    const handleResize = () => {
      handlePositionUpdate()
    }

    if (activeDropdown) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', handleResize, { passive: true })
      
      return () => {
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [activeDropdown])

  // Portal dropdown component
  const PortalDropdown = ({ isOpen, dropdownId, children, className = "" }: { 
    isOpen: boolean
    dropdownId: string
    children: React.ReactNode
    className?: string
  }) => {
    if (!isOpen || typeof window === 'undefined') return null
    
    const position = dropdownPositions[dropdownId]
    if (!position) return null

    return createPortal(
      <div 
        className={`fixed bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto ${className}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          minWidth: `${position.width}px`,
          transform: 'translateZ(0)', // Force hardware acceleration for better positioning
          willChange: 'transform' // Optimize for frequent position changes
        }}
        onClick={(e) => e.stopPropagation()} // Prevent click events from bubbling
      >
        {children}
      </div>,
      document.body
    )
  }

  // State for dynamic container height extension
  const [categoryHeights, setCategoryHeights] = useState<{[key: string]: number}>({})
  
  // Scroll state for hiding/showing selectors
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [hasScrolledDown, setHasScrolledDown] = useState(false)
  
  // Scroll event listener to hide/show league and season selectors
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      
      // Clear any pending timeout
      clearTimeout(timeoutId)
      
      // Once user has scrolled down significantly, mark it
      if (currentScrollY > 150) {
        setHasScrolledDown(true)
      }
      
      // Hide selectors when scrolled down more than 100px
      if (currentScrollY > 100 && !isScrolled) {
        setIsScrolled(true)
      }
      
      // Only allow showing again if user scrolls to very top AND hasn't scrolled down much in this session
      // Add a delay to prevent immediate triggering during scroll bounce
      if (currentScrollY === 0 && isScrolled) {
        timeoutId = setTimeout(() => {
          if (window.scrollY === 0) { // Double check position after delay
            setIsScrolled(false)
            setHasScrolledDown(false) // Reset for next interaction
          }
        }, 200) // 200ms delay to avoid bounce triggers
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [isScrolled])
  
  // Function to set category height for dropdown visibility
  const setCategoryHeight = (categoryId: string, extraHeight: number) => {
    setCategoryHeights(prev => ({
      ...prev,
      [categoryId]: extraHeight
    }))
  }
  
  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsTeamDropdownOpen(false)
    setIsPlayerTeamDropdownOpen(false)
    setIsPlayerDropdownOpen(false)
    setIsCompPlayer1TeamDropdownOpen(false)
    setIsCompPlayer1PlayerDropdownOpen(false)
    setIsCompPlayer2TeamDropdownOpen(false)
    setIsCompPlayer2PlayerDropdownOpen(false)
    setIsLeagueDropdownOpen(false)
    setIsLandingLeagueDropdownOpen(false)
    setIsLandingYearDropdownOpen(false)
    setIsWelcomeLeagueDropdownOpen(false)
    setIsWelcomeYearDropdownOpen(false)
    // Reset all category heights when closing dropdowns
    setCategoryHeights({})
    // Reset dropdown positions
    setDropdownPositions({})
    // Clear active dropdown tracking
    setActiveDropdown(null)
  }

  // Comparison section state (matching comparison tab exactly)
  const [compSelectedTeams, setCompSelectedTeams] = useState<(string | null)[]>([null, null])
  const [compSelectedPlayerIds, setCompSelectedPlayerIds] = useState<(string | null)[]>([null, null])
  const [isCompPlayer1TeamDropdownOpen, setIsCompPlayer1TeamDropdownOpen] = useState(false)
  const [isCompPlayer1PlayerDropdownOpen, setIsCompPlayer1PlayerDropdownOpen] = useState(false)
  const [isCompPlayer2TeamDropdownOpen, setIsCompPlayer2TeamDropdownOpen] = useState(false)
  const [isCompPlayer2PlayerDropdownOpen, setIsCompPlayer2PlayerDropdownOpen] = useState(false)
  const [compTeamsList, setCompTeamsList] = useState<{ id: string; name: string }[]>([])
  const [compPlayersByTeam, setCompPlayersByTeam] = useState<{ [key: string]: PlayerStatsFromGameLogs[] }>({})
  
  // Track initialization state to prevent continuous random switching
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentLeagueKey, setCurrentLeagueKey] = useState("")
  const [isComparisonDataLoading, setIsComparisonDataLoading] = useState(true)

  // Reset all state when league changes
  useEffect(() => {
    const newLeagueKey = `${selectedLeague}_${selectedSeason}`
    if (currentLeagueKey !== newLeagueKey && currentLeagueKey !== "") {
      console.log(`League/Season changed from ${currentLeagueKey} to: ${newLeagueKey}, resetting all selections`)
      setSelectedTeam("")
      setSelectedPlayerTeam("")
      setSelectedPlayer(null)
      setTeamPlayers([])
      setAllPlayers([])
      setCompSelectedTeams([null, null])
      setCompSelectedPlayerIds([null, null])
      setCompTeamsList([])
      setCompPlayersByTeam({})
      setIsInitialized(false)
      setIsLeadersDataLoading(true)
      setIsComparisonDataLoading(true)
    }
    if (currentLeagueKey !== newLeagueKey) {
      setCurrentLeagueKey(newLeagueKey)
    }
  }, [selectedLeague, selectedSeason, currentLeagueKey])

  // Load real team data
  useEffect(() => {
    const loadTeamStats = async () => {
      if (selectedSeason && selectedLeague) {
        setIsTeamDataLoading(true)
        try {
          const currentLeague = selectedLeague.includes('euroleague') ? 'euroleague' : 'eurocup'
          const stats = await fetchTeamStats(selectedSeason, "RS", currentLeague)
          console.log("Loaded team stats for landing page:", stats.length, "teams")
          setTeamStats(stats)
          
          // Set random team for initial load or league change
          const teamNames = stats.map(team => team.name)
          
          // Always select a random team when team data loads (after league/season change)
          console.log(`Team loading for ${currentLeague}: ${teamNames.length} teams available`)
          if (teamNames.length > 0) {
            const randomIndex = Math.floor(Math.random() * teamNames.length)
            const randomTeam = teamNames[randomIndex]
            console.log(`Auto-selecting random team for ${currentLeague}: ${randomTeam}`)
            setSelectedTeam(randomTeam)
          }
          
          // Reset player selections when league changes - they'll be set in loadPlayerData
          if (selectedPlayerTeam && !teamNames.includes(selectedPlayerTeam)) {
            setSelectedPlayerTeam("")
            setSelectedPlayer(null)
          }
        } catch (error) {
          console.error("Error loading team stats for landing page:", error)
          setTeamStats([])
        } finally {
          setIsTeamDataLoading(false)
          setIsLeadersDataLoading(false)
        }
      }
    }

    loadTeamStats()
  }, [selectedSeason, selectedLeague])

  // Load player data (matching offense tab logic)
  useEffect(() => {
    const loadPlayerData = async () => {
      if (selectedSeason && selectedLeague) {
        setIsPlayerDataLoading(true)
        try {
          const currentLeague = selectedLeague.includes('euroleague') ? 'euroleague' : 'eurocup'
          console.log("Fetching RS players for landing page...")
          const rsPlayers = await fetchAllPlayerStatsFromGameLogs(selectedSeason, "Regular Season", currentLeague)
          console.log(`Loaded ${rsPlayers.length} RS players for landing page`)

          console.log("Fetching PO players for landing page...")
          const poPlayers = await fetchAllPlayerStatsFromGameLogs(selectedSeason, "Playoffs", currentLeague)
          console.log(`Loaded ${poPlayers.length} PO players for landing page`)

          // Combine all players
          const combinedPlayers = [...rsPlayers, ...poPlayers]
          setAllPlayers(combinedPlayers)

          // Always select random team and player from top 40 when player data loads (after league/season change)
          if (rsPlayers.length > 0) {
            // Get top 40 players by total points
            const top40Players = rsPlayers
              .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
              .slice(0, Math.min(40, rsPlayers.length))
            
            if (top40Players.length > 0) {
              // Select random player from top 40
              const randomIndex = Math.floor(Math.random() * top40Players.length)
              const randomPlayer = top40Players[randomIndex]
              
              console.log(`Auto-selecting random player from top 40 for ${currentLeague}: ${randomPlayer.player_name}`)
              setSelectedPlayer(randomPlayer)
              setSelectedPlayerTeam(randomPlayer.player_team_name)
              
              // Set team players for the selected team
              const teamPlayers = rsPlayers.filter(p => p.player_team_code === randomPlayer.player_team_code)
              setTeamPlayers(teamPlayers)
            }
          }

          // If we have a selected team, filter players for that team
          if (selectedPlayerTeam) {
            const currentTeam = teamStats.find(t => t.name === selectedPlayerTeam)
            if (currentTeam) {
              const filteredPlayers = combinedPlayers.filter(p => p.player_team_code === currentTeam.teamcode)
              setTeamPlayers(filteredPlayers)
              
              // Auto-select first player if none selected
              if (!selectedPlayer && filteredPlayers.length > 0) {
                setSelectedPlayer(filteredPlayers[0])
              }
            }
          }
        } catch (error) {
          console.error("Error loading player data for landing page:", error)
          setAllPlayers([])
        } finally {
          setIsPlayerDataLoading(false)
        }
      }
    }

    loadPlayerData()
  }, [selectedSeason, selectedLeague])

  // Update team players when selectedPlayerTeam changes (filtering only, no data reload)
  useEffect(() => {
    if (selectedPlayerTeam && allPlayers.length > 0) {
      const currentTeam = teamStats.find(t => t.name === selectedPlayerTeam)
      if (currentTeam) {
        const filteredPlayers = allPlayers.filter(p => p.player_team_code === currentTeam.teamcode)
        setTeamPlayers(filteredPlayers)
        
        // Reset player selection when team changes
        setSelectedPlayer(filteredPlayers.length > 0 ? filteredPlayers[0] : null)
      }
    } else {
      setTeamPlayers([])
      setSelectedPlayer(null)
    }
  }, [selectedPlayerTeam, allPlayers, teamStats])

  // Load comparison data (matching comparison tab logic)
  useEffect(() => {
    const loadComparisonData = async () => {
      if (selectedSeason && selectedLeague && allPlayers.length > 0) {
        try {
          // Create teams list from all players
          const uniqueTeams = [...new Set(allPlayers.map(p => p.player_team_name))].map(teamName => {
            const firstPlayerForTeam = allPlayers.find(p => p.player_team_name === teamName)
            return {
              id: firstPlayerForTeam?.player_team_code || teamName,
              name: teamName
            }
          }).filter(team => team.name)

          setCompTeamsList(uniqueTeams)

          // Organize players by team
          const playersByTeamData: { [key: string]: PlayerStatsFromGameLogs[] } = {}
          uniqueTeams.forEach(team => {
            playersByTeamData[team.id] = allPlayers.filter(p => p.player_team_code === team.id)
          })
          setCompPlayersByTeam(playersByTeamData)

          // Random comparison players selection from top 40 only when none selected
          if (allPlayers.length >= 2 && !compSelectedPlayerIds[0] && !compSelectedPlayerIds[1]) {
            // Get RS players only for default selection
            const rsPlayersOnly = allPlayers.filter(p => p.phase === "Regular Season")
            
            // Get top 40 players by total points
            const top40Players = rsPlayersOnly
              .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
              .slice(0, Math.min(40, rsPlayersOnly.length))
            
            if (top40Players.length >= 2) {
              // Select two different random players from top 40 only when none selected
              const randomIndex1 = Math.floor(Math.random() * top40Players.length)
              let randomIndex2 = Math.floor(Math.random() * top40Players.length)
              
              // Ensure the second player is different from the first
              while (randomIndex2 === randomIndex1 && top40Players.length > 1) {
                randomIndex2 = Math.floor(Math.random() * top40Players.length)
              }
              
              const player1 = top40Players[randomIndex1]
              const player2 = top40Players[randomIndex2]
              
              console.log(`Auto-selecting comparison players from top 40 for ${selectedLeague}: ${player1.player_name} and ${player2.player_name}`)
              
              // Set teams and players
              setCompSelectedTeams([player1.player_team_code, player2.player_team_code])
              setCompSelectedPlayerIds([player1.player_id, player2.player_id])
              setIsInitialized(true)
            }
          }

        } catch (error) {
          console.error("Error loading comparison data:", error)
        } finally {
          setIsComparisonDataLoading(false)
        }
      }
    }

    loadComparisonData()
  }, [allPlayers, selectedSeason, selectedLeague])

  // Scroll detection for hiding/showing selectors
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setIsScrolled(currentScrollY > 50) // Hide selectors after 50px vertical scroll
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Helper functions matching team-details-tab.tsx
  const availableTeams = teamStats.map(team => team.name)
  const getSelectedTeamData = (teamName: string) => teamStats.find(team => team.name === teamName)
  
  // Get unique teams for player section dropdown
  const availableTeamsForPlayers = [...new Set(allPlayers.map(p => {
    const teamName = teamStats.find(t => t.teamcode === p.player_team_code)?.name
    return teamName
  }).filter(Boolean))]
  
  // Team color helper for comparison (matching comparison tab)
  const getCompTeamColorStyles = (teamCode: string) => {
    return { backgroundColor: euroleague_team_colors[teamCode] || euroleague_team_colors.default }
  }

  // Get current league color for dropdown strips
  const getCurrentLeagueColor = () => {
    const currentLeague = leagues.find(league => league.id === selectedLeague)
    return currentLeague?.color || "#FF6600" // Default to EuroLeague orange
  }

  // Get team color for dropdown strips
  const getTeamColor = (teamName: string) => {
    if (!teamName) return "#6b7280" // Default gray if no team
    const teamData = getSelectedTeamData(teamName)
    if (teamData?.teamcode && euroleague_team_colors[teamData.teamcode]) {
      return euroleague_team_colors[teamData.teamcode]
    }
    return "#6b7280" // Default gray
  }

  // Comparison handlers (matching comparison tab)
  const handleCompTeamSelect = (playerIndex: number, teamId: string) => {
    const newSelectedTeams = [...compSelectedTeams]
    newSelectedTeams[playerIndex] = teamId
    setCompSelectedTeams(newSelectedTeams)
    
    // Auto-select first player from the newly selected team
    const newSelectedPlayerIds = [...compSelectedPlayerIds]
    const teamPlayers = compPlayersByTeam[teamId]
    if (teamPlayers && teamPlayers.length > 0) {
      newSelectedPlayerIds[playerIndex] = teamPlayers[0].player_id
    } else {
      newSelectedPlayerIds[playerIndex] = null
    }
    setCompSelectedPlayerIds(newSelectedPlayerIds)
  }

  const handleCompPlayerSelect = (playerIndex: number, playerId: string) => {
    const newSelectedPlayerIds = [...compSelectedPlayerIds]
    newSelectedPlayerIds[playerIndex] = playerId
    setCompSelectedPlayerIds(newSelectedPlayerIds)
  }


  const TeamDropdown = () => {
    if (isTeamDataLoading) {
      return (
        <select 
          disabled 
          className="w-full h-8 md:h-10 border border-gray-200 bg-gray-100 rounded-md px-2 md:px-3 text-gray-500 cursor-not-allowed text-sm"
        >
          <option>Loading teams...</option>
        </select>
      )
    }

    return (
      <div className="relative w-full h-full">
        {/* Simple looking button that mimics a select */}
        <button 
          ref={teamButtonRef}
          className=" text-sm shadow w-full h-8 border border-gray-300 bg-white rounded-md px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative"
          onClick={() => {
            closeAllDropdowns()
            if (!isTeamDropdownOpen) {
              setIsTeamDropdownOpen(true)
              calculateDropdownPosition(teamButtonRef, 'team')
            }
          }}
        >
          {/* Color strip */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
            style={{ backgroundColor: getTeamColor(selectedTeam) }}
          />
          <div className="flex items-center pl-2">
            {selectedTeam ? (
              <>
                <div className="w-6 h-6 mr-2 flex-shrink-0">
                  <div className="w-6 h-6  rounded flex items-center justify-center p-0.5">
                    {getTeamLogo(selectedTeam, getSelectedTeamData(selectedTeam), selectedSeason)}
                  </div>
                </div>
                <span className="truncate">{selectedTeam}</span>
              </>
            ) : (
              <span>Select Team</span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isTeamDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Portal dropdown menu with logos */}
        <PortalDropdown isOpen={isTeamDropdownOpen} dropdownId="team">
          {availableTeams.map((teamName) => {
            const teamData = getSelectedTeamData(teamName)
            const isSelected = teamName === selectedTeam

            return (
              <button
                key={teamName}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTeam(teamName)
                  setSelectedPlayerTeam(teamName)
                  setSelectedPlayer(null)
                  setIsTeamDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  isSelected ? "bg-gray-50 border-l-4 border-orange-500" : ""
                }`}
              >
                <div className="w-6 h-6 mr-2 flex-shrink-0">
                  <div className="w-6 h-6  rounded flex items-center justify-center p-0.5 ">
                    {getTeamLogo(teamName, teamData, selectedSeason)}
                  </div>
                </div>
                <span className="font-medium text-sm text-gray-900 truncate">{teamName}</span>
              </button>
            )
          })}
        </PortalDropdown>
      </div>
    )
  }

  const PlayerTeamSelector = () => {
    if (isPlayerDataLoading) {
      return (
        <div className="flex gap-2 w-full">
          <button disabled className="flex-1 h-8 md:h-10 border border-gray-200 bg-gray-100 rounded-md px-2 md:px-3 text-gray-500 cursor-not-allowed text-left text-sm">
            Loading...
          </button>
          <button disabled className="flex-1 h-8 md:h-10 border border-gray-200 bg-gray-100 rounded-md px-2 md:px-3 text-gray-500 cursor-not-allowed text-left text-sm">
            Loading...
          </button>
        </div>
      )
    }

    return (
      <div className="flex gap-2 w-full relative min-w-0">
        {/* Team Select Button */}
        <div className="flex-.3 relative min-w-0" style={{maxWidth: '120px'}}>
          <button 
            ref={playerTeamButtonRef}
            className="w-full h-8 md:h-10 border border-gray-200 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative text-sm"
            onClick={() => {
              closeAllDropdowns()
              if (!isPlayerTeamDropdownOpen) {
                setIsPlayerTeamDropdownOpen(true)
                calculateDropdownPosition(playerTeamButtonRef, 'playerTeam')
              }
            }}
          >
            {/* Color strip */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
              style={{ backgroundColor: getTeamColor(selectedPlayerTeam) }}
            />
            <div className="flex items-center pl-2">
              {selectedPlayerTeam ? (
                <div className="w-6 h-6 mr-2 flex-shrink-0">
                  <div className="w-6 h-6 rounded flex items-center justify-center p-0.5">
                    {getTeamLogo(selectedPlayerTeam, getSelectedTeamData(selectedPlayerTeam), selectedSeason)}
                  </div>
                </div>
              ) : (
                <span>Select Team</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isPlayerTeamDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Portal team dropdown menu with logos */}
          <PortalDropdown isOpen={isPlayerTeamDropdownOpen} dropdownId="playerTeam" className="min-w-64 max-w-96">
            {availableTeams.map((teamName) => {
              const teamData = getSelectedTeamData(teamName)
              const isSelected = selectedPlayerTeam === teamName

              return (
                <button
                  key={teamName}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPlayerTeam(teamName)
                    setSelectedPlayer(null)
                    setIsPlayerTeamDropdownOpen(false)
                    setIsPlayerDropdownOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                    isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                  }`}
                >
                  <div className="w-6 h-6 mr-2 flex-shrink-0">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                      {getTeamLogo(teamName, teamData, selectedSeason)}
                    </div>
                  </div>
                  <span className="font-medium text-sm text-gray-900 truncate">{teamName}</span>
                </button>
              )
            })}
          </PortalDropdown>
        </div>

        {/* Player Select Button */}
        <div className="flex-1 relative min-w-0 sm:max-w-[280px]">
          <button 
            ref={playerButtonRef}
            className="w-full h-8 md:h-10 border border-gray-200 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed relative text-sm"
            onClick={() => {
              closeAllDropdowns()
              if (!isPlayerDropdownOpen) {
                setIsPlayerDropdownOpen(true)
                calculateDropdownPosition(playerButtonRef, 'player')
              }
            }}
            disabled={!selectedPlayerTeam}
          >
            {/* Color strip */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
              style={{ backgroundColor: getTeamColor(selectedPlayerTeam) }}
            />
            <span className="truncate pl-2">{selectedPlayer?.player_name || (!selectedPlayerTeam ? "Select Team First" : "Select Player")}</span>
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isPlayerDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Portal player dropdown menu */}
          <PortalDropdown isOpen={isPlayerDropdownOpen} dropdownId="player">
            {teamPlayers.map((player, index) => {
              const isSelected = player.player_id === selectedPlayer?.player_id

              return (
                <button
                  key={`${player.player_id}-${player.player_name}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPlayer(player)
                    setIsPlayerDropdownOpen(false)
                    setIsPlayerTeamDropdownOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                    isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                  }`}
                >
                  <span className="font-medium text-sm text-gray-900 truncate">{player.player_name}</span>
                </button>
              )
            })}
          </PortalDropdown>
        </div>
      </div>
    )
  }

  // Comparison Player Selector Components (matching comparison tab exactly)
  const CompPlayerSelectorLeft = () => {
    const selectedTeamId = compSelectedTeams[0]
    const selectedPlayerId = compSelectedPlayerIds[0]
    const selectedTeam = selectedTeamId ? compTeamsList.find(t => t.id === selectedTeamId) : null
    const selectedPlayer = selectedTeamId && selectedPlayerId ? compPlayersByTeam[selectedTeamId]?.find(p => p.player_id === selectedPlayerId) : null
    const selectedTeamColor = selectedPlayer ? getCompTeamColorStyles(selectedPlayer.player_team_code).backgroundColor : "#6b7280"
    
    return (
      <div className="bg-black shadow-md rounded-l-xl border-r border-black relative team-dropdown-container w-full h-full">
        <div className="w-full h-full text-left">
          <div
            className="rounded-l-xl overflow-hidden shadow-xl w-full h-full hover:shadow-xl transition-shadow border-r-0 flex items-center"
            style={{
              border: '1px solid black',
              borderRight: 'none',
              backgroundColor: selectedTeamColor,
            }}
          >
            <div className="flex flex-row items-center p-2 w-full">
              {/* Team Logo Section - Clickable - Fixed width */}
              <button 
                ref={comp1TeamButtonRef}
                onClick={() => {
                  closeAllDropdowns()
                  if (!isCompPlayer1TeamDropdownOpen) {
                    setIsCompPlayer1TeamDropdownOpen(true)
                    calculateDropdownPosition(comp1TeamButtonRef, 'comp1Team')
                  }
                }}
                className="flex items-center flex-shrink-0 border-r border-gray-200 pr-1 cursor-pointer w-6"
              >
                <div className="flex-shrink-0 mr-0.5">
                  {selectedPlayer && selectedPlayer.teamlogo ? (
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
                <div className=" mr-0.5">
                  <ChevronDown
                    className={`h-3 w-3 text-white transition-transform ${isCompPlayer1TeamDropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              
              {/* Player Name Section - Clickable - Takes remaining space */}
              <button 
                onClick={() => {
                  closeAllDropdowns()
                  if (!isCompPlayer1PlayerDropdownOpen) {
                    setIsCompPlayer1PlayerDropdownOpen(true)
                    setCategoryHeight('comparison', 200)
                  }
                }}
                className="flex items-center flex-1 min-w-0 overflow-hidden pl-1 cursor-pointer"
              >
                {/* Player Name - Fixed container with proper truncation */}
                <div className="flex items-left flex-1 min-w-0 overflow-hidden">
                  <span
                    className="text-[10px] font-bold truncate block w-full text-left"
                    style={{
                      color: "white",
                      textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                    }}
                  >
                    {selectedPlayer?.player_name || "Select Player 1"}
                  </span>
                </div>
                
                {/* Player Dropdown arrow */}
                <div className="-ml-0.5 flex-shrink-0">
                  <ChevronDown
                    className={`h-3 w-3 text-white transition-transform ${isCompPlayer1PlayerDropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Team dropdown menu */}
        {isCompPlayer1TeamDropdownOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto">
            {compTeamsList.map((team) => {
              const isSelected = team.id === selectedTeamId
              
              return (
                <button
                  key={team.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCompTeamSelect(0, team.id)
                    // Auto-select first player from selected team
                    const firstPlayer = compPlayersByTeam[team.id]?.[0]
                    if (firstPlayer) {
                      handleCompPlayerSelect(0, firstPlayer.player_id)
                    }
                    setIsCompPlayer1TeamDropdownOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                    isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                  }`}
                >
                  <div className="w-6 h-6 mr-2 flex-shrink-0">
                    <div
                      className="w-6 h-6 bg-light-beige rounded-lg flex items-center justify-center p-0.5"
                      style={{
                        border: "1px solid black",
                        backgroundColor: "white",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    />
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
        {isCompPlayer1PlayerDropdownOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto">
            {selectedTeamId && compPlayersByTeam[selectedTeamId]?.map((player, index) => {
              const isSelected = player.player_id === selectedPlayerId
              
              return (
                <button
                  key={`comp1-${player.player_id}-${player.player_name}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCompPlayerSelect(0, player.player_id)
                    setIsCompPlayer1PlayerDropdownOpen(false)
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

  const CompPlayerSelectorRight = () => {
    const selectedTeamId = compSelectedTeams[1]
    const selectedPlayerId = compSelectedPlayerIds[1]
    const selectedTeam = selectedTeamId ? compTeamsList.find(t => t.id === selectedTeamId) : null
    const selectedPlayer = selectedTeamId && selectedPlayerId ? compPlayersByTeam[selectedTeamId]?.find(p => p.player_id === selectedPlayerId) : null
    const selectedTeamColor = selectedPlayer ? getCompTeamColorStyles(selectedPlayer.player_team_code).backgroundColor : "#6b7280"
    
    return (
      <div className="bg-black shadow-md rounded-r-xl relative team-dropdown-container w-full h-full">
        <div className="w-full h-full text-left">
          <div
            className="rounded-r-xl overflow-hidden shadow-xl w-full h-full hover:shadow-xl transition-shadow border-l-0 flex items-center"
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
                  closeAllDropdowns()
                  if (!isCompPlayer2TeamDropdownOpen) {
                    setIsCompPlayer2TeamDropdownOpen(true)
                    setCategoryHeight('comparison', 200)
                  }
                }}
                className="flex items-center flex-shrink-0 border-r border-gray-200 pr-1 cursor-pointer w-8"
              >
                <div className="flex-shrink-0 mr-0.5">
                  {selectedPlayer && selectedPlayer.teamlogo ? (
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
                <div className=" mr-0.5">
                  <ChevronDown
                    className={`h-3 w-3 text-white transition-transform ${isCompPlayer2TeamDropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              
              {/* Player Name Section - Clickable - Takes remaining space */}
              <button 
                onClick={() => {
                  closeAllDropdowns()
                  if (!isCompPlayer2PlayerDropdownOpen) {
                    setIsCompPlayer2PlayerDropdownOpen(true)
                    setCategoryHeight('comparison', 200)
                  }
                }}
                className="flex items-center flex-1 min-w-0 overflow-hidden pl-1 cursor-pointer"
              >
                {/* Player Name - Fixed container with proper truncation */}
                <div className="flex items-left flex-1 min-w-0 overflow-hidden">
                  <span
                    className="text-[10px] font-bold truncate block w-full text-left"
                    style={{
                      color: "white",
                      textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                    }}
                  >
                    {selectedPlayer?.player_name || "Select Player 2"}
                  </span>
                </div>
                
                {/* Player Dropdown arrow */}
                <div className="-ml-0.5 flex-shrink-0">
                  <ChevronDown
                    className={`h-3 w-3 text-white transition-transform ${isCompPlayer2PlayerDropdownOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Team dropdown menu */}
        {isCompPlayer2TeamDropdownOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto">
            {compTeamsList.map((team) => {
              const isSelected = team.id === selectedTeamId
              
              return (
                <button
                  key={team.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCompTeamSelect(1, team.id)
                    // Auto-select first player from selected team
                    const firstPlayer = compPlayersByTeam[team.id]?.[0]
                    if (firstPlayer) {
                      handleCompPlayerSelect(1, firstPlayer.player_id)
                    }
                    setIsCompPlayer2TeamDropdownOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                    isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                  }`}
                >
                  <div className="w-6 h-6 mr-2 flex-shrink-0">
                    <div
                      className="w-6 h-6 bg-light-beige rounded-lg flex items-center justify-center p-0.5"
                      style={{
                        border: "1px solid black",
                        backgroundColor: "white",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    />
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
        {isCompPlayer2PlayerDropdownOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto">
            {selectedTeamId && compPlayersByTeam[selectedTeamId]?.map((player, index) => {
              const isSelected = player.player_id === selectedPlayerId
              
              return (
                <button
                  key={`comp2-${player.player_id}-${player.player_name}-${index}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCompPlayerSelect(1, player.player_id)
                    setIsCompPlayer2PlayerDropdownOpen(false)
                    // Navigation handled by Go button now
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

  const ComparisonSelector = () => {
    const selectedPlayer1 = compSelectedPlayerIds[0] && compSelectedTeams[0] 
      ? compPlayersByTeam[compSelectedTeams[0]]?.find(p => p.player_id === compSelectedPlayerIds[0])
      : null
    
    const selectedPlayer2 = compSelectedPlayerIds[1] && compSelectedTeams[1]
      ? compPlayersByTeam[compSelectedTeams[1]]?.find(p => p.player_id === compSelectedPlayerIds[1])
      : null

    return (
      <div className="flex flex-col gap-1 w-full relative">
        {/* Player 1 Team + Player Selection */}
        <div className="flex gap-2 w-full relative min-w-0">
          {/* Player 1 Team Button */}
          <div className="flex-.3 relative min-w-0" style={{maxWidth: '120px'}}>
            <button 
              className="w-full h-8 md:h-10 border border-gray-200 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative text-sm"
              onClick={() => {
                closeAllDropdowns()
                if (!isCompPlayer1TeamDropdownOpen) {
                  setIsCompPlayer1TeamDropdownOpen(true)
                  setCategoryHeight('comparison', 200)
                }
              }}
            >
              {/* Color strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                style={{ backgroundColor: getTeamColor(selectedPlayer1?.player_team_name) }}
              />
              <div className="flex items-center pl-2">
                {selectedPlayer1 ? (
                  <div className="w-6 h-6 mr-2 flex-shrink-0">
                    <div className="w-6 h-6 rounded flex items-center justify-center p-0.5">
                      {getTeamLogo(selectedPlayer1.player_team_name, getSelectedTeamData(selectedPlayer1.player_team_name), selectedSeason)}
                    </div>
                  </div>
                ) : (
                  <span>Select Team</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCompPlayer1TeamDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Player 1 Team dropdown menu */}
            {isCompPlayer1TeamDropdownOpen && (
              <div className="absolute top-full left-0 border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1 bg-white" style={{minWidth: '256px', width: 'max-content', maxWidth: '400px'}}>
                {compTeamsList.map((team) => {
                  const isSelected = compSelectedTeams[0] === team.id
                  const teamName = team.name
                  const teamData = getSelectedTeamData(teamName)

                  return (
                    <button
                      key={team.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompTeamSelect(0, team.id)
                        setIsCompPlayer1TeamDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                        isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                      }`}
                    >
                      <div className="w-6 h-6 mr-2 flex-shrink-0">
                        <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                          {getTeamLogo(teamName, teamData, selectedSeason)}
                        </div>
                      </div>
                      <span className="font-medium text-sm text-gray-900 truncate">{teamName}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Player 1 Player Button */}
          <div className="flex-1 relative min-w-0 sm:max-w-[280px]">
            <button 
              className="w-full h-8 md:h-10 border border-gray-200 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed relative text-sm"
              onClick={() => {
                closeAllDropdowns()
                if (!isCompPlayer1PlayerDropdownOpen) {
                  setIsCompPlayer1PlayerDropdownOpen(true)
                  setCategoryHeight('comparison', 200)
                }
              }}
              disabled={!compSelectedTeams[0]}
            >
              {/* Color strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                style={{ backgroundColor: getTeamColor(selectedPlayer1?.player_team_name) }}
              />
              <span className="truncate pl-2">{selectedPlayer1?.player_name || (!compSelectedTeams[0] ? "Select Team First" : "Select Player 1")}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCompPlayer1PlayerDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Player 1 Player dropdown menu */}
            {isCompPlayer1PlayerDropdownOpen && compSelectedTeams[0] && (
              <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1 min-w-[300px]">
                {(compPlayersByTeam[compSelectedTeams[0]] || []).map((player, index) => {
                  const isSelected = player.player_id === selectedPlayer1?.player_id

                  return (
                    <button
                      key={`newcomp1-${player.player_id}-${player.player_name}-${index}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompPlayerSelect(0, player.player_id)
                        setIsCompPlayer1PlayerDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                        isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                      }`}
                    >
                      <span className="font-medium text-sm text-gray-900 truncate">{player.player_name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Player 2 Team + Player Selection */}
        <div className="flex gap-2 w-full relative min-w-0">
          {/* Player 2 Team Button */}
          <div className="flex-.3 relative min-w-0" style={{maxWidth: '120px'}}>
            <button 
              className="w-full h-8 md:h-10 border border-gray-200 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative text-sm"
              onClick={() => {
                closeAllDropdowns()
                if (!isCompPlayer2TeamDropdownOpen) {
                  setIsCompPlayer2TeamDropdownOpen(true)
                  setCategoryHeight('comparison', 200)
                }
              }}
            >
              {/* Color strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                style={{ backgroundColor: getTeamColor(selectedPlayer2?.player_team_name) }}
              />
              <div className="flex items-center pl-2">
                {selectedPlayer2 ? (
                  <div className="w-6 h-6 mr-2 flex-shrink-0">
                    <div className="w-6 h-6 rounded flex items-center justify-center p-0.5">
                      {getTeamLogo(selectedPlayer2.player_team_name, getSelectedTeamData(selectedPlayer2.player_team_name), selectedSeason)}
                    </div>
                  </div>
                ) : (
                  <span>Select Team</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCompPlayer2TeamDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Player 2 Team dropdown menu */}
            {isCompPlayer2TeamDropdownOpen && (
              <div className="absolute top-full left-0 border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1 bg-white" style={{minWidth: '256px', width: 'max-content', maxWidth: '400px'}}>
                {compTeamsList.map((team) => {
                  const isSelected = compSelectedTeams[1] === team.id
                  const teamName = team.name
                  const teamData = getSelectedTeamData(teamName)

                  return (
                    <button
                      key={team.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompTeamSelect(1, team.id)
                        setIsCompPlayer2TeamDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                        isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                      }`}
                    >
                      <div className="w-6 h-6 mr-2 flex-shrink-0">
                        <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                          {getTeamLogo(teamName, teamData, selectedSeason)}
                        </div>
                      </div>
                      <span className="font-medium text-sm text-gray-900 truncate">{teamName}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Player 2 Player Button */}
          <div className="flex-1 relative min-w-0 sm:max-w-[280px]">
            <button 
              className="w-full h-8 md:h-10 border border-gray-200 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed relative text-sm"
              onClick={() => {
                closeAllDropdowns()
                if (!isCompPlayer2PlayerDropdownOpen) {
                  setIsCompPlayer2PlayerDropdownOpen(true)
                  setCategoryHeight('comparison', 200)
                }
              }}
              disabled={!compSelectedTeams[1]}
            >
              {/* Color strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                style={{ backgroundColor: getTeamColor(selectedPlayer2?.player_team_name) }}
              />
              <span className="truncate pl-2">{selectedPlayer2?.player_name || (!compSelectedTeams[1] ? "Select Team First" : "Select Player 2")}</span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCompPlayer2PlayerDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Player 2 Player dropdown menu */}
            {isCompPlayer2PlayerDropdownOpen && compSelectedTeams[1] && (
              <div className="absolute top-full left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1 min-w-[300px]">
                {(compPlayersByTeam[compSelectedTeams[1]] || []).map((player, index) => {
                  const isSelected = player.player_id === selectedPlayer2?.player_id

                  return (
                    <button
                      key={`newcomp2-${player.player_id}-${player.player_name}-${index}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCompPlayerSelect(1, player.player_id)
                        setIsCompPlayer2PlayerDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                        isSelected ? "bg-gray-50 border-l-4 border-gray-500" : ""
                      }`}
                    >
                      <span className="font-medium text-sm text-gray-900 truncate">{player.player_name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const categories = [
    {
      id: "teams",
      title: "Teams",
      icon: BarChart,
      description: "Reports, Schedule/Results, Rosters",
      color: "#3E5C76",
      content: (
        <div className="w-full h-8 md:h-10 flex items-center">
          {isTeamDataLoading ? (
            <div className="w-full flex justify-center items-center">
              <LeagueSpinner 
                league={selectedLeague as "euroleague" | "eurocup"} 
                size="sm" 
                message="Loading teams..."
              />
            </div>
          ) : (
            <TeamDropdown />
          )}
        </div>
      ),
      goButton: {
        onClick: () => onNavigate("teams", { team: selectedTeam }),
        disabled: !selectedTeam
      }
    },
    {
      id: "players", 
      title: "Players",
      icon: Users,
      description: "Profiles, Shot Charts, Game Logs",
      color: "#3E5C76",
      content: (
        <div className="w-full h-8 md:h-10 flex items-center">
          {isPlayerDataLoading || isTeamDataLoading ? (
            <div className="w-full flex justify-center items-center">
              <LeagueSpinner 
                league={selectedLeague as "euroleague" | "eurocup"} 
                size="sm" 
                message="Loading players..."
              />
            </div>
          ) : (
            <PlayerTeamSelector />
          )}
        </div>
      ),
      goButton: {
        onClick: () => onNavigate("statistics", { team: selectedPlayerTeam, player: selectedPlayer }),
        disabled: !selectedPlayer
      }
    },
    {
      id: "league",
      title: "Leaders", 
      icon: Trophy,
      description: "League Standings, Player Statistics",
      color: "#bf5050",
      content: (
        <div className="w-full flex items-center gap-2 h-8 md:h-10">
          {isLeadersDataLoading ? (
            <div className="w-full flex justify-center items-center">
              <LeagueSpinner 
                league={selectedLeague as "euroleague" | "eurocup"} 
                size="sm" 
                message="Loading standings..."
              />
            </div>
          ) : (
            <>
          {/* League Standings Dropdown */}
          <div className="relative w-full h-full flex-1">
            <button 
              ref={leagueButtonRef}
              className="shadow w-full h-8 md:h-10 border border-gray-300 bg-white rounded-md px-2 md:px-3 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative text-sm"
              onClick={() => {
                closeAllDropdowns()
                if (!isLeagueDropdownOpen) {
                  setIsLeagueDropdownOpen(true)
                  calculateDropdownPosition(leagueButtonRef, 'league')
                }
              }}
            >
              {/* Color strip */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md"
                style={{ backgroundColor: getCurrentLeagueColor() }}
              />
              <span className="truncate pl-2">
                {selectedTableMode === "league" ? "League Standings" : "Player Statistics"}
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isLeagueDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Portal league dropdown menu */}
            <PortalDropdown isOpen={isLeagueDropdownOpen} dropdownId="league">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTableMode("league")
                  setIsLeagueDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  selectedTableMode === "league" ? "bg-gray-50 border-l-4 border-blue-500" : ""
                }`}
              >
                <span className="truncate text-sm">League Standings</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTableMode("player")
                  setIsLeagueDropdownOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                  selectedTableMode === "player" ? "bg-gray-50 border-l-4 border-blue-500" : ""
                }`}
              >
                <span className="truncate text-sm">Player Statistics</span>
              </button>
            </PortalDropdown>
          </div>
          
            </>
          )}
        </div>
      ),
      goButton: {
        onClick: () => onNavigate("standings", { mode: selectedTableMode }),
        disabled: false
      }
    },
    {
      id: "comparison",
      title: "Player Comparison", 
      icon: Scale,
      description: "Averages, Per-40",
      color: "#3E5C76",
      content: (
        <div className="w-full flex items-center" style={{height: "60px"}}>
          {isComparisonDataLoading ? (
            <div className="w-full flex justify-center items-center">
              <LeagueSpinner 
                league={selectedLeague as "euroleague" | "eurocup"} 
                size="sm" 
                message="Loading players..."
              />
            </div>
          ) : (
            <ComparisonSelector />
          )}
        </div>
      ),
      goButton: {
        onClick: () => onNavigate("comparison", { 
          players: [
            compSelectedPlayerIds[0] && compSelectedTeams[0] 
              ? compPlayersByTeam[compSelectedTeams[0]]?.find(p => p.player_id === compSelectedPlayerIds[0])
              : null,
            compSelectedPlayerIds[1] && compSelectedTeams[1]
              ? compPlayersByTeam[compSelectedTeams[1]]?.find(p => p.player_id === compSelectedPlayerIds[1])
              : null
          ].filter(Boolean)
        }),
        disabled: !compSelectedPlayerIds[0] || !compSelectedPlayerIds[1]
      }
    }
  ]

  // State for showing the 4-box menu after welcome
  const [showMenu, setShowMenu] = useState(false)
  
  // Refs for dropdown positioning
  const welcomeLeagueButtonRef = useRef<HTMLButtonElement>(null)
  const welcomeSeasonButtonRef = useRef<HTMLButtonElement>(null)
  const [leagueDropdownPos, setLeagueDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const [seasonDropdownPos, setSeasonDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  // Function to update dropdown positions
  const updateDropdownPositions = () => {
    if (welcomeLeagueButtonRef.current) {
      const rect = welcomeLeagueButtonRef.current.getBoundingClientRect()
      setLeagueDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
    if (welcomeSeasonButtonRef.current) {
      const rect = welcomeSeasonButtonRef.current.getBoundingClientRect()
      setSeasonDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  // Welcome screen handler - shows 4-box menu below welcome content
  const handleWelcomeGo = () => {
    // Show the menu after a brief delay without hiding the welcome screen
    setTimeout(() => setShowMenu(true), 100)
  }

  // Menu selection handler
  const handleMenuSelection = (menuType: string) => {
    setShowMenu(false)
    
    // Map menu selections to the appropriate tabs
    const tabMapping = {
      'teams': 'teams',
      'players': 'statistics', 
      'leaders': 'standings',
      'comparison': 'comparison'
    }
    
    const targetTab = tabMapping[menuType]
    if (targetTab) {
      // Navigate to the selected tab with current league/season selections
      onNavigate(targetTab, {
        league: selectedLeague,
        season: selectedSeason
      })
    }
  }

  // Show welcome screen first
  if (showWelcomeScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white fixed inset-0 z-[100] overflow-y-auto">
        {/* Initial Content - Slides up when menu shows */}
        <motion.div 
          className="flex items-center justify-center px-6"
          style={{ 
            minHeight: showMenu ? 'auto' : '100vh',
            paddingTop: showMenu ? '1rem' : '0',
            paddingBottom: showMenu ? '1rem' : '0'
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ 
            opacity: 1, 
            y: showMenu ? -30 : 0
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            className="max-w-lg w-full mx-auto"
            animate={{ 
              marginTop: showMenu ? '2rem' : '-5rem'
            }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative h-11 w-64 md:h-20 md:w-56 mt-8">
                <Image src="/stretch5-logo-original.png" alt="Stretch 5 Analytics" fill className="object-contain" />
              </div>
            </motion.div>

            {/* League and Season Selection */}
            <motion.div 
              className="space-y-5 relative"
              style={{ 
                zIndex: 999999999, 
                isolation: 'isolate',
                position: 'relative',
                transform: 'translateZ(0)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* League and Season Row */}
              <div className={`gap-3 md:gap-4 ${showMenu ? 'flex' : 'flex flex-col space-y-4'}`}>
                {/* League Dropdown */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className={`font-semibold text-gray-700 ml-1 tracking-wide transition-all duration-300 ${
                    showMenu ? 'text-xs' : 'text-sm'
                  }`}>Select League</label>
                  <div className="relative">
                    <button 
                      ref={welcomeLeagueButtonRef}
                      onClick={() => {
                        closeAllDropdowns()
                        if (!isWelcomeLeagueDropdownOpen) {
                          setIsWelcomeLeagueDropdownOpen(true)
                          setCategoryHeight('welcome', 200)
                        }
                      }}
                      className={`w-full border-2 border-gray-200 bg-white rounded-md text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative font-semibold transition-all duration-300 ${
                        showMenu 
                          ? 'h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm' 
                          : 'h-12 md:h-14 px-4 md:px-5 text-base md:text-lg'
                      }`}
                    >
                      <span className="truncate">{leagues.find(l => l.id === selectedLeague)?.name}</span>
                      <svg className={`text-gray-500 transition-all duration-300 ${isWelcomeLeagueDropdownOpen ? "rotate-180" : ""} ${
                        showMenu ? 'h-3 w-3' : 'h-5 w-5'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isWelcomeLeagueDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-1"
                        style={{ 
                          zIndex: 999999999
                        }}
                      >
                        {leagues.map((league) => (
                          <button
                            key={league.id}
                            onClick={() => {
                              onLeagueChange(league.id)
                              setIsWelcomeLeagueDropdownOpen(false)
                            }}
                            className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors text-base md:text-lg ${
                              selectedLeague === league.id ? "bg-gray-50 border-l-4 border-blue-500" : ""
                            }`}
                          >
                            <span className="truncate">{league.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Season Dropdown */}
                <div className="flex flex-col gap-2 flex-1">
                  <label className={`font-semibold text-gray-700 ml-1 tracking-wide transition-all duration-300 ${
                    showMenu ? 'text-xs' : 'text-sm'
                  }`}>Select Season</label>
                  <div className="relative">
                    <button 
                      ref={welcomeSeasonButtonRef}
                      onClick={() => {
                        closeAllDropdowns()
                        if (!isWelcomeYearDropdownOpen) {
                          updateDropdownPositions()
                          setIsWelcomeYearDropdownOpen(true)
                          setCategoryHeight('welcome', 200)
                        }
                      }}
                      className={`w-full border-2 border-gray-200 bg-white rounded-md text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative font-semibold transition-all duration-300 ${
                        showMenu 
                          ? 'h-8 md:h-10 px-2 md:px-3 text-xs md:text-sm' 
                          : 'h-12 md:h-14 px-4 md:px-5 text-base md:text-lg'
                      }`}
                    >
                      <span className="truncate">{seasons.find(s => s.id === selectedSeason)?.display}</span>
                      <svg className={`text-gray-500 transition-all duration-300 ${isWelcomeYearDropdownOpen ? "rotate-180" : ""} ${
                        showMenu ? 'h-3 w-3' : 'h-5 w-5'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isWelcomeYearDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto mt-1"
                        style={{ 
                          zIndex: 999999999
                        }}
                      >
                        {seasons.map((season) => (
                          <button
                            key={season.id}
                            onClick={() => {
                              onSeasonChange(season.id)
                              setIsWelcomeYearDropdownOpen(false)
                            }}
                            className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors text-base md:text-lg ${
                              selectedSeason === season.id ? "bg-gray-50 border-l-4 border-blue-500" : ""
                            }`}
                          >
                            <span className="truncate">{season.display}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Go Button - Hide when menu is shown */}
              {!showMenu && (
                <motion.button
                  onClick={handleWelcomeGo}
                  className="w-full h-12 md:h-14 bg-[#3E5C76] hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-sm hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{
                    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* 4-Box Menu - Appears below the welcome content */}
        {showMenu && (
          <motion.div 
            className="px-6 pb-8"
            style={{ zIndex: 1000 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="max-w-lg mx-auto">
              {/* 4-Box Grid */}
              <motion.div 
                className="grid grid-cols-1 gap-3 md:gap-4"
                style={{ zIndex: 100 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {/* Teams Box */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-black shadow-md rounded-xl relative"
                  style={{ zIndex: 10, contain: 'layout style', willChange: 'opacity' }}
                >
                  <button 
                    className="w-full text-left"
                    onClick={() => handleMenuSelection('teams')}
                  >
                    <div
                      className="rounded-xl overflow-hidden shadow-xl w-full cursor-pointer hover:shadow-xl transition-shadow"
                      style={{
                        border: `1px solid black`,
                        backgroundColor: '#3E5C76',
                      }}
                    >
                      <div className="flex items-center p-3 gap-3">
                        {/* Icon section */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                            <div
                              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2"
                              style={{
                                border: "1px solid black",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <Users className="w-6 h-6 text-black" />
                            </div>
                          </div>
                        </div>

                        {/* Title and description */}
                        <div className="flex-grow">
                          <h3
                            className="text-lg font-bold text-white mb-1"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Teams
                          </h3>
                          <p
                            className="text-sm text-white opacity-90"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Reports, Schedule/Results, Rosters
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>

                {/* Players Box */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="bg-black shadow-md rounded-xl relative"
                  style={{ zIndex: 10, contain: 'layout style', willChange: 'opacity' }}
                >
                  <button 
                    className="w-full text-left"
                    onClick={() => handleMenuSelection('players')}
                  >
                    <div
                      className="rounded-xl overflow-hidden shadow-xl w-full cursor-pointer hover:shadow-xl transition-shadow"
                      style={{
                        border: `1px solid black`,
                        backgroundColor: '#15803D',
                      }}
                    >
                      <div className="flex items-center p-3 gap-3">
                        {/* Icon section */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                            <div
                              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2"
                              style={{
                                border: "1px solid black",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <Trophy className="w-6 h-6 text-black" />
                            </div>
                          </div>
                        </div>

                        {/* Title and description */}
                        <div className="flex-grow">
                          <h3
                            className="text-lg font-bold text-white mb-1"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Players
                          </h3>
                          <p
                            className="text-sm text-white opacity-90"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Profiles, Shot Charts, Game Logs
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>

                {/* Leaders Box */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="bg-black shadow-md rounded-xl relative"
                  style={{ zIndex: 10, contain: 'layout style', willChange: 'opacity' }}
                >
                  <button 
                    className="w-full text-left"
                    onClick={() => handleMenuSelection('leaders')}
                  >
                    <div
                      className="rounded-xl overflow-hidden shadow-xl w-full cursor-pointer hover:shadow-xl transition-shadow"
                      style={{
                        border: `1px solid black`,
                        backgroundColor: '#CA8A04',
                      }}
                    >
                      <div className="flex items-center p-3 gap-3">
                        {/* Icon section */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                            <div
                              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2"
                              style={{
                                border: "1px solid black",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <BarChart className="w-6 h-6 text-black" />
                            </div>
                          </div>
                        </div>

                        {/* Title and description */}
                        <div className="flex-grow">
                          <h3
                            className="text-lg font-bold text-white mb-1"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Leaders
                          </h3>
                          <p
                            className="text-sm text-white opacity-90"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            League Standings, Player Statistics
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>

                {/* Comparison Box */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                  className="bg-black shadow-md rounded-xl relative"
                  style={{ zIndex: 10, contain: 'layout style', willChange: 'opacity' }}
                >
                  <button 
                    className="w-full text-left"
                    onClick={() => handleMenuSelection('comparison')}
                  >
                    <div
                      className="rounded-xl overflow-hidden shadow-xl w-full cursor-pointer hover:shadow-xl transition-shadow"
                      style={{
                        border: `1px solid black`,
                        backgroundColor: '#6D28D9',
                      }}
                    >
                      <div className="flex items-center p-3 gap-3">
                        {/* Icon section */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                            <div
                              className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2"
                              style={{
                                border: "1px solid black",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              <Scale className="w-6 h-6 text-black" />
                            </div>
                          </div>
                        </div>

                        {/* Title and description */}
                        <div className="flex-grow">
                          <h3
                            className="text-lg font-bold text-white mb-1"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Comparisons
                          </h3>
                          <p
                            className="text-sm text-white opacity-90"
                            style={{
                              textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                            }}
                          >
                            Player H2H: Averages, Per-40
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative z-[1000]">
      {/* Fixed Header - Stays on top during scroll */}
      <div className="backdrop-blur-md shadow-lg border-b border-gray-200/60 relative z-[1003] bg-white/80">
        <div className="max-w-6xl mx-auto px-3 pt-2 pb-1 md:pt-3 md:pb-2">
          <div className="flex justify-center">
            {/* Logo */}
            <div className="relative h-10 w-36 md:h-8 md:w-36">
              <Image src="/stretch5-logo-original.png" alt="Stretch 5 Analytics" fill className="object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Regular Scrollable Content */}
      <div className="relative">
        {/* Main Content */}
        <div className="mx-auto px-3 pt-2 pb-6 md:px-3 md:py-3 md:pb-40 bg-gradient-to-b from-gray-50/30 to-gray-100/20 overflow-visible">
        {/* League and Season Selection - Hidden when scrolled */}
        <motion.div 
          className="flex justify-center gap-2 mb-2 mt-1 md:gap-4 md:mb-3"
          initial={{ opacity: 1, height: 'auto' }}
          animate={{ 
            opacity: isScrolled ? 0 : 1,
            height: isScrolled ? 0 : 'auto',
            marginBottom: isScrolled ? 0 : undefined
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* League Dropdown */}
          <div className="flex flex-col gap-1 flex-1 max-w-[200px] relative">
            <label className="text-[11px] font-semibold text-gray-700 ml-1 tracking-wide">Select League</label>
            <div className="relative">
              <button 
                onClick={() => {
                  closeAllDropdowns()
                  if (!isLandingLeagueDropdownOpen) {
                    setIsLandingLeagueDropdownOpen(true)
                    setCategoryHeight('landing', 200)
                  }
                }}
                className="h-10 md:h-12 w-full border-2 border-gray-200 bg-white rounded-md px-3 md:px-4 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative text-sm"
              >
                <span className="truncate">{leagues.find(l => l.id === selectedLeague)?.name}</span>
                <svg className={`h-4 w-4 text-gray-500 transition-transform ${isLandingLeagueDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLandingLeagueDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1">
                  {leagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => {
                        onLeagueChange(league.id)
                        setIsLandingLeagueDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                        selectedLeague === league.id ? "bg-gray-50 border-l-4 border-blue-500" : ""
                      }`}
                    >
                      <span className="truncate">{league.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Season Dropdown */}
          <div className="flex flex-col gap-1 flex-1 max-w-[200px] relative">
            <label className="text-[11px] font-semibold text-gray-700 ml-1 tracking-wide">Select Year</label>
            <div className="relative">
              <button 
                onClick={() => {
                  closeAllDropdowns()
                  if (!isLandingYearDropdownOpen) {
                    setIsLandingYearDropdownOpen(true)
                    setCategoryHeight('landing', 200)
                  }
                }}
                className="h-10 md:h-12 w-full border-2 border-gray-200 bg-white rounded-md px-3 md:px-4 text-left text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none hover:bg-gray-50 flex items-center justify-between relative text-sm"
              >
                <span className="truncate">{seasons.find(s => s.id === selectedSeason)?.display}</span>
                <svg className={`h-4 w-4 text-gray-500 transition-transform ${isLandingYearDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isLandingYearDropdownOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-[9999] max-h-48 overflow-y-auto mt-1">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => {
                        onSeasonChange(season.id)
                        setIsLandingYearDropdownOpen(false)
                      }}
                      className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-200 transition-colors ${
                        selectedSeason === season.id ? "bg-gray-50 border-l-4 border-blue-500" : ""
                      }`}
                    >
                      <span className="truncate">{season.display}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile Divider */}
        <div className="block md:hidden w-full h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mb-3"></div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-5 md:gap-5 pb-4 px-2 mb-4 md:mb-0" data-scroll-container>
          {categories.map((category, index) => {
            const IconComponent = category.icon
            
            return (
              <motion.div
                key={category.id}
                className="bg-white rounded-2xl border-2 border-gray-300 relative backdrop-blur-sm w-full"
                style={{ 
                  overflow: 'visible',
                  paddingBottom: categoryHeights[category.id] ? `${categoryHeights[category.id]}px` : '0px',
                  transition: 'padding-bottom 0.2s ease-in-out'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  y: -2, 
                  scale: 1.02,
                  boxShadow: "0 12px 25px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)" 
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* Header Line: Icon + Title + Description + Go Button */}
                <div className="px-3 py-2 pb-2 md:px-4 md:py-3 md:pb-2.5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-3xl mb-2 md:mb-3 border-b border-gray-200/60">
                  <div className="flex items-center gap-3 md:gap-3">
                    <div 
                      className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl flex-shrink-0 border-2 "
                      style={{
                        backgroundColor: category.color,
                        borderColor: category.color,
                        background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
                        boxShadow: `0 3px 12px ${category.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                      }}
                    >
                      <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-orange-200" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-md md:text-lg font-bold text-gray-900">{category.title}</h3>
                      <p className="text-[11px] text-gray-600 font-semibold">{category.description}</p>
                    </div>
                    
                    {/* Go Button */}
                    {category.goButton && (
                      <button 
                        onClick={category.goButton.onClick}
                        disabled={category.goButton.disabled}
                        className="group relative px-2 h-9 md:px-5 md:h-10 text-orange-200 rounded-xl font-semibold text-xs transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-md border border-black"
                        style={{
                          background: category.goButton.disabled 
                            ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                            : `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
                          boxShadow: category.goButton.disabled 
                            ? '0 2px 6px rgba(0, 0, 0, 0.1)'
                            : `0 4px 15px ${category.color}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                          border: `1px solid ${category.goButton.disabled ? '#6B7280' : category.color}`
                        }}
                      >
                        <span className="relative z-10 flex items-center gap-1">
                          Go
                          <svg 
                            className="w-3 h-3 transition-transform group-hover:translate-x-0.5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Content Below */}
                <div className="px-2 pb-3 md:px-3 md:pb-3" style={{ overflow: 'visible' }}>
                  {category.content}
                </div>
              </motion.div>
            )
          })}
        </div>
        
        {/* Mobile spacer for dropdown visibility */}
        <div className="block md:hidden w-full bg-transparent landing-page-spacer" style={{ height: '100px', minHeight: '100px' }}>
          {/* This creates extra scrollable space on mobile for dropdown visibility */}
          
        </div>
        
        </div>
      </div>
      
    </div>
  )
}
